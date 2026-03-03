-- Migration 021: Add model_used column to message_analytics
-- PROBLEM: chat_service.py was passing model_used (e.g. "google/gemini-2.0-flash") when
-- calling save_message_analytics(), but the column didn't exist in the table (migration 020
-- was created without it). This caused ALL analytics saves to silently fail via the
-- exception handler, so the get_analytics_summary SELECT also failed, returning zeros.
-- APPLIED: via Supabase MCP on 2026-03-01.

ALTER TABLE public.message_analytics
    ADD COLUMN IF NOT EXISTS model_used VARCHAR(150);

COMMENT ON COLUMN public.message_analytics.model_used IS
    'Provider/model string used for this message, e.g. "google/gemini-2.0-flash-001"';

-- Index for model breakdown queries
CREATE INDEX IF NOT EXISTS idx_message_analytics_user_model
    ON public.message_analytics(user_id, model_used);
