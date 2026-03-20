import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

/**
 * POST /api/portal/contract-accept
 * Registers client acceptance of a contract (immutable log + status update).
 */
export async function POST(request: Request) {
  try {
    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: "contractId obrigatório" }, { status: 400 });
    }

    // 1. Validate portal session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("portal_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const supabase = createServiceSupabase();

    const { data: session } = await supabase
      .from("client_portal_sessions")
      .select("client_id, studio_id, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    // 2. Verify contract belongs to this client
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, status, client_id, studio_id")
      .eq("id", contractId)
      .eq("client_id", session.client_id)
      .eq("studio_id", session.studio_id)
      .is("deleted_at", null)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    // 3. Verify contract is in acceptable status
    if (!["enviado", "visualizado"].includes(contract.status)) {
      return NextResponse.json({ error: "Este contrato não pode ser aceito no status atual" }, { status: 400 });
    }

    // 4. Get IP and user-agent
    const headerStore = await headers();
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
    const userAgent = headerStore.get("user-agent") || "unknown";

    // 5. Get client email for the acceptance record
    const { data: client } = await supabase
      .from("clients")
      .select("email")
      .eq("id", session.client_id)
      .single();

    const acceptedEmail = client?.email || "unknown";
    const now = new Date().toISOString();

    // 6. Insert immutable acceptance log
    const { error: logError } = await supabase
      .from("contract_acceptances")
      .insert({
        contract_id: contractId,
        client_id: session.client_id,
        studio_id: session.studio_id,
        accepted_at: now,
        accepted_ip: ip,
        accepted_email: acceptedEmail,
        accepted_user_agent: userAgent,
      });

    if (logError) {
      console.error("contract_acceptances insert error:", logError);
      return NextResponse.json({ error: "Erro ao registrar aceite" }, { status: 500 });
    }

    // 7. Update contract status
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "aceito",
        accepted_at: now,
        accepted_ip: ip,
        accepted_email: acceptedEmail,
        accepted_user_agent: userAgent,
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("contract update error:", updateError);
      return NextResponse.json({ error: "Erro ao atualizar contrato" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, accepted_at: now });
  } catch (err) {
    console.error("contract-accept error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
