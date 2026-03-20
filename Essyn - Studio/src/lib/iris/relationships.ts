import type { SupabaseClient } from "@supabase/supabase-js";

export interface RelationshipInsight {
  id: string;
  type: "reengagement" | "anniversary" | "referral" | "upsell" | "vip_care";
  message: string;
  clientName: string;
  priority: "alta" | "media";
}

export async function computeRelationshipInsights(
  supabase: SupabaseClient,
  studioId: string
): Promise<RelationshipInsight[]> {
  const insights: RelationshipInsight[] = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearWindow = new Date(oneYearAgo);
  oneYearWindow.setDate(oneYearWindow.getDate() + 30); // 30 day window around anniversary

  // 1. Clients with no project in 3+ months (reengagement)
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, name, status, total_spent, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .eq("status", "ativo")
    .order("created_at", { ascending: false })
    .limit(200);

  if (allClients && allClients.length > 0) {
    // Get most recent project per client
    const { data: recentProjects } = await supabase
      .from("projects")
      .select("id, client_id, event_date, created_at")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false })
      .limit(500);

    if (recentProjects) {
      const lastProjectByClient: Record<string, Date> = {};
      for (const p of recentProjects) {
        if (p.client_id && !lastProjectByClient[p.client_id]) {
          lastProjectByClient[p.client_id] = new Date(p.event_date || p.created_at);
        }
      }

      for (const client of allClients) {
        const lastDate = lastProjectByClient[client.id];
        if (!lastDate) continue;

        const monthsSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        // Reengagement: 3-12 months without project
        if (monthsSince >= 3 && monthsSince <= 12) {
          const monthsRounded = Math.floor(monthsSince);
          insights.push({
            id: `reeng_${client.id}`,
            type: "reengagement",
            message: `${client.name} não tem projeto há ${monthsRounded} meses. Último trabalho em ${lastDate.toLocaleDateString("pt-BR")}. Total investido: R$ ${(client.total_spent || 0).toLocaleString("pt-BR")}.`,
            clientName: client.name,
            priority: monthsSince >= 6 ? "alta" : "media",
          });
        }
      }
    }
  }

  // 2. VIP clients (high total_spent) without recent activity
  if (allClients) {
    const vips = allClients.filter(c => (c.total_spent || 0) >= 5000);
    // Already handled by reengagement, but mark VIPs specifically
    for (const vip of vips.slice(0, 3)) {
      if (!insights.some(i => i.clientName === vip.name)) {
        insights.push({
          id: `vip_${vip.id}`,
          type: "vip_care",
          message: `${vip.name} é cliente VIP (R$ ${(vip.total_spent || 0).toLocaleString("pt-BR")} investidos). Considere enviar uma mensagem personalizada ou desconto exclusivo.`,
          clientName: vip.name,
          priority: "media",
        });
      }
    }
  }

  // Limit total insights
  return insights.slice(0, 5);
}

export function formatRelationshipInsights(insights: RelationshipInsight[]): string {
  if (insights.length === 0) return "";

  const lines = insights.map(i => {
    const priority = i.priority === "alta" ? "[IMPORTANTE]" : "[SUGESTAO]";
    return `${priority} ${i.message}`;
  });

  return "\n\n## Inteligência de relacionamento\n" + lines.join("\n");
}
