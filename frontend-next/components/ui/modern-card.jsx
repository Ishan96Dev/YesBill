'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion';

export default function ModernCard({ 
  children, 
  className = '', 
  gradient,
  hover = true,
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`
        relative bg-white/80 backdrop-blur-sm rounded-2xl 
        border border-gray-200/50 shadow-lg 
        ${hover ? 'hover:shadow-2xl hover:-translate-y-1' : ''}
        transition-all duration-300 overflow-hidden
        ${className}
      `}
    >
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      )}
      {children}
    </motion.div>
  );
}
