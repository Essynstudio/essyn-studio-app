-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — Migration v3: Gallery Module
--  Adds tables and columns needed for the full gallery experience:
--  folders, comments, selections, invites, deadline tracking,
--  notification types, and storage bucket setup.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════
--  1. ALTER galleries — add deadline columns
-- ═══════════════════════════════════════

alter table public.galleries
  add column if not exists delivery_deadline_days integer,
  add column if not exists delivery_deadline_date date,
  add column if not exists branding jsonb not null default '{}';
  -- branding: { logo_url, primary_color, bg_color, layout, welcome_message, custom_domain }

create index idx_galleries_deadline on public.galleries(studio_id, delivery_deadline_date)
  where status not in ('entregue', 'arquivado');


-- ═══════════════════════════════════════
--  2. GALLERY FOLDERS
-- ═══════════════════════════════════════

create table public.gallery_folders (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  cover_photo_id uuid, -- filled later, references gallery_photos(id)
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_gallery_folders_gallery on public.gallery_folders(gallery_id);
alter table public.gallery_folders enable row level security;
create policy "gallery_folders_studio" on public.gallery_folders
  for all using (studio_id = public.get_user_studio_id());


-- ═══════════════════════════════════════
--  3. ALTER gallery_photos — add folder_id and storage_path
-- ═══════════════════════════════════════

alter table public.gallery_photos
  add column if not exists folder_id uuid references public.gallery_folders(id) on delete set null,
  add column if not exists storage_path text; -- relative path in bucket, e.g. "studio-id/gallery-id/photo.jpg"

create index idx_gallery_photos_folder on public.gallery_photos(folder_id);


-- ═══════════════════════════════════════
--  4. GALLERY COMMENTS (Proofing)
-- ═══════════════════════════════════════

create table public.gallery_comments (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid references public.gallery_photos(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  author_name text not null, -- photographer or client name
  author_type text not null default 'client' check (author_type in ('client', 'studio')),
  content text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_gallery_comments_gallery on public.gallery_comments(gallery_id);
create index idx_gallery_comments_photo on public.gallery_comments(photo_id);
alter table public.gallery_comments enable row level security;
create policy "gallery_comments_studio" on public.gallery_comments
  for all using (studio_id = public.get_user_studio_id());


-- ═══════════════════════════════════════
--  5. GALLERY SELECTIONS (Client photo picks)
-- ═══════════════════════════════════════

create type public.selection_status as enum ('aprovada', 'rejeitada', 'duvida');

create table public.gallery_selections (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid not null references public.gallery_photos(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status selection_status not null default 'aprovada',
  notes text,
  created_at timestamptz not null default now(),
  unique(gallery_id, photo_id, client_id)
);

create index idx_gallery_selections_gallery on public.gallery_selections(gallery_id);
alter table public.gallery_selections enable row level security;
create policy "gallery_selections_studio" on public.gallery_selections
  for all using (studio_id = public.get_user_studio_id());


-- ═══════════════════════════════════════
--  6. GALLERY INVITES
-- ═══════════════════════════════════════

create table public.gallery_invites (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  email text,
  name text,
  token text not null default encode(gen_random_bytes(16), 'hex'),
  role text not null default 'viewer' check (role in ('viewer', 'selector', 'commenter')),
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique(gallery_id, email)
);

create index idx_gallery_invites_gallery on public.gallery_invites(gallery_id);
create index idx_gallery_invites_token on public.gallery_invites(token);
alter table public.gallery_invites enable row level security;
create policy "gallery_invites_studio" on public.gallery_invites
  for all using (studio_id = public.get_user_studio_id());


-- ═══════════════════════════════════════
--  7. EXPAND NOTIFICATION TYPES
-- ═══════════════════════════════════════

-- Add new notification types for gallery deadlines
alter type public.notification_type add value if not exists 'galeria_prazo_proximo';
alter type public.notification_type add value if not exists 'galeria_prazo_vencido';
alter type public.notification_type add value if not exists 'galeria_comentario';
alter type public.notification_type add value if not exists 'galeria_selecao_concluida';
alter type public.notification_type add value if not exists 'galeria_download';


-- ═══════════════════════════════════════
--  8. GALLERY ACTIVITY (gallery-specific events)
-- ═══════════════════════════════════════
-- We reuse the existing activity_log table but add gallery_id for direct filtering.

alter table public.activity_log
  add column if not exists gallery_id uuid references public.galleries(id) on delete set null;

create index idx_activity_gallery on public.activity_log(gallery_id)
  where gallery_id is not null;


-- ═══════════════════════════════════════
--  9. TRIGGER: auto-update photo_count
-- ═══════════════════════════════════════

create or replace function public.sync_gallery_photo_count()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Handle INSERT
  if TG_OP = 'INSERT' then
    update public.galleries
    set photo_count = (
      select count(*) from public.gallery_photos where gallery_id = NEW.gallery_id
    )
    where id = NEW.gallery_id;
    return NEW;
  end if;

  -- Handle DELETE
  if TG_OP = 'DELETE' then
    update public.galleries
    set photo_count = (
      select count(*) from public.gallery_photos where gallery_id = OLD.gallery_id
    )
    where id = OLD.gallery_id;
    return OLD;
  end if;

  return NULL;
end;
$$;

create trigger sync_photo_count_insert
  after insert on public.gallery_photos
  for each row execute function public.sync_gallery_photo_count();

create trigger sync_photo_count_delete
  after delete on public.gallery_photos
  for each row execute function public.sync_gallery_photo_count();


-- ═══════════════════════════════════════
--  10. PUBLIC ACCESS for gallery sharing
-- ═══════════════════════════════════════

-- Allow clients to view gallery via invite token
create policy "gallery_invite_access" on public.galleries
  for select using (
    id in (select gallery_id from public.gallery_invites where token is not null)
  );

-- Allow clients to insert comments on galleries they're invited to
create policy "gallery_comments_client_insert" on public.gallery_comments
  for insert with check (
    gallery_id in (select gallery_id from public.gallery_invites where token is not null)
  );

-- Allow clients to insert selections on galleries they're invited to
create policy "gallery_selections_client_insert" on public.gallery_selections
  for insert with check (
    gallery_id in (select gallery_id from public.gallery_invites where token is not null)
  );


-- ═══════════════════════════════════════
--  11. STORAGE BUCKET (reference — run via Supabase Dashboard or CLI)
-- ═══════════════════════════════════════
-- Note: Supabase storage buckets cannot be created via SQL migrations.
-- Create the bucket manually in Supabase Dashboard > Storage:
--
--   Bucket name: gallery-photos
--   Public: false (use signed URLs for private galleries)
--   File size limit: 52428800 (50MB)
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/heic, image/tiff
--
-- Then add these Storage policies in Dashboard > Storage > Policies:
--
--   1. "Studio upload" (INSERT):
--      authenticated users where (bucket_id = 'gallery-photos')
--      and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   2. "Studio read own" (SELECT):
--      authenticated users where (bucket_id = 'gallery-photos')
--      and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   3. "Studio delete own" (DELETE):
--      authenticated users where (bucket_id = 'gallery-photos')
--      and (storage.foldername(name))[1] = (select id::text from studios where owner_id = auth.uid())
--
--   4. "Public gallery view" (SELECT):
--      anon/authenticated where (bucket_id = 'gallery-photos')
--      and exists (
--        select 1 from galleries g
--        join gallery_photos gp on gp.gallery_id = g.id
--        where gp.storage_path = name and g.privacy = 'publico'
--      )
