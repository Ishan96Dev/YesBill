-- Migration 023: Add default_reasoning_effort to user_ai_settings
-- This column stores the user's preferred reasoning effort level per provider.
-- Added as IF NOT EXISTS to be safe if the column was already added manually.

ALTER TABLE public.user_ai_settings
  ADD COLUMN IF NOT EXISTS default_reasoning_effort TEXT DEFAULT 'none';

COMMENT ON COLUMN public.user_ai_settings.default_reasoning_effort IS 'Default reasoning effort level (none, low, medium, high, xhigh) for reasoning-capable models';
