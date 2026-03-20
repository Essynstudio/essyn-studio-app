import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RelatoriosClient } from "./relatorios-client";

export default async function RelatoriosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const sid = studio.id;

  // Fetch ALL data sources in parallel
  const [
    installmentsRes,
    projectsRes,
    leadsRes,
    galleriesRes,
    clientsRes,
    contractsRes,
    ordersRes,
    teamRes,
    workflowsRes,
    eventsRes,
    messagesRes,
    briefingsRes,
    itemsRes,
  ] = await Promise.all([
    supabase
      .from("installments")
      .select("id, type, amount, due_date, status, paid_at, paid_amount, payment_method, category, created_at, projects(id, name), clients(id, name)")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("due_date", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name, event_type, event_date, status, production_phase, value, paid, created_at")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, stage, event_type, estimated_value, source, created_at")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("galleries")
      .select("id, name, status, photo_count, views, downloads, created_at")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name, status, total_spent, created_at")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("id, title, status, value, created_at")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, status, total, created_at")
      .eq("studio_id", sid)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("id, name, role, active, hourly_rate")
      .eq("studio_id", sid)
      .order("name"),
    supabase
      .from("project_workflows")
      .select("id, name, status, deadline, assigned_to, projects(id, name, event_type)")
      .eq("studio_id", sid)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("events")
      .select("id, title, start_at, status")
      .eq("studio_id", sid)
      .is("deleted_at", null)
      .order("start_at", { ascending: false })
      .limit(200),
    supabase
      .from("portal_messages")
      .select("id, sender_type, created_at")
      .eq("studio_id", sid)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("portal_briefings")
      .select("id, status, completed_at, created_at")
      .eq("studio_id", sid),
    supabase
      .from("project_items")
      .select("id, name, category, status, quantity, unit_price")
      .eq("studio_id", sid),
  ]);

  return (
    <RelatoriosClient
      installments={(installmentsRes.data || []) as never[]}
      projects={(projectsRes.data || []) as never[]}
      leads={(leadsRes.data || []) as never[]}
      galleries={(galleriesRes.data || []) as never[]}
      clients={(clientsRes.data || []) as never[]}
      contracts={(contractsRes.data || []) as never[]}
      orders={(ordersRes.data || []) as never[]}
      team={(teamRes.data || []) as never[]}
      workflows={(workflowsRes.data || []) as never[]}
      events={(eventsRes.data || []) as never[]}
      messages={(messagesRes.data || []) as never[]}
      briefings={(briefingsRes.data || []) as never[]}
      items={(itemsRes.data || []) as never[]}
    />
  );
}
