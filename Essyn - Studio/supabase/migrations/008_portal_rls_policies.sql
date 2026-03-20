-- ═══════════════════════════════════════════════
-- Migration v8 — Portal do Cliente RLS Policies
-- Permite acesso publico via token de convite
-- ═══════════════════════════════════════════════

-- Gallery invites: qualquer pessoa pode ler por token (para resolver convite)
CREATE POLICY "gallery_invites_public_by_token" ON public.gallery_invites
  FOR SELECT USING (true);

-- Studios: leitura publica quando tem convite ativo (para branding/nome)
CREATE POLICY "studios_public_portal" ON public.studios
  FOR SELECT USING (
    id IN (SELECT studio_id FROM public.gallery_invites WHERE token IS NOT NULL)
  );

-- Projects: leitura publica quando galeria tem convite (para nome/data evento)
CREATE POLICY "projects_public_portal" ON public.projects
  FOR SELECT USING (
    id IN (
      SELECT g.project_id FROM public.galleries g
      INNER JOIN public.gallery_invites gi ON gi.gallery_id = g.id
      WHERE gi.token IS NOT NULL
    )
  );

-- Clients: leitura publica quando galeria tem convite (para nome do cliente)
CREATE POLICY "clients_public_portal" ON public.clients
  FOR SELECT USING (
    id IN (
      SELECT g.client_id FROM public.galleries g
      INNER JOIN public.gallery_invites gi ON gi.gallery_id = g.id
      WHERE gi.token IS NOT NULL
    )
  );

-- Gallery folders: leitura publica quando galeria tem convite
CREATE POLICY "gallery_folders_public" ON public.gallery_folders
  FOR SELECT USING (
    gallery_id IN (SELECT gallery_id FROM public.gallery_invites WHERE token IS NOT NULL)
  );

-- NOTA: galleries e gallery_photos ja tinham policies publicas (migration v3):
-- "gallery_invite_access" em galleries
-- "gallery_photos_public" em gallery_photos
