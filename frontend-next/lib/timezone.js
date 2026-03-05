'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * User timezone utilities.
 * Resolves timezone from user profile (timezone or country) for calendar and date logic.
 */

// Country name (as in Settings) -> IANA timezone
const COUNTRY_TIMEZONE = {
  'India': 'Asia/Kolkata',
  'United States': 'America/New_York',
  'United Kingdom': 'Europe/London',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
  'South Korea': 'Asia/Seoul',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  'Netherlands': 'Europe/Amsterdam',
  'Singapore': 'Asia/Singapore',
  'United Arab Emirates': 'Asia/Dubai',
  'Saudi Arabia': 'Asia/Riyadh',
  'South Africa': 'Africa/Johannesburg',
  'Russia': 'Europe/Moscow',
  'Indonesia': 'Asia/Jakarta',
  'Thailand': 'Asia/Bangkok',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Philippines': 'Asia/Manila',
  'Bangladesh': 'Asia/Dhaka',
  'Pakistan': 'Asia/Karachi',
  'Sri Lanka': 'Asia/Colombo',
  'Nepal': 'Asia/Kathmandu',
  'Nigeria': 'Africa/Lagos',
  'Kenya': 'Africa/Nairobi',
};

/**
 * Get IANA timezone from profile (explicit timezone or derived from country).
 * @param {{ timezone?: string, country?: string } | null} profile
 * @returns {string} IANA timezone (e.g. 'Asia/Kolkata')
 */
export function getTimezoneFromProfile(profile) {
  if (!profile) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Get timezone from profile and normalize format
  let tz = (profile.timezone || '').trim();

  // Handle "Asia - Kolkata" format (from database) -> "Asia/Kolkata" (IANA format)
  tz = tz.replace(' - ', '/');

  if (tz) {
    return tz;
  }

  // Fall back to country-based timezone
  const country = (profile.country || '').trim();
  if (country && COUNTRY_TIMEZONE[country]) {
    return COUNTRY_TIMEZONE[country];
  }

  // Final fallback to browser timezone
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return browserTz;
}

/**
 * Get "today" as YYYY-MM-DD in the given timezone.
 * @param {string} timezone - IANA timezone
 * @returns {string}
 */
export function getTodayDateString(timezone) {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    return todayStr;
  } catch (error) {
    console.error(`[Timezone] Error getting date in timezone ${timezone}:`, error);
    return new Date().toLocaleDateString('en-CA');
  }
}

/**
 * Check if a calendar day (year, month, day) is "today" in the given timezone.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @param {number} day
 * @param {string} timezone
 * @returns {boolean}
 */
export function isTodayInTimezone(year, month, day, timezone) {
  const todayStr = getTodayDateString(timezone);
  const [y, m, d] = todayStr.split('-').map(Number);
  return year === y && month + 1 === m && day === d;
}

/**
 * Get timezone label for display (e.g. "Asia/Kolkata" -> "Asia/Kolkata" or keep as-is).
 */
export function getTimezoneLabel(timezone) {
  return timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export { COUNTRY_TIMEZONE };
