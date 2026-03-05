'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AnimatedStatCard({ title, value, prefix, suffix, trend, icon: Icon, delay = 0 }) {
  const motionValue = useSpring(0, {
    damping: 100,
    stiffness: 100,
  });

  const displayValue = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      delay,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, motionValue, delay]);

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full cursor-pointer bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                "bg-gradient-to-br from-indigo-500 to-purple-600",
                "shadow-lg shadow-indigo-500/30"
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
              </div>
            </div>
            {trend !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                  isPositive && "bg-green-50 text-green-600",
                  isNegative && "bg-red-50 text-red-600",
                  !isPositive && !isNegative && "bg-gray-50 text-gray-600"
                )}
              >
                {isPositive ? (
                  <ArrowUp className="w-3 h-3" />
                ) : isNegative ? (
                  <ArrowDown className="w-3 h-3" />
                ) : null}
                {Math.abs(trend)}%
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {prefix && (
              <span className="text-2xl font-bold text-gray-900">{prefix}</span>
            )}
            <motion.span className="text-4xl font-bold text-gray-900">
              {displayValue}
            </motion.span>
            {suffix && (
              <span className="text-xl font-semibold text-gray-500">{suffix}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MonthlyStats({ summary }) {
  if (!summary) return null;

  const yesCount = summary.yes_count || 0;
  const totalDays = summary.total_days || 30;
  const totalAmount = summary.total_amount || 0;
  const completionRate = totalDays > 0 ? Math.round((yesCount / totalDays) * 100) : 0;

  // Mock trend calculation (you'd calculate this from previous month data)
  const trends = {
    yesCount: 12,
    totalAmount: 8,
    completionRate: 5,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <AnimatedStatCard
        title="Days Completed"
        value={yesCount}
        suffix={`/ ${totalDays}`}
        trend={trends.yesCount}
        icon={Calendar}
        delay={0}
      />
      <AnimatedStatCard
        title="Total Earnings"
        value={totalAmount}
        prefix="$"
        trend={trends.totalAmount}
        icon={DollarSign}
        delay={0.1}
      />
      <AnimatedStatCard
        title="Completion Rate"
        value={completionRate}
        suffix="%"
        trend={trends.completionRate}
        icon={TrendingUp}
        delay={0.2}
      />
    </div>
  );
}

export function ProgressBar({ value, max, label }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {value} / {max}
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Progress</span>
        <span className="text-xs font-semibold text-indigo-600">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
