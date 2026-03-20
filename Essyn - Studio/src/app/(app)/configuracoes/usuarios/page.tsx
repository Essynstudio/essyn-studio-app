import { createServerSupabase } from "@/lib/supabase/server";
import { UsuariosClient } from "./usuarios-client";
import { redirect } from "next/navigation";

export default async function UsuariosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: true });

  return (
    <UsuariosClient
      studioId={studio.id}
      initialMembers={(members as never[]) || []}
    />
  );
}
