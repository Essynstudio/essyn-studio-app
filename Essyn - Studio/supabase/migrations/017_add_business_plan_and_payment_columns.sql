-- ═══════════════════════════════════════════════════════════════
--  017 — Add 'business' plan, trial tracking, and payment provider columns
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop existing CHECK constraint on studios.plan
alter table public.studios
  drop constraint studios_plan_check;

-- 2. Add new CHECK constraint including 'business'
alter table public.studios
  add constraint studios_plan_check
  check (plan in ('starter', 'pro', 'studio', 'business'));

-- 3. Add trial and payment provider columns
alter table public.studios
  add column trial_ends_at timestamptz,
  add column payment_provider_id text,
  add column payment_subscription_id text;

-- Add comments for documentation
comment on column public.studios.trial_ends_at is 'When the trial period ends (null = no active trial)';
comment on column public.studios.payment_provider_id is 'Asaas customer ID';
comment on column public.studios.payment_subscription_id is 'Asaas subscription ID';
