-- ═══════════════════════════════════════════════════════════════
-- 022: Client Google Calendar integration
-- ═══════════════════════════════════════════════════════════════

-- ── 1. google_calendar_event_id on events (studio owner sync) ──
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_calendar_event_id text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_google_event_id text;

CREATE INDEX IF NOT EXISTS idx_events_google_id ON events(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_client_google_id ON events(client_google_event_id) WHERE client_google_event_id IS NOT NULL;

-- ── 2. client_google_calendars table ────────────────────────────
CREATE TABLE IF NOT EXISTS client_google_calendars (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  studio_id    uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  credentials  jsonb NOT NULL,
  calendar_id  text NOT NULL DEFAULT 'primary',
  connected_at timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(client_id, studio_id)
);

ALTER TABLE client_google_calendars ENABLE ROW LEVEL SECURITY;

-- Service role only — portal uses custom session auth
-- No user-facing policies; accessed exclusively via service role

CREATE INDEX IF NOT EXISTS idx_client_gcal_client ON client_google_calendars(client_id, studio_id);
