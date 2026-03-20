import { createServerSupabase } from "@/lib/supabase/server";
import { NotificacoesClient } from "./notificacoes-client";
import { redirect } from "next/navigation";

export default async function NotificacoesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <NotificacoesClient
      notifications={(notifications || []) as never[]}
    />
  );
}
