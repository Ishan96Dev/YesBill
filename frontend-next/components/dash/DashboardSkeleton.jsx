'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { Skeleton } from "../ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Nav Skeleton */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-6 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="w-48 h-8 mb-2 rounded-lg" />
            <Skeleton className="w-32 h-4 rounded" />
          </div>
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-4 h-4 rounded" />
              </div>
              <Skeleton className="w-24 h-8 rounded-lg" />
              <Skeleton className="w-16 h-3 rounded" />
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="w-32 h-6 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-48 h-5 rounded" />
                    <Skeleton className="w-24 h-3 rounded" />
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 aspect-square sm:aspect-video lg:aspect-square flex items-center justify-center">
                 <Skeleton className="w-full h-full rounded-xl" />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}