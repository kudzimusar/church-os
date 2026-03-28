-- Phase 6: AI Reminder & Escalation Delivery Tracking
-- This migration adds the necessary columns to track the delivery status of reminders 
-- and notifications for escalations, enabling background workers to process them.

-- 1. Update reminders table
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS delivery_method text, -- 'email', 'sms', 'push'
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'; -- 'pending', 'sent', 'failed'

-- 2. Update escalations table
ALTER TABLE public.escalations 
ADD COLUMN IF NOT EXISTS notified_at timestamptz,
ADD COLUMN IF NOT EXISTS notified_to text[]; -- Array of user IDs or emails notified

-- 3. Create indexes for efficient background processing
CREATE INDEX IF NOT EXISTS idx_reminders_delivery_pending ON public.reminders(scheduled_for) 
WHERE delivered_at IS NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escalations_notification_pending ON public.escalations(created_at) 
WHERE notified_at IS NULL AND status = 'pending';
