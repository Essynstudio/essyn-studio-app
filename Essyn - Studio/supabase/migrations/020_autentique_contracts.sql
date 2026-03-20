-- ═══════════════════════════════════════
--  020: Autentique — Electronic Signature
-- ═══════════════════════════════════════
-- Adds fields for Autentique e-signature integration.

alter table public.contracts
  add column if not exists autentique_document_id text,
  add column if not exists autentique_signing_url text,
  add column if not exists viewed_at timestamptz,
  add column if not exists accepted_at timestamptz;

-- Index for webhook lookups
create index if not exists idx_contracts_autentique on public.contracts(autentique_document_id)
  where autentique_document_id is not null;
