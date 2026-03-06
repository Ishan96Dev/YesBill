'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Notification Service
 *
 * Handles all CRUD operations for the notifications table.
 * Notifications are user-scoped and RLS-enforced in Supabase.
 */

import { supabase } from '../lib/supabase'

export const notificationService = {
  /**
   * Fetch all notifications for a user (newest first, max 50)
   */
  async getAll(userId) {
    if (!userId) return []
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      console.error('notificationService.getAll error:', error.message)
      return []
    }
    return data || []
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    if (error) console.error('notificationService.markAsRead error:', error.message)
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    if (!userId) return
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) console.error('notificationService.markAllAsRead error:', error.message)
  },

  /**
   * Create a notification only if no notification of the same type already
   * exists for this user. Prevents duplicates for "singleton" types like
   * ai_config_incomplete that should never show more than once.
   *
   * @param {string} userId
   * @param {string} type
   * @param {string} title
   * @param {string} [message]
   * @param {object} [data]
   * @returns {Promise<object|null>} Created notification, or null if already present
   */
  async createIfAbsent(userId, type, title, message = null, data = {}) {
    if (!userId) return null

    // DB-level existence check first
    const { data: existing, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error('notificationService.createIfAbsent check error:', checkError.message)
      // Fail-open: proceed with creation attempt
    }

    if (existing) return null // already present, skip

    return this.create(userId, type, title, message, data)
  },

  /**
   * Create a new notification — respects the user's notification_prefs.
   * If the type is disabled in user_profiles.notification_prefs, the
   * notification is silently skipped.
   *
   * @param {string} userId
   * @param {string} type - one of the allowed type values
   * @param {string} title
   * @param {string} [message]
   * @param {object} [data] - extra JSON payload (e.g. { path: '/bills', billId: '...' })
   */
  async create(userId, type, title, message = null, data = {}) {
    if (!userId) return null

    // Check user's notification preferences before creating
    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('notification_prefs')
        .eq('id', userId)
        .maybeSingle()

      const prefs = profileRow?.notification_prefs
      // If prefs exist and the type is explicitly set to false, skip
      if (prefs && prefs[type] === false) {
        return null
      }
    } catch {
      // If pref check fails, proceed with creation (fail-open)
    }

    const { data: result, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, data })
      .select()
      .single()
    if (error) {
      console.error('notificationService.create error:', error.message)
      return null
    }
    return result
  },

  /**
   * Delete a single notification
   */
  async deleteOne(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    if (error) console.error('notificationService.deleteOne error:', error.message)
  },

  /**
   * Delete all notifications of a specific type for a user.
   * Used e.g. to clear the "AI not configured" banner once the user saves an API key.
   */
  async deleteByType(userId, type) {
    if (!userId || !type) return
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', type)
    if (error) console.error('notificationService.deleteByType error:', error.message)
  },

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId) {
    if (!userId) return
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    if (error) console.error('notificationService.deleteAll error:', error.message)
  },
}

export default notificationService
