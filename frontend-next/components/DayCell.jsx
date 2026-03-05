'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Check, X } from 'lucide-react'

export default function DayCell({ date, status, onToggle, isFuture, isToday }) {
  const handleClick = () => {
    if (!isFuture) {
      onToggle(date, status)
    }
  }

  const getStatusStyles = () => {
    if (status === 'YES') {
      return 'bg-yes/20 border-yes border-2'
    }
    if (status === 'NO') {
      return 'bg-no/20 border-no border-2'
    }
    return 'bg-white border border-gray-300'
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isFuture}
      whileHover={!isFuture ? { scale: 1.05 } : {}}
      whileTap={!isFuture ? { scale: 0.95 } : {}}
      animate={
        status
          ? {
              scale: [1, 1.1, 1],
            }
          : {}
      }
      transition={{ duration: 0.2 }}
      className={`
        aspect-square rounded-xl p-3 relative transition-all
        ${getStatusStyles()}
        ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
        ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-base font-semibold text-gray-900">{format(date, 'd')}</span>

        {status === 'YES' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-5 h-5 text-yes mt-1" strokeWidth={3} />
          </motion.div>
        )}

        {status === 'NO' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <X className="w-5 h-5 text-no mt-1" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  )
}
