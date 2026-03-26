-- Strategic Register: Define the Pastor role in the roles matrix
-- This migration ensures the 'pastor' role is canonized with ultimate level access (100)
-- It also performs the identity cleanup for the primary pastor account

INSERT INTO public.roles (name, level, description, permissions)
VALUES (
  'pastor', 
  100, 
  'Ultimate ecclesiastical authority with full Strategic Center and Mission Control oversight.', 
  '["all"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
  level = EXCLUDED.level,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Ensure the primary pastor account is correctly labeled and consolidated
DO $$ 
DECLARE
    target_id uuid;
    old_visitor_id uuid;
BEGIN
    SELECT id INTO target_id FROM public.profiles WHERE email = 'pastor@jkc.church';
    SELECT id INTO old_visitor_id FROM public.profiles WHERE name = 'Musarurwa Shadreck Kudzanai' AND membership_status = 'member'; -- identifying by name if email varies

    -- Update the main profile
    UPDATE public.profiles 
    SET 
      membership_status = 'pastor',
      growth_stage = 'elder',
      role = 'pastor'
    WHERE email = 'pastor@jkc.church';

    -- Consolidate leadership data if duplicates exist
    IF target_id IS NOT NULL AND old_visitor_id IS NOT NULL THEN
        UPDATE public.bible_study_groups SET assistant_leader_id = target_id WHERE assistant_leader_id = old_visitor_id;
    END IF;
END $$;
