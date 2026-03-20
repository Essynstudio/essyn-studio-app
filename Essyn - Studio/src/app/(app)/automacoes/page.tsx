import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AutomacoesClient } from "./automacoes-client";

export default async function AutomacoesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, settings")
    .eq("owner_id", user.id)
    .single();
  if (!studio) redirect("/entrar");

  // Load automation settings from studio
  const settings = (studio as Record<string, unknown>).settings as Record<string, unknown> | null;
  const automationSettings = (settings?.automations || {}) as Record<string, boolean>;

  return <AutomacoesClient studioId={studio.id} initialSettings={automationSettings} />;
}
