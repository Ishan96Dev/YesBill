// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker
// Created by Ishan Chakraborty
//
// send-push-notification
// ──────────────────────────────────────────────────────────────────────────────
// Deno edge function — dispatches FCM push notifications to every registered
// device/browser for a given user using FCM HTTP V1 API.
//
// Called by notificationService.js (web) immediately after a notification row
// is inserted into public.notifications.
//
// Required Supabase secrets (set via: supabase secrets set NAME=value):
//   FIREBASE_SERVICE_ACCOUNT_JSON — full service account JSON from Firebase Console
//                                   (Firebase Console → Project Settings → Service accounts
//                                    → Generate new private key)
//
// The SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets are injected
// automatically by the Supabase runtime — no manual configuration needed.
//
// Payload (JSON body):
//   { user_id: string, title: string, body?: string, data?: object }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");

// ── Service account types ──────────────────────────────────────────────────────
interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

// ── Base64url encode ───────────────────────────────────────────────────────────
function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// ── Get OAuth2 access token from service account ───────────────────────────────
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = `${header}.${claimSet}`;

  // Strip PEM headers and decode DER
  const pemContent = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");
  const der = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${base64url(new Uint8Array(sigBytes))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`[push] OAuth2 token exchange failed: ${tokenRes.status} ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ── Send a single FCM V1 message ───────────────────────────────────────────────
async function sendFcmV1Message(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
  projectId: string,
  accessToken: string,
): Promise<{ ok: boolean; stale: boolean }> {
  const message = {
    message: {
      token,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: {
          channel_id: "yesbill_notifications",
          notification_priority: "PRIORITY_HIGH",
          sound: "default",
          default_sound: true,
          default_vibrate_timings: true,
          icon: "ic_notification",
          color: "#6366F1",
        },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        },
        fcm_options: { link: "/" },
      },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as {
      error?: { status?: string; message?: string };
    };
    const status = err?.error?.status ?? "";
    const isStale = status === "NOT_FOUND" || status === "UNREGISTERED";
    if (!isStale) {
      console.error("[push] FCM V1 error for token:", res.status, JSON.stringify(err));
    }
    return { ok: false, stale: isStale };
  }

  return { ok: true, stale: false };
}

// ── Dispatch to all tokens for a user ─────────────────────────────────────────
async function dispatchToTokens(
  tokens: Array<{ token: string; platform: string }>,
  title: string,
  body: string,
  data: Record<string, string>,
  sa: ServiceAccount,
  accessToken: string,
): Promise<string[]> {
  const staleTokens: string[] = [];

  await Promise.allSettled(
    tokens.map(async ({ token }) => {
      const result = await sendFcmV1Message(token, title, body, data, sa.project_id, accessToken);
      if (result.stale) staleTokens.push(token);
    }),
  );

  return staleTokens;
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

  // ── Parse service account ──────────────────────────────────────────────────
  if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error("[push] FIREBASE_SERVICE_ACCOUNT_JSON secret is not set");
    return new Response(
      JSON.stringify({ error: "Push notifications are not configured (missing service account)" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  } catch {
    console.error("[push] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return new Response(
      JSON.stringify({ error: "Push notifications misconfigured (invalid service account JSON)" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Parse request body ─────────────────────────────────────────────────────
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

  // ── Look up all registered device tokens for this user ────────────────────
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

  const notifBody = msgBody ?? "";
  const notifData: Record<string, string> = {};
  if (data) {
    // FCM data payload values must all be strings
    for (const [k, v] of Object.entries(data)) {
      notifData[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }

  // ── Obtain OAuth2 access token ─────────────────────────────────────────────
  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (err) {
    console.error("[push] Failed to get OAuth2 access token:", err);
    return new Response(
      JSON.stringify({ error: "Failed to authenticate with FCM" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Dispatch notifications ─────────────────────────────────────────────────
  const staleTokens = await dispatchToTokens(
    tokens,
    title,
    notifBody,
    notifData,
    sa,
    accessToken,
  );

  // Clean up stale/unregistered tokens
  if (staleTokens.length > 0) {
    console.log(`[push] Removing ${staleTokens.length} stale/unregistered token(s)`);
    await supabase
      .from("device_tokens")
      .delete()
      .in("token", staleTokens);
  }

  console.log(`[push] Dispatched to ${tokens.length} token(s), ${staleTokens.length} stale removed`);

  return new Response(
    JSON.stringify({ sent: tokens.length - staleTokens.length }),
    { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
  );
});
