import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { getValidAccessToken, listCalendarEvents, GoogleTokens } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = createServiceSupabase();
  const { data: integration } = await service
    .from("integrations")
    .select("credentials, config, status")
    .eq("studio_id", studio.id)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .single();

  if (!integration) return NextResponse.json({ connected: false, events: [] });

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = (integration.config as { calendar_id?: string })?.calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) {
    await service
      .from("integrations")
      .update({ credentials: refreshed })
      .eq("studio_id", studio.id)
      .eq("provider", "google_calendar");
  }

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const timeMax = searchParams.get("timeMax") || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

  try {
    const events = await listCalendarEvents(token, calendarId, timeMin, timeMax, 100);
    return NextResponse.json({ connected: true, events });
  } catch {
    return NextResponse.json({ connected: true, events: [], error: "fetch_failed" });
  }
}
