import { createServerSupabase } from "@/lib/supabase/server";
import { ProducaoClient } from "./producao-client";
import { redirect } from "next/navigation";

export default async function ProducaoPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: workflows } = await supabase
    .from("project_workflows")
    .select(`
      id, name, status, deadline, assigned_to, notes, sort_order,
      workflow_template_id, created_at, updated_at,
      projects (id, name, event_type, event_date, team_ids,
                clients (id, name))
    `)
    .eq("studio_id", studio.id)
    .order("deadline", { ascending: true, nullsFirst: false });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, name, email, role, avatar_url, active")
    .eq("studio_id", studio.id)
    .eq("active", true);

  return (
    <ProducaoClient
      workflows={(workflows || []) as never[]}
      teamMembers={(teamMembers || []) as never[]}
      studioId={studio.id}
    />
  );
}
