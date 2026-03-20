import { cookies } from "next/headers";
import { createServiceSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalProvider, type PortalContextData } from "./portal-context";
import type { PortalBranding } from "@/lib/types";
import { PasswordGate } from "./password-gate";

interface Props {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

const DEFAULT_BRANDING: PortalBranding = {
  primaryColor: "#A58D66",
  bgColor: "#FDFBF7",
  welcomeMessage: "Bem-vindo ao seu portal",
  logoUrl: null,
  portalBgUrl: null,
};

export default async function PortalLayout({ children, params }: Props) {
  const { token } = await params;
  const supabase = createServiceSupabase();

  // Resolve token → invite → gallery → studio + project + client
  const { data: invite } = await supabase
    .from("gallery_invites")
    .select(`
      id, token, role, opened_at,
      galleries!inner (
        id, name, slug, status, photo_count, download_enabled, branding,
        privacy, password_hash, expires_at,
        studio_id,
        studios!inner (id, name, settings),
        projects (id, name, event_type, event_date),
        clients (id, name, email)
      )
    `)
    .eq("token", token)
    .single();

  if (!invite) return notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const gallery = invite.galleries as any;
  const studio = gallery?.studios;
  const project = gallery?.projects || null;
  const client = gallery?.clients || null;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // ── Check expiration ──
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6">
        <div className="text-center max-w-sm">
          <p className="text-[20px] font-semibold text-[#0C100E] mb-2">Link expirado</p>
          <p className="text-[14px] text-[#7A8A8F]">
            Este link de galeria expirou. Entre em contato com {studio?.name || "o fotógrafo"} para solicitar um novo acesso.
          </p>
        </div>
      </div>
    );
  }

  // ── Check password protection ──
  if (gallery.privacy === "senha" && gallery.password_hash) {
    const cookieStore = await cookies();
    const pwdCookie = cookieStore.get(`gallery_pwd_${gallery.id}`);
    if (!pwdCookie || pwdCookie.value !== gallery.password_hash) {
      return <PasswordGate galleryId={gallery.id} studioName={studio?.name || "Estúdio"} />;
    }
  }

  // Mark first open
  if (!invite.opened_at) {
    await supabase
      .from("gallery_invites")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  // Increment gallery views
  const { data: viewData } = await supabase
    .from("galleries")
    .select("views")
    .eq("id", gallery.id)
    .single();
  await supabase
    .from("galleries")
    .update({ views: (viewData?.views || 0) + 1 })
    .eq("id", gallery.id);

  // Resolve branding
  const galleryBranding = gallery?.branding || {};
  const studioPortal = (studio?.settings as Record<string, unknown>)?.portal as Record<string, string> | undefined;

  const branding: PortalBranding = {
    primaryColor: galleryBranding.primary_color || studioPortal?.primaryColor || DEFAULT_BRANDING.primaryColor,
    bgColor: galleryBranding.bg_color || studioPortal?.bgColor || DEFAULT_BRANDING.bgColor,
    welcomeMessage: galleryBranding.welcome_message || studioPortal?.welcomeMessage || DEFAULT_BRANDING.welcomeMessage,
    logoUrl: galleryBranding.logo_url || null,
    portalBgUrl: studioPortal?.portalBgUrl || null,
  };

  const contextValue: PortalContextData = {
    token,
    role: invite.role as PortalContextData["role"],
    gallery: {
      id: gallery.id,
      name: gallery.name,
      status: gallery.status,
      photoCount: gallery.photo_count || 0,
      downloadEnabled: gallery.download_enabled ?? true,
    },
    project: project
      ? {
          id: project.id,
          name: project.name,
          eventType: project.event_type,
          eventDate: project.event_date,
        }
      : null,
    studio: {
      id: studio.id,
      name: studio.name || "Estúdio",
    },
    client: client
      ? {
          id: client.id,
          name: client.name,
          email: client.email,
        }
      : null,
    branding,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: branding.bgColor }}>
      <PortalProvider value={contextValue}>{children}</PortalProvider>
    </div>
  );
}
