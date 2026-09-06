import Anthropic from '@anthropic-ai/sdk';
import { parseRecommendationArray } from '@/app/api/recommendations/json-utils';
import {
  TONIGHT_CANDIDATE_COUNT,
  type TonightCandidate,
} from './tonight-cache';
import {
  TONIGHT_SYSTEM_PROMPT,
  buildTonightUserPrompt,
  type TonightPromptItem,
} from './tonight-prompt';
import type { TonightContext } from './tonight-context';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const TONIGHT_OUTPUT_SCHEMA: { [key: string]: unknown } = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['id', 'title', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['recommendations'],
  additionalProperties: false,
};

type AiRow = { id: string; title: string; reason: string };

function toCandidate(item: TonightPromptItem, reason: string): TonightCandidate {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    year: item.tmdbMovieReleaseYear ?? item.tmdbTvFirstAirYear,
    runtimeMinutes: item.type === 'movie' ? item.tmdbMovieRuntime : null,
    tmdbPosterPath: item.tmdbPosterPath,
    tmdbOverview: item.tmdbOverview,
    certification:
      item.type === 'movie' ? item.tmdbMovieCertification : item.tmdbTvCertification,
    reason,
  };
}

function mapAiRows(rows: unknown[], pool: TonightPromptItem[]): TonightCandidate[] {
  const out: TonightCandidate[] = [];
  const used = new Set<string>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Partial<AiRow>;
    const id = rec.id != null ? String(rec.id).trim() : '';
    const title = rec.title != null ? String(rec.title).trim() : '';
    const reason = rec.reason != null ? String(rec.reason).trim() : '';
    if (!id || !title || !reason) continue;
    const item =
      pool.find((p) => p.id === id && p.title.toLowerCase() === title.toLowerCase()) ??
      pool.find((p) => p.id === id) ??
      pool.find((p) => p.title.toLowerCase() === title.toLowerCase());
    if (!item || used.has(item.id)) continue;
    used.add(item.id);
    out.push(toCandidate(item, reason));
    if (out.length >= TONIGHT_CANDIDATE_COUNT) break;
  }
  return out;
}

export function fallbackTonightCandidates(
  pool: TonightPromptItem[],
  pickCount = TONIGHT_CANDIDATE_COUNT
): TonightCandidate[] {
  return pool.slice(0, pickCount).map((item) => {
    const overview = item.tmdbOverview?.trim();
    const reason = overview
      ? `${overview.slice(0, 180).trim()}${overview.length > 180 ? '…' : ''} It's on your list for tonight.`
      : `${item.title} is on your list and ready to watch tonight.`;
    return toCandidate(item, reason);
  });
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  const model = process.env.ANTHROPIC_RECOMMENDATIONS_MODEL?.trim() || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey: anthropicKey });
  const createMessage = (structured: boolean) =>
    client.messages.create({
      model,
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      ...(structured
        ? {
            output_config: {
              format: {
                type: 'json_schema',
                schema: TONIGHT_OUTPUT_SCHEMA,
              },
            },
          }
        : {}),
    });

  let message;
  try {
    message = await createMessage(true);
  } catch (structuredErr) {
    const status = (structuredErr as { status?: number }).status;
    if (status !== 400) throw structuredErr;
    message = await createMessage(false);
  }
  const textBlock = message.content.find((block) => block.type === 'text');
  const text = textBlock?.text?.trim();
  if (!text) throw new Error('No response from Anthropic');
  return text;
}

export async function generateTonightCandidates(opts: {
  candidates: TonightPromptItem[];
  finished: TonightPromptItem[];
  context: TonightContext;
  timeOfDay: string;
}): Promise<{ candidates: TonightCandidate[]; claudeCalled: boolean }> {
  const pickCount = Math.min(TONIGHT_CANDIDATE_COUNT, opts.candidates.length);
  if (pickCount < 1) {
    return { candidates: [], claudeCalled: false };
  }

  const userPrompt = buildTonightUserPrompt({
    candidates: opts.candidates,
    finished: opts.finished,
    context: opts.context,
    timeOfDay: opts.timeOfDay,
    pickCount,
  });

  try {
    const raw = await callClaude(TONIGHT_SYSTEM_PROMPT, userPrompt);
    const parsed = parseRecommendationArray(raw);
    const mapped = mapAiRows(parsed, opts.candidates);
    if (mapped.length > 0) {
      const used = new Set(mapped.map((c) => c.id));
      for (const item of opts.candidates) {
        if (mapped.length >= pickCount) break;
        if (used.has(item.id)) continue;
        mapped.push(...fallbackTonightCandidates([item], 1));
      }
      return { candidates: mapped.slice(0, pickCount), claudeCalled: true };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'tonight_ai_failure',
        ts: new Date().toISOString(),
        message: error instanceof Error ? error.message.slice(0, 240) : 'unknown',
      })
    );
  }

  return { candidates: fallbackTonightCandidates(opts.candidates, pickCount), claudeCalled: true };
}
