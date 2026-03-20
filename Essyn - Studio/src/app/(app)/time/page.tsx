import { createServerSupabase } from "@/lib/supabase/server";
import { TimeClient } from "./time-client";
import { redirect } from "next/navigation";

export default async function TimePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [membersRes, invitesRes] = await Promise.all([
    supabase
      .from("team_members")
      .select(`
        id, name, email, role, custom_role, phone, active, avatar_url,
        member_type, specialty, hourly_rate, notes, permissions,
        user_id, joined_at, created_at, updated_at
      `)
      .eq("studio_id", studio.id)
      .order("name"),
    supabase
      .from("team_invites")
      .select("id, token, name, email, phone, role, custom_role, permissions, expires_at, accepted_at, created_at")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <TimeClient
      members={(membersRes.data || []) as never[]}
      invites={(invitesRes.data || []) as never[]}
      studioId={studio.id}
    />
  );
}
