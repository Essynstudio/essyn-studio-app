-- Add Google Calendar webhook fields to integrations table
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS webhook_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_resource_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_expiry BIGINT,
  ADD COLUMN IF NOT EXISTS webhook_sync_token TEXT,
  ADD COLUMN IF NOT EXISTS webhook_token TEXT;

-- Index to quickly look up integration by channel_id (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_integrations_webhook_channel_id
  ON integrations (webhook_channel_id)
  WHERE webhook_channel_id IS NOT NULL;
