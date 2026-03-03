-- Create AI settings table for per-user AI provider configuration
-- Supports multiple providers (OpenAI, Anthropic, Google, etc.)
-- Each user can have one configuration per provider

CREATE TABLE IF NOT EXISTS public.user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  api_key_encrypted TEXT,
  selected_model TEXT DEFAULT 'gpt-4o',
  enable_insights BOOLEAN DEFAULT true,
  is_key_valid BOOLEAN DEFAULT false,
  key_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own AI settings
CREATE POLICY "Users can view own ai settings"
  ON public.user_ai_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai settings"
  ON public.user_ai_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai settings"
  ON public.user_ai_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai settings"
  ON public.user_ai_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON public.user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_settings_updated_at();
