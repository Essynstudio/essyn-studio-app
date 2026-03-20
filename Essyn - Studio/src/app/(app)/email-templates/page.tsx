import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailTemplatesClient } from "./email-templates-client";

export default async function EmailTemplatesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!studio) redirect("/entrar");

  return <EmailTemplatesClient studioId={studio.id} />;
}
