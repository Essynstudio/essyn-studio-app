import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkloadInsight {
  level: "normal" | "busy" | "overloaded";
  message: string;
  suggestion: string;
}

export async function detectWorkload(
  supabase: SupabaseClient,
  studioId: string
): Promise<WorkloadInsight | null> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const nextWeekEnd = new Date(weekEnd);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const [eventsRes, overdueWorkflowsRes, overdueInstallmentsRes] = await Promise.all([
    // Events this week and next
    supabase
      .from("events")
      .select("id")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .gte("start_at", now.toISOString())
      .lte("start_at", nextWeekEnd.toISOString()),
    // Overdue workflows
    supabase
      .from("project_workflows")
      .select("id")
      .eq("studio_id", studioId)
      .eq("status", "pendente")
      .not("deadline", "is", null)
      .lt("deadline", now.toISOString()),
    // Overdue installments
    supabase
      .from("installments")
      .select("id")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .eq("status", "pendente")
      .lt("due_date", now.toISOString().split("T")[0]),
  ]);

  const upcomingEvents = eventsRes.data?.length || 0;
  const overdueWorkflows = overdueWorkflowsRes.data?.length || 0;
  const overduePayments = overdueInstallmentsRes.data?.length || 0;

  // Scoring
  const score = upcomingEvents * 2 + overdueWorkflows * 3 + overduePayments * 1;

  // Don't show workload alert for pure calendar entries without project activity
  const hasProjectActivity = overdueWorkflows > 0 || overduePayments > 0;
  const busyThreshold = hasProjectActivity ? 8 : 12;
  const overloadedThreshold = hasProjectActivity ? 15 : 20;

  if (score >= overloadedThreshold) {
    return {
      level: "overloaded",
      message: `Semana intensa: ${upcomingEvents} eventos próximos, ${overdueWorkflows} etapas de produção atrasadas e ${overduePayments} cobranças pendentes.`,
      suggestion: "Quer que eu priorize suas entregas e sugira quais resolver primeiro?",
    };
  }

  if (score >= busyThreshold) {
    return {
      level: "busy",
      message: `Semana movimentada: ${upcomingEvents} eventos e ${overdueWorkflows + overduePayments} pendências para resolver.`,
      suggestion: "Posso organizar suas prioridades da semana se quiser.",
    };
  }

  return null;
}

export function formatWorkloadForPrompt(insight: WorkloadInsight | null): string {
  if (!insight) return "";
  const tag = insight.level === "overloaded" ? "[SOBRECARGA]" : "[SEMANA CHEIA]";
  return `\n\n## Carga de trabalho\n${tag} ${insight.message}\nSugestão: ${insight.suggestion}`;
}
