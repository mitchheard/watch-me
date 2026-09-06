import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSupabaseRouteUser, userFindUnique, userUpdate } = vi.hoisted(() => ({
  getSupabaseRouteUser: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/supabase-route-auth', () => ({
  getSupabaseRouteUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      update: userUpdate,
    },
  },
}));

import { POST } from './route';
import { TIMEZONE_STALE_AFTER_MS } from '@/lib/user-timezone';

function postTimezone(timezone: unknown) {
  return POST(
    new Request('http://localhost/api/profile/timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone }),
    })
  );
}

describe('POST /api/profile/timezone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseRouteUser.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    userUpdate.mockResolvedValue({ id: 'user-1', timezone: 'America/Chicago' });
  });

  it('returns 401 when unauthenticated', async () => {
    getSupabaseRouteUser.mockResolvedValue(null);
    const res = await postTimezone('America/Chicago');
    expect(res.status).toBe(401);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid IANA timezone', async () => {
    const res = await postTimezone('Not/ARealZone');
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('populates timezone when the profile value is null', async () => {
    userFindUnique.mockResolvedValue({ timezone: null, timezoneUpdatedAt: null });
    const res = await postTimezone('America/Chicago');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ timezone: 'America/Chicago', updated: true });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        timezone: 'America/Chicago',
        timezoneUpdatedAt: expect.any(Date),
      },
    });
  });

  it('refreshes when the stored timezone is stale', async () => {
    userFindUnique.mockResolvedValue({
      timezone: 'UTC',
      timezoneUpdatedAt: new Date(Date.now() - TIMEZONE_STALE_AFTER_MS),
    });
    const res = await postTimezone('America/New_York');
    expect(res.status).toBe(200);
    expect((await res.json()).updated).toBe(true);
    expect(userUpdate).toHaveBeenCalled();
  });

  it('does not write when a stored timezone is still fresh', async () => {
    userFindUnique.mockResolvedValue({
      timezone: 'America/Chicago',
      timezoneUpdatedAt: new Date(),
    });
    const res = await postTimezone('America/New_York');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ timezone: 'America/Chicago', updated: false });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('no-ops when the user row does not exist yet', async () => {
    userFindUnique.mockResolvedValue(null);
    const res = await postTimezone('America/Chicago');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ timezone: 'America/Chicago', updated: false });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
