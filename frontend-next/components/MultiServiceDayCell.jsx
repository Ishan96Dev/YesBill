'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { Check, X, Coffee, Newspaper, Car, Utensils, Package, Bike, Home, Dumbbell, Wifi, Shirt, Droplets } from "lucide-react";

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

const BILLING_TYPES = ['utility', 'subscription', 'payment'];

export default function MultiServiceDayCell({ day, date, services, confirmations, isToday, onClick, paidBillsIndex = {} }) {
  if (!day) {
    return <div className="aspect-square" />;
  }

  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayStr = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${dayStr}`;

  // Get service statuses for this day
  const serviceStatuses = services.map(service => {
    const conf = confirmations[`${service.id}-${dateKey}`];
    return {
      service,
      status: conf?.status,
      icon: service.icon,
    };
  });

  // Sort services: prioritize delivered first, then skipped, then untracked
  const sortedServiceStatuses = [...serviceStatuses].sort((a, b) => {
    // Priority levels: delivered = 3, skipped = 2, untracked = 1
    const getPriority = (status) => {
      if (status === 'delivered') return 3;
      if (status === 'skipped') return 2;
      return 1; // untracked or pending
    };

    return getPriority(b.status) - getPriority(a.status);
  });

  // Count statuses
  const deliveredCount = serviceStatuses.filter(s => s.status === 'delivered').length;
  const skippedCount = serviceStatuses.filter(s => s.status === 'skipped').length;
  const trackedCount = deliveredCount + skippedCount;

  // Billing services on this day — show paid/due badge
  const billingServices = services.filter(s => BILLING_TYPES.includes(s.delivery_type));
  const hasBillingService = billingServices.length > 0;
  const isPaid = hasBillingService && billingServices.some(s => paidBillsIndex[s.id]?.is_paid);
  const isUnpaidBillDay = hasBillingService && !isPaid;

  // Show the highest priority service (delivered > skipped > untracked)
  const firstService = sortedServiceStatuses[0];
  const remainingCount = serviceStatuses.length - 1;
  const FirstIcon = firstService
    ? (iconComponents[firstService.service.icon] || Package)
    : null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(date)}
      className={`aspect-square w-full rounded-lg border-2 transition-all p-2 relative overflow-hidden ${isToday
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/20'
          : trackedCount > 0
            ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
    >
      {/* Day number — top-left corner, small and subtle */}
      <div className="absolute top-1.5 left-2 pointer-events-none">
        <span className={`text-base font-bold tabular-nums ${isToday ? 'text-primary' : 'text-gray-900'
          }`}>
          {day}
        </span>
      </div>

      {/* Today indicator dot — below the day number */}
      {isToday && (
        <div className="absolute top-7 left-2.5">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" aria-hidden />
        </div>
      )}

      {/* Billing paid/due badge — top-right */}
      {isPaid && (
        <div className="absolute top-1 right-1 px-1 py-0.5 bg-green-500 rounded text-white text-[9px] font-bold leading-none pointer-events-none">
          ₹✓
        </div>
      )}
      {isUnpaidBillDay && (
        <div className="absolute top-1 right-1 px-1 py-0.5 bg-amber-400 rounded text-white text-[9px] font-bold leading-none pointer-events-none">
          ₹
        </div>
      )}

      {/* Bottom-right corner: first service icon + ✓/✗, then "+N" if more */}
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 pointer-events-none">
        {firstService && FirstIcon ? (
          <>
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${firstService.status === 'delivered'
                  ? 'bg-green-100'
                  : firstService.status === 'skipped'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}
              title={`${firstService.service.name}: ${firstService.status || 'not tracked'}`}
            >
              <FirstIcon
                className={`w-4 h-4 ${firstService.status === 'delivered'
                    ? 'text-green-600'
                    : firstService.status === 'skipped'
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }`}
              />
            </div>
            {(firstService.status === 'delivered' || firstService.status === 'skipped') && (
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${firstService.status === 'delivered' ? 'bg-green-500' : 'bg-red-500'
                  }`}
              >
                {firstService.status === 'delivered' ? (
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                ) : (
                  <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
              </div>
            )}
            {remainingCount > 0 && (
              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                +{remainingCount}
              </span>
            )}
          </>
        ) : null}
      </div>
    </motion.button>
  );
}
