// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Authentication Service using Supabase
 * 
 * Handles user authentication operations:
 * - Sign up
 * - Sign in
 * - Sign out
 * - Get current user
 * - Session management
 */

import { supabase } from '../lib/supabase'

export const authService = {
  /**
   * Sign up a new user
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} passwordConfirm - Password confirmation
   * @param {string} fullName - User's full name (optional)
   * @returns {Promise<object>} User data and session
   */
  async signUp(email, password, passwordConfirm, fullName = '') {
    // Validate passwords match
    if (password !== passwordConfirm) {
      throw new Error('Passwords do not match')
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // Redirect URL after email confirmation (if enabled)
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Add user metadata - this will be visible in Supabase dashboard
        data: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || email.split('@')[0], // Fallback to email username if no name
          display_name: fullName.trim() || email.split('@')[0],
          provider: 'email', // Explicitly set provider type
        }
      },
    })

    if (error) {
      console.error("❌ Supabase signUp error:", error);
      throw error;
    }

    if (!data.user) {
      console.error("❌ No user object in response");
      throw new Error("User creation failed - no user data returned");
    }

    // Store session data immediately if available
    if (data.session) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('user_email', data.user.email);
    }

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: !data.session, // If no session, email confirmation needed
    }
  },

  /**
   * Sign in an existing user
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<object>} User data and session
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) throw error

    // Store essential user info in localStorage (for quick access)
    if (data.session) {
      localStorage.setItem('access_token', data.session.access_token)
      localStorage.setItem('user_id', data.user.id)
      localStorage.setItem('user_email', data.user.email)
    }

    return {
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        throw error
      }
      
      // Clear all localStorage items
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_name')
      
    } catch (error) {
      console.error('❌ Error during signOut:', error)
      // Clear localStorage even if signOut fails
      localStorage.clear()
      throw error
    }
  },

  /**
   * Get the current authenticated user
   * @returns {Promise<object|null>} Current user or null
   */
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  /**
   * Get the current session
   * @returns {Promise<object|null>} Current session or null
   */
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error
    return session
  },

  /**
   * Refresh the current session
   * @returns {Promise<object>} Refreshed session
   */
  async refreshSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error) throw error

    // Update localStorage with new token
    if (session) {
      localStorage.setItem('access_token', session.access_token)
    }

    return session
  },

  /**
   * Reset password (send reset email)
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  },

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },

  /**
   * Verify the user's current password by re-authenticating.
   * Used before allowing a password change.
   * @param {string} email - User's email
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} true if correct, throws on failure
   */
  async verifyPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
    return true
  },

  /**
   * Check whether the user has an email+password identity linked.
   * SSO-only users (Google) will return false until they set a password.
   * @param {object} user - Supabase user object
   * @returns {boolean}
   */
  hasPasswordIdentity(user) {
    return user?.identities?.some((id) => id.provider === 'email') ?? false
  },

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function (event, session) => {}
   * @returns {object} Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Update localStorage on session changes
      if (session) {
        localStorage.setItem('access_token', session.access_token)
        localStorage.setItem('user_id', session.user.id)
        localStorage.setItem('user_email', session.user.email)
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_email')
      }

      callback(event, session)
    })
  },
}

export default authService
