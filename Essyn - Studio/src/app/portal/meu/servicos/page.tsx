import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ServicosClient } from "./servicos-client";

export default async function ServicosPage() {
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

  const [itemsResult, projectResult] = await Promise.all([
    supabase
      .from("project_items")
      .select("id, name, description, category, quantity, unit_price, status, delivered_at, created_at")
      .eq("client_id", session.client_id)
      .eq("studio_id", session.studio_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name, value, paid")
      .eq("client_id", session.client_id)
      .eq("studio_id", session.studio_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return (
    <ServicosClient
      items={(itemsResult.data || []) as never[]}
      project={projectResult.data as never}
    />
  );
}
