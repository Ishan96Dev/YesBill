// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";

function Shimmer({ className = "", style }) {
  return (
    <div className={`bg-gray-200/80 rounded-lg animate-pulse ${className}`} style={style} />
  );
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarSkeleton({ currentDate }) {
  const date = currentDate instanceof Date ? currentDate : new Date();
  const month = date.getMonth();
  const year = date.getFullYear();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Real Header ── */}
      <div className="mb-8">
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
          {/* Month Total card — shimmer value with label */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-200/50 shadow-lg">
            <p className="text-sm text-gray-500 mb-1">Month Total</p>
            <Shimmer className="w-28 h-9 rounded-lg" />
            <p className="text-xs text-gray-400 mt-1">Calculating…</p>
          </div>
        </div>
      </div>

      {/* Month navigation — real buttons, static month label */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/5 border border-gray-200/50 p-4 mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl" disabled>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl" disabled>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-6 md:p-8 mb-8 overflow-x-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {DAYS.map((d) => (
            <div key={d} className="text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-3 text-center">Loading calendar…</p>

        {/* 5 rows × 7 columns */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 md:h-24 bg-gray-50 rounded-xl border border-gray-100 p-2 animate-pulse"
            >
              <Shimmer className="w-6 h-4 rounded mb-2" />
              <Shimmer className="w-full h-3 rounded mb-1" />
              <Shimmer className="w-3/4 h-3 rounded" />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200 justify-center">
          {["Delivered", "Skipped", "Pending"].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Shimmer className="w-3 h-3 rounded-full" />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service summary cards */}
      <p className="text-xl font-bold text-gray-900 mb-4">Service Details</p>
      <p className="text-xs text-gray-400 mb-4">Fetching services…</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div>
                <Shimmer className="w-28 h-4 rounded mb-2" />
                <Shimmer className="w-20 h-3 rounded" />
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <Shimmer className="h-full rounded-full" style={{ width: `${70 - i * 15}%` }} />
            </div>
            <div className="flex justify-between">
              <Shimmer className="w-16 h-3 rounded" />
              <Shimmer className="w-10 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
