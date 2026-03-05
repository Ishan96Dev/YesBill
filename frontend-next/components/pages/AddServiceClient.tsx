// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Coffee,
  Newspaper,
  Car,
  Utensils,
  Package,
  Sparkles,
  DollarSign,
  Calendar,
  Clock,
  Bike,
  Home,
  Dumbbell,
  Wifi,
  Shirt,
  Droplets,
  Sun,
  Moon,
  Sunset,
  Zap,
  Flame,
  Tv,
  Phone,
  HeartPulse,
  Wrench,
  Music,
  BookOpen,
  Bus,
  CreditCard,
  Banknote,
  Building2,
  Truck,
  MapPin,
  FileText,
  Wallet,
  Briefcase,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { useToast } from "@/components/ui/toaster-custom";
import { usePageReady } from "@/hooks/usePageReady";
import { servicesService } from "@/services/dataService";
import { generatedBillsAPI } from "@/services/api";
import { DatePicker, strToDate, dateToStr } from "@/components/ui/DatePicker";

export default function AddService() {
  const router = useRouter();
  const { toast } = useToast();
  const pageReady = usePageReady(2000);

  const [formData, setFormData] = useState({
    name: "",
    type: "daily",
    price: "",
    schedule: "morning",
    icon: "package",
    notes: "",
    delivery_type: "home_delivery",
    billing_day: 1,
    billing_month: 1,
    auto_generate_bill: true,
    service_role: "consumer",
    start_date: "",
    end_date: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    client_address: "",
  });

  // Generate-now modal state
  const [showGenerateNowModal, setShowGenerateNowModal] = useState(false);
  const [createdService, setCreatedService] = useState(null);
  const [generatingNow, setGeneratingNow] = useState(false);

  const iconOptions = [
    { value: "coffee", icon: Coffee, label: "Coffee/Milk" },
    { value: "newspaper", icon: Newspaper, label: "Newspaper" },
    { value: "car", icon: Car, label: "Vehicle" },
    { value: "utensils", icon: Utensils, label: "Food" },
    { value: "package", icon: Package, label: "Package" },
    { value: "bike", icon: Bike, label: "Bike" },
    { value: "home", icon: Home, label: "Home Service" },
    { value: "dumbbell", icon: Dumbbell, label: "Gym" },
    { value: "wifi", icon: Wifi, label: "Internet" },
    { value: "shirt", icon: Shirt, label: "Laundry" },
    { value: "droplets", icon: Droplets, label: "Water" },
    { value: "zap", icon: Zap, label: "Electricity" },
    { value: "flame", icon: Flame, label: "Gas/LPG" },
    { value: "tv", icon: Tv, label: "TV/Cable" },
    { value: "phone", icon: Phone, label: "Phone" },
    { value: "heart-pulse", icon: HeartPulse, label: "Medical" },
    { value: "wrench", icon: Wrench, label: "Maintenance" },
    { value: "music", icon: Music, label: "Music" },
    { value: "book-open", icon: BookOpen, label: "Books" },
    { value: "bus", icon: Bus, label: "Transport" },
    { value: "credit-card", icon: CreditCard, label: "Finance" },
    { value: "banknote", icon: Banknote, label: "EMI/Loan" },
    { value: "building-2", icon: Building2, label: "Rent" },
  ];

  const deliveryTypeOptions = [
    { value: "home_delivery", icon: Truck, label: "Home Delivery", desc: "Delivered to your door" },
    { value: "utility", icon: Zap, label: "Utility", desc: "Internet, Electricity, Gas" },
    { value: "visit_based", icon: MapPin, label: "Visit-Based", desc: "Gym, clinic, you go there" },
    { value: "subscription", icon: CreditCard, label: "Subscription", desc: "OTT, magazine, fixed charge" },
    { value: "payment", icon: Banknote, label: "EMI / Loan / Rent", desc: "Fixed due-date payment" },
  ];

  const scheduleOptions = [
    { value: "morning", icon: Sun, label: "Morning" },
    { value: "afternoon", icon: Sunset, label: "Afternoon" },
    { value: "evening", icon: Sunset, label: "Evening" },
    { value: "night", icon: Moon, label: "Night" },
    { value: "all-day", icon: Clock, label: "All Day" },
    { value: "custom", icon: Calendar, label: "Custom" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Provider validation
    if (formData.service_role === "provider") {
      if (!formData.client_name.trim()) {
        toast({ title: "Client name required", description: "Please enter the client's name.", type: "error" });
        return;
      }
      if (!formData.client_phone.trim() && !formData.client_email.trim()) {
        toast({ title: "Contact info required", description: "Please enter a phone number or email for the client.", type: "error" });
        return;
      }
    }
    // Date range validation
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      toast({ title: "Invalid date range", description: "Start date must be before end date.", type: "error" });
      return;
    }

    try {
      const service = await servicesService.create(formData);

      // Check if today is the billing date for this service
      const now = new Date();
      const todayDay = now.getDate();
      const todayMonth = now.getMonth() + 1;
      const isYearly = service.type === "yearly";
      const billingDayMatch = service.billing_day === todayDay;
      const billingMonthMatch = !isYearly || service.billing_month === todayMonth;

      if (service.auto_generate_bill && billingDayMatch && billingMonthMatch) {
        // Today IS the billing date — ask if user wants to generate now
        setCreatedService(service);
        setShowGenerateNowModal(true);
      } else {
        toast({
          title: "Service Added",
          description: "Your new service has been created successfully",
          type: "success",
        });
        router.push("/services");
      }
    } catch (err) {
      console.error("Add service error:", err);
      toast({
        title: "Error",
        description: err.message || "Could not create service",
        type: "error",
      });
    }
  };

  const handleGenerateNow = async () => {
    if (!createdService) return;
    setGeneratingNow(true);
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await generatedBillsAPI.generateAndSend(yearMonth, [createdService.id]);
      toast({
        title: "Bill Generated!",
        description: "Your bill has been created and emailed to you.",
        type: "success",
      });
      setShowGenerateNowModal(false);
      router.push("/services");
    } catch (err) {
      console.error("Generate now error:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Could not generate bill. Try again from the Bills page.",
        type: "error",
      });
    } finally {
      setGeneratingNow(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] },
    },
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {!pageReady && <AppLoadingScreen key="loading" pageName="Add Service" pageType="services" />}
      </AnimatePresence>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/services")} className="mb-4 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Add New{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              Service
            </span>
          </h1>
          <p className="text-gray-500 text-lg">Create a recurring service to track in your calendar</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Name */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Milk"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                required
              />
            </motion.div>

            {/* Role Selector */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Wallet className="w-4 h-4 text-primary" />
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "consumer", icon: Wallet, label: "Consumer ??", desc: "I pay / I use this service" },
                  { value: "provider", icon: Briefcase, label: "Provider ??", desc: "I earn / I deliver this service" },
                ].map(({ value, icon: Icon, label, desc }) => {
                  const sel = formData.service_role === value;
                  const isProvider = value === "provider";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, service_role: value })}
                      className={`w-full !h-auto !min-h-[108px] !px-3 !py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                        sel
                          ? isProvider
                            ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15"
                            : "border-primary bg-primary/5 shadow-lg shadow-primary/15"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          sel
                            ? isProvider
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <p
                        className={`m-0 text-sm font-semibold leading-tight ${
                          sel ? (isProvider ? "text-emerald-700" : "text-primary") : "text-gray-700"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="m-0 text-xs leading-snug text-gray-500">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Client Info — shown only for Provider */}
            <AnimatePresence>
              {formData.service_role === "provider" && (
                <motion.div
                  key="client-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                    <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Client Details
                    </p>
                    {/* Client Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        placeholder="e.g., Rahul Sharma"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm text-sm"
                      />
                    </div>
                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Phone <span className="text-gray-400 font-normal">(one required)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.client_phone}
                            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                            placeholder="9876543210"
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Email <span className="text-gray-400 font-normal">(one required)</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={formData.client_email}
                            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                            placeholder="rahul@example.com"
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Address */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Address <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.client_address}
                          onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                          placeholder="e.g., 42, MG Road, Bangalore"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white shadow-sm text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Icon Selection */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Icon</label>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {iconOptions.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                      className={`!h-auto !min-h-[88px] !px-2 !py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        formData.icon === iconOption.value
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={iconOption.label}
                    >
                      <IconComponent className="w-5 h-5 text-gray-700 shrink-0" />
                      <span className="text-xs text-gray-500 truncate w-full text-center leading-tight">
                        {iconOption.label.split("/")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Service Type (Delivery Type) */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Truck className="w-4 h-4 text-primary" />
                Service Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deliveryTypeOptions.map(({ value, icon: Icon, label, desc }) => {
                  const sel = formData.delivery_type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_type: value })}
                      className={`w-full !h-auto !min-h-[124px] !px-3 !py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                        sel
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/15"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          sel ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <p className={`m-0 text-sm font-semibold leading-tight ${sel ? "text-primary" : "text-gray-700"}`}>
                        {label}
                      </p>
                      <p className="m-0 text-xs leading-snug text-gray-500">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Frequency */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["daily", "weekly", "monthly", "yearly"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`!h-auto !min-h-[64px] !px-3 !py-3 rounded-xl border-2 transition-all font-medium capitalize ${
                      formData.type === type
                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/20"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Billing Date — all service types */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                Billing Date
              </label>
              <p className="text-xs text-gray-400 mb-3">
                {formData.type === "yearly"
                  ? "Which month and day is this service billed each year?"
                  : "Which day of the month is the bill generated?"}
              </p>

              {/* Billing Month — only for yearly */}
              {formData.type === "yearly" && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Month</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, billing_month: idx + 1 })}
                        className={`h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.billing_month === idx + 1
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                            : "border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Day — 1–28 grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setFormData({ ...formData, billing_day: day })}
                    className={`h-10 w-full rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.billing_day === day
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                        : "border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Auto-generate bill toggle */}
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, auto_generate_bill: !formData.auto_generate_bill })}
                className={`w-full !h-auto !min-h-[76px] !px-4 !py-3 flex items-center justify-between gap-3 rounded-xl border-2 transition-all ${
                  formData.auto_generate_bill
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${formData.auto_generate_bill ? "bg-indigo-100" : "bg-gray-100"}`}>
                    <Sparkles className={`w-5 h-5 ${formData.auto_generate_bill ? "text-indigo-600" : "text-gray-400"}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold ${formData.auto_generate_bill ? "text-indigo-800" : "text-gray-700"}`}>
                      Auto-generate bill
                    </p>
                    <p className={`text-xs leading-snug ${formData.auto_generate_bill ? "text-indigo-500" : "text-gray-400"}`}>
                      {formData.auto_generate_bill
                        ? "AI will auto-generate + email bill on billing date"
                        : "Bill will only be generated manually"}
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData.auto_generate_bill ? "bg-indigo-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.auto_generate_bill ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
            </motion.div>

            {/* Price */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="w-4 h-4 text-primary" />
                Price (?)
                {formData.type === "yearly" && (
                  <span className="text-xs text-gray-400 font-normal ml-1">(annual amount)</span>
                )}
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 bg-white shadow-sm"
                required
                min="0"
                step="0.01"
              />
            </motion.div>

            {/* Schedule — hidden when yearly */}
            {formData.type !== "yearly" && (
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  Schedule
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {scheduleOptions.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: value })}
                      className={`!h-auto !min-h-[82px] !px-2 !py-3 rounded-xl border-2 transition-all font-medium text-sm flex flex-col items-center justify-center gap-1 ${
                        formData.schedule === value
                          ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/20"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Date Range */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                Service Period
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Set a start and/or end date for this service contract or subscription period.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Start Date</label>
                  <DatePicker
                    value={strToDate(formData.start_date)}
                    onChange={(d) => setFormData({ ...formData, start_date: dateToStr(d) })}
                    placeholder="Start date"
                    maxDate={formData.end_date ? strToDate(formData.end_date) : undefined}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">End Date</label>
                  <DatePicker
                    value={strToDate(formData.end_date)}
                    onChange={(d) => setFormData({ ...formData, end_date: dateToStr(d) })}
                    placeholder="End date"
                    minDate={formData.start_date ? strToDate(formData.start_date) : undefined}
                  />
                </div>
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={
                  formData.delivery_type === "payment"
                    ? "e.g., EMI due on 4th of every month, Bank: HDFC"
                    : "Additional details..."
                }
                rows={4}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 bg-white shadow-sm resize-none"
              />
            </motion.div>

            {/* Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/services")}
                className="flex-1 h-14 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-14 rounded-xl shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600"
              >
                Add Service
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
      {/* Generate Now Modal */}
      <AnimatePresence>
        {showGenerateNowModal && createdService && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Generate Bill Now?</h3>
                  <p className="text-xs text-gray-400">Today is the billing date</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Today is the billing date for{" "}
                <span className="font-semibold text-gray-900">{createdService.name}</span>.
                Would you like to generate and email the bill right now?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateNow}
                  disabled={generatingNow}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white h-11 rounded-xl"
                >
                  {generatingNow ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating…
                    </span>
                  ) : (
                    "Yes, Generate Now"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGenerateNowModal(false);
                    toast({ title: "Service Added", description: "Bill will auto-generate on the next billing date.", type: "success" });
                    router.push("/services");
                  }}
                  className="flex-1 h-11 rounded-xl"
                  disabled={generatingNow}
                >
                  Skip for Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
