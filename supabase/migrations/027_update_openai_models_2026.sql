-- Migration 027: Update OpenAI models — deprecate retired models, add 2026 releases
-- Applied: 2026 — marks Feb 2026 retirements and adds GPT-5.4/5.5 family

-- Deprecate retired OpenAI models (Feb 2026 retirements)
UPDATE ai_models
SET is_deprecated = true, is_active = false
WHERE id IN (
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'o4-mini',
  'o3',
  'o3-mini'
);

-- Add GPT-5.5 (flagship, April 2026, 400k context, reasoning support)
INSERT INTO ai_models (id, provider_id, label, description, context_window, supports_tools, is_active, is_preview, is_deprecated, reasoning_supported, reasoning_label, sort_order)
VALUES ('gpt-5.5', 'openai', 'GPT-5.5', 'Flagship model, April 2026', 400000, true, true, false, false, true, 'Extended thinking', -3)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  context_window = EXCLUDED.context_window,
  is_active = EXCLUDED.is_active,
  is_deprecated = EXCLUDED.is_deprecated,
  reasoning_supported = EXCLUDED.reasoning_supported,
  reasoning_label = EXCLUDED.reasoning_label,
  sort_order = EXCLUDED.sort_order;

-- Add GPT-5.4 (March 2026 flagship, 400k context, reasoning support)
INSERT INTO ai_models (id, provider_id, label, description, context_window, supports_tools, is_active, is_preview, is_deprecated, reasoning_supported, reasoning_label, sort_order)
VALUES ('gpt-5.4', 'openai', 'GPT-5.4', 'Advanced reasoning, March 2026', 400000, true, true, false, false, true, 'Extended thinking', -2)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  context_window = EXCLUDED.context_window,
  is_active = EXCLUDED.is_active,
  is_deprecated = EXCLUDED.is_deprecated,
  reasoning_supported = EXCLUDED.reasoning_supported,
  reasoning_label = EXCLUDED.reasoning_label,
  sort_order = EXCLUDED.sort_order;

-- Add GPT-5.4 Mini (efficient variant, 128k context)
INSERT INTO ai_models (id, provider_id, label, description, context_window, supports_tools, is_active, is_preview, is_deprecated, reasoning_supported, sort_order)
VALUES ('gpt-5.4-mini', 'openai', 'GPT-5.4 Mini', 'Context: 128,000', 128000, true, true, false, false, false, 3)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  context_window = EXCLUDED.context_window,
  is_active = EXCLUDED.is_active,
  is_deprecated = EXCLUDED.is_deprecated,
  sort_order = EXCLUDED.sort_order;

-- Add GPT-5.4 Nano (ultra-fast, 64k context)
INSERT INTO ai_models (id, provider_id, label, description, context_window, supports_tools, is_active, is_preview, is_deprecated, reasoning_supported, sort_order)
VALUES ('gpt-5.4-nano', 'openai', 'GPT-5.4 Nano', 'Context: 64,000', 64000, true, true, false, false, false, 4)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  context_window = EXCLUDED.context_window,
  is_active = EXCLUDED.is_active,
  is_deprecated = EXCLUDED.is_deprecated,
  sort_order = EXCLUDED.sort_order;
