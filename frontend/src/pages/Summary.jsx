// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { recordsAPI } from '../services/api'

export default function Summary() {
  const navigate = useNavigate()
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const response = await recordsAPI.getSummary(currentMonth)
      setSummary(response.data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    {
      icon: Calendar,
      label: 'YES Days',
      value: summary?.total_yes_days || 0,
      color: 'text-yes',
      bgColor: 'bg-yes/10',
    },
    {
      icon: DollarSign,
      label: 'Daily Rate',
      value: summary ? `${summary.currency} ${summary.daily_rate.toFixed(2)}` : '-',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      label: 'Monthly Total',
      value: summary ? `${summary.currency} ${summary.total_amount.toFixed(2)}` : '-',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">Monthly Summary</h1>
          <p className="text-gray-600">
            {new Date(currentMonth + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center mb-6`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Visualization */}
        {summary && summary.total_yes_days > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Progress</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Days Marked YES</span>
                  <span>{summary.total_yes_days} days</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(summary.total_yes_days / 31) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-yes rounded-full"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-primary">
                      {summary.currency} {summary.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Avg per YES day</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {summary.currency} {summary.daily_rate.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {summary && summary.total_yes_days === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No YES days yet</h3>
            <p className="text-gray-600">Start marking days on your calendar to see your earnings.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Go to Calendar
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
