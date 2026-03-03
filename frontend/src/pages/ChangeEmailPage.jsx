// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import AuthSidePanel from "../components/AuthSidePanel";
import { AuthCard } from "../components/auth/AuthCard";
import { supabase } from "../lib/supabase";

export default function ChangeEmailPage() {
  const navigate = useNavigate();

  const [state, setState] = useState("loading"); // "loading" | "success" | "error"
  const [countdown, setCountdown] = useState(5);

  // Process hash tokens immediately on mount — fixes race condition where
  // onAuthStateChange fires before the component has had a chance to subscribe.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    const type = hash.get('type');

    if (accessToken && refreshToken && type === 'email_change') {
      // Clean URL immediately so back-navigation doesn't re-trigger
      window.history.replaceState(null, '', window.location.pathname);
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (!error) {
            setState('success');
            supabase.auth.signOut();
          } else {
            setState('error');
          }
        });
    }
  }, []);

  // Listen for EMAIL_CHANGE event — Supabase fires this when the user
  // arrives via an email change confirmation link.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "EMAIL_CHANGE" && session) {
        setState("success");
        // Sign out after confirming, then redirect to login
        await supabase.auth.signOut();
      }
    });

    // Give Supabase a moment to process the URL hash tokens
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev === "loading") return "error";
        return prev;
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Countdown redirect after success
  useEffect(() => {
    if (state !== "success") return;
    if (countdown <= 0) {
      navigate("/login", { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, navigate]);

  return (
    <div className="flex w-full h-screen min-h-screen">
      <AuthSidePanel variant="login" />

      <div className="flex w-full md:w-2/5 h-screen items-center justify-center bg-slate-50/50">
        <AuthCard className="shadow-none border-none bg-transparent w-full max-w-md">
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center">
              <Link to="/">
                <img
                  src="/assets/branding/yesbill_logo_black.png"
                  alt="YesBill"
                  className="mx-auto mb-6 w-[144px] h-[144px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {/* Loading — waiting for Supabase EMAIL_CHANGE event */}
              {state === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-slate-500 text-sm">Confirming your email change…</p>
                </motion.div>
              )}

              {/* Success */}
              {state === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5"
                >
                  <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center space-y-3">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-green-900">Email Changed!</h1>
                    <p className="text-green-700 text-sm">
                      Your email address has been updated successfully.
                      <br />
                      Please sign in with your new email.
                    </p>
                    <p className="text-green-600 text-xs mt-2">
                      Redirecting to login in {countdown}s…
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/login", { replace: true })}
                    className="w-full h-11 bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/25 transition-all text-base"
                  >
                    Go to Login
                  </Button>
                </motion.div>
              )}

              {/* Error — link invalid or expired */}
              {state === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Link Expired</h1>
                    <p className="text-slate-500 text-sm">
                      This email change link is invalid or has expired.
                      <br />
                      Please initiate the email change again from Settings.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/settings/security")}
                    className="w-full h-11 bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/25 transition-all text-base"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Back to Security Settings
                  </Button>
                  <div className="text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
