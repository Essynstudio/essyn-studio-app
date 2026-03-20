-- ═══════════════════════════════════════════════════════════════
-- 018: Integrations infrastructure + Asaas payment columns
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Integrations table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id   uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  provider    text NOT NULL,                          -- 'asaas', 'google_calendar', 'whatsapp', 'google_drive', 'autentique'
  status      text NOT NULL DEFAULT 'disconnected',   -- 'disconnected', 'connected', 'error'
  credentials jsonb DEFAULT '{}'::jsonb,              -- encrypted API keys, tokens
  config      jsonb DEFAULT '{}'::jsonb,              -- provider-specific settings (sandbox mode, etc.)
  connected_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE(studio_id, provider)
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owner can manage integrations"
  ON integrations FOR ALL
  USING (studio_id = get_user_studio_id())
  WITH CHECK (studio_id = get_user_studio_id());

-- Index
CREATE INDEX idx_integrations_studio ON integrations(studio_id);

-- ── 2. Asaas columns on installments ───────────────────────────
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS asaas_payment_id  text,
  ADD COLUMN IF NOT EXISTS asaas_billing_url text,
  ADD COLUMN IF NOT EXISTS asaas_pix_qr      text,
  ADD COLUMN IF NOT EXISTS asaas_pix_code    text;

CREATE INDEX idx_installments_asaas ON installments(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;

-- ── 3. Asaas customer mapping on clients ───────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- ── 4. Webhook log table (for auditing) ────────────────────────
CREATE TABLE IF NOT EXISTS webhook_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider    text NOT NULL,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL,
  processed   boolean DEFAULT false,
  error       text,
  created_at  timestamptz DEFAULT now()
);

-- No RLS on webhook_logs — accessed by service role only
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass via default; no user-facing policy needed

-- ── 5. Updated_at trigger for integrations ─────────────────────
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();
