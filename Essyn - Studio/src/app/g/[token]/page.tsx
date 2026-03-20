import { createServiceSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalGalleryClient } from "./portal-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PortalGalleryPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceSupabase();

  // Get invite + gallery id
  const { data: invite } = await supabase
    .from("gallery_invites")
    .select("gallery_id")
    .eq("token", token)
    .single();

  if (!invite) return notFound();

  // Fetch photos and folders in parallel
  const [photosResult, foldersResult] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("id, storage_path, filename, file_url, thumbnail_url, folder_id, sort_order, width, height, size_bytes, favorited, selected, created_at")
      .eq("gallery_id", invite.gallery_id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gallery_folders")
      .select("id, name, cover_photo_id, sort_order")
      .eq("gallery_id", invite.gallery_id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <PortalGalleryClient
      photos={(photosResult.data || []) as never[]}
      folders={(foldersResult.data || []) as never[]}
    />
  );
}
