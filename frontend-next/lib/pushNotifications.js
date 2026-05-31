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
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY   ← Web Push certificate public key
 *                                       (Firebase Console → Project Settings
 *                                        → Cloud Messaging → Web Push certificates)
 *
 * If any variable is missing the function exits silently — the app works
 * normally without web push.
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

/**
 * Returns true when all required Firebase config values are present.
 */
function hasFirebaseConfig() {
  return Object.values(FIREBASE_CONFIG).every(Boolean) && Boolean(VAPID_KEY)
}

/**
 * Initialize web push for the current user session.
 *
 * @param {string} userId  - Authenticated user UUID (used for token registration)
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function initWebPush(userId, supabase) {
  if (typeof window === 'undefined') return // SSR guard
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return
  if (!hasFirebaseConfig()) {
    // Firebase env vars not configured — web push unavailable
    return
  }

  try {
    // Lazily import firebase to keep the initial bundle small
    const [{ initializeApp, getApps }, { getMessaging, getToken }] =
      await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ])

    // Reuse existing Firebase app if already initialized (HMR / StrictMode safe)
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp(FIREBASE_CONFIG)

    const messaging = getMessaging(app)

    // Register our custom service worker that handles background messages.
    // The `/api/firebase-sw` route returns the worker JS with the Firebase
    // config injected from server-side env vars (no secrets exposed to client).
    // `Service-Worker-Allowed: /` header allows the worker to control the
    // whole origin even though it is served from /api/.
    let swRegistration
    try {
      swRegistration = await navigator.serviceWorker.register('/api/firebase-sw', {
        scope: '/',
      })
    } catch (swErr) {
      console.warn('[push] Service worker registration failed:', swErr)
      return
    }

    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    // Obtain FCM web push token
    let token
    try {
      token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      })
    } catch (tokenErr) {
      console.warn('[push] Failed to get FCM web token:', tokenErr)
      return
    }

    if (!token) return

    // Register with backend — same endpoint as Android/iOS
    await supabase.from('device_tokens').upsert(
      { user_id: userId, token, platform: 'web' },
      { onConflict: 'user_id,token' },
    )
  } catch (err) {
    // Non-fatal — web push is a progressive enhancement
    console.warn('[push] Web push init failed:', err)
  }
}

/**
 * Unregister the current browser's push token on sign-out.
 *
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function cleanupWebPush(userId, supabase) {
  if (typeof window === 'undefined') return
  if (!hasFirebaseConfig()) return

  try {
    const [{ getApps }, { getMessaging, deleteToken }] = await Promise.all([
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
