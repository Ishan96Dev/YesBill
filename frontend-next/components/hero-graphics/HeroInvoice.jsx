'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Receipt, DollarSign, Download, Share2 } from 'lucide-react';

export default function HeroInvoice() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5] bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-100 overflow-hidden p-8 flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Receipt className="w-6 h-6" />
        </div>
        <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Total Due</div>
            <div className="text-3xl font-bold text-slate-900">$124.50</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className="h-4 w-1/3 bg-slate-100 rounded-full"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
      </div>

      <div className="flex-1 space-y-4">
        {[1,2,3].map(i => (
            <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-500">
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-800">Daily Milk</div>
                        <div className="text-xs text-slate-500">2 Liters • May {10+i}</div>
                    </div>
                </div>
                <div className="font-semibold text-slate-700">$4.50</div>
            </div>
        ))}
      </div>
      
      <div className="mt-8 flex gap-4">
        <button className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-medium flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-900 font-medium flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
}
