import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn() },
}));

import SettingsClient from './SettingsClient';
import { useAuth } from '@/contexts/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

const user = { id: 'user-1', email: 'pro@example.com' };

let subscriptionPayload: Record<string, unknown> = {};

describe('SettingsClient subscription states (AVIDX-269)', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user,
      loginWithGoogle: vi.fn(),
    } as ReturnType<typeof useAuth>);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/user/subscription')) {
          return Promise.resolve({
            ok: true,
            json: async () => subscriptionPayload,
          });
        }
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    subscriptionPayload = {};
  });

  it('shows free-tier upgrade UI', async () => {
    subscriptionPayload = {
      subscriptionStatus: 'free',
      subscriptionPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isPro: false,
    };

    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeTruthy();
    });
  });

  it('shows renewing Pro copy', async () => {
    subscriptionPayload = {
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: '2027-05-17T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      isPro: true,
    };

    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByText(/renews on/i)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /resume subscription/i })).toBeNull();
  });

  it('shows canceling Pro copy and resume CTA', async () => {
    subscriptionPayload = {
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: '2027-05-18T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      isPro: true,
    };

    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByText(/cancels on/i)).toBeTruthy();
    });
    expect(screen.getByText(/keep pro access until then/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /resume subscription/i })).toBeTruthy();
  });

  it('returns to free UI after subscription expires', async () => {
    subscriptionPayload = {
      subscriptionStatus: 'canceled',
      subscriptionPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isPro: false,
    };

    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeTruthy();
    });
  });
});
