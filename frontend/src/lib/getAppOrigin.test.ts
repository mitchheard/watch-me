import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getAppOrigin } from './getAppOrigin';

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe('getAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers x-forwarded-host over localhost nextUrl origin', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://gowatchme.app');
    const request = req('https://localhost:10000/auth/callback', {
      'x-forwarded-host': 'gowatchme.app',
      'x-forwarded-proto': 'https',
      host: 'localhost:10000',
    });
    expect(getAppOrigin(request)).toBe('https://gowatchme.app');
  });

  it('uses public Host when forwarded host is missing', () => {
    const request = req('https://localhost:10000/auth/callback', {
      host: 'gowatchme.app',
      'x-forwarded-proto': 'https',
    });
    expect(getAppOrigin(request)).toBe('https://gowatchme.app');
  });

  it('falls back to NEXTAUTH_URL when only localhost is visible', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://gowatchme.app');
    const request = req('https://localhost:10000/auth/callback', {
      host: 'localhost:10000',
    });
    expect(getAppOrigin(request)).toBe('https://gowatchme.app');
  });

  it('does not prefer NEXTAUTH_URL Render hostname over custom Host', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://watch-me-app.onrender.com');
    const request = req('https://gowatchme.app/auth/callback', {
      host: 'gowatchme.app',
      'x-forwarded-proto': 'https',
    });
    expect(getAppOrigin(request)).toBe('https://gowatchme.app');
  });

  it('allows localhost in local development', () => {
    delete process.env.NEXTAUTH_URL;
    const request = req('http://localhost:3000/auth/callback', {
      host: 'localhost:3000',
    });
    expect(getAppOrigin(request)).toBe('http://localhost:3000');
  });
});
