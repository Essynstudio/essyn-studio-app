-- v11: team invites + member permissions

-- 1. Add permissions column to team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- 2. Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'fotografo',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS for team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_studio_access" ON public.team_invites FOR ALL USING (
  studio_id IN (SELECT id FROM public.studios WHERE owner_id = auth.uid())
);

-- 4. Allow public read by token (for invite acceptance page)
CREATE POLICY "invites_public_read_by_token" ON public.team_invites FOR SELECT USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON public.team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_studio ON public.team_invites(studio_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
