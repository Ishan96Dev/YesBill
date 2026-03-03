// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import {
  CheckCircle, Zap, FileText, Brain, Mail, CalendarDays,
  Target, Heart, Shield, Award,
  Users, Home, Briefcase, Building2
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import PageWrapper from "../components/PageWrapper";
import HeroSection from "../components/HeroSection";
import HeroServices from "../components/hero-graphics/HeroServices";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const features = [
  { icon: CheckCircle, title: "Daily YES/NO Tracking", desc: "Mark each service delivery with a single tap. The simplest possible input for every day of the month." },
  { icon: Zap, title: "Automatic Bill Calculation", desc: "Monthly totals are computed instantly at month-end — zero manual math, zero spreadsheets." },
  { icon: Brain, title: "AI-Powered Summaries", desc: "Each bill includes an AI-generated insight highlighting delivery patterns and recommendations." },
  { icon: Mail, title: "Email Bill Delivery", desc: "Send professional PDF invoices directly to customers via email in seconds." },
  { icon: FileText, title: "PDF Invoice Export", desc: "Download clean, professional PDF invoices for any billing cycle at any time." },
  { icon: CalendarDays, title: "Calendar View", desc: "See exactly which days any service was delivered or skipped in a visual monthly calendar." },
];

const values = [
  { icon: Target, title: "Simplicity First", desc: "No complex accounting. Just Yes or No — anyone can use it in under 10 seconds." },
  { icon: Heart, title: "User-Centric", desc: "Every feature starts with the question: does this make life easier for service providers and customers?" },
  { icon: Shield, title: "Transparency by Design", desc: "Both the provider and customer see the same data in real-time. No disputes, no guesswork." },
  { icon: Award, title: "Always Free Core", desc: "We believe billing clarity is a right — core tracking will always remain free for everyone." },
];

const audiences = [
  { icon: Users, title: "Milk Distributors", desc: "Manage 50+ customers across routes. Auto-calculate monthly bills — no tally sheets ever again.", color: "bg-blue-50 text-blue-600" },
  { icon: Home, title: "Tiffin Services", desc: "Track daily meal deliveries independently per household, with automatic billing at month-end.", color: "bg-green-50 text-green-600" },
  { icon: Briefcase, title: "Working Professionals", desc: "Keep transparent YES/NO records with your doodhwala, cleaner, and newspaper vendor.", color: "bg-purple-50 text-purple-600" },
  { icon: Building2, title: "Apartment Managers", desc: "Send monthly maintenance bills to all residents via PDF invoices. Replace 3 spreadsheets with one tool.", color: "bg-orange-50 text-orange-600" },
];

export default function About() {
  return (
    <PageWrapper>
      <Background />
      <Navbar />

      <main className="mb-24">
        <HeroSection
          title="About YesBill"
          subtitle="We're on a mission to eliminate billing disputes for millions of Indian households and daily service providers."
          graphic={<HeroServices />}
        />

        {/* Story Section */}
        <section className="py-16 max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
              <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
                Why We Built <span className="text-indigo-600">YesBill</span>
              </h2>
              <div className="w-16 h-1 bg-indigo-500 rounded-full mt-2" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2, ease: "easeOut" } }}
              className="bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4 cursor-default transition-shadow duration-200"
            >
              <p className="text-gray-700 leading-relaxed text-base">
                It started with a painfully familiar problem: keeping track of milk, newspaper, and tiffin deliveries.
                The manual tally marks on a calendar were always confusing — and always disputed.{" "}
                <span className="italic text-gray-500">"Did you take milk on the 15th?" "No, we were out of town."</span>
              </p>
              <p className="text-gray-700 leading-relaxed text-base">
                These small arguments happen in every household, every day. A service provider loses trust.
                A customer feels overcharged. A relationship sours over ₹70.
              </p>
              <p className="text-gray-700 leading-relaxed text-base">
                YesBill was built from that frustration. We created one simple interaction: tap{" "}
                <strong className="text-green-600">Yes</strong> when a service is delivered, tap{" "}
                <strong className="text-red-500">No</strong> when it isn't. At month-end, the bill calculates itself —
                automatically, transparently, and without any spreadsheets.
              </p>
              <p className="text-gray-700 leading-relaxed text-base">
                Today, YesBill supports milk, tiffin, newspapers, cleaning, laundry, and any recurring daily service.
                Bills are auto-generated with AI-powered summaries, exportable as PDF invoices, and delivered via email —
                all without a single manual calculation.
              </p>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="text-center mb-10">
              <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
                Features
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What We've Built</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-base">
                A focused toolkit for daily service billing — nothing more, nothing less.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl shadow-gray-200/40 border border-gray-100 hover:border-indigo-100 flex flex-col gap-4 cursor-default transition-shadow duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="text-center mb-10">
              <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
                Values
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Our Principles</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.015, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 hover:border-indigo-200 hover:shadow-lg flex items-start gap-4 cursor-default transition-shadow duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-indigo-100">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Who We're For */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="mb-16"
          >
            <motion.div variants={itemVariants} className="text-center mb-10">
              <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
                Audience
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Who We're For</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-base">
                Built for anyone dealing with recurring daily services in India.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {audiences.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl shadow-gray-100/60 border border-gray-100 hover:border-gray-200 text-center flex flex-col items-center gap-3 cursor-default transition-shadow duration-200"
                >
                  <div className={`w-14 h-14 rounded-2xl ${color.split(" ")[0]} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${color.split(" ")[1]}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Promise Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-indigo-600 rounded-2xl p-8 md:p-10 text-white text-center shadow-xl shadow-indigo-200"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Our Promise</h2>
            <p className="text-indigo-100 max-w-2xl mx-auto leading-relaxed">
              We will always keep the core tracking experience free. Billing should not be a luxury —
              transparency and trust are a right for every household and every service provider in India.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </PageWrapper>
  );
}
