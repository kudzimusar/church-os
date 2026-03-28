-- Phase 5: AI Evaluation & Feedback Loops
-- This migration creates the audit logging infrastructure for monitoring AI behavior and collecting user feedback.

-- 1. ai_conversation_logs table
CREATE TABLE IF NOT EXISTS public.ai_conversation_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    organization_id uuid,
    session_id uuid NOT NULL, -- For grouping multi-turn conversations
    persona text NOT NULL,
    path text,
    user_query text NOT NULL,
    ai_response text,
    response_time_ms integer,
    tools_called jsonb DEFAULT '[]'::jsonb,
    tool_results jsonb DEFAULT '[]'::jsonb,
    tokens_used integer,
    model_used text DEFAULT 'gemini-3.1-pro',
    feedback_rating text, -- 'up', 'down'
    feedback_reason text,
    escalated boolean DEFAULT false,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session ON public.ai_conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON public.ai_conversation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feedback ON public.ai_conversation_logs(feedback_rating) WHERE feedback_rating IS NOT NULL;

-- 3. RLS
ALTER TABLE public.ai_conversation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
DROP POLICY IF EXISTS admin_view_all_logs ON public.ai_conversation_logs;
CREATE POLICY admin_view_all_logs ON public.ai_conversation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'pastor')
    )
  );

-- Users can view their own logs
DROP POLICY IF EXISTS user_view_own_logs ON public.ai_conversation_logs;
CREATE POLICY user_view_own_logs ON public.ai_conversation_logs
  FOR SELECT USING (user_id = auth.uid());

-- System can insert logs (Allowing authenticated users to insert their own logs)
DROP POLICY IF EXISTS user_insert_own_logs ON public.ai_conversation_logs;
CREATE POLICY user_insert_own_logs ON public.ai_conversation_logs
  FOR INSERT WITH CHECK (true);
