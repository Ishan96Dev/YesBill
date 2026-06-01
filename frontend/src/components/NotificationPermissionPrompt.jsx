// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { browserNotificationService } from '../services/browserNotificationService'

/**
 * NotificationPermissionPrompt
 * 
 * Shows a prompt to request browser notification permission.
 * Only shows if:
 * - Browser supports notifications
 * - Permission is not already granted or denied
 * - User hasn't dismissed the prompt in this session
 */
export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      if (!browserNotificationService.isNotificationSupported()) {
        return false
      }

      const permission = browserNotificationService.getPermissionStatus()
      
      // Don't show if already granted or permanently denied
      if (permission === 'granted' || permission === 'denied') {
        return false
      }

      // Check if user dismissed in this session
      const dismissed = sessionStorage.getItem('notification-prompt-dismissed')
      if (dismissed === 'true') {
        return false
      }

      return true
    }

    // Show prompt after a short delay to not overwhelm user on page load
    const timer = setTimeout(() => {
      if (checkPermission()) {
        setShow(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleEnable = async () => {
    setRequesting(true)
    try {
      const permission = await browserNotificationService.requestPermission()
      if (permission === 'granted') {
        // Show a test notification
        await browserNotificationService.showGeneric(
          'Notifications Enabled',
          'You will now receive browser notifications from YesBill'
        )
      }
      setShow(false)
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    } finally {
      setRequesting(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('notification-prompt-dismissed', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 pr-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Enable Notifications
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get notified about new bills, reminders, and important updates even when YesBill is in the background.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleEnable}
                    disabled={requesting}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting ? 'Enabling...' : 'Enable'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
