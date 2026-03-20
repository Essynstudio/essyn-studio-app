/**
 * Sincroniza eventos do Essyn com o Google Calendar.
 * Chamado a partir de API routes (server-side) com service role.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  GoogleTokens,
  getValidAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  toGoogleEvent,
} from "./google-calendar";

interface EssynEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  google_calendar_event_id?: string | null;
}

async function getGoogleIntegration(supabase: SupabaseClient, studioId: string) {
  const { data } = await supabase
    .from("integrations")
    .select("credentials, config, status")
    .eq("studio_id", studioId)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .single();
  return data;
}

async function saveRefreshedTokens(
  supabase: SupabaseClient,
  studioId: string,
  tokens: GoogleTokens
) {
  await supabase
    .from("integrations")
    .update({ credentials: tokens })
    .eq("studio_id", studioId)
    .eq("provider", "google_calendar");
}

export async function syncEventCreate(
  supabase: SupabaseClient,
  studioId: string,
  event: EssynEvent
): Promise<void> {
  const integration = await getGoogleIntegration(supabase, studioId);
  if (!integration) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = (integration.config as { calendar_id: string }).calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveRefreshedTokens(supabase, studioId, refreshed);

  const googleEventId = await createCalendarEvent(token, toGoogleEvent(event), calendarId);

  // Save google_calendar_event_id back to the event
  await supabase
    .from("events")
    .update({ google_calendar_event_id: googleEventId })
    .eq("id", event.id);
}

export async function syncEventUpdate(
  supabase: SupabaseClient,
  studioId: string,
  event: EssynEvent
): Promise<void> {
  const integration = await getGoogleIntegration(supabase, studioId);
  if (!integration || !event.google_calendar_event_id) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = (integration.config as { calendar_id: string }).calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveRefreshedTokens(supabase, studioId, refreshed);

  await updateCalendarEvent(token, event.google_calendar_event_id, toGoogleEvent(event), calendarId);
}

export async function syncEventDelete(
  supabase: SupabaseClient,
  studioId: string,
  googleEventId: string
): Promise<void> {
  const integration = await getGoogleIntegration(supabase, studioId);
  if (!integration) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = (integration.config as { calendar_id: string }).calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveRefreshedTokens(supabase, studioId, refreshed);

  await deleteCalendarEvent(token, googleEventId, calendarId);
}

// ─── Client Google Calendar sync ─────────────────────────────────────────────

async function getClientIntegration(supabase: SupabaseClient, clientId: string, studioId: string) {
  const { data } = await supabase
    .from("client_google_calendars")
    .select("credentials, calendar_id")
    .eq("client_id", clientId)
    .eq("studio_id", studioId)
    .single();
  return data;
}

async function saveClientRefreshedTokens(
  supabase: SupabaseClient,
  clientId: string,
  studioId: string,
  tokens: GoogleTokens
) {
  await supabase
    .from("client_google_calendars")
    .update({ credentials: tokens, updated_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("studio_id", studioId);
}

async function getClientIdForEvent(supabase: SupabaseClient, projectId: string | null | undefined): Promise<string | null> {
  if (!projectId) return null;
  const { data } = await supabase
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single();
  return data?.client_id || null;
}

export async function syncEventCreateToClient(
  supabase: SupabaseClient,
  studioId: string,
  event: EssynEvent & { project_id?: string | null }
): Promise<void> {
  const clientId = await getClientIdForEvent(supabase, event.project_id);
  if (!clientId) return;

  const integration = await getClientIntegration(supabase, clientId, studioId);
  if (!integration) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = integration.calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveClientRefreshedTokens(supabase, clientId, studioId, refreshed);

  const googleEventId = await createCalendarEvent(token, toGoogleEvent(event), calendarId);

  await supabase
    .from("events")
    .update({ client_google_event_id: googleEventId })
    .eq("id", event.id);
}

export async function syncEventUpdateToClient(
  supabase: SupabaseClient,
  studioId: string,
  event: EssynEvent & { project_id?: string | null; client_google_event_id?: string | null }
): Promise<void> {
  if (!event.client_google_event_id) return;

  const clientId = await getClientIdForEvent(supabase, event.project_id);
  if (!clientId) return;

  const integration = await getClientIntegration(supabase, clientId, studioId);
  if (!integration) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = integration.calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveClientRefreshedTokens(supabase, clientId, studioId, refreshed);

  await updateCalendarEvent(token, event.client_google_event_id, toGoogleEvent(event), calendarId);
}

export async function syncEventDeleteFromClient(
  supabase: SupabaseClient,
  studioId: string,
  clientGoogleEventId: string,
  clientId: string
): Promise<void> {
  const integration = await getClientIntegration(supabase, clientId, studioId);
  if (!integration) return;

  const tokens = integration.credentials as GoogleTokens;
  const calendarId = integration.calendar_id || "primary";

  const { token, refreshed } = await getValidAccessToken(tokens);
  if (refreshed) await saveClientRefreshedTokens(supabase, clientId, studioId, refreshed);

  await deleteCalendarEvent(token, clientGoogleEventId, calendarId);
}
