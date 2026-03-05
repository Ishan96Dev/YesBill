// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import PageWrapper from "../components/PageWrapper";
import HeroSection from "../components/HeroSection";
import HeroInvoice from "../components/hero-graphics/HeroInvoice";
import { Button } from "../components/ui/button";
import { Check, Clock } from "lucide-react";

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "",
      description: "For individuals & households",
      features: [
        "Track up to 3 services",
        "Daily YES/NO tracking",
        "Automatic bill calculation",
        "PDF invoice export",
        "AI bill summaries",
        "Calendar view",
        "Email delivery",
      ],
      cta: "Get Started",
      ctaAction: () => navigate("/signup"),
      highlight: false,
      available: true,
    },
    {
      name: "Pro",
      price: "Coming Soon",
      period: "",
      description: "For power users & households",
      features: [
        "Unlimited services",
        "Custom billing intervals",
        "Advanced PDF invoices",
        "Priority support",
        "Data export (CSV)",
        "Multiple billing profiles",
      ],
      cta: "Notify Me",
      ctaAction: () => window.open("mailto:support@yesbill.in?subject=Pro Plan Interest"),
      highlight: true,
      available: false,
    },
    {
      name: "Business",
      price: "Coming Soon",
      period: "",
      description: "For service providers",
      features: [
        "Manage 50+ customers",
        "Bulk email invoice delivery",
        "Automated billing cycles",
        "Payment tracking",
        "White-label invoices",
        "Dedicated support",
      ],
      cta: "Notify Me",
      ctaAction: () => window.open("mailto:support@yesbill.in?subject=Business Plan Interest"),
      highlight: false,
      available: false,
    }
  ];

  return (
    <PageWrapper>
      <Background />
      <Navbar />

      <main className="mb-24">
        <HeroSection
          title="Simple Pricing"
          subtitle="Start free, forever. Upgrade when you need more power. No hidden fees, no credit card required."
          graphic={<HeroInvoice />}
        />

        <section className="py-12 md:py-24 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: plan.highlight ? -4 : -7, scale: plan.highlight ? 1.005 : 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                className={`rounded-2xl p-8 relative cursor-default transition-shadow duration-200 ${
                  plan.highlight
                    ? "bg-white shadow-xl ring-2 ring-primary scale-105 z-10 hover:shadow-2xl"
                    : "bg-white shadow-lg border border-gray-100 hover:shadow-xl hover:border-primary/20"
                } ${!plan.available ? "opacity-80" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Coming Soon
                  </div>
                )}
                {!plan.available && !plan.highlight && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Soon
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  {plan.available ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && <span className="text-gray-500">{plan.period}</span>}
                    </>
                  ) : (
                    <span className="text-xl font-semibold text-gray-400">{plan.price}</span>
                  )}
                </div>
                <p className="text-gray-500 mb-8">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-600">
                      <Check className={`w-5 h-5 shrink-0 ${plan.available ? "text-primary" : "text-gray-300"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={plan.ctaAction}
                  className={`w-full h-12 text-lg rounded-xl ${
                    plan.highlight
                      ? "bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/20"
                      : plan.available
                        ? "bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 shadow-none"
                        : "bg-gray-50 border-2 border-gray-200 text-gray-500 hover:bg-gray-100 shadow-none"
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            Pro and Business plans are under development. Sign up to be notified when they launch.
          </p>
        </section>
      </main>

      <Footer />
    </PageWrapper>
  );
}
