'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { Plus } from "lucide-react";
import { Button } from "../ui/button";

function Shimmer({ className = "" }) {
  return (
    <div className={`bg-gray-200/80 rounded-lg animate-pulse ${className}`} />
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5">
      {/* Icon + name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div>
            <Shimmer className="w-28 h-5 rounded mb-2" />
            <Shimmer className="w-20 h-3 rounded" />
          </div>
        </div>
        <Shimmer className="w-10 h-6 rounded-full flex-shrink-0" />
      </div>
      <p className="text-xs text-gray-400 mb-3">Loading your services…</p>
      {/* Badges */}
      <div className="flex items-center gap-3 mb-4">
        <Shimmer className="w-16 h-6 rounded-full" />
        <Shimmer className="w-16 h-6 rounded-full" />
      </div>
      {/* Action row */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Shimmer className="flex-1 h-8 rounded-lg" />
        <Shimmer className="w-8 h-8 rounded-lg" />
        <Shimmer className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default function ServicesSkeleton({ navigate }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Real Header ── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Manage{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                Services
              </span>
            </h1>
            <p className="text-gray-500 text-lg">Add, edit, or remove your recurring services</p>
          </div>
          <Button
            size="lg"
            className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600"
            onClick={() => navigate?.("/add-service")}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Total Services", "Active", "Daily", "Monthly"].map((label) => (
            <div
              key={label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-lg shadow-black/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shimmer className="w-8 h-8 rounded-xl" />
              </div>
              <Shimmer className="w-12 h-7 rounded mb-1" />
              <p className="text-xs text-gray-500 mt-1">{label}</p>
              <p className="text-xs text-gray-400 mt-1">Counting services…</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
