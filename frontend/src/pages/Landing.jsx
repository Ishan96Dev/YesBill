// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Testimonials from "../components/landing/Testimonials";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import { useToast } from "../components/ui/toaster-custom";

export default function Landing() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [emailChangeBanner, setEmailChangeBanner] = useState(null);

  // Detect Supabase "Secure Email Change" first-click redirect to root
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const message = hash.get('message');
    const hasSbParam = window.location.hash.includes('sb=');
    if (message && hasSbParam) {
      // First link click confirmed — user needs to click the link in their NEW email
      setEmailChangeBanner("Almost there! Your old email is confirmed. Please check your new email inbox and click the confirmation link to complete the change.");
      toast({
        title: "Check your new email",
        description: "Click the confirmation link sent to your new email address to finish.",
        type: "info",
        duration: 8000,
      });
      // Clean up the URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [toast]);
  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />

      {/* Email change info banner — fixed below the fixed navbar (h-[100px]) */}
      {emailChangeBanner && (
        <div className="fixed top-[100px] left-0 right-0 z-[45] bg-indigo-600 text-white text-sm text-center px-4 py-3 flex items-center justify-between gap-3 shadow-md w-full">
          <span className="flex-1">📧 {emailChangeBanner}</span>
          <button
            onClick={() => setEmailChangeBanner(null)}
            className="shrink-0 text-white/70 hover:text-white text-lg leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      
      <main className={`flex flex-col gap-0${emailChangeBanner ? " pt-11" : ""}`}>
        <Hero />
        <Features />
        
        {/* Banner Section */}
        <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-36 bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden mt-12 rounded-t-[3rem] mx-2 shadow-2xl shadow-indigo-900/20">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light" />
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/10 to-transparent" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight drop-shadow-sm">Ready to eliminate billing disputes?</h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of households and service providers who use YesBill to track daily services and generate bills automatically.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get Started for Free
            </button>
          </div>
        </section>

        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
