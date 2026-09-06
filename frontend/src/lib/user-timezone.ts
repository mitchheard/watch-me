/** Refresh stored IANA timezone at most once per 30 days (AVIDX-261). */
export const TIMEZONE_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_IANA_TIMEZONE_LENGTH = 80;

export function isValidIanaTimeZone(timeZone: string): boolean {
  const tz = timeZone.trim();
  if (!tz || tz.length > MAX_IANA_TIMEZONE_LENGTH) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Parse and validate a client-supplied IANA timezone, or return null. */
export function parseIanaTimeZone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const tz = raw.trim();
  if (!isValidIanaTimeZone(tz)) return null;
  return tz;
}

export function shouldRefreshStoredTimezone(
  timezone: string | null | undefined,
  timezoneUpdatedAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!timezone) return true;
  if (!timezoneUpdatedAt) return true;
  return now.getTime() - timezoneUpdatedAt.getTime() >= TIMEZONE_STALE_AFTER_MS;
}

/**
 * Calendar date (YYYY-MM-DD) in an IANA timezone. Returns null if the zone is invalid.
 * Used for the once-per-local-day tonight pick cache (AVIDX-350).
 */
export function localDateInTimeZone(timeZone: string, at: Date = new Date()): string | null {
  if (!isValidIanaTimeZone(timeZone)) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(at);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Current hour (0–23) in an IANA timezone. Returns null if the zone is invalid.
 * Used by the recommender and (later) new-seasons emails (AVIDX-250 / AVIDX-261).
 */
export function localHourInTimeZone(timeZone: string, at: Date = new Date()): number | null {
  if (!isValidIanaTimeZone(timeZone)) return null;
  try {
    const hourRaw = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .find((part) => part.type === 'hour')?.value;
    if (hourRaw == null) return null;
    let hour = Number.parseInt(hourRaw, 10);
    if (hour === 24) hour = 0;
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
    return hour;
  } catch {
    return null;
  }
}
