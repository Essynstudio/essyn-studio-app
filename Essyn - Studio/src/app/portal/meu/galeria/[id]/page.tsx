import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { PortalGalleryClient } from "@/app/g/[token]/portal-client";
import { PortalProvider, type PortalContextData } from "@/app/g/[token]/portal-context";
import type { PortalBranding } from "@/lib/types";
import { GaleriaEmBreve } from "./galeria-em-breve";

interface Props {
  params: Promise<{ id: string }>;
}

const DEFAULT_BRANDING: PortalBranding = {
  primaryColor: "#A58D66",
  bgColor: "#FDFBF7",
  welcomeMessage: "Bem-vindo ao seu portal",
  logoUrl: null,
  portalBgUrl: null,
};

export default async function PortalGaleriaPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("portal_session")?.value;
  if (!sessionToken) redirect("/portal?error=session_expired");

  const supabase = createServiceSupabase();

  // Validate session
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) redirect("/portal?error=session_expired");

  // Fetch gallery + studio + client + project
  const [galleryResult, studioResult, clientResult] = await Promise.all([
    supabase
      .from("galleries")
      .select("id, name, status, photo_count, download_enabled, branding, delivery_deadline_date, projects(id, name, event_type, event_date)")
      .eq("id", id)
      .eq("client_id", session.client_id)
      .eq("studio_id", session.studio_id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("studios")
      .select("id, name, settings")
      .eq("id", session.studio_id)
      .single(),
    supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", session.client_id)
      .single(),
  ]);

  if (!galleryResult.data) return notFound();

  const gallery = galleryResult.data;
  const studio = studioResult.data;
  const client = clientResult.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = (gallery as any).projects || null;

  // Resolve branding
  const galleryBranding = (gallery.branding as Record<string, string>) || {};
  const studioSettings = (studio?.settings as Record<string, unknown>) || {};
  const portalConfig = studioSettings.portal as Record<string, string> | undefined;

  const branding: PortalBranding = {
    primaryColor: galleryBranding.primary_color || portalConfig?.primaryColor || DEFAULT_BRANDING.primaryColor,
    bgColor: galleryBranding.bg_color || portalConfig?.bgColor || DEFAULT_BRANDING.bgColor,
    welcomeMessage: galleryBranding.welcome_message || portalConfig?.welcomeMessage || DEFAULT_BRANDING.welcomeMessage,
    logoUrl: galleryBranding.logo_url || null,
    portalBgUrl: portalConfig?.portalBgUrl || null,
  };

  // If gallery is "agendada", show "coming soon" page
  if (gallery.status === "agendada") {
    return (
      <GaleriaEmBreve
        galleryName={gallery.name}
        eventDate={project?.event_date || null}
        deliveryDate={gallery.delivery_deadline_date as string | null}
        studioName={studio?.name || "seu fotógrafo"}
        primaryColor={branding.primaryColor}
      />
    );
  }

  // Fetch photos and folders
  const [photosResult, foldersResult] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("id, storage_path, filename, file_url, thumbnail_url, folder_id, sort_order, width, height, size_bytes, favorited, selected, created_at")
      .eq("gallery_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gallery_folders")
      .select("id, name, cover_photo_id, sort_order")
      .eq("gallery_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  // Build context so PortalGalleryClient works
  const contextValue: PortalContextData = {
    token: "",
    role: "selector",
    gallery: {
      id: gallery.id,
      name: gallery.name,
      status: gallery.status as PortalContextData["gallery"]["status"],
      photoCount: gallery.photo_count || 0,
      downloadEnabled: gallery.download_enabled ?? true,
    },
    project: project
      ? { id: project.id, name: project.name, eventType: project.event_type, eventDate: project.event_date }
      : null,
    studio: { id: studio?.id || "", name: studio?.name || "Estúdio" },
    client: client ? { id: client.id, name: client.name, email: client.email } : null,
    branding,
  };

  return (
    <PortalProvider value={contextValue}>
      <PortalGalleryClient
        photos={(photosResult.data || []) as never[]}
        folders={(foldersResult.data || []) as never[]}
      />
    </PortalProvider>
  );
}
