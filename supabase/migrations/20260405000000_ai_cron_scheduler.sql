-- Phase 6: AI Automation Cron Setup
-- This SQL script enables pg_cron and schedules the edge functions to run periodically.
-- Run this in the Supabase SQL Editor.

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Define the project-specific URL and Service Key 
-- (You MUST replace the YOUR-SUBDOMAIN and YOUR-SERVICE-KEY placeholders)
-- DO NOT COMMIT THIS FILE TO REPOS IF YOU HAVE ACTUAL KEYS IN IT!
DO $$
DECLARE
    project_url text := 'https://YOUR-PROJECT-ID.supabase.co'; -- Replace with actual Supabase URL
    service_key text := 'YOUR-SERVICE-ROLE-KEY'; -- Replace with actual Service Role Key
BEGIN
    -- 3. Schedule Reminder Processing (Every 5 minutes)
    PERFORM cron.schedule(
      'ai-process-reminders',
      '*/5 * * * *',
      format('SELECT net.http_post(
          url:=''%s/functions/v1/process-reminders'',
          headers:=''{"Authorization": "Bearer %s"}''::jsonb
      )', project_url, service_key)
    );

    -- 4. Schedule Escalation Notifications (Every 10 minutes)
    PERFORM cron.schedule(
      'ai-process-escalations',
      '*/10 * * * *',
      format('SELECT net.http_post(
          url:=''%s/functions/v1/process-escalations'',
          headers:=''{"Authorization": "Bearer %s"}''::jsonb
      )', project_url, service_key)
    );
    
    RAISE NOTICE 'Cron jobs scheduled successfully.';
END $$;

-- 5. Helper queries to monitor jobs
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
