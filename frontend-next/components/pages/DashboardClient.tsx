// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Calendar, FileText, IndianRupee, BarChart3, Zap,
  CheckCircle2, XCircle, ArrowRight, Clock, TrendingUp, TrendingDown,
  CalendarClock, Coffee, Newspaper, Car, Utensils, Package,
  Bike, Home, Dumbbell, Wifi, Shirt, Droplets, Flame, Tv,
  Phone, HeartPulse, Wrench, Music, BookOpen, Bus,
  CreditCard, Banknote, Building2, Wallet, Briefcase,
  Brain, X, Lock, MessageSquare, Settings2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import DashboardSkeleton from "@/components/dash/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toaster-custom";
import { analyticsService, calendarService } from "@/services/dataService";
import profileService from "@/services/profileService";
import { aiSettingsService } from "@/services/aiSettingsService";
import { useUser } from "@/hooks/useUser";

// --- Icon system --------------------------------------------------------------
const iconMap = {
  coffee: Coffee, newspaper: Newspaper, car: Car, utensils: Utensils,
  package: Package, bike: Bike, home: Home, dumbbell: Dumbbell,
  wifi: Wifi, shirt: Shirt, droplets: Droplets, zap: Zap,
  flame: Flame, tv: Tv, phone: Phone, "heart-pulse": HeartPulse,
  wrench: Wrench, music: Music, "book-open": BookOpen, bus: Bus,
  "credit-card": CreditCard, banknote: Banknote, "building-2": Building2,
};

const iconGradients = {
  coffee: "from-amber-400 to-orange-500",
  newspaper: "from-slate-400 to-slate-600",
  wifi: "from-blue-400 to-indigo-500",
  banknote: "from-rose-400 to-pink-600",
  utensils: "from-green-400 to-emerald-500",
  dumbbell: "from-orange-400 to-red-500",
  droplets: "from-cyan-400 to-blue-500",
  zap: "from-yellow-400 to-orange-500",
  home: "from-teal-400 to-cyan-500",
  shirt: "from-violet-400 to-purple-500",
  car: "from-gray-400 to-gray-600",
  bike: "from-lime-400 to-green-500",
  flame: "from-orange-500 to-red-600",
  tv: "from-indigo-400 to-blue-500",
  phone: "from-green-400 to-teal-500",
  "heart-pulse": "from-red-400 to-pink-500",
  wrench: "from-gray-400 to-slate-600",
  music: "from-pink-400 to-purple-500",
  "book-open": "from-amber-400 to-yellow-500",
  bus: "from-blue-400 to-cyan-500",
  "credit-card": "from-emerald-400 to-green-500",
  "building-2": "from-slate-500 to-gray-700",
};

const CHART_COLORS = ["#7C3AED", "#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626"];

function SvcIcon({ iconName, size = "md" }) {
  const Icon = iconMap[iconName] || Package;
  const grad = iconGradients[iconName] || "from-indigo-400 to-purple-500";
  const sizeMap = {
    sm: "w-8 h-8 p-1.5 rounded-lg",
    md: "w-10 h-10 p-2 rounded-xl",
    lg: "w-12 h-12 p-2.5 rounded-xl",
  };
  const iconSizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <div className={`bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm ${sizeMap[size]}`}>
      <Icon className={`${iconSizeMap[size]} text-white`} />
    </div>
  );
}

function BentoCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  if (total === 0) return null;
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl min-w-[130px]">
      <p className="font-semibold mb-1.5 text-gray-300">Day {label}</p>
      {payload.filter((p) => p.value > 0).map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-bold">₹{p.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
      {payload.filter((p) => p.value > 0).length > 1 && (
        <div className="border-t border-gray-700 mt-1.5 pt-1.5 flex justify-between">
          <span className="text-gray-400">Total</span>
          <span className="font-bold">₹{total.toLocaleString("en-IN")}</span>
        </div>
      )}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const name = entry?.name || entry?.payload?.name || "";
  const value = entry?.value || 0;
  const color = entry?.payload?.color || entry?.fill || "#6366f1";
  if (!value) return null;
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl min-w-[120px]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-semibold text-gray-200 truncate">{name}</span>
      </div>
      <span className="font-bold text-sm">₹{value.toLocaleString("en-IN")}</span>
    </div>
  );
}

function AIConfigReminderModal({ onSetupNow, onRemindLater }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onRemindLater}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">AI features still not set up</h3>
          </div>
          <button onClick={onRemindLater} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You skipped AI configuration during setup. Without an API key these features remain locked:
        </p>

        <div className="space-y-2 mb-5">
          {[
            { icon: Brain, label: "Bill Generation", desc: "AI-powered monthly bill summaries" },
            { icon: MessageSquare, label: "Ask AI Chat", desc: "Chat with YesBill Assistant" },
            { icon: BarChart3, label: "AI Insights", desc: "Smart spending analysis on bills" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSetupNow}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-4 h-4" />
            Set Up Now
          </button>
          <button
            onClick={onRemindLater}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const [greeting, setGreeting] = useState("Good Morning");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [showAIReminder, setShowAIReminder] = useState(false);
  const [dashStats, setDashStats] = useState({
    totalSpent: 0, activeServicesCount: 0, deliveryRate: 0,
    delivered: 0, skipped: 0, totalConfirmations: 0, services: [],
    consumerSpent: 0, providerIncome: 0, netBalance: 0, hasProviderServices: false,
  });
  const [services, setServices] = useState([]);
  const [todayConfs, setTodayConfs] = useState([]);
  const [monthConfs, setMonthConfs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    const pick = (a, b) => Math.random() < 0.5 ? a : b;
    setGreeting(
      h < 5  ? "Hello, Night Owl" :
      h < 12 ? pick("Good Morning", "Rise and shine") :
      h < 17 ? pick("Good Afternoon", "Hope your day is going well") :
               pick("Good Evening", "Winding down")
    );
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setCurrentMonth(ym);

    const load = async () => {
      try {
        const [stats, todayData, monthData] = await Promise.all([
          analyticsService.getDashboardStats(),
          calendarService.getToday(),
          calendarService.getMonth(ym),
        ]);
        setDashStats(stats);
        setServices(stats.services || []);
        setTodayConfs(todayData);
        setMonthConfs(monthData);
      } catch (err) {
        console.error("Dashboard load:", err);
        toast({ title: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Profile + AI reminder (runs when user auth state is available) --------
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    profileService.getProfile(uid).then((profile) => {
      setUserName(profile?.display_name || profile?.full_name || "");
      if (
        profile?.onboarding_skipped_steps?.ai_config === true &&
        profile?.ai_config_reminder_shown !== true
      ) {
        aiSettingsService.getAllSettings(uid).then((allAI) => {
          const hasKey = allAI.some((s) => s.api_key_encrypted);
          if (!hasKey) setShowAIReminder(true);
        }).catch(() => { setShowAIReminder(true); });
      }
    }).catch(() => { /* silent — name is optional */ });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Today's services (filter monthly to billing day only) -----------------
  const todayServices = useMemo(() => {
    const today = new Date().getDate();
    return services
      .filter((svc) => svc.type !== "monthly" || today === (svc.billing_day || 1))
      .map((svc) => {
        const conf = todayConfs.find((c) => c.service_id === svc.id);
        return { ...svc, status: conf?.status || null };
      });
  }, [services, todayConfs]);

  // -- Upcoming billing dates (monthly services) -----------------------------
  const upcomingBillings = useMemo(() => {
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return services
      .filter((s) => s.type === "monthly")
      .map((s) => {
        const bd = s.billing_day || 1;
        let daysUntil = bd - today;
        if (daysUntil < 0) daysUntil += daysInMonth;
        const billingDate = `${currentMonth}-${String(bd).padStart(2, "0")}`;
        const isPaid = monthConfs.some(
          (c) => c.service_id === s.id && c.date === billingDate && c.status === "delivered"
        );
        return { ...s, billingDay: bd, daysUntil, isPaid };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [services, monthConfs, currentMonth]);

  // -- Stacked bar chart — daily spend by service ----------------------------
  const chartData = useMemo(() => {
    const today = new Date().getDate();
    const days = Array.from({ length: today }, (_, i) => {
      const obj = { day: i + 1 };
      services.forEach((s) => { obj[s.name] = 0; });
      return obj;
    });
    for (const conf of monthConfs) {
      if (conf.status !== "delivered") continue;
      const dayIdx = parseInt(conf.date.split("-")[2]) - 1;
      if (dayIdx >= 0 && dayIdx < days.length) {
        const name = conf.service?.name || "Other";
        days[dayIdx][name] = (days[dayIdx][name] || 0) + (conf.custom_amount || conf.service?.price || 0);
      }
    }
    return days;
  }, [monthConfs, services]);

  // -- Service breakdown donut ------------------------------------------------
  const breakdownData = useMemo(() => {
    const byService = {};
    for (const conf of monthConfs) {
      if (conf.status !== "delivered") continue;
      const name = conf.service?.name || "Other";
      if (!byService[name]) {
        byService[name] = { name, value: 0, icon: conf.service?.icon || "package" };
      }
      byService[name].value += conf.custom_amount || conf.service?.price || 0;
    }
    return Object.values(byService)
      .sort((a, b) => b.value - a.value)
      .map((s, i) => ({ ...s, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [monthConfs]);

  // -- Recent activity — last 7 days -----------------------------------------
  const recentActivity = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 6);
    const cutoff = cutoffDate.toISOString().split("T")[0];

    const byDate = {};
    for (const conf of monthConfs) {
      if (conf.date < cutoff) continue;
      if (!byDate[conf.date]) byDate[conf.date] = { delivered: [], skipped: [], total: 0 };
      if (conf.status === "delivered") {
        byDate[conf.date].delivered.push(conf.service?.name || "Unknown");
        byDate[conf.date].total += conf.custom_amount || conf.service?.price || 0;
      } else if (conf.status === "skipped") {
        byDate[conf.date].skipped.push(conf.service?.name || "Unknown");
      }
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        date,
        label: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
        }),
        ...data,
      }));
  }, [monthConfs]);

  const monthLabel = useMemo(() => {
    if (!currentMonth) return "";
    const [y, m] = currentMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonth]);

  const totalSpent = dashStats.totalSpent || 0;
  const deliveryRate = dashStats.deliveryRate || 0;

  const dismissAIReminder = async (goToSettings = false) => {
    setShowAIReminder(false);
    const uid = user?.id;
    if (uid) {
      profileService.updateProfile(uid, { ai_config_reminder_shown: true }).catch(() => {});
    }
    if (goToSettings) router.push("/settings/ai");
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {loading && <AppLoadingScreen key="loading" pageName="Dashboard" pageType="dashboard" />}
      </AnimatePresence>
      <AnimatePresence>
        {showAIReminder && (
          <AIConfigReminderModal
            onSetupNow={() => dismissAIReminder(true)}
            onRemindLater={() => dismissAIReminder(false)}
          />
        )}
      </AnimatePresence>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

        {/* -- Header -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {greeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                {userName || "there"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 shadow-md"
              onClick={() => router.push("/add-service")}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Service
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => router.push("/calendar")}>
              <Calendar className="w-4 h-4 mr-1.5" /> Calendar
            </Button>
          </div>
        </motion.div>

        {/* -- Net Balance Card (shown only when user has provider services) -- */}
        {dashStats.hasProviderServices && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-2xl border shadow-sm p-5 ${
              dashStats.netBalance >= 0
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${dashStats.netBalance >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                  {dashStats.netBalance >= 0
                    ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                    : <TrendingDown className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Net Balance — {monthLabel}</p>
                  <p className={`text-2xl font-bold ${dashStats.netBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {dashStats.netBalance >= 0 ? "+" : ""}
                    ₹{Math.abs(dashStats.netBalance).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    <span className="text-sm font-medium ml-2 opacity-70">
                      {dashStats.netBalance >= 0 ? "net income" : "net expense"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Income</p>
                    <p className="font-bold text-gray-900">
                      ₹{dashStats.providerIncome.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="font-bold text-gray-900">
                      ₹{dashStats.consumerSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* -- 4 Stat Cards -------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: monthLabel + " Spend", value: `₹${totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
              sub: `${dashStats.delivered || 0} delivered`, icon: IndianRupee,
              grad: "from-orange-400 to-red-500", delay: 0.1,
            },
            {
              label: "Delivery Rate", value: `${deliveryRate}%`,
              sub: `${dashStats.totalConfirmations || 0} tracked`, icon: TrendingUp,
              grad: "from-green-400 to-emerald-500", delay: 0.15,
            },
            {
              label: "Active Services", value: String(dashStats.activeServicesCount || 0),
              sub: "tracking now", icon: Zap,
              grad: "from-blue-400 to-indigo-500", delay: 0.2,
            },
            {
              label: "Skipped", value: String(dashStats.skipped || 0),
              sub: "this month", icon: XCircle,
              grad: "from-rose-400 to-pink-500", delay: 0.25,
            },
          ].map(({ label, value, sub, icon: Icon, grad, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.35 }}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
                <div className={`bg-gradient-to-br ${grad} p-2 rounded-xl shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* -- Row 1: Today's Services + Upcoming Billing -------------------- */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Today's Services — status display + arrow to service calendar */}
          <BentoCard className="lg:col-span-2 p-6" delay={0.3}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900">Today's Services</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <WithTooltip tip="Go to the full calendar view" side="left">
                <Button
                  size="sm" variant="ghost"
                  className="text-primary text-xs h-8 hover:bg-primary/5"
                  onClick={() => router.push("/calendar")}
                >
                  Open Calendar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </WithTooltip>
            </div>

            {todayServices.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No services scheduled today</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayServices.map((svc) => {
                  const { status } = svc;
                  return (
                    <div
                      key={svc.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        status === "delivered"
                          ? "bg-green-50 border-green-200"
                          : status === "skipped"
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <SvcIcon iconName={svc.icon} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{svc.name}</p>
                        <p className="text-xs text-gray-400">
                          {svc.schedule || svc.type} · ₹{(svc.price || 0).toLocaleString("en-IN")}
                          {svc.type === "monthly" && (
                            <span className="ml-1.5 text-indigo-500 font-semibold">billing day</span>
                          )}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                        status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : status === "skipped"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {status === "delivered" ? "✓ Delivered" : status === "skipped" ? "✗ Skipped" : "○ Pending"}
                      </span>
                      {/* Arrow ? individual service calendar */}
                      <WithTooltip tip={`Open ${svc.name} service calendar`} side="left">
                        <button
                          onClick={() => router.push(`/services/${svc.id}/calendar`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 transition-all flex-shrink-0 !h-9 !min-h-9 !px-3 !py-0"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold leading-none">Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </WithTooltip>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoCard>

          {/* Upcoming Billing */}
          <BentoCard className="p-6" delay={0.35}>
            <div className="flex items-center gap-2 mb-5">
              <CalendarClock className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-gray-900">Upcoming Billing</h2>
            </div>

            {upcomingBillings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No monthly services</p>
                <p className="text-xs mt-1 text-gray-300">Add a monthly service to track billing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBillings.map((svc) => (
                  <div
                    key={svc.id}
                    className={`p-3 rounded-xl border ${
                      svc.isPaid
                        ? "bg-green-50 border-green-200"
                        : svc.daysUntil <= 3
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <SvcIcon iconName={svc.icon} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{svc.name}</p>
                        <p className="text-xs text-gray-400">
                          ₹{(svc.price || 0).toLocaleString("en-IN")} · day {svc.billingDay}
                        </p>
                      </div>
                    </div>
                    {svc.isPaid ? (
                      <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid this month
                      </span>
                    ) : svc.daysUntil === 0 ? (
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due today!
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Due in <strong className="text-gray-700">{svc.daysUntil} day{svc.daysUntil !== 1 ? "s" : ""}</strong>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>

        {/* -- Row 2: Spending Chart + Service Breakdown ---------------------- */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Daily Spending Chart — stacked by service */}
          <BentoCard className="p-6" delay={0.4}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Daily Spend</h2>
                <p className="text-xs text-gray-400 mt-0.5">{monthLabel} · stacked by service</p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end max-w-[180px]">
                {services.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-[10px] text-gray-500 truncate max-w-[55px]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-gray-300">
                <BarChart3 className="w-12 h-12" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                  barSize={chartData.length > 20 ? 5 : 9}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 7) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : v > 0 ? `₹${v}` : ""
                    }
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)", radius: 4 }} />
                  {services.map((s, i) => (
                    <Bar
                      key={s.id}
                      dataKey={s.name}
                      stackId="a"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={i === services.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </BentoCard>

          {/* Service Breakdown Donut */}
          <BentoCard className="p-6" delay={0.45}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Service Breakdown</h2>
                <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
              </div>
              <p className="text-sm font-bold text-gray-700">
                ₹{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>

            {breakdownData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-gray-300">
                <BarChart3 className="w-12 h-12" />
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={breakdownData}
                      cx={56}
                      cy={56}
                      innerRadius={32}
                      outerRadius={54}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="white"
                    >
                      {breakdownData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<PieTooltip />}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {breakdownData.map((svc) => {
                    const pct = totalSpent > 0 ? Math.round((svc.value / totalSpent) * 100) : 0;
                    return (
                      <div key={svc.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: svc.color }}
                            />
                            <p className="text-xs font-medium text-gray-700 truncate">{svc.name}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className="text-[10px] text-gray-400">{pct}%</span>
                            <p className="text-xs font-bold text-gray-900">
                              ₹{svc.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-1 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: svc.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </BentoCard>
        </div>

        {/* -- Recent Activity ------------------------------------------------ */}
        <BentoCard className="p-6" delay={0.5}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Recent Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            <WithTooltip tip="View full activity history" side="left">
              <Button
                size="sm" variant="ghost"
                className="text-primary text-xs h-8 hover:bg-primary/5"
                onClick={() => router.push("/calendar")}
              >
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </WithTooltip>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-25" />
              <p className="text-sm">No activity in the last 7 days</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {recentActivity.map((day) => (
                <div
                  key={day.date}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 mb-2">
                    <p className="text-xs font-semibold text-gray-600">{day.label}</p>
                    {day.total > 0 && (
                      <p className="text-sm font-bold text-gray-900">
                        ₹{day.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                  {day.delivered.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {day.delivered.map((name) => (
                        <span
                          key={name}
                          className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium truncate max-w-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {day.skipped.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {day.skipped.map((name) => (
                        <span
                          key={name}
                          className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-medium truncate max-w-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        {/* -- Quick Actions -------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Calendar, label: "Calendar", sub: "Mark daily services", tip: "Mark today's service deliveries", path: "/calendar", grad: "from-blue-500 to-indigo-500", delay: 0.55 },
            { icon: BarChart3, label: "Analytics", sub: "Spending patterns", tip: "View detailed spending analytics", path: "/analytics", grad: "from-purple-500 to-pink-500", delay: 0.6 },
            { icon: FileText, label: "Generate Bill", sub: "AI-powered invoice", tip: "Generate an AI-powered bill invoice", path: "/bills", grad: "from-green-500 to-emerald-500", delay: 0.65 },
          ].map(({ icon: Icon, label, sub, tip, path, grad, delay }) => (
            <WithTooltip key={label} tip={tip} side="top">
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.35 }}
                onClick={() => router.push(path)}
                className="w-full bg-white rounded-2xl border border-gray-200/60 shadow-sm !h-auto !min-h-[108px] !px-5 !py-4 hover:shadow-md transition-all hover:-translate-y-0.5 text-left group flex items-center gap-4 sm:flex-col sm:items-start"
              >
                <div className={`bg-gradient-to-br ${grad} p-3 rounded-xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </motion.button>
            </WithTooltip>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
