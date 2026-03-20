import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createCustomer,
  createPayment,
  findCustomerByReference,
  getPixQrCode,
  mapPaymentMethod,
  type AsaasConfig,
} from "@/lib/asaas";

// ── POST: Create Asaas charge from installment ───────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: studio } = await supabase
      .from("studios")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();
    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    const { installmentId } = await req.json();
    if (!installmentId) {
      return NextResponse.json({ error: "installmentId é obrigatório" }, { status: 400 });
    }

    // Get installment
    const { data: installment, error: instError } = await supabase
      .from("installments")
      .select("*, clients(id, name, email, phone, document, asaas_customer_id), projects(id, name)")
      .eq("id", installmentId)
      .eq("studio_id", studio.id)
      .single();

    if (instError || !installment) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });
    }

    if (installment.asaas_payment_id) {
      return NextResponse.json({
        error: "Essa parcela já possui uma cobrança no Asaas",
        existingPaymentId: installment.asaas_payment_id,
        billingUrl: installment.asaas_billing_url,
      }, { status: 409 });
    }

    // Get Asaas integration
    const { data: integration } = await supabase
      .from("integrations")
      .select("credentials, config, status")
      .eq("studio_id", studio.id)
      .eq("provider", "asaas")
      .single();

    if (!integration || integration.status !== "connected") {
      return NextResponse.json({ error: "Integração Asaas não configurada" }, { status: 400 });
    }

    const asaasConfig: AsaasConfig = {
      apiKey: (integration.credentials as { apiKey: string }).apiKey,
      sandbox: !!(integration.config as { sandbox?: boolean }).sandbox,
    };

    // Get or create Asaas customer
    const client = installment.clients as {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      document: string | null;
      asaas_customer_id: string | null;
    } | null;

    let asaasCustomerId: string;

    if (client?.asaas_customer_id) {
      asaasCustomerId = client.asaas_customer_id;
    } else if (client) {
      // Try to find by external reference first
      const existing = await findCustomerByReference(asaasConfig, client.id);
      if (existing) {
        asaasCustomerId = existing.id;
      } else {
        // Create new customer
        const newCustomer = await createCustomer(asaasConfig, {
          name: client.name,
          email: client.email,
          cpfCnpj: client.document,
          phone: client.phone,
          externalReference: client.id,
        });
        asaasCustomerId = newCustomer.id;
      }

      // Save Asaas customer ID back to client
      await supabase
        .from("clients")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", client.id);
    } else {
      return NextResponse.json({
        error: "Parcela sem cliente vinculado. Vincule um cliente para criar a cobrança.",
      }, { status: 400 });
    }

    // Create payment
    const billingType = mapPaymentMethod(installment.payment_method);
    const projectName = (installment.projects as { name: string } | null)?.name;
    const description = installment.description +
      (projectName ? ` — ${projectName}` : "") +
      ` (${studio.name})`;

    const payment = await createPayment(asaasConfig, {
      customer: asaasCustomerId,
      billingType,
      value: installment.amount,
      dueDate: installment.due_date,
      description,
      externalReference: installment.id,
    });

    // Get PIX QR code if billing type is PIX or UNDEFINED
    let pixData: { encodedImage: string; payload: string } | null = null;
    if (billingType === "PIX" || billingType === "UNDEFINED") {
      try {
        const qr = await getPixQrCode(asaasConfig, payment.id);
        pixData = { encodedImage: qr.encodedImage, payload: qr.payload };
      } catch {
        // PIX QR might not be available immediately for UNDEFINED
      }
    }

    // Save Asaas payment ID to installment
    await supabase
      .from("installments")
      .update({
        asaas_payment_id: payment.id,
        asaas_billing_url: payment.invoiceUrl,
        asaas_pix_qr: pixData?.encodedImage || null,
        asaas_pix_code: pixData?.payload || null,
      })
      .eq("id", installmentId);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        billingType: payment.billingType,
        status: payment.status,
        value: payment.value,
      },
      pix: pixData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar cobrança";
    console.error("[asaas/charge]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
