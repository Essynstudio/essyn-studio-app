import { createServerSupabase } from "@/lib/supabase/server";
import { AssinaturaClient } from "./assinatura-client";
import { redirect } from "next/navigation";

export default async function AssinaturaPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const teamCountRes = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studio.id)
    .eq("active", true);

  const teamCount = (teamCountRes.count || 0) + 1;

  // Count projects this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: projectsThisMonth } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .gte("created_at", startOfMonth.toISOString());

  return (
    <AssinaturaClient
      studio={studio as never}
      teamCount={teamCount}
      projectsThisMonth={projectsThisMonth || 0}
    />
  );
}
