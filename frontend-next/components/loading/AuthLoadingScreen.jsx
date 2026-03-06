'use client'
﻿import { assetUrl } from "../../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";

/**
 * AuthLoadingScreen - Premium branded loading for auth flows
 * Exact landing page background (gradient mesh + noise + grid) with orbiting circles around logo
 * 
 * @param {string} type - 'login' | 'signup' | 'oauth' | 'logout' | 'verifying'
 * @param {string} message - Custom message to display
 * @param {string} userName - User's name for personalized messages
 */
export default function AuthLoadingScreen({ 
  type = 'login', 
  message = '',
  userName = ''
}) {
  const variants = {
    login: {
      title: userName ? `Welcome back, ${userName}!` : 'Welcome back!',
      subtitle: message || 'Signing you in...',
      accentColor: 'from-indigo-500 to-purple-600',
      dotColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.15)',
    },
    signup: {
      title: 'Creating your account',
      subtitle: message || 'Setting up your workspace...',
      accentColor: 'from-purple-500 to-indigo-600',
      dotColor: '#8B5CF6',
      glowColor: 'rgba(139, 92, 246, 0.15)',
    },
    oauth: {
      title: 'Connecting...',
      subtitle: message || 'Linking your account securely',
      accentColor: 'from-blue-500 to-indigo-600',
      dotColor: '#3B82F6',
      glowColor: 'rgba(59, 130, 246, 0.15)',
    },
    logout: {
      title: userName ? `See you soon, ${userName}!` : 'See you soon!',
      subtitle: message || 'Signing you out safely...',
      accentColor: 'from-indigo-500 to-purple-600',
      dotColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.15)',
    },
    verifying: {
      title: 'Verifying...',
      subtitle: message || 'Checking your credentials',
      accentColor: 'from-indigo-500 to-purple-600',
      dotColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.15)',
    }
  };

  const config = variants[type] || variants.login;

  // Orbiting dots configuration — radius must be > 70px (half of 140px logo)
  const orbitingDots = [
    { size: 10, radius: 95, duration: 6, delay: 0, opacity: 0.85 },
    { size: 7, radius: 120, duration: 8, delay: 0.5, opacity: 0.6, reverse: true },
    { size: 5, radius: 95, duration: 4.5, delay: 1.5, opacity: 0.45 },
    { size: 8, radius: 145, duration: 10, delay: 2, opacity: 0.5, reverse: true },
  ];

  const CONTAINER = 320; // px — orbit container size
  const CENTER = CONTAINER / 2; // 160

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAFAFA]">
      {/* ===== Landing page background (exact match) ===== */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Gradient mesh orbs — same as Background.jsx */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px]"
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 mix-blend-multiply pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative text-center px-6 max-w-md mx-auto"
      >
        {/* Logo with orbiting circles */}
        <div className="mb-10 flex justify-center">
          <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>
            {/* Glow behind logo */}
            <div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                top: CENTER - 90,
                left: CENTER - 90,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full rounded-full"
                style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)` }}
              />
            </div>

            {/* SVG orbit track rings */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${CONTAINER} ${CONTAINER}`}
              fill="none"
            >
              {[95, 120, 145].map((r, i) => (
                <circle
                  key={i}
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  stroke={config.dotColor}
                  strokeWidth="0.5"
                  strokeDasharray="4 6"
                  opacity={0.15 - i * 0.03}
                />
              ))}
            </svg>

            {/* Orbiting dots — each wrapper fills the full container so rotation is around true center */}
            {orbitingDots.map((dot, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                animate={{ rotate: dot.reverse ? [0, -360] : [0, 360] }}
                transition={{
                  duration: dot.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: dot.delay,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [dot.opacity, 1, dot.opacity] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute rounded-full"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    top: CENTER - dot.size / 2,
                    left: CENTER + dot.radius - dot.size / 2,
                    backgroundColor: config.dotColor,
                    boxShadow: `0 0 ${dot.size * 2}px ${config.dotColor}60`,
                  }}
                />
              </motion.div>
            ))}

            {/* Logo — centered via margins (NOT transform, which framer-motion overrides) */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute flex items-center justify-center"
              style={{
                width: 140,
                height: 140,
                top: CENTER - 70,
                left: CENTER - 70,
              }}
            >
              <img 
                src={assetUrl("/assets/branding/yesbill_logo_black.png")} 
                alt="YesBill" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight"
        >
          {config.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-lg text-gray-500 mb-10"
        >
          {config.subtitle}
        </motion.p>

        {/* Animated progress bar with shimmer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
          className="max-w-[200px] mx-auto"
        >
          <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`h-full w-1/2 bg-gradient-to-r ${config.accentColor} rounded-full`}
              style={{ boxShadow: `0 0 12px ${config.dotColor}50` }}
            />
          </div>
        </motion.div>

        {/* OAuth extra info */}
        {type === 'oauth' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 text-sm text-gray-400"
          >
            If not redirected, please wait a moment...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
