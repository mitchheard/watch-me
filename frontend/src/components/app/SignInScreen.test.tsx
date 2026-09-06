import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

import SignInScreen from './SignInScreen';
import { useAuth } from '@/contexts/AuthContext';
import { AGE_ATTESTATION_LABEL } from '@/lib/age-attestation';

const mockedUseAuth = vi.mocked(useAuth);

describe('SignInScreen 18+ attestation', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('blocks Google OAuth until the 18+ checkbox is checked', () => {
    const loginWithGoogle = vi.fn();
    mockedUseAuth.mockReturnValue({ loginWithGoogle } as unknown as ReturnType<typeof useAuth>);

    render(<SignInScreen />);

    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toHaveProperty('disabled', true);
    fireEvent.click(button);
    expect(loginWithGoogle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(AGE_ATTESTATION_LABEL));
    expect(button).toHaveProperty('disabled', false);
    fireEvent.click(button);
    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
