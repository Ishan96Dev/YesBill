// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * User Profile Service
 * 
 * Handles user profile operations:
 * - Get user profile
 * - Update user profile
 * - Upload avatar
 */

import { supabase } from '../lib/supabase'
import { ensureAuth } from '../lib/supabase'

export const profileService = {
  /**
   * Get user profile by ID
   * @param {string} userId - User's ID
   * @returns {Promise<object>} User profile data
   */
  async getProfile(userId) {
    // No need to call ensureSession — Supabase client attaches auth headers automatically
    // and auto-refreshes tokens before expiry
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      throw error
    }

    return data
  },

  /**
   * Update user profile
   * @param {string} userId - User's ID
   * @param {object} updates - Profile fields to update
   * @returns {Promise<object>} Updated profile data (never null on success)
   * @throws {Error} on auth failure, RLS block, or DB error
   */
  async updateProfile(userId, updates) {

    // ── 1. Quick session check (no ensureAuth — it reads a custom localStorage key
    //    that may be missing, causing false "expired" errors before any API call)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Your session has expired. Please sign in again.')

    // ── 2. Clean and validate updates ──
    const validColumns = ['full_name', 'display_name', 'phone', 'company', 'website', 'location', 'bio', 'country', 'country_code', 'currency', 'currency_code', 'avatar_url', 'cover_image_url', 'timezone', 'language', 'theme', 'notifications_enabled', 'email_notifications', 'onboarding_completed', 'onboarding_skipped_steps', 'ai_config_reminder_shown']
    const cleanUpdates = {}
    for (const key of Object.keys(updates)) {
      if (validColumns.includes(key) && updates[key] !== undefined) {
        cleanUpdates[key] = updates[key]
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      console.warn('⚠️ No valid columns to update')
      // Still return current profile instead of null
      return await this.getProfile(userId)
    }

    // Always set updated_at so we can verify the write went through
    cleanUpdates.updated_at = new Date().toISOString()

    // ── 3. Attempt UPDATE ──
    const { data, error } = await supabase
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Profile update DB error:', error.message, error.code)
      throw new Error(`Profile update failed: ${error.message}`)
    }

    if (data) {
      // Fire-and-forget: sync name to auth metadata
      this._syncAuthMetadata(cleanUpdates)
      return data
    }

    // 0 rows returned — profile row doesn't exist (handle_new_user trigger should
    // create it on signup, so this shouldn't happen in practice)
    throw new Error('Profile not found. Please refresh the page and try again.')
  },

  /**
   * Sync name fields to auth.users metadata (fire-and-forget)
   * @private
   */
  _syncAuthMetadata(cleanUpdates) {
    if (cleanUpdates.full_name || cleanUpdates.display_name) {
      supabase.auth.updateUser({
        data: {
          full_name: cleanUpdates.full_name,
          display_name: cleanUpdates.display_name || cleanUpdates.full_name
        }
      }).catch(err => {
        console.warn('⚠️ Could not sync auth metadata:', err.message)
      })
    }
  },

  /**
   * Upload user avatar
   * @param {string} userId - User's ID
   * @param {File} file - Avatar image file
   * @returns {Promise<string>} Avatar URL
   */
  async uploadAvatar(userId, file) {
    // Ensure auth is valid before storage operations
    await ensureAuth()

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP.')
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.')
    }

    // Clean up old avatars in the user's folder first
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId, { limit: 100 })
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete)
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean up old avatars:', cleanupErr.message)
      // Continue with upload even if cleanup fails
    }

    // Create unique file name inside user's folder (matches RLS policy)
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      throw new Error('Could not generate public URL for avatar')
    }

    // Add cache-busting query param to avoid browser caching old avatar
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    // Update profile with new avatar URL
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile avatar_url:', profileError)
      throw new Error(`Profile update failed: ${profileError.message}`)
    }

    // Also update auth metadata so avatar shows everywhere
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      })
    } catch (authErr) {
      console.warn('⚠️ Could not update auth metadata avatar:', authErr.message)
    }

    return avatarUrl
  },

  /**
   * Upload user cover/background image
   * @param {string} userId - User's ID
   * @param {File} file - Cover image file
   * @returns {Promise<string>} Cover image URL
   */
  async uploadCoverImage(userId, file) {
    // Ensure auth is valid before storage operations
    await ensureAuth()

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP.')
    }

    // Validate file size (10MB for cover images)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.')
    }

    // Clean up old cover images in the user's folder first
    try {
      const { data: existingFiles } = await supabase.storage
        .from('cover-images')
        .list(userId, { limit: 100 })
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
        await supabase.storage
          .from('cover-images')
          .remove(filesToDelete)
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean up old cover images:', cleanupErr.message)
    }

    // Create unique file name inside user's folder
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cover-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Error uploading cover image:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cover-images')
      .getPublicUrl(fileName)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      throw new Error('Could not generate public URL for cover image')
    }

    // Add cache-busting query param
    const coverUrl = `${publicUrl}?t=${Date.now()}`

    // Update profile with new cover image URL
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ cover_image_url: coverUrl })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile cover_image_url:', profileError)
      throw new Error(`Profile update failed: ${profileError.message}`)
    }

    return coverUrl
  },

  /**
   * Delete user avatar
   * @param {string} userId - User's ID
   * @param {string} avatarUrl - Current avatar URL
   * @returns {Promise<void>}
   */
  async deleteAvatar(userId, avatarUrl) {
    if (!avatarUrl) return

    // Extract file path from URL — could be userId/filename or just filename
    const urlParts = avatarUrl.split('/avatars/')
    const filePath = urlParts.length > 1 ? urlParts[urlParts.length - 1] : null
    if (!filePath) return

    // Delete from storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) {
      console.error('Error deleting avatar:', error)
      // Don't throw — still clear the profile reference
    }

    // Remove from profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (profileError) {
      console.error('Error clearing avatar_url:', profileError)
      throw profileError
    }

  },

  /**
   * Get onboarding status fields for a user
   * @param {string} userId - User's ID
   * @returns {Promise<{onboarding_completed, onboarding_skipped_steps, ai_config_reminder_shown}>}
   */
  async getOnboardingStatus(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, onboarding_skipped_steps, ai_config_reminder_shown')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return data || { onboarding_completed: false, onboarding_skipped_steps: {}, ai_config_reminder_shown: false }
  },

  /**
   * Create initial profile for new user
   * @param {string} userId - User's ID
   * @param {object} profileData - Initial profile data
   * @returns {Promise<object>} Created profile
   */
  async createProfile(userId, profileData = {}) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...profileData
      }, { onConflict: 'id' })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }

    return data
  }
}

export default profileService
