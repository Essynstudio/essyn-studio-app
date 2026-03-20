-- v15: Soft delete for main entities
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.galleries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON public.projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_deleted ON public.clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON public.leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_galleries_deleted ON public.galleries(deleted_at) WHERE deleted_at IS NULL;
