import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allowRecommendationsDebugChrome,
  isRecommendationsProdSurface,
  shouldAttachRecommendationsApiDebug,
} from './recommendations-debug-env';

describe('isRecommendationsProdSurface', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is false in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    expect(isRecommendationsProdSurface()).toBe(false);
  });

  it('is true for local production build (next start) without preview env', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    expect(isRecommendationsProdSurface()).toBe(true);
  });

  it('is true when VERCEL_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(isRecommendationsProdSurface()).toBe(true);
  });

  it('is false on Vercel preview with production NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(isRecommendationsProdSurface()).toBe(false);
  });
});

describe('shouldAttachRecommendationsApiDebug', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is false in production even when RECOMMENDATIONS_DEBUG is true', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    vi.stubEnv('RECOMMENDATIONS_DEBUG', 'true');
    expect(shouldAttachRecommendationsApiDebug()).toBe(false);
  });

  it('is true in development when RECOMMENDATIONS_DEBUG is true', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RECOMMENDATIONS_DEBUG', 'true');
    expect(shouldAttachRecommendationsApiDebug()).toBe(true);
  });

  it('is false when flag is not true', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RECOMMENDATIONS_DEBUG', 'false');
    expect(shouldAttachRecommendationsApiDebug()).toBe(false);
  });
});

describe('allowRecommendationsDebugChrome', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('mirrors non-prod surface for dev UI', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(allowRecommendationsDebugChrome()).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    expect(allowRecommendationsDebugChrome()).toBe(false);
  });
});
