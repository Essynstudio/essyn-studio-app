import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PortalBranding } from "@/lib/types";
import { PortalShell } from "./portal-shell";

export interface PortalSessionData {
  client: {
    id: string;
    name: string;
    email: string;
  };
  studio: {
    id: string;
    name: string;
    phone: string | null;
  };
  branding: PortalBranding;
  eventType: string;
}

const DEFAULT_BRANDING: PortalBranding = {
  primaryColor: "#A58D66",
  bgColor: "#FDFBF7",
  welcomeMessage: "Bem-vindo ao seu portal",
  logoUrl: null,
  portalBgUrl: null,
};

export default async function PortalMeuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("portal_session")?.value;

  if (!sessionToken) {
    redirect("/portal?error=session_expired");
  }

  const supabase = createServiceSupabase();

  // Validate session
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    redirect("/portal?error=session_expired");
  }

  // Fetch client + studio data
  const [clientResult, studioResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", session.client_id)
      .single(),
    supabase
      .from("studios")
      .select("id, name, phone, settings")
      .eq("id", session.studio_id)
      .single(),
  ]);

  if (!clientResult.data || !studioResult.data) {
    redirect("/portal?error=session_expired");
  }

  // Fetch main project event_type
  const { data: mainProject } = await supabase
    .from("projects")
    .select("event_type")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .in("status", ["rascunho", "confirmado", "producao", "edicao", "entregue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const eventType = mainProject?.event_type || "outro";

  // Update last access
  await supabase
    .from("clients")
    .update({ portal_last_access: new Date().toISOString() })
    .eq("id", session.client_id);

  // Resolve branding
  const studioSettings = (studioResult.data.settings as Record<string, unknown>) || {};
  const portalConfig = studioSettings.portal as Record<string, string> | undefined;

  const branding: PortalBranding = {
    primaryColor: portalConfig?.primaryColor || DEFAULT_BRANDING.primaryColor,
    bgColor: portalConfig?.bgColor || DEFAULT_BRANDING.bgColor,
    welcomeMessage: portalConfig?.welcomeMessage || DEFAULT_BRANDING.welcomeMessage,
    logoUrl: null,
    portalBgUrl: portalConfig?.portalBgUrl || DEFAULT_BRANDING.portalBgUrl,
  };

  const sessionData: PortalSessionData = {
    client: {
      id: clientResult.data.id,
      name: clientResult.data.name,
      email: clientResult.data.email,
    },
    studio: {
      id: studioResult.data.id,
      name: studioResult.data.name,
      phone: studioResult.data.phone || null,
    },
    branding,
    eventType,
  };

  return (
    <PortalShell sessionData={sessionData}>
      {children}
    </PortalShell>
  );
}
