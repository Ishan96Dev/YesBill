'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * WelcomeOverlay
 *
 * Mounted once in the root layout — persists across ALL page navigations.
 * Reads a sessionStorage flag (written by LoginClient / AuthCallbackClient
 * right before they call router.replace) and renders WelcomeScreen *on the
 * destination page* so the full fade-out animation is never cut short by the
 * source page unmounting.
 *
 * Why sessionStorage instead of React context?
 * Context resets on full-page refresh; sessionStorage survives JS re-parse.
 * For in-app soft navs context would work, but sessionStorage is simpler and
 * works for the auth-callback → dashboard redirect too.
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import WelcomeScreen from './WelcomeScreen';
import { getAndClearWelcomeTransition } from '@/lib/welcomeSession';

export default function WelcomeOverlay() {
  const pathname = usePathname();

  // Synchronous initializer: reads sessionStorage on component mount so the
  // flag is consumed in the *same* render that first shows the new page.
  // This prevents even a single-frame flash of the destination page before
  // WelcomeScreen appears on top.
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') return getAndClearWelcomeTransition();
    return null;
  });

  // For subsequent client-side navigations (the common path): check sessionStorage
  // whenever the route pathname changes.
  useEffect(() => {
    const transition = getAndClearWelcomeTransition();
    if (transition) setConfig(transition);
    // Note: if transition is null we intentionally do NOT clear config,
    // so an already-running WelcomeScreen isn't cancelled mid-animation.
  }, [pathname]);

  if (!config) return null;

  const duration = config.isNewUser ? 3000 : 2500;

  return (
    <WelcomeScreen
      userName={config.name}
      isNewUser={config.isNewUser}
      duration={duration}
      // Navigation has already happened (router.replace was called by the source page).
      // onComplete just schedules cleanup after the full animation has finished:
      //   duration - 300ms  → WelcomeScreen calls onComplete (its internal navTimer)
      //   duration ms       → internal exitTimer fires setShow(false), fade begins (300ms)
      //   duration + 300ms  → fade complete, screen blank
      //   duration + 400ms  → setConfig(null) — unmount the now-invisible component
      onComplete={() => setTimeout(() => setConfig(null), 700)}
    />
  );
}
