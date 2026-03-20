-- v12: Add missing columns for team invites + members

-- 1. Add custom_role to team_invites (used in API but missing from schema)
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS custom_role text;

-- 2. Add member_type to team_members (interno/freelancer)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS member_type text DEFAULT 'interno';
