-- Fix for system_activity_logs RLS policy
-- Allows any authenticated user to securely log their own activities
-- instead of relying on Next.js Server Actions which break static exports

-- Drop the old overly restrictive policy
DROP POLICY IF EXISTS "Admins can insert logs" ON public.system_activity_logs;

-- Apply a secure policy that allows users to only insert logs representing themselves
CREATE POLICY "Users can log their own activities" 
ON public.system_activity_logs 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);
