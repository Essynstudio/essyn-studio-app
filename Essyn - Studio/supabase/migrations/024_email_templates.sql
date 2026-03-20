-- Email templates per studio
CREATE TABLE IF NOT EXISTS email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  template_key TEXT,       -- e.g. "galeria-pronta", "contrato-enviado" (null = custom)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active template per key per studio
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_studio_key
  ON email_templates (studio_id, template_key)
  WHERE template_key IS NOT NULL;

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio members can manage email templates"
  ON email_templates
  FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
      UNION
      SELECT studio_id FROM team_members WHERE user_id = auth.uid() AND active = true
    )
  );
