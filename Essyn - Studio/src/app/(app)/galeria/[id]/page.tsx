import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GalleryDetailClient } from "./gallery-detail-client";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GalleryDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, settings")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: gallery } = await supabase
    .from("galleries")
    .select(`
      id, name, slug, cover_url, photo_count,
      status, privacy, password_hash, expires_at,
      download_enabled, watermark_enabled,
      views, downloads,
      delivery_deadline_days, delivery_deadline_date,
      branding, settings, created_at, updated_at,
      projects (id, name, event_date, event_type),
      clients (id, name, email, phone)
    `)
    .eq("id", id)
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .single();

  if (!gallery) return notFound();

  // Get or create a public share token (invite without client/email = public link)
  let shareToken: string | null = null;
  const { data: existingInvite } = await supabase
    .from("gallery_invites")
    .select("token")
    .eq("gallery_id", id)
    .is("client_id", null)
    .is("email", null)
    .limit(1)
    .maybeSingle();

  if (existingInvite) {
    shareToken = existingInvite.token;
  } else {
    const serviceSupabase = createServiceSupabase();
    const { data: newInvite } = await serviceSupabase
      .from("gallery_invites")
      .insert({ gallery_id: id, studio_id: studio.id, role: "viewer" })
      .select("token")
      .single();
    shareToken = newInvite?.token ?? null;
  }

  // Fetch gallery photos
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, file_url, thumbnail_url, storage_path, filename, size_bytes, width, height, sort_order, folder_id, favorited, selected, created_at")
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true });

  return (
    <GalleryDetailClient
      gallery={gallery as never}
      photos={(photos || []) as never[]}
      studioId={studio.id}
      studioName={studio.name || "Meu Estúdio"}
      shareToken={shareToken}
    />
  );
}
