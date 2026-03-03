// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Milk, Newspaper, Wifi, Zap } from 'lucide-react';

export default function HeroServices() {
    const services = [
        { icon: Milk, name: "Daily Milk", color: "bg-blue-100 text-blue-600" },
        { icon: Newspaper, name: "Newspaper", color: "bg-yellow-100 text-yellow-600" },
        { icon: Wifi, name: "Internet", color: "bg-purple-100 text-purple-600" },
        { icon: Zap, name: "Electricity", color: "bg-orange-100 text-orange-600" }
    ];

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex items-center justify-center p-8">
      <div className="grid grid-cols-2 gap-4 w-full">
        {services.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                    <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800">{s.name}</h3>
                <div className="text-xs text-slate-500 mt-1">Active</div>
            </div>
        ))}
      </div>
      {/* Decorative center element */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/50 pointer-events-none"></div>
    </div>
  );
}
