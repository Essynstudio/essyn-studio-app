import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalHubClient } from "./portal-hub-client";

export default async function PortalMeuPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("portal_session")?.value;
  if (!sessionToken) redirect("/portal?error=session_expired");

  const supabase = createServiceSupabase();

  // Get session
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) redirect("/portal?error=session_expired");

  // Fetch everything for this client in parallel
  const [galleriesResult, projectsResult, contractsResult, installmentsResult, itemsResult] =
    await Promise.all([
      supabase
        .from("galleries")
        .select(
          "id, name, status, photo_count, cover_url, delivery_deadline_date, created_at, projects(id, name, event_type, event_date)"
        )
        .eq("client_id", session.client_id)
        .eq("studio_id", session.studio_id)
        .in("status", ["agendada", "prova", "final", "entregue"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id, name, event_type, event_date, status, production_phase, value, paid")
        .eq("client_id", session.client_id)
        .eq("studio_id", session.studio_id)
        .is("deleted_at", null)
        .order("event_date", { ascending: false }),
      supabase
        .from("contracts")
        .select("id, title, status, file_url, signed_at, created_at, projects(id, name)")
        .eq("client_id", session.client_id)
        .eq("studio_id", session.studio_id)
        .in("status", ["rascunho", "enviado", "assinado"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("installments")
        .select(
          "id, description, amount, due_date, status, payment_method, paid_at, paid_amount, projects(id, name)"
        )
        .eq("client_id", session.client_id)
        .eq("studio_id", session.studio_id)
        .is("deleted_at", null)
        .order("due_date", { ascending: true }),
      supabase
        .from("project_items")
        .select("id, name, category, quantity, unit_price, status")
        .eq("client_id", session.client_id)
        .eq("studio_id", session.studio_id)
        .order("created_at", { ascending: true }),
    ]);

  return (
    <PortalHubClient
      galleries={(galleriesResult.data || []) as never[]}
      projects={(projectsResult.data || []) as never[]}
      contracts={(contractsResult.data || []) as never[]}
      installments={(installmentsResult.data || []) as never[]}
      items={(itemsResult.data || []) as never[]}
      clientId={session.client_id}
      studioId={session.studio_id}
    />
  );
}
