// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import { Shield, Lock, Database, Eye } from "lucide-react";

export default function Security() {
  const measures = [
    {
      icon: Lock,
      title: "Encrypted in Transit",
      desc: "All data between your device and YesBill servers is encrypted using TLS 1.2+. Your billing records and account credentials are never sent over plain HTTP."
    },
    {
      icon: Database,
      title: "Secure Data Storage",
      desc: "Data is stored on Supabase (PostgreSQL) with Row-Level Security (RLS) policies. This means database queries are enforced at the database level — you can only access your own data, always."
    },
    {
      icon: Shield,
      title: "Authentication Security",
      desc: "Passwords are hashed using bcrypt before storage — we never see or store your plaintext password. We support secure magic-link login and OAuth via Google, minimising password-related risk."
    },
    {
      icon: Eye,
      title: "No Data Selling",
      desc: "Your billing data is yours. We do not sell, share, or use your personal data for advertising. Third-party integrations (Brevo, Gemini AI) receive only the minimum data required to function."
    },
  ];

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Security</h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            Your financial data deserves serious protection. Here's exactly how we keep it safe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {measures.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 hover:border-primary/20 cursor-default transition-shadow duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl border border-gray-100 cursor-default transition-shadow duration-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Infrastructure</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3"><span className="text-primary mt-1">›</span><span><strong>Database:</strong> Supabase (PostgreSQL) with Row-Level Security on all tables. JWT-authenticated queries only.</span></li>
            <li className="flex items-start gap-3"><span className="text-primary mt-1">›</span><span><strong>API:</strong> FastAPI backend on Fly.io with rate limiting on all endpoints to prevent abuse.</span></li>
            <li className="flex items-start gap-3"><span className="text-primary mt-1">›</span><span><strong>PDF Files:</strong> Stored in Supabase Storage and accessible only via authenticated, time-limited signed URLs.</span></li>
            <li className="flex items-start gap-3"><span className="text-primary mt-1">›</span><span><strong>Secrets:</strong> API keys (Brevo, Gemini) are stored as environment secrets — never committed to code.</span></li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
          className="mt-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100 hover:border-indigo-200 hover:shadow-md cursor-default transition-all duration-200"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Found a security issue?</h3>
          <p className="text-gray-600 text-sm mb-3">
            We take security reports seriously. If you discover a vulnerability, please contact us directly rather than making it public.
          </p>
          <a
            href="mailto:support@yesbill.in?subject=Security Report"
            className="text-primary font-semibold hover:underline text-sm"
          >
            support@yesbill.in
          </a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
