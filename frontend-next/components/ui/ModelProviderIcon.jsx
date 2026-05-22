'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { assetUrl } from '@/lib/utils'

/**
 * Detect provider from a model ID string or explicit provider key.
 * Returns one of: 'anthropic' | 'openai' | 'google' | 'ollama' | null
 */
export function detectProvider(modelIdOrProvider = '') {
  const s = (modelIdOrProvider || '').toLowerCase()
  if (!s) return null
  if (s === 'anthropic' || s.includes('claude')) return 'anthropic'
  if (s === 'openai' || s.startsWith('gpt') || s.startsWith('o1') || s.startsWith('o3') || s.startsWith('o4')) return 'openai'
  if (s === 'google' || s.includes('gemini')) return 'google'
  if (s === 'ollama') return 'ollama'
  return null
}

const PROVIDER_META = {
  anthropic: {
    icon:    '/assets/icons/anthropic.png',
    bg:      'transparent',   // icon already has its own sandy background
    border:  false,
    label:   'Anthropic',
  },
  openai: {
    icon:    '/assets/icons/openai.png',
    bg:      '#ffffff',
    border:  true,
    label:   'OpenAI',
    // OpenAI logo is a wide wordmark — crop to just the left symbol region
    objectPosition: 'left center',
  },
  google: {
    icon:    '/assets/icons/google-ai.png',
    bg:      '#ffffff',
    border:  true,
    label:   'Google',
  },
  ollama: {
    icon:    '/assets/icons/ollama.png',
    bg:      '#ffffff',
    border:  true,
    label:   'Ollama',
  },
}

/**
 * ModelProviderIcon
 *
 * Props:
 *  - model      {string}  model id or provider key  (e.g. "claude-sonnet-4-6", "anthropic")
 *  - provider   {string}  optional explicit provider key (overrides model detection)
 *  - size       {number}  pixel size of the icon (default 16)
 *  - className  {string}  extra classes on the wrapper
 *  - style      {object}  extra styles on the wrapper
 */
export default function ModelProviderIcon({
  model,
  provider: explicitProvider,
  size = 16,
  className = '',
  style = {},
}) {
  const provider = explicitProvider || detectProvider(model)
  const meta = PROVIDER_META[provider]
  if (!provider || !meta) return null

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full ${className}`}
      style={{
        width:  size,
        height: size,
        backgroundColor: meta.bg,
        border: meta.border ? '1px solid #e5e7eb' : 'none',
        ...style,
      }}
      title={meta.label}
    >
      <img
        src={assetUrl(meta.icon)}
        alt={meta.label}
        style={{
          width:          size,
          height:         size,
          objectFit:      'contain',
          objectPosition: meta.objectPosition || 'center center',
          display:        'block',
        }}
      />
    </span>
  )
}
