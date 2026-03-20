-- Migration 010: Portal tables (messages, briefings, project_items)

-- 1. Portal Messages
CREATE TABLE IF NOT EXISTS portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'studio')),
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_messages_pair ON portal_messages(client_id, studio_id, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_messages_unread ON portal_messages(studio_id, sender_type, read_at) WHERE read_at IS NULL;

-- 2. Portal Briefings
CREATE TABLE IF NOT EXISTS portal_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'casamento',
  sections jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'preenchido')),
  markdown_output text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_briefings_unique ON portal_briefings(client_id, studio_id);

-- 3. Project Items (contracted services visible in portal)
CREATE TABLE IF NOT EXISTS project_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'servico' CHECK (category IN ('servico', 'album', 'impressao', 'produto', 'extra')),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'contratado' CHECK (status IN ('contratado', 'em_producao', 'entregue', 'cancelado')),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_items_pair ON project_items(client_id, studio_id);
CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id);

-- RLS
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;

-- Service role bypass (app uses service role key)
CREATE POLICY "service_all_portal_messages" ON portal_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_portal_briefings" ON portal_briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_project_items" ON project_items FOR ALL USING (true) WITH CHECK (true);
