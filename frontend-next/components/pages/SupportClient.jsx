'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Lightbulb,
  Mail,
  BookOpen,
  Github,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { usePageReady } from "@/hooks/usePageReady";

const GITHUB_REPO = "https://github.com/Ishan96Dev/YesBill";
const BUG_REPORT_URL = `${GITHUB_REPO}/issues/new?labels=bug&title=%5BBUG%5D+`;
const FEATURE_REQUEST_URL = `${GITHUB_REPO}/issues/new?labels=enhancement&title=%5BFEATURE%5D+`;
const ISSUES_URL = `${GITHUB_REPO}/issues`;
const SUPPORT_EMAIL = "support@yesbill.com";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SupportClient() {
  const pageReady = usePageReady(600);

  return (
    <AppLayout>
      <AnimatePresence>
        {!pageReady && <AppLoadingScreen key="loading" pageName="Support" pageType="support" />}
      </AnimatePresence>

      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* ── Page Header ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                Support Center
              </span>
            </h1>
          </div>
          <p className="text-gray-500 text-lg ml-0">
            We&apos;re here to help. Report bugs, request features, or reach out directly.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ── Primary Action Cards ────────────────────────── */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Get Help via GitHub
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Bug Report Card */}
              <a
                href={BUG_REPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border-2 border-red-100 bg-white p-6 hover:border-red-300 hover:shadow-xl hover:shadow-red-100 transition-all duration-300"
              >
                {/* Gradient glow bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                      <Bug className="w-6 h-6 text-red-600" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">Raise a Bug</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    Found something broken? Open a GitHub issue and we&apos;ll fix it as fast as possible.
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 group-hover:gap-3 transition-all">
                    <Github className="w-4 h-4" />
                    Open Bug Report
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </a>

              {/* Feature Request Card */}
              <a
                href={FEATURE_REQUEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border-2 border-indigo-100 bg-white p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300"
              >
                {/* Gradient glow bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                      <Lightbulb className="w-6 h-6 text-indigo-600" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">Request a Feature</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    Have an idea to make YesBill better? Share it and help shape the roadmap.
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">
                    <Github className="w-4 h-4" />
                    Request Feature
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </a>
            </div>
          </motion.div>

          {/* ── Secondary Actions ───────────────────────────── */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              More Ways to Get Support
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-black/5 divide-y divide-gray-100 overflow-hidden">

              {/* View All Issues */}
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors flex-shrink-0">
                  <Github className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">View All Issues</p>
                  <p className="text-xs text-gray-400 mt-0.5">Browse open bugs and feature requests on GitHub</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
              </a>

              {/* Email Support */}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-600 group-hover:text-violet-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Email Support</p>
                  <p className="text-xs text-gray-400 mt-0.5">{SUPPORT_EMAIL}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
              </a>

              {/* Contact Page */}
              <Link
                href="/contact"
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Contact Form</p>
                  <p className="text-xs text-gray-400 mt-0.5">Send us a message directly from the app</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-400 flex-shrink-0 transition-colors" />
              </Link>
            </div>
          </motion.div>

          {/* ── Response Info ───────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 rounded-2xl border border-indigo-200/40 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Quick Response Commitment</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Bug reports are triaged within <strong>24 hours</strong>. Feature requests are reviewed weekly and added to the{' '}
                    <Link href="/roadmap" className="text-primary font-semibold hover:underline">
                      public roadmap
                    </Link>{' '}
                    based on community votes. For urgent issues, email us directly at{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-semibold hover:underline">
                      {SUPPORT_EMAIL}
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Tips ──────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Tips for a Great Bug Report
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-black/5 p-5">
              <ul className="space-y-3">
                {[
                  { title: "Describe what happened", desc: "What did you expect to happen vs what actually occurred?" },
                  { title: "Include steps to reproduce", desc: "How can we trigger this bug consistently?" },
                  { title: "Add screenshots or recordings", desc: "Visual evidence speeds up debugging significantly." },
                  { title: "Mention your browser / device", desc: "Chrome on Mac? Safari on iPhone? This matters." },
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{tip.title}</span>
                      <span className="text-sm text-gray-500"> — {tip.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
