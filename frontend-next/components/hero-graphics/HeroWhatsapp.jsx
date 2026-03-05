'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { MessageCircle, CheckCheck } from 'lucide-react';

export default function HeroWhatsapp() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/16] bg-slate-100 rounded-[3rem] border-8 border-slate-900 overflow-hidden shadow-2xl">
      {/* Phone Header */}
      <div className="bg-[#075E54] p-4 pt-12 text-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white"></div>
        </div>
        <div>
            <div className="font-semibold text-sm">YesBill Alerts</div>
            <div className="text-[10px] opacity-80">Online</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="p-4 space-y-4 bg-[#E5DDD5] h-full">
        <div className="flex justify-center mb-4">
            <span className="bg-[#E1F3FB] text-slate-600 text-[10px] px-2 py-1 rounded shadow-sm">Today</span>
        </div>
        
        {/* Message Received */}
        <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm relative">
            <p className="text-sm text-slate-800">Your monthly bill for <span className="font-semibold">March</span> is ready.</p>
            <p className="text-sm text-slate-800 mt-1">Total: <span className="font-semibold">$45.00</span></p>
            <div className="text-[10px] text-slate-400 text-right mt-1">10:30 AM</div>
        </div>

        {/* Message Sent */}
        <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none max-w-[80%] shadow-sm ml-auto relative">
            <p className="text-sm text-slate-800">Paid! Thanks for the reminder.</p>
            <div className="flex items-center justify-end gap-1 mt-1">
                <div className="text-[10px] text-slate-500">10:32 AM</div>
                <CheckCheck className="w-3 h-3 text-blue-500" />
            </div>
        </div>
      </div>
    </div>
  );
}
