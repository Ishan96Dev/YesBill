// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthSidePanel from "@/components/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { useToast } from "@/components/ui/toaster-custom";
import PasswordStrengthBar, { getPasswordStrength } from "@/components/ui/PasswordStrengthBar";
import { supabase } from "@/lib/supabase";
import { authAPI } from "@/services/api";
import { WithTooltip } from "@/components/ui/tooltip";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [sessionReady, setSessionReady] = useState(false); // recovery session established
  const [sessionError, setSessionError] = useState(false); // link expired or invalid
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Listen for the PASSWORD_RECOVERY event — Supabase fires this when the user
  // arrives via a password-reset email link (access_token + type=recovery in the URL hash).
  // For PKCE flow: the link contains ?code=... which must be exchanged first.
  useEffect(() => {
    let settled = false;

    const settle = (ready: boolean) => {
      if (settled) return;
      settled = true;
      if (ready) setSessionReady(true);
      else setSessionError(true);
    };

    // Subscribe to auth state changes (implicit flow: PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        settle(true);
      }
    });

    const init = async () => {
      // PKCE flow: the reset link arrives as ?code=... query param.
      // createBrowserClient does NOT exchange PKCE codes automatically —
      // we must call exchangeCodeForSession to establish the recovery session.
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            // Clean up code from URL so the user can't accidentally reset twice
            window.history.replaceState({}, "", window.location.pathname);
            settle(true);
            return;
          }
        } catch {
          // Fall through to session check below
        }
      }

      // Check if there's already a valid session (e.g. page refresh after recovery link clicked
      // or implicit flow where the browser client auto-detected the URL hash)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        settle(true);
      } else {
        // Give the auth state change listener a moment to fire, then give up
        setTimeout(() => settle(false), 3000);
      }
    };

    init();

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const validatePassword = () => {
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./~`]/.test(newPassword);

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
      const missing = [];
      if (!hasLowercase) missing.push("lowercase letter");
      if (!hasUppercase) missing.push("uppercase letter");
      if (!hasDigit) missing.push("number");
      if (!hasSymbol) missing.push("symbol");
      toast({
        title: "Password doesn't meet requirements",
        description: `Missing: ${missing.join(", ")}`,
        type: "error",
      });
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both fields are the same.", type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setDone(true);
      toast({ title: "Password updated", description: "You can now sign in with your new password.", type: "success" });

      // Sign out all sessions, then redirect to login
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      toast({ title: "Failed to update password", description: err.message || "Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = async () => {
    router.push("/forgot-password");
  };

  return (
    <div className="flex w-full h-screen min-h-screen">
      <AuthSidePanel variant="login" />

      <div className="flex w-full md:w-2/5 h-screen items-center justify-center bg-slate-50/50">
        <AuthCard className="shadow-none border-none bg-transparent w-full max-w-md">
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center">
              <Link href="/">
                <img
                  src={assetUrl("/assets/branding/yesbill_logo_black.png")}
                  alt="YesBill"
                  className="mx-auto mb-6 w-[144px] h-[144px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {/* Expired / invalid link */}
              {sessionError && (
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
                      This password reset link is invalid or has expired. Request a new one below.
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestNewLink}
                    className="w-full h-11 bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/25 transition-all text-base"
                  >
                    Request New Link
                  </Button>
                  <div className="text-center">
                    <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Password updated successfully */}
              {done && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-100 rounded-xl p-6 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-green-900 font-semibold">Password updated!</h3>
                  <p className="text-green-700 text-sm">Redirecting you to login…</p>
                </motion.div>
              )}

              {/* Loading session */}
              {!sessionReady && !sessionError && !done && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-slate-500 text-sm">Verifying your reset link…</p>
                </motion.div>
              )}

              {/* Set new password form */}
              {sessionReady && !done && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Set New Password</h1>
                    <p className="text-slate-500 text-sm">Choose a strong password for your account.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="newPassword">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          id="newPassword"
                          type={showNew ? "text" : "password"}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full h-[48px] rounded-xl border border-gray-200 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                        <WithTooltip tip={showNew ? "Hide password" : "Show password"} side="left">
                          <button
                            type="button"
                            onClick={() => setShowNew((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </WithTooltip>
                      </div>
                      {newPassword && (
                        <PasswordStrengthBar
                          password={newPassword}
                          showRequirements={passwordStrength.score < 4}
                        />
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          id="confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={`w-full h-[48px] rounded-xl border pl-10 pr-11 text-sm outline-none focus:ring-2 transition-all duration-200 ${
                            confirmPassword
                              ? passwordsMatch
                                ? "border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400"
                                : "border-red-300 focus:ring-red-400 focus:border-red-400"
                              : "border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                          }`}
                        />
                        <WithTooltip tip={showConfirm ? "Hide password" : "Show password"} side="left">
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </WithTooltip>
                      </div>
                      {confirmPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-center gap-1.5 text-xs font-medium ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {passwordsMatch ? (
                            <>
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </motion.div>
                              <span>Passwords match</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Passwords do not match</span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/25 transition-all text-base"
                      disabled={loading || passwordsMismatch}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        "Set New Password"
                      )}
                    </Button>
                  </form>

                  <div className="text-center pt-1">
                    <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors">
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
