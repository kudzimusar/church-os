-- SCHEMA ALIGNMENT: FIXING MILESTONE COLUMNS
-- Synchronizing foundation class tracking from boolean to date for precision

ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS first_visit_date date;
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS foundation_class_date date;
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS leadership_training_date date;
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS ordained_date date;
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS custom_milestones jsonb DEFAULT '[]';

-- If foundations_completed existed as a boolean, we keep it but prefer the date for the dash
-- Migrating existing data if possible (though likely empty or mock for now)
UPDATE public.member_milestones 
SET foundation_class_date = created_at::date 
WHERE foundation_class_date IS NULL AND foundations_completed = true;

-- Ensure other missing tables/columns from unified_spine are definitely there
-- in case CREATE TABLE IF NOT EXISTS skipped them due to partial matches
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ward text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_notes text;
