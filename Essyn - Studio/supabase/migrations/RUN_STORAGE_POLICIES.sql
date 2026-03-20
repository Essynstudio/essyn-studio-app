-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — Storage Policies
--  Cole no Supabase SQL Editor e clique Run.
--  Configura quem pode upload/download nos buckets.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════
--  BUCKET: gallery-photos
-- ═══════════════════════════════════════

-- Studio can upload photos (INSERT)
DO $$ BEGIN
  CREATE POLICY "studio_upload_gallery" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'gallery-photos'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can read own photos (SELECT)
DO $$ BEGIN
  CREATE POLICY "studio_read_gallery" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'gallery-photos'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can update own photos (UPDATE)
DO $$ BEGIN
  CREATE POLICY "studio_update_gallery" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'gallery-photos'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can delete own photos (DELETE)
DO $$ BEGIN
  CREATE POLICY "studio_delete_gallery" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'gallery-photos'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public galleries: anyone can view photos (for client portal)
DO $$ BEGIN
  CREATE POLICY "public_gallery_view" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (
      bucket_id = 'gallery-photos'
      AND EXISTS (
        SELECT 1 FROM public.galleries g
        JOIN public.gallery_photos gp ON gp.gallery_id = g.id
        WHERE gp.storage_path = name AND g.privacy = 'publico'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invited clients can view photos via invite token
DO $$ BEGIN
  CREATE POLICY "invited_client_view_gallery" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (
      bucket_id = 'gallery-photos'
      AND EXISTS (
        SELECT 1 FROM public.gallery_photos gp
        JOIN public.gallery_invites gi ON gi.gallery_id = gp.gallery_id
        WHERE gp.storage_path = name AND gi.token IS NOT NULL
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════
--  BUCKET: contracts
-- ═══════════════════════════════════════

-- Studio can upload contracts (INSERT)
DO $$ BEGIN
  CREATE POLICY "studio_upload_contracts" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'contracts'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can read own contracts (SELECT)
DO $$ BEGIN
  CREATE POLICY "studio_read_contracts" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'contracts'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can update own contracts (UPDATE)
DO $$ BEGIN
  CREATE POLICY "studio_update_contracts" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'contracts'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Studio can delete own contracts (DELETE)
DO $$ BEGIN
  CREATE POLICY "studio_delete_contracts" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'contracts'
      AND (storage.foldername(name))[1] = (SELECT id::text FROM public.studios WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════
--  DONE!
-- ═══════════════════════════════════════
