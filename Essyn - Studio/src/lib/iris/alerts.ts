// ═══════════════════════════════════════════════
// Iris V2 — Proactive Alert System
// ═══════════════════════════════════════════════

import { SupabaseClient } from "@supabase/supabase-js";
import type { IrisContextKey } from "./contexts";

export type AlertPriority = "alta" | "media" | "baixa";

export interface IrisAlert {
  id: string;
  message: string;
  priority: AlertPriority;
  context: IrisContextKey;
  count?: number;
  value?: number;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function futureISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function pastISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function cur(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export async function computeAlerts(
  supabase: SupabaseClient,
  studioId: string
): Promise<IrisAlert[]> {
  const today = todayISO();
  const in7d = futureISO(7);
  const in5d = futureISO(5);
  const ago3d = pastISO(3);
  const ago7d = pastISO(7);
  const ago5d = pastISO(5);
  const tomorrow = futureISO(1);

  // Run all alert queries in parallel
  const [
    overdueRes,
    upcomingDueRes,
    expiringContractsRes,
    emptyGalleriesRes,
    deadlineGalleriesRes,
    staleLeadsRes,
    highValueLeadsRes,
    noTeamProjectsRes,
    draftProjectsRes,
    lateWorkflowsRes,
    tomorrowEventsRes,
    unsignedContractsRes,
    galleriesWithoutPhotosWeekRes,
    producaoSemGaleriaRes,
    upcomingEventsTodayRes,
  ] = await Promise.all([
    // 1. Cobrancas vencidas
    supabase
      .from("installments")
      .select("amount")
      .eq("studio_id", studioId)
      .eq("type", "receita")
      .in("status", ["pendente", "vencido"])
      .lt("due_date", today),
    // 2. Cobrancas vencendo 7d
    supabase
      .from("installments")
      .select("amount")
      .eq("studio_id", studioId)
      .eq("type", "receita")
      .eq("status", "pendente")
      .gte("due_date", today)
      .lte("due_date", in7d),
    // 3. Contratos expirando
    supabase
      .from("contracts")
      .select("id")
      .eq("studio_id", studioId)
      .eq("status", "enviado")
      .lte("expires_at", in7d)
      .gte("expires_at", today),
    // 4. Galerias sem fotos (criadas há mais de 14 dias)
    supabase
      .from("galleries")
      .select("id")
      .eq("studio_id", studioId)
      .eq("photo_count", 0)
      .not("status", "in", '("agendada","arquivado")')
      .lt("created_at", pastISO(14)),
    // 5. Galerias prazo proximo
    supabase
      .from("galleries")
      .select("id")
      .eq("studio_id", studioId)
      .not("status", "in", '("entregue","arquivado")')
      .not("delivery_deadline_date", "is", null)
      .lte("delivery_deadline_date", in5d)
      .gte("delivery_deadline_date", today),
    // 6. Leads sem ação
    supabase
      .from("leads")
      .select("id")
      .eq("studio_id", studioId)
      .not("stage", "in", '("ganho","perdido")')
      .or(`next_action_date.lt.${today},and(next_action.is.null,created_at.lt.${ago3d})`),
    // 7. Leads alto valor esquecidos
    supabase
      .from("leads")
      .select("id")
      .eq("studio_id", studioId)
      .not("stage", "in", '("ganho","perdido")')
      .gte("estimated_value", 5000)
      .lt("updated_at", ago5d),
    // 8. Projetos sem equipe
    supabase
      .from("projects")
      .select("id")
      .eq("studio_id", studioId)
      .in("status", ["confirmado", "producao"])
      .eq("team_ids", "{}"),
    // 9. Projetos rascunho antigos
    supabase
      .from("projects")
      .select("id")
      .eq("studio_id", studioId)
      .eq("status", "rascunho")
      .lt("created_at", ago7d),
    // 10. Workflows atrasados
    supabase
      .from("project_workflows")
      .select("id")
      .eq("studio_id", studioId)
      .neq("status", "concluido")
      .not("deadline", "is", null)
      .lt("deadline", today),
    // 11. Eventos amanha
    supabase
      .from("events")
      .select("id")
      .eq("studio_id", studioId)
      .eq("status", "agendado")
      .gte("start_at", `${tomorrow}T00:00:00`)
      .lte("start_at", `${tomorrow}T23:59:59`),
    // 12. Contratos enviados mas não assinados há mais de 5 dias
    supabase
      .from("contracts")
      .select("id")
      .eq("studio_id", studioId)
      .eq("status", "enviado")
      .lt("sent_at", ago5d),
    // 13. Galerias sem fotos há mais de 7 dias (projetos em produção)
    supabase
      .from("galleries")
      .select("id")
      .eq("studio_id", studioId)
      .eq("photo_count", 0)
      .eq("status", "rascunho")
      .lt("created_at", ago7d),
    // 14. Projetos em producao sem galeria com fotos (entrega atrasada)
    supabase
      .from("projects")
      .select("id")
      .eq("studio_id", studioId)
      .in("status", ["edicao", "producao"])
      .not("event_date", "is", null)
      .lt("event_date", pastISO(21)),
    // 15. Eventos hoje (para briefing proativo)
    supabase
      .from("events")
      .select("id, title")
      .eq("studio_id", studioId)
      .eq("status", "agendado")
      .gte("start_at", `${today}T00:00:00`)
      .lte("start_at", `${today}T23:59:59`),
  ]);

  const alerts: IrisAlert[] = [];

  // 1. Cobrancas vencidas (ALTA)
  const overdue = overdueRes.data || [];
  if (overdue.length > 0) {
    const total = overdue.reduce((s, i) => s + Number(i.amount), 0);
    alerts.push({
      id: "overdue_installments",
      message: `${overdue.length} cobrança${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""} (${cur(total)})`,
      priority: "alta",
      context: "financeiro",
      count: overdue.length,
      value: total,
    });
  }

  // 2. Cobrancas vencendo 7d (MEDIA)
  const upcoming = upcomingDueRes.data || [];
  if (upcoming.length > 0) {
    const total = upcoming.reduce((s, i) => s + Number(i.amount), 0);
    alerts.push({
      id: "upcoming_due",
      message: `${upcoming.length} cobrança${upcoming.length > 1 ? "s" : ""} vencem essa semana (${cur(total)})`,
      priority: "media",
      context: "financeiro",
      count: upcoming.length,
      value: total,
    });
  }

  // 3. Contratos expirando (ALTA)
  const expContracts = expiringContractsRes.data || [];
  if (expContracts.length > 0) {
    alerts.push({
      id: "expiring_contracts",
      message: `${expContracts.length} contrato${expContracts.length > 1 ? "s" : ""} expirando sem aceite`,
      priority: "alta",
      context: "financeiro",
      count: expContracts.length,
    });
  }

  // 4. Galerias sem fotos (MEDIA)
  const emptyGals = emptyGalleriesRes.data || [];
  if (emptyGals.length > 0) {
    alerts.push({
      id: "empty_galleries",
      message: `${emptyGals.length} galeria${emptyGals.length > 1 ? "s" : ""} sem fotos ha mais de 7 dias`,
      priority: "media",
      context: "clientes",
      count: emptyGals.length,
    });
  }

  // 5. Galerias prazo proximo (ALTA)
  const deadlineGals = deadlineGalleriesRes.data || [];
  if (deadlineGals.length > 0) {
    alerts.push({
      id: "gallery_deadline",
      message: `${deadlineGals.length} galeria${deadlineGals.length > 1 ? "s" : ""} com prazo de entrega proximo`,
      priority: "alta",
      context: "clientes",
      count: deadlineGals.length,
    });
  }

  // 6. Leads sem ação (MEDIA)
  const staleLeads = staleLeadsRes.data || [];
  if (staleLeads.length > 0) {
    alerts.push({
      id: "stale_leads",
      message: `${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} sem ação definida`,
      priority: "media",
      context: "clientes",
      count: staleLeads.length,
    });
  }

  // 7. Leads alto valor (ALTA)
  const hvLeads = highValueLeadsRes.data || [];
  if (hvLeads.length > 0) {
    alerts.push({
      id: "high_value_leads",
      message: `${hvLeads.length} lead${hvLeads.length > 1 ? "s" : ""} de alto valor sem acompanhamento`,
      priority: "alta",
      context: "clientes",
      count: hvLeads.length,
    });
  }

  // 8. Projetos sem equipe (BAIXA)
  const noTeam = noTeamProjectsRes.data || [];
  if (noTeam.length > 0) {
    alerts.push({
      id: "no_team_projects",
      message: `${noTeam.length} projeto${noTeam.length > 1 ? "s" : ""} confirmado${noTeam.length > 1 ? "s" : ""} sem equipe`,
      priority: "baixa",
      context: "trabalho",
      count: noTeam.length,
    });
  }

  // 9. Projetos rascunho antigos (BAIXA)
  const drafts = draftProjectsRes.data || [];
  if (drafts.length > 0) {
    alerts.push({
      id: "old_drafts",
      message: `${drafts.length} projeto${drafts.length > 1 ? "s" : ""} em rascunho ha mais de 7 dias`,
      priority: "baixa",
      context: "trabalho",
      count: drafts.length,
    });
  }

  // 10. Workflows atrasados (ALTA)
  const lateWf = lateWorkflowsRes.data || [];
  if (lateWf.length > 0) {
    alerts.push({
      id: "late_workflows",
      message: `${lateWf.length} workflow${lateWf.length > 1 ? "s" : ""} com deadline vencido`,
      priority: "alta",
      context: "trabalho",
      count: lateWf.length,
    });
  }

  // 11. Eventos amanha (MEDIA)
  const tmrEvents = tomorrowEventsRes.data || [];
  if (tmrEvents.length > 0) {
    alerts.push({
      id: "tomorrow_events",
      message: `${tmrEvents.length} evento${tmrEvents.length > 1 ? "s" : ""} amanha — prepare o briefing`,
      priority: "media",
      context: "trabalho",
      count: tmrEvents.length,
    });
  }

  // 12. Contratos enviados sem assinatura há 5+ dias (ALTA)
  const unsignedContracts = unsignedContractsRes.data || [];
  if (unsignedContracts.length > 0) {
    alerts.push({
      id: "unsigned_contracts",
      message: `${unsignedContracts.length} contrato${unsignedContracts.length > 1 ? "s" : ""} enviado${unsignedContracts.length > 1 ? "s" : ""} sem assinatura ha mais de 5 dias`,
      priority: "alta",
      context: "financeiro",
      count: unsignedContracts.length,
    });
  }

  // 13. Galerias em rascunho sem fotos há 7+ dias (MEDIA)
  const galSemFotos = galleriesWithoutPhotosWeekRes.data || [];
  if (galSemFotos.length > 0) {
    alerts.push({
      id: "galleries_no_photos_week",
      message: `${galSemFotos.length} galeria${galSemFotos.length > 1 ? "s" : ""} sem fotos ha mais de 7 dias — entrega pendente`,
      priority: "media",
      context: "trabalho",
      count: galSemFotos.length,
    });
  }

  // 14. Projetos em producao/edicao sem entrega após 21 dias do evento (ALTA)
  const producaoAtrasada = producaoSemGaleriaRes.data || [];
  if (producaoAtrasada.length > 0) {
    alerts.push({
      id: "late_production",
      message: `${producaoAtrasada.length} projeto${producaoAtrasada.length > 1 ? "s" : ""} com evento ha mais de 3 semanas ainda em edicao`,
      priority: "alta",
      context: "trabalho",
      count: producaoAtrasada.length,
    });
  }

  // 15. Eventos hoje (proativo — MEDIA)
  const todayEvents = upcomingEventsTodayRes.data || [];
  if (todayEvents.length > 0) {
    const titulo = todayEvents[0].title;
    alerts.push({
      id: "today_events",
      message: `Hoje: ${todayEvents.length === 1 ? `"${titulo}"` : `${todayEvents.length} eventos agendados`}`,
      priority: "media",
      context: "visao_geral",
      count: todayEvents.length,
    });
  }

  // Sort: alta > media > baixa
  const priorityOrder: Record<AlertPriority, number> = { alta: 0, media: 1, baixa: 2 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return alerts;
}

// Filter alerts for a specific context
export function filterAlerts(alerts: IrisAlert[], contextKey: IrisContextKey): IrisAlert[] {
  if (contextKey === "visao_geral") {
    // Top 3 from all contexts
    return alerts.slice(0, 3);
  }
  return alerts.filter(a => a.context === contextKey).slice(0, 5);
}

// Format alerts as text for system prompt injection
export function formatAlertsForPrompt(alerts: IrisAlert[]): string {
  if (alerts.length === 0) return "Nenhum alerta no momento.";
  return alerts.map(a => {
    const priority = a.priority === "alta" ? "[URGENTE]" : a.priority === "media" ? "[ATENCAO]" : "[INFO]";
    return `${priority} ${a.message}`;
  }).join("\n");
}
