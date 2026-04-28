'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
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

export function useNotifications(userId, _notifPrefs = null) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)
  // Tracks IDs marked as read this session — prevents any subsequent
  // fetch or realtime UPDATE from reverting the optimistic read state.
  const localReadIdsRef = useRef(new Set())

  const fetch = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await notificationService.getAll(userId)
    // Re-apply any locally-known read state so that a re-fetch never
    // reverts optimistic updates made earlier in this session.
    const localIds = localReadIdsRef.current
    const merged = localIds.size > 0
      ? data.map((n) => (localIds.has(n.id) ? { ...n, read: true } : n))
      : data
    setNotifications(merged)
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
          // Apply local read state so a late-arriving UPDATE from the DB
          // cannot flip a locally-marked-as-read notification back to unread.
          const updated = localReadIdsRef.current.has(payload.new.id)
            ? { ...payload.new, read: true }
            : payload.new
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? updated : n))
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
    localReadIdsRef.current.add(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await notificationService.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Add all currently-unread IDs to the local set BEFORE the optimistic
    // update so that any subsequent fetch or realtime event cannot revert them.
    setNotifications((prev) => {
      prev.forEach((n) => { if (!n.read) localReadIdsRef.current.add(n.id) })
      return prev.map((n) => ({ ...n, read: true }))
    })
    await notificationService.markAllAsRead(userId)
    // No fetch() on failure — localReadIdsRef keeps the UI correct.
    // Data will reconcile on the next full page load.
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
