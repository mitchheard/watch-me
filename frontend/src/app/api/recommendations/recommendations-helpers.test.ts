import { describe, expect, it } from 'vitest';
import {
  OVERVIEW_PROMPT_MAX,
  parseRecommendationsHourParam,
  pickProfileAnchors,
  recommendationPickCount,
  strategyReasonGuidance,
  timeOfDayBucketFromLocalHour,
  trimOverview,
} from './recommendations-helpers';

describe('trimOverview', () => {
  it('returns empty for nullish', () => {
    expect(trimOverview(null)).toBe('');
    expect(trimOverview(undefined)).toBe('');
    expect(trimOverview('   ')).toBe('');
  });

  it('normalizes whitespace', () => {
    expect(trimOverview('a  \n  b')).toBe('a b');
  });

  it('truncates long text with ellipsis', () => {
    const long = 'x'.repeat(OVERVIEW_PROMPT_MAX + 50);
    const out = trimOverview(long);
    expect(out.length).toBeLessThanOrEqual(OVERVIEW_PROMPT_MAX);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('pickProfileAnchors', () => {
  it('prefers loved finished, then liked', () => {
    const finished = [
      { title: 'B', status: 'finished', rating: 'liked' as const },
      { title: 'A', status: 'finished', rating: 'loved' as const },
    ];
    const out = pickProfileAnchors(finished, [], 1, 5);
    expect(out.map((r) => r.title)).toEqual(['A', 'B']);
  });

  it('pads with loved want-to-watch when finished anchors are sparse', () => {
    const finished = [{ title: 'Only', status: 'finished', rating: 'loved' as const }];
    const wtw = [
      { title: 'Extra', status: 'want-to-watch', rating: 'loved' as const },
      { title: 'Skip', status: 'want-to-watch', rating: 'liked' as const },
    ];
    const out = pickProfileAnchors(finished, wtw, 3, 5);
    expect(out.some((r) => r.title === 'Extra')).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores not-for-me finished for anchors', () => {
    const finished = [{ title: 'Nope', status: 'finished', rating: 'not-for-me' as const }];
    const wtw: { title: string; status: string; rating: string | null }[] = [];
    expect(pickProfileAnchors(finished, wtw, 3, 5)).toEqual([]);
  });
});

describe('strategyReasonGuidance', () => {
  it('returns a sentence for known strategies', () => {
    expect(strategyReasonGuidance('quick wins').length).toBeGreaterThan(20);
    expect(strategyReasonGuidance('Quick Wins').toLowerCase()).toContain('runtime');
  });

  it('falls back for unknown keys', () => {
    expect(strategyReasonGuidance('unknown-strategy-x')).toContain('overview');
  });

  it('hidden gems guidance references vote_count threshold (AVIDX-255)', () => {
    const g = strategyReasonGuidance('hidden gems');
    expect(g).toContain('10,000');
    expect(g.toLowerCase()).toContain('vote_count');
  });

  it('highly rated similar mentions vote_count (AVIDX-255)', () => {
    expect(strategyReasonGuidance('highly rated similar').toLowerCase()).toContain('vote_count');
  });
});

describe('timeOfDayBucketFromLocalHour (AVIDX-256)', () => {
  it('maps 1 AM to late night, never morning', () => {
    expect(timeOfDayBucketFromLocalHour(1)).toBe('late night');
  });

  it('uses ticket boundary table', () => {
    expect(timeOfDayBucketFromLocalHour(7)).toBe('early morning');
    expect(timeOfDayBucketFromLocalHour(10)).toBe('morning');
    expect(timeOfDayBucketFromLocalHour(13)).toBe('midday');
    expect(timeOfDayBucketFromLocalHour(16)).toBe('afternoon');
    expect(timeOfDayBucketFromLocalHour(20)).toBe('evening');
    expect(timeOfDayBucketFromLocalHour(23)).toBe('late night');
    expect(timeOfDayBucketFromLocalHour(3)).toBe('overnight');
  });
});

describe('recommendationPickCount', () => {
  it('caps at five and never exceeds the pool', () => {
    expect(recommendationPickCount(0)).toBe(0);
    expect(recommendationPickCount(1)).toBe(1);
    expect(recommendationPickCount(3)).toBe(3);
    expect(recommendationPickCount(5)).toBe(5);
    expect(recommendationPickCount(50)).toBe(5);
  });
});

describe('parseRecommendationsHourParam', () => {
  it('accepts 0-23', () => {
    expect(parseRecommendationsHourParam('0')).toBe(0);
    expect(parseRecommendationsHourParam('23')).toBe(23);
  });

  it('rejects invalid and returns null', () => {
    expect(parseRecommendationsHourParam(null)).toBeNull();
    expect(parseRecommendationsHourParam('')).toBeNull();
    expect(parseRecommendationsHourParam('24')).toBeNull();
    expect(parseRecommendationsHourParam('abc')).toBeNull();
  });
});
