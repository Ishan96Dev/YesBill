// @ts-nocheck
'use client'
import { useRouter, useParams } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    X,
    ArrowLeft,
    Coffee,
    Newspaper,
    Car,
    Utensils,
    Package,
    Bike,
    Home,
    Dumbbell,
    Wifi,
    Shirt,
    Droplets,
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
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    Clock,
    ExternalLink,
    Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { useToast } from "@/components/ui/toaster-custom";
import { usePageReady } from "@/hooks/usePageReady";
import { useUser } from "@/hooks/useUser";
import { useTimezone } from "@/hooks/useTimezone";
import { servicesService, calendarService } from "@/services/dataService";
import { generatedBillsAPI } from "@/services/api";

export default function ServiceCalendarPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, profile, loading: authLoading } = useUser();
    const { isToday: isTodayInTz } = useTimezone();
    const pageReady = usePageReady(0, !authLoading);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [service, setService] = useState(null);
    const [confirmations, setConfirmations] = useState({});
    const [dataLoading, setDataLoading] = useState(true);
    const [paidBillInfo, setPaidBillInfo] = useState(null);
    const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');
    const [yearRangeStart, setYearRangeStart] = useState(() => new Date().getFullYear() - 5);

    const currencySymbol = useMemo(() => {
        return profile?.currency_code || "?";
    }, [profile]);

    const iconComponents = {
        coffee: Coffee,
        newspaper: Newspaper,
        car: Car,
        utensils: Utensils,
        package: Package,
        bike: Bike,
        home: Home,
        dumbbell: Dumbbell,
        wifi: Wifi,
        shirt: Shirt,
        droplets: Droplets,
        zap: Zap,
        flame: Flame,
        tv: Tv,
        phone: Phone,
        "heart-pulse": HeartPulse,
        wrench: Wrench,
        music: Music,
        "book-open": BookOpen,
        bus: Bus,
        "credit-card": CreditCard,
        banknote: Banknote,
        "building-2": Building2,
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Load service + confirmations
    useEffect(() => {
        if (!user || !serviceId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const allServices = await servicesService.getAll();
                if (cancelled) return;

                const svc = allServices.find((s) => s.id === serviceId);
                if (!svc) {
                    toast({ title: "Error", description: "Service not found", type: "error" });
                    router.push("/services");
                    return;
                }
                setService(svc);

                const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
                let indexed;
                if (svc.type === "yearly") {
                    indexed = await calendarService.getYearIndexed(year, serviceId);
                } else {
                    indexed = await calendarService.getMonthIndexed(yearMonth, serviceId);
                }

                // Fetch paid bill info for billing/visit-based services
                let billInfo = null;
                if (['utility', 'subscription', 'payment', 'visit_based'].includes(svc.delivery_type)) {
                    try {
                        const { data: bills } = await generatedBillsAPI.listForMonth(yearMonth);
                        billInfo = (bills || []).find(b => (b.service_ids || []).includes(serviceId)) || null;
                    } catch { /* not critical */ }
                }

                if (!cancelled) {
                    setConfirmations(indexed);
                    setPaidBillInfo(billInfo);
                }
            } catch (err) {
                console.error("Service calendar load error:", err);
                toast({ title: "Error", description: "Could not load calendar", type: "error" });
            } finally {
                if (!cancelled) setDataLoading(false);
            }
        };

        setDataLoading(true);
        load();
        return () => { cancelled = true; };
    }, [user, serviceId, currentDate, toast]);

    if (!service) return null;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const ServiceIcon = iconComponents[service.icon] || Package;

    // --- Reload helpers -------------------------------------------
    const reloadConfirmations = async () => {
        if (service.type === "yearly") {
            return calendarService.getYearIndexed(year, serviceId);
        }
        const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
        return calendarService.getMonthIndexed(yearMonth, serviceId);
    };

    const handlePrevMonth = () => { setCurrentDate(new Date(year, month - 1)); setPickerMode('days'); };
    const handleNextMonth = () => { setCurrentDate(new Date(year, month + 1)); setPickerMode('days'); };

    // --- Day calendar (daily / weekly / monthly) ------------------
    const formatDate = (day) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const handleDayClick = async (day) => {
        const dateKey = formatDate(day);
        const current = confirmations[dateKey];

        let newStatus;
        if (!current || current.status === "pending") {
            newStatus = "delivered";
        } else if (current.status === "delivered") {
            newStatus = "skipped";
        } else {
            newStatus = "pending";
        }

        try {
            await calendarService.upsertConfirmation(serviceId, dateKey, newStatus);
            const updated = await reloadConfirmations();
            setConfirmations(updated);
            const isVisit = service.delivery_type === "visit_based";
            const labels = isVisit
                ? { delivered: "✓ Visited", skipped: "✗ Missed", pending: "⚪ Not Tracked" }
                : { delivered: "✓ Delivered", skipped: "✗ Skipped", pending: "⚪ Not Tracked" };
            toast({ title: labels[newStatus], description: `${service.name} updated`, type: newStatus === "delivered" ? "success" : newStatus === "skipped" ? "error" : "default" });
        } catch (err) {
            console.error("Update error:", err);
            toast({ title: "Error", description: "Could not update", type: "error" });
        }
    };

    // --- Monthly stats (for day view) -----------------------------
    const getDayStats = () => {
        let total = 0, delivered = 0, skipped = 0;
        Object.values(confirmations).forEach((conf) => {
            if (conf.status === "delivered") { total += conf.custom_amount || service.price || 0; delivered++; }
            else if (conf.status === "skipped") skipped++;
        });
        // Monthly services are billed exactly once — cap at service price
        if (service.type === "monthly") {
            total = Math.min(total, service.price || 0);
        }
        return { total, delivered, skipped };
    };

    // --- Utility: toggle month active -----------------------------
    const billingDay = String(service.billing_day || 1).padStart(2, "0");
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}-${billingDay}`;
    const isUtilityActive = !!confirmations[monthKey] && confirmations[monthKey].status === "delivered";

    const handleUtilityToggle = async () => {
        const newStatus = isUtilityActive ? "pending" : "delivered";
        try {
            await calendarService.upsertConfirmation(serviceId, monthKey, newStatus);
            const updated = await reloadConfirmations();
            setConfirmations(updated);
            toast({ title: newStatus === "delivered" ? "Marked Active" : "Marked Inactive", description: `${service.name} for ${monthNames[month]}`, type: newStatus === "delivered" ? "success" : "default" });
        } catch (err) {
            toast({ title: "Error", description: "Could not update", type: "error" });
        }
    };

    // --- Yearly: toggle month paid --------------------------------
    const getYearlyMonthKey = (m) =>
        `${year}-${String(m + 1).padStart(2, "0")}-${billingDay}`;

    const handleYearlyMonthClick = async (m) => {
        const dateKey = getYearlyMonthKey(m);
        const current = confirmations[dateKey];
        const newStatus = (!current || current.status === "pending") ? "delivered" : "pending";
        try {
            await calendarService.upsertConfirmation(serviceId, dateKey, newStatus);
            const updated = await reloadConfirmations();
            setConfirmations(updated);
            toast({ title: newStatus === "delivered" ? "✓ Paid" : "⚪ Unpaid", description: `${shortMonthNames[m]} ${year}`, type: newStatus === "delivered" ? "success" : "default" });
        } catch (err) {
            toast({ title: "Error", description: "Could not update", type: "error" });
        }
    };

    // --- Calendar grid build --------------------------------------
    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
    };
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
    const isToday = (day) => isTodayInTz(year, month, day);

    const isYearly = service.type === "yearly";
    // Utility/subscription/payment "special views" only make sense for monthly-billed services.
    // Daily and weekly services must always show the day-grid calendar so individual deliveries
    // can be tracked (e.g. a weekly laundry should NOT show the single monthly toggle).
    const isMonthlyBased = service.type === "monthly";
    const isUtility = service.delivery_type === "utility" && isMonthlyBased;
    const isBillingFixed = ['subscription', 'payment'].includes(service.delivery_type) && isMonthlyBased;
    const isVisitBased = service.delivery_type === "visit_based";
    const isBillingOnly = isUtility || isBillingFixed; // kept for stats block compat

    const stats = getDayStats();
    const yearlyPaidCount = isYearly ? Array.from({ length: 12 }, (_, m) => {
        const k = getYearlyMonthKey(m);
        return confirmations[k]?.status === "delivered";
    }).filter(Boolean).length : 0;

    return (
        <AppLayout>
            <AnimatePresence>
                {(!pageReady || dataLoading) && <AppLoadingScreen key="loading" pageName="Calendar" pageType="calendar" />}
            </AnimatePresence>
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    {/* Back Buttons */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push("/services")}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Services</span>
                        </button>
                        <button
                            onClick={() => router.push("/calendar")}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <span>Back to Overview</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/20 flex items-center justify-center">
                                <ServiceIcon className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {service.name}{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                                        Calendar
                                    </span>
                                </h1>
                                <p className="text-gray-500">
                                    {currencySymbol}{service.price} per {service.type}
                                    {!isYearly && ` • ${service.schedule}`}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4">
                            {isYearly ? (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50 shadow-lg text-center">
                                    <p className="text-sm text-gray-500">Paid Months</p>
                                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                        {yearlyPaidCount} / 12
                                    </p>
                                </div>
                            ) : isBillingFixed ? (
                                <>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50 shadow-lg text-center">
                                        <p className="text-sm text-gray-500">Billing Day</p>
                                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                            {service.billing_day || 1}
                                        </p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50 shadow-lg text-center">
                                        <p className="text-sm text-gray-500">Monthly Amount</p>
                                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                            {currencySymbol}{Number(service.price || 0).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50 shadow-lg text-center">
                                        <p className="text-sm text-gray-500">{isVisitBased ? "Monthly Fee" : "Month Total"}</p>
                                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                            {isVisitBased
                                                ? `${currencySymbol}${Number(service.price || 0).toLocaleString("en-IN")}`
                                                : `${currencySymbol}${stats.total.toFixed(2)}`}
                                        </p>
                                    </div>
                                    {!isUtility && (
                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50 shadow-lg">
                                            <p className="text-sm text-gray-500 mb-1">{isVisitBased ? "Attendance" : "Status"}</p>
                                            <div className="flex gap-3 text-sm font-medium">
                                                <span className="text-green-600">✓ {stats.delivered} {isVisitBased ? "visited" : ""}</span>
                                                <span className="text-red-600">✗ {stats.skipped} {isVisitBased ? "missed" : ""}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* -- Month / Year Navigation Bar (non-yearly services only) -- */}
                {!isYearly && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/5 border border-gray-200/50 p-4 mb-6"
                    >
                        {pickerMode === 'days' ? (
                            <div className="flex items-center justify-between">
                                <WithTooltip tip="Previous month" side="bottom">
                                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="hover:bg-gray-100 rounded-xl">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                </WithTooltip>
                                <button
                                    onClick={() => { setYearRangeStart(year - 5); setPickerMode('months'); }}
                                    className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-primary transition-colors px-3 py-1 rounded-xl hover:bg-gray-50 group"
                                >
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                    {monthNames[month]} {year}
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                </button>
                                <WithTooltip tip="Next month" side="bottom">
                                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-gray-100 rounded-xl">
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </WithTooltip>
                            </div>
                        ) : pickerMode === 'months' ? (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setPickerMode('years')}
                                        className="flex items-center gap-1 text-lg font-bold text-gray-900 hover:text-primary px-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {year}
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setPickerMode('days')}
                                        className="text-sm text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {monthNames.map((name, idx) => (
                                        <button
                                            key={name}
                                            onClick={() => { setCurrentDate(new Date(year, idx)); setPickerMode('days'); }}
                                            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                                                idx === month
                                                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {name.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-gray-900 px-2">Select Year</span>
                                    <button
                                        onClick={() => setPickerMode('months')}
                                        className="text-sm text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Button variant="ghost" size="icon" onClick={() => setYearRangeStart(s => s - 12)} className="hover:bg-gray-100 rounded-xl h-8 w-8">
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-gray-500 flex-1 text-center">{yearRangeStart} – {yearRangeStart + 11}</span>
                                    <Button variant="ghost" size="icon" onClick={() => setYearRangeStart(s => s + 12)} className="hover:bg-gray-100 rounded-xl h-8 w-8">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(y => (
                                        <button
                                            key={y}
                                            onClick={() => { setCurrentDate(new Date(y, month)); setPickerMode('months'); }}
                                            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                                                y === year
                                                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* -- Yearly: 12-month grid -- */}
                {isYearly && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8"
                    >
                        {/* Year Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <WithTooltip tip="Previous year" side="bottom">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year - 1, 0, 1))} className="hover:bg-gray-100 rounded-xl">
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            </WithTooltip>
                            <h2 className="text-2xl font-bold text-gray-900">{year}</h2>
                            <WithTooltip tip="Next year" side="bottom">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year + 1, 0, 1))} className="hover:bg-gray-100 rounded-xl">
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </WithTooltip>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {Array.from({ length: 12 }, (_, m) => {
                                const dateKey = getYearlyMonthKey(m);
                                const conf = confirmations[dateKey];
                                const paid = conf?.status === "delivered";
                                const isCurrentMonth = m === new Date().getMonth() && year === new Date().getFullYear();
                                return (
                                    <motion.button
                                        key={m}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => handleYearlyMonthClick(m)}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            paid
                                                ? "border-green-300 bg-green-50"
                                                : isCurrentMonth
                                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                    >
                                        <span className={`text-sm font-bold ${paid ? "text-green-700" : isCurrentMonth ? "text-primary" : "text-gray-700"}`}>
                                            {shortMonthNames[m]}
                                        </span>
                                        {paid ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        <p className="text-center text-gray-500 text-sm mt-6">
                            Click a month to toggle <span className="font-medium text-green-600">✓ Paid</span> / <span className="font-medium text-gray-400">— Unpaid</span>
                        </p>
                    </motion.div>
                )}

                {/* -- Utility: single monthly toggle -- */}
                {!isYearly && isUtility && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all ${isUtilityActive ? "bg-green-50 border-2 border-green-300" : "bg-gray-50 border-2 border-gray-200"}`}>
                                <ServiceIcon className={`w-14 h-14 ${isUtilityActive ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                            <div className="text-center">
                                <p className={`text-xl font-bold ${isUtilityActive ? "text-green-700" : "text-gray-500"}`}>
                                    {isUtilityActive ? "Service Active This Month" : "Not Marked Active"}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {isUtilityActive ? `${currencySymbol}${service.price} will be counted in bill` : "Mark as active to include in bill"}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleUtilityToggle}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg ${
                                    isUtilityActive
                                        ? "bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 shadow-red-100"
                                        : "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-primary/20"
                                }`}
                            >
                                {isUtilityActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                {isUtilityActive ? "Mark as Inactive" : "Mark as Active"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* -- Subscription / Payment: billing info card -- */}
                {!isYearly && isBillingFixed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8"
                    >
                        <div className="flex flex-col items-center gap-6">
                            {/* Billing info */}
                            <div className="w-full max-w-sm bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 text-center">
                                <p className="text-sm text-indigo-500 font-medium mb-1">Fixed monthly charge</p>
                                <p className="text-3xl font-bold text-indigo-700 mb-2">
                                    {currencySymbol}{Number(service.price || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="text-sm text-indigo-500">Billed on day <span className="font-bold text-indigo-700">{service.billing_day || 1}</span> every month</p>
                            </div>

                            {/* Payment status from Bills */}
                            <div className="w-full max-w-sm">
                                <p className="text-sm font-semibold text-gray-500 mb-3 text-center">This Month's Bill Status</p>
                                {paidBillInfo?.is_paid ? (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex flex-col items-center gap-2">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                        <p className="font-bold text-green-700">Paid</p>
                                        {paidBillInfo.paid_at && (
                                            <p className="text-sm text-green-600">
                                                {new Date(paidBillInfo.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        )}
                                        {paidBillInfo.payment_method && (
                                            <span className="px-2.5 py-1 bg-green-100 rounded-full text-xs font-medium text-green-700 capitalize">
                                                {paidBillInfo.payment_method.replace("_", " ")}
                                            </span>
                                        )}
                                    </div>
                                ) : paidBillInfo && !paidBillInfo.is_paid ? (
                                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col items-center gap-2">
                                        <Clock className="w-8 h-8 text-amber-600" />
                                        <p className="font-bold text-amber-700">Bill Generated — Not Yet Paid</p>
                                        <p className="text-sm text-amber-600">Go to Bills page to mark as paid</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                            <span className="text-gray-400 text-lg">—</span>
                                        </div>
                                        <p className="font-medium text-gray-500">No bill generated yet</p>
                                        <p className="text-sm text-gray-400">Bills are generated on day {service.billing_day || 1}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push("/bills")}
                                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Go to Bills
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* -- Visit-based: monthly fee card at top -- */}
                {!isYearly && isVisitBased && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-black/5 border border-gray-200/50 p-5 mb-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Monthly Fee</p>
                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                    {currencySymbol}{Number(service.price || 0).toLocaleString("en-IN")}<span className="text-gray-400 text-base">/month</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {paidBillInfo?.is_paid ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        Bill Paid
                                    </span>
                                ) : paidBillInfo ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold">
                                        <Clock className="w-4 h-4" />
                                        Bill Unpaid
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                                        No bill yet
                                    </span>
                                )}
                                <button
                                    onClick={() => router.push("/bills")}
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Bills
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* -- Standard day-grid calendar -- */}
                {!isYearly && !isBillingOnly && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8"
                    >
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-2 mb-4 justify-items-center">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="w-10 text-center text-sm font-semibold text-gray-500 py-2">{d}</div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2 justify-items-center">
                            {calendarDays.map((day, index) => {
                                if (!day) return <div key={`empty-${index}`} />;
                                const dateKey = formatDate(day);
                                const conf = confirmations[dateKey];
                                const status = conf?.status;
                                const today = isToday(day);
                                // Monthly: only billing_day is interactive.
                                // Weekly: only days that are 7-day intervals from billing_day (e.g. 5, 12, 19, 26).
                                const isMonthly = service.type === "monthly";
                                const isWeekly = service.type === "weekly";
                                const startDay = service.billing_day || 1;
                                const isBillingDay = isMonthly && day === startDay;
                                const isWeeklyDay = isWeekly && day >= startDay && (day - startDay) % 7 === 0;
                                const isDisabled = (isMonthly && !isBillingDay) || (isWeekly && !isWeeklyDay);
                                // Today must always be visually highlighted even if it's not a tracking day.
                                // Separate "dim & lock" from "interaction block" so the two are independent.
                                const isLockedVisually = isDisabled && !today;
                                return (
                                    <motion.button
                                        key={day}
                                        whileHover={isDisabled ? {} : { scale: 1.08 }}
                                        whileTap={isDisabled ? {} : { scale: 0.95 }}
                                        onClick={isDisabled ? undefined : () => handleDayClick(day)}
                                        disabled={isDisabled}
                                        className={`relative w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                                            isLockedVisually
                                                ? "border-gray-100 bg-gray-50 opacity-25 cursor-not-allowed"
                                                : today
                                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                                                    : isBillingDay && !status
                                                        ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 shadow-md shadow-indigo-100"
                                                        : status === "delivered"
                                                            ? "border-green-300 bg-green-50 hover:border-green-400"
                                                            : status === "skipped"
                                                                ? "border-red-300 bg-red-50 hover:border-red-400"
                                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                    >
                                        <span className={`text-sm font-semibold ${
                                            isLockedVisually ? "text-gray-300"
                                            : status === "delivered" ? "text-green-700"
                                            : status === "skipped" ? "text-red-700"
                                            : (isBillingDay || isWeeklyDay) ? "text-indigo-700"
                                            : "text-gray-900"
                                        }`}>
                                            {day}
                                        </span>
                                        {(status === "delivered" || status === "skipped" || ((today || isBillingDay || isWeeklyDay) && !status && !isLockedVisually)) && (
                                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                                {status === "delivered" && <Check className="w-3.5 h-3.5 text-green-600" />}
                                                {status === "skipped" && <X className="w-3.5 h-3.5 text-red-600" />}
                                                {today && !status && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                {(isBillingDay || isWeeklyDay) && !today && !status && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Legend & tip for day view */}
                {!isYearly && !isBillingOnly && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 flex flex-wrap gap-4 justify-center text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border-2 border-green-300 bg-green-50 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-600">{isVisitBased ? "Visited" : "Delivered"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border-2 border-red-300 bg-red-50 flex items-center justify-center">
                                    <X className="w-4 h-4 text-red-600" />
                                </div>
                                <span className="text-gray-600">{isVisitBased ? "Missed" : "Skipped"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border-2 border-gray-200 bg-white" />
                                <span className="text-gray-600">Not tracked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border-2 border-primary bg-primary/5" />
                                <span className="text-gray-600">Today</span>
                            </div>
                            {service.type === "monthly" && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg border-2 border-indigo-200 bg-indigo-50/50" />
                                    <span className="text-gray-600">{isVisitBased ? "Schedule day" : "Billing day"}</span>
                                </div>
                            )}
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center text-gray-500 text-sm mt-6"
                        >
                            {service.type === "monthly"
                                ? <>Only the <span className="font-medium text-indigo-600">billing day ({service.billing_day || 1})</span> is tracked — click to cycle: <span className="font-medium text-green-600">✓ {isVisitBased ? "Visited" : "Delivered"}</span> → <span className="font-medium text-red-600">✗ {isVisitBased ? "Missed" : "Skipped"}</span> → <span className="font-medium text-gray-400">⚪ Not Tracked</span></>
                                : service.type === "weekly"
                                ? <>Weekly days <span className="font-medium text-indigo-600">(every 7 days from day {service.billing_day || 1})</span> are tracked — click to cycle: <span className="font-medium text-green-600">✓ {isVisitBased ? "Visited" : "Delivered"}</span> → <span className="font-medium text-red-600">✗ {isVisitBased ? "Missed" : "Skipped"}</span> → <span className="font-medium text-gray-400">⚪ Not Tracked</span></>
                                : <>Click on any day to cycle: <span className="font-medium text-green-600">✓ {isVisitBased ? "Visited" : "Delivered"}</span> → <span className="font-medium text-red-600">✗ {isVisitBased ? "Missed" : "Skipped"}</span> → <span className="font-medium text-gray-400">⚪ Not Tracked</span></>
                            }
                        </motion.p>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
