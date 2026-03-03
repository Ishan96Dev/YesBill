-- ============================================================
-- YesBill Database Migration - Update Schedule Constraint
-- ============================================================
-- Description: Updates user_services schedule constraint to include all schedule options
-- Author: YesBill Team
-- Date: 2026-02-15

-- ============================================================
-- Drop the old constraint and add new one with all schedule values
-- ============================================================
ALTER TABLE public.user_services 
DROP CONSTRAINT IF EXISTS user_services_schedule_check;

ALTER TABLE public.user_services 
ADD CONSTRAINT user_services_schedule_check 
CHECK (schedule IN ('morning', 'afternoon', 'evening', 'night', 'all-day', 'custom'));

-- ============================================================
-- Update default value to match frontend
-- ============================================================
ALTER TABLE public.user_services 
ALTER COLUMN schedule SET DEFAULT 'morning';

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON COLUMN public.user_services.schedule IS 'Service delivery schedule: morning, afternoon, evening, night, all-day, or custom';
