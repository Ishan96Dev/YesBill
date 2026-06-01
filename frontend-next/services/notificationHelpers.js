'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Notification Helpers
 * 
 * Helper functions to create notifications for various user actions.
 * These are called from the frontend after successful operations.
 */

import notificationService from './notificationService'

export const notificationHelpers = {
  /**
   * Notify when a service is created
   */
  async notifyServiceCreated(userId, serviceName) {
    if (!userId || !serviceName) return
    
    try {
      await notificationService.create(
        userId,
        'service_created',
        'Service Created',
        `${serviceName} has been added successfully`,
        { path: '/services' }
      )
    } catch (error) {
      console.error('Failed to create service notification:', error)
    }
  },

  /**
   * Notify when a service is updated
   */
  async notifyServiceUpdated(userId, serviceName, updatedFields = []) {
    if (!userId || !serviceName) return
    
    try {
      const fieldsText = updatedFields.length > 0 
        ? ` (${updatedFields.join(', ')} updated)`
        : ''
      
      await notificationService.create(
        userId,
        'service_updated',
        'Service Updated',
        `${serviceName}${fieldsText} has been modified`,
        { path: '/services' }
      )
    } catch (error) {
      console.error('Failed to create service update notification:', error)
    }
  },

  /**
   * Notify when a service is deleted
   */
  async notifyServiceDeleted(userId, serviceName) {
    if (!userId || !serviceName) return
    
    try {
      await notificationService.create(
        userId,
        'service_deleted',
        'Service Deleted',
        `${serviceName} has been removed from your services`,
        { path: '/services' }
      )
    } catch (error) {
      console.error('Failed to create service deletion notification:', error)
    }
  },

  /**
   * Notify when a service is activated/deactivated
   */
  async notifyServiceToggled(userId, serviceName, isActive) {
    if (!userId || !serviceName) return
    
    try {
      const status = isActive ? 'activated' : 'deactivated'
      await notificationService.create(
        userId,
        'service_toggled',
        `Service ${isActive ? 'Activated' : 'Deactivated'}`,
        `${serviceName} has been ${status}`,
        { path: '/services' }
      )
    } catch (error) {
      console.error('Failed to create service toggle notification:', error)
    }
  },

  /**
   * Notify when profile is updated
   */
  async notifyProfileUpdated(userId, updatedFields = []) {
    if (!userId) return
    
    try {
      const fieldsText = updatedFields.length > 0
        ? updatedFields.join(', ')
        : 'profile information'
      
      await notificationService.create(
        userId,
        'profile_updated',
        'Profile Updated',
        `Your ${fieldsText} has been updated successfully`,
        { path: '/settings' }
      )
    } catch (error) {
      console.error('Failed to create profile update notification:', error)
    }
  },

  /**
   * Notify when AI config is changed
   */
  async notifyAIConfigChanged(userId, provider, action = 'updated') {
    if (!userId || !provider) return
    
    try {
      const actionText = action === 'added' ? 'added' : action === 'removed' ? 'removed' : 'updated'
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      
      await notificationService.create(
        userId,
        'ai_config_changed',
        'AI Configuration Changed',
        `${providerName} API key has been ${actionText}`,
        { path: '/settings' }
      )
    } catch (error) {
      console.error('Failed to create AI config notification:', error)
    }
  },

  /**
   * Notify when avatar is updated
   */
  async notifyAvatarUpdated(userId) {
    if (!userId) return
    
    try {
      await notificationService.create(
        userId,
        'avatar_updated',
        'Avatar Updated',
        'Your profile picture has been changed successfully',
        { path: '/settings' }
      )
    } catch (error) {
      console.error('Failed to create avatar update notification:', error)
    }
  },

  /**
   * Notify when cover image is updated
   */
  async notifyCoverUpdated(userId) {
    if (!userId) return
    
    try {
      await notificationService.create(
        userId,
        'cover_updated',
        'Cover Image Updated',
        'Your profile cover has been changed successfully',
        { path: '/settings' }
      )
    } catch (error) {
      console.error('Failed to create cover update notification:', error)
    }
  }
}

export default notificationHelpers
