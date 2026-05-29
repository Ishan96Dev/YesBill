'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Smartphone, RefreshCw, CheckCircle2, Calendar, Bot, Download, ArrowRight } from 'lucide-react'

const APK_URL =
  'https://github.com/Ishan96Dev/YesBill/releases/latest/download/YesBill.apk'

const highlights = [
  { icon: CheckCircle2, label: 'Daily tick system', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Calendar,     label: 'Billing calendar',  color: 'text-blue-500',    bg: 'bg-blue-50'    },
  { icon: Bot,          label: 'Ask AI chat',        color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
  { icon: RefreshCw,    label: 'Real-time sync',     color: 'text-violet-500',  bg: 'bg-violet-50'  },
]

function MiniPhoneReal() {
  return (
    <div className="relative w-[220px] mx-auto">
      {/* Phone shell */}
      <div className="relative bg-gray-900 rounded-[44px] p-[10px] shadow-2xl ring-1 ring-white/10">
        {/* Screen area */}
        <div className="relative bg-black rounded-[36px] overflow-hidden">
          {/* Dynamic island */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-[10px]">
            <div className="w-[88px] h-[26px] bg-black rounded-full border-2 border-gray-900" />
          </div>
          {/* Real screenshot */}
          <Image
            src="/screenshots/calendar.jpeg"
            alt="YesBill calendar screen"
            width={200}
            height={400}
            className="w-full rounded-[36px]"
          />
        </div>
        {/* Home indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-14 h-[5px] bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function MobileAppSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-indigo-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — phone */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex justify-center order-2 lg:order-1"
          >
            <div className="relative">
              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-200 to-violet-200 blur-3xl opacity-40 scale-110" />
              <div className="relative w-[220px] mx-auto">
                <MiniPhoneReal />
              </div>
              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute top-16 -right-8 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                Synced instantly
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-20 -left-8 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free download
              </motion.div>
            </div>
          </motion.div>

          {/* Right — content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-indigo-100 cursor-default"
            >
              <Smartphone className="w-4 h-4" />
              Android App — Free
            </motion.div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              YesBill{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                in your pocket
              </span>
            </h2>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
              Take your billing calendar wherever you go. The YesBill Android app stays perfectly in sync with the web — tick services, view bills, and ask AI questions, all from your phone.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {highlights.map(({ icon: Icon, label, color, bg }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.05, y: -3, boxShadow: '0 8px 24px rgba(99,102,241,0.12)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`flex items-center gap-2.5 ${bg} rounded-xl px-4 py-3 border border-transparent cursor-default`}
                >
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </motion.div>
              ))}
            </div>

            {/* Download button */}
            <div className="flex flex-wrap gap-4 items-stretch">
              <motion.a
                href={APK_URL}
                onClick={(e) => { e.preventDefault(); window.location.href = APK_URL }}
                whileHover={{ scale: 1.04, y: -2, boxShadow: '0 12px 32px rgba(17,24,39,0.22)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-6 py-4 cursor-pointer"
              >
                {/* Android icon */}
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                  <path d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-10.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0M17.59 9.5H6.41a.41.41 0 0 0-.41.41v6.47a.41.41 0 0 0 .41.41h.59v2.46a.75.75 0 0 0 1.5 0V16.8h7v2.44a.75.75 0 0 0 1.5 0V16.8h.59a.41.41 0 0 0 .41-.41V9.91a.41.41 0 0 0-.41-.41m-9.42-1.82 1.02-1.77a.25.25 0 0 0-.09-.34.25.25 0 0 0-.34.09L7.7 7.45a6.3 6.3 0 0 0-2.5 2.05h13.6a6.3 6.3 0 0 0-2.5-2.05l-1.07-1.77a.25.25 0 0 0-.34-.09.25.25 0 0 0-.09.34l1.02 1.77c-.97-.45-2.04-.7-3.17-.7a7.4 7.4 0 0 0-3.07.65M4 10.82v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0m15 0v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0" />
                </svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs text-gray-400 mb-0.5">Download APK</span>
                  <span className="font-semibold text-sm">YesBill for Android</span>
                </div>
                </motion.a>

              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="self-stretch flex"
              >
                <Link
                  href="/mobile"
                  className="flex items-center gap-2 px-6 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors duration-150 border border-indigo-200"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            <p className="mt-5 text-xs text-gray-400">
              Android 6.0+ • Free to download • No ads
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
