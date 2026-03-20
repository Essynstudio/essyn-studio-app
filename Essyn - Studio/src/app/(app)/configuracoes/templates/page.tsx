import { createServerSupabase } from "@/lib/supabase/server";
import { TemplatesClient } from "./templates-client";
import { redirect } from "next/navigation";

export default async function TemplatesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: workflows } = await supabase
    .from("workflow_templates")
    .select("*")
    .eq("studio_id", studio.id)
    .order("sort_order", { ascending: true });

  return (
    <TemplatesClient
      studioId={studio.id}
      initialWorkflows={(workflows as never[]) || []}
    />
  );
}
