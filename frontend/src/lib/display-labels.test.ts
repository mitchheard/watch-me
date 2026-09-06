import { describe, expect, it } from 'vitest';
import { formatAddedDate, formatPickMeta, ratingLabel } from './display-labels';
import { tmdbPosterUrl } from './poster';

describe('formatPickMeta', () => {
  it('joins year, type, and runtime', () => {
    expect(formatPickMeta({ year: 1995, type: 'movie', runtimeMinutes: 170 })).toBe(
      '1995 · Movie · 170 min'
    );
    expect(formatPickMeta({ year: 2023, type: 'show', runtimeMinutes: 45 })).toBe(
      '2023 · TV · 45 min'
    );
  });
});

describe('ratingLabel', () => {
  it('uses the three-state vocabulary', () => {
    expect(ratingLabel('loved')).toBe('Loved');
    expect(ratingLabel('liked')).toBe('Liked');
    expect(ratingLabel('not-for-me')).toBe("Wasn't for me");
  });
});

describe('formatAddedDate', () => {
  it('formats a date', () => {
    expect(formatAddedDate('2026-09-06T12:00:00.000Z')).toMatch(/2026/);
  });
});

describe('tmdbPosterUrl', () => {
  it('builds an absolute TMDB URL', () => {
    expect(tmdbPosterUrl('/abc.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/abc.jpg');
  });

  it('returns null without a path', () => {
    expect(tmdbPosterUrl(null)).toBeNull();
  });
});
