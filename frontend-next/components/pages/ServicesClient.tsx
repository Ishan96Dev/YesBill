// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Coffee,
  Newspaper,
  Car,
  Utensils,
  Package,
  Clock,
  DollarSign,
  X,
  CheckCircle2,
  Circle,
  Calendar,
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
  Sparkles,
  FileText,
  Wallet,
  Briefcase,
  User,
  Mail,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip";
import ModernCard from "@/components/ui/modern-card";
import AppLayout from "@/components/layout/AppLayout";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import ServicesSkeleton from "@/components/skeletons/ServicesSkeleton";
import { useToast } from "@/components/ui/toaster-custom";
import { usePageReady } from "@/hooks/usePageReady";
import { useUser } from "@/hooks/useUser";
import { servicesService } from "@/services/dataService";
import { generatedBillsAPI } from "@/services/api";
import { DatePicker, strToDate, dateToStr } from "@/components/ui/DatePicker";

export default function Services() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, refreshProfile } = useUser();
  const pageReady = usePageReady(1500, !authLoading);
  const [services, setServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Generate-now modal (fires after create/edit when today = billing date)
  const [showGenerateNowModal, setShowGenerateNowModal] = useState(false);
  const [pendingGenerateService, setPendingGenerateService] = useState(null);
  const [generatingNow, setGeneratingNow] = useState(false);

  // Force refresh profile on mount to ensure latest currency data
  useEffect(() => {
    if (user && refreshProfile) {
      refreshProfile();
    }
  }, [user?.id]); // Only run when user ID changes

  // Get currency symbol from user profile
  const currencySymbol = useMemo(() => {
    // Priority: currency_code > currency mapping > default
    if (profile?.currency_code) {
      return profile.currency_code;
    }
    
    // Fallback: map currency to symbol
    if (profile?.currency) {
      const currencyMap = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'C$',
        'AUD': 'A$',
        'JPY': '¥',
        'CNY': '¥',
        'BRL': 'R$',
        'MXN': 'MX$',
        'KRW': '₩',
        'SGD': 'S$',
        'AED': 'د.إ',
        'SAR': '﷼',
        'ZAR': 'R',
        'RUB': '₽',
        'IDR': 'Rp',
        'THB': '฿',
        'MYR': 'RM',
        'PHP': '₱',
        'BDT': '৳',
        'PKR': '₨',
        'LKR': 'Rs',
        'NPR': 'रू',
        'NGN': '₦',
        'KES': 'KSh'
      };
      return currencyMap[profile.currency] || '₹';
    }
    
    // Default to INR
    return '₹';
  }, [profile]);

  // Fetch services from Supabase
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadServices = async () => {
      try {
        const data = await servicesService.getAll();
        if (!cancelled) setServices(data);
      } catch (err) {
        console.error('Failed to load services:', err);
        toast({ title: 'Error', description: 'Could not load services', type: 'error' });
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };
    loadServices();
    return () => { cancelled = true; };
  }, [user]);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [clientDetailsService, setClientDetailsService] = useState(null);
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

  // Check if a service's end_date is in the past
  const isExpired = (service) => {
    if (!service.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(service.end_date) < today;
  };

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

  const getIcon = (iconName) => {
    const iconObj = iconOptions.find(opt => opt.value === iconName);
    return iconObj ? iconObj.icon : Package;
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name || "",
        type: service.type || "daily",
        price: service.price || "",
        schedule: service.schedule || "morning",
        icon: service.icon || "package",
        notes: service.notes || "",
        delivery_type: service.delivery_type || "home_delivery",
        billing_day: service.billing_day || 1,
        billing_month: service.billing_month || 1,
        auto_generate_bill: service.auto_generate_bill ?? true,
        service_role: service.service_role || "consumer",
        start_date: service.start_date || "",
        end_date: service.end_date || "",
        client_name: service.client_name || "",
        client_phone: service.client_phone || "",
        client_email: service.client_email || "",
        client_address: service.client_address || "",
      });
    } else {
      setEditingService(null);
      setFormData({
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
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  // Check if today is the billing date for a service and show modal if auto-bill is on
  const _checkAndShowGenerateModal = (service, wasAutoGeneratePreviouslyOff = false) => {
    if (!service.auto_generate_bill) return false;
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const isYearly = service.type === "yearly";
    const billingDayMatch = service.billing_day === todayDay;
    const billingMonthMatch = !isYearly || service.billing_month === todayMonth;
    // For edits: only prompt if auto_generate_bill was just enabled OR if this is a new service
    if (billingDayMatch && billingMonthMatch && (wasAutoGeneratePreviouslyOff || !editingService)) {
      setPendingGenerateService(service);
      setShowGenerateNowModal(true);
      return true;
    }
    return false;
  };

  const handleGenerateNow = async () => {
    if (!pendingGenerateService) return;
    setGeneratingNow(true);
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await generatedBillsAPI.generateAndSend(yearMonth, [pendingGenerateService.id]);
      toast({ title: "Bill Generated!", description: "Your bill has been created and emailed to you.", type: "success" });
      setShowGenerateNowModal(false);
      setPendingGenerateService(null);
    } catch (err) {
      console.error("Generate now error:", err);
      toast({ title: "Generation Failed", description: err.message || "Try again from the Bills page.", type: "error" });
    } finally {
      setGeneratingNow(false);
    }
  };

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
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      toast({ title: "Invalid date range", description: "Start date must be before end date.", type: "error" });
      return;
    }

    try {
      if (editingService) {
        const wasAutoOff = !editingService.auto_generate_bill;
        const updated = await servicesService.update(editingService.id, {
          name: formData.name,
          type: formData.type,
          price: Math.round(parseFloat(formData.price) * 100) / 100,
          schedule: formData.schedule,
          icon: formData.icon,
          notes: formData.notes,
          delivery_type: formData.delivery_type,
          billing_day: formData.billing_day || 1,
          billing_month: formData.billing_month || 1,
          auto_generate_bill: formData.auto_generate_bill ?? true,
          service_role: formData.service_role || "consumer",
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          client_name: formData.client_name || null,
          client_phone: formData.client_phone || null,
          client_email: formData.client_email || null,
          client_address: formData.client_address || null,
        });
        setServices(services.map(s => s.id === editingService.id ? updated : s));
        handleCloseModal();
        const showedModal = _checkAndShowGenerateModal(updated, wasAutoOff);
        if (!showedModal) {
          toast({ title: "Service Updated", description: "Your service has been updated successfully", type: "success" });
        }
      } else {
        const created = await servicesService.create(formData);
        setServices([...services, created]);
        handleCloseModal();
        const showedModal = _checkAndShowGenerateModal(created, true);
        if (!showedModal) {
          toast({ title: "Service Added", description: "Your new service has been created", type: "success" });
        }
      }
    } catch (err) {
      console.error('Service save error:', err);
      toast({ title: 'Error', description: err.message || 'Could not save service', type: 'error' });
      handleCloseModal();
    }
  };

  const handleDelete = async (id) => {
    try {
      await servicesService.delete(id);
      setServices(services.filter(s => s.id !== id));
      toast({
        title: "Service Deleted",
        description: "Service has been removed",
        type: "default"
      });
    } catch (err) {
      console.error('Delete service error:', err);
      toast({ title: 'Error', description: 'Could not delete service', type: 'error' });
    }
  };

  const toggleActive = async (id) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    try {
      const updated = await servicesService.toggleActive(id, svc.active);
      setServices(services.map(s => s.id === id ? updated : s));
    } catch (err) {
      console.error('Toggle service error:', err);
      toast({ title: 'Error', description: 'Could not update service', type: 'error' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {(!pageReady || dataLoading) && <AppLoadingScreen key="loading" pageName="Services" pageType="services" />}
      </AnimatePresence>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Manage{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                  Services
                </span>
              </h1>
              <p className="text-gray-500 text-lg">
                Add, edit, or remove your recurring services
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push('/add-service')}
                size="lg"
                className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Service
              </Button>
            </motion.div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg shadow-black/5">
              <p className="text-sm text-gray-500 mb-1">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg shadow-black/5">
              <p className="text-sm text-gray-500 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{services.filter(s => s.active).length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg shadow-black/5">
              <p className="text-sm text-gray-500 mb-1">Daily</p>
              <p className="text-2xl font-bold text-blue-600">{services.filter(s => s.type === 'daily').length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg shadow-black/5">
              <p className="text-sm text-gray-500 mb-1">Weekly/Monthly</p>
              <p className="text-2xl font-bold text-purple-600">{services.filter(s => s.type !== 'daily').length}</p>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => {
            const ServiceIcon = getIcon(service.icon);
            const expired = isExpired(service);
            const isProvider = service.service_role === "provider";
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border shadow-lg shadow-black/5 hover:shadow-xl transition-all ${
                  !service.active ? "opacity-60 " : ""
                }${expired ? "border-red-200/70 opacity-75" : "border-gray-200/50"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isProvider
                      ? "bg-gradient-to-br from-emerald-100 to-emerald-200"
                      : "bg-gradient-to-br from-primary/10 to-indigo-500/10"
                  }`}>
                    <ServiceIcon className={`w-6 h-6 ${isProvider ? "text-emerald-600" : "text-primary"}`} />
                  </div>
                  <div className="flex gap-1">
                    <WithTooltip tip="View service calendar" side="top">
                      <button
                        onClick={() => router.push(`/services/${service.id}/calendar`)}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-primary" />
                      </button>
                    </WithTooltip>
                    <WithTooltip tip="Edit service" side="top">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </WithTooltip>
                    <WithTooltip tip="Delete service" side="top">
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </WithTooltip>
                  </div>
                </div>

                {/* Name + badges */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                  {/* Role badge */}
                  {isProvider ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Briefcase className="w-3 h-3" /> Provider 💰
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      <Wallet className="w-3 h-3" /> Consumer 💳
                    </span>
                  )}
                  {/* Expired badge */}
                  {expired && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      <AlertTriangle className="w-3 h-3" /> Expired
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">{service.notes}</p>

                {/* Client info row — provider only */}
                {isProvider && service.client_name && (
                  <div className="mb-3 p-2.5 bg-emerald-50 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium text-emerald-800 truncate">{service.client_name}</span>
                        {(service.client_phone || service.client_email) && (
                          <span className="text-xs text-emerald-500 truncate">
                            · {service.client_phone || service.client_email}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setClientDetailsService(service)}
                        className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-800 shrink-0 transition-colors"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 font-semibold">{currencySymbol}</span>
                    <span className="font-semibold text-gray-900">{currencySymbol}{service.price}</span>
                    <span className="text-gray-500">/ {service.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 capitalize">{service.schedule}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <button
                    onClick={() => toggleActive(service.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${service.active
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {service.active ? '✓ Active' : '○ Inactive'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-500 mb-6">Add your first service to start tracking</p>
            <Button onClick={() => router.push('/add-service')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-[37%] -translate-x-1/2 top-8 w-[calc(100%-2rem)] md:w-full md:max-w-2xl max-h-[calc(100vh-4rem)] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="px-6 md:px-8 pt-4 pb-6 md:pb-8 overflow-y-auto flex-1">

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Service Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Morning Milk"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      Your Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "consumer", icon: Wallet, label: "Consumer 💳", desc: "I pay / I use" },
                        { value: "provider", icon: Briefcase, label: "Provider 💰", desc: "I earn / I deliver" },
                      ].map(({ value, icon: Icon, label, desc }) => {
                        const sel = formData.service_role === value;
                        const isProv = value === "provider";
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, service_role: value })}
                            className={`w-full !h-auto !min-h-[84px] !px-2 !py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                              sel
                                ? isProv
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              sel ? (isProv ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary") : "bg-gray-100 text-gray-500"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <p className={`m-0 text-xs font-semibold ${sel ? (isProv ? "text-emerald-700" : "text-primary") : "text-gray-700"}`}>{label}</p>
                            <p className="m-0 text-[11px] text-gray-400">{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Client Info — shown only for Provider */}
                  <AnimatePresence>
                    {formData.service_role === "provider" && (
                      <motion.div
                        key="client-info-modal"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Client Details
                          </p>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              Client Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.client_name}
                              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                              placeholder="e.g., Rahul Sharma"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                              <div className="relative">
                                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="tel"
                                  value={formData.client_phone}
                                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                  placeholder="9876543210"
                                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                              <div className="relative">
                                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="email"
                                  value={formData.client_email}
                                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                  placeholder="rahul@example.com"
                                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-white"
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-3 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="text"
                                value={formData.client_address}
                                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                                placeholder="e.g., 42, MG Road, Bangalore"
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                      {iconOptions.map((iconOption) => {
                        const IconComponent = iconOption.icon;
                        return (
                          <button
                            key={iconOption.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                            className={`!h-auto !min-h-[80px] !px-2 !py-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                              formData.icon === iconOption.value
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            title={iconOption.label}
                          >
                            <IconComponent className="w-4 h-4 text-gray-700 shrink-0" />
                            <span className="text-xs text-gray-500 truncate w-full text-center leading-tight">
                              {iconOption.label.split("/")[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Truck className="w-4 h-4 text-primary" />
                      Service Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {deliveryTypeOptions.map(({ value, icon: Icon, label, desc }) => {
                        const sel = formData.delivery_type === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, delivery_type: value })}
                            className={`w-full !h-auto !min-h-[116px] !px-2 !py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                              sel
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/15"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                sel ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            <p className={`m-0 text-xs font-semibold leading-tight ${sel ? "text-primary" : "text-gray-700"}`}>
                              {label}
                            </p>
                            <p className="m-0 text-[11px] leading-snug text-gray-500">{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["daily", "weekly", "monthly", "yearly"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type })}
                          className={`!h-auto !min-h-[60px] !px-2 !py-2.5 rounded-xl border-2 transition-all font-medium capitalize text-sm ${
                            formData.type === type
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Billing Date — all service types */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Date</label>
                    <p className="text-xs text-gray-400 mb-2">
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
                              className={`h-9 rounded-lg border-2 text-sm font-medium transition-all ${
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
                          className={`h-9 w-full rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.billing_day === day
                              ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                              : "border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-generate bill toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, auto_generate_bill: !formData.auto_generate_bill })}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all ${
                        formData.auto_generate_bill
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.auto_generate_bill ? "bg-indigo-100" : "bg-gray-100"}`}>
                          <Sparkles className={`w-4 h-4 ${formData.auto_generate_bill ? "text-indigo-600" : "text-gray-400"}`} />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-semibold ${formData.auto_generate_bill ? "text-indigo-800" : "text-gray-700"}`}>
                            Auto-generate bill
                          </p>
                          <p className={`text-xs ${formData.auto_generate_bill ? "text-indigo-500" : "text-gray-400"}`}>
                            {formData.auto_generate_bill
                              ? "AI will auto-generate + email bill on billing date"
                              : "Bill will only be generated manually"}
                          </p>
                        </div>
                      </div>
                      <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData.auto_generate_bill ? "bg-indigo-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.auto_generate_bill ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ({currencySymbol}){formData.type === "yearly" && <span className="text-xs text-gray-400 font-normal ml-1">(annual amount)</span>}
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Schedule — hidden for yearly */}
                  {formData.type !== "yearly" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { value: "morning", icon: Sun, label: "Morning" },
                          { value: "afternoon", icon: Sunset, label: "Afternoon" },
                          { value: "evening", icon: Sunset, label: "Evening" },
                          { value: "night", icon: Moon, label: "Night" },
                          { value: "all-day", icon: Clock, label: "All Day" },
                          { value: "custom", icon: Calendar, label: "Custom" },
                        ].map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, schedule: value })}
                            className={`!h-auto !min-h-[76px] !px-2 !py-2 rounded-xl border-2 transition-all font-medium text-xs flex flex-col items-center justify-center gap-1 ${
                              formData.schedule === value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date Range */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      Service Period
                      <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                        <DatePicker
                          value={strToDate(formData.start_date)}
                          onChange={(d) => setFormData({ ...formData, start_date: dateToStr(d) })}
                          placeholder="Start date"
                          maxDate={formData.end_date ? strToDate(formData.end_date) : undefined}
                          className="h-[38px] text-sm rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                        <DatePicker
                          value={strToDate(formData.end_date)}
                          onChange={(d) => setFormData({ ...formData, end_date: dateToStr(d) })}
                          placeholder="End date"
                          minDate={formData.start_date ? strToDate(formData.start_date) : undefined}
                          className="h-[38px] text-sm rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={
                        formData.delivery_type === "payment"
                          ? "e.g., EMI due on 4th of every month, Bank: HDFC"
                          : "Additional details..."
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary to-indigo-600"
                    >
                      {editingService ? 'Update Service' : 'Add Service'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Generate Now Modal — shown when today is billing date after create/edit */}
      <AnimatePresence>
        {showGenerateNowModal && pendingGenerateService && (
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
                <span className="font-semibold text-gray-900">{pendingGenerateService.name}</span>.
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
                    setPendingGenerateService(null);
                    toast({ title: "Saved", description: "Bill will auto-generate on the next billing date.", type: "success" });
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
      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={!!clientDetailsService}
        onClose={() => setClientDetailsService(null)}
        service={clientDetailsService}
      />
    </AppLayout >
  );
}
