// @ts-nocheck
'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Background from "@/components/landing/Background";
import { Mail, Code, Megaphone, PenTool } from "lucide-react";

export default function Careers() {
  const areas = [
    { icon: Code, title: "Engineering", desc: "React, Python, FastAPI, Supabase. Build the features that power daily billing for thousands of users." },
    { icon: Megaphone, title: "Growth & Marketing", desc: "Help us reach milk distributors, tiffin owners, and apartment managers across India." },
    { icon: PenTool, title: "Design", desc: "Craft intuitive, beautiful experiences that make billing feel effortless for anyone." },
  ];

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Join Us</h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            YesBill is a small, focused team building India's simplest daily billing tool.
            We're not hiring formally yet — but all collaborators are welcome.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl border border-gray-100 mb-8 cursor-default transition-shadow duration-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">We're Open to Collaborators</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We're a lean early-stage product and we welcome passionate contributors who want to build
            something meaningful. Whether you're a developer, designer, writer, or marketer —
            if you believe in making billing simple and transparent for every Indian household,
            we'd love to hear from you.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {areas.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2, ease: "easeOut" } }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg cursor-default transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 text-center">
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Interested in collaborating?</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Send us a short note about who you are and how you'd like to contribute.
            </p>
            <a
              href="mailto:partnerships@yesbill.in?subject=Collaboration Interest"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Connect via Email
            </a>
            <p className="text-gray-400 text-xs mt-3">partnerships@yesbill.in</p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
