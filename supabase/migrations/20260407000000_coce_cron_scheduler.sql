-- Phase 7: COCE Dispatch Automation Cron Setup
-- This SQL script schedules the coce-dispatch edge function to run periodically.
-- Run this in the Supabase SQL Editor.

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule COCE Dispatch Sweep (Every 1 minute)
-- This pings the dispatcher. If there are scheduled campaigns due, it processes them.
-- Uses current_setting to securely load the service role key dynamically from the platform.
SELECT cron.schedule(
  'coce-dispatch-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dapxrorkcvpzzkggopsa.supabase.co/functions/v1/coce-dispatch',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
