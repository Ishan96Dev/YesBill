'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '../services/authService'
import { useUser } from '../hooks/useUser'

export default function TopBar({ currentMonth, onMonthChange }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const { displayName, avatarUrl } = useUser()

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const newDate = new Date(year, month - 2)
    onMonthChange(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const newDate = new Date(year, month)
    const today = new Date()

    if (
      newDate.getFullYear() > today.getFullYear() ||
      (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() >= today.getMonth())
    ) {
      return
    }

    onMonthChange(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate even if signOut fails
      router.push('/login', { replace: true });
    }
  }

  const monthName = new Date(currentMonth + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Month Selector */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </motion.button>

            <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
              {monthName}
            </h2>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </motion.button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-indigo-100 flex items-center justify-center shadow-lg overflow-hidden border-2 border-white"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-sm font-semibold">
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </motion.button>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
              >
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    router.push('/settings')
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    router.push('/summary')
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700"
                >
                  Summary
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors text-red-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
