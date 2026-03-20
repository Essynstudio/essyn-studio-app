import { createServerSupabase } from "@/lib/supabase/server";
import { ClientesClient } from "./clientes-client";
import { redirect } from "next/navigation";

export default async function ClientesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [clientsRes, projectsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        id, name, email, phone, document, address, city, state,
        status, notes, tags, total_spent, created_at, updated_at
      `)
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name"),
    // Get project counts per client
    supabase
      .from("projects")
      .select("id, client_id, event_type, value")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .neq("status", "cancelado"),
  ]);

  const clients = clientsRes.data || [];
  const projects = projectsRes.data || [];

  // Build project count map
  const projectCountMap: Record<string, { count: number; totalValue: number; lastType: string | null }> = {};
  projects.forEach((p) => {
    if (!p.client_id) return;
    if (!projectCountMap[p.client_id]) {
      projectCountMap[p.client_id] = { count: 0, totalValue: 0, lastType: null };
    }
    projectCountMap[p.client_id].count++;
    projectCountMap[p.client_id].totalValue += Number(p.value || 0);
    projectCountMap[p.client_id].lastType = p.event_type;
  });

  // Stats
  const totalRevenue = clients.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const totalProjects = projects.length;
  const activeCount = clients.filter((c) => c.status === "ativo").length;
  const vipCount = clients.filter((c) => c.status === "vip").length;
  const inactiveCount = clients.filter((c) => c.status === "inativo").length;
  const avgTicket = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0;

  return (
    <ClientesClient
      clients={clients as never[]}
      studioId={studio.id}
      projectCounts={projectCountMap}
      stats={{
        total: clients.length,
        active: activeCount,
        vip: vipCount,
        inactive: inactiveCount,
        totalRevenue,
        totalProjects,
        avgTicket,
      }}
    />
  );
}
