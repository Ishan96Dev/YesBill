// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * API Service — Axios client for YesBill backend
 *
 * Handles all HTTP communication with the FastAPI backend.
 * Automatically attaches Supabase JWT to every request and retries on 401.
 *
 * Exported API modules:
 * - authAPI    → User auth endpoints (/auth/*)
 * - recordsAPI → Daily billing records (/bills/records/*)
 * - configAPI  → Bill configuration (/bills/config/*)
 * - generatedBillsAPI → AI-generated bills (/bills/generate/*)
 * - aiAnalyticsAPI    → AI analytics summaries (/chat/analytics/*)
 */

import axios from 'axios'
import { supabase } from '../lib/supabase'

/** Base Axios instance — all API calls use this client */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://yesbill.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Prevents concurrent token refresh calls (singleton promise) */
let refreshPromise = null

/**
 * Get the current valid session token from Supabase.
 * Also syncs token and user ID to localStorage for offline reads.
 * @returns {Promise<string|null>} JWT access token or null
 */
async function getSessionToken() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token || null
    if (token) {
      localStorage.setItem('access_token', token)
      if (session?.user?.id) {
        localStorage.setItem('user_id', session.user.id)
      }
    }
    return token
  } catch {
    return null
  }
}

/**
 * Refresh the Supabase session (called on 401 responses).
 * Uses a shared promise so parallel requests don't trigger duplicate refreshes.
 * @returns {Promise<string|null>} Fresh JWT access token, or null if refresh fails
 */
async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) return null
        const token = data?.session?.access_token || null
        if (token) {
          localStorage.setItem('access_token', token)
          if (data?.session?.user?.id) {
            localStorage.setItem('user_id', data.session.user.id)
          }
        }
        return token
      } catch {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

// Attach Supabase JWT to every request using live session as source-of-truth.
api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {}

  let token = await getSessionToken()
  if (!token) {
    // Fallback for early boot/race windows
    token = localStorage.getItem('access_token')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}

    if (error.response?.status === 401) {
      const url = originalRequest?.url || ''
      const isAIRoute = url.includes('/ai/')

      // Root fix: if token expired/rotated, refresh and retry once.
      if (!isAIRoute && !originalRequest._retry) {
        originalRequest._retry = true
        const freshToken = await refreshToken()
        if (freshToken) {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return api(originalRequest)
        }
      }

      if (!isAIRoute) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/auth')) {
          const returnPath = window.location.pathname + window.location.search
          const redirect = returnPath && returnPath !== '/' ? '?redirect=' + encodeURIComponent(returnPath) : ''
          window.location.replace('/login' + redirect)
        }
      }
    }
    return Promise.reject(error)
  }
)

/** Authentication endpoints — login, register, notify, account deletion */
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, password_confirm) =>
    api.post('/auth/register', { email, password, password_confirm }),
  notifyPasswordChange: () => api.post('/auth/notify-password-change'),
  deleteAccount: () => api.delete('/auth/account'),
}

/** Daily billing record endpoints — fetch monthly records, create, summary */
export const recordsAPI = {
  getMonth: (yearMonth) => api.get(`/bills/records?year_month=${yearMonth}`),
  create: (date, status) => api.post('/bills/records', { date, status }),
  getSummary: (yearMonth) => api.get(`/bills/summary/${yearMonth}`),
}

/** Bill configuration endpoints — get, create, update billing config */
export const configAPI = {
  get: () => api.get('/bills/config'),
  create: (data) => api.post('/bills/config', data),
  update: (id, data) => api.patch(`/bills/config/${id}`, data),
}

/** Generated bills (AI): generate, list, get, delete */
export const generatedBillsAPI = {
  generate: (yearMonth, serviceIds, customNote = null) =>
    api.post('/bills/generate', {
      year_month: yearMonth,
      service_ids: serviceIds,
      custom_note: customNote
    }),
  // Same as generate but also dispatches the bill email (used by Generate Now modal)
  generateAndSend: (yearMonth, serviceIds, customNote = null) =>
    api.post('/bills/generate?send_email=true', {
      year_month: yearMonth,
      service_ids: serviceIds,
      custom_note: customNote
    }),
  list: () => api.get('/bills/generated'),
  get: (id) => api.get(`/bills/generated/${id}`),
  delete: (id) => api.delete(`/bills/generated/${id}`),
  markPaid: (id, data) => api.patch(`/bills/generated/${id}/paid`, data),
  listForMonth: (yearMonth) => api.get(`/bills/generated/month/${yearMonth}`),
}

/** AI analytics endpoints — chat-based bill summaries and insights */
export const aiAnalyticsAPI = {
  getSummary: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.year_month) qs.set('year_month', params.year_month)
    if (params.days) qs.set('days', String(params.days))
    return api.get(`/chat/analytics/summary?${qs.toString()}`).then(r => r.data)
  },
}

export default api
