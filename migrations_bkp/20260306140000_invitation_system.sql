-- Church OS Extension: Ministry Invitation System
-- Enhances member_roles to handle the recruitment workflow

-- 1. Extend member_roles with status and metadata
ALTER TABLE public.member_roles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'; 
-- status: active, pending_invitation, declined, former
ALTER TABLE public.member_roles ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.member_roles ADD COLUMN IF NOT EXISTS invitation_date timestamptz;

-- 2. Ensure RLS is updated for invitations
DROP POLICY IF EXISTS "Members manage own roles" ON public.member_roles;
CREATE POLICY "Members manage own roles" ON public.member_roles FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage roles" ON public.member_roles;
CREATE POLICY "Admins manage roles" ON public.member_roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- 3. Add notification table if it doesn't exist (shared for church alerts)
CREATE TABLE IF NOT EXISTS public.member_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info', -- info, invitation, alert, blessing
    is_read boolean DEFAULT false,
    link_to text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.member_notifications FOR ALL USING (user_id = auth.uid());

-- 4. Function to notify on invitation
CREATE OR REPLACE FUNCTION public.notify_on_ministry_invitation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'pending_invitation') THEN
        INSERT INTO public.member_notifications (user_id, title, message, type, link_to)
        VALUES (NEW.user_id, 'Ministry Invitation', 'You have been invited to join the ' || NEW.ministry_name || ' team!', 'invitation', '/profile');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ministry_invitation ON public.member_roles;
CREATE TRIGGER on_ministry_invitation
    AFTER INSERT OR UPDATE ON public.member_roles
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_ministry_invitation();

NOTIFY pgrst, 'reload schema';
