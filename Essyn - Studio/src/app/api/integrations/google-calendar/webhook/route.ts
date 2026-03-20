/**
 * Google Calendar Push Notification Webhook
 *
 * Google calls this endpoint (POST) whenever events change in a watched calendar.
 * We fetch the delta using incremental sync (syncToken) and apply it to Essyn events.
 *
 * Docs: https://developers.google.com/calendar/api/guides/push
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  GoogleTokens,
  getValidAccessToken,
  getInitialSyncToken,
  watchCalendarEvents,
  listCalendarEventsIncremental,
  fromGoogleEvent,
} from "@/lib/google-calendar";

// Google sends a "sync" ping when the channel is first registered — nothing to do
const SYNC_STATE = "sync";

export async function POST(req: NextRequest) {
  const channelId = req.headers.get("X-Goog-Channel-ID");
  const resourceState = req.headers.get("X-Goog-Resource-State");
  const channelToken = req.headers.get("X-Goog-Channel-Token");

  // Acknowledge immediately — Google expects 200 within 30s
  if (!channelId) return NextResponse.json({ ok: true });

  // Initial handshake ping — no events to process
  if (resourceState === SYNC_STATE) return NextResponse.json({ ok: true });

  const supabase = createServiceSupabase();

  // Look up the integration by channel ID
  const { data: integration } = await supabase
    .from("integrations")
    .select("studio_id, credentials, config, webhook_sync_token, webhook_token, webhook_channel_id, webhook_resource_id")
    .eq("webhook_channel_id", channelId)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .single();

  if (!integration) return NextResponse.json({ ok: true });

  // Validate webhook token to prevent spoofed requests
  if (channelToken !== integration.webhook_token) {
    console.warn(`[GCal Webhook] Invalid token for channel ${channelId}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studioId = integration.studio_id;
  const tokens = integration.credentials as GoogleTokens;
  const calendarId = (integration.config as { calendar_id?: string })?.calendar_id || "primary";

  // Get valid access token, refreshing if expired
  let accessToken: string;
  try {
    const { token, refreshed } = await getValidAccessToken(tokens);
    accessToken = token;
    if (refreshed) {
      await supabase
        .from("integrations")
        .update({ credentials: refreshed })
        .eq("studio_id", studioId)
        .eq("provider", "google_calendar");
    }
  } catch (e) {
    console.error("[GCal Webhook] Token refresh failed:", e);
    return NextResponse.json({ ok: true });
  }

  // Fetch only the events that changed since last sync
  let items: Awaited<ReturnType<typeof listCalendarEventsIncremental>>["items"] = [];
  let nextSyncToken: string | undefined;

  try {
    const result = await listCalendarEventsIncremental(
      accessToken,
      calendarId,
      integration.webhook_sync_token || ""
    );
    items = result.items;
    nextSyncToken = result.nextSyncToken;
  } catch (e: unknown) {
    // 410 Gone: sync token expired — reset to full resync
    if ((e as { status?: number }).status === 410) {
      console.warn(`[GCal Webhook] Sync token expired for studio ${studioId}, resetting`);
      try {
        const newSyncToken = await getInitialSyncToken(accessToken, calendarId);
        await supabase
          .from("integrations")
          .update({ webhook_sync_token: newSyncToken })
          .eq("studio_id", studioId)
          .eq("provider", "google_calendar");
      } catch {}
      return NextResponse.json({ ok: true });
    }
    console.error("[GCal Webhook] Failed to fetch incremental events:", e);
    return NextResponse.json({ ok: true });
  }

  // Save the new sync token so next webhook picks up from here
  if (nextSyncToken) {
    await supabase
      .from("integrations")
      .update({ webhook_sync_token: nextSyncToken })
      .eq("studio_id", studioId)
      .eq("provider", "google_calendar");
  }

  // Process each changed event
  for (const event of items) {
    if (!event.id) continue;

    if (event.status === "cancelled") {
      // Event deleted in Google Calendar → soft-delete in Essyn
      await supabase
        .from("events")
        .update({ deleted_at: new Date().toISOString() })
        .eq("google_calendar_event_id", event.id)
        .eq("studio_id", studioId)
        .is("deleted_at", null);

    } else {
      // Event created or updated in Google Calendar
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("google_calendar_event_id", event.id)
        .eq("studio_id", studioId)
        .is("deleted_at", null)
        .single();

      const payload = fromGoogleEvent(event, studioId);

      if (existing) {
        // Update existing Essyn event (don't overwrite user-set fields like project_id/status)
        await supabase
          .from("events")
          .update({
            title: payload.title,
            description: payload.description,
            location: payload.location,
            start_at: payload.start_at,
            end_at: payload.end_at,
            all_day: payload.all_day,
          })
          .eq("id", existing.id);
      } else {
        // New event created in Google Calendar → create in Essyn
        await supabase.from("events").insert(payload);
      }
    }
  }


  return NextResponse.json({ ok: true });
}

/**
 * GET handler: Re-register webhook (called manually or by cron when channel expires)
 * Usage: GET /api/integrations/google-calendar/webhook?action=renew&studioId=xxx
 * Protected: only callable server-side via service role check
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const secret = searchParams.get("secret");

  if (action !== "renew" || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const webhookUrl = `${appUrl}/api/integrations/google-calendar/webhook`;

  // Find integrations with expiring webhooks (within next 2 days)
  const expiryThreshold = Date.now() + 2 * 24 * 60 * 60 * 1000;
  const { data: integrations } = await supabase
    .from("integrations")
    .select("studio_id, credentials, config, webhook_channel_id, webhook_resource_id, webhook_token")
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .lt("webhook_expiry", expiryThreshold);

  if (!integrations?.length) return NextResponse.json({ renewed: 0 });

  let renewed = 0;
  for (const integration of integrations) {
    try {
      const tokens = integration.credentials as GoogleTokens;
      const { token: accessToken } = await getValidAccessToken(tokens);
      const calendarId = (integration.config as { calendar_id?: string })?.calendar_id || "primary";

      const channelId = crypto.randomUUID();
      const webhookToken = integration.webhook_token || crypto.randomUUID();

      const { resourceId, expiration } = await watchCalendarEvents(
        accessToken, calendarId, channelId, webhookUrl, webhookToken
      );

      const syncToken = await getInitialSyncToken(accessToken, calendarId);

      await supabase
        .from("integrations")
        .update({
          webhook_channel_id: channelId,
          webhook_resource_id: resourceId,
          webhook_expiry: expiration,
          webhook_sync_token: syncToken,
        })
        .eq("studio_id", integration.studio_id)
        .eq("provider", "google_calendar");

      renewed++;
    } catch (e) {
      console.error(`[GCal Webhook Renew] Failed for studio ${integration.studio_id}:`, e);
    }
  }

  return NextResponse.json({ renewed });
}
