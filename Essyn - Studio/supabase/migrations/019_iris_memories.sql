-- ═══════════════════════════════════════════════
-- Iris — Persistent Memory System
-- Each studio accumulates structured memories that
-- persist across sessions. Upsert guarantees one
-- value per (studio, category, key).
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS iris_memories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id   uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  category    text NOT NULL,  -- preferencia | preco | estilo | cliente | operacao | observacao
  key         text NOT NULL,
  value       text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(studio_id, category, key)
);

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION update_iris_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_iris_memories_updated_at
BEFORE UPDATE ON iris_memories
FOR EACH ROW EXECUTE FUNCTION update_iris_memories_updated_at();

-- Index for fast studio lookups
CREATE INDEX IF NOT EXISTS idx_iris_memories_studio_id ON iris_memories(studio_id);

-- Row Level Security — each studio sees only its own memories
ALTER TABLE iris_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members can manage their own iris memories"
  ON iris_memories
  FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
      UNION
      SELECT studio_id FROM team_members WHERE user_id = auth.uid() AND active = true
    )
  );
