-- ═══════════════════════════════════════
--  006: Contracts — File upload support
-- ═══════════════════════════════════════
-- Adds file_url column to contracts table for storing uploaded PDF references.
-- Storage bucket "contracts" must be created manually in Supabase Dashboard.

-- 1. Add file_url column to contracts
alter table public.contracts
  add column if not exists file_url text;

-- 2. STORAGE BUCKET (reference — create via Supabase Dashboard > Storage)
--
--   Bucket name: contracts
--   Public: false (private bucket)
--   File size limit: 10MB
--   Allowed MIME types: application/pdf
--
-- Storage policies (add in Dashboard > Storage > Policies):
--
--   INSERT: authenticated users where (bucket_id = 'contracts')
--     and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   SELECT: authenticated users where (bucket_id = 'contracts')
--     and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   UPDATE: authenticated users where (bucket_id = 'contracts')
--     and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   DELETE: authenticated users where (bucket_id = 'contracts')
--     and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
