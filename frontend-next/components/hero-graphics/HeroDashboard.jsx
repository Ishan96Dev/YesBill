'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { User, Bell, TrendingUp } from 'lucide-react';

export default function HeroDashboard() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-video bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-6 text-white overflow-hidden">
        {/* Header Mock */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
                <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
            </div>
            <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Active Bills</div>
                <div className="text-xl font-bold">12</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Total Paid</div>
                <div className="text-xl font-bold flex items-center gap-2">
                    $840 <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
            </div>
        </div>

        {/* List Mock */}
        <div className="space-y-2">
            {[1,2].map(i => (
                <div key={i} className="h-10 w-full bg-slate-800/30 rounded-lg flex items-center px-3">
                    <div className="h-2 w-8 bg-slate-700 rounded-full mr-3"></div>
                    <div className="h-2 w-full bg-slate-700/50 rounded-full"></div>
                </div>
            ))}
        </div>
        
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}
