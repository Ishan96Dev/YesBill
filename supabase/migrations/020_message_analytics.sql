-- Migration 020: Create message_analytics table
-- Stores per-message LLM usage analytics: tokens, cost, latency, chunks count.
-- Linked 1:1 to chat_messages. Only assistant messages with successful responses get a row.

CREATE TABLE IF NOT EXISTS public.message_analytics (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id      UUID NOT NULL UNIQUE REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_in       INTEGER NOT NULL DEFAULT 0,
    tokens_out      INTEGER NOT NULL DEFAULT 0,
    tokens_thinking INTEGER,                          -- NULL if model didn't use reasoning
    cost_usd        NUMERIC(12, 8) NOT NULL DEFAULT 0,
    latency_ms      INTEGER NOT NULL DEFAULT 0,
    ttft_ms         INTEGER,                          -- NULL if not captured
    chunks_count    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_analytics IS
    'Per-message LLM analytics: token usage, cost, latency, and streaming metrics.';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_message_analytics_user_id
    ON public.message_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_message_analytics_user_created
    ON public.message_analytics(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE public.message_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analytics"
    ON public.message_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert analytics"
    ON public.message_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);
