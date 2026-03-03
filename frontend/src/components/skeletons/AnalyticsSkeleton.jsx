// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import TimeRangeDropdown from "../ui/time-range-dropdown";

function Shimmer({ className = "" }) {
  return (
    <div className={`bg-gray-200/80 rounded-lg animate-pulse ${className}`} />
  );
}

function LoadingLabel({ text }) {
  return (
    <p className="text-xs text-gray-400 mt-2">{text}</p>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between mb-3">
        <Shimmer className="w-10 h-10 rounded-xl" />
        <Shimmer className="w-16 h-5 rounded-md" />
      </div>
      <Shimmer className="w-24 h-4 rounded mb-2" />
      <Shimmer className="w-20 h-7 rounded" />
      <LoadingLabel text="Loading your stats…" />
    </div>
  );
}

function BarSectionSkeleton({ rows = 5, label = "Loading data…" }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shimmer className="w-5 h-5 rounded" />
            <Shimmer className="w-40 h-5 rounded" />
          </div>
          <Shimmer className="w-56 h-4 rounded" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">{label}</p>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="w-8 h-4 rounded flex-shrink-0" />
            <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
              <Shimmer className="h-full rounded-lg" style={{ width: `${85 - i * 12}%` }} />
            </div>
            <Shimmer className="w-12 h-4 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TwoColSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {[
        "Loading service breakdown…",
        "Loading category data…",
      ].map((label, i) => (
        <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Shimmer className="w-5 h-5 rounded" />
            <Shimmer className="w-36 h-5 rounded" />
          </div>
          <Shimmer className="w-48 h-4 rounded mb-2" />
          <p className="text-xs text-gray-400 mb-4">{label}</p>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Shimmer className="w-3 h-3 rounded-full flex-shrink-0" />
                <Shimmer className="w-24 h-4 rounded" />
                <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                  <Shimmer className="h-full rounded-lg" style={{ width: `${75 - j * 14}%` }} />
                </div>
                <Shimmer className="w-12 h-4 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonContent() {
  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Monthly Spending Trend */}
      <BarSectionSkeleton rows={6} label="Building your spending trends…" />

      {/* Per-Service Breakdown */}
      <BarSectionSkeleton rows={4} label="Loading per-service data…" />

      {/* Two-column charts */}
      <TwoColSkeleton />

      {/* Bill History */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shimmer className="w-5 h-5 rounded" />
          <Shimmer className="w-32 h-5 rounded" />
        </div>
        <p className="text-xs text-gray-400 mb-4">Fetching bill history…</p>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Shimmer className="w-32 h-4 rounded mb-2" />
                <Shimmer className="w-20 h-3 rounded" />
              </div>
              <Shimmer className="w-16 h-6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AnalyticsSkeleton({ timeRange, onChange, compact = false }) {
  if (compact) {
    return <SkeletonContent />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Real Header ── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                Analytics
              </span>
            </h1>
            <p className="text-gray-500 text-lg">Insights and trends from your service data</p>
          </div>
          <TimeRangeDropdown value={timeRange} onChange={onChange} />
        </div>
      </div>

      <SkeletonContent />
    </div>
  );
}
