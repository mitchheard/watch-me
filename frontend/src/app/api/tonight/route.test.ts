import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSupabaseRouteUser,
  userFindUnique,
  userUpdate,
  watchlistFindFirst,
  watchlistItemListFindMany,
  generateTonightCandidates,
} = vi.hoisted(() => ({
  getSupabaseRouteUser: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  watchlistFindFirst: vi.fn(),
  watchlistItemListFindMany: vi.fn(),
  generateTonightCandidates: vi.fn(),
}));

vi.mock('@/lib/supabase-route-auth', () => ({ getSupabaseRouteUser }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    watchlist: { findFirst: watchlistFindFirst },
    watchlistItemList: { findMany: watchlistItemListFindMany },
  },
}));
vi.mock('@/lib/tonight-generate', () => ({ generateTonightCandidates }));
vi.mock('tmdb-ts', () => ({
  TMDB: class {
    tvShows = { details: vi.fn() };
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { DEFAULT_TONIGHT_CONTEXT } from '@/lib/tonight-context';
import { buildTonightPickCache, type TonightCandidate } from '@/lib/tonight-cache';

function candidate(overrides: Partial<TonightCandidate> = {}): TonightCandidate {
  return {
    id: 'c1',
    title: 'Heat',
    type: 'movie',
    year: 1995,
    runtimeMinutes: 170,
    tmdbPosterPath: '/heat.jpg',
    tmdbOverview: 'Cops.',
    certification: 'R',
    reason: 'You loved crime epics and have two hours.',
    ...overrides,
  };
}

function listRow(id: string, title: string, status = 'want-to-watch') {
  return {
    status,
    rating: null,
    notes: null,
    watchlistItem: {
      id,
      title,
      type: 'movie',
      tmdbId: 1,
      tmdbPosterPath: `/${id}.jpg`,
      tmdbOverview: 'Overview',
      tmdbMovieReleaseYear: 1995,
      tmdbTvFirstAirYear: null,
      tmdbMovieRuntime: 120,
      tmdbTvNumberOfSeasons: null,
      tmdbMovieCertification: 'R',
      tmdbTvCertification: null,
    },
  };
}

function fiveItems() {
  return ['a', 'b', 'c', 'd', 'e'].map((id, i) => listRow(id, `Title ${id}`, 'want-to-watch'));
}

describe('GET /api/tonight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseRouteUser.mockResolvedValue({ id: 'user-1' });
    watchlistFindFirst.mockResolvedValue({ id: 'wl-1' });
    userUpdate.mockResolvedValue({});
    generateTonightCandidates.mockResolvedValue({
      candidates: [candidate(), candidate({ id: 'c2', title: 'Zodiac' }), candidate({ id: 'c3', title: 'Sicario' })],
      claudeCalled: true,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    getSupabaseRouteUser.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/tonight'));
    expect(res.status).toBe(401);
    expect(generateTonightCandidates).not.toHaveBeenCalled();
  });

  it('returns the empty state without calling Claude when the list is small', async () => {
    userFindUnique.mockResolvedValue({
      timezone: 'America/Chicago',
      tonightPickCache: null,
      subscriptionStatus: 'free',
      isAdmin: false,
    });
    watchlistItemListFindMany.mockResolvedValue([listRow('a', 'One'), listRow('b', 'Two')]);
    const res = await GET(new NextRequest('http://localhost/api/tonight'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.empty).toBe(true);
    expect(body.claudeCalled).toBe(false);
    expect(generateTonightCandidates).not.toHaveBeenCalled();
  });

  it('serves the cached pick and does not call Claude on a second open', async () => {
    const cache = buildTonightPickCache({
      localDate: new Date().toISOString().slice(0, 10),
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate(), candidate({ id: 'c2', title: 'Zodiac' })],
    });
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      tonightPickCache: cache,
      subscriptionStatus: 'free',
      isAdmin: false,
    });
    watchlistItemListFindMany.mockResolvedValue(fiveItems());
    const res = await GET(new NextRequest('http://localhost/api/tonight'));
    const body = await res.json();
    expect(body.fromCache).toBe(true);
    expect(body.claudeCalled).toBe(false);
    expect(body.pick.title).toBe('Heat');
    expect(generateTonightCandidates).not.toHaveBeenCalled();
  });

  it('hides Pro actions for free users even when a cache exists', async () => {
    const cache = buildTonightPickCache({
      localDate: new Date().toISOString().slice(0, 10),
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate()],
    });
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      tonightPickCache: cache,
      subscriptionStatus: 'free',
      isAdmin: false,
    });
    watchlistItemListFindMany.mockResolvedValue(fiveItems());
    const res = await GET(new NextRequest('http://localhost/api/tonight'));
    const body = await res.json();
    expect(body.isPro).toBe(false);
    expect(body.context).toEqual(DEFAULT_TONIGHT_CONTEXT);
  });
});

describe('POST /api/tonight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseRouteUser.mockResolvedValue({ id: 'user-1' });
    watchlistFindFirst.mockResolvedValue({ id: 'wl-1' });
    watchlistItemListFindMany.mockResolvedValue(fiveItems());
    userUpdate.mockResolvedValue({});
  });

  it('cycles Not tonight without calling Claude for Pro', async () => {
    const cache = buildTonightPickCache({
      localDate: new Date().toISOString().slice(0, 10),
      context: DEFAULT_TONIGHT_CONTEXT,
      candidates: [candidate({ id: 'c1' }), candidate({ id: 'c2', title: 'Zodiac' })],
    });
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      tonightPickCache: cache,
      subscriptionStatus: 'active',
      isAdmin: false,
    });
    const res = await POST(
      new NextRequest('http://localhost/api/tonight', {
        method: 'POST',
        body: JSON.stringify({ action: 'not_tonight' }),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.claudeCalled).toBe(false);
    expect(body.pick.id).toBe('c2');
    expect(generateTonightCandidates).not.toHaveBeenCalled();
  });

  it('rejects Not tonight and Pick again for free users', async () => {
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      tonightPickCache: null,
      subscriptionStatus: 'free',
      isAdmin: false,
    });
    const notTonight = await POST(
      new NextRequest('http://localhost/api/tonight', {
        method: 'POST',
        body: JSON.stringify({ action: 'not_tonight' }),
      })
    );
    const pickAgain = await POST(
      new NextRequest('http://localhost/api/tonight', {
        method: 'POST',
        body: JSON.stringify({ action: 'pick_again' }),
      })
    );
    expect(notTonight.status).toBe(403);
    expect(pickAgain.status).toBe(403);
    expect(generateTonightCandidates).not.toHaveBeenCalled();
  });

  it('Pick again calls Claude for Pro', async () => {
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      tonightPickCache: null,
      subscriptionStatus: 'active',
      isAdmin: false,
    });
    generateTonightCandidates.mockResolvedValue({
      candidates: [candidate({ id: 'n1', title: 'New Pick' })],
      claudeCalled: true,
    });
    const res = await POST(
      new NextRequest('http://localhost/api/tonight', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pick_again',
          context: { time: '45m', who: 'kids', energy: 'low' },
        }),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.claudeCalled).toBe(true);
    expect(body.pick.title).toBe('New Pick');
    expect(generateTonightCandidates).toHaveBeenCalled();
  });
});
