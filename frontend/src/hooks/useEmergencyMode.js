import { useState, useEffect } from 'react';

/**
 * useEmergencyMode
 *
 * Returns `true` when the current Eastern Time meets either condition:
 *   - Hour >= 17 (5:00 PM ET or later), OR
 *   - Day is Saturday (6) or Sunday (0)
 *
 * Rechecks every 60 seconds so the banner appears/disappears without a page reload.
 *
 * LIFE-SAFETY NOTE (see CLAUDE.md): This hook drives the persistent emergency
 * header showing "Call Ohio MAR NOW: 833-234-6343". It must never be removed
 * or feature-flagged.
 */
function isEmergencyTime() {
  // Intl.DateTimeFormat gives us the wall-clock time in Eastern (handles DST automatically)
  const now = new Date();
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const hourPart    = etParts.find((p) => p.type === 'hour');
  const weekdayPart = etParts.find((p) => p.type === 'weekday');

  const hour    = parseInt(hourPart?.value ?? '0', 10);
  const weekday = weekdayPart?.value ?? '';

  const isAfter5PM  = hour >= 17;
  const isWeekend   = weekday === 'Sat' || weekday === 'Sun';

  return isAfter5PM || isWeekend;
}

export function useEmergencyMode() {
  const [emergency, setEmergency] = useState(isEmergencyTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setEmergency(isEmergencyTime());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return emergency;
}
