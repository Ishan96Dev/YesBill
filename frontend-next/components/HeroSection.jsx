'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function HeroSection({ title, subtitle, graphic, badge, className }) {
  return (
    <section className={cn("relative pt-32 pb-16 lg:pt-48 lg:pb-24 px-6 overflow-hidden min-h-screen flex items-center", className)}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            {badge && (
              <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                {badge}
              </div>
            )}
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              {title}
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-8">
              {subtitle}
            </p>
          </motion.div>

          {/* Right Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex items-center justify-center lg:justify-end mt-8 lg:mt-0 mb-8 lg:mb-0"
          >
            <div className="w-full max-w-[480px] lg:max-w-[520px] relative">
              {/* Graphic Container with Scale Constraint */}
              <div className="w-full h-full object-contain scale-95 origin-center md:origin-right flex items-center justify-center">
                {graphic}
              </div>
            </div>
          </motion.div>

      </div>
    </section>
  );
}
