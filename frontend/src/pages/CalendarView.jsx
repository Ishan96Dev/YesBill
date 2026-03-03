// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertCircle,
  Clock,
  Coffee,
  Newspaper,
  Car,
  Utensils,
  Package,
  ExternalLink,
  Bike,
  Home,
  Dumbbell,
  Wifi,
  Shirt,
  Droplets,
  Wallet,
  Briefcase,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { WithTooltip } from "../components/ui/tooltip";
import AppLayout from "../components/layout/AppLayout";
import AppLoadingScreen from "../components/loading/AppLoadingScreen";
import CalendarSkeleton from "../components/skeletons/CalendarSkeleton";
import { useToast } from "../components/ui/toaster-custom";
import { usePageReady } from "../hooks/usePageReady";
import { useUser } from "../hooks/useUser";
import { useTimezone } from "../hooks/useTimezone";
import { calendarService, servicesService } from "../services/dataService";
import { generatedBillsAPI } from "../services/api";
import MultiServiceDayCell from "../components/MultiServiceDayCell";
import DayServicesModal from "../components/DayServicesModal";

export default function CalendarView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useUser();
  const { isToday: isTodayInTz } = useTimezone();
  const pageReady = usePageReady(1500, !authLoading);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Services with month stats
  const [servicesData, setServicesData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Calendar view state
  const [allServices, setAllServices] = useState([]);
  const [monthConfirmations, setMonthConfirmations] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Paid bills index: { [serviceId]: { is_paid, paid_at, bill_id, payment_method } }
  const [paidBillsIndex, setPaidBillsIndex] = useState({});

  // Role tab: 'consumer' | 'provider'
  const [roleTab, setRoleTab] = useState('consumer');

  // Get currency symbol from user profile
  const currencySymbol = useMemo(() => {
    return profile?.currency_code || '₹';
  }, [profile]);

  // Filtered by current role tab
  const filteredServicesData = useMemo(
    () => servicesData.filter(s => s.service_role === roleTab),
    [servicesData, roleTab]
  );
  const filteredAllServices = useMemo(
    () => allServices.filter(s => s.service_role === roleTab),
    [allServices, roleTab]
  );

  // Icon mapping
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
  };

  // Load services summary and calendar data for current month
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        // Use the new refreshCalendarData method for consistent data loading
        const [calendarData, billsRes] = await Promise.all([
          calendarService.refreshCalendarData(yearMonth),
          generatedBillsAPI.listForMonth(yearMonth).catch(() => ({ data: [] })),
        ]);

        if (!cancelled) {
          setServicesData(calendarData.summary);
          setAllServices(calendarData.services);
          setMonthConfirmations(calendarData.indexed);

          // Build paid bills index: serviceId → paid status
          const index = {};
          (billsRes.data || []).forEach(bill => {
            (bill.service_ids || []).forEach(svcId => {
              if (!index[svcId] || bill.is_paid) {
                index[svcId] = {
                  is_paid: bill.is_paid,
                  paid_at: bill.paid_at,
                  bill_id: bill.id,
                  payment_method: bill.payment_method,
                };
              }
            });
          });
          setPaidBillsIndex(index);
        }
      } catch (err) {
        console.error('Calendar load error:', err);
        if (toast) {
          toast({ title: 'Error', description: 'Could not load calendar data', type: 'error' });
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    setDataLoading(true);
    load();
    return () => { cancelled = true; };
  }, [user, currentDate, toast]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on-track':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <Check className="w-3 h-3" /> On Track
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" /> Some Missed
          </span>
        );
      case 'behind':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <X className="w-3 h-3" /> Many Missed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3" /> No Data
          </span>
        );
    }
  };

  const getMonthTotal = () => {
    return filteredServicesData.reduce((sum, s) => sum + (s.monthTotal || 0), 0);
  };

  // Calendar helpers
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isToday = (day) => isTodayInTz(year, month, day);

  // Returns true if a service should appear on a given calendar day.
  // home_delivery / visit_based  → follow frequency (daily every day, weekly every 7, monthly/yearly on billing date)
  // utility / subscription / payment → only on billing_day (non-delivery: bill date only)
  const isServiceActiveOnDay = (service, dayNum, monthIdx) => {
    const isDeliveryBased = ['home_delivery', 'visit_based'].includes(service.delivery_type);
    if (!isDeliveryBased) {
      if (service.type === 'yearly') {
        return monthIdx === (service.billing_month || 1) - 1 && dayNum === (service.billing_day || 1);
      }
      return dayNum === (service.billing_day || 1);
    }
    if (service.type === 'daily') return true;
    if (service.type === 'weekly') {
      const start = service.billing_day || 1;
      return dayNum >= start && (dayNum - start) % 7 === 0;
    }
    if (service.type === 'monthly') return dayNum === (service.billing_day || 1);
    if (service.type === 'yearly') {
      return monthIdx === (service.billing_month || 1) - 1 && dayNum === (service.billing_day || 1);
    }
    return false;
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  // Handle service status toggle from modal
  const handleToggleService = async (serviceId, dateKey, newStatus) => {
    try {
      // Update in Supabase
      const conf = await calendarService.upsertConfirmation(serviceId, dateKey, newStatus);

      // Refresh all calendar data to ensure sync
      const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const calendarData = await calendarService.refreshCalendarData(yearMonth);

      // Update all related state
      setMonthConfirmations(calendarData.indexed);
      setServicesData(calendarData.summary);
      setAllServices(calendarData.services);

      // Determine toast message and type based on status
      let title, toastType;
      if (newStatus === 'delivered') {
        title = '✓ Delivered';
        toastType = 'success';
      } else if (newStatus === 'skipped') {
        title = '✗ Skipped';
        toastType = 'error';
      } else {
        title = '⚪ Not Tracked';
        toastType = 'default';
      }

      toast({
        title,
        description: `Service marked as ${newStatus === 'pending' ? 'not tracked' : newStatus}`,
        type: toastType
      });
    } catch (err) {
      console.error('Update error:', err);
      toast({ title: 'Error', description: 'Could not update service', type: 'error' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {(!pageReady || dataLoading) && <AppLoadingScreen key="loading" pageName="Calendar" pageType="calendar" />}
      </AnimatePresence>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Service{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                  Calendar
                </span>
              </h1>
              <p className="text-gray-500 text-lg">
                Track each service individually • Click a service to view its calendar
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-200/50 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">
                {roleTab === 'provider' ? 'Month Income' : 'Month Expenses'}
              </p>
              <p className={`text-3xl font-bold text-transparent bg-clip-text ${
                roleTab === 'provider'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  : 'bg-gradient-to-r from-primary to-indigo-600'
              }`}>
                {currencySymbol}{getMonthTotal().toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Month Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/5 border border-gray-200/50 p-4 mb-6 flex items-center justify-between"
        >
          <WithTooltip tip="Previous month" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="hover:bg-gray-100 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </WithTooltip>

          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {monthNames[month]} {year}
          </h2>

          <WithTooltip tip="Next month" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="hover:bg-gray-100 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </WithTooltip>
        </motion.div>

        {/* Role Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-2 mb-6"
        >
          {[
            { value: 'consumer', icon: Wallet, label: 'My Bills 💳' },
            { value: 'provider', icon: Briefcase, label: 'My Income 💰' },
          ].map(({ value, icon: Icon, label }) => {
            const active = roleTab === value;
            const isProv = value === 'provider';
            return (
              <button
                key={value}
                onClick={() => setRoleTab(value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  active
                    ? isProv
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200/50 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </motion.div>

        {/* Full Calendar Grid */}
        {!dataLoading && filteredAllServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8 mb-8"
          >
            {/* Weekday Headers — same grid as calendar so columns align */}
            <div className="grid grid-cols-7 gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(7, minmax(96px, 1fr))' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="flex items-center justify-center text-sm font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid — large square day cells */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, minmax(96px, 1fr))' }}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />;
                }

                const date = new Date(year, month, day);
                const today = isToday(day);

                const servicesForDay = filteredAllServices.filter(service =>
                  isServiceActiveOnDay(service, day, month)
                );

                return (
                  <MultiServiceDayCell
                    key={day}
                    day={day}
                    date={date}
                    services={servicesForDay}
                    confirmations={monthConfirmations}
                    isToday={today}
                    onClick={handleDayClick}
                    paidBillsIndex={paidBillsIndex}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-600">Delivered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-gray-600">Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gray-100"></div>
                <span className="text-gray-600">Not tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md border-2 border-primary bg-primary/5"></div>
                <span className="text-gray-600">Today</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Service Cards Section Header */}
        {!dataLoading && filteredServicesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <h3 className="text-xl font-bold text-gray-900">
              {roleTab === 'provider' ? 'My Income Services' : 'Service Details'}
            </h3>
            <p className="text-gray-500">Click on a service card to view its dedicated calendar</p>
          </motion.div>
        )}

        {/* Services Grid */}
        {dataLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading services...</p>
          </div>
        ) : filteredServicesData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              roleTab === 'provider' ? 'bg-emerald-50' : 'bg-gray-100'
            }`}>
              {roleTab === 'provider'
                ? <Briefcase className="w-10 h-10 text-emerald-300" />
                : <Package className="w-10 h-10 text-gray-400" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {roleTab === 'provider' ? 'No provider services yet' : 'No consumer services yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {roleTab === 'provider'
                ? 'Mark a service as Provider when creating it to track your income here.'
                : 'Add services you pay for to start tracking.'}
            </p>
            <Button onClick={() => navigate('/services')}>
              Go to Services
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredServicesData.map((service) => {
              const ServiceIcon = iconComponents[service.icon] || Package;
              const progressPercent = service.trackedDays > 0
                ? (service.deliveredCount / service.trackedDays) * 100
                : 0;

              return (
                <motion.div
                  key={service.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => navigate(`/services/${service.id}/calendar`)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/20 flex items-center justify-center">
                        <ServiceIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500">{currencySymbol}{service.price}/{service.type}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    {getStatusBadge(service.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {service.trackedDays} of {service.daysInMonth} days tracked
                      </span>
                      <span className="font-semibold text-gray-900">{service.deliveryRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${service.status === 'on-track' ? 'bg-green-500' :
                          service.status === 'warning' ? 'bg-yellow-500' :
                            service.status === 'behind' ? 'bg-red-500' :
                              'bg-gray-300'
                          }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" /> {service.deliveredCount}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <X className="w-4 h-4" /> {service.skippedCount}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Month Total</p>
                      <p className="font-bold text-gray-900">{currencySymbol}{service.monthTotal?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Tip */}
        {servicesData.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-gray-500 text-sm mt-8"
          >
            Click on any date in the calendar to track services, or click a service card for detailed view
          </motion.p>
        )}

        {/* Day Services Modal */}
        <DayServicesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          date={selectedDate || new Date()}
          services={filteredAllServices.filter(service =>
            isServiceActiveOnDay(
              service,
              selectedDate?.getDate() || 0,
              selectedDate?.getMonth() || 0
            )
          )}
          confirmations={monthConfirmations}
          onToggle={handleToggleService}
          currencySymbol={currencySymbol}
          paidBillsIndex={paidBillsIndex}
        />
      </div>
    </AppLayout>
  );
}
