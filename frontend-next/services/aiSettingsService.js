'use client'
﻿import { assetUrl } from "../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * AI Settings Service
 * 
 * Handles AI provider configuration operations:
 * - Get/save AI settings per provider (stored in Supabase)
 * - Validate API keys (via backend)
 * - Fetch available providers and models (via backend)
 * 
 * Settings are per-user and fetched directly from Supabase DB (like Profile).
 * Key validation is done via the backend to keep API keys server-side.
 */

import { supabase } from '../lib/supabase'
import api from './api'

export const aiSettingsService = {
  // ── Direct Supabase DB Operations (like profileService) ──

  /**
   * Get AI settings for a specific provider
   * @param {string} userId - User's ID
   * @param {string} provider - Provider name (openai, anthropic, google)
   * @returns {Promise<object|null>} AI settings or null
   */
  async getSettings(userId, provider = 'openai') {
    try {
      const { data, error } = await supabase
        .from('user_ai_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching AI settings:', error.message)
        return null
      }
      return data
    } catch (err) {
      console.warn('AI settings table may not exist yet:', err.message)
      return null
    }
  },

  /**
   * Get all AI settings for a user (all providers)
   * @param {string} userId - User's ID  
   * @returns {Promise<object[]>} Array of AI settings
   */
  async getAllSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_ai_settings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')

      if (error) {
        console.warn('Error fetching all AI settings:', error.message)
        return []
      }
      return data || []
    } catch (err) {
      console.warn('AI settings table may not exist yet:', err.message)
      return []
    }
  },

  /**
   * Save (upsert) AI settings for a provider
   * Saves directly to Supabase first for reliability; falls back to backend API if needed.
   * @param {string} userId - User's ID
   * @param {object} settings - { provider, api_key_encrypted, selected_model, enable_insights }
   * @returns {Promise<object>} Saved settings
   */
  async saveSettings(userId, settings) {
    const provider = settings.provider || 'openai'
    const upsertData = {
      user_id: userId,
      provider,
      api_key_encrypted: settings.api_key_encrypted || '',
      selected_model: settings.selected_model || '',
      enable_insights: settings.enable_insights ?? true,
      is_key_valid: settings.is_key_valid ?? false,
    }
    // Include reasoning effort only if the column exists (added in migration 023)
    if (settings.default_reasoning_effort !== undefined) {
      upsertData.default_reasoning_effort = settings.default_reasoning_effort || 'none'
    }

    // Primary path: save directly to Supabase (no backend dependency)
    try {
      const { data, error } = await supabase
        .from('user_ai_settings')
        .upsert(upsertData, { onConflict: 'user_id,provider' })
        .select()
        .single()
      if (error) throw error
      return {
        ...data,
        api_key_encrypted: settings.api_key_encrypted,
        is_key_valid: settings.is_key_valid ?? data.is_key_valid ?? false,
      }
    } catch (supabaseError) {
      // If reasoning_effort column missing, retry without it
      if (supabaseError?.message?.includes('default_reasoning_effort')) {
        const { default_reasoning_effort, ...safeData } = upsertData
        const { data, error } = await supabase
          .from('user_ai_settings')
          .upsert(safeData, { onConflict: 'user_id,provider' })
          .select()
          .single()
        if (!error && data) {
          return { ...data, api_key_encrypted: settings.api_key_encrypted, is_key_valid: settings.is_key_valid ?? false }
        }
      }
      // Fallback: try backend API (may be sleeping on Render free tier)
      try {
        const response = await api.post('/ai/settings', {
          provider,
          api_key: settings.api_key_encrypted,
          selected_model: settings.selected_model,
          enable_insights: settings.enable_insights ?? true,
          default_reasoning_effort: settings.default_reasoning_effort || 'none',
        })
        return { ...response.data, api_key_encrypted: settings.api_key_encrypted, is_key_valid: settings.is_key_valid ?? false }
      } catch (backendError) {
        console.error('Error saving AI settings (both paths failed):', backendError)
        throw new Error('Could not save AI settings. Please try again.')
      }
    }
  },

  /**
   * Update specific fields of AI settings
   * @param {string} userId - User's ID
   * @param {string} provider - Provider name
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated settings
   */
  async updateSettings(userId, provider, updates) {
    // Primary: direct Supabase update
    try {
      const updateData = {}
      if (updates.api_key !== undefined) updateData.api_key_encrypted = updates.api_key
      if (updates.selected_model !== undefined) updateData.selected_model = updates.selected_model
      if (updates.enable_insights !== undefined) updateData.enable_insights = updates.enable_insights
      if (updates.default_reasoning_effort !== undefined) updateData.default_reasoning_effort = updates.default_reasoning_effort
      const { data, error } = await supabase
        .from('user_ai_settings')
        .update(updateData)
        .eq('user_id', userId)
        .eq('provider', provider)
        .select()
        .single()
      if (error) throw error
      return { ...data, api_key_encrypted: updates.api_key || data.api_key_encrypted || '' }
    } catch (supabaseError) {
      // Fallback to backend API
      try {
        const response = await api.patch(`/ai/settings/${provider}`, {
          api_key: updates.api_key,
          selected_model: updates.selected_model,
          enable_insights: updates.enable_insights,
          default_reasoning_effort: updates.default_reasoning_effort,
        })
        return { ...response.data, api_key_encrypted: updates.api_key || '' }
      } catch (backendError) {
        console.error('Error updating AI settings via backend:', backendError)
        throw backendError
      }
    }
  },

  /**
   * Delete AI settings for a provider
   * @param {string} userId - User's ID
   * @param {string} provider - Provider name
   */
  async deleteSettings(userId, provider) {
    // Primary: delete directly from Supabase
    const { error: supaErr } = await supabase
      .from('user_ai_settings')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)
    if (supaErr) {
      console.warn('Supabase deleteSettings error:', supaErr.message)
    }
    // Also notify backend to clear any server-side cached state (ignore if unavailable)
    try {
      await api.delete(`/ai/settings/${provider}`)
    } catch (backendError) {
      console.warn('Backend delete request failed (record removed from Supabase):', backendError.message)
    }
  },

  // ── Backend API Operations (for key validation) ──

  /**
   * Validate an API key via the backend
   * The backend makes the actual call to the provider so the key stays server-side
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to validate
   * @returns {Promise<object>} { valid, provider, message, models_available }
   */
  async validateKey(provider, apiKey) {
    try {
      const response = await api.post('/ai/validate-key', {
        provider,
        api_key: apiKey,
      })
      return response.data
    } catch (error) {
      // If backend is unavailable, do client-side format validation only
      console.warn('Backend validation unavailable, falling back to format check:', error.message)
      return aiSettingsService.formatValidateKey(provider, apiKey)
    }
  },

  /**
   * Client-side format validation (fallback when backend is unavailable)
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to validate
   * @returns {object} { valid, provider, message }
   */
  formatValidateKey(provider, apiKey) {
    const key = (apiKey || '').trim()

    if (!key) {
      return { valid: false, provider, message: 'API key cannot be empty' }
    }

    switch (provider) {
      case 'openai':
        if (!key.startsWith('sk-')) {
          return { valid: false, provider, message: "Invalid format. OpenAI keys start with 'sk-'" }
        }
        if (key.length < 20) {
          return { valid: false, provider, message: 'API key is too short' }
        }
        return { valid: true, provider, message: 'Format looks valid. Click Validate to verify.' }

      case 'anthropic':
        if (!key.startsWith('sk-ant-')) {
          return { valid: false, provider, message: "Invalid format. Anthropic keys start with 'sk-ant-'" }
        }
        return { valid: true, provider, message: 'Format looks valid. Click Validate to verify.' }

      case 'google':
        if (key.length < 10) {
          return { valid: false, provider, message: 'API key is too short' }
        }
        return { valid: true, provider, message: 'Format looks valid. Click Validate to verify.' }

      default:
        return { valid: true, provider, message: 'Format validation not available for this provider' }
    }
  },

  /**
   * Get available providers and models from the backend
   * @returns {Promise<object[]>} Array of provider info objects
   */
  async getProviders() {
    try {
      const response = await api.get('/ai/providers')
      return response.data
    } catch (error) {
      console.warn('Backend providers unavailable, using defaults:', error.message)
      // Return hardcoded fallback if backend is down
      return aiSettingsService.getDefaultProviders()
    }
  },

  /**
   * Trigger model availability probe and refresh probe cache.
   */
  async probeModels(provider = null, forceRefresh = true) {
    const response = await api.post('/chat/models/probe', {
      provider,
      force_refresh: forceRefresh,
    })
    return response.data
  },

  /**
   * Default providers when backend is unavailable
   */
  getDefaultProviders() {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT models for text generation, analysis, and insights',
        logo_url: assetUrl('/assets/icons/openai.png'),
        docs_url: 'https://platform.openai.com/api-keys',
        key_prefix: 'sk-',
        requires_key: true,
        models: [
          { id: 'gpt-5.5', name: 'GPT-5.5', description: 'Flagship model, April 2026', recommended: true },
          { id: 'gpt-5.4', name: 'GPT-5.4', description: 'Advanced reasoning, March 2026', recommended: false },
          { id: 'gpt-5.2', name: 'GPT-5.2', description: 'Context: 400,000', recommended: false },
          { id: 'gpt-5.1', name: 'GPT-5.1', description: 'Context: 400,000', recommended: false },
          { id: 'gpt-5', name: 'GPT-5', description: 'Context: 400,000', recommended: false },
          { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', description: 'Context: 128,000', recommended: false },
          { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', description: 'Context: 64,000', recommended: false },
          { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Context: 128,000', recommended: false },
          { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Context: 64,000', recommended: false },
          { id: 'o1', name: 'o1', description: 'Advanced reasoning', recommended: false },
        ],
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models for safe, helpful AI assistance',
        logo_url: assetUrl('/assets/icons/anthropic.png'),
        docs_url: 'https://console.anthropic.com/settings/keys',
        key_prefix: 'sk-ant-',
        requires_key: true,
        models: [
          { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Context: 200,000', recommended: true },
          { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Context: 200,000', recommended: false },
          { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Context: 200,000', recommended: false },
        ],
      },
      {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini models for multimodal AI capabilities',
        logo_url: assetUrl('/assets/icons/google-ai.png'),
        docs_url: 'https://aistudio.google.com/apikey',
        key_prefix: 'AI',
        requires_key: true,
        models: [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Context: 1,000,000', recommended: true },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Context: 1,000,000', recommended: false },
          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)', description: 'Preview', recommended: false },
          { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', description: 'Preview', recommended: false },
        ],
      },
      {
        id: 'ollama',
        name: 'Ollama',
        description: 'Run local AI models on your own machine — no API key required',
        logo_url: assetUrl('/assets/icons/ollama.png'),
        docs_url: 'https://ollama.com',
        key_prefix: null,
        requires_key: false,
        models: [], // populated dynamically from the user's Ollama instance
      },
    ]
  },

  /**
   * Check if AI Insights are enabled for this user.
   * Returns true if ANY provider has a valid key AND enable_insights = true.
   * Falls back to true if no settings exist yet (benefit of the doubt).
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async getInsightsEnabled(userId) {
    if (!userId) return true
    try {
      const allSettings = await aiSettingsService.getAllSettings(userId)
      if (!allSettings.length) return true // no settings yet — assume enabled
      // If any valid provider has insights enabled, return true
      const activeSettings = allSettings.find((s) => s.is_key_valid && s.enable_insights)
      if (activeSettings) return true
      // If there's at least one valid key but all have insights disabled
      const hasValidKey = allSettings.some((s) => s.is_key_valid)
      if (hasValidKey) return false
      // No valid keys at all — return true (will show content, backend handles)
      return true
    } catch {
      return true
    }
  },

  /**
   * Get the display name of the user's selected AI model (from Supabase user_ai_settings).
   * Used for UI copy that references "your selected model" (e.g. Bills page).
   * @param {string} userId - User's ID
   * @returns {Promise<string|null>} Model display name (e.g. "GPT-4o", "Claude Sonnet 4") or null if none set
   */
  async getSelectedModelDisplayName(userId) {
    if (!userId) return null
    try {
      const [allSettings, providers] = await Promise.all([
        aiSettingsService.getAllSettings(userId),
        aiSettingsService.getProviders(),
      ])
      for (const setting of allSettings) {
        const modelId = setting?.selected_model
        if (!modelId) continue
        const provider = providers.find((p) => p.id === setting.provider)
        const model = provider?.models?.find((m) => m.id === modelId)
        if (model?.name) return model.name
        // Unknown model id: format nicely (e.g. gpt-4o -> GPT-4o)
        return modelId
          .split(/[-_\s]+/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
          .join(' ')
      }
      return null
    } catch (err) {
      console.warn('Could not resolve selected model display name:', err.message)
      return null
    }
  },

  /**
   * Mask an API key for display
   * @param {string} key - Raw API key
   * @returns {string} Masked key showing only last 4 chars
   */
  maskKey(key) {
    if (!key || key.length < 8) return '••••••••'
    return '•'.repeat(key.length - 4) + key.slice(-4)
  },
}

export default aiSettingsService
