// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * welcomeSession — tiny sessionStorage bridge for the WelcomeScreen transition.
 *
 * Flow:
 *  1. After successful login / auth-callback, the source page calls
 *     setWelcomeTransition(config) then immediately navigates via router.replace().
 *  2. The root-layout WelcomeOverlay component reads and clears this flag after
 *     the destination route mounts, rendering the WelcomeScreen *on top of* the
 *     new page so the full fade-out animation plays without interruption.
 */

const KEY = 'yb_welcome';

/**
 * Store the welcome transition config.
 * @param {{ name: string, isNewUser: boolean }} config
 */
export function setWelcomeTransition({ name, isNewUser }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ name, isNewUser }));
  } catch {
    // sessionStorage unavailable (private browsing, storage full) — silent fail.
  }
}

/**
 * Read and atomically clear the welcome config.
 * Returns null if no pending transition.
 * @returns {{ name: string, isNewUser: boolean } | null}
 */
export function getAndClearWelcomeTransition() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
