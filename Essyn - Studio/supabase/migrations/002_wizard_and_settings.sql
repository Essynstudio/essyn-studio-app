-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — Migration v2: Wizard, Packs, Workflows, Products
--  Adds support for the complete "New Project" wizard flow
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════
--  1. PACKS (pre-configured service packages)
-- ═══════════════════════════════════════

create table public.packs (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  description text,
  event_type event_type,
  base_value numeric(12,2) not null default 0,
  includes jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_packs_studio on public.packs(studio_id);
alter table public.packs enable row level security;
create policy "packs_studio" on public.packs
  for all using (studio_id = public.get_user_studio_id());

create trigger set_updated_at before update on public.packs
  for each row execute function public.handle_updated_at();

-- ═══════════════════════════════════════
--  2. WORKFLOW TEMPLATES (reusable production steps)
-- ═══════════════════════════════════════

create table public.workflow_templates (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  description text,
  default_days integer not null default 30,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_workflow_templates_studio on public.workflow_templates(studio_id);
alter table public.workflow_templates enable row level security;
create policy "workflow_templates_studio" on public.workflow_templates
  for all using (studio_id = public.get_user_studio_id());

-- ═══════════════════════════════════════
--  3. PROJECT LOCATIONS (multiple per project)
-- ═══════════════════════════════════════

create table public.project_locations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  address text,
  event_time time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_project_locations_project on public.project_locations(project_id);
alter table public.project_locations enable row level security;
create policy "project_locations_studio" on public.project_locations
  for all using (
    project_id in (select id from public.projects where studio_id = public.get_user_studio_id())
  );

-- ═══════════════════════════════════════
--  4. PROJECT WORKFLOWS (production items per project)
-- ═══════════════════════════════════════

create table public.project_workflows (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  workflow_template_id uuid references public.workflow_templates(id) on delete set null,
  name text not null,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  deadline date,
  assigned_to uuid references public.team_members(id) on delete set null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_workflows_project on public.project_workflows(project_id);
create index idx_project_workflows_studio on public.project_workflows(studio_id);
alter table public.project_workflows enable row level security;
create policy "project_workflows_studio" on public.project_workflows
  for all using (studio_id = public.get_user_studio_id());

create trigger set_updated_at before update on public.project_workflows
  for each row execute function public.handle_updated_at();

-- ═══════════════════════════════════════
--  5. PROJECT PRODUCTS (products selected for a project)
-- ═══════════════════════════════════════

create table public.project_products (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  catalog_product_id uuid references public.catalog_products(id) on delete set null,
  name text not null,
  description text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_project_products_project on public.project_products(project_id);
create index idx_project_products_studio on public.project_products(studio_id);
alter table public.project_products enable row level security;
create policy "project_products_studio" on public.project_products
  for all using (studio_id = public.get_user_studio_id());

-- ═══════════════════════════════════════
--  6. ALTER PROJECTS TABLE (new columns)
-- ═══════════════════════════════════════

alter table public.projects
  add column if not exists pack_id uuid references public.packs(id) on delete set null,
  add column if not exists event_time time,
  add column if not exists delivery_deadline_days integer,
  add column if not exists delivery_deadline_date date,
  add column if not exists payment_method payment_method,
  add column if not exists payment_split jsonb;
