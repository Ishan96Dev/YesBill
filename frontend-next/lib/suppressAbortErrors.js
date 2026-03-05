'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Suppress *harmless* AbortError warnings from Supabase during React Strict Mode
 * 
 * In development, React Strict Mode intentionally mounts/unmounts components twice
 * to help detect side effects. This causes Supabase auth listeners to be subscribed
 * and unsubscribed rapidly, resulting in "signal is aborted without reason" errors.
 * 
 * These errors are harmless and only occur in development mode.
 * This handler filters them out to keep the console clean.
 * 
 * IMPORTANT: We only suppress the specific "signal is aborted without reason" message.
 * Other AbortErrors (e.g. from our global fetch timeout) are NOT suppressed —
 * those indicate real connection issues that should be surfaced.
 */

let abortErrorsSuppressed = false

export function suppressSupabaseAbortErrors() {
  if (abortErrorsSuppressed) return
  abortErrorsSuppressed = true

  // Store the original console.error
  const originalError = console.error

  // Override console.error to filter out ONLY the StrictMode-specific Supabase abort error
  console.error = (...args) => {
    const msg = args.map(a => (typeof a === 'string' ? a : a?.message || a?.toString?.() || '')).join(' ')

    // Only suppress the exact StrictMode abort — NOT general timeout/abort errors
    if (msg.includes('signal is aborted without reason')) {
      return
    }

    // Let everything else through
    originalError.apply(console, args)
  }

  // Handle unhandled promise rejections — only suppress the harmless StrictMode ones
  const handleUnhandledRejection = (event) => {
    const error = event.reason

    // Only suppress the exact "without reason" variant (StrictMode teardown)
    if (
      error?.name === 'AbortError' &&
      error?.message?.includes('signal is aborted without reason')
    ) {
      event.preventDefault()
      return
    }
    // All other AbortErrors (e.g., timeout aborts) bubble up normally
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  console.debug('✅ Supabase StrictMode AbortError suppression enabled')
}

// Auto-enable in development mode
if (import.meta.env.DEV) {
  suppressSupabaseAbortErrors()
}
