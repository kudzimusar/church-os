-- Fix handle_new_user: remove user_progress insert (table does not exist)
-- This was blocking ALL programmatic user creation via the admin API
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, org_id)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'User'
    ),
    new.email,
    COALESCE(
      (new.raw_user_meta_data->>'org_id')::uuid,
      'fa547adf-f820-412f-9458-d6bade11517d'::uuid
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
