import { StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Mock everything page.tsx pulls in that isn't relevant to the auto-fetch gate.
// Visual concerns (icons, Image, Link, debug toolbar) become inert renderers; we
// only care that mounting the page kicks off exactly one /api/recommendations
// call even when `user` gets a new reference (e.g. Supabase TOKEN_REFRESHED).
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('next/image', () => ({
  default: () => null,
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: () => null,
  ClockIcon: () => null,
  HeartIcon: () => null,
  EyeIcon: () => null,
}));
vi.mock('./RecommendationsDebugToolbar', () => ({
  RecommendationsDebugToolbar: () => null,
}));
vi.mock('@/lib/umami-bootstrap', () => ({
  trackUmamiEvent: vi.fn(),
}));
vi.mock('@/lib/recommendations-debug-env', () => ({
  allowRecommendationsDebugChrome: () => false,
}));

import RecommendationsPage from './page';
import { useAuth } from '@/contexts/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function makeUser(overrides: Partial<{ id: string; email: string }> = {}) {
  // Returning a fresh object simulates the new reference that Supabase produces
  // on every onAuthStateChange firing.
  return {
    id: 'user-1',
    email: 'test@example.com',
    ...overrides,
  };
}

const recommendationsResponse = {
  recommendations: [],
  totalItems: 0,
  strategy: 'recent additions',
  strategyFocus: 'focus on your most recently added items',
  phase: 'llm-success',
};

describe('RecommendationsPage auto-fetch gate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => recommendationsResponse,
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function recommendationsCallCount() {
    return fetchMock.mock.calls.filter(([url]) =>
      typeof url === 'string' && url.startsWith('/api/recommendations')
    ).length;
  }

  it('auto-fetches exactly once on mount even under StrictMode double-invoke', async () => {
    mockedUseAuth.mockReturnValue({ user: makeUser() } as ReturnType<typeof useAuth>);

    render(
      <StrictMode>
        <RecommendationsPage />
      </StrictMode>
    );

    await waitFor(() => expect(recommendationsCallCount()).toBeGreaterThan(0));
    // Give any extra effects a chance to (incorrectly) fire a second fetch.
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(recommendationsCallCount()).toBe(1);
  });

  it('does not re-fetch when `user` is replaced with a new object reference', async () => {
    // Supabase emits onAuthStateChange (INITIAL_SESSION, then TOKEN_REFRESHED after the
    // route-handler refreshes auth cookies), which calls setUser with a freshly-built
    // User object each time. The auto-fetch must only fire once for the first valid user.
    mockedUseAuth.mockReturnValue({ user: makeUser() } as ReturnType<typeof useAuth>);

    const { rerender } = render(<RecommendationsPage />);

    await waitFor(() => expect(recommendationsCallCount()).toBe(1));

    // Three more re-renders, each handing the component a freshly-built user object.
    for (let i = 0; i < 3; i++) {
      mockedUseAuth.mockReturnValue({ user: makeUser() } as ReturnType<typeof useAuth>);
      rerender(<RecommendationsPage />);
    }

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(recommendationsCallCount()).toBe(1);
  });

  it('skips the auto-fetch entirely when `user` is null', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    render(<RecommendationsPage />);
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(recommendationsCallCount()).toBe(0);
  });

  it('auto-fetches once when `user` resolves from null after mount', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    const { rerender } = render(<RecommendationsPage />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(recommendationsCallCount()).toBe(0);

    mockedUseAuth.mockReturnValue({ user: makeUser() } as ReturnType<typeof useAuth>);
    rerender(<RecommendationsPage />);

    await waitFor(() => expect(recommendationsCallCount()).toBe(1));

    // And another reference churn after auth resolves should still not refetch.
    mockedUseAuth.mockReturnValue({ user: makeUser() } as ReturnType<typeof useAuth>);
    rerender(<RecommendationsPage />);
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(recommendationsCallCount()).toBe(1);
  });
});
