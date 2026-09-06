import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));
vi.mock('@/lib/umami-bootstrap', () => ({
  trackUmamiEvent: vi.fn(),
}));

import TonightHome from './TonightHome';

describe('TonightHome', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the empty-state card when the list is too small', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          empty: true,
          listCount: 2,
          isPro: false,
          watching: [],
          claudeCalled: false,
        }),
      })
    );

    render(<TonightHome />);
    expect(await screen.findByText(/add a few more/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /^add$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /not tonight/i })).toBeNull();
  });

  it('shows the pick with reasoning for free users and hides Pro actions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          empty: false,
          isPro: false,
          context: { time: '2h', who: 'solo', energy: 'medium' },
          pick: {
            id: 'c1',
            title: 'Heat',
            type: 'movie',
            year: 1995,
            runtimeMinutes: 170,
            tmdbPosterPath: '/heat.jpg',
            tmdbOverview: 'Cops.',
            certification: 'R',
            reason: 'You loved crime epics and have two hours tonight.',
          },
          watching: [],
          claudeCalled: false,
          fromCache: true,
        }),
      })
    );

    render(<TonightHome />);
    expect(await screen.findByRole('heading', { name: 'Heat' })).toBeTruthy();
    expect(screen.getByText(/you loved crime epics/i)).toBeTruthy();
    expect(screen.getByText(/tonight · about 2 hours · just you/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /start watching/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /not tonight/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /pick again/i })).toBeNull();
  });

  it('shows chips and Pro actions for Pro users', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          empty: false,
          isPro: true,
          context: { time: '2h', who: 'solo', energy: 'medium' },
          pick: {
            id: 'c1',
            title: 'Heat',
            type: 'movie',
            year: 1995,
            runtimeMinutes: 170,
            tmdbPosterPath: '/heat.jpg',
            tmdbOverview: 'Cops.',
            certification: 'R',
            reason: 'You loved crime epics.',
          },
          watching: [],
          claudeCalled: false,
          fromCache: true,
        }),
      })
    );

    render(<TonightHome />);
    expect(await screen.findByRole('button', { name: /not tonight/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /pick again/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /about 2 hours/i })).toBeTruthy();
  });
});
