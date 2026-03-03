// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isAfter,
} from 'date-fns'
import DayCell from './DayCell'
import { recordsAPI } from '../services/api'

export default function Calendar({ yearMonth, onDataChange }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [optimisticUpdates, setOptimisticUpdates] = useState({})

  const currentDate = new Date(yearMonth + '-01')
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const today = new Date()

  useEffect(() => {
    loadRecords()
  }, [yearMonth])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const response = await recordsAPI.getMonth(yearMonth)
      setRecords(response.data)
      setOptimisticUpdates({})
      if (onDataChange) onDataChange()
    } catch (error) {
      console.error('Failed to load records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (date, currentStatus) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const newStatus = currentStatus === 'YES' ? 'NO' : 'YES'

    setOptimisticUpdates((prev) => ({
      ...prev,
      [dateStr]: newStatus,
    }))

    try {
      await recordsAPI.create(dateStr, newStatus)
      await loadRecords()
    } catch (error) {
      console.error('Failed to update record:', error)
      setOptimisticUpdates((prev) => {
        const updated = { ...prev }
        delete updated[dateStr]
        return updated
      })
    }
  }

  const getRecordForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    if (optimisticUpdates[dateStr]) {
      return { status: optimisticUpdates[dateStr] }
    }
    return records.find((record) => isSameDay(new Date(record.date), date))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      {/* Month Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-3 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {/* Empty cells for alignment */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {daysInMonth.map((date) => {
          const record = getRecordForDate(date)
          const isFuture = isAfter(date, today)
          const isToday = isSameDay(date, today)

          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              status={record?.status}
              onToggle={handleToggle}
              isFuture={isFuture}
              isToday={isToday}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yes/20 border-2 border-yes" />
          <span className="text-sm text-gray-700 font-medium">YES</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-no/20 border-2 border-no" />
          <span className="text-sm text-gray-700 font-medium">NO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-300" />
          <span className="text-sm text-gray-700 font-medium">Not set</span>
        </div>
      </div>
    </motion.div>
  )
}
