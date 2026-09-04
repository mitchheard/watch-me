/** Max TMDB overview length sent to the recommender (per AVIDX-251). */
export const OVERVIEW_PROMPT_MAX = 250;

/** Target number of titles the recommender should return. */
export const RECOMMENDATIONS_PICK_TARGET = 5;

/** Never ask the model for more titles than the candidate pool contains. */
export function recommendationPickCount(candidateCount: number): number {
  if (!Number.isFinite(candidateCount) || candidateCount < 1) return 0;
  return Math.min(RECOMMENDATIONS_PICK_TARGET, Math.floor(candidateCount));
}

const SECRET_FRAGMENT = /sk-[a-z0-9-]+/gi;

function sanitizePublicErrorText(raw: string, max = 180): string {
  return raw.replace(SECRET_FRAGMENT, '[redacted]').replace(/\s+/g, ' ').trim().slice(0, max);
}

type AnthropicLikeError = {
  status?: number;
  error?: { type?: string; message?: string };
  message?: string;
  cause?: unknown;
};

function unwrapLlmError(error: unknown): { status?: number; type: string; message: string } {
  let current: unknown = error;
  let status: number | undefined;
  let type = '';
  let message = '';

  for (let i = 0; i < 5 && current; i++) {
    const obj = current as AnthropicLikeError & {
      recommendationsDebugPartial?: { error?: string };
    };
    if (typeof obj.status === 'number') status = obj.status;
    if (obj.error?.type) type = obj.error.type;
    const candidate =
      obj.error?.message ||
      obj.recommendationsDebugPartial?.error ||
      (obj.message && obj.message !== 'Failed to generate recommendations' ? obj.message : '');
    if (candidate && !message) message = candidate;
    current = obj.cause;
  }

  return { status, type, message };
}

/** Safe, user-visible explanation for why the recommender fell back. */
export function describeRecommendationsFailure(error: unknown): {
  code: string;
  publicMessage: string;
} {
  const { status, type, message } = unwrapLlmError(error);
  const detail = sanitizePublicErrorText(message);
  const lower = `${type} ${detail}`.toLowerCase();
  const suffix = detail
    ? ` (${detail}); showing picks from your want-to-watch list.`
    : '; showing picks from your want-to-watch list.';

  if (lower.includes('no llm api key') || lower.includes('anthropic_api_key is not set')) {
    return {
      code: 'missing_api_key',
      publicMessage:
        'ANTHROPIC_API_KEY is not set on the server; showing picks from your want-to-watch list.',
    };
  }
  if (status === 401 || lower.includes('authentication') || lower.includes('invalid x-api-key')) {
    return {
      code: 'anthropic_unauthorized',
      publicMessage: `The Anthropic API key was rejected${suffix}`,
    };
  }
  if (status === 404 || lower.includes('not_found') || lower.includes('model:')) {
    return {
      code: 'anthropic_model',
      publicMessage: `The AI model is unavailable${suffix}`,
    };
  }
  if (status === 402 || lower.includes('credit') || lower.includes('billing')) {
    return {
      code: 'anthropic_billing',
      publicMessage: `The Anthropic account cannot complete this request${suffix}`,
    };
  }
  if (lower.includes('no json array') || lower.includes('invalid json') || lower.includes('json_parse')) {
    return {
      code: 'json_parse',
      publicMessage: `Could not parse the AI response${suffix}`,
    };
  }
  if (status === 400 || status === 422) {
    return {
      code: 'anthropic_bad_request',
      publicMessage: `The AI request was rejected${suffix}`,
    };
  }
  if (status && status >= 400) {
    return {
      code: 'anthropic_http',
      publicMessage: `Could not reach the AI model (HTTP ${status}${detail ? `: ${detail}` : ''}); showing picks from your want-to-watch list.`,
    };
  }
  return {
    code: 'llm_pipeline',
    publicMessage: `Could not reach the AI model${suffix}`,
  };
}

/** Hidden-gems framing vs mainstream (tune in AVIDX-258). */
export const HIDDEN_GEM_VOTE_COUNT_THRESHOLD = 10_000;

/** When `hour` query param is missing or invalid (AVIDX-256). */
export const RECOMMENDATIONS_TIME_OF_DAY_FALLBACK = 'evening';

/**
 * Local-hour (0–23) bucket for recommender prompt copy.
 * Boundaries per AVIDX-256; midnight–4:59 never maps to "morning".
 */
export function timeOfDayBucketFromLocalHour(hour: number): string {
  const h = Math.floor(hour);
  if (h < 0 || h > 23 || !Number.isFinite(hour)) return RECOMMENDATIONS_TIME_OF_DAY_FALLBACK;

  if (h >= 21 || h <= 1) return 'late night';
  if (h >= 2 && h < 5) return 'overnight';
  if (h >= 5 && h < 8) return 'early morning';
  if (h >= 8 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'midday';
  if (h >= 14 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return RECOMMENDATIONS_TIME_OF_DAY_FALLBACK;
}

/** Parse `hour` query param: integer 0–23, else null. */
export function parseRecommendationsHourParam(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > 23) return null;
  return n;
}

export function trimOverview(text: string | null | undefined, max = OVERVIEW_PROMPT_MAX): string {
  if (!text?.trim()) return '';
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export type ProfileAnchorRow = {
  title: string;
  rating: string | null;
  status: string;
};

function ratingRank(rating: string | null): number {
  if (rating === 'loved') return 3;
  if (rating === 'liked') return 2;
  return 0;
}

/**
 * Top finished titles (loved/liked only), then pad with loved want-to-watch if fewer than `minAnchors`.
 */
export function pickProfileAnchors(
  finishedRows: ProfileAnchorRow[],
  wantToWatchLoved: ProfileAnchorRow[],
  minAnchors = 3,
  maxAnchors = 5
): ProfileAnchorRow[] {
  const finishedRated = finishedRows.filter(
    (r) => r.status === 'finished' && (r.rating === 'loved' || r.rating === 'liked')
  );
  const sorted = [...finishedRated].sort(
    (a, b) => ratingRank(b.rating) - ratingRank(a.rating) || a.title.localeCompare(b.title)
  );
  const out: ProfileAnchorRow[] = sorted.slice(0, maxAnchors);
  if (out.length >= minAnchors) return out;

  const titles = new Set(out.map((r) => r.title.toLowerCase()));
  const lovedWtw = wantToWatchLoved.filter(
    (r) => r.status === 'want-to-watch' && r.rating === 'loved' && !titles.has(r.title.toLowerCase())
  );
  for (const row of lovedWtw) {
    if (out.length >= maxAnchors) break;
    out.push(row);
    titles.add(row.title.toLowerCase());
  }
  return out;
}

/** One-sentence reason guidance keyed by strategy `name` from route.ts */
export function strategyReasonGuidance(strategyName: string): string {
  const key = strategyName.toLowerCase().trim();
  const map: Record<string, string> = {
    'recent additions':
      'Reference that the title was freshly added to their list and why it deserves attention now.',
    'highly rated similar':
      'Connect the pick to a specific finished title they rated highly (name it) and what carries over. You may use the candidate row `rating` together with `vote_count`: high rating plus lower vote_count suggests acclaimed-but-niche; high rating plus very high vote_count suggests broad consensus.',
    'quick wins':
      'Mention runtime or season count and why it fits a short viewing slot. You may reference popularity when it helps justify a buzzy, easy short watch.',
    'deep dives':
      'Speak to depth, world-building, or why the time commitment pays off. When helpful, contrast strong critical or taste signals with vote_count to avoid calling obviously mainstream epics "overlooked."',
    'mood boosters':
      'Lead with tone—warmth, levity, or energy—and why it lifts the mood.',
    'hidden gems':
      `Only claim a title is underrated, overlooked, or a hidden gem if its vote_count is below ${HIDDEN_GEM_VOTE_COUNT_THRESHOLD.toLocaleString('en-US')}. For titles with higher vote_count, frame the reason around something specific about the show or movie (overview, tone, runtime, taste anchor connection) without claiming it is underrated. If no candidate has vote_count below ${HIDDEN_GEM_VOTE_COUNT_THRESHOLD.toLocaleString('en-US')}, lead with what makes each pick interesting rather than forcing the hidden-gem frame. If vote_count is n/a, do not lean on popularity claims; stay concrete from overview and metadata.`,
    'continue watching':
      'Reference that they started or finished it and what is waiting in the next stretch or season.',
    fallback:
      'Ground each reason in overview detail or metadata and how it fits their list right now.',
  };
  return map[key] ?? map.fallback;
}
