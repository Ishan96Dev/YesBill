// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import { Mail } from "lucide-react";

export default function Blog() {
  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">YesBill Blog</h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            Tips, guides, and stories about managing daily services and billing better.
          </p>
        </div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
          className="bg-white rounded-3xl p-12 shadow-lg hover:shadow-xl border border-gray-100 hover:border-indigo-100 text-center cursor-default transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Articles Coming Soon</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            We're working on articles covering daily expense management, tips for service providers,
            and how to get the most out of YesBill. Check back soon.
          </p>

          {/* Collaborator CTA */}
          <motion.div
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 hover:border-indigo-200 hover:shadow-sm cursor-default transition-all duration-200"
          >
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Want to write for us?</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              We welcome contributors — writers, experts in personal finance, or anyone passionate
              about simplifying daily billing for Indian households.
            </p>
            <a
              href="mailto:partnerships@yesbill.in?subject=Blog Collaboration"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Connect via Email
            </a>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
