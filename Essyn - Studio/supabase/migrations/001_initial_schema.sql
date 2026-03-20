-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — Database Schema v1
--  Foundation for the complete photographer management system
--  All tables use RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════
--  1. STUDIOS (the photographer's account)
-- ═══════════════════════════════════════

create table public.studios (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  logo_url text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  state text,
  document text, -- CPF or CNPJ
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'studio')),
  plan_interval text not null default 'monthly' check (plan_interval in ('monthly', 'yearly')),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  storage_used_bytes bigint not null default 0,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  2. TEAM MEMBERS
-- ═══════════════════════════════════════

create type public.team_role as enum ('admin', 'fotografo', 'editor', 'atendimento', 'financeiro', 'contador');

create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  role team_role not null default 'fotografo',
  avatar_url text,
  phone text,
  active boolean not null default true,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  3. CLIENTS
-- ═══════════════════════════════════════

create type public.client_status as enum ('ativo', 'inativo', 'vip');

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text, -- CPF
  address text,
  city text,
  state text,
  status client_status not null default 'ativo',
  notes text,
  tags text[] not null default '{}',
  total_spent numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  4. LEADS (CRM Pipeline)
-- ═══════════════════════════════════════

create type public.lead_stage as enum ('novo', 'contato', 'reuniao', 'proposta', 'negociacao', 'ganho', 'perdido');
create type public.event_type as enum ('casamento', 'ensaio', 'corporativo', 'aniversario', 'formatura', 'batizado', 'outro');

create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text,
  phone text,
  event_type event_type not null default 'outro',
  event_date date,
  event_location text,
  estimated_value numeric(12,2) not null default 0,
  stage lead_stage not null default 'novo',
  source text, -- instagram, indicacao, site, anuncio, outros
  notes text,
  tags text[] not null default '{}',
  next_action text,
  next_action_date date,
  lost_reason text,
  converted_project_id uuid, -- filled when won
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  5. PROJECTS (sovereign entity)
-- ═══════════════════════════════════════

create type public.project_status as enum ('rascunho', 'confirmado', 'producao', 'edicao', 'entregue', 'cancelado');
create type public.production_phase as enum ('agendado', 'captacao', 'selecao', 'edicao', 'revisao', 'entrega', 'concluido');

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  event_type event_type not null default 'outro',
  status project_status not null default 'rascunho',
  production_phase production_phase not null default 'agendado',
  event_date date,
  event_location text,
  value numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  notes text,
  tags text[] not null default '{}',
  -- Smart defaults filled on creation
  checklist jsonb not null default '[]',
  team_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  6. CONTRACTS
-- ═══════════════════════════════════════

create type public.contract_status as enum ('rascunho', 'enviado', 'assinado', 'expirado', 'cancelado');

create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  content text not null, -- markdown or HTML
  value numeric(12,2) not null default 0,
  status contract_status not null default 'rascunho',
  sent_at timestamptz,
  signed_at timestamptz,
  signed_ip text,
  signature_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  7. FINANCIAL — Installments
-- ═══════════════════════════════════════

create type public.financial_status as enum ('pendente', 'pago', 'vencido', 'cancelado');
create type public.payment_method as enum ('pix', 'boleto', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro');
create type public.financial_type as enum ('receita', 'despesa');

create table public.installments (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  type financial_type not null default 'receita',
  description text not null,
  amount numeric(12,2) not null,
  due_date date not null,
  status financial_status not null default 'pendente',
  payment_method payment_method,
  paid_at timestamptz,
  paid_amount numeric(12,2),
  category text, -- e.g. "sinal", "parcela", "final", "equipamento", "software"
  notes text,
  external_id text, -- Asaas payment ID
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  8. GALLERIES
-- ═══════════════════════════════════════

create type public.gallery_status as enum ('rascunho', 'prova', 'final', 'entregue', 'arquivado');
create type public.gallery_privacy as enum ('publico', 'privado', 'senha', 'expira');

create table public.galleries (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  slug text not null,
  status gallery_status not null default 'rascunho',
  privacy gallery_privacy not null default 'privado',
  password_hash text,
  cover_url text,
  photo_count integer not null default 0,
  download_enabled boolean not null default false,
  watermark_enabled boolean not null default true,
  expires_at timestamptz,
  views integer not null default 0,
  downloads integer not null default 0,
  settings jsonb not null default '{}', -- branding, layout, colors
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(studio_id, slug)
);

create table public.gallery_photos (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  file_url text not null,
  thumbnail_url text,
  filename text not null,
  size_bytes bigint not null default 0,
  width integer,
  height integer,
  sort_order integer not null default 0,
  favorited boolean not null default false,
  selected boolean not null default false, -- client selection
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  9. CATALOG & ORDERS
-- ═══════════════════════════════════════

create type public.order_status as enum ('pendente', 'pago', 'producao', 'enviado', 'entregue', 'cancelado');

create table public.catalog_products (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  description text,
  category text not null, -- impressoes, digital, albuns, molduras, extras
  base_price numeric(12,2) not null,
  sizes jsonb not null default '[]', -- [{size: "20x30", price: 120}, ...]
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  gallery_id uuid references public.galleries(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  status order_status not null default 'pendente',
  total numeric(12,2) not null default 0,
  items jsonb not null default '[]', -- [{photo_id, product_id, size, qty, price}]
  tracking_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  10. AGENDA / EVENTS
-- ═══════════════════════════════════════

create type public.event_status as enum ('agendado', 'confirmado', 'concluido', 'cancelado');

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  status event_status not null default 'agendado',
  all_day boolean not null default false,
  color text, -- hex color for calendar
  team_ids uuid[] not null default '{}',
  reminders jsonb not null default '[]', -- [{minutes_before: 30, channel: "email"}]
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  11. NOTIFICATIONS
-- ═══════════════════════════════════════

create type public.notification_type as enum (
  'lead_novo', 'lead_convertido',
  'pagamento_recebido', 'pagamento_vencido',
  'producao_avancou', 'entrega_pronta',
  'galeria_criada', 'galeria_visualizada',
  'pedido_recebido', 'contrato_assinado',
  'sistema'
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  description text,
  route text, -- deep link within app
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  12. ACTIVITY LOG (unified timeline)
-- ═══════════════════════════════════════

create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid references auth.users(id),
  project_id uuid references public.projects(id) on delete cascade,
  entity_type text not null, -- 'project', 'lead', 'contract', 'installment', 'gallery', 'order'
  entity_id uuid not null,
  action text not null, -- 'created', 'updated', 'status_changed', 'payment_received', etc.
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════
--  INDEXES
-- ═══════════════════════════════════════

create index idx_team_members_studio on public.team_members(studio_id);
create index idx_clients_studio on public.clients(studio_id);
create index idx_leads_studio on public.leads(studio_id);
create index idx_leads_stage on public.leads(studio_id, stage);
create index idx_projects_studio on public.projects(studio_id);
create index idx_projects_status on public.projects(studio_id, status);
create index idx_contracts_studio on public.contracts(studio_id);
create index idx_contracts_project on public.contracts(project_id);
create index idx_installments_studio on public.installments(studio_id);
create index idx_installments_project on public.installments(project_id);
create index idx_installments_due on public.installments(studio_id, due_date) where status = 'pendente';
create index idx_galleries_studio on public.galleries(studio_id);
create index idx_galleries_project on public.galleries(project_id);
create index idx_galleries_slug on public.galleries(studio_id, slug);
create index idx_gallery_photos_gallery on public.gallery_photos(gallery_id);
create index idx_orders_studio on public.orders(studio_id);
create index idx_events_studio on public.events(studio_id);
create index idx_events_date on public.events(studio_id, start_at);
create index idx_notifications_user on public.notifications(user_id, read);
create index idx_activity_project on public.activity_log(project_id);
create index idx_activity_studio on public.activity_log(studio_id, created_at desc);

-- ═══════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════

-- Enable RLS on all tables
alter table public.studios enable row level security;
alter table public.team_members enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.contracts enable row level security;
alter table public.installments enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.catalog_products enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;

-- Helper: get user's studio ID
create or replace function public.get_user_studio_id()
returns uuid
language sql
stable
security definer
as $$
  select id from public.studios where owner_id = auth.uid() limit 1;
$$;

-- Studio: owner can do everything
create policy "studio_owner" on public.studios
  for all using (owner_id = auth.uid());

-- Team members: studio access
create policy "team_studio_access" on public.team_members
  for all using (studio_id = public.get_user_studio_id());

-- All other tables: studio-scoped access
create policy "clients_studio" on public.clients
  for all using (studio_id = public.get_user_studio_id());

create policy "leads_studio" on public.leads
  for all using (studio_id = public.get_user_studio_id());

create policy "projects_studio" on public.projects
  for all using (studio_id = public.get_user_studio_id());

create policy "contracts_studio" on public.contracts
  for all using (studio_id = public.get_user_studio_id());

create policy "installments_studio" on public.installments
  for all using (studio_id = public.get_user_studio_id());

create policy "galleries_studio" on public.galleries
  for all using (studio_id = public.get_user_studio_id());

create policy "gallery_photos_studio" on public.gallery_photos
  for all using (studio_id = public.get_user_studio_id());

create policy "catalog_studio" on public.catalog_products
  for all using (studio_id = public.get_user_studio_id());

create policy "orders_studio" on public.orders
  for all using (studio_id = public.get_user_studio_id());

create policy "events_studio" on public.events
  for all using (studio_id = public.get_user_studio_id());

create policy "notifications_user" on public.notifications
  for all using (user_id = auth.uid());

create policy "activity_studio" on public.activity_log
  for all using (studio_id = public.get_user_studio_id());

-- Public gallery access (for client portal)
create policy "galleries_public_view" on public.galleries
  for select using (privacy = 'publico');

create policy "gallery_photos_public" on public.gallery_photos
  for select using (
    gallery_id in (select id from public.galleries where privacy = 'publico')
  );

-- ═══════════════════════════════════════
--  FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.studios
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.leads
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.contracts
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.installments
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.galleries
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

-- Auto-create studio on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := coalesce(
    new.raw_user_meta_data->>'slug',
    replace(new.id::text, '-', '')
  );
  final_slug := base_slug;
  loop
    begin
      insert into public.studios (owner_id, name, slug)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'studio_name', 'Meu Estúdio'),
        final_slug
      );
      exit;
    exception when unique_violation then
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end;
  end loop;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update project.paid when installment is marked as paid
create or replace function public.sync_project_paid()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.project_id is not null then
    update public.projects
    set paid = (
      select coalesce(sum(paid_amount), 0)
      from public.installments
      where project_id = new.project_id and status = 'pago'
    )
    where id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger sync_paid_on_installment
  after update on public.installments
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_project_paid();
