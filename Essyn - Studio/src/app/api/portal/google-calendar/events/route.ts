import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getValidAccessToken, listCalendarEvents, GoogleTokens } from "@/lib/google-calendar";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("portal_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceSupabase();
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", token)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from("client_google_calendars")
    .select("credentials, calendar_id")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .single();

  if (!integration) return NextResponse.json({ connected: false, events: [] });

  const credentials = integration.credentials as GoogleTokens;
  const { token: accessToken, refreshed } = await getValidAccessToken(credentials);

  if (refreshed) {
    await supabase
      .from("client_google_calendars")
      .update({ credentials: refreshed, updated_at: new Date().toISOString() })
      .eq("client_id", session.client_id)
      .eq("studio_id", session.studio_id);
  }

  const now = new Date().toISOString();
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await listCalendarEvents(
      accessToken,
      integration.calendar_id || "primary",
      now,
      thirtyDaysOut,
      50
    );
    return NextResponse.json({ connected: true, events });
  } catch {
    return NextResponse.json({ connected: true, events: [], error: "fetch_failed" });
  }
}
