// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import PageWrapper from "../components/PageWrapper";
import HeroSection from "../components/HeroSection";
import HeroContact from "../components/hero-graphics/HeroContact";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Mail, Phone, MapPin, CheckCircle2, Loader2, Twitter, Github, Instagram, Linkedin } from "lucide-react";
import { assetUrl } from "../lib/utils";

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`;
const INITIAL_FORM = { first_name: "", last_name: "", email: "", message: "", _hp: "" };

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.last_name.trim()) errs.last_name = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.trim().length < 10) errs.message = "Message must be at least 10 characters";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <PageWrapper>
      <Background />
      <Navbar />

      <main className="mb-24">
        <HeroSection
          title="Get in Touch"
          subtitle="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
          graphic={<HeroContact />}
        />

        <section className="py-12 md:py-24 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900">Contact Information</h3>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a href="mailto:ishanrock1234@gmail.com" className="text-gray-600 hover:text-primary transition-colors">ishanrock1234@gmail.com</a>
                  <br />
                  <a href="mailto:ishanchakraborty2496@gmail.com" className="text-gray-600 hover:text-primary transition-colors">ishanchakraborty2496@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-gray-600">+91 7021133070</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9am to 6pm IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Address</p>
                  <p className="text-gray-600">21, Gauranga Sarani</p>
                  <p className="text-gray-600">Shanta Neer Apartment, Garfa</p>
                  <p className="text-gray-600">Kolkata - 700078</p>
                </div>
              </div>

              {/* ── Social Card ── */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect on Social</h3>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-100/60 overflow-hidden"
                >
                  {/* Card header gradient */}
                  <div className="h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 relative">
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                    />
                  </div>

                  <div className="px-6 pb-6 -mt-10">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gray-100 mb-4">
                      <img
                        src={assetUrl("/avatars/user1.png")}
                        alt="Ishan Chakraborty"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-gradient-to-br', 'from-indigo-400', 'to-purple-500'); }}
                      />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 leading-tight">Ishan Chakraborty</h4>
                    <p className="text-sm text-gray-500 mb-5">Creator &amp; Developer · YesBill</p>

                    {/* Social link pills */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { Icon: Linkedin,  label: "LinkedIn",  href: "https://www.linkedin.com/in/ishan-chakraborty-0085571a1", bg: "bg-[#0A66C2]/10", text: "text-[#0A66C2]", border: "border-[#0A66C2]/20", hover: "hover:bg-[#0A66C2]/20" },
                        { Icon: Github,    label: "GitHub",    href: "https://github.com/Ishan96Dev",                          bg: "bg-gray-100",        text: "text-gray-800",   border: "border-gray-200",     hover: "hover:bg-gray-200" },
                        { Icon: Twitter,   label: "X / Twitter",href: "https://x.com/IshanC96",                                bg: "bg-gray-900/10",    text: "text-gray-900",  border: "border-gray-900/20", hover: "hover:bg-gray-900/20" },
                        { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/ig_ishan96/",                  bg: "bg-pink-50",         text: "text-pink-600",  border: "border-pink-200",    hover: "hover:bg-pink-100" },
                      ].map(({ Icon, label, href, bg, text, border, hover }) => (
                        <motion.a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${bg} ${text} ${border} ${hover} transition-colors`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium truncate">{label}</span>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 mb-6">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-primary font-semibold hover:underline text-sm"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                  {/* Honeypot — hidden from real users, bots fill it in */}
                  <input
                    type="text"
                    name="_hp"
                    value={form._hp}
                    onChange={handleChange}
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                  />
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <Input
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        placeholder="John"
                        className={errors.first_name ? "border-red-400 focus:ring-red-400" : ""}
                      />
                      {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <Input
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className={errors.last_name ? "border-red-400 focus:ring-red-400" : ""}
                      />
                      {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      icon={Mail}
                      className={errors.email ? "border-red-400 focus:ring-red-400" : ""}
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      className={`w-full min-h-[120px] rounded-xl border p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all ${
                        errors.message ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                      placeholder="How can we help you?"
                    />
                    {errors.message && <p className="text-red-500 text-xs">{errors.message}</p>}
                  </div>

                  {status === "error" && (
                    <p className="text-red-500 text-sm text-center">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full h-12 text-lg bg-primary hover:bg-indigo-700 shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </PageWrapper>
  );
}
