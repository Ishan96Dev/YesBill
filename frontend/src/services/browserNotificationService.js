// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Browser Notification Service
 * 
 * Handles native browser push notifications using the Web Notification API.
 * Shows desktop notifications when the browser is open.
 */

class BrowserNotificationService {
  constructor() {
    this.permission = 'default'
    this.isSupported = 'Notification' in window
    
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported
  }

  /**
   * Get current notification permission status
   * @returns {'granted'|'denied'|'default'}
   */
  getPermissionStatus() {
    if (!this.isSupported) return 'denied'
    return Notification.permission
  }

  /**
   * Request permission to show notifications
   * @returns {Promise<'granted'|'denied'|'default'>}
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    if (this.permission === 'granted') {
      return 'granted'
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  /**
   * Show a browser notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @param {string} options.body - Notification body text
   * @param {string} options.icon - Icon URL
   * @param {string} options.badge - Badge URL
   * @param {string} options.tag - Unique tag to prevent duplicates
   * @param {boolean} options.requireInteraction - Keep notification visible until user interacts
   * @param {Object} options.data - Custom data to attach
   * @returns {Notification|null}
   */
  async show(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported')
      return null
    }

    // Request permission if not already granted
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return null
      }
    }

    try {
      const defaultOptions = {
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      }

      const notification = new Notification(title, defaultOptions)

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Navigate to URL if provided in data
        if (options.data?.url) {
          window.location.href = options.data.url
        }
        
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
      return null
    }
  }

  /**
   * Show a service created notification
   */
  async showServiceCreated(serviceName) {
    return this.show('Service Created', {
      body: `${serviceName} has been added successfully`,
      tag: 'service-created',
      data: { url: '/services' }
    })
  }

  /**
   * Show a service updated notification
   */
  async showServiceUpdated(serviceName) {
    return this.show('Service Updated', {
      body: `${serviceName} has been updated successfully`,
      tag: 'service-updated',
      data: { url: '/services' }
    })
  }

  /**
   * Show a bill generated notification
   */
  async showBillGenerated(serviceName, amount) {
    return this.show('Bill Generated', {
      body: `New bill for ${serviceName}: ₹${amount}`,
      tag: 'bill-generated',
      requireInteraction: true,
      data: { url: '/bills' }
    })
  }

  /**
   * Show a bill reminder notification
   */
  async showBillReminder(serviceName, daysLeft) {
    return this.show('Bill Reminder', {
      body: `${serviceName} bill due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      tag: 'bill-reminder',
      requireInteraction: true,
      data: { url: '/bills' }
    })
  }

  /**
   * Show a generic notification
   */
  async showGeneric(title, message, url = null) {
    return this.show(title, {
      body: message,
      tag: 'generic',
      data: url ? { url } : undefined
    })
  }
}

// Export singleton instance
export const browserNotificationService = new BrowserNotificationService()
export default browserNotificationService
