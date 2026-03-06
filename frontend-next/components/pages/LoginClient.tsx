// @ts-nocheck
'use client'
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthSidePanel from "@/components/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { useToast } from "@/components/ui/toaster-custom";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import authService from "@/services/authService";
import { profileService } from "@/services/profileService";
import { useUser } from "@/hooks/useUser";
import WelcomeScreen from "@/components/loading/WelcomeScreen";
import AuthLoadingScreen from "@/components/loading/AuthLoadingScreen";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, fullName } = useUser();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false); // New state for actual login attempt
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const hasLoginAttempt = useRef(false);
  const loginUserId = useRef(null);

  // Field validation helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 6;

  const getFieldState = (field) => {
    if (!touched[field]) return 'default';
    switch (field) {
      case 'email': return isValidEmail(formData.email) ? 'valid' : 'invalid';
      case 'password': return isValidPassword(formData.password) ? 'valid' : 'invalid';
      default: return 'default';
    }
  };

  const fieldBorderClass = (field) => {
    const state = getFieldState(field);
    if (state === 'valid') return 'border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400';
    if (state === 'invalid') return 'border-red-300 focus:ring-red-400 focus:border-red-400';
    return 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500';
  };

  const fieldIconClass = (field) => {
    const state = getFieldState(field);
    if (state === 'valid') return 'text-emerald-500';
    if (state === 'invalid') return 'text-red-400';
    return 'text-gray-400';
  };

  // Safety timeout: if stuck on verifying screen for 15s, reset
  useEffect(() => {
    if (!isAuthenticating) return;
    const timer = setTimeout(() => {
      console.warn('⚠️ Login verification timed out after 35s');
      setIsAuthenticating(false);
      setLoading(false);
      toast({
        title: "Verification timed out",
        description: "Please try again. If the problem persists, check your connection.",
        type: "error",
      });
    }, 35000);
    return () => clearTimeout(timer);
  }, [isAuthenticating, toast]);

  // Check for expired confirmation link
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast({
        title: "Confirmation Link Expired",
        description: "Your email confirmation link has expired. Please log in - if your email isn't confirmed yet, you can request a new confirmation email.",
        type: "warning",
      });
    }
  }, [searchParams.toString(), toast]);

  // Show error from OAuth callback if any
  const errorFromCallback = searchParams.get('error');
  const errorDescriptionFromCallback = searchParams.get('error_description');
  useEffect(() => {
    if (errorFromCallback) {
      toast({
        title: "Authentication Error",
        description: errorDescriptionFromCallback || errorFromCallback,
        type: "error",
      });
    }
  }, [errorFromCallback, errorDescriptionFromCallback, toast]);

  // Redirect if already logged in (but only after auth state is loaded)
  // Use ?redirect= path when sent from 401 so user returns to e.g. /bills
  // Skip redirect if we just came from logout — UNLESS user actively submitted login
  useEffect(() => {
    if (!authLoading && user && !showWelcome && !isAuthenticating) {
      const params = searchParams;
      const redirectTo = params.get('redirect');
      const target = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard';
      router.replace(target);
    }
  }, [user, authLoading, router, searchParams, showWelcome, isAuthenticating]);

  // Show verifying screen ONLY during active login attempt
  if (isAuthenticating) {
    return <AuthLoadingScreen type="verifying" message="Verifying your credentials" />;
  }

  // Show welcome screen after successful login
  if (showWelcome) {
    const params = searchParams;
    const redirectTo = params.get('redirect');
    const target = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard';
    return (
      <WelcomeScreen 
        userName={userName}
        isNewUser={false}
        onComplete={async () => {
          try {
            if (loginUserId.current) {
              const status = await profileService.getOnboardingStatus(loginUserId.current);
              if (!status?.onboarding_completed) {
                router.replace('/setup');
                return;
              }
            }
          } catch (e) {
            // fall through to default target
          }
          router.replace(target);
        }}
      />
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsAuthenticating(true); // Show auth loading screen
    hasLoginAttempt.current = true; // Allow redirect useEffect to work past fromLogout guard

    try {
      const result = await authService.signIn(formData.email, formData.password);

      // Get user data to show personalized welcome
      const userName = result.user?.user_metadata?.full_name || 
                      result.user?.user_metadata?.name || 
                      result.user?.email?.split('@')[0] || 
                      'User';
      
      loginUserId.current = result.user?.id || null;
      setIsAuthenticating(false); // Hide auth loading screen
      setUserName(userName);
      setShowWelcome(true);

    } catch (err) {
      console.error("Login error:", err);
      setIsAuthenticating(false); // Hide auth loading screen on error
      
      // Check if it's an email confirmation issue
      if (err.message?.includes("Email not confirmed") || err.message?.includes("verify")) {
        toast({ 
          title: "Email Not Confirmed", 
          description: "Please check your email and click the confirmation link. Click 'Resend' below if you need a new link.",
          type: "warning",
          duration: 6000
        });
      } else {
        toast({ 
          title: "Login failed", 
          description: err.message || "Invalid email or password",
          type: "error" 
        });
      }
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        type: "error"
      });
      return;
    }

    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });

      if (error) throw error;

      toast({
        title: "Confirmation Email Sent!",
        description: "Please check your inbox and click the confirmation link.",
        type: "success"
      });
    } catch (err) {
      console.error("Resend error:", err);
      toast({
        title: "Failed to Resend",
        description: err.message || "Could not resend confirmation email. Try signing up again if the issue persists.",
        type: "error"
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleGoogleSuccess = () => {
    // OAuth redirect will happen, no need to do anything
  };

  const handleGoogleError = (error) => {
    toast({
      title: "Google Sign-In Failed",
      description: error.message || "Could not sign in with Google",
      type: "error",
    });
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left Side - Branding */}
      <AuthSidePanel variant="login" />

      {/* Right Side - Form */}
      <div className="flex w-full md:w-2/5 h-screen items-center justify-center bg-slate-50/50">
        <AuthCard className="shadow-none border-none bg-transparent w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Link href="/">
                <img
                  src={assetUrl("/assets/branding/yesbill_logo_black.png")}
                  alt="YesBill"
                  className="mx-auto mb-6 w-[144px] h-[144px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="text-slate-500">Enter your details to manage your daily expenses.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="relative w-full">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${fieldIconClass('email')}`}>
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    required
                    className={`w-full h-[48px] rounded-xl border pl-11 pr-10 text-sm outline-none focus:outline-none focus:ring-2 transition-all duration-200 ${fieldBorderClass('email')}`}
                  />
                  {touched.email && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isValidEmail(formData.email) ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                  )}
                </div>
                {touched.email && !isValidEmail(formData.email) && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 -mt-2 ml-1">Please enter a valid email address</motion.p>
                )}

                <div className="space-y-1">
                  <div className="relative w-full">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${fieldIconClass('password')}`}>
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => { setFormData({ ...formData, password: e.target.value }); setTouched(t => ({ ...t, password: true })); }}
                      required
                      className={`w-full h-[48px] rounded-xl border pl-11 pr-11 text-sm outline-none focus:outline-none focus:ring-2 transition-all duration-200 ${fieldBorderClass('password')}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                disabled={loading}
                className="auth-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>

              {/* Resend Confirmation Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail || !formData.email}
                  className="text-xs text-slate-600 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingEmail ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending confirmation email...
                    </span>
                  ) : (
                    "Didn't receive confirmation email? Resend"
                  )}
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-500">Or continue with</span></div>
            </div>

            <GoogleSignInButton 
              text="Sign in with Google"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            <div className="text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create free account
              </Link>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
