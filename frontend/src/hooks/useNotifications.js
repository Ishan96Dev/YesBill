// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * useNotifications Hook
 *
 * Fetches notifications for the current user and subscribes to
 * Supabase Realtime for live updates (INSERT / UPDATE events).
 *
 * Returns:
 *   notifications   - array of notification objects (newest first)
 *   unreadCount     - number of unread notifications
 *   markAsRead      - fn(id) => marks one notification read
 *   markAllAsRead   - fn() => marks all notifications read
 *   deleteOne       - fn(id) => deletes a notification
 *   clearAll        - fn() => deletes all notifications
 *   loading         - boolean, true on initial fetch
 *   refresh         - fn() => manually re-fetch
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { notificationService } from '../services/notificationService'

export function useNotifications(userId, notifPrefs = null) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  const fetch = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await notificationService.getAll(userId)
    setNotifications(data)
    setLoading(false)
  }, [userId])

  // Initial fetch
  useEffect(() => {
    fetch()
  }, [fetch])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    // Clean up previous channel if userId changes
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId])

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await notificationService.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await notificationService.markAllAsRead(userId)
  }, [userId])

  const deleteOne = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await notificationService.deleteOne(id)
  }, [])

  const clearAll = useCallback(async () => {
    setNotifications([])
    await notificationService.deleteAll(userId)
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteOne,
    clearAll,
    loading,
    refresh: fetch,
  }
}

export default useNotifications
