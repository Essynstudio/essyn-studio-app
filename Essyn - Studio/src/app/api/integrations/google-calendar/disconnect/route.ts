import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { getValidAccessToken, stopWatchingCalendarEvents, GoogleTokens } from "@/lib/google-calendar";

export async function DELETE() {
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

  // Fetch current integration to stop the webhook channel (best-effort)
  const { data: integration } = await service
    .from("integrations")
    .select("credentials, webhook_channel_id, webhook_resource_id")
    .eq("studio_id", studio.id)
    .eq("provider", "google_calendar")
    .single();

  if (integration?.webhook_channel_id && integration?.webhook_resource_id) {
    try {
      const { token } = await getValidAccessToken(integration.credentials as GoogleTokens);
      await stopWatchingCalendarEvents(
        token,
        integration.webhook_channel_id,
        integration.webhook_resource_id
      );
    } catch {
      // Non-fatal — channel may have already expired
    }
  }

  await service
    .from("integrations")
    .update({
      status: "disconnected",
      credentials: {},
      connected_at: null,
      webhook_channel_id: null,
      webhook_resource_id: null,
      webhook_expiry: null,
      webhook_sync_token: null,
      webhook_token: null,
    })
    .eq("studio_id", studio.id)
    .eq("provider", "google_calendar");

  return NextResponse.json({ success: true });
}
