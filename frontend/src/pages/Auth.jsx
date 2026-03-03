// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/services/api";

export function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { token } = await authAPI.login(
          formData.email,
          formData.password
        );
        localStorage.setItem("token", token);
        window.location.href = "/dashboard";
      } else {
        await authAPI.register(
          formData.email,
          formData.password,
          formData.name
        );
        setMode("login");
      }
    } catch (error) {
      alert(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Hero */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold">YesBill</h1>
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Track Daily Services
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Milk, Newspaper, Tiffin. Track daily with YesBill to
              automate your monthly billing.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {[
              { icon: "📅", text: "Daily tracking made simple" },
              { icon: "🔥", text: "Build streaks and stay motivated" },
              { icon: "📊", text: "Visualize your progress" },
              { icon: "💡", text: "Focus on what matters" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <span className="text-3xl">{feature.icon}</span>
                <span className="text-lg font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-6 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">YesBill</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === "login" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-gray-600">
                {mode === "login"
                  ? "Sign in to continue your tracking"
                  : "Create your account to start tracking"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required={mode === "signup"}
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading
                  ? "Loading..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <span className="font-semibold text-primary">Sign Up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold text-primary">Sign In</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
