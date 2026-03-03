// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, DollarSign, Calendar, Globe } from "lucide-react";
import { Button } from "../components/ui/button";
import Background from "../components/landing/Background";
import { useToast } from "../components/ui/toaster-custom";
import { billConfigService } from "../services/dataService";

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    projectName: "",
    currency: "INR",
    billingCycle: "monthly",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
  ];

  const billingCycles = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        type: "error"
      });
      return;
    }

    // TODO: API call to create project
    try {
      // Save bill config to Supabase
      await billConfigService.create({
        daily_amount: 0,
        currency: formData.currency,
        start_date: new Date().toISOString().split('T')[0],
      });

      // Also store project metadata locally for quick access
      const project = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("currentProject", JSON.stringify(project));
      
      toast({
        title: "Success!",
        description: "Your project has been created",
        type: "success"
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
      console.error('Create project error:', err);
      toast({
        title: "Error",
        description: err.message || "Could not create project",
        type: "error"
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />

      {/* Header */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm h-[72px] flex items-center">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <img
              src="/assets/branding/yesbill_logo_black.png"
              alt="YesBill"
              className="w-[120px] h-[120px] object-contain"
            />
          </div>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Already have an account? Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="tracking-wide text-xs uppercase font-bold">Let's Get Started</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-4 leading-tight"
          >
            Create Your First{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              Project
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
          >
            Set up your billing project in seconds. You'll add services and track them daily in the calendar.
          </motion.p>

          {/* Form Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-8 md:p-12 text-left"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Project Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., Home Services, Office Expenses"
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                  required
                />
              </div>

              {/* Currency */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Currency
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currencies.map((currency) => (
                    <motion.button
                      key={currency.code}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, currency: currency.code })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.currency === currency.code
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{currency.symbol}</div>
                      <div className="text-xs font-semibold text-gray-700">{currency.code}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  Billing Cycle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {billingCycles.map((cycle) => (
                    <motion.button
                      key={cycle.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, billingCycle: cycle.value })}
                      className={`p-4 rounded-xl border-2 transition-all font-medium ${
                        formData.billingCycle === cycle.value
                          ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {cycle.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Globe className="w-4 h-4 text-primary" />
                  Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 bg-white shadow-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Detected automatically. You can change it if needed.
                </p>
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 bg-gradient-to-r from-primary to-indigo-600"
                >
                  Create Project & Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-4 mt-8 text-left"
          >
            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-900 mb-1">Track Daily</h3>
              <p className="text-sm text-gray-600">Mark services as delivered or skipped in your calendar</p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-1">AI Bills</h3>
              <p className="text-sm text-gray-600">GPT-5 generates detailed monthly invoices automatically</p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
              <p className="text-sm text-gray-600">Get insights on spending patterns and trends</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/40 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2026 YesBill. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="/contact" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
