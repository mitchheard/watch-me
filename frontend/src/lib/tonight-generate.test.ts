import { describe, expect, it } from 'vitest';
import { fallbackTonightCandidates } from './tonight-generate';
import type { TonightPromptItem } from './tonight-prompt';

describe('fallbackTonightCandidates', () => {
  it('builds reasons from overview without hollow stock lines', () => {
    const items: TonightPromptItem[] = [
      {
        id: '1',
        title: 'Heat',
        type: 'movie',
        status: 'want-to-watch',
        rating: null,
        tmdbPosterPath: '/h.jpg',
        tmdbOverview: 'A group of professional bank robbers start to feel the heat from police.',
        tmdbMovieReleaseYear: 1995,
        tmdbTvFirstAirYear: null,
        tmdbMovieRuntime: 170,
        tmdbTvNumberOfSeasons: null,
        tmdbMovieCertification: 'R',
        tmdbTvCertification: null,
      },
    ];
    const [pick] = fallbackTonightCandidates(items, 1);
    expect(pick.reason).toMatch(/bank robbers/);
    expect(pick.reason).not.toMatch(/perfect choice/i);
  });
});
