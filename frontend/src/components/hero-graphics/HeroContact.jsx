// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Mail, Send, User } from 'lucide-react';

export default function HeroContact() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col justify-center">
      <div className="bg-slate-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User className="w-5 h-5" />
            </div>
            <div>
                <div className="h-2 w-24 bg-slate-200 rounded-full mb-1"></div>
                <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-2 w-full bg-slate-200 rounded-full"></div>
            <div className="h-2 w-full bg-slate-200 rounded-full"></div>
            <div className="h-2 w-2/3 bg-slate-200 rounded-full"></div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-3 text-slate-400">
            <Mail className="w-5 h-5" />
        </div>
        <div className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 text-sm text-slate-400">
            Write a message...
        </div>
        <div className="absolute right-2 top-2 p-1 bg-primary rounded-lg text-white">
            <Send className="w-4 h-4" />
        </div>
      </div>

      <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Online
        </div>
      </div>
    </div>
  );
}
