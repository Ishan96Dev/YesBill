// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'
import { recordsAPI } from '../services/api'

export default function SummaryCard({ yearMonth }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [yearMonth])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const response = await recordsAPI.getSummary(yearMonth)
      setSummary(response.data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-6 w-80 animate-pulse"
      >
        <div className="h-8 bg-gray-200 rounded mb-2" />
        <div className="h-12 bg-gray-200 rounded" />
      </motion.div>
    )
  }

  if (!summary) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl shadow-2xl p-8 w-80"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <DollarSign className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium">This Month</p>
          <p className="text-white text-xs">{summary.total_yes_days} YES days</p>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center py-4"
      >
        <div className="text-5xl font-bold text-white mb-1">
          {summary.currency} {summary.total_amount.toFixed(2)}
        </div>
        <div className="text-white/60 text-sm">
          @ {summary.currency} {summary.daily_rate.toFixed(2)}/day
        </div>
      </motion.div>
    </motion.div>
  )
}
