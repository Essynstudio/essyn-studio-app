import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function GaleriaIndexPage() {
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

  const { data: galleries } = await supabase
    .from("galleries")
    .select("id")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .in("status", ["agendada", "prova", "final", "entregue"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (galleries && galleries.length > 0) {
    redirect(`/portal/meu/galeria/${galleries[0].id}`);
  }

  redirect("/portal/meu");
}
