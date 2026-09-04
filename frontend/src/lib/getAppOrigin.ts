import type { NextRequest } from 'next/server';

function isLocalHost(hostOrUrl: string): boolean {
  try {
    const hostname = hostOrUrl.includes('://')
      ? new URL(hostOrUrl).hostname
      : hostOrUrl.split(':')[0];
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  } catch {
    return hostOrUrl.includes('localhost') || hostOrUrl.includes('127.0.0.1');
  }
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, '');
}

function originFromHost(host: string, proto: string): string {
  const cleanHost = host.split(',')[0].trim();
  return normalizeOrigin(`${proto}://${cleanHost}`);
}

/**
 * Public origin for post-auth redirects.
 *
 * On Render the process listens on localhost:10000, so `request.nextUrl.origin`
 * can be https://localhost:10000 even when the browser hit gowatchme.app.
 * Prefer forwarded / Host headers and NEXTAUTH_URL when those are public.
 */
export function getAppOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'https';

  if (forwardedHost && !isLocalHost(forwardedHost)) {
    return originFromHost(forwardedHost, forwardedProto);
  }

  const host = request.headers.get('host');
  if (host && !isLocalHost(host)) {
    return originFromHost(host, forwardedProto);
  }

  const envUrl = process.env.NEXTAUTH_URL?.trim();
  if (envUrl && !isLocalHost(envUrl)) {
    return normalizeOrigin(envUrl);
  }

  const nextOrigin = request.nextUrl.origin;
  if (nextOrigin && !isLocalHost(nextOrigin)) {
    return normalizeOrigin(nextOrigin);
  }

  // Local development: localhost is expected.
  if (envUrl) {
    return normalizeOrigin(envUrl);
  }
  if (nextOrigin) {
    return normalizeOrigin(nextOrigin);
  }
  if (host) {
    const proto = isLocalHost(host) ? 'http' : forwardedProto;
    return originFromHost(host, proto);
  }

  throw new Error('Could not determine app origin for auth redirect');
}
