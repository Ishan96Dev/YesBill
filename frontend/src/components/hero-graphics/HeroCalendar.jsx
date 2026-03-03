// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Calendar, User, CheckCircle } from 'lucide-react';

export default function HeroCalendar() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-100 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">May 2026</h3>
        <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                <Calendar className="w-4 h-4" />
            </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-7 gap-4 flex-1">
        {['S','M','T','W','T','F','S'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400">{d}</div>
        ))}
        {Array.from({length: 31}).map((_, i) => (
            <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-sm
                ${i === 14 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
                  i > 4 && i < 10 ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}>
                {i + 1}
            </div>
        ))}
      </div>
    </div>
  );
}
