// @ts-nocheck
'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Background from "@/components/landing/Background";

export default function Roadmap() {
  const qDates = [
    {
      quarter: "Q1 2026",
      label: "Live Now",
      completed: true,
      items: [
        "Daily YES/NO service tracking",
        "Automatic monthly bill calculation",
        "PDF invoice export",
        "Multiple service support per household",
        "AI-powered bill summaries & insights",
        "Email bill delivery",
        "Calendar view for daily records",
        "Service management (add, edit, delete)",
      ]
    },
    {
      quarter: "Q2 2026",
      label: "Planned",
      completed: false,
      items: [
        "Direct UPI payment integration",
        "Service Provider Portal (manage multiple customers)",
        "Customer-facing bill view link",
        "Bulk day marking via calendar",
        "Pin AI conversations",
        "Agent: Create & manage services for Provider role",
      ]
    },
    {
      quarter: "Q3 2026",
      label: "Planned",
      completed: false,
      items: [
        "Mobile App (PWA & native — under consideration)",
        "Regenerate AI response",
        "Semantic search for AI documentation",
        "UPI Auto-Pay reminders",
        "Tax report generation",
      ]
    }
  ];

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">Product Roadmap</h1>
        
        <div className="space-y-12">
          {qDates.map((q, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
              className={`p-8 rounded-3xl border cursor-default transition-shadow duration-200 hover:shadow-lg ${q.completed ? 'bg-green-50/50 border-green-100 hover:border-green-200' : 'bg-white/60 border-gray-200 hover:border-indigo-200'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{q.quarter}</h3>
                {q.completed ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" /> {q.label}
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {q.label}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {q.items.map((item, j) => (
                   <div key={j} className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${q.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                     <span className={q.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}>{item}</span>
                   </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
