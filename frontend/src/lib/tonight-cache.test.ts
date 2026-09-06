import { describe, expect, it } from 'vitest';
import {
  TONIGHT_MIN_LIST_SIZE,
  buildTonightPickCache,
  isTonightCacheFresh,
  nextTonightShownIndex,
  parseTonightPickCache,
  visibleTonightCandidate,
  type TonightCandidate,
} from './tonight-cache';
import { DEFAULT_TONIGHT_CONTEXT } from './tonight-context';

function candidate(overrides: Partial<TonightCandidate> = {}): TonightCandidate {
  return {
    id: 'c1',
    title: 'Heat',
    type: 'movie',
    year: 1995,
    runtimeMinutes: 170,
    tmdbPosterPath: '/heat.jpg',
    tmdbOverview: 'Cops and robbers.',
    certification: 'R',
    reason: 'You loved Heat-adjacent crime and have two hours.',
    ...overrides,
  };
}

describe('parseTonightPickCache', () => {
  it('round-trips a valid payload', () => {
    const built = buildTonightPickCache({
      localDate: '2026-09-06',
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate(), candidate({ id: 'c2', title: 'Zodiac' })],
    });
    expect(parseTonightPickCache(built)).toEqual(built);
  });

  it('rejects empty or malformed payloads', () => {
    expect(parseTonightPickCache(null)).toBeNull();
    expect(parseTonightPickCache({ localDate: 'nope', candidates: [] })).toBeNull();
    expect(
      parseTonightPickCache({
        localDate: '2026-09-06',
        generatedAt: 'not-a-date',
        context: DEFAULT_TONIGHT_CONTEXT,
        shownIndex: 0,
        candidates: [candidate()],
      })
    ).toBeNull();
  });
});

describe('cache freshness and cycling', () => {
  it('is fresh only on the same local date', () => {
    const cache = buildTonightPickCache({
      localDate: '2026-09-06',
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate()],
    });
    expect(isTonightCacheFresh(cache, '2026-09-06')).toBe(true);
    expect(isTonightCacheFresh(cache, '2026-09-07')).toBe(false);
  });

  it('cycles Not tonight through candidates without wrapping past the list length incorrectly', () => {
    expect(nextTonightShownIndex(0, 3)).toBe(1);
    expect(nextTonightShownIndex(1, 3)).toBe(2);
    expect(nextTonightShownIndex(2, 3)).toBe(0);
    expect(nextTonightShownIndex(0, 1)).toBe(0);
  });

  it('returns the visible candidate', () => {
    const cache = buildTonightPickCache({
      localDate: '2026-09-06',
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate({ id: 'a', title: 'A' }), candidate({ id: 'b', title: 'B' })],
      shownIndex: 1,
    });
    expect(visibleTonightCandidate(cache).id).toBe('b');
  });
});

describe('TONIGHT_MIN_LIST_SIZE', () => {
  it('is 5 so sparse lists skip Claude', () => {
    expect(TONIGHT_MIN_LIST_SIZE).toBe(5);
  });
});
