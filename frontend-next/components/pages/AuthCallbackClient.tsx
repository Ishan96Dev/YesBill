// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * OAuth callback page.
 * Exchanges OAuth tokens/code for a session and routes user to setup/dashboard.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthLoadingScreen from "@/components/loading/AuthLoadingScreen";
import { profileService } from "@/services/profileService";
import { setWelcomeTransition } from "@/lib/welcomeSession";

async function getDestination(userId) {
  try {
    const status = await profileService.getOnboardingStatus(userId);
    return status?.onboarding_completed ? "/dashboard" : "/setup";
  } catch {
    return "/setup";
  }
}

function persistUserMetadata(user) {
  if (!user) return;
  const metadata = user.user_metadata || {};
  const resolvedName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    "";
  const resolvedAvatar =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.avatar ||
    "";

  if (resolvedName) localStorage.setItem("user_name", resolvedName);
  if (resolvedAvatar) localStorage.setItem("user_avatar", resolvedAvatar);
}

function persistSession(session) {
  if (!session?.user) return;
  localStorage.setItem("access_token", session.access_token || "");
  localStorage.setItem("user_id", session.user.id);
  localStorage.setItem("user_email", session.user.email || "");
  persistUserMetadata(session.user);
}

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status !== "processing") return undefined;
    const timer = setTimeout(() => {
      setStatus("error");
      setError("Authentication timed out. Please try again.");
      setTimeout(() => router.replace("/login"), 2000);
    }, 20000);
    return () => clearTimeout(timer);
  }, [status, router]);

  useEffect(() => {
    let mounted = true;

    // Stores a welcome transition config in sessionStorage then navigates immediately.
    // The root-layout WelcomeOverlay picks up the flag and renders WelcomeScreen
    // on the destination page so the full animation plays without interruption.
    const showWelcomeAndRoute = async (user, userId) => {
      const destination = await getDestination(userId);
      if (!mounted) return;
      const isNewUser = destination === '/setup';
      const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'User';
      // Prefetch bundle so the route swap is instant
      router.prefetch(destination);
      setStatus('success'); // stops the 20 s timeout
      setWelcomeTransition({ name, isNewUser });
      router.replace(destination);
    };

    const redirectLoginWithError = (message, delay = 3000) => {
      if (!mounted) return;
      setStatus("error");
      setError(message);
      setTimeout(() => {
        if (mounted) router.push(`/login?error=${encodeURIComponent(message)}`);
      }, delay);
    };

    const tryReadExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      persistSession(session);
      return session;
    };

    const handleCallback = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const tokenType = hash.get("type");
        const code = query.get("code");
        const codeType = query.get("type");
        const errorParam = query.get("error") || hash.get("error");
        const errorDescription = query.get("error_description") || hash.get("error_description");
        const errorCode = query.get("error_code") || hash.get("error_code");

        if (errorParam) {
          let friendly = errorDescription || errorParam;
          let redirectTo = "/login";
          if (errorCode === "otp_expired" || errorParam === "access_denied") {
            friendly = "Email confirmation link is invalid or expired. Please sign in again.";
            redirectTo = "/login?expired=true";
          }
          if (!mounted) return;
          setStatus("error");
          setError(friendly);
          setTimeout(() => {
            if (mounted) router.push(redirectTo);
          }, 2500);
          return;
        }

        if (accessToken && refreshToken) {
          try {
            const { data, error: setErrorResult } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setErrorResult) throw setErrorResult;
            if (data?.session) {
              if (!mounted) return;
              persistSession(data.session);
              if (tokenType === "recovery") {
                router.replace("/auth/reset-password");
                return;
              }
              await showWelcomeAndRoute(data.session.user, data.session.user.id);
              return;
            }
          } catch (setSessionErr) {
            if (setSessionErr?.name !== "AbortError") {
              redirectLoginWithError("Failed to establish session. Please try logging in.");
              return;
            }
          }
        }

        // Process PKCE code BEFORE checking for an existing session.
        // The email verification link always provides a `code`. If we checked the
        // existing session first, a user who was already signed-in to a different
        // (or previously-incomplete) account would be routed based on that old
        // session instead of the newly-verified account, landing on /dashboard
        // without ever going through /setup.
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (exchangeError.name === "AbortError") {
              // AbortError means the HTTP request was cancelled (e.g. React 18 strict-mode
              // double-effect, or the user navigated away before the response arrived).
              // The PKCE code may have been consumed server-side already — check whether
              // Supabase already set a session for us before aborting.
              const { data: { session: abortSession } } = await supabase.auth.getSession();
              if (abortSession?.user) {
                if (!mounted) return;
                persistSession(abortSession);
                if (codeType === "recovery") {
                  router.replace("/auth/reset-password");
                  return;
                }
                await showWelcomeAndRoute(abortSession.user, abortSession.user.id);
                return;
              }
              // Session was not established — send to login; do NOT fall back to a
              // potentially different pre-existing session (that would route the wrong user).
              redirectLoginWithError("Authentication was interrupted. Please click the link in your email again.");
              return;
            }
            // PKCE verifier missing — happens when the PKCE cookie is lost between the
            // OAuth redirect and the callback (e.g., cookie-blocking extensions, private
            // browsing with strict settings, or cross-site cookie restrictions).
            // Check if the exchange actually succeeded server-side (strict-mode second render).
            if (
              exchangeError.message?.toLowerCase().includes('code verifier') ||
              exchangeError.message?.toLowerCase().includes('pkce')
            ) {
              const { data: { session: pkceSession } } = await supabase.auth.getSession();
              if (pkceSession?.user) {
                if (!mounted) return;
                persistSession(pkceSession);
                if (codeType === 'recovery') {
                  router.replace('/auth/reset-password');
                  return;
                }
                await showWelcomeAndRoute(pkceSession.user, pkceSession.user.id);
                return;
              }
              redirectLoginWithError('Sign-in failed: browser session was lost during the Google redirect. Please try again — if the issue persists, disable cookie-blocking extensions or try a different browser.');
              return;
            }

            // Non-abort, non-PKCE error (expired link, invalid code, etc.)
            redirectLoginWithError(exchangeError.message || "Authentication failed. Please try again.");
            return;
          }

          if (data?.session?.user) {
            if (!mounted) return;
            persistSession(data.session);
            if (codeType === "recovery") {
              router.replace("/auth/reset-password");
              return;
            }
            await showWelcomeAndRoute(data.session.user, data.session.user.id);
            return;
          }

          // Code exchanged without error but no session returned (shouldn't normally happen).
          redirectLoginWithError("No session created. Please try again.");
          return;
        }

        // No code / hash tokens — fall back to an existing active session.
        // This path handles direct /auth/callback visits without any auth parameters.
        const existing = await tryReadExistingSession();
        if (existing) {
          if (!mounted) return;
          await showWelcomeAndRoute(existing.user, existing.user.id);
          return;
        }
        redirectLoginWithError("No authentication code found. Please try signing in again.");
      } catch (err) {
        if (err?.name === "AbortError") return;
        redirectLoginWithError(err?.message || "Something went wrong. Please try again.");
      }
    };

    handleCallback();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8">
        {status === "processing" && (
          <AuthLoadingScreen type="oauth" message="Completing your authentication" />
        )}

        {status === "success" && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
            <h2 className="mb-2 text-2xl font-bold text-gray-800">Success!</h2>
            <p className="text-gray-600">Redirecting to your account...</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
            <h2 className="mb-2 text-2xl font-bold text-gray-800">Authentication Failed</h2>
            <p className="text-sm text-gray-600">{error || "Something went wrong"}</p>
            <p className="mt-2 text-xs text-gray-500">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
