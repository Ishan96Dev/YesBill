'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Smartphone, RefreshCw, CheckCircle2, Calendar, Bot, Download, ArrowRight } from 'lucide-react'

const APK_URL =
  'https://github.com/Ishan96Dev/YesBill/releases/latest/download/YesBill.apk'

const highlights = [
  { icon: CheckCircle2, label: 'Daily tick system', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Calendar,     label: 'Billing calendar',  color: 'text-blue-500',    bg: 'bg-blue-50'    },
  { icon: Bot,          label: 'Ask AI chat',        color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
  { icon: RefreshCw,    label: 'Real-time sync',     color: 'text-violet-500',  bg: 'bg-violet-50'  },
]

function MiniPhoneSVG() {
  return (
    <svg viewBox="0 0 200 380" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl" aria-hidden="true">
      <rect x="6" y="4" width="188" height="372" rx="32" fill="#1a1a2e" />
      <rect x="12" y="10" width="176" height="360" rx="28" fill="#F8F9FF" />
      {/* Status bar */}
      <rect x="12" y="10" width="176" height="36" rx="28" fill="#6366F1" />
      <rect x="12" y="34" width="176" height="12" fill="#6366F1" />
      <text x="28" y="34" fontSize="9" fill="rgba(255,255,255,0.8)" fontFamily="system-ui">9:41</text>
      <text x="120" y="30" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">YesBill</text>
      {/* Dynamic island */}
      <rect x="68" y="13" width="64" height="16" rx="8" fill="#0f0f1a" />
      {/* Calendar grid */}
      {['S','M','T','W','T','F','S'].map((d, i) => (
        <text key={d+i} x={26 + i * 22} y={75} fontSize="7" fill="#9CA3AF" fontFamily="system-ui" textAnchor="middle">{d}</text>
      ))}
      {[0,1,2,3,4].map(row =>
        [0,1,2,3,4,5,6].map(col => {
          const day = row * 7 + col - 1
          if (day < 1 || day > 31) return null
          const isToday = day === 14
          return (
            <g key={`${row}-${col}`}>
              {isToday && <circle cx={26 + col * 22} cy={92 + row * 22} r="9" fill="#6366F1" />}
              <text x={26 + col * 22} y={96 + row * 22} fontSize="8"
                fill={isToday ? 'white' : '#374151'} fontFamily="system-ui" textAnchor="middle">{day}</text>
              {!isToday && [3,5,7,8,9,10,11,12,13,15].includes(day) &&
                <circle cx={26 + col * 22} cy={101 + row * 22} r="2" fill="#6366F1" />
              }
            </g>
          )
        })
      )}
      {/* Bill card */}
      <rect x="18" y="210" width="164" height="48" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="26" y="220" width="24" height="24" rx="7" fill="#EEF2FF" />
      <text x="38" y="236" fontSize="11" textAnchor="middle" fill="#6366F1">₹</text>
      <text x="60" y="230" fontSize="9" fontWeight="600" fill="#111827" fontFamily="system-ui">July 2025</text>
      <text x="60" y="243" fontSize="8" fill="#6B7280" fontFamily="system-ui">3 active services</text>
      <text x="170" y="236" fontSize="11" fontWeight="700" fill="#111827" fontFamily="system-ui" textAnchor="end">₹2,450</text>
      {/* AI bubble */}
      <rect x="18" y="268" width="164" height="40" rx="12" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
      <rect x="26" y="276" width="22" height="22" rx="6" fill="#6366F1" />
      <text x="37" y="291" fontSize="9" textAnchor="middle" fill="white">AI</text>
      <text x="56" y="285" fontSize="9" fontWeight="600" fill="#6366F1" fontFamily="system-ui">Ask AI anything...</text>
      {/* Bottom nav */}
      <rect x="12" y="332" width="176" height="38" fill="white" />
      <rect x="12" y="332" width="176" height="1" fill="#F3F4F6" />
      {['🏠','📅','₹','🤖','⚙️'].map((icon, i) => (
        <text key={i} x={30 + i * 36} y={356} fontSize="13" textAnchor="middle" fontFamily="system-ui">{icon}</text>
      ))}
      <rect x="78" y="366" width="44" height="3" rx="1.5" fill="#D1D5DB" />
    </svg>
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
              <div className="relative w-[220px] h-[420px] mx-auto">
                <MiniPhoneSVG />
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
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-indigo-100">
              <Smartphone className="w-4 h-4" />
              Android App — Free
            </div>

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
                <div key={label} className={`flex items-center gap-2.5 ${bg} rounded-xl px-4 py-3 border border-transparent`}>
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>

            {/* Download button */}
            <div className="flex flex-wrap gap-4">
              <a
                href={APK_URL}
                download
                className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-6 py-4 transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5"
              >
                {/* Android icon */}
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                  <path d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-10.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0M17.59 9.5H6.41a.41.41 0 0 0-.41.41v6.47a.41.41 0 0 0 .41.41h.59v2.46a.75.75 0 0 0 1.5 0V16.8h7v2.44a.75.75 0 0 0 1.5 0V16.8h.59a.41.41 0 0 0 .41-.41V9.91a.41.41 0 0 0-.41-.41m-9.42-1.82 1.02-1.77a.25.25 0 0 0-.09-.34.25.25 0 0 0-.34.09L7.7 7.45a6.3 6.3 0 0 0-2.5 2.05h13.6a6.3 6.3 0 0 0-2.5-2.05l-1.07-1.77a.25.25 0 0 0-.34-.09.25.25 0 0 0-.09.34l1.02 1.77c-.97-.45-2.04-.7-3.17-.7a7.4 7.4 0 0 0-3.07.65M4 10.82v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0m15 0v5.47a.75.75 0 0 0 1.5 0V10.82a.75.75 0 0 0-1.5 0" />
                </svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs text-gray-400 mb-0.5">Download APK</span>
                  <span className="font-semibold text-sm">YesBill for Android</span>
                </div>
              </a>

              <Link
                href="/mobile"
                className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all duration-200 border border-indigo-200"
              >
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
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
