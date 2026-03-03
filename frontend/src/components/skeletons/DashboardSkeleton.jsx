// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { Plus, Calendar } from "lucide-react";
import { Button } from "../ui/button";

function Shimmer({ className = "" }) {
  return (
    <div className={`bg-gray-200/80 rounded-lg animate-pulse ${className}`} />
  );
}

export default function DashboardSkeleton({ greeting = "Good Morning", name = "there" }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Real Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {greeting},{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              {name}
            </span>
          </h1>
          <p className="text-gray-500 text-lg">Track your daily services and manage bills effortlessly</p>
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            className="rounded-xl shadow-lg bg-gradient-to-r from-primary to-indigo-600"
            disabled
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Service
          </Button>
          <Button variant="outline" size="lg" className="rounded-xl" disabled>
            <Calendar className="w-5 h-5 mr-2" />
            Go to Calendar
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { color: "bg-orange-50", label: "Total Spent" },
          { color: "bg-green-50",  label: "Delivery Rate" },
          { color: "bg-blue-50",   label: "Active Services" },
          { color: "bg-purple-50", label: "Skipped" },
        ].map(({ color, label }) => (
          <div key={label} className={`${color} rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5`}>
            <div className="flex items-center gap-3 mb-4">
              <Shimmer className="w-9 h-9 rounded-xl" />
              <span className="text-sm font-medium text-gray-500">{label}</span>
            </div>
            <Shimmer className="w-20 h-8 rounded mb-1" />
            <p className="text-xs text-gray-400 mt-2">Loading stats…</p>
          </div>
        ))}
      </div>

      {/* Today's Services + Month Summary */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Today's services */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5">
          <div className="flex items-center gap-2 mb-2">
            <Shimmer className="w-5 h-5 rounded" />
            <span className="text-base font-semibold text-gray-700">Today's Services</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Loading today's services…</p>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <Shimmer className="w-32 h-4 rounded mb-2" />
                  <Shimmer className="w-20 h-3 rounded" />
                </div>
                <Shimmer className="w-20 h-7 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Month summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/50 shadow-lg shadow-black/5">
          <div className="flex items-center gap-2 mb-2">
            <Shimmer className="w-5 h-5 rounded" />
            <span className="text-base font-semibold text-gray-700">This Month</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Fetching monthly data…</p>
          <Shimmer className="w-28 h-10 rounded-xl mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Shimmer className="w-24 h-4 rounded" />
                <Shimmer className="w-14 h-4 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {["View Calendar", "Generate Bill", "View Analytics"].map((label) => (
          <div key={label} className="bg-white/80 rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5">
            <Shimmer className="w-10 h-10 rounded-xl mb-4" />
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            <p className="text-xs text-gray-400">Loading…</p>
          </div>
        ))}
      </div>
    </div>
  );
}
