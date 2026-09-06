import { describe, expect, it } from 'vitest';
import {
  isValidIanaTimeZone,
  localDateInTimeZone,
  localHourInTimeZone,
  parseIanaTimeZone,
  shouldRefreshStoredTimezone,
  TIMEZONE_STALE_AFTER_MS,
} from './user-timezone';

describe('isValidIanaTimeZone / parseIanaTimeZone', () => {
  it('accepts IANA identifiers', () => {
    expect(isValidIanaTimeZone('America/Chicago')).toBe(true);
    expect(parseIanaTimeZone('  UTC  ')).toBe('UTC');
  });

  it('rejects empty, oversized, and invalid values', () => {
    expect(parseIanaTimeZone(null)).toBeNull();
    expect(parseIanaTimeZone(12)).toBeNull();
    expect(parseIanaTimeZone('')).toBeNull();
    expect(parseIanaTimeZone('Not/ARealZone')).toBeNull();
    expect(parseIanaTimeZone('x'.repeat(81))).toBeNull();
  });
});

describe('shouldRefreshStoredTimezone', () => {
  const now = new Date('2026-09-06T12:00:00.000Z');

  it('refreshes when timezone is missing', () => {
    expect(shouldRefreshStoredTimezone(null, now, now)).toBe(true);
    expect(shouldRefreshStoredTimezone('America/Chicago', null, now)).toBe(true);
  });

  it('refreshes at or after 30 days', () => {
    const stale = new Date(now.getTime() - TIMEZONE_STALE_AFTER_MS);
    expect(shouldRefreshStoredTimezone('America/Chicago', stale, now)).toBe(true);
  });

  it('skips when the stored value is fresh', () => {
    const fresh = new Date(now.getTime() - TIMEZONE_STALE_AFTER_MS + 60_000);
    expect(shouldRefreshStoredTimezone('America/Chicago', fresh, now)).toBe(false);
  });
});

describe('localDateInTimeZone', () => {
  it('returns the calendar date in the given zone', () => {
    const justAfterUtcMidnight = new Date('2026-09-06T03:00:00.000Z');
    expect(localDateInTimeZone('UTC', justAfterUtcMidnight)).toBe('2026-09-06');
    expect(localDateInTimeZone('America/Chicago', justAfterUtcMidnight)).toBe('2026-09-05');
    expect(localDateInTimeZone('Pacific/Auckland', justAfterUtcMidnight)).toBe('2026-09-06');
  });

  it('returns null for invalid zones', () => {
    expect(localDateInTimeZone('Not/ARealZone')).toBeNull();
  });
});

describe('localHourInTimeZone', () => {
  // 17:00 UTC on 6 Sep 2026 (US still on DST).
  const at = new Date('2026-09-06T17:00:00.000Z');

  it('returns the local hour in the given zone', () => {
    expect(localHourInTimeZone('UTC', at)).toBe(17);
    expect(localHourInTimeZone('America/Chicago', at)).toBe(12);
    expect(localHourInTimeZone('America/Los_Angeles', at)).toBe(10);
    expect(localHourInTimeZone('Pacific/Auckland', at)).toBe(5);
  });

  it('maps midnight to 0, not 24', () => {
    expect(localHourInTimeZone('UTC', new Date('2026-09-06T00:00:00.000Z'))).toBe(0);
  });

  it('returns null for invalid zones', () => {
    expect(localHourInTimeZone('Not/ARealZone', at)).toBeNull();
  });
});
