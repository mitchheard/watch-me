import {
  DEFAULT_TONIGHT_CONTEXT,
  parseTonightContext,
  type TonightContext,
} from './tonight-context';

/** Don't call Claude below this list size (AVIDX-350). */
export const TONIGHT_MIN_LIST_SIZE = 5;

/** Candidates generated per Claude call; UI shows one at a time. */
export const TONIGHT_CANDIDATE_COUNT = 3;

/** Free-tier nudge threshold on the watchlist header (AVIDX-107 §6 / AVIDX-311). */
export const FREE_WATCHLIST_NUDGE_AT = 45;

export type TonightCandidate = {
  id: string;
  title: string;
  type: string;
  year: number | null;
  runtimeMinutes: number | null;
  tmdbPosterPath: string | null;
  tmdbOverview: string | null;
  certification: string | null;
  reason: string;
};

export type TonightPickCache = {
  localDate: string;
  generatedAt: string;
  context: TonightContext;
  shownIndex: number;
  candidates: TonightCandidate[];
};

function isCandidate(raw: unknown): raw is TonightCandidate {
  if (!raw || typeof raw !== 'object') return false;
  const rec = raw as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    rec.id.length > 0 &&
    typeof rec.title === 'string' &&
    rec.title.length > 0 &&
    typeof rec.type === 'string' &&
    typeof rec.reason === 'string' &&
    rec.reason.length > 0 &&
    (rec.year === null || typeof rec.year === 'number') &&
    (rec.runtimeMinutes === null || typeof rec.runtimeMinutes === 'number') &&
    (rec.tmdbPosterPath === null || typeof rec.tmdbPosterPath === 'string') &&
    (rec.tmdbOverview === null || typeof rec.tmdbOverview === 'string') &&
    (rec.certification === null || typeof rec.certification === 'string')
  );
}

export function parseTonightPickCache(raw: unknown): TonightPickCache | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const context = parseTonightContext(rec.context) ?? DEFAULT_TONIGHT_CONTEXT;
  if (typeof rec.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.localDate)) return null;
  if (typeof rec.generatedAt !== 'string' || Number.isNaN(Date.parse(rec.generatedAt))) return null;
  if (!Array.isArray(rec.candidates) || rec.candidates.length === 0) return null;
  const candidates = rec.candidates.filter(isCandidate);
  if (candidates.length === 0) return null;
  const shownIndex =
    typeof rec.shownIndex === 'number' && Number.isFinite(rec.shownIndex)
      ? Math.max(0, Math.min(candidates.length - 1, Math.floor(rec.shownIndex)))
      : 0;
  return {
    localDate: rec.localDate,
    generatedAt: rec.generatedAt,
    context,
    shownIndex,
    candidates,
  };
}

export function isTonightCacheFresh(cache: TonightPickCache, localDate: string): boolean {
  return cache.localDate === localDate && cache.candidates.length > 0;
}

export function nextTonightShownIndex(current: number, count: number): number {
  if (count <= 1) return 0;
  return (current + 1) % count;
}

export function visibleTonightCandidate(cache: TonightPickCache): TonightCandidate {
  return cache.candidates[Math.min(cache.shownIndex, cache.candidates.length - 1)];
}

export function buildTonightPickCache(opts: {
  localDate: string;
  generatedAt?: Date;
  context: TonightContext;
  candidates: TonightCandidate[];
  shownIndex?: number;
}): TonightPickCache {
  const candidates = opts.candidates.slice(0, TONIGHT_CANDIDATE_COUNT);
  return {
    localDate: opts.localDate,
    generatedAt: (opts.generatedAt ?? new Date()).toISOString(),
    context: opts.context,
    shownIndex: opts.shownIndex ?? 0,
    candidates,
  };
}
