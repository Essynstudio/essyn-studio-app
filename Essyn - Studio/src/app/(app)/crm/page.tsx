import { createServerSupabase } from "@/lib/supabase/server";
import { CrmClient } from "./crm-client";
import { redirect } from "next/navigation";

export default async function CrmPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, name, email, phone, event_type, event_date,
      event_location, estimated_value, stage, source,
      notes, tags, next_action, next_action_date,
      lost_reason, converted_project_id,
      created_at, updated_at,
      clients (id, name)
    `)
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <CrmClient
      leads={(leads || []) as never[]}
      studioId={studio.id}
    />
  );
}
