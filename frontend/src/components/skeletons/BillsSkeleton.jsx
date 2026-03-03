// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

function Shimmer({ className = "" }) {
  return (
    <div className={`bg-gray-200/80 rounded-lg animate-pulse ${className}`} />
  );
}

// ─── Inline history-only skeleton used inside Bills.jsx ────────
export function BillsHistorySkeleton() {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">Loading bill history…</p>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm animate-pulse"
          >
            <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Shimmer className="w-36 h-4 rounded mb-2" />
              <Shimmer className="w-24 h-3 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="w-16 h-6 rounded-lg" />
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Full-page Bills skeleton (kept for potential future use) ──
export default function BillsSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Monthly{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
            Bills
          </span>
        </h1>
        <p className="text-gray-500 text-lg">Generate AI-powered bills from your calendar data</p>
      </div>

      {/* Generate section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 mb-8 border border-indigo-100/60">
        <div className="flex items-start gap-4 mb-6">
          <Shimmer className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div>
            <Shimmer className="w-52 h-6 rounded mb-2" />
            <Shimmer className="w-80 h-4 rounded" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Shimmer className="flex-1 h-12 rounded-xl" />
          <Shimmer className="flex-1 h-12 rounded-xl" />
        </div>
        <Shimmer className="w-full h-20 rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-indigo-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Shimmer className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div>
                <Shimmer className="w-20 h-3 rounded mb-1" />
                <Shimmer className="w-28 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Shimmer className="w-40 h-11 rounded-xl" />
        </div>
      </div>

      {/* Previous Bills */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shimmer className="w-5 h-5 rounded" />
          <Shimmer className="w-36 h-6 rounded" />
        </div>
        <BillsHistorySkeleton />
      </div>
    </div>
  );
}
