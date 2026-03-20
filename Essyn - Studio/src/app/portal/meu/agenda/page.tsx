import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalAgendaClient } from "./agenda-client";

export default async function PortalAgendaPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("portal_session")?.value;
  if (!sessionToken) redirect("/portal?error=session_expired");

  const supabase = createServiceSupabase();

  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) {
    redirect("/portal?error=session_expired");
  }

  // Check if client has Google Calendar connected
  const { data: gcal } = await supabase
    .from("client_google_calendars")
    .select("calendar_id, connected_at")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .single();

  // Fetch upcoming project events for this client (via project → client)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, event_type, event_date, event_location, status")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .is("deleted_at", null)
    .gte("event_date", new Date().toISOString().split("T")[0])
    .order("event_date", { ascending: true })
    .limit(10);

  const oauthResult = params.success === "connected" ? "connected" as const
    : params.error === "google_denied" ? "denied" as const
    : params.error ? "error" as const
    : null;

  return (
    <PortalAgendaClient
      isConnected={!!gcal || oauthResult === "connected"}
      connectedAt={gcal?.connected_at || null}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      essynEvents={(projects || []) as any[]}
      clientId={session.client_id}
      studioId={session.studio_id}
      oauthResult={oauthResult}
    />
  );
}
