// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthSidePanel from "@/components/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { useToast } from "@/components/ui/toaster-custom";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import authService from "@/services/authService";
import { useUser } from "@/hooks/useUser";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import { WithTooltip } from "@/components/ui/tooltip";
import WelcomeScreen from "@/components/loading/WelcomeScreen";
import AuthLoadingScreen from "@/components/loading/AuthLoadingScreen";

export default function Signup() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false); // New state for actual signup attempt
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });

  // Field validation helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidName = (name) => name.trim().length >= 2;
  const isValidPassword = (password) => password.length >= 6;

  const getFieldState = (field) => {
    if (!touched[field]) return 'default';
    switch (field) {
      case 'name': return isValidName(formData.name) ? 'valid' : 'invalid';
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

  // Safety timeout: if stuck on creating account screen for 15s, reset
  useEffect(() => {
    if (!isCreatingAccount) return;
    const timer = setTimeout(() => {
      console.warn('⚠️ Signup verification timed out after 15s');
      setIsCreatingAccount(false);
      setLoading(false);
      toast({
        title: "Account creation timed out",
        description: "Please try again. If the problem persists, check your connection.",
        type: "error",
      });
    }, 15000);
    return () => clearTimeout(timer);
  }, [isCreatingAccount, toast]);

  // Redirect if already logged in (but only after auth state is loaded)
  useEffect(() => {
    if (!authLoading && user) {
      console.log('✓ User already logged in, redirecting to dashboard');
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  // Show creating account screen ONLY during active signup attempt
  if (isCreatingAccount) {
    return <AuthLoadingScreen type="signup" message="Creating your account" />;
  }

  // Redirect new users to onboarding pre-setup page
  if (showWelcome) {
    router.replace("/setup");
    return null;
  }

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        type: "error",
      });
      return;
    }

    // Validate password length (Supabase minimum is 6)
    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    // Validate password meets Supabase requirements (lowercase, uppercase, digits, symbols)
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasDigit = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./~`]/.test(formData.password);

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
      const missing = [];
      if (!hasLowercase) missing.push("lowercase letter");
      if (!hasUppercase) missing.push("uppercase letter");
      if (!hasDigit) missing.push("number");
      if (!hasSymbol) missing.push("symbol (!@#$%...)");
      toast({
        title: "Password doesn't meet requirements",
        description: `Missing: ${missing.join(", ")}`,
        type: "error",
      });
      return;
    }

    setLoading(true);
    setIsCreatingAccount(true); // Show signup loading screen

    try {
      console.log("🚀 Starting signup for:", formData.email);
      
      const result = await authService.signUp(
        formData.email, 
        formData.password,
        formData.confirmPassword,
        formData.name
      );

      console.log("? Signup result:", {
        hasUser: !!result.user,
        hasSession: !!result.session,
        requiresConfirmation: result.requiresEmailConfirmation,
        userId: result.user?.id,
        userEmail: result.user?.email
      });

      // Check if user was actually created
      if (!result.user) {
        throw new Error("User creation failed - no user object returned");
      }

      if (result.requiresEmailConfirmation) {
        console.log("📧 Email confirmation required");
        setIsCreatingAccount(false); // Hide loading screen
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link. Please verify your email before logging in.",
          type: "success",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        console.log("? User created and logged in automatically");
        
        // Extract user's name for welcome screen
        const newUserName = formData.name || 
                           result.user.user_metadata?.full_name || 
                           result.user.user_metadata?.name ||
                           result.user.email?.split('@')[0] || 
                           'there';
        
        toast({
          title: "Account created successfully!",
          description: `Welcome to YesBill!`,
          type: "success",
        });
        
        // Store user data
        if (result.session) {
          localStorage.setItem('access_token', result.session.access_token);
          localStorage.setItem('user_id', result.user.id);
          localStorage.setItem('user_email', result.user.email);
          if (result.user.user_metadata?.full_name || formData.name) {
            localStorage.setItem('user_name', result.user.user_metadata?.full_name || formData.name);
          }
        }
        
        // Show welcome screen for new users
        setIsCreatingAccount(false); // Hide loading screen
        setUserName(newUserName);
        setShowWelcome(true);
      }

    } catch (err) {
      console.error("? Signup error:", err);
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      setIsCreatingAccount(false); // Hide loading screen on error
      
      let errorMessage = "Could not create account";
      let errorTitle = "Signup failed";
      
      if (err.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
        errorTitle = "Email already exists";
      } else if (err.message.includes("Password")) {
        errorMessage = err.message;
      } else if (err.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({ 
        title: errorTitle, 
        description: errorMessage,
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    // OAuth redirect will happen, no need to do anything
  };

  const handleGoogleError = (error) => {
    toast({
      title: "Google Sign-Up Failed",
      description: error.message || "Could not sign up with Google",
      type: "error",
    });
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left Side - Branding */}
      <AuthSidePanel variant="signup" />

      {/* Right Side - Form */}
      <div className="flex w-full md:w-2/5 h-screen items-center justify-center bg-slate-50/50">
        <AuthCard className="shadow-none border-none bg-transparent w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <WithTooltip tip="Go to homepage" side="top">
                <Link href="/">
                  <img
                    src={assetUrl("/assets/branding/yesbill_logo_black.png")}
                    alt="YesBill"
                    className="mx-auto mb-6 w-[144px] h-[144px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              </WithTooltip>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
              <p className="text-slate-500">Start tracking your daily services.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative w-full">
                <WithTooltip tip="Full name" side="right">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-default transition-colors duration-200 ${fieldIconClass('name')}`}>
                    <User className="w-5 h-5" />
                  </span>
                </WithTooltip>
                <input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => setTouched(t => ({ ...t, name: true }))}
                  required
                  className={`w-full h-[48px] rounded-xl border pl-11 pr-10 text-sm outline-none focus:outline-none focus:ring-2 transition-all duration-200 ${fieldBorderClass('name')}`}
                />
                {touched.name && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isValidName(formData.name) ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </motion.div>
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                )}
              </div>
              {touched.name && !isValidName(formData.name) && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 -mt-2 ml-1">Name must be at least 2 characters</motion.p>
              )}

              <div className="relative w-full">
                <WithTooltip tip="Email address" side="right">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-default transition-colors duration-200 ${fieldIconClass('email')}`}>
                    <Mail className="w-5 h-5" />
                  </span>
                </WithTooltip>
                <input
                  type="email"
                  placeholder="Email address"
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

              <div className="relative w-full">
                <WithTooltip tip="Password (min. 6 characters)" side="right">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-default transition-colors duration-200 ${fieldIconClass('password')}`}>
                    <Lock className="w-5 h-5" />
                  </span>
                </WithTooltip>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={formData.password}
                  onChange={e => { setFormData({ ...formData, password: e.target.value }); setTouched(t => ({ ...t, password: true })); }}
                  required
                  className={`w-full h-[48px] rounded-xl border pl-11 pr-11 text-sm outline-none focus:outline-none focus:ring-2 transition-all duration-200 ${fieldBorderClass('password')}`}
                />
                <WithTooltip tip={showPassword ? "Hide password" : "Show password"} side="left">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </WithTooltip>
              </div>

              {/* Password Strength Indicator */}
              <PasswordStrengthBar password={formData.password} />

              <div className="relative w-full">
                <WithTooltip tip="Confirm password" side="right">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-default transition-colors duration-200 ${
                    formData.confirmPassword
                      ? formData.confirmPassword === formData.password
                        ? 'text-emerald-500'
                        : 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    <Lock className="w-5 h-5" />
                  </span>
                </WithTooltip>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`w-full h-[48px] rounded-xl border pl-11 pr-11 text-sm outline-none focus:outline-none focus:ring-2 transition-all duration-200 ${
                    formData.confirmPassword
                      ? formData.confirmPassword === formData.password
                        ? 'border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400'
                        : 'border-red-300 focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <WithTooltip tip={showConfirmPassword ? "Hide password" : "Show password"} side="left">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </WithTooltip>
              </div>

              {/* Confirm Password Match Indicator */}
              {formData.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    formData.confirmPassword === formData.password
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {formData.confirmPassword === formData.password ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
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

              <Button
                type="submit"
                variant="gradient"
                disabled={loading}
                className="auth-btn mt-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-500">Or continue with</span></div>
            </div>

            <div className="mt-6 mb-6">
              <GoogleSignInButton 
                text="Sign up with Google"
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>

            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bank-level security & encryption</span>
              </div>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
