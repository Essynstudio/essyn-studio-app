import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  getValidAccessToken,
  getInitialSyncToken,
  watchCalendarEvents,
} from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/integracoes?error=google_calendar_denied`);
  }

  // Decode state
  let studioId: string;
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(state.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    studioId = decoded.studioId;
  } catch {
    return NextResponse.redirect(`${appUrl}/integracoes?error=invalid_state`);
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.redirect(`${appUrl}/integracoes?error=token_exchange_failed`);
  }

  // Save integration to DB
  const supabase = createServiceSupabase();
  await supabase
    .from("integrations")
    .upsert({
      studio_id: studioId,
      provider: "google_calendar",
      status: "connected",
      credentials: tokens,
      config: { calendar_id: "primary" },
      connected_at: new Date().toISOString(),
    }, { onConflict: "studio_id,provider" });

  // Register Google Calendar push notification webhook (best-effort)
  try {
    const { token: accessToken, refreshed } = await getValidAccessToken(tokens);
    if (refreshed) {
      await supabase
        .from("integrations")
        .update({ credentials: refreshed })
        .eq("studio_id", studioId)
        .eq("provider", "google_calendar");
    }

    const calendarId = "primary";
    const channelId = crypto.randomUUID();
    const webhookToken = crypto.randomUUID();
    const webhookUrl = `${appUrl}/api/integrations/google-calendar/webhook`;

    // Get initial sync token (needed for incremental sync on first webhook)
    const syncToken = await getInitialSyncToken(accessToken, calendarId);

    // Register webhook with Google Calendar
    const { resourceId, expiration } = await watchCalendarEvents(
      accessToken, calendarId, channelId, webhookUrl, webhookToken
    );

    await supabase
      .from("integrations")
      .update({
        webhook_channel_id: channelId,
        webhook_resource_id: resourceId,
        webhook_expiry: expiration,
        webhook_sync_token: syncToken,
        webhook_token: webhookToken,
      })
      .eq("studio_id", studioId)
      .eq("provider", "google_calendar");

  } catch (e) {
    // Webhook registration is best-effort — Essyn→GCal sync still works without it
    console.error("[GCal Webhook] Registration failed (non-fatal):", e);
  }

  return NextResponse.redirect(`${appUrl}/integracoes?success=google_calendar`);
}
