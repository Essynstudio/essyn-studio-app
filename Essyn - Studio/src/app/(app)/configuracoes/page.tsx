import { createServerSupabase } from "@/lib/supabase/server";
import { ConfiguracoesClient } from "./configuracoes-client";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [
    { data: packs },
    { data: workflowTemplates },
    teamCountRes,
  ] = await Promise.all([
    supabase
      .from("packs")
      .select("id, name, active")
      .eq("studio_id", studio.id)
      .eq("active", true),
    supabase
      .from("workflow_templates")
      .select("id, name, active")
      .eq("studio_id", studio.id)
      .eq("active", true),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("studio_id", studio.id)
      .eq("active", true),
  ]);

  const teamCount = (teamCountRes.count || 0) + 1; // +1 for owner

  return (
    <ConfiguracoesClient
      studio={studio as never}
      userEmail={user.email || ""}
      initialPacks={(packs as never[]) || []}
      initialWorkflows={(workflowTemplates as never[]) || []}
      teamCount={teamCount}
    />
  );
}
