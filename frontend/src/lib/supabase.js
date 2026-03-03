// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Supabase Client Configuration
 * 
 * This module sets up the Supabase client for authentication and database operations.
 * Uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

/**
 * Supabase client instance
 * 
 * Configured with:
 * - localStorage session persistence
 * - Auto-refresh tokens (proactively refreshes before JWT expiry)
 * - No artificial fetch timeouts — requests complete naturally
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ─── Shared helpers ──────────────────────────────────────────────
//
// IMPORTANT: The Supabase client automatically reads its session from
// localStorage and attaches auth headers (JWT) to every request.
// You do NOT need to call getSession() before making DB/Storage calls.
// getSession() uses navigator.locks which causes contention & deadlocks
// when called from onAuthStateChange callbacks or in parallel.
//
// For userId (needed for WHERE clauses), useUser.js and AuthCallback.jsx
// write 'user_id' to localStorage on every auth event. Read that instead.
//
// For CRITICAL WRITES (updates, inserts), use ensureAuth() below to
// guarantee the JWT is valid before the operation.

/**
 * Check if the stored JWT is expired or about to expire.
 * Reads from localStorage — zero async, zero locks.
 * @returns {boolean} true if expired or missing
 */
function isJwtExpired() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return true
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    // Consider expired if less than 60 seconds remaining
    return (payload.exp * 1000) < (Date.now() + 60000)
  } catch {
    return true
  }
}

/**
 * Ensure auth session is valid before a critical write operation.
 * 
 * ONLY use this OUTSIDE of onAuthStateChange callbacks (safe in service
 * functions, event handlers, etc). Inside onAuthStateChange, the auth
 * lock is already held and calling this would deadlock.
 *
 * Flow:
 * 1. Quick local check: is the stored JWT still valid? → return userId
 * 2. If expired: call refreshSession() to get a fresh token
 * 3. If refresh fails: throw — user needs to re-authenticate
 *
 * @returns {Promise<string>} userId
 * @throws {Error} if session is invalid and can't be refreshed
 */
export async function ensureAuth() {
  // Fast path: JWT is valid locally
  if (!isJwtExpired()) {
    const userId = localStorage.getItem('user_id')
    if (userId) return userId
  }

  // JWT expired or missing — force refresh via Supabase auth server
  console.warn('⚠️ JWT expired or missing — refreshing session...')
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Session refresh failed:', error.message)
      throw new Error('Your session has expired. Please sign in again.')
    }
    if (!data?.session?.user?.id) {
      throw new Error('Your session has expired. Please sign in again.')
    }
    // Store the fresh token & user info
    localStorage.setItem('access_token', data.session.access_token)
    localStorage.setItem('user_id', data.session.user.id)
    if (data.session.user.email) {
      localStorage.setItem('user_email', data.session.user.email)
    }
    return data.session.user.id
  } catch (err) {
    if (err.message?.includes('sign in')) throw err
    throw new Error('Your session has expired. Please sign in again.')
  }
}

/**
 * Get user ID synchronously from localStorage.
 * Set by useUser.js on every auth state change and by AuthCallback on login.
 * Zero async, zero locks, zero timeouts — instant & reliable.
 *
 * @returns {string|null} userId or null
 */
export function getStoredUserId() {
  return localStorage.getItem('user_id') || null
}

/**
 * Get user email synchronously from localStorage.
 * @returns {string} email or empty string
 */
export function getStoredUserEmail() {
  return localStorage.getItem('user_email') || ''
}

// Backward-compatible aliases for existing code
export const getSessionUserId = async () => getStoredUserId()
export const ensureSession = async () => null

export default supabase
