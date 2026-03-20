-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — ALL PENDING MIGRATIONS (v3 to v7)
--  Cole este arquivo INTEIRO no Supabase Dashboard > SQL Editor
--  e clique "Run". Todas as migrations rodam em sequencia.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION v3: GALLERY MODULE
-- ═══════════════════════════════════════════════════════════════

-- 1. ALTER galleries — add deadline + branding columns
ALTER TABLE public.galleries
  ADD COLUMN IF NOT EXISTS delivery_deadline_days integer,
  ADD COLUMN IF NOT EXISTS delivery_deadline_date date,
  ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_galleries_deadline ON public.galleries(studio_id, delivery_deadline_date)
  WHERE status NOT IN ('entregue', 'arquivado');

-- 2. GALLERY FOLDERS
CREATE TABLE IF NOT EXISTS public.gallery_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  cover_photo_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_folders_gallery ON public.gallery_folders(gallery_id);
ALTER TABLE public.gallery_folders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "gallery_folders_studio" ON public.gallery_folders
    FOR ALL USING (studio_id = public.get_user_studio_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. ALTER gallery_photos — add folder_id and storage_path
ALTER TABLE public.gallery_photos
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.gallery_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE INDEX IF NOT EXISTS idx_gallery_photos_folder ON public.gallery_photos(folder_id);

-- 4. GALLERY COMMENTS (Proofing)
CREATE TABLE IF NOT EXISTS public.gallery_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_type text NOT NULL DEFAULT 'client' CHECK (author_type IN ('client', 'studio')),
  content text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_gallery ON public.gallery_comments(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_photo ON public.gallery_comments(photo_id);
ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "gallery_comments_studio" ON public.gallery_comments
    FOR ALL USING (studio_id = public.get_user_studio_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. GALLERY SELECTIONS (Client photo picks)
DO $$ BEGIN
  CREATE TYPE public.selection_status AS ENUM ('aprovada', 'rejeitada', 'duvida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.gallery_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  status selection_status NOT NULL DEFAULT 'aprovada',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, photo_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_gallery_selections_gallery ON public.gallery_selections(gallery_id);
ALTER TABLE public.gallery_selections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "gallery_selections_studio" ON public.gallery_selections
    FOR ALL USING (studio_id = public.get_user_studio_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. GALLERY INVITES
CREATE TABLE IF NOT EXISTS public.gallery_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  email text,
  name text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'selector', 'commenter')),
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, email)
);

CREATE INDEX IF NOT EXISTS idx_gallery_invites_gallery ON public.gallery_invites(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_invites_token ON public.gallery_invites(token);
ALTER TABLE public.gallery_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "gallery_invites_studio" ON public.gallery_invites
    FOR ALL USING (studio_id = public.get_user_studio_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. EXPAND NOTIFICATION TYPES
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'galeria_prazo_proximo';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'galeria_prazo_vencido';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'galeria_comentario';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'galeria_selecao_concluida';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'galeria_download';

-- 8. GALLERY ACTIVITY — add gallery_id to activity_log
ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS gallery_id uuid REFERENCES public.galleries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_gallery ON public.activity_log(gallery_id)
  WHERE gallery_id IS NOT NULL;

-- 9. TRIGGER: auto-update photo_count
CREATE OR REPLACE FUNCTION public.sync_gallery_photo_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.galleries
    SET photo_count = (
      SELECT count(*) FROM public.gallery_photos WHERE gallery_id = NEW.gallery_id
    )
    WHERE id = NEW.gallery_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.galleries
    SET photo_count = (
      SELECT count(*) FROM public.gallery_photos WHERE gallery_id = OLD.gallery_id
    )
    WHERE id = OLD.gallery_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_photo_count_insert ON public.gallery_photos;
CREATE TRIGGER sync_photo_count_insert
  AFTER INSERT ON public.gallery_photos
  FOR EACH ROW EXECUTE FUNCTION public.sync_gallery_photo_count();

DROP TRIGGER IF EXISTS sync_photo_count_delete ON public.gallery_photos;
CREATE TRIGGER sync_photo_count_delete
  AFTER DELETE ON public.gallery_photos
  FOR EACH ROW EXECUTE FUNCTION public.sync_gallery_photo_count();

-- 10. PUBLIC ACCESS for gallery sharing
DO $$ BEGIN
  CREATE POLICY "gallery_invite_access" ON public.galleries
    FOR SELECT USING (
      id IN (SELECT gallery_id FROM public.gallery_invites WHERE token IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_comments_client_insert" ON public.gallery_comments
    FOR INSERT WITH CHECK (
      gallery_id IN (SELECT gallery_id FROM public.gallery_invites WHERE token IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_selections_client_insert" ON public.gallery_selections
    FOR INSERT WITH CHECK (
      gallery_id IN (SELECT gallery_id FROM public.gallery_invites WHERE token IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION v4: FINANCIAL IMPROVEMENTS
-- ═══════════════════════════════════════════════════════════════

-- 1. Fix sync_project_paid — handle UPDATE and DELETE
DROP TRIGGER IF EXISTS sync_paid_on_installment ON public.installments;

CREATE OR REPLACE FUNCTION public.sync_project_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _project_id uuid;
BEGIN
  IF tg_op = 'DELETE' THEN
    _project_id := old.project_id;
  ELSE
    _project_id := new.project_id;
    IF tg_op = 'UPDATE' AND old.project_id IS DISTINCT FROM new.project_id AND old.project_id IS NOT NULL THEN
      UPDATE public.projects
      SET paid = (
        SELECT coalesce(sum(paid_amount), 0)
        FROM public.installments
        WHERE project_id = old.project_id AND status = 'pago'
      )
      WHERE id = old.project_id;
    END IF;
  END IF;

  IF _project_id IS NOT NULL THEN
    UPDATE public.projects
    SET paid = (
      SELECT coalesce(sum(paid_amount), 0)
      FROM public.installments
      WHERE project_id = _project_id AND status = 'pago'
    )
    WHERE id = _project_id;
  END IF;

  IF tg_op = 'DELETE' THEN
    RETURN old;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS sync_paid_on_installment_update ON public.installments;
CREATE TRIGGER sync_paid_on_installment_update
  AFTER UPDATE ON public.installments
  FOR EACH ROW
  WHEN (old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION public.sync_project_paid();

DROP TRIGGER IF EXISTS sync_paid_on_installment_delete ON public.installments;
CREATE TRIGGER sync_paid_on_installment_delete
  AFTER DELETE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_paid();

-- 2. Add recurring field to installments
ALTER TABLE public.installments
  ADD COLUMN IF NOT EXISTS recurring boolean NOT NULL DEFAULT false;

-- 3. Expense categories reference table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_studio
  ON public.expense_categories(studio_id);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "expense_categories_studio" ON public.expense_categories
    FOR ALL USING (studio_id = public.get_user_studio_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default categories for existing studios
INSERT INTO public.expense_categories (studio_id, name, sort_order)
SELECT s.id, cat.name, cat.sort_order
FROM public.studios s
CROSS JOIN (VALUES
  ('Aluguel', 0),
  ('Equipamento', 1),
  ('Software', 2),
  ('Transporte', 3),
  ('Alimentação', 4),
  ('Marketing', 5),
  ('Seguro', 6),
  ('Impostos', 7),
  ('Assistente', 8),
  ('Manutenção', 9),
  ('Outros', 10)
) AS cat(name, sort_order)
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION v5: GALLERY AGENDADA STATUS
-- ═══════════════════════════════════════════════════════════════

ALTER TYPE public.gallery_status ADD VALUE IF NOT EXISTS 'agendada' BEFORE 'rascunho';


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION v6: CONTRACTS — FILE UPLOAD SUPPORT
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS file_url text;


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION v7: WORKFLOW IMPROVEMENTS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.workflow_templates
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#007AFF';


-- ═══════════════════════════════════════════════════════════════
--  DONE! Todas as migrations executadas com sucesso.
-- ═══════════════════════════════════════════════════════════════
