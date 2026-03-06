'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * useUser Hook
 * 
 * Custom React hook for managing user authentication state.
 * Uses a shared singleton to prevent duplicate API calls across components.
 * Provides real-time updates when authentication state changes.
 */

import { useRef, useCallback, useMemo, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

// ─── Shared singleton store ────────────────────────────────────────
// All useUser() hooks read from this single source of truth.
// Prevents duplicate getSession / fetchProfile calls.

const PROFILE_CACHE_KEY = 'yesbill_profile_cache'

function loadCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCachedProfile(profile) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    }
  } catch { /* ignore quota errors */ }
}

// ─── Fast-path loading optimization ───────────────────────────────
// If we have both user_id AND a non-expired access_token in localStorage,
// the user was previously authenticated. Skip the loading state immediately
// so pages don't wait for INITIAL_SESSION before showing content.
// INITIAL_SESSION will still fire and update/correct state if needed.
function hasValidStoredSession() {
  try {
    const userId = localStorage.getItem('user_id')
    const token = localStorage.getItem('access_token')
    if (!userId || !token) return false
    // Check token expiry (same logic as isJwtExpired in lib/supabase.js)
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    return (payload.exp * 1000) > Date.now()
  } catch { return false }
}

// ─── Restore minimal user from localStorage (prevents premature redirect) ─
// When the fast-path skips loading=true, `_user` must also be set immediately;
// otherwise AppLayout's `if (!loading && !user)` fires before INITIAL_SESSION
// and redirects the user to /login (causing the refresh flash + forced /dashboard).
// INITIAL_SESSION will replace this placeholder with the real Supabase user.
function loadStoredUser() {
  try {
    const userId = localStorage.getItem('user_id')
    const email = localStorage.getItem('user_email')
    if (!userId || !hasValidStoredSession()) return null
    return { id: userId, email: email || '' }
  } catch { return null }
}

let _user = typeof window !== 'undefined' ? loadStoredUser() : null
let _profile = loadCachedProfile()   // instant restore from cache
let _session = null
let _loading = !(typeof window !== 'undefined' && hasValidStoredSession())   // skip loading for returning users
let _profileLoading = false
let _initialized = false
let _listeners = new Set()

function notify() {
  // Build a fresh snapshot before notifying so all subscribers see the same object
  _snapshot = { user: _user, profile: _profile, session: _session, loading: _loading, profileLoading: _profileLoading }
  _listeners.forEach(fn => fn())
}

// Cached snapshot object — only replaced inside notify()
let _snapshot = { user: _user, profile: _profile, session: _session, loading: _loading, profileLoading: _profileLoading }

function getSnapshot() {
  return _snapshot
}

// Server-side snapshot: no localStorage on server, return empty/loading state
const _serverSnapshot = { user: null, profile: null, session: null, loading: true, profileLoading: false }
function getServerSnapshot() {
  return _serverSnapshot
}

function subscribe(listener) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

// ─── Profile fetch (single in-flight promise) ─────────────────────

let _profilePromise = null

async function fetchProfileFromDB(userId) {
  if (!userId) return null
  try {
    // Don't call ensureSession() here — it uses getSession() which acquires
    // navigator.locks. When called from onAuthStateChange (which fires during
    // a lock-holding token refresh), this causes a deadlock.
    // The Supabase client already has the auth headers set internally.
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.warn('useUser: Profile query error', error.message)
      return null
    }
    return data || null
  } catch (err) {
    if (err.name === 'AbortError') return null
    console.error('useUser: fetchProfile error', err.message)
    return null
  }
}

async function ensureProfileFromDB(authUser) {
  if (!authUser) return null

  // De-duplicate: if a fetch is already in-flight for same user, reuse it
  if (_profilePromise) return _profilePromise

  _profilePromise = (async () => {
    try {
      let userProfile = await fetchProfileFromDB(authUser.id)

      if (!userProfile) {
        // Create profile
        const newProfileData = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
          display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.avatar || null
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .upsert(newProfileData, { onConflict: 'id' })
          .select()
          .single()

        if (!error) userProfile = data
      }
      return userProfile
    } catch (err) {
      if (err.name === 'AbortError') return null
      console.error('useUser: ensureProfile error', err.message)
      return null
    } finally {
      _profilePromise = null
    }
  })()

  return _profilePromise
}

// ─── Session handler ──────────────────────────────────────────────
//
// IMPORTANT (from Supabase docs):
// "You can easily create a dead-lock by using await on a call to
//  another method of the Supabase library [inside onAuthStateChange]."
//
// Solution: The synchronous part (updating state/localStorage) runs
// inside the callback. The async part (fetching profile from DB) is
// dispatched via setTimeout(fn, 0) so it runs AFTER the callback
// finishes and the auth lock is released.

function handleSessionSync(newSession) {
  // ── Synchronous part (safe inside onAuthStateChange) ──
  if (newSession?.user) {
    // Update localStorage first so API consumers never see user=true while token is missing.
    if (newSession.access_token) localStorage.setItem('access_token', newSession.access_token)
    localStorage.setItem('user_id', newSession.user.id)
    localStorage.setItem('user_email', newSession.user.email || '')
    if (newSession.user.user_metadata?.full_name) {
      localStorage.setItem('user_name', newSession.user.user_metadata.full_name)
    }

    _session = newSession
    _user = newSession.user
    _loading = false
    notify()

    // ── Async part — dispatched OUTSIDE the callback ──
    // Per Supabase docs: use setTimeout to avoid deadlocks
    _profileLoading = true
    notify()
    setTimeout(() => fetchAndSetProfile(newSession.user), 0)
  } else {
    _session = null
    _user = null
    _profile = null
    _loading = false
    _profileLoading = false
    saveCachedProfile(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_name')
    }
    notify()
  }
}

// Async profile fetch — runs outside onAuthStateChange callback
async function fetchAndSetProfile(authUser) {
  try {
    let userProfile = await ensureProfileFromDB(authUser)
    if (!userProfile) {
      // Single retry after a short delay
      await new Promise(r => setTimeout(r, 500))
      userProfile = await ensureProfileFromDB(authUser)
    }
    if (userProfile) {
      _profile = userProfile
      saveCachedProfile(userProfile)
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('useUser: Profile fetch error:', err.message)
    }
  } finally {
    _profileLoading = false
    notify()
  }
}

// ─── Initialization (runs once globally) ──────────────────────────

function initAuth() {
  if (_initialized) return
  _initialized = true

  // Use onAuthStateChange as the SINGLE source of truth for session state.
  // The INITIAL_SESSION event fires immediately with the cached session,
  // so there's no need for a separate getSession() call (which can cause
  // navigator.locks contention / deadlocks).
  //
  // CRITICAL: This callback is NOT async. Per Supabase docs, async callbacks
  // that await Supabase methods cause deadlocks. All async work (profile
  // fetching) is dispatched via setTimeout inside handleSessionSync.
  supabase.auth.onAuthStateChange((event, newSession) => {
    try {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession) {
          handleSessionSync(newSession)
        } else {
          // INITIAL_SESSION with null = no stored session
          _loading = false
          _profile = null
          saveCachedProfile(null)
          notify()
        }
      } else if (event === 'SIGNED_OUT') {
        handleSessionSync(null)
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('useUser: Auth change error', error.message)
      _loading = false
      notify()
    }
  })
}

// ─── React Hook ───────────────────────────────────────────────────

export function useUser() {
  // Start global init on first hook mount
  const initRef = useRef(false)
  if (!initRef.current) {
    initRef.current = true
    initAuth()
  }

  // Subscribe to the shared store
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const { user, profile, session, loading, profileLoading } = snap

  // Memoized display name – uses cached profile for instant render
  const displayName = useMemo(() => {
    if (profile?.display_name) return profile.display_name
    if (profile?.full_name) return profile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }, [profile, user])

  // Memoized avatar URL – treat empty strings as null
  const avatarUrl = useMemo(() => {
    const profileAvatar = profile?.avatar_url?.trim()
    if (profileAvatar) return profileAvatar
    const metaAvatar = user?.user_metadata?.avatar_url?.trim()
    if (metaAvatar) return metaAvatar
    const metaPicture = user?.user_metadata?.picture?.trim()
    if (metaPicture) return metaPicture
    const metaAvatarAlt = user?.user_metadata?.avatar?.trim()
    if (metaAvatarAlt) return metaAvatarAlt
    return null
  }, [profile, user])

  // Memoized full name
  const fullName = useMemo(() => {
    if (profile?.full_name) return profile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) return user.email.split('@')[0]
    return ''
  }, [profile, user])

  // Memoized cover image URL – treat empty strings as null
  const coverImageUrl = useMemo(() => {
    const url = profile?.cover_image_url?.trim()
    return url || null
  }, [profile])

  // Force refresh profile data — with retry for transient issues
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null
    let freshProfile = await fetchProfileFromDB(user.id)
    // One retry if the first attempt came back empty (session may have just refreshed)
    if (!freshProfile) {
      await new Promise(r => setTimeout(r, 500))
      freshProfile = await fetchProfileFromDB(user.id)
    }
    if (freshProfile) {
      _profile = freshProfile
      saveCachedProfile(freshProfile)
      notify()
    }
    return freshProfile
  }, [user?.id])

  return { 
    user, 
    profile,
    loading, 
    profileLoading,
    session,
    isAuthenticated: !!user,
    displayName,
    avatarUrl,
    fullName,
    coverImageUrl,
    email: user?.email || '',
    refreshProfile
  }
}

/**
 * Directly reset the singleton store — used during logout
 * to guarantee the user state is cleared before navigation.
 */
export function resetUserStore() {
  _user = null
  _profile = null
  _session = null
  _loading = false
  _profileLoading = false
  _profilePromise = null
  saveCachedProfile(null)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_name')
    localStorage.removeItem(PROFILE_CACHE_KEY)
  }
  notify()
}

export default useUser
