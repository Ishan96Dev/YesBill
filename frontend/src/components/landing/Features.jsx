// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { CheckCircle2, Calendar, IndianRupee, MessageCircle, Mail, FileText, Layers, Bell, MessageSquare, Bot, BarChart3 } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: CheckCircle2,
      title: "Daily Service Tick System",
      description: "Mark daily services like milk, newspaper, or cleaning with a single tap. Calendar view keeps everything organized.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Calendar,
      title: "Auto Monthly Bill Calculation",
      description: "End-of-month totals are calculated instantly based on your daily inputs. No more manual errors.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: MessageSquare,
      title: "Ask AI Chat",
      description: "Chat with YesBill's AI about your bills, spending patterns, and services using plain English. Multi-turn conversation history included.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10"
    },
    {
      icon: Bot,
      title: "Agent Autopilot",
      description: "An intelligent Intercom-style AI agent floats on every page, ready to manage services, generate bills, and answer questions instantly.",
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Visualise monthly spend by category, track AI usage costs, and spot spending trends across months.",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10"
    },
    {
      icon: IndianRupee,
      title: "INR Support & Pricing",
      description: "Optimized for Indian services. Set daily rates in ₹ and handle price variations easily.",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Delivery",
      description: "Send professional bill summaries directly to service providers or customers via WhatsApp with one click.",
      color: "text-green-500",
      bg: "bg-green-500/10",
      comingSoon: true
    },
    {
      icon: Bell,
      title: "Reminder Notifications",
      description: "Get daily reminders to log your services so you never miss a day again.",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      icon: FileText,
      title: "Export PDF Invoice",
      description: "Download detailed PDF invoices for your records or to share professionally.",
      color: "text-red-500",
      bg: "bg-red-500/10"
    },
    {
      icon: Layers,
      title: "Multiple Services",
      description: "Track unlimited services per user. Milk, Gym, Laundry, Driver - manage it all in one place.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: Mail,
      title: "Email Reports",
      description: "Receive monthly summaries in your inbox to keep your expenses tracked and archived.",
      color: "text-pink-500",
      bg: "bg-pink-500/10"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="features">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-base font-bold text-primary tracking-wide uppercase mb-4">Features</h2>
          <p className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Everything you need to manage <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">daily expenses</span>
          </p>
          <p className="text-xl text-gray-500 leading-relaxed">
            Stop using paper notebooks and spreadsheets. YesBill brings daily service tracking into the modern era.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                {feature.comingSoon && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 shrink-0">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
