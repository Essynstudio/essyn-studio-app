/**
 * Autentique Webhook
 * Receives document events: SIGNED, VIEWED, REJECTED, CANCELLED
 *
 * Configure in Autentique Dashboard:
 * URL: https://app.essyn.studio/api/webhooks/autentique
 * Events: document.signed, document.viewed, document.rejected
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { createNotification, getStudioOwnerId } from "@/lib/notifications";

export const runtime = "edge";

interface AutentiqueWebhookPayload {
  event: string; // "document.signed" | "document.viewed" | "document.rejected" | "document.cancelled"
  data: {
    document: {
      id: string;
      status: { name: string };
    };
    signer?: {
      email: string;
      name: string;
    };
  };
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-webhook-secret") || req.headers.get("authorization");
  const expectedSecret = process.env.AUTENTIQUE_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret && secret !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: AutentiqueWebhookPayload;
  try {
    payload = await req.json() as AutentiqueWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = payload;
  const documentId = data?.document?.id;

  if (!documentId) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Find contract by Autentique document ID
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("autentique_document_id", documentId)
    .single();

  if (!contract) {
    // Document not found — might be from another system, ignore gracefully
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();

  if (event === "document.signed" || event === "document.finished") {
    const { data: contractFull } = await supabase
      .from("contracts")
      .select("id, title, studio_id")
      .eq("id", contract.id)
      .single();

    await supabase
      .from("contracts")
      .update({
        status: "assinado",
        signed_at: now,
      })
      .eq("id", contract.id);

    // Notificar o fotografo
    if (contractFull) {
      const ownerId = await getStudioOwnerId(supabase, contractFull.studio_id);
      if (ownerId) {
        await createNotification({
          supabase,
          userId: ownerId,
          type: "contrato_assinado",
          title: "Contrato assinado!",
          description: contractFull.title,
          route: "/contratos",
        });
      }
    }

  } else if (event === "document.viewed") {
    // Only update if not already further along
    if (contract.status === "enviado") {
      await supabase
        .from("contracts")
        .update({
          status: "visualizado",
          viewed_at: now,
        })
        .eq("id", contract.id);
    }

  } else if (event === "document.rejected") {
    await supabase
      .from("contracts")
      .update({ status: "cancelado" })
      .eq("id", contract.id);

  } else if (event === "document.cancelled") {
    await supabase
      .from("contracts")
      .update({ status: "cancelado" })
      .eq("id", contract.id);
  }

  return NextResponse.json({ ok: true });
}
