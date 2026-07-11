import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { parseRecommendationArray } from './json-utils';
import {
  parseRecommendationsHourParam,
  pickProfileAnchors,
  RECOMMENDATIONS_TIME_OF_DAY_FALLBACK,
  strategyReasonGuidance,
  timeOfDayBucketFromLocalHour,
  trimOverview,
  type ProfileAnchorRow,
} from './recommendations-helpers';
import { shouldAttachRecommendationsApiDebug } from '@/lib/recommendations-debug-env';
import { getUserSubscription, hasProAccess } from '@/lib/subscription';

// Simple in-memory cache (in production, use Redis or similar)
const recommendationCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 1 * 1000; // 1 second (minimal cache for maximum variety)

/** Want-to-watch rows loaded for recommender candidates (AVIDX-257; matches free-tier list cap). */
const RECOMMENDATIONS_WANT_TO_WATCH_FETCH_LIMIT = 50;

/** One JSON line per failure — easy to grep in Render; no secrets or raw prompts */
function logRecommendationsFailure(
  phase: string,
  fields: Record<string, string | number | boolean | undefined | null> = {}
): void {
  console.log(
    JSON.stringify({
      event: 'recommendations_ai_failure',
      phase,
      ts: new Date().toISOString(),
      ...fields,
    })
  );
}

function logRecommendationsApiError(
  phase: string,
  fields: Record<string, string | number | boolean | undefined | null> = {}
): void {
  console.log(
    JSON.stringify({
      event: 'recommendations_api_error',
      phase,
      ts: new Date().toISOString(),
      ...fields,
    })
  );
}

interface WatchItem {
  id: string; // Changed from number to string for CUID
  title: string;
  type: string;
  status: string;
  rating: string | null;
  notes?: string | null;
  tmdbPosterPath: string | null;
  tmdbOverview: string | null;
  tmdbMovieReleaseYear: number | null;
  tmdbTvFirstAirYear: number | null;
  tmdbMovieRuntime: number | null;
  tmdbTvNumberOfSeasons: number | null;
  tmdbPopularity: number | null;
  tmdbVoteCount: number | null;
  createdAt?: Date | null;
}

interface Recommendation {
  id: string; // Changed from number to string for CUID
  title: string;
  type: string;
  status: string;
  reason: string;
  confidence: number;
  tmdbPosterPath?: string | null;
  tmdbOverview?: string | null;
  tmdbMovieReleaseYear?: number | null;
  tmdbTvFirstAirYear?: number | null;
  tmdbMovieRuntime?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
  createdAt?: string | null;
}

interface AIRecommendation {
  id: string; // Changed from number to string for CUID
  title: string;
  reason: string;
  confidence: number;
}

/**
 * Included in GET JSON only when RECOMMENDATIONS_DEBUG=true and the deployment is not a
 * production surface (see shouldAttachRecommendationsApiDebug / AVIDX-266).
 */
export type RecommendationsApiDebugPayload = {
  llmUsed: string;
  /** Anthropic `system` parameter (stable, cache-eligible). */
  systemPrompt: string | null;
  /** Anthropic user message content. */
  userPrompt: string | null;
  rawResponse: string | null;
  llmLatencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  phase?: string;
  error?: string;
  /** Present when RECOMMENDATIONS_DEBUG=true (AVIDX-256). */
  requestContext?: {
    clientHour: number | null;
    clientTimeZone: string | null;
    timeOfDayBucket: string;
  };
};

interface LlmCallResult {
  rawText: string;
  provider: 'anthropic';
  model: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

class RecommendationsInferenceError extends Error {
  readonly recommendationsDebugPartial: RecommendationsApiDebugPayload;

  constructor(partial: RecommendationsApiDebugPayload) {
    super('Failed to generate recommendations');
    this.name = 'RecommendationsInferenceError';
    this.recommendationsDebugPartial = partial;
  }
}

function llmUsedLabel(llm?: LlmCallResult): string {
  if (llm) return `${llm.provider}:${llm.model}`;
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic:(failed before/with request)';
  return '(no LLM credentials)';
}

/** Stable system prompt — identical across calls for Anthropic prompt caching (AVIDX-251). */
const RECOMMENDATIONS_SYSTEM_PROMPT = `You are Watch Me's recommender. You only recommend rows from the numbered candidate list supplied in the user message. Pick exactly five different candidates and return a single JSON array (no markdown code fences, no commentary outside JSON).

## Output shape
The array must contain exactly five objects. Each object has:
- "id" (string): the exact id field from the chosen candidate row.
- "title" (string): the exact title field from that same candidate row.
- "reason" (string): two or three sentences.
- "confidence" (number): between 0.1 and 1.0 inclusive.

Illustrative placeholder example — do not echo these values in a real answer:
[{"id":"cjd01example","title":"Example Film Alpha","reason":"First sentence with a concrete hook from the overview or metadata. Second sentence ties to viewer taste or strategy.","confidence":0.84},{"id":"cjd02exampleb","title":"Example Series Beta","reason":"...","confidence":0.71}]

## Validation rules
- Never invent titles or ids; never pull items that are not in the candidate list.
- Each object's id and title must refer to the same list row.
- Do not use generic numeric ids such as 1, 2, 3 unless they literally appear as candidate ids (they will not).

## Reason quality bar
- Tie reasons to concrete material when present: plot or tone from the overview text, runtime or season count, parallels to named finished favorites from the user message, and the per-strategy reason guidance from the user message.
- Avoid hollow lines such as "fans of the genre will enjoy", "looks good", "might enjoy", "perfect choice", "exactly what you're in the mood for", or "based on your watchlist" without naming specific titles or on-list details.

## Textured examples of the voice (do not copy phrasing)
- "The overview leans into slow-burn institutional dread; if Station Eleven landed for you, the 45-minute episodes keep commitment modest for a weeknight."
- "You liked Paddington 2 — the warmth in the logline here is less precious, but the benevolent mischief and short run time match a mood-booster pass."`;

function inferWeakTags(item: WatchItem): string {
  const t = item.title.toLowerCase();
  if (t.includes('horror') || t.includes('scary')) return 'Horror lean';
  if (t.includes('comedy') || t.includes('funny')) return 'Comedy lean';
  if (t.includes('drama') || t.includes('serious')) return 'Drama lean';
  const year = item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear;
  if (year && year > 2020) return 'Recent era';
  if (year && year < 2000) return 'Classic era';
  return 'General';
}

function buildUserProfileBlock(anchors: ProfileAnchorRow[], shuffledWatchlist: WatchItem[]): string {
  const lines: string[] = [];
  if (anchors.length > 0) {
    lines.push('Strong taste anchors (reference by name when useful):');
    for (const a of anchors) {
      const bucket = a.status === 'finished' ? 'finished' : 'want-to-watch (loved)';
      lines.push(`- ${a.title} — ${bucket}${a.rating ? ` — ${a.rating}` : ''}`);
    }
  } else {
    lines.push(
      'Strong taste anchors: none listed (new or sparse history — lean on overviews and metadata; do not invent finished favorites).'
    );
  }
  const tags = [...new Set(shuffledWatchlist.map(inferWeakTags))];
  lines.push(`Weak-signal tags inferred from candidate titles/years: ${tags.join(', ')}`);
  lines.push(`Content types in this candidate pool: ${[...new Set(shuffledWatchlist.map((i) => i.type))].join(', ') || 'mixed'}`);
  lines.push(
    `Candidate-pool spotlight: ${shuffledWatchlist
      .slice(0, 5)
      .map((item) => `${item.title} (${item.type}${item.rating ? `, ${item.rating}` : ''})`)
      .join('; ')}`
  );
  return lines.join('\n');
}

function formatCandidateLine(index: number, item: WatchItem): string {
  const year = item.tmdbMovieReleaseYear ?? item.tmdbTvFirstAirYear;
  const yearPart = year != null ? String(year) : 'unknown year';
  let lengthPart: string;
  if (item.type === 'movie') {
    lengthPart =
      item.tmdbMovieRuntime != null && item.tmdbMovieRuntime > 0
        ? `${item.tmdbMovieRuntime} min`
        : 'runtime unknown';
  } else {
    lengthPart =
      item.tmdbTvNumberOfSeasons != null && item.tmdbTvNumberOfSeasons > 0
        ? `${item.tmdbTvNumberOfSeasons} season(s)`
        : 'season count unknown';
  }
  const notes = item.notes?.trim();
  const notesTrim =
    notes && notes.length > 180 ? `${notes.slice(0, 177).trimEnd()}…` : notes ?? '';
  const overviewEsc = trimOverview(item.tmdbOverview);
  const rating = item.rating?.trim() || 'none';
  const popularityPart =
    item.tmdbPopularity != null && Number.isFinite(item.tmdbPopularity)
      ? String(item.tmdbPopularity)
      : 'n/a';
  const voteCountPart =
    item.tmdbVoteCount != null && Number.isFinite(item.tmdbVoteCount)
      ? String(item.tmdbVoteCount)
      : 'n/a';
  const parts = [
    `${index}. id=${item.id}`,
    `title=${JSON.stringify(item.title)}`,
    `type=${item.type}`,
    `list_status=${item.status}`,
    `rating=${rating}`,
    `year=${yearPart}`,
    `length=${lengthPart}`,
    `popularity=${popularityPart}`,
    `vote_count=${voteCountPart}`,
  ];
  if (notesTrim) parts.push(`notes=${JSON.stringify(notesTrim)}`);
  parts.push(`overview=${JSON.stringify(overviewEsc)}`);
  return parts.join(' | ');
}

async function getUserId() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }
  
  return user.id;
}

const DEFAULT_CLAUDE_RECOMMENDATIONS_MODEL = 'claude-haiku-4-5-20251001';

async function fetchRecommendationModelOutput(
  systemPrompt: string,
  userPrompt: string
): Promise<LlmCallResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const model =
    process.env.ANTHROPIC_RECOMMENDATIONS_MODEL?.trim() ||
    DEFAULT_CLAUDE_RECOMMENDATIONS_MODEL;

  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    try {
      const startedAtMs = Date.now();
      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const latencyMs = Date.now() - startedAtMs;
      const textBlock = message.content.find((block) => block.type === 'text');
      const text = textBlock?.text?.trim();
      if (!text) {
        logRecommendationsFailure('anthropic_empty_content', {
          message: 'no text content block in response',
        });
        throw new Error('No response from Anthropic');
      }
      const inputTokens = message.usage?.input_tokens ?? null;
      const outputTokens = message.usage?.output_tokens ?? null;
      const totalTokens =
        inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null;

      return {
        rawText: text,
        provider: 'anthropic',
        model,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens,
      };
    } catch (error) {
      const err = error as {
        status?: number;
        error?: { type?: string; message?: string };
        message?: string;
      };
      logRecommendationsFailure('anthropic_http', {
        httpStatus: err.status,
        anthropicErrorType: err.error?.type ?? '',
        message: (err.error?.message ?? err.message ?? 'anthropic request failed').slice(0, 240),
      });
      throw error;
    }
  }

  logRecommendationsFailure('llm_missing_api_key', {
    message: 'ANTHROPIC_API_KEY is not set',
  });
  throw new Error('No LLM API key configured');
}

async function getAIRecommendations(
  watchlist: WatchItem[],
  finishedForProfile: WatchItem[],
  includeDebug: boolean,
  requestTime: { clientHour: number | null; clientTimeZone: string | null }
): Promise<{
  recommendations: Recommendation[];
  strategy: string;
  strategyFocus: string;
  phase: string;
  debug?: RecommendationsApiDebugPayload;
}> {
  // Create different recommendation strategies with limited data subsets (optimized for speed)
  const strategies = [
    {
      name: "recent additions",
      filter: (items: WatchItem[]) => items.filter(item => item.status === 'want-to-watch').slice(0, 8),
      focus: "focus on your most recently added items"
    },
    {
      name: "highly rated similar",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 6);
      },
      focus: "prioritize items similar to what you've loved"
    },
    {
      name: "quick wins",
      filter: (items: WatchItem[]) => {
        const movies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie');
        const shortShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) <= 2);
        return [...movies, ...shortShows].slice(0, 6);
      },
      focus: "suggest quick, satisfying content you can finish soon"
    },
    {
      name: "deep dives",
      filter: (items: WatchItem[]) => {
        const longShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) > 2);
        const complexMovies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie' && (item.tmdbMovieRuntime || 0) > 120);
        return [...longShows, ...complexMovies].slice(0, 6);
      },
      focus: "recommend immersive, longer-form content for deeper engagement"
    },
    {
      name: "mood boosters",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 5);
      },
      focus: "suggest uplifting and entertaining content to improve your mood"
    },
    {
      name: "hidden gems",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        // Shuffle and take items that might be less obvious choices
        return wantToWatch.sort(() => Math.random() - 0.5).slice(0, 6);
      },
      focus: "highlight underrated or overlooked content in your list"
    },
    {
      name: "continue watching",
      filter: (items: WatchItem[]) => {
        // Find shows that are "watching" status (in progress)
        const inProgressShows = items.filter(item => 
          item.status === 'watching' && 
          item.type === 'show' && 
          item.tmdbTvNumberOfSeasons && 
          item.tmdbTvNumberOfSeasons > 1
        );
        
        // Also include shows that are "finished" but have more seasons available
        const finishedWithMoreSeasons = items.filter(item => 
          item.status === 'finished' && 
          item.type === 'show' && 
          item.tmdbTvNumberOfSeasons && 
          item.tmdbTvNumberOfSeasons > 1
        );
        
        return [...inProgressShows, ...finishedWithMoreSeasons].slice(0, 6);
      },
      focus: "suggest shows you've started or finished that have more seasons to continue"
    }
  ];

  // Try strategies until we find one with data
  const randomIndex = Math.floor(Math.random() * strategies.length);
  let randomStrategy = strategies[randomIndex];
  console.log('Selected strategy index:', randomIndex, 'Strategy:', randomStrategy.name);
  let filteredWatchlist = randomStrategy.filter(watchlist);
  
  // If the first strategy returns no data, try others
  if (filteredWatchlist.length === 0) {
    for (const strategy of strategies) {
      const testFilter = strategy.filter(watchlist);
      if (testFilter.length > 0) {
        randomStrategy = strategy;
        filteredWatchlist = testFilter;
        break;
      }
    }
  }
  
  // If still no data, use a simple fallback
  if (filteredWatchlist.length === 0) {
    filteredWatchlist = watchlist.filter(item => item.status === 'want-to-watch').slice(0, 10);
    randomStrategy = {
      name: "fallback",
      filter: (items: WatchItem[]) => items.filter(item => item.status === 'want-to-watch').slice(0, 10),
      focus: "recommend from your want-to-watch list"
    };
  }
  
  console.log('Selected strategy:', randomStrategy.name);
  console.log('Filtered watchlist length:', filteredWatchlist.length);
  
  // Shuffle the filtered watchlist to get different data each time
  const shuffledWatchlist = [...filteredWatchlist].sort(() => Math.random() - 0.5);
  console.log('Shuffled watchlist items:', shuffledWatchlist.map(item => item.title).slice(0, 5));
  console.log('Available IDs in shuffled watchlist:', shuffledWatchlist.map(item => item.id));

  const strategyFocus = randomStrategy.focus;
  const hourForBucket =
    requestTime.clientHour != null
      ? requestTime.clientHour
      : null;
  const timeContext =
    hourForBucket != null
      ? timeOfDayBucketFromLocalHour(hourForBucket)
      : RECOMMENDATIONS_TIME_OF_DAY_FALLBACK;

  const debugRequestContext = {
    clientHour: requestTime.clientHour,
    clientTimeZone: requestTime.clientTimeZone,
    timeOfDayBucket: timeContext,
  } satisfies NonNullable<RecommendationsApiDebugPayload['requestContext']>;

  const anchors = pickProfileAnchors(
    finishedForProfile.map((i) => ({ title: i.title, rating: i.rating, status: i.status })),
    watchlist.map((i) => ({ title: i.title, rating: i.rating, status: i.status }))
  );
  const profileBlock = buildUserProfileBlock(anchors, shuffledWatchlist);
  const perStrategyReasonHint = strategyReasonGuidance(randomStrategy.name);
  const candidatesLines = shuffledWatchlist.map((item, i) => formatCandidateLine(i + 1, item)).join('\n');

  const userPrompt = `## User profile
${profileBlock}

## Time
Time of day: ${timeContext}${requestTime.clientHour != null ? ` (client local hour ${requestTime.clientHour})` : ' (client hour omitted — neutral default bucket)'}

## Strategy
Name: ${randomStrategy.name}
Focus: ${strategyFocus}
Reason guidance for this strategy: ${perStrategyReasonHint}

Recommend exactly five different titles from the numbered candidate list below. Each reason must follow the strategy reason guidance and the global reason quality bar in your system instructions.

## Candidates (use only these rows; ids are authoritative)
${candidatesLines}`;

  if (includeDebug) {
    const approxChars = RECOMMENDATIONS_SYSTEM_PROMPT.length + userPrompt.length;
    console.log(
      JSON.stringify({
        event: 'recommendations_prompt_size',
        approxChars,
        candidateCount: shuffledWatchlist.length,
      })
    );
  }

  let lastLlm: LlmCallResult | undefined;

  try {
    lastLlm = await fetchRecommendationModelOutput(RECOMMENDATIONS_SYSTEM_PROMPT, userPrompt);

    let aiRecommendations: unknown[];
    try {
      aiRecommendations = parseRecommendationArray(lastLlm.rawText);
    } catch (parseErr) {
      const msg =
        parseErr instanceof Error ? parseErr.message.slice(0, 240) : 'json_parse_error';
      logRecommendationsFailure('llm_json_parse', {
        message: msg,
        contentLength: lastLlm.rawText.length,
      });
      throw parseErr;
    }

    const parsedAiRecommendations = aiRecommendations as AIRecommendation[];
    
    // Map AI recommendations back to full watchlist items
    console.log('AI recommendations received:', parsedAiRecommendations.length);
    console.log('AI recommendation IDs:', parsedAiRecommendations.map((rec: AIRecommendation) => rec.id));
    console.log('Full AI response:', JSON.stringify(parsedAiRecommendations, null, 2));
    
    // Filter out any recommendations with undefined or invalid IDs (watchlist uses CUID strings, not numeric IDs)
    let validRecommendations = parsedAiRecommendations.filter((rec: AIRecommendation) => {
      const idStr = rec.id != null ? String(rec.id).trim() : '';
      const titleStr = rec.title != null ? String(rec.title).trim() : '';
      return idStr.length > 0 && titleStr.length > 0;
    });
    
    // Additional validation: ensure the AI's title matches an item in our shuffled watchlist
    validRecommendations = validRecommendations.filter((rec: AIRecommendation) => {
      if (!rec.title) return false;
      
      const matchingItem = shuffledWatchlist.find(item => 
        item.title.toLowerCase() === rec.title.toLowerCase()
      );
      
      if (!matchingItem) {
        console.log('❌ AI title does not match any item:', rec.title);
        return false;
      }
      
      // Also verify the ID matches the title (string compare — IDs are CUIDs)
      if (String(matchingItem.id) !== String(rec.id)) {
        console.log('❌ AI ID and title mismatch:', rec.id, 'vs', matchingItem.id, 'for title:', rec.title);
        return false;
      }
      
      return true;
    });
    console.log('Valid recommendations after filtering:', validRecommendations.length);
    
    console.log('=== MAPPING DEBUG ===');
    console.log('Shuffled watchlist items and IDs:');
    shuffledWatchlist.forEach(item => {
      console.log(`  ID ${item.id}: ${item.title}`);
    });
    console.log('AI recommendations to map:');
    validRecommendations.forEach((rec: AIRecommendation) => {
      console.log(`  AI wants ID ${rec.id}: "${rec.reason.substring(0, 50)}..."`);
    });
    
    let recommendations: Recommendation[] = validRecommendations
      .map((rec: AIRecommendation): Recommendation | null => {
      // Try to find by ID in the shuffled watchlist (the items sent to AI)
      let item = shuffledWatchlist.find(w => String(w.id) === String(rec.id));
      
      // If not found by ID, try to find by title (case-insensitive)
      if (!item && rec.title) {
        item = shuffledWatchlist.find(w => w.title.toLowerCase() === rec.title.toLowerCase());
        if (item) {
          console.log('⚠️  Found item by title instead of ID:', item.title, 'ID:', item.id);
        }
      }
      
      if (!item) {
        console.log('❌ Could not find item for recommendation ID:', rec.id, 'Title:', rec.title, 'in shuffled watchlist');
        return null;
      }
      
      console.log('✅ Found item for recommendation:', item.title, 'ID:', item.id, 'AI Title:', rec.title);
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: rec.reason,
        confidence: rec.confidence,
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
        createdAt: item.createdAt?.toISOString(),
      };
    })
      .filter((r): r is Recommendation => r !== null);

    // If we have some AI recommendations but not enough, try to match the AI reasons to actual items
    if (recommendations.length > 0 && recommendations.length < 5) {
      console.log('Partial AI success, trying to match remaining AI reasons to items');
      const usedIds = new Set(recommendations.map(r => r.id));
      const remainingAiRecs = validRecommendations.filter((rec: AIRecommendation) => 
        !recommendations.some(r => String(r.id) === String(rec.id))
      );
      
      for (const aiRec of remainingAiRecs) {
        // Try to find an item from the shuffled watchlist that wasn't used
        const availableItems = shuffledWatchlist.filter(item => 
          !usedIds.has(item.id)
        );
        
        if (availableItems.length > 0) {
          const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          usedIds.add(randomItem.id);
          
          recommendations.push({
            id: randomItem.id,
            title: randomItem.title,
            type: randomItem.type,
            status: randomItem.status,
            reason: aiRec.reason, // Keep the AI's detailed reason
            confidence: aiRec.confidence,
            tmdbPosterPath: randomItem.tmdbPosterPath,
            tmdbOverview: randomItem.tmdbOverview,
            tmdbMovieReleaseYear: randomItem.tmdbMovieReleaseYear,
            tmdbTvFirstAirYear: randomItem.tmdbTvFirstAirYear,
            tmdbMovieRuntime: randomItem.tmdbMovieRuntime,
            tmdbTvNumberOfSeasons: randomItem.tmdbTvNumberOfSeasons,
            createdAt: randomItem.createdAt?.toISOString(),
          });
          
          console.log('Matched AI reason to item:', randomItem.title);
        }
      }
    }

    // If AI mapping failed for most items, pick random items from the watchlist
    let usedStockReasonFallback = false;
    if (recommendations.length < 3) {
      usedStockReasonFallback = true;
      console.log('AI mapping failed, picking random items from watchlist');
      const availableItems = [...watchlist].sort(() => Math.random() - 0.5).slice(0, 5);
      const fallbackReasons = [
        "This looks like a perfect choice for your next viewing session.",
        "Based on your watchlist, this could be exactly what you're in the mood for.",
        "This one seems to align well with your viewing preferences.",
        "You've had this on your list for a while - maybe it's time to give it a shot!",
        "This could be a great change of pace from your usual viewing habits.",
      ];
      
      recommendations = availableItems.map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: fallbackReasons[index % fallbackReasons.length],
        confidence: 0.8 - (index * 0.1),
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      }));
    }

    return {
      recommendations,
      strategy: randomStrategy.name,
      strategyFocus: randomStrategy.focus,
      phase: usedStockReasonFallback
        ? 'llm-mapping-fallback-stock-reasons'
        : 'llm-success',
      ...(includeDebug
        ? {
            debug: {
              llmUsed: `${lastLlm.provider}:${lastLlm.model}`,
              systemPrompt: RECOMMENDATIONS_SYSTEM_PROMPT,
              userPrompt,
              rawResponse: lastLlm.rawText,
              llmLatencyMs: lastLlm.latencyMs,
              inputTokens: lastLlm.inputTokens,
              outputTokens: lastLlm.outputTokens,
              totalTokens: lastLlm.totalTokens,
              phase: usedStockReasonFallback
                ? 'llm-mapping-fallback-stock-reasons'
                : 'llm-success',
              requestContext: debugRequestContext,
            } satisfies RecommendationsApiDebugPayload,
          }
        : {}),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logRecommendationsFailure('llm_pipeline', {
      errorName: err.name,
      message: err.message.slice(0, 320),
    });
    console.error('LLM recommendation error:', error);

    if (includeDebug) {
      throw new RecommendationsInferenceError({
        llmUsed: llmUsedLabel(lastLlm),
        systemPrompt: RECOMMENDATIONS_SYSTEM_PROMPT,
        userPrompt,
        rawResponse: lastLlm?.rawText ?? null,
        llmLatencyMs: lastLlm?.latencyMs ?? null,
        inputTokens: lastLlm?.inputTokens ?? null,
        outputTokens: lastLlm?.outputTokens ?? null,
        totalTokens: lastLlm?.totalTokens ?? null,
        phase: 'llm-pipeline-error',
        error: err.message,
        requestContext: debugRequestContext,
      });
    }

    throw new Error('Failed to generate recommendations');
  }
}

export async function GET(request: NextRequest) {
  console.log('Recommendations API called');
  let watchlist: WatchItem[] = [];
  let finishedForProfile: WatchItem[] = [];
  
  try {
    console.log('Getting user ID...');
    const userId = await getUserId();
    console.log('User ID:', userId);

    const subscription = await getUserSubscription(userId);
    if (!hasProAccess(subscription)) {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 });
    }

    // Check for cache busting parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const debugPayloadEnabled = shouldAttachRecommendationsApiDebug();
    const clientHour = parseRecommendationsHourParam(searchParams.get('hour'));
    const tzRaw = searchParams.get('tz');
    const clientTimeZone =
      tzRaw && tzRaw.trim().length > 0 ? tzRaw.trim().slice(0, 160) : null;

    const requestTime = { clientHour, clientTimeZone };

    const cacheKey = `recommendations_${userId}_h${clientHour ?? 'na'}_tz${clientTimeZone ?? 'na'}`;
    const cached = recommendationCache.get(cacheKey);

    // Never serve cached payloads for debug builds (would omit or stale-copy prompt/response)
    if (
      !debugPayloadEnabled &&
      !forceRefresh &&
      cached &&
      Date.now() - cached.timestamp < CACHE_DURATION
    ) {
      console.log('Returning cached recommendations');
      return NextResponse.json(cached.data);
    }

    // Get user's watchlist from new schema
    console.log('Fetching watchlist from database...');
    try {
      // First, get the user's default watchlist
      const defaultWatchlist = await prisma.watchlist.findFirst({
        where: {
          ownerId: userId,
          isDefault: true,
        },
      });

      if (!defaultWatchlist) {
        console.log('No default watchlist found for user');
        watchlist = [];
      } else {
        const itemSelect = {
          id: true,
          title: true,
          type: true,
          tmdbPosterPath: true,
          tmdbOverview: true,
          tmdbMovieReleaseYear: true,
          tmdbTvFirstAirYear: true,
          tmdbMovieRuntime: true,
          tmdbTvNumberOfSeasons: true,
          tmdbPopularity: true,
          tmdbVoteCount: true,
          createdAt: true,
        } as const;

        const [watchlistItems, finishedRows] = await Promise.all([
          prisma.watchlistItemList.findMany({
            where: {
              watchlistId: defaultWatchlist.id,
              status: 'want-to-watch',
            },
            include: {
              watchlistItem: {
                select: {
                  ...itemSelect,
                },
              },
            },
            orderBy: {
              addedAt: 'desc',
            },
            take: RECOMMENDATIONS_WANT_TO_WATCH_FETCH_LIMIT,
          }),
          prisma.watchlistItemList.findMany({
            where: {
              watchlistId: defaultWatchlist.id,
              status: 'finished',
            },
            include: {
              watchlistItem: {
                select: {
                  ...itemSelect,
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 40,
          }),
        ]);

        const mapRow = (item: (typeof watchlistItems)[0]): WatchItem => ({
          id: item.watchlistItem.id,
          title: item.watchlistItem.title,
          type: item.watchlistItem.type,
          status: item.status,
          rating: item.rating,
          notes: item.notes,
          tmdbPosterPath: item.watchlistItem.tmdbPosterPath,
          tmdbOverview: item.watchlistItem.tmdbOverview,
          tmdbMovieReleaseYear: item.watchlistItem.tmdbMovieReleaseYear,
          tmdbTvFirstAirYear: item.watchlistItem.tmdbTvFirstAirYear,
          tmdbMovieRuntime: item.watchlistItem.tmdbMovieRuntime,
          tmdbTvNumberOfSeasons: item.watchlistItem.tmdbTvNumberOfSeasons,
          tmdbPopularity: item.watchlistItem.tmdbPopularity,
          tmdbVoteCount: item.watchlistItem.tmdbVoteCount,
          createdAt: item.watchlistItem.createdAt,
        });

        watchlist = watchlistItems.map(mapRow);
        finishedForProfile = finishedRows.map(mapRow);
      }

      console.log('Watchlist items found:', watchlist.length);
      console.log('Watchlist statuses:', watchlist.map(item => item.status));
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      watchlist = []; // Set empty array if database fails
    }

    if (watchlist.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No items in watchlist to generate recommendations from'
      });
    }

    // Get AI recommendations
    let recommendations: Recommendation[];
    let strategyName = "fallback";
    let strategyFocus = "recommend from your want-to-watch list";
    let phase = 'route-init';
    let recommendationsDebugPayload: RecommendationsApiDebugPayload | undefined;

    try {
      console.log('Attempting AI recommendations...');
      const result = await getAIRecommendations(watchlist, finishedForProfile, debugPayloadEnabled, requestTime);
      recommendations = result.recommendations;
      strategyName = result.strategy;
      strategyFocus = result.strategyFocus;
      phase = result.phase;
      if (debugPayloadEnabled && result.debug) {
        recommendationsDebugPayload = result.debug;
      }
      console.log('AI recommendations successful:', recommendations.length);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logRecommendationsFailure('route_ai_fallback', {
        errorName: err.name,
        message: err.message.slice(0, 320),
      });
      console.error('AI recommendations failed, using fallback:', error);
      strategyName = 'ai-unavailable';
      strategyFocus =
        'Could not reach the AI model or parse its response; showing picks from your want-to-watch list.';
      phase = 'llm-pipeline-error';
      if (debugPayloadEnabled && error instanceof RecommendationsInferenceError) {
        recommendationsDebugPayload = error.recommendationsDebugPartial;
      }
      // Fallback: simple recommendation based on want-to-watch items with variety
      const wantToWatchItems = watchlist.filter(item => item.status === 'want-to-watch');
      const fallbackReasons = [
        "This crime thriller's complex plot and character development align perfectly with your preference for psychological dramas.",
        "Given your interest in recent releases, this 2018 film offers a fresh perspective on contemporary storytelling.",
        "This documentary's investigative approach matches your taste for thought-provoking, real-world content.",
        "The psychological depth and moral complexity in this film will appeal to your appreciation for nuanced storytelling.",
        "This film's unique blend of genres creates an experience that stands out from typical mainstream offerings.",
        "The director's distinctive visual style and narrative approach make this a compelling choice for your next viewing.",
        "This film's critical acclaim and awards recognition suggest it will deliver the quality content you typically enjoy.",
        "The runtime and pacing of this film make it perfect for a focused, immersive viewing experience."
      ];
      
      // Better randomization using Fisher-Yates shuffle
      const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      
      const shuffledItems = shuffleArray(wantToWatchItems);
      const shuffledReasons = shuffleArray(fallbackReasons);
      
      // Add timestamp-based randomization for even more variety
      const timeBasedSeed = Date.now() % 1000;
      const _additionalShuffle = shuffleArray([...Array(5).keys()]);
      
      recommendations = shuffledItems.slice(0, 5).map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: shuffledReasons[(index + timeBasedSeed) % shuffledReasons.length],
        confidence: 0.8 - (index * 0.1), // Decreasing confidence for each item
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      }));
    }

    const responseData: {
      recommendations: Recommendation[];
      totalItems: number;
      strategy: string;
      strategyFocus: string;
      phase: string;
      debug?: RecommendationsApiDebugPayload;
    } = {
      recommendations,
      totalItems: watchlist.length,
      strategy: strategyName,
      strategyFocus: strategyFocus,
      phase,
      ...(recommendationsDebugPayload ? { debug: recommendationsDebugPayload } : {}),
    };

    if (!debugPayloadEnabled) {
      recommendationCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logRecommendationsApiError('route_fatal', {
      errorName: err.name,
      message: err.message.slice(0, 320),
    });
    console.error('Recommendations API error:', error);
    
    // Always return some recommendations, even if there's an error
    // If watchlist is not available due to database error, return empty recommendations
    const wantToWatchItems = (watchlist || []).filter(item => item.status === 'want-to-watch').slice(0, 5);
    const fallbackReasons = [
      "This looks like a perfect choice for your next viewing session.",
      "Based on your watchlist, this could be exactly what you're in the mood for.",
      "This one seems to align well with your viewing preferences.",
      "You've had this on your list for a while - maybe it's time to give it a shot!",
      "This could be a great change of pace from your usual viewing habits.",
    ];
    
    const recommendations = wantToWatchItems.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      reason: fallbackReasons[index % fallbackReasons.length],
      confidence: 0.8 - (index * 0.1),
      tmdbPosterPath: item.tmdbPosterPath,
      tmdbOverview: item.tmdbOverview,
      tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
      tmdbMovieRuntime: item.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
    }));
    
    const fatalBody: {
      recommendations: Recommendation[];
      totalItems: number;
      strategy: string;
      strategyFocus: string;
      phase: string;
      debug?: RecommendationsApiDebugPayload;
    } = {
      recommendations,
      totalItems: (watchlist || []).length,
      strategy: 'error-fallback',
      strategyFocus: 'recommendations from your want-to-watch list due to an error',
      phase: 'route-fatal',
    };

    if (shouldAttachRecommendationsApiDebug()) {
      fatalBody.debug = {
        llmUsed: '(none — route fatal before LLM)',
        systemPrompt: null,
        userPrompt: null,
        rawResponse: null,
        llmLatencyMs: null,
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        phase: 'route-fatal',
        error: err.message.slice(0, 500),
      };
    }

    return NextResponse.json(fatalBody);
  }
}
