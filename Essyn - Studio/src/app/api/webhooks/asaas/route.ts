import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Asaas webhook access token (set in Asaas dashboard → Webhooks)
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "";

// ── Supabase service client (bypass RLS) ─────────────────────
async function supabaseService(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...options.headers,
    },
  });
  return res;
}

// ── POST: Receive Asaas webhook ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Validate webhook token if configured
    if (WEBHOOK_TOKEN) {
      const token = req.headers.get("asaas-access-token");
      if (token !== WEBHOOK_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json();
    const event = payload.event as string;
    const payment = payload.payment as {
      id: string;
      status: string;
      value: number;
      netValue: number;
      paymentDate?: string;
      billingType: string;
      externalReference?: string;
    } | undefined;

    // Log webhook
    await supabaseService("webhook_logs", {
      method: "POST",
      body: JSON.stringify({
        provider: "asaas",
        event_type: event,
        payload,
        processed: false,
      }),
    });

    if (!payment?.id) {
      return NextResponse.json({ received: true, processed: false });
    }

    // Map Asaas event → installment status
    let newStatus: string | null = null;
    let paidAt: string | null = null;
    let paidAmount: number | null = null;

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        newStatus = "pago";
        paidAt = payment.paymentDate || new Date().toISOString().split("T")[0];
        paidAmount = payment.value;
        break;

      case "PAYMENT_OVERDUE":
        newStatus = "vencido";
        break;

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
        newStatus = "cancelado";
        break;

      case "PAYMENT_UPDATED":
      case "PAYMENT_CREATED":
        // Just log, don't change status
        break;

      default:
        break;
    }

    if (newStatus) {
      // Find installment by asaas_payment_id
      const findRes = await fetch(
        `${SUPABASE_URL}/rest/v1/installments?asaas_payment_id=eq.${payment.id}&select=id,status`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        }
      );
      const installments = await findRes.json();

      if (Array.isArray(installments) && installments.length > 0) {
        const installment = installments[0];

        // Only update if status actually changed
        if (installment.status !== newStatus) {
          const updateBody: Record<string, unknown> = { status: newStatus };
          if (paidAt) updateBody.paid_at = paidAt;
          if (paidAmount !== null) updateBody.paid_amount = paidAmount;

          await supabaseService(`installments?id=eq.${installment.id}`, {
            method: "PATCH",
            body: JSON.stringify(updateBody),
          });
        }

        // Mark webhook as processed
        await supabaseService(
          `webhook_logs?provider=eq.asaas&event_type=eq.${event}&processed=eq.false`,
          {
            method: "PATCH",
            body: JSON.stringify({ processed: true }),
            headers: { Prefer: "return=minimal" },
          }
        );
      }
    }

    return NextResponse.json({ received: true, processed: !!newStatus });
  } catch (err) {
    console.error("[webhook/asaas]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
