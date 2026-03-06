// @ts-nocheck
'use client'
import Link from 'next/link';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthSidePanel from "@/components/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { useToast } from "@/components/ui/toaster-custom";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password.",
        type: "success",
      });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Something went wrong. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen min-h-screen">
      {/* Left Side - Image/Branding */}
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
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Reset Password
              </h1>
              <p className="text-slate-500">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                    required
                    className="pl-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/25 transition-all text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-100 rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-green-900 font-semibold mb-2">Check your inbox</h3>
                <p className="text-green-700 text-sm">
                  We've sent a password reset link to <span className="font-bold">{email}</span>. Please check your spam folder if it doesn't arrive.
                </p>
              </motion.div>
            )}

            <div className="text-center pt-2">
              <Link 
                href="/login"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
