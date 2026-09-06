import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/lib/umami-bootstrap', () => ({
  trackUmamiEvent: vi.fn(),
}));

import WatchlistLibrary from './WatchlistLibrary';

const titles = Array.from({ length: 45 }, (_, i) => ({
  id: `id-${i}`,
  title: `Title ${i}`,
  type: 'movie',
  status: 'want-to-watch',
  rating: null,
  notes: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  tmdbPosterPath: `/p${i}.jpg`,
  tmdbOverview: null,
  tmdbMovieReleaseYear: 2020,
  tmdbTvFirstAirYear: null,
  tmdbMovieRuntime: 100,
  tmdbMovieCertification: 'PG-13',
  tmdbTvCertification: null,
}));

describe('WatchlistLibrary', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the quiet 45-of-50 nudge for free users', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/watchlist')) {
          return Promise.resolve({ ok: true, json: async () => titles });
        }
        if (url.includes('/api/user/subscription')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ isPro: false, hasProAccess: false }),
          });
        }
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );

    render(<WatchlistLibrary />);
    expect(await screen.findByText(/45 titles/i)).toBeTruthy();
    expect(await screen.findByText(/45 of 50/i)).toBeTruthy();
  });

  it('does not nudge Pro users', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/watchlist')) {
          return Promise.resolve({ ok: true, json: async () => titles });
        }
        if (url.includes('/api/user/subscription')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ isPro: true, hasProAccess: true }),
          });
        }
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );

    render(<WatchlistLibrary />);
    await waitFor(() => {
      expect(screen.getByText(/45 titles/i)).toBeTruthy();
    });
    expect(screen.queryByText(/45 of 50/i)).toBeNull();
  });
});
