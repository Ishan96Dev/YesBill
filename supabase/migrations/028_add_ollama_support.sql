-- Migration 028: Add Ollama local LLM support
-- Adds ollama_base_url to user_ai_settings so each user can configure their own Ollama endpoint

ALTER TABLE user_ai_settings
  ADD COLUMN IF NOT EXISTS ollama_base_url TEXT DEFAULT NULL;
