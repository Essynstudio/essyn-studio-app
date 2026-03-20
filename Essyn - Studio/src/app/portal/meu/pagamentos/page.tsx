import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalPagamentosClient } from "./pagamentos-client";

export default async function PortalPagamentosPage() {
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

  const { data: installments } = await supabase
    .from("installments")
    .select(
      "id, description, amount, due_date, status, payment_method, paid_at, paid_amount, category, projects(id, name)"
    )
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  return <PortalPagamentosClient installments={(installments || []) as never[]} />;
}
