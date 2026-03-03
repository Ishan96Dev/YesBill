// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyTracker({ records, onToggle, currentMonth, onMonthChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [optimisticRecords, setOptimisticRecords] = useState({});

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  // Get all days in calendar view (including prev/next month days)
  const calendarStart = startOfWeek(firstDayOfMonth);
  const calendarEnd = endOfWeek(lastDayOfMonth);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Merge API records with optimistic updates
  const allRecords = { ...records, ...optimisticRecords };

  const handleToggle = async (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const currentStatus = allRecords[dateStr];
    const newStatus = currentStatus === "YES" ? "NO" : "YES";

    // Optimistic update
    setOptimisticRecords((prev) => ({ ...prev, [dateStr]: newStatus }));
    setSelectedDay(date);

    try {
      await onToggle(date, newStatus);
      // Clear optimistic update on success
      setOptimisticRecords((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticRecords((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      console.error("Failed to toggle:", error);
    }
  };

  const goToPrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onMonthChange(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  // Calculate streak
  const calculateStreak = () => {
    const sortedDates = Object.entries(allRecords)
      .filter(([_, status]) => status === "YES")
      .map(([date]) => new Date(date))
      .sort((a, b) => b - a);

    if (sortedDates.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i]);
      const next = new Date(sortedDates[i + 1]);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-3 shadow-md">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {format(new Date(), "MMM")}
            </span>
            <span className="text-2xl font-bold text-primary">
              {format(new Date(), "d")}
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your daily progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            >
              <span className="text-2xl">🔥</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-600">Streak</span>
                <span className="text-lg font-bold text-green-600">{currentStreak} days</span>
              </div>
            </motion.div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 shadow-sm bg-white">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="text-sm font-medium"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-4">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const status = allRecords[dateStr];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isToday(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <motion.button
                key={dateStr}
                onClick={() => isCurrentMonth && handleToggle(day)}
                disabled={!isCurrentMonth}
                whileHover={isCurrentMonth ? { scale: 1.05, y: -2 } : {}}
                whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
                className={cn(
                  "relative aspect-square rounded-xl p-3 transition-all",
                  "flex flex-col items-center justify-center",
                  "border-2",
                  // Base styles
                  isCurrentMonth
                    ? "cursor-pointer"
                    : "cursor-default opacity-30",
                  // Today highlight
                  isTodayDay && "ring-2 ring-primary ring-offset-2",
                  // Status colors
                  status === "YES" &&
                    "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30",
                  status === "NO" &&
                    "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30",
                  !status && isCurrentMonth && "bg-gray-50 border-gray-200 hover:bg-gray-100",
                  !status && !isCurrentMonth && "bg-gray-50 border-gray-100",
                  // Selected state
                  isSelected && "ring-2 ring-indigo-400"
                )}
              >
                <span
                  className={cn(
                    "text-lg font-semibold",
                    status ? "text-white" : "text-gray-900"
                  )}
                >
                  {format(day, "d")}
                </span>
                {status && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-medium mt-1"
                  >
                    {status}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600" />
            <span className="text-sm text-gray-600">Completed (YES)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500 border-2 border-red-600" />
            <span className="text-sm text-gray-600">Not Done (NO)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-200" />
            <span className="text-sm text-gray-600">Not Marked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
