// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker
// Created by Ishan Chakraborty
//
// send-push-notification
// ──────────────────────────────────────────────────────────────────────────────
// Deno edge function — dispatches FCM push notifications to every registered
// device/browser for a given user.
//
// Called by notificationService.js (web) and notificationService.dart (mobile)
// immediately after a notification row is inserted into public.notifications.
//
// Required Supabase secrets (set via: supabase secrets set NAME=value):
//   FCM_SERVER_KEY  — Firebase Cloud Messaging legacy server key
//                     (Firebase Console → Project Settings → Cloud Messaging)
//
// The SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets are injected
// automatically by the Supabase runtime — no manual configuration needed.
//
// Payload (JSON body):
//   { user_id: string, title: string, body?: string, data?: object }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");

// ── FCM (Android / iOS) ────────────────────────────────────────────────────────
async function sendFcmPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  if (!FCM_SERVER_KEY) {
    console.warn("[push] FCM_SERVER_KEY not set — skipping FCM dispatch");
    return;
  }
  if (tokens.length === 0) return;

  // Use multicast for up to 1000 tokens per request
  const payload = {
    registration_ids: tokens,
    notification: {
      title,
      body,
      icon: "ic_notification",
      color: "#6366F1",
      sound: "default",
      channel_id: "yesbill_notifications",
    },
    data: data ?? {},
    priority: "high",
    android: {
      priority: "high",
      notification: {
        channel_id: "yesbill_notifications",
        notification_priority: "PRIORITY_HIGH",
        sound: "default",
        default_sound: true,
        default_vibrate_timings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[push] FCM error:", res.status, text);
    return;
  }

  const json = await res.json();
  console.log(
    `[push] FCM sent to ${tokens.length} tokens — success:${json.success} failure:${json.failure}`,
  );

  // Remove tokens that FCM says are no longer valid
  if (json.results) {
    const invalidTokens: string[] = [];
    json.results.forEach((result: { error?: string }, i: number) => {
      if (
        result.error === "NotRegistered" ||
        result.error === "InvalidRegistration"
      ) {
        invalidTokens.push(tokens[i]);
      }
    });
    if (invalidTokens.length > 0) {
      console.log(`[push] Removing ${invalidTokens.length} stale token(s)`);
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from("device_tokens")
        .delete()
        .in("token", invalidTokens);
    }
  }
}

// ── Web Push (Chrome / Firefox / Edge) ────────────────────────────────────────
// Web push subscriptions are stored as JSON strings; they contain
// { endpoint, keys: { p256dh, auth } } from the browser's PushManager.
// Firebase Web SDK generates standard FCM tokens (not PushSubscription objects),
// so those are handled via the FCM path above with platform='web' check below.
async function sendWebFcmPush(
  webTokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  // Web FCM tokens are regular FCM registration tokens — use same FCM API
  await sendFcmPush(webTokens, title, body, data);
}

// ── Handler ────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Allow CORS preflight from the web app
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: {
    user_id: string;
    title: string;
    body?: string;
    data?: Record<string, string>;
  };

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user_id, title, body: msgBody, data } = payload;

  if (!user_id || !title) {
    return new Response(
      JSON.stringify({ error: "user_id and title are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Look up all registered device tokens for this user
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: tokens, error } = await supabase
    .from("device_tokens")
    .select("token, platform")
    .eq("user_id", user_id);

  if (error) {
    console.error("[push] Failed to fetch device tokens:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, message: "No registered tokens for user" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const nativeTokens = tokens
    .filter((t) => t.platform === "android" || t.platform === "ios")
    .map((t) => t.token);

  const webTokens = tokens
    .filter((t) => t.platform === "web")
    .map((t) => t.token);

  const notifBody = msgBody ?? "";
  const notifData = data ?? {};

  await Promise.allSettled([
    sendFcmPush(nativeTokens, title, notifBody, notifData),
    sendWebFcmPush(webTokens, title, notifBody, notifData),
  ]);

  return new Response(
    JSON.stringify({ sent: tokens.length }),
    { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
  );
});
