import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { PortalContratoClient } from "./contrato-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalContratoPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("portal_session")?.value;
  if (!sessionToken) redirect("/portal?error=session_expired");

  const supabase = createServiceSupabase();

  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) redirect("/portal?error=session_expired");

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, title, status, file_url, signed_at, accepted_at, viewed_at, autentique_signing_url, created_at, projects(id, name, event_type)")
    .eq("id", id)
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .is("deleted_at", null)
    .single();

  if (!contract) return notFound();

  // Track first view: mark as 'visualizado' if currently 'enviado'
  if (contract.status === "enviado" && !contract.viewed_at) {
    const now = new Date().toISOString();
    await supabase
      .from("contracts")
      .update({ viewed_at: now, status: "visualizado" })
      .eq("id", id);
    contract.status = "visualizado";
    contract.viewed_at = now;
  }

  return <PortalContratoClient contract={contract as never} />;
}
