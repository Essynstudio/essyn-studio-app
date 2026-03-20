import { createServerSupabase } from "@/lib/supabase/server";
import { IrisClient } from "./iris-client";
import { computeAlerts } from "@/lib/iris/alerts";
import { detectWorkload } from "@/lib/iris/workload";
import { computeRelationshipInsights } from "@/lib/iris/relationships";
import type { IrisAlert } from "@/lib/iris/alerts";
import { redirect } from "next/navigation";

export default async function IrisPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const todayStart = `${todayISO}T00:00:00`;
  const todayEnd = `${todayISO}T23:59:59`;

  const [
    projectsRes, todayEventsRes, overdueRes, pendingRes,
    leadsRes, galleriesRes, contractsRes, upcomingEventsRes,
    alerts, teamRes, clientsRes, packsRes,
    // Wizard data
    wizClientRes, wizPackRes, wizTemplateRes, wizProductRes, wizTeamRes,
  ] = await Promise.all([
    supabase.from("projects").select("id, name, status, event_type, event_date, production_phase, value").eq("studio_id", studio.id).is("deleted_at", null).neq("status", "cancelado").order("created_at", { ascending: false }).limit(100),
    supabase.from("events").select("id, title, start_at, location").eq("studio_id", studio.id).is("deleted_at", null).gte("start_at", todayStart).lte("start_at", todayEnd).order("start_at", { ascending: true }).limit(5),
    supabase.from("installments").select("id, amount, description").eq("studio_id", studio.id).is("deleted_at", null).in("status", ["pendente", "vencido"]).lt("due_date", todayISO).limit(10),
    supabase.from("installments").select("id, amount, status").eq("studio_id", studio.id).is("deleted_at", null).in("status", ["pendente", "pago"]).limit(50),
    supabase.from("leads").select("id, stage, event_type, estimated_value, name").eq("studio_id", studio.id).is("deleted_at", null).limit(100),
    supabase.from("galleries").select("id, status, photo_count").eq("studio_id", studio.id).is("deleted_at", null).limit(20),
    supabase.from("contracts").select("id, status").eq("studio_id", studio.id).is("deleted_at", null).limit(20),
    supabase.from("events").select("id, title, start_at").eq("studio_id", studio.id).is("deleted_at", null).gte("start_at", new Date().toISOString()).order("start_at", { ascending: true }).limit(3),
    computeAlerts(supabase, studio.id),
    supabase.from("team_members").select("id").eq("studio_id", studio.id).eq("active", true),
    supabase.from("clients").select("id").eq("studio_id", studio.id).is("deleted_at", null),
    supabase.from("packs").select("id").eq("studio_id", studio.id),
    // Wizard-specific queries (full data for NewProjectWizard)
    supabase.from("clients").select("id, name, email, phone").eq("studio_id", studio.id).is("deleted_at", null).order("name"),
    supabase.from("packs").select("id, name, price, items, event_type, delivery_days").eq("studio_id", studio.id),
    supabase.from("workflow_templates").select("id, name, steps, event_type").eq("studio_id", studio.id),
    supabase.from("catalog_products").select("id, name, category, sizes").eq("studio_id", studio.id),
    supabase.from("team_members").select("id, name, role, avatar_url").eq("studio_id", studio.id).eq("active", true),
  ]);

  const projects = projectsRes.data || [];
  const todayEvents = todayEventsRes.data || [];
  const overdueInstallments = overdueRes.data || [];
  const allInstallments = pendingRes.data || [];
  const leads = leadsRes.data || [];
  const galleries = galleriesRes.data || [];
  const contracts = contractsRes.data || [];
  const upcomingEvents = upcomingEventsRes.data || [];
  const totalTeamMembers = teamRes.data?.length || 0;
  const totalClients = clientsRes.data?.length || 0;
  const totalPacks = packsRes.data?.length || 0;

  const activeProjectsList = projects.filter(p => ["confirmado", "producao", "edicao"].includes(p.status));
  const activeProjects = activeProjectsList.length;
  const inProduction = projects.filter(p => ["producao", "edicao"].includes(p.status)).length;
  const totalPending = allInstallments.filter(i => i.status === "pendente").reduce((s, i) => s + Number(i.amount), 0);
  const totalReceived = allInstallments.filter(i => i.status === "pago").reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = overdueInstallments.reduce((s, i) => s + Number(i.amount), 0);
  const totalPhotos = galleries.reduce((s, g) => s + (Number((g as Record<string, unknown>).photo_count) || 0), 0);
  const activeLeadsList = leads.filter(l => !["ganho", "perdido"].includes(l.stage));
  const activeLeads = activeLeadsList.length;
  const signedContracts = contracts.filter(c => c.status === "assinado").length;
  const pendingContracts = contracts.filter(c => c.status === "enviado").length;

  const projectsByType: Record<string, number> = {};
  for (const p of activeProjectsList) {
    const t = (p as Record<string, unknown>).event_type as string || "outro";
    projectsByType[t] = (projectsByType[t] || 0) + 1;
  }

  const leadsByStage: Record<string, number> = {};
  const leadsByType: Record<string, number> = {};
  let leadsEstimatedTotal = 0;
  for (const l of activeLeadsList) {
    const stage = l.stage || "novo";
    leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
    const t = (l as Record<string, unknown>).event_type as string;
    if (t) leadsByType[t] = (leadsByType[t] || 0) + 1;
    leadsEstimatedTotal += Number((l as Record<string, unknown>).estimated_value) || 0;
  }

  const galleriesByStatus: Record<string, number> = {};
  for (const g of galleries) {
    const s = (g as Record<string, unknown>).status as string || "outro";
    galleriesByStatus[s] = (galleriesByStatus[s] || 0) + 1;
  }

  // Enriched briefing data for today's events
  const briefingEvents: { id: string; title: string; startAt: string; location: string | null; projectName?: string; clientName?: string; teamMembers?: string[]; notes?: string }[] = [];
  if (todayEvents.length > 0) {
    const eventIds = todayEvents.map(e => e.id);

    const { data: enrichedEvents } = await supabase
      .from("events")
      .select(`
        id, title, start_at, location, project_id, description,
        projects:project_id (name, notes, team_ids, client_id, clients:client_id (name))
      `)
      .in("id", eventIds);

    if (enrichedEvents) {
      for (const ev of enrichedEvents) {
        const proj = ev.projects as any;
        const teamIds: string[] = proj?.team_ids || [];
        let teamNames: string[] = [];

        if (teamIds.length > 0 && wizTeamRes.data) {
          teamNames = (wizTeamRes.data as any[])
            .filter(t => teamIds.includes(t.id))
            .map(t => t.name);
        }

        briefingEvents.push({
          id: ev.id,
          title: ev.title,
          startAt: ev.start_at,
          location: ev.location || null,
          projectName: proj?.name || null,
          clientName: proj?.clients?.name || null,
          teamMembers: teamNames,
          notes: proj?.notes || (ev as any).description || null,
        });
      }
    }
  }

  const workloadInsight = await detectWorkload(supabase, studio.id);
  const relationshipInsights = await computeRelationshipInsights(supabase, studio.id);

  const metaName = (user.user_metadata?.full_name || user.user_metadata?.name || "") as string;
  let firstName = metaName.split(" ")[0];
  if (!firstName) firstName = studio.name.split(" ")[0];
  firstName = firstName.replace(/^\w/, (c) => c.toUpperCase());

  const serializedAlerts: IrisAlert[] = alerts.map(a => ({
    id: a.id, message: a.message, priority: a.priority, context: a.context, count: a.count, value: a.value,
  }));

  return (
    <IrisClient
      studioId={studio.id}
      studioName={studio.name}
      userName={firstName || studio.name}
      alerts={serializedAlerts}
      briefingEvents={briefingEvents}
      workloadInsight={workloadInsight}
      relationshipInsights={relationshipInsights}
      projectsList={activeProjectsList}
      wizardData={{
        clients: (wizClientRes.data || []) as { id: string; name: string; email: string | null; phone: string | null }[],
        packs: (wizPackRes.data || []) as any[],
        workflowTemplates: (wizTemplateRes.data || []) as any[],
        catalogProducts: (wizProductRes.data || []) as any[],
        teamMembers: (wizTeamRes.data || []) as { id: string; name: string; role: string; avatar_url: string | null }[],
      }}
      context={{
        activeProjects, inProduction,
        todayEventsCount: todayEvents.length,
        todayEvents: todayEvents.map(e => ({ title: e.title, time: e.start_at, location: e.location })),
        upcomingEvents: upcomingEvents.map(e => ({ title: e.title, date: e.start_at })),
        totalPending, totalReceived, totalOverdue,
        overdueCount: overdueInstallments.length,
        activeLeads, totalLeads: leads.length,
        totalGalleries: galleries.length, totalPhotos,
        signedContracts, pendingContracts, totalContracts: contracts.length,
        projectsByType, leadsByStage, leadsByType, leadsEstimatedTotal, galleriesByStatus,
        totalProjects: projects.length, totalTeamMembers, totalClients, totalPacks,
      }}
    />
  );
}
