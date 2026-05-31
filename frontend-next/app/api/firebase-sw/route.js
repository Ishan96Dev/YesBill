// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * GET /api/firebase-sw
 *
 * Serves the Firebase Messaging service worker with the Firebase project config
 * injected from server-side environment variables (NEXT_PUBLIC_FIREBASE_*).
 *
 * Serving the SW through an API route lets us inject the config at request time
 * instead of baking it into a static file, and the `Service-Worker-Allowed: /`
 * response header allows the worker to control the whole origin even though it
 * is registered from /api/.
 *
 * The worker handles background push messages (app minimised or tab closed).
 * Foreground messages are handled by the main thread via Firebase Messaging SDK.
 */

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  }

  // Skip if Firebase config is not set — return an empty valid SW
  const isConfigured = Object.values(config).every(Boolean)

  const swContent = isConfigured
    ? `
// YesBill Firebase Messaging Service Worker
// Auto-generated — do not edit directly.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

// Handle push notifications when the page is in the background or closed.
// When the page is in the foreground, onMessage() in the main thread handles it.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'YesBill';
  const body  = payload.notification?.body  || '';
  const icon  = payload.notification?.icon  || '/assets/icons/icon-192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/assets/icons/icon-96.png',
    data: payload.data || {},
    tag: payload.data?.type || 'yesbill',
    renotify: true,
  });
});

// Open or focus the app when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/dashboard';
  const url = self.location.origin + route;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`
    : `
// Firebase config not set — push notifications disabled.
self.addEventListener('push', () => {});
`

  return new Response(swContent.trim(), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache',
      // Allow this SW (served from /api/) to control the whole origin
      'Service-Worker-Allowed': '/',
    },
  })
}
