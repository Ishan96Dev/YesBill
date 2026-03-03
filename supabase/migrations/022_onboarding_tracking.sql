-- Migration 019: Add onboarding tracking columns to user_profiles
-- Tracks whether a user has completed the onboarding wizard and which steps they skipped.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN   DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_steps JSONB   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_config_reminder_shown BOOLEAN  DEFAULT false;

COMMENT ON COLUMN public.user_profiles.onboarding_completed    IS 'True once the user has finished or explicitly skipped the onboarding wizard.';
COMMENT ON COLUMN public.user_profiles.onboarding_skipped_steps IS 'JSON map of steps the user chose to skip, e.g. {"ai_config": true}.';
COMMENT ON COLUMN public.user_profiles.ai_config_reminder_shown IS 'True once the second-login AI config reminder modal has been shown (shown at most once).';
