-- Fix handle_new_user trigger to ensure reliability during account seeding
-- This simplifies the trigger to only perform core profile creation, avoiding cascade failures from stats tables

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
        BEGIN
          -- Only attempt insert if we have a valid metadata name or fallback
          INSERT INTO public.profiles (id, name, email, org_id)
          VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
            new.email,
            COALESCE((new.raw_user_meta_data->>'org_id')::uuid, 'fa547adf-f820-412f-9458-d6bade11517d'::uuid)
          )
          ON CONFLICT (id) DO NOTHING;
          
          INSERT INTO public.user_progress (user_id)
          VALUES (new.id)
          ON CONFLICT (user_id) DO NOTHING;
          
          RETURN NEW;
        END;
        $function$;

-- Ensure the function is owned by postgres to have full permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- Specifically grant permissions to the table itself just in case
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_progress TO postgres, service_role;

-- Ensure trigger is attached correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
 AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
