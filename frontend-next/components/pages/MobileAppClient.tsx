'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle2, Calendar, IndianRupee, Bot, BarChart3,
  MessageSquare, Bell, Smartphone, RefreshCw, Shield,
  Download, Star, Zap, ArrowRight, ChevronRight
} from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const APK_URL =
  'https://github.com/Ishan96Dev/YesBill/releases/latest/download/YesBill.apk'

// ─── Phone mockup SVG ──────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <svg
      viewBox="0 0 320 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[300px] drop-shadow-2xl"
      aria-hidden="true"
    >
      {/* Phone shell */}
      <rect x="10" y="8" width="300" height="604" rx="42" fill="#1a1a2e" />
      <rect x="16" y="14" width="288" height="592" rx="38" fill="#0f0f1a" />

      {/* Screen */}
      <rect x="20" y="18" width="280" height="584" rx="36" fill="#F8F9FF" />

      {/* Status bar */}
      <rect x="20" y="18" width="280" height="44" rx="36" fill="#F8F9FF" />
      <rect x="20" y="44" width="280" height="4" fill="#F8F9FF" />
      <text x="42" y="42" fontSize="11" fill="#6B7280" fontFamily="system-ui">9:41</text>
      <rect x="252" y="30" width="20" height="12" rx="3" fill="#E5E7EB" />
      <rect x="253" y="31" width="14" height="10" rx="2" fill="#6366F1" />

      {/* Dynamic island */}
      <rect x="112" y="22" width="96" height="24" rx="12" fill="#0f0f1a" />

      {/* App header */}
      <rect x="20" y="62" width="280" height="54" fill="#6366F1" />
      <text x="36" y="93" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">YesBill</text>
      <text x="36" y="107" fontSize="10" fill="rgba(255,255,255,0.7)" fontFamily="system-ui">July 2025</text>
      <rect x="262" y="78" width="24" height="24" rx="12" fill="rgba(255,255,255,0.2)" />

      {/* Calendar grid header */}
      {['S','M','T','W','T','F','S'].map((d, i) => (
        <text key={d+i} x={36 + i * 36} y="138" fontSize="9" fill="#9CA3AF" fontFamily="system-ui" textAnchor="middle">{d}</text>
      ))}

      {/* Calendar grid rows */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => {
          const day = row * 7 + col - 1
          if (day < 1 || day > 31) return null
          const isToday = day === 14
          const hasService = [2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].includes(day)
          return (
            <g key={`${row}-${col}`}>
              {isToday && <circle cx={36 + col * 36} cy={165 + row * 36} r="14" fill="#6366F1" />}
              <text
                x={36 + col * 36}
                y={170 + row * 36}
                fontSize="11"
                fill={isToday ? 'white' : '#374151'}
                fontFamily="system-ui"
                textAnchor="middle"
              >{day}</text>
              {hasService && !isToday && (
                <circle cx={36 + col * 36} cy={178 + row * 36} r="2.5" fill="#6366F1" />
              )}
            </g>
          )
        })
      )}

      {/* Bill card */}
      <rect x="28" y="348" width="264" height="72" rx="14" fill="white" filter="url(#shadow)" />
      <rect x="28" y="348" width="264" height="72" rx="14" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="40" y="362" width="32" height="32" rx="10" fill="#EEF2FF" />
      <text x="56" y="383" fontSize="16" textAnchor="middle" fill="#6366F1">₹</text>
      <text x="84" y="375" fontSize="12" fontWeight="600" fill="#111827" fontFamily="system-ui">Monthly Bill</text>
      <text x="84" y="392" fontSize="10" fill="#6B7280" fontFamily="system-ui">July 2025 • 3 services</text>
      <text x="264" y="383" fontSize="15" fontWeight="700" fill="#111827" fontFamily="system-ui" textAnchor="end">₹2,450</text>

      {/* AI chat bubble */}
      <rect x="28" y="432" width="264" height="64" rx="14" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
      <rect x="40" y="444" width="28" height="28" rx="8" fill="#6366F1" />
      <text x="54" y="463" fontSize="12" textAnchor="middle" fill="white">AI</text>
      <text x="80" y="457" fontSize="11" fontWeight="600" fill="#6366F1" fontFamily="system-ui">Ask YesBill AI</text>
      <text x="80" y="472" fontSize="10" fill="#7C3AED" fontFamily="system-ui">"What did I spend last month?"</text>

      {/* Bottom nav bar */}
      <rect x="20" y="530" width="280" height="72" rx="0" fill="white" />
      <rect x="20" y="530" width="280" height="1" fill="#F3F4F6" />
      <rect x="20" y="566" width="280" height="26" rx="0" fill="white" />

      {['🏠','📅','₹','🤖','⚙️'].map((icon, i) => (
        <g key={i}>
          {i === 1 && <rect x={24 + i * 56} y="534" width="48" height="42" rx="10" fill="#EEF2FF" />}
          <text x={48 + i * 56} y="562" fontSize="18" textAnchor="middle" fontFamily="system-ui">{icon}</text>
        </g>
      ))}

      {/* Bottom safe area */}
      <rect x="124" y="590" width="72" height="5" rx="2.5" fill="#D1D5DB" />

      {/* Drop shadow filter */}
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6366F1" floodOpacity="0.15" />
        </filter>
      </defs>
    </svg>
  )
}

// ─── Download button ───────────────────────────────────────────────────────────
function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const isLg = size === 'lg'
  return (
    <a
      href={APK_URL}
      download
      className={`
        inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl
        transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5
        ${isLg ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm'}
      `}
    >
      {/* Android robot icon */}
      <svg
        viewBox="0 0 24 24"
        className={isLg ? 'w-7 h-7' : 'w-5 h-5'}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-10.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0M17.59 9.5H6.41a.41.41 0 0 0-.41.41v6.47a.41.41 0 0 0 .41.41h.59v2.46a.75.75 0 0 0 1.5 0V16.8h7v2.44a.75.75 0 0 0 1.5 0V16.8h.59a.41.41 0 0 0 .41-.41V9.91a.41.41 0 0 0-.41-.41m-9.42-1.82 1.02-1.77a.25.25 0 0 0-.09-.34.25.25 0 0 0-.34.09L7.7 7.45a6.3 6.3 0 0 0-2.5 2.05h13.6a6.3 6.3 0 0 0-2.5-2.05l-1.07-1.77a.25.25 0 0 0-.34-.09.25.25 0 0 0-.09.34l1.02 1.77c-.97-.45-2.04-.7-3.17-.7a7.4 7.4 0 0 0-3.07.65M4 10.82v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0m15 0v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0" />
      </svg>
      <div className="flex flex-col items-start leading-none">
        <span className={`${isLg ? 'text-xs' : 'text-[10px]'} text-gray-400 mb-0.5`}>Download APK</span>
        <span className={`font-semibold ${isLg ? 'text-base' : 'text-sm'}`}>YesBill for Android</span>
      </div>
    </a>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: CheckCircle2,
    title: 'Daily Service Tick',
    description: 'Tap once to mark your milk, newspaper, cleaning, or any household service for the day.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Calendar,
    title: 'Billing Calendar',
    description: 'A beautiful calendar shows every service day at a glance. Scroll through months effortlessly.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: IndianRupee,
    title: 'Auto Monthly Bills',
    description: 'Your monthly total is calculated automatically — no spreadsheets, no manual maths.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Ask AI',
    description: 'Chat with YesBill AI in plain language. Ask about spending, get summaries, or compare months.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Visualise your spending trends with clean charts. Spot patterns and control your budget.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Sync',
    description: 'Everything syncs instantly between your phone and the web. Change one, see it everywhere.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Never forget to tick a service. Get gentle reminders that keep your records accurate.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Your data is protected with end-to-end Supabase auth. No ads, no tracking, ever.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
]

const syncPoints = [
  'Add a service on web — it appears on your phone instantly',
  'Tick a service on mobile — your web calendar updates immediately',
  'AI chat history is shared across all your devices',
  'Bills are always up to date, no matter where you make changes',
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function MobileAppClient() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-indigo-100">
              <Smartphone className="w-4 h-4" />
              Now on Android
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              YesBill,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                in your pocket
              </span>
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-xl leading-relaxed">
              Track daily household services, view your billing calendar, chat with AI, and manage payments — all from your Android phone. Perfectly synced with the web.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <DownloadButton size="lg" />
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-7 py-4 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-200"
              >
                See features <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'Android 6.0+', icon: Smartphone },
                { label: 'Free to download', icon: Download },
                { label: 'Real-time sync', icon: RefreshCw },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className="w-4 h-4 text-indigo-500" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow behind the phone */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-300 to-violet-300 rounded-full blur-3xl opacity-30 scale-75" />
              <PhoneMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Sync banner ───────────────────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 text-center md:text-left">
              <div className="flex items-center gap-3 text-white mb-2">
                <Zap className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Always in sync</h2>
              </div>
              <p className="text-indigo-200 text-sm max-w-xs">
                One account. Every device. Zero effort.
              </p>
            </div>
            <div className="flex-1 grid sm:grid-cols-2 gap-3">
              {syncPoints.map((point) => (
                <div key={point} className="flex items-start gap-2 bg-white/10 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white/90 text-sm leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need, on the go
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              The mobile app has every feature from the web — no compromises.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                >
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Installation guide ────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Install in 3 steps</h2>
            <p className="text-gray-500">YesBill is a direct APK download — no Play Store needed.</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Download the APK',
                description: 'Tap the download button and save YesBill.apk to your phone.',
                color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
              },
              {
                step: '2',
                title: 'Allow installation',
                description: 'Open the APK file. If prompted, allow "Install from unknown sources" for your browser or file manager.',
                color: 'bg-violet-50 text-violet-600 border-violet-100',
              },
              {
                step: '3',
                title: 'Sign in & go',
                description: 'Log in with your YesBill account. Everything syncs instantly — your services, calendar, and bills.',
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center"
              >
                <div className={`w-12 h-12 rounded-2xl border ${s.color} flex items-center justify-center text-xl font-bold mx-auto mb-4`}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Requirements ──────────────────────────────────────────────── */}
      <section className="py-14 px-6 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Requirements</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
            {[
              { label: 'Android Version', value: '6.0 (Marshmallow) or higher' },
              { label: 'Storage', value: 'Approx. 30 MB free space' },
              { label: 'Internet', value: 'Required for sync & AI features' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                <div className="font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to track smarter?
            </h2>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Download the free YesBill Android app and bring your billing calendar everywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <DownloadButton size="lg" />
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-4 text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all duration-200 border border-indigo-200"
              >
                Create free account <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:underline">
                Sign in
              </Link>
              {' '}and your data syncs automatically.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
