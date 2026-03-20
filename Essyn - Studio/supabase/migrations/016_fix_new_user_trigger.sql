-- v16: Fix handle_new_user trigger to copy email and phone to studios table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := coalesce(
    new.raw_user_meta_data->>'slug',
    replace(new.id::text, '-', '')
  );
  final_slug := base_slug;
  LOOP
    BEGIN
      INSERT INTO public.studios (owner_id, name, slug, email, phone)
      VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'studio_name', 'Meu Estúdio'),
        final_slug,
        new.email,
        new.raw_user_meta_data->>'phone'
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END;
  END LOOP;
  RETURN new;
END;
$$;
