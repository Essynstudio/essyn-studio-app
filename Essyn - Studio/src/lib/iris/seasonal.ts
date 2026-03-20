import type { SupabaseClient } from "@supabase/supabase-js";

export interface SeasonalInsight {
  message: string;
  type: "peak_coming" | "slow_period" | "comparison";
}

export async function computeSeasonalInsights(
  supabase: SupabaseClient,
  studioId: string
): Promise<SeasonalInsight[]> {
  const insights: SeasonalInsight[] = [];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // Get all projects with dates from past 2 years
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const { data: historicalProjects } = await supabase
    .from("projects")
    .select("id, event_date, value, status, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .neq("status", "cancelado")
    .gte("created_at", twoYearsAgo.toISOString())
    .order("created_at", { ascending: true });

  if (!historicalProjects || historicalProjects.length < 5) return insights;

  // Count projects by month
  const monthCounts: Record<number, number> = {};
  const monthRevenue: Record<number, number> = {};

  for (const p of historicalProjects) {
    const date = new Date(p.event_date || p.created_at);
    const month = date.getMonth();
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    monthRevenue[month] = (monthRevenue[month] || 0) + (Number(p.value) || 0);
  }

  // Find peak months (top 3)
  const sortedMonths = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  if (sortedMonths.length >= 3) {
    const peakMonths = sortedMonths.slice(0, 3).map(([m]) => Number(m));
    const nextMonth = (currentMonth + 1) % 12;
    const nextNextMonth = (currentMonth + 2) % 12;

    // Is next month a peak?
    if (peakMonths.includes(nextMonth)) {
      const avgCount = monthCounts[nextMonth] || 0;

      // Count current bookings for next month
      const nextMonthStart = new Date(currentYear, nextMonth, 1);
      const nextMonthEnd = new Date(currentYear, nextMonth + 1, 0);

      const { data: bookedNext } = await supabase
        .from("projects")
        .select("id")
        .eq("studio_id", studioId)
        .is("deleted_at", null)
        .neq("status", "cancelado")
        .gte("event_date", nextMonthStart.toISOString().split("T")[0])
        .lte("event_date", nextMonthEnd.toISOString().split("T")[0]);

      const booked = bookedNext?.length || 0;

      insights.push({
        type: "peak_coming",
        message: `${monthNames[nextMonth]} costuma ser um dos seus meses mais fortes (média de ${avgCount} projetos). Você tem ${booked} confirmado${booked !== 1 ? "s" : ""}. ${booked < avgCount ? "Considere ativar campanhas de reengajamento." : "Bom ritmo de confirmações."}`,
      });
    }

    // Is current month slow compared to average?
    const avgAll = Object.values(monthCounts).reduce((s, c) => s + c, 0) / Math.max(Object.keys(monthCounts).length, 1);
    const currentCount = monthCounts[currentMonth] || 0;

    if (currentCount < avgAll * 0.6 && !peakMonths.includes(currentMonth)) {
      insights.push({
        type: "slow_period",
        message: `${monthNames[currentMonth]} historicamente é um mês mais tranquilo para seu estúdio. Bom momento para organizar entregas pendentes, atualizar portfólio ou lançar promoções.`,
      });
    }
  }

  // Month-over-month comparison
  const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const thisMonthProjects = historicalProjects.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const lastMonthProjects = historicalProjects.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === lastMonthIdx && (
      lastMonthIdx === 11 ? d.getFullYear() === currentYear - 1 : d.getFullYear() === currentYear
    );
  }).length;

  if (lastMonthProjects > 0 && thisMonthProjects > lastMonthProjects * 1.3) {
    insights.push({
      type: "comparison",
      message: `Este mês você já tem ${thisMonthProjects} projetos vs ${lastMonthProjects} em ${monthNames[lastMonthIdx]}. Crescimento de ${Math.round(((thisMonthProjects / lastMonthProjects) - 1) * 100)}%.`,
    });
  } else if (lastMonthProjects > 0 && thisMonthProjects < lastMonthProjects * 0.5) {
    insights.push({
      type: "comparison",
      message: `${thisMonthProjects} projetos este mês vs ${lastMonthProjects} em ${monthNames[lastMonthIdx]}. Pode ser sazonal — quer que eu sugira ações para atrair mais clientes?`,
    });
  }

  return insights.slice(0, 2);
}

export function formatSeasonalForPrompt(insights: SeasonalInsight[]): string {
  if (insights.length === 0) return "";
  const lines = insights.map(i => {
    const tag = i.type === "peak_coming" ? "[PICO PROXIMO]" : i.type === "slow_period" ? "[PERIODO CALMO]" : "[TENDENCIA]";
    return `${tag} ${i.message}`;
  });
  return "\n\n## Previsão sazonal\n" + lines.join("\n");
}
