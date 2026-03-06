'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from 'react'

/**
 * usePageReady - Ensures a minimum loading time before content is shown
 * Gives pages a polished feel by preventing sub-second flash-of-content
 * 
 * @param {number} minDelay - Minimum milliseconds to show loading (default 500)
 * @param {boolean} dataReady - External ready signal (default true for pages without async data)
 * @returns {boolean} - Whether the page is ready to display
 */
export function usePageReady(minDelay = 500, dataReady = true) {
  // If minDelay is 0, there is nothing to wait for — start ready immediately
  // to prevent a single-frame flash of the loading screen.
  const [timerDone, setTimerDone] = useState(minDelay === 0)

  useEffect(() => {
    if (minDelay === 0) return
    const timer = setTimeout(() => setTimerDone(true), minDelay)
    return () => clearTimeout(timer)
  }, [minDelay])

  // Safety: force ready after 10s max so pages never get stuck
  const [forceReady, setForceReady] = useState(false)
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      if (!dataReady) {
        console.warn('⚠️ usePageReady: Forcing ready after 10s timeout (dataReady was false)')
      }
      setForceReady(true)
    }, 10000)
    return () => clearTimeout(maxTimer)
  }, [dataReady])

  return (timerDone && dataReady) || forceReady
}

export default usePageReady
