import { describe, expect, it } from 'vitest';
import { FREE_WATCHLIST_NUDGE_AT } from '@/lib/tonight-cache';
import { FREE_WATCHLIST_ITEM_LIMIT } from '@/lib/subscription';

describe('free-tier watchlist nudge', () => {
  it('nudges at 45 of 50', () => {
    expect(FREE_WATCHLIST_NUDGE_AT).toBe(45);
    expect(FREE_WATCHLIST_ITEM_LIMIT).toBe(50);
  });
});
