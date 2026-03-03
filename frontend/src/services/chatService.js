// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Chat service — API client for all /chat endpoints.
 * Uses fetch (not axios) for SSE streaming support.
 */
import { supabase } from '../lib/supabase'

const BASE = (import.meta.env.VITE_API_URL || '/api') + '/chat'

/**
 * Get the current Supabase JWT for Authorization header.
 * Falls back to localStorage (handles boot/race windows).
 * @returns {Promise<string>} access token or empty string
 */
async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || localStorage.getItem('access_token') || ''
  } catch {
    return localStorage.getItem('access_token') || ''
  }
}

/**
 * Build request headers with Authorization token.
 * @returns {Promise<Record<string, string>>}
 */
async function authHeaders() {
  const token = await getToken()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

/**
 * Parse a JSON or plain-text error body from a failed HTTP response.
 * @param {string} text - Raw response text
 * @returns {string} Human-readable error message
 */
function parseErrorPayload(text) {
  if (!text) return ''
  const trimmed = text.trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed?.detail === 'string' && parsed.detail.trim()) return parsed.detail.trim()
    if (typeof parsed?.message === 'string' && parsed.message.trim()) return parsed.message.trim()
  } catch {
    // plain text
  }
  return trimmed
}

/**
 * Read response body and throw a descriptive Error.
 * @param {Response} resp - Fetch Response object
 * @param {string} fallback - Fallback message if body is empty
 * @returns {Promise<never>} Always throws
 */
async function throwHttpError(resp, fallback) {
  const raw = await resp.text().catch(() => '')
  const parsed = parseErrorPayload(raw)
  const message = parsed || fallback || `Request failed (${resp.status})`
  throw new Error(message)
}

/**
 * Generic JSON request helper.
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
 * @param {string} path - Path appended to BASE
 * @param {object} [body] - Optional JSON body
 * @returns {Promise<any>} Parsed JSON or null (on 204)
 */
async function request(method, path, body) {
  const headers = await authHeaders()
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) {
    await throwHttpError(resp, `Request failed (${resp.status})`)
  }
  if (resp.status === 204) return null
  return resp.json()
}

export const chatService = {
  // ── Models ──────────────────────────────────────────────

  async getModels() {
    return request('GET', '/models')
  },

  async probeModels(provider = null, forceRefresh = true) {
    return request('POST', '/models/probe', {
      provider,
      force_refresh: forceRefresh,
    })
  },

  // ── Conversations CRUD ──────────────────────────────────

  async listConversations(convType = null) {
    const qs = convType ? `?conv_type=${convType}` : ''
    return request('GET', `/conversations${qs}`)
  },

  async createConversation(convType = 'main', title = 'New Conversation') {
    return request('POST', '/conversations', { conv_type: convType, title })
  },

  async renameConversation(id, title) {
    return request('PATCH', `/conversations/${id}`, { title })
  },

  async deleteConversation(id) {
    return request('DELETE', `/conversations/${id}`)
  },

  // ── Messages ─────────────────────────────────────────────

  async getMessages(convId) {
    return request('GET', `/conversations/${convId}/messages`)
  },

  // ── Streaming message (main chat) ────────────────────────
  /**
   * Streams a message. Returns an AsyncGenerator yielding parsed SSE event objects.
   * Events: {type: 'chunk', content}, {type: 'title', title}, {type: 'done', model, message_id}, {type: 'error', message}
   */
  async *streamMessage(convId, content, contextTags = [], modelOverride = null, reasoningEffort = "none") {
    const headers = await authHeaders()
    const resp = await fetch(`${BASE}/conversations/${convId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        context_tags: contextTags,
        model: modelOverride,
        reasoning_effort: reasoningEffort,
      }),
    })

    if (!resp.ok) {
      await throwHttpError(resp, `Stream error (${resp.status})`)
    }

    yield* _readSSEStream(resp.body)
  },

  // ── Streaming agent message ───────────────────────────────
  /**
   * Streams an agent message. Events include action_required in addition to chunk/done/error.
   */
  async *streamAgentMessage(convId, content, reasoningEffort = 'none') {
    const headers = await authHeaders()
    headers['X-User-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    const resp = await fetch(`${BASE}/agent/conversations/${convId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, reasoning_effort: reasoningEffort }),
    })

    if (!resp.ok) {
      await throwHttpError(resp, `Agent stream error (${resp.status})`)
    }

    yield* _readSSEStream(resp.body)
  },

  // ── Agent action execute ──────────────────────────────────

  async executeAction(actionId, confirmed) {
    return request('POST', '/agent/execute', { action_id: actionId, confirmed })
  },

  // ── Rephrase (Alt+L) ─────────────────────────────────────

  async rephrase(text) {
    return request('POST', '/rephrase', { text })
  },

  // ── Feedback ──────────────────────────────────────────────

  async saveFeedback(messageId, convId, feedback) {
    return request('POST', `/messages/${messageId}/feedback`, { conv_id: convId, feedback })
  },

  async getReasoningSummary(messageId, convId) {
    return request('POST', `/messages/${messageId}/reasoning-summary`, { conv_id: convId })
  },

  // ── Export ───────────────────────────────────────────────

  async exportConversation(convId, format = 'markdown', customFilename = null) {
    const token = await getToken()
    const resp = await fetch(`${BASE}/conversations/${convId}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`Export error: ${resp.status}`)
    const blob = await resp.blob()
    const contentDisposition = resp.headers.get('Content-Disposition') || ''
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
    const filename = customFilename || (filenameMatch ? filenameMatch[1] : `conversation.${format === 'markdown' ? 'md' : format}`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  async exportAllConversations(username) {
    const token = await getToken()
    const resp = await fetch(`${BASE}/conversations/export-all?format=markdown`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`Export error: ${resp.status}`)
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toLocaleDateString().replace(/\//g, "-")
    a.download = `All conversation YesBill AI - ${username || 'User'} - ${dateStr}.md`
    a.click()
    URL.revokeObjectURL(url)
  },

  async deleteAllConversations() {
    await request('DELETE', '/conversations');
  },

  async deleteAllAgentConversations() {
    await request('DELETE', '/conversations?conv_type=agent');
  },
}

/** Internal SSE stream reader — yields parsed event objects. */
async function* _readSSEStream(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete last line in buffer
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data)
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export default chatService
