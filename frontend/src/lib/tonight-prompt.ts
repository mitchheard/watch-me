import { pickProfileAnchors, trimOverview, type ProfileAnchorRow } from '@/app/api/recommendations/recommendations-helpers';
import { TONIGHT_CANDIDATE_COUNT } from './tonight-cache';
import { tonightContextPromptBlock, type TonightContext } from './tonight-context';

export type TonightPromptItem = {
  id: string;
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
  tmdbMovieCertification: string | null;
  tmdbTvCertification: string | null;
};

export const TONIGHT_SYSTEM_PROMPT = `You are Watch Me's tonight picker. You only recommend rows from the numbered candidate list in the user message. Return a JSON object with a "recommendations" array of exactly the requested number of different titles (no markdown, no extra commentary).

## Output shape
Each array object has:
- "id" (string): the exact id from the chosen candidate row.
- "title" (string): the exact title from that same row.
- "reason" (string): two or three sentences. This is the match — never invent a percentage.

## Validation
- Never invent titles or ids.
- Each object's id and title must refer to the same list row.

## Reason quality
- Use the three-state rating vocabulary when you reference taste: loved, liked, wasn't for me.
- Tie reasons to the viewer's own list: named titles they loved or liked, or something sitting on the list.
- Mention runtime (movies) or that it is a series when it helps the time budget.
- Avoid hollow lines such as "perfect choice", "exactly what you're in the mood for", or "based on your watchlist" without naming specifics.`;

function formatRating(rating: string | null): string {
  if (rating === 'loved') return 'loved';
  if (rating === 'liked') return 'liked';
  if (rating === 'not-for-me') return "wasn't for me";
  return 'none';
}

function formatCandidateLine(index: number, item: TonightPromptItem): string {
  const year = item.tmdbMovieReleaseYear ?? item.tmdbTvFirstAirYear;
  const yearPart = year != null ? String(year) : 'unknown year';
  let lengthPart: string;
  if (item.type === 'movie') {
    lengthPart =
      item.tmdbMovieRuntime != null && item.tmdbMovieRuntime > 0
        ? `${item.tmdbMovieRuntime} min`
        : 'runtime unknown';
  } else {
    lengthPart = 'episode / series';
  }
  const cert = item.type === 'movie' ? item.tmdbMovieCertification : item.tmdbTvCertification;
  const overviewEsc = trimOverview(item.tmdbOverview);
  const parts = [
    `${index}. id=${item.id}`,
    `title=${JSON.stringify(item.title)}`,
    `type=${item.type}`,
    `list_status=${item.status}`,
    `rating=${formatRating(item.rating)}`,
    `year=${yearPart}`,
    `length=${lengthPart}`,
    `certification=${cert?.trim() || 'unknown'}`,
  ];
  const notes = item.notes?.trim();
  if (notes) {
    const notesTrim = notes.length > 180 ? `${notes.slice(0, 177).trimEnd()}…` : notes;
    parts.push(`notes=${JSON.stringify(notesTrim)}`);
  }
  parts.push(`overview=${JSON.stringify(overviewEsc)}`);
  return parts.join(' | ');
}

function profileBlock(anchors: ProfileAnchorRow[]): string {
  if (anchors.length === 0) {
    return 'Taste anchors: none listed (lean on overviews; do not invent finished favorites).';
  }
  const lines = ['Taste anchors (reference by name; use loved / liked / wasn\'t for me):'];
  for (const a of anchors) {
    const rating =
      a.rating === 'loved' ? 'loved' : a.rating === 'liked' ? 'liked' : a.rating === 'not-for-me' ? "wasn't for me" : 'unrated';
    lines.push(`- ${a.title} (${a.status}, ${rating})`);
  }
  return lines.join('\n');
}

export function buildTonightUserPrompt(opts: {
  candidates: TonightPromptItem[];
  finished: TonightPromptItem[];
  context: TonightContext;
  timeOfDay: string;
  pickCount?: number;
}): string {
  const pickCount = opts.pickCount ?? Math.min(TONIGHT_CANDIDATE_COUNT, opts.candidates.length);
  const anchors = pickProfileAnchors(
    opts.finished.map((i) => ({ title: i.title, rating: i.rating, status: i.status })),
    opts.candidates.map((i) => ({ title: i.title, rating: i.rating, status: i.status }))
  );
  const lines = opts.candidates.map((item, i) => formatCandidateLine(i + 1, item)).join('\n');
  return `## User profile
${profileBlock(anchors)}

## Time of day
${opts.timeOfDay}

## Tonight's context (honor these; they are prompt inputs, not ranking scores)
${tonightContextPromptBlock(opts.context)}

Recommend exactly ${pickCount} different title${pickCount === 1 ? '' : 's'} from the numbered candidate list below, ordered best-first for tonight. Return a JSON object whose "recommendations" array has exactly ${pickCount} item${pickCount === 1 ? '' : 's'}.

## Candidates (use only these rows; ids are authoritative)
${lines}`;
}
