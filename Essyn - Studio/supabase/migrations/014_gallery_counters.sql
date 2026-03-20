-- v14: Gallery view/download counter functions

CREATE OR REPLACE FUNCTION public.increment_gallery_views(gid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.galleries SET views = COALESCE(views, 0) + 1 WHERE id = gid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_gallery_downloads(gid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.galleries SET downloads = COALESCE(downloads, 0) + 1 WHERE id = gid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
