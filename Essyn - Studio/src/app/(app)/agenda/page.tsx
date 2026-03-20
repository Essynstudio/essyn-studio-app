import { createServerSupabase } from "@/lib/supabase/server";
import { AgendaClient } from "./agenda-client";
import { redirect } from "next/navigation";

export default async function AgendaPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [eventsRes, projectsRes, nextProjectRes] = await Promise.all([
    // All events (for calendar rendering)
    supabase
      .from("events")
      .select(`
        id, title, description, start_at, end_at,
        location, status, project_id, all_day, color,
        google_calendar_event_id, client_google_event_id, created_at,
        projects (id, name, client_id)
      `)
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("start_at", { ascending: true }),
    // Projects for selector
    supabase
      .from("projects")
      .select("id, name")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name"),
    // Next upcoming project (by event_date)
    supabase
      .from("projects")
      .select(`
        id, name, event_type, event_date, event_location, status, value, paid,
        team_ids, pack_id,
        clients (id, name),
        installments (id, status, amount),
        project_workflows (id, status)
      `)
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .in("status", ["confirmado", "producao", "edicao"])
      .gte("event_date", todayISO)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const events = eventsRes.data || [];

  // Calculate server-side stats
  const todayEvents = events.filter((ev) => {
    const evDate = ev.start_at.split("T")[0];
    return evDate === todayISO;
  });

  const monthEvents = events.filter((ev) => {
    const evDate = new Date(ev.start_at);
    return evDate >= new Date(monthStart) && evDate <= new Date(monthEnd);
  });

  // Count Saturdays in current month
  const saturdays: { date: string; hasEvent: boolean }[] = [];
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 6) {
      const dateStr = d.toISOString().split("T")[0];
      const hasEvent = events.some((ev) => ev.start_at.split("T")[0] === dateStr);
      saturdays.push({ date: dateStr, hasEvent });
    }
  }

  // Monthly summary by event type
  const monthSummary = monthEvents.reduce(
    (acc, ev) => {
      const title = ev.title.toLowerCase();
      if (title.includes("bloqueio")) acc.bloqueio++;
      else if (title.includes("reunião") || title.includes("reuniao")) acc.reuniao++;
      else if (title.includes("entrega")) acc.entrega++;
      else acc.evento++;
      return acc;
    },
    { evento: 0, reuniao: 0, entrega: 0, bloqueio: 0 }
  );

  return (
    <AgendaClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events={events as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projects={(projectsRes.data || []) as any[]}
      studioId={studio.id}
      stats={{
        todayCount: todayEvents.length,
        monthCount: monthEvents.length,
        saturdays,
        monthSummary,
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nextProject={nextProjectRes.data as any}
    />
  );
}
