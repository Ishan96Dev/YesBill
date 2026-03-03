// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function HeroReset() {
  return (
    <div className="relative w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-primary mb-6 mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <h3 className="text-center text-xl font-bold text-slate-900 mb-2">Recovery Mode</h3>
      <p className="text-center text-slate-500 text-sm mb-8">Secure password reset initiated</p>

      <div className="space-y-4">
        <div className="relative">
            <div className="absolute left-3 top-3 text-slate-400">
                <Mail className="w-5 h-5" />
            </div>
            <div className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm">
                john.doe@example.com
            </div>
            <div className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        
        <div className="w-full py-3 bg-primary rounded-xl text-white font-medium flex items-center justify-center gap-2 opacity-50">
            Reset Link Sent <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
