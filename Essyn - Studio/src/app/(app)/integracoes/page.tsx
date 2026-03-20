import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IntegracoesClient } from "./integracoes-client";

export default async function IntegracoesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!studio) redirect("/entrar");

  // Load active integrations
  const { data: integrations } = await supabase
    .from("integrations")
    .select("id, provider, status, config, connected_at")
    .eq("studio_id", studio.id);

  return (
    <IntegracoesClient
      studioId={studio.id}
      activeIntegrations={integrations || []}
    />
  );
}
