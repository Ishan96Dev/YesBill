// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useMemo } from 'react';
import { useUser } from './useUser';
import {
  getTimezoneFromProfile,
  getTodayDateString,
  isTodayInTimezone,
  getTimezoneLabel,
} from '../lib/timezone';

/**
 * Hook to get the current user's timezone from profile (or country) for calendar/date logic.
 * @returns {{ timezone: string, todayDateString: string, isToday: (y, m, d) => boolean, label: string }}
 */
export function useTimezone() {
  const { profile } = useUser();
  const timezone = useMemo(() => getTimezoneFromProfile(profile ?? null), [profile]);
  const todayDateString = useMemo(() => getTodayDateString(timezone), [timezone]);
  const isToday = useMemo(
    () => (year, month, day) => isTodayInTimezone(year, month, day, timezone),
    [timezone]
  );
  const label = useMemo(() => getTimezoneLabel(timezone), [timezone]);
  return { timezone, todayDateString, isToday, label };
}

export default useTimezone;
