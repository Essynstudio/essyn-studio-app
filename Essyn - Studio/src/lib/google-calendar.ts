/**
 * Google Calendar API client
 * Uses OAuth2 with stored refresh tokens
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // Unix ms
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
}

// ─── Token management ────────────────────────────────────────────────────────

export function getOAuthUrl(state: string, redirectPath = "/api/integrations/google-calendar/callback"): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}`,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectPath = "/api/integrations/google-calendar/callback"): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}`,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    error?: string;
  };

  if (data.error) throw new Error(data.error);

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(tokens: GoogleTokens): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json() as {
    access_token: string;
    expires_in: number;
    error?: string;
  };

  if (data.error) throw new Error(data.error);

  return {
    ...tokens,
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

/** Returns valid access token, refreshing if needed */
export async function getValidAccessToken(tokens: GoogleTokens): Promise<{ token: string; refreshed: GoogleTokens | null }> {
  if (tokens.expiry_date > Date.now() + 60_000) {
    return { token: tokens.access_token, refreshed: null };
  }
  const refreshed = await refreshAccessToken(tokens);
  return { token: refreshed.access_token, refreshed };
}

// ─── Calendar API calls ───────────────────────────────────────────────────────

async function calendarFetch(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown
): Promise<Response> {
  return fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function createCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent,
  calendarId = "primary"
): Promise<string> {
  const res = await calendarFetch("POST", `/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, event);
  const data = await res.json() as { id: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: GoogleCalendarEvent,
  calendarId = "primary"
): Promise<void> {
  const res = await calendarFetch(
    "PUT",
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    accessToken,
    event
  );
  const data = await res.json() as { error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await calendarFetch(
    "DELETE",
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    accessToken
  );
}

export interface GoogleCalendarListEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  colorId?: string;
}

export async function listCalendarEvents(
  accessToken: string,
  calendarId = "primary",
  timeMin?: string,
  timeMax?: string,
  maxResults = 50
): Promise<GoogleCalendarListEvent[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(maxResults),
    ...(timeMin ? { timeMin } : {}),
    ...(timeMax ? { timeMax } : {}),
  });
  const res = await calendarFetch(
    "GET",
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    accessToken
  );
  const data = await res.json() as { items?: GoogleCalendarListEvent[]; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.items || [];
}

// ─── Push notifications (webhooks) ───────────────────────────────────────────

export async function watchCalendarEvents(
  accessToken: string,
  calendarId: string,
  channelId: string,
  webhookUrl: string,
  webhookToken: string
): Promise<{ resourceId: string; expiration: number }> {
  const res = await calendarFetch(
    "POST",
    `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    accessToken,
    { id: channelId, type: "web_hook", address: webhookUrl, token: webhookToken }
  );
  const data = await res.json() as { resourceId: string; expiration: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return { resourceId: data.resourceId, expiration: Number(data.expiration) };
}

export async function stopWatchingCalendarEvents(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  await calendarFetch("POST", "/channels/stop", accessToken, { id: channelId, resourceId });
}

/** Get a sync token by doing a minimal list (no items) — used to bootstrap incremental sync */
export async function getInitialSyncToken(
  accessToken: string,
  calendarId: string
): Promise<string> {
  const res = await calendarFetch(
    "GET",
    `/calendars/${encodeURIComponent(calendarId)}/events?maxResults=1&showDeleted=false`,
    accessToken
  );
  const data = await res.json() as { nextSyncToken?: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.nextSyncToken || "";
}

export interface GoogleCalendarIncrementalEvent extends GoogleCalendarListEvent {
  status?: string; // "cancelled" = deleted
}

/** Fetch only events changed since last sync using syncToken */
export async function listCalendarEventsIncremental(
  accessToken: string,
  calendarId: string,
  syncToken: string
): Promise<{ items: GoogleCalendarIncrementalEvent[]; nextSyncToken?: string }> {
  const params = new URLSearchParams({ syncToken, showDeleted: "true" });
  const res = await calendarFetch(
    "GET",
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    accessToken
  );
  if (res.status === 410) {
    // Sync token expired — caller must do full resync
    throw Object.assign(new Error("Sync token expired"), { status: 410 });
  }
  const data = await res.json() as {
    items?: GoogleCalendarIncrementalEvent[];
    nextSyncToken?: string;
    error?: { message: string };
  };
  if (data.error) throw new Error(data.error.message);
  return { items: data.items || [], nextSyncToken: data.nextSyncToken };
}

// ─── Map Essyn event → Google Calendar event ─────────────────────────────────

export function toGoogleEvent(event: {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
}): GoogleCalendarEvent {
  const tz = "America/Sao_Paulo";

  if (event.all_day) {
    const startDate = event.start_at.split("T")[0];
    const endDate = event.end_at ? event.end_at.split("T")[0] : startDate;
    return {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  return {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    start: { dateTime: event.start_at, timeZone: tz },
    end: { dateTime: event.end_at || event.start_at, timeZone: tz },
  };
}

// ─── Map Google Calendar event → Essyn event payload ─────────────────────────

export function fromGoogleEvent(
  event: GoogleCalendarIncrementalEvent,
  studioId: string
): {
  studio_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status: "confirmado";
  color: string;
  google_calendar_event_id: string;
} {
  const isAllDay = !!event.start.date && !event.start.dateTime;
  const startAt = event.start.dateTime || (event.start.date ? event.start.date + "T00:00:00" : "");
  const endAt = event.end.dateTime || (event.end.date ? event.end.date + "T23:59:59" : startAt);
  return {
    studio_id: studioId,
    title: event.summary || "Evento do Google Calendar",
    description: event.description || null,
    location: event.location || null,
    start_at: startAt,
    end_at: endAt,
    all_day: isAllDay,
    status: "confirmado",
    color: "#4285F4",
    google_calendar_event_id: event.id!,
  };
}
