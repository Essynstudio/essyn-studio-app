-- ═══════════════════════════════════════════════
-- Migration v9 — Client Portal Authentication
-- Magic link + session-based access for clients
-- ═══════════════════════════════════════════════

-- 1. Magic link tokens (short-lived, 15 min)
CREATE TABLE IF NOT EXISTS public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON public.client_portal_tokens(token);
ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Public read (needed for token validation without auth)
CREATE POLICY "portal_tokens_public_read" ON public.client_portal_tokens
  FOR SELECT USING (true);

-- Studio can create tokens
CREATE POLICY "portal_tokens_studio_insert" ON public.client_portal_tokens
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

-- Public can update (mark as used)
CREATE POLICY "portal_tokens_public_update" ON public.client_portal_tokens
  FOR UPDATE USING (true);

-- 2. Portal sessions (long-lived, 30 days)
CREATE TABLE IF NOT EXISTS public.client_portal_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  session_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON public.client_portal_sessions(session_token);
ALTER TABLE public.client_portal_sessions ENABLE ROW LEVEL SECURITY;

-- Public read (needed for session validation)
CREATE POLICY "portal_sessions_public_read" ON public.client_portal_sessions
  FOR SELECT USING (true);

-- Public insert (created during magic link validation)
CREATE POLICY "portal_sessions_public_insert" ON public.client_portal_sessions
  FOR INSERT WITH CHECK (true);

-- 3. Track portal access on clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_sent_at timestamptz;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_last_access timestamptz;
