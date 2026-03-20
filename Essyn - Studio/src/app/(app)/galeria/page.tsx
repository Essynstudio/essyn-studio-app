import { createServerSupabase } from "@/lib/supabase/server";
import { GaleriaClient } from "./galeria-client";
import { redirect } from "next/navigation";

export default async function GaleriaPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [galleriesRes, projectsRes, clientsRes] = await Promise.all([
    supabase
      .from("galleries")
      .select(`
        id, name, slug, cover_url, photo_count,
        status, privacy, password_hash, expires_at,
        download_enabled, watermark_enabled,
        views, downloads,
        delivery_deadline_days, delivery_deadline_date,
        settings, created_at, updated_at,
        projects (id, name, event_date),
        clients (id, name)
      `)
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("clients")
      .select("id, name")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  return (
    <GaleriaClient
      galleries={(galleriesRes.data || []) as never[]}
      projects={(projectsRes.data || []) as never[]}
      clients={(clientsRes.data || []) as never[]}
      studioId={studio.id}
    />
  );
}
