-- Migration 032: Add feature column to message_analytics for usage source tracking
-- feature: 'chat' (default AI chat) | 'bill_gen' (bill generation AI calls)
-- Also makes message_id nullable so bill_gen entries do not need a chat_messages row.

-- 1. Make message_id nullable (bill_gen rows have no corresponding chat message)
ALTER TABLE public.message_analytics
  ALTER COLUMN message_id DROP NOT NULL;

-- 2. Add feature column with default 'chat' for all existing rows
ALTER TABLE public.message_analytics
  ADD COLUMN IF NOT EXISTS feature TEXT NOT NULL DEFAULT 'chat';

-- 3. Add check constraint to restrict to known values
ALTER TABLE public.message_analytics
  ADD CONSTRAINT message_analytics_feature_check
  CHECK (feature IN ('chat', 'bill_gen'));

-- 4. Index for fast per-feature analytics queries
CREATE INDEX IF NOT EXISTS idx_message_analytics_user_feature
  ON public.message_analytics(user_id, feature);

-- Verify
COMMENT ON COLUMN public.message_analytics.feature IS
  'Usage source: chat (AI chat messages) | bill_gen (bill generation AI calls)';
