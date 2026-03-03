-- Migration 019: Per-model thinking/reasoning capability metadata
-- Adds columns to ai_models to drive dynamic effort dropdowns and backend parameters.
-- Source of truth for which effort levels each model supports and how to pass them to the API.

ALTER TABLE ai_models
  ADD COLUMN IF NOT EXISTS max_output_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS thinking_param_type TEXT
    CHECK (thinking_param_type IN ('level', 'budget', 'effort', 'none')),
  ADD COLUMN IF NOT EXISTS supported_effort_levels TEXT[],
  ADD COLUMN IF NOT EXISTS default_effort_level TEXT,
  ADD COLUMN IF NOT EXISTS can_disable_thinking BOOLEAN DEFAULT true;

COMMENT ON COLUMN ai_models.max_output_tokens IS 'Maximum output tokens this model supports per request';
COMMENT ON COLUMN ai_models.thinking_param_type IS 'API param for thinking: level (Gemini 3 thinkingLevel), budget (Gemini 2.5/Anthropic thinkingBudget), effort (OpenAI reasoning_effort), none';
COMMENT ON COLUMN ai_models.supported_effort_levels IS 'UI effort labels shown in dropdown, e.g. {none,low,medium,high}. NULL = no thinking shown.';
COMMENT ON COLUMN ai_models.default_effort_level IS 'Default effort level pre-selected when this model is chosen';
COMMENT ON COLUMN ai_models.can_disable_thinking IS 'Whether thinking can be fully disabled for this model';

-- ===== GOOGLE GEMINI 3.x (thinkingLevel) =====
UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'level',
  supported_effort_levels = ARRAY['low','medium','high'],
  default_effort_level = 'low',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id = 'gemini-3.1-pro-preview';

UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'level',
  supported_effort_levels = ARRAY['none','low','medium','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'gemini-3-flash-preview';

UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'level',
  supported_effort_levels = ARRAY['low','high'],
  default_effort_level = 'low',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id = 'gemini-3-pro-preview';

-- ===== GOOGLE GEMINI 2.5 (thinkingBudget) =====
UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['low','medium','high'],
  default_effort_level = 'low',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id = 'gemini-2.5-pro';

UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['none','low','medium','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'gemini-2.5-flash';

UPDATE ai_models SET
  max_output_tokens    = 65536,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['none','low','medium','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'gemini-2.5-flash-lite';

-- ===== ANTHROPIC (thinkingBudget) =====
UPDATE ai_models SET
  max_output_tokens    = 128000,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['none','low','medium','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'claude-opus-4-6';

UPDATE ai_models SET
  max_output_tokens    = 64000,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['none','low','medium','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'claude-sonnet-4-6';

UPDATE ai_models SET
  max_output_tokens    = 64000,
  thinking_param_type  = 'budget',
  supported_effort_levels = ARRAY['none','low','high'],
  default_effort_level = 'none',
  can_disable_thinking = true,
  reasoning_supported  = true
WHERE id = 'claude-haiku-4-5-20251001';

-- ===== OPENAI - Non-reasoning GPT models =====
UPDATE ai_models SET
  max_output_tokens    = 16384,
  thinking_param_type  = 'none',
  supported_effort_levels = NULL,
  default_effort_level = NULL,
  can_disable_thinking = true,
  reasoning_supported  = false
WHERE id IN ('gpt-4o', 'gpt-4o-mini');

UPDATE ai_models SET
  max_output_tokens    = 32768,
  thinking_param_type  = 'none',
  supported_effort_levels = NULL,
  default_effort_level = NULL,
  can_disable_thinking = true,
  reasoning_supported  = false
WHERE id IN ('gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-5-mini', 'gpt-5-nano');

-- ===== OPENAI - Reasoning GPT-5.x models =====
UPDATE ai_models SET
  max_output_tokens    = 32768,
  thinking_param_type  = 'effort',
  supported_effort_levels = ARRAY['low','medium','high'],
  default_effort_level = 'medium',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id IN ('gpt-5', 'gpt-5.1', 'gpt-5.2', 'gpt-5.2-pro');

-- ===== OPENAI - o-series reasoning models =====
UPDATE ai_models SET
  max_output_tokens    = 100000,
  thinking_param_type  = 'effort',
  supported_effort_levels = ARRAY['medium','high'],
  default_effort_level = 'medium',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id = 'o1';

UPDATE ai_models SET
  max_output_tokens    = 100000,
  thinking_param_type  = 'effort',
  supported_effort_levels = ARRAY['low','medium','high'],
  default_effort_level = 'medium',
  can_disable_thinking = false,
  reasoning_supported  = true
WHERE id IN ('o3', 'o3-mini', 'o4-mini');
