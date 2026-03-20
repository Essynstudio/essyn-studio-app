import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ContratoIndexPage() {
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

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .in("status", ["rascunho", "enviado", "visualizado", "aceito", "assinado"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (contracts && contracts.length > 0) {
    redirect(`/portal/meu/contrato/${contracts[0].id}`);
  }

  redirect("/portal/meu");
}
