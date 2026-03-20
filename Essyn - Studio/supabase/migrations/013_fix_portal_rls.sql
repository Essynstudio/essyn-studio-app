-- v13: Tighten portal RLS policies
-- Previously all portal tables had FOR SELECT USING (true) which is too permissive

-- 1. Fix client_portal_tokens: only allow reading by exact token match
DROP POLICY IF EXISTS "portal_tokens_public_read" ON public.client_portal_tokens;
-- Service role (used in API routes) bypasses RLS, so no public read needed

-- 2. Fix client_portal_tokens update: only allow marking as used via service role
DROP POLICY IF EXISTS "portal_tokens_public_update" ON public.client_portal_tokens;

-- 3. Fix client_portal_sessions: remove public read
DROP POLICY IF EXISTS "portal_sessions_public_read" ON public.client_portal_sessions;
DROP POLICY IF EXISTS "portal_sessions_public_insert" ON public.client_portal_sessions;

-- 4. Fix team_invites: remove overly permissive public read
DROP POLICY IF EXISTS "invites_public_read_by_token" ON public.team_invites;
-- Service role handles token validation in API routes
