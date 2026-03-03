-- ============================================================
-- YesBill - AI model capability metadata + per-user probe cache
-- ============================================================

-- 1) Extend ai_models with governance + reasoning capability fields
ALTER TABLE public.ai_models
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reasoning_supported BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reasoning_label TEXT NOT NULL DEFAULT 'Reasoning support';

-- 2) Per-user model probe cache (availability checks)
CREATE TABLE IF NOT EXISTS public.user_model_probes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'error', 'unknown')),
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider_id, model_id)
);

CREATE INDEX IF NOT EXISTS idx_user_model_probes_user_provider
  ON public.user_model_probes(user_id, provider_id);

CREATE INDEX IF NOT EXISTS idx_user_model_probes_checked_at
  ON public.user_model_probes(checked_at DESC);

-- 3) RLS
ALTER TABLE public.user_model_probes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own model probes" ON public.user_model_probes;
CREATE POLICY "Users can view own model probes"
  ON public.user_model_probes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own model probes" ON public.user_model_probes;
CREATE POLICY "Users can insert own model probes"
  ON public.user_model_probes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own model probes" ON public.user_model_probes;
CREATE POLICY "Users can update own model probes"
  ON public.user_model_probes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own model probes" ON public.user_model_probes;
CREATE POLICY "Users can delete own model probes"
  ON public.user_model_probes FOR DELETE
  USING (auth.uid() = user_id);

-- 4) updated_at trigger
CREATE OR REPLACE FUNCTION public.update_user_model_probes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_model_probes_updated_at ON public.user_model_probes;
CREATE TRIGGER trg_user_model_probes_updated_at
  BEFORE UPDATE ON public.user_model_probes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_model_probes_updated_at();
