'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, PlayCircle, CheckCircle2, FileText, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { assetUrl } from "../../lib/utils";

export default function Hero() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

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
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 px-6 overflow-hidden min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">

        {/* Left Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-2xl"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-primary text-sm font-medium mb-8 hover:border-primary/30 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="tracking-wide text-xs uppercase font-bold">New: Export PDF Invoices</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]"
          >
            Track Daily Services. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600 animate-gradient-x">
              Generate Bills Automatically.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-normal"
          >
            Tick services daily, calculate monthly totals instantly, and receive professional PDF invoices via email. Perfect for milk, tiffin, laundry, newspapers, and any recurring expenses.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 mb-16">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-primary to-indigo-600 border border-transparent"
              onClick={() => router.push("/signup")}
            >
              Start Tracking for Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold rounded-2xl border-2 hover:bg-gray-50 hover:text-primary hover:border-primary/20 transition-all duration-300 group"
              onClick={() => router.push("/demo")}
            >
              <PlayCircle className="mr-2 w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-6 pt-8 border-t border-gray-200/60"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(u => (
                <img
                  key={u}
                  src={assetUrl(`/avatars/user${u}.png`)}
                  alt={`User ${u}`}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex text-yellow-400 drop-shadow-md text-sm mb-0.5">★★★★★</div>
              <p className="text-sm text-gray-500 font-medium">Trusted by <span className="text-gray-900 font-bold">5,000+</span> daily users</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - 3D Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 10, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative hidden lg:block perspective-1000"
          style={{ y: y2 }}
        >
          {/* Radial Glow Behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 blur-[100px] -z-10 rounded-full" />

          {/* Main Card - Monthly Bill Summary */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl shadow-indigo-500/10 ring-1 ring-black/5 transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500 ease-out max-w-sm ml-auto mr-10"
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>

            <div className="mt-4 mb-6">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Payable</div>
              <div className="text-4xl font-bold text-gray-900">₹4,250<span className="text-lg text-gray-400 font-normal">.00</span></div>
              <div className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Bill Generated for October
              </div>
            </div>

            <div className="space-y-4">
              {/* List Items Mock */}
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100/50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">🥛</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Morning Milk</div>
                  <div className="text-xs text-gray-500">30 days × ₹70</div>
                </div>
                <div className="font-bold text-gray-900">₹2,100</div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100/50">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">📰</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Newspaper</div>
                  <div className="text-xs text-gray-500">25 days × ₹10</div>
                </div>
                <div className="font-bold text-gray-900">₹250</div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100/50">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">🍲</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Tiffin Service</div>
                  <div className="text-xs text-gray-500">19 days × ₹100</div>
                </div>
                <div className="font-bold text-gray-900">₹1,900</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
              <Button className="w-full bg-primary hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" /> PDF
              </Button>
            </div>
          </motion.div>

          {/* Floating Checklist Card */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-12 bottom-20 bg-white p-5 rounded-2xl shadow-xl shadow-black/10 border border-gray-100 w-64"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-700">Today's Entry</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Oct 24</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "Milk", checked: true },
                { name: "Newspaper", checked: true },
                { name: "Cleaning", checked: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${item.checked ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {item.checked && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <span className={`text-sm ${item.checked ? 'text-gray-900' : 'text-gray-400'}`}>{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
