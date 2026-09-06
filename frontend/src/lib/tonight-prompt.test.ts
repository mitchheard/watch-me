import { describe, expect, it } from 'vitest';
import { buildTonightUserPrompt, type TonightPromptItem } from './tonight-prompt';

function item(overrides: Partial<TonightPromptItem> = {}): TonightPromptItem {
  return {
    id: 'id-1',
    title: 'Paddington 2',
    type: 'movie',
    status: 'finished',
    rating: 'loved',
    tmdbPosterPath: '/p.jpg',
    tmdbOverview: 'A bear goes to prison.',
    tmdbMovieReleaseYear: 2017,
    tmdbTvFirstAirYear: null,
    tmdbMovieRuntime: 104,
    tmdbTvNumberOfSeasons: null,
    tmdbMovieCertification: 'PG',
    tmdbTvCertification: null,
    ...overrides,
  };
}

describe('buildTonightUserPrompt', () => {
  it('asks for three picks and names taste with loved / liked', () => {
    const prompt = buildTonightUserPrompt({
      candidates: [
        item({ id: 'w1', title: 'Heat', status: 'want-to-watch', rating: null, tmdbMovieCertification: 'R' }),
        item({ id: 'w2', title: 'Moana', status: 'want-to-watch', rating: null, tmdbMovieCertification: 'PG' }),
        item({ id: 'w3', title: 'Zodiac', status: 'want-to-watch', rating: null }),
      ],
      finished: [item()],
      context: { time: '2h', who: 'solo', energy: 'medium' },
      timeOfDay: 'evening',
    });
    expect(prompt).toMatch(/Recommend exactly 3/);
    expect(prompt).toMatch(/Paddington 2/);
    expect(prompt).toMatch(/loved/);
    expect(prompt).not.toMatch(/Kids are watching/);
  });

  it('includes the kids demotion rule when who=kids', () => {
    const prompt = buildTonightUserPrompt({
      candidates: [item({ id: 'w1', title: 'Heat', status: 'want-to-watch', rating: null })],
      finished: [],
      context: { time: '45m', who: 'kids', energy: 'low' },
      timeOfDay: 'evening',
      pickCount: 1,
    });
    expect(prompt).toMatch(/Kids are watching/);
    expect(prompt).toMatch(/Demote R-rated/);
  });
});
