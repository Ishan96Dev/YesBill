'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function EnhancedCheckbox({ 
  label, 
  checked, 
  onChange,  description,
  className = ''
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        
        <div className={`
          w-6 h-6 rounded-lg border-2 
          flex items-center justify-center
          transition-all duration-200
          ${checked 
            ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
            : 'bg-white border-gray-300 group-hover:border-primary/50'
          }
        `}>
          <motion.div
            initial={false}
            animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </div>
      
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
