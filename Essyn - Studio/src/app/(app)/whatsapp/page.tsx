import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WhatsAppClient } from "./whatsapp-client";

export default async function WhatsAppPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!studio) redirect("/entrar");

  return <WhatsAppClient />;
}
