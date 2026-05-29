'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  CheckCircle2, Calendar, IndianRupee, Bot, BarChart3,
  MessageSquare, Bell, Smartphone, RefreshCw, Shield,
  Download, Star, Zap, ArrowRight, ChevronRight,
  HardDrive, Globe
} from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import Background from '@/components/landing/Background'

const APK_URL =
  'https://github.com/Ishan96Dev/YesBill/releases/latest/download/YesBill.apk'

// ─── Phone mockup with real screenshot ────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {/* Phone shell */}
      <div className="relative bg-gray-900 rounded-[50px] p-[12px] shadow-2xl ring-1 ring-white/10">
        {/* Screen area */}
        <div className="relative bg-black rounded-[40px] overflow-hidden">
          {/* Dynamic island */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-[12px]">
            <div className="w-[100px] h-[28px] bg-black rounded-full border-2 border-gray-900" />
          </div>
          {/* Real screenshot */}
          <Image
            src="/screenshots/dashboard.jpeg"
            alt="YesBill dashboard screen"
            width={300}
            height={600}
            className="w-full rounded-[40px]"
            priority
          />
        </div>
        {/* Home indicator */}
        <div className="flex justify-center mt-2.5">
          <div className="w-16 h-[5px] bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Download button ───────────────────────────────────────────────────────────
function DownloadButton({ size = 'lg', version }: { size?: 'lg' | 'sm'; version?: string | null }) {
  const isLg = size === 'lg'
  return (
    <motion.a
      href={APK_URL}
      // Use location.href so the browser handles the GitHub redirect natively
      onClick={(e) => { e.preventDefault(); window.location.href = APK_URL }}
      whileHover={{ scale: 1.04, y: -2, boxShadow: '0 12px 32px rgba(17,24,39,0.22)' }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center gap-3 bg-gray-900 text-white rounded-2xl cursor-pointer
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
        {version && (
          <span className={`${isLg ? 'text-[11px]' : 'text-[10px]'} text-indigo-400 mt-0.5`}>{version}</span>
        )}
      </div>
    </motion.a>
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
  const [latestVersion, setLatestVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://api.github.com/repos/Ishan96Dev/YesBill/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => r.json())
      .then((d) => { if (d.tag_name) setLatestVersion(d.tag_name) })
      .catch(() => {}) // silent — button still works without version label
  }, [])

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-indigo-100 cursor-default"
            >
              <Smartphone className="w-4 h-4" />
              Now on Android
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              YesBill,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                in your pocket
              </span>
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-xl leading-relaxed">
              Track daily household services, view your billing calendar, chat with AI, and manage payments — all from your Android phone. Perfectly synced with the web.
            </p>

            <div className="flex flex-wrap gap-4 mb-10 items-stretch">
              <DownloadButton size="lg" version={latestVersion} />
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="self-stretch flex"
              >
                <Link
                  href="#features"
                  className="flex items-center gap-2 px-7 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors duration-150 border border-gray-200"
                >
                  See features <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
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
              {/* Floating animation */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <PhoneMockup />
              </motion.div>
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
              {syncPoints.map((point, i) => (
                <motion.div
                  key={point}
                  whileHover={{ scale: 1.03, y: -2, backgroundColor: 'rgba(255,255,255,0.22)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="flex items-start gap-2 bg-white/10 rounded-xl p-3 cursor-default"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white/90 text-sm leading-snug">{point}</span>
                </motion.div>
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
                  whileHover={{ scale: 1.04, y: -6, boxShadow: '0 16px 40px rgba(99,102,241,0.13)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm cursor-default"
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
                whileHover={{ scale: 1.04, y: -5, boxShadow: '0 14px 36px rgba(0,0,0,0.09)' }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm text-center cursor-default"
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
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-semibold text-gray-900 mb-6 text-center"
          >
            Requirements
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
            {[
              { label: 'Android Version', value: '6.0 (Marshmallow) or higher', Icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Storage', value: 'Approx. 30 MB free space', Icon: HardDrive, color: 'text-violet-500', bg: 'bg-violet-50' },
              { label: 'Internet', value: 'Required for sync & AI features', Icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map(({ label, value, Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ scale: 1.04, y: -4, boxShadow: '0 10px 28px rgba(99,102,241,0.10)' }}
                whileTap={{ scale: 0.97 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">{label}</div>
                <div className="font-medium text-gray-800">{value}</div>
              </motion.div>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
              <DownloadButton size="lg" version={latestVersion} />
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="self-stretch flex"
              >
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-7 text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors duration-150 border border-indigo-200 w-full justify-center"
                >
                  Create free account <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
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
