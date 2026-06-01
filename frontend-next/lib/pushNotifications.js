// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Web Push Notifications
 *
 * Registers the Firebase Messaging service worker, requests the user's
 * permission, obtains a FCM registration token, and sends it to the backend
 * so that the `send-push-notification` edge function can dispatch pushes to
 * this browser session.
 *
 * Required NEXT_PUBLIC_ environment variables (set in .env.local / Vercel):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY
 */

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

function hasFirebaseConfig() {
  return Object.values(FIREBASE_CONFIG).every(Boolean) && Boolean(VAPID_KEY)
}

export async function initWebPush(userId, supabase, options = {}) {
  const { forcePrompt = false } = options

  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported' }
  }

  const currentPermission = Notification.permission
  if (currentPermission === 'default' || forcePrompt) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { ok: false, reason: permission === 'denied' ? 'denied' : 'dismissed' }
    }
  } else if (currentPermission !== 'granted') {
    return { ok: false, reason: 'denied' }
  }

  if (!hasFirebaseConfig()) {
    console.warn('[push] Firebase web push env vars are missing. Permission may be granted, but token setup is unavailable.')
    return { ok: false, reason: 'missing-config' }
  }

  try {
    const [{ initializeApp, getApps }, { getMessaging, getToken }] =
      await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ])

    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp(FIREBASE_CONFIG)

    const messaging = getMessaging(app)

    let swRegistration
    try {
      swRegistration = await navigator.serviceWorker.register('/api/firebase-sw', {
        scope: '/',
      })
    } catch (swErr) {
      console.warn('[push] Service worker registration failed:', swErr)
      return { ok: false, reason: 'sw-register-failed' }
    }

    let token
    try {
      token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      })
    } catch (tokenErr) {
      console.warn('[push] Failed to get FCM web token:', tokenErr)
      return { ok: false, reason: 'token-error' }
    }

    if (!token) return { ok: false, reason: 'no-token' }

    await supabase.from('device_tokens').upsert(
      { user_id: userId, token, platform: 'web' },
      { onConflict: 'user_id,token' },
    )
    return { ok: true, reason: 'registered' }
  } catch (err) {
    console.warn('[push] Web push init failed:', err)
    return { ok: false, reason: 'init-failed' }
  }
}

export async function cleanupWebPush(userId, supabase) {
  if (typeof window === 'undefined') return
  if (!hasFirebaseConfig()) return

  try {
    const [{ getApps }, { getMessaging, getToken, deleteToken }] = await Promise.all([
      import('firebase/app'),
      import('firebase/messaging'),
    ])

    const apps = getApps()
    if (apps.length === 0) return

    const messaging = getMessaging(apps[0])
    const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null)

    if (token) {
      await deleteToken(messaging).catch(() => {})
      await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token)
    }
  } catch {
    // Non-fatal
  }
}
