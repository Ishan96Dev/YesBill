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
  }, [status, navigate]);

  useEffect(() => {
    let mounted = true;

    const routeToDestination = async (userId) => {
      const destination = await getDestination(userId);
      if (mounted) router.replace(destination);
    };

    const redirectLoginWithError = (message, delay = 3000) => {
      if (!mounted) return;
      setStatus("error");
      setError(message);
      setTimeout(() => {
        if (mounted) router.push("/login");
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
        const code = query.get("code");
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
              setStatus("success");
              persistSession(data.session);
              await routeToDestination(data.session.user.id);
              return;
            }
          } catch (setSessionErr) {
            if (setSessionErr?.name !== "AbortError") {
              redirectLoginWithError("Failed to establish session. Please try logging in.");
              return;
            }
          }
        }

        const existing = await tryReadExistingSession();
        if (existing) {
          if (!mounted) return;
          setStatus("success");
          await routeToDestination(existing.user.id);
          return;
        }

        if (!code && !accessToken) {
          redirectLoginWithError("No authentication code found. Please try signing in again.");
          return;
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (exchangeError.name === "AbortError") {
              const retry = await tryReadExistingSession();
              if (retry) {
                if (!mounted) return;
                setStatus("success");
                await routeToDestination(retry.user.id);
                return;
              }
            }
            redirectLoginWithError(exchangeError.message || "Authentication failed. Please try again.");
            return;
          }

          if (data?.session?.user) {
            if (!mounted) return;
            setStatus("success");
            persistSession(data.session);
            await routeToDestination(data.session.user.id);
            return;
          }
        }

        redirectLoginWithError("No session created. Please try again.");
      } catch (err) {
        if (err?.name === "AbortError") return;
        redirectLoginWithError(err?.message || "Something went wrong. Please try again.");
      }
    };

    handleCallback();
    return () => { mounted = false; };
  }, [navigate]);

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
