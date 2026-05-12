# AI-Powered Recommendations Engine

## Overview

The Watch Me recommendations endpoint (`GET /api/recommendations`) uses Anthropic Claude Haiku to pick five titles from the user’s default watchlist (want-to-watch pool, up to 20 recent items). It rotates among seven strategies, validates JSON output against the candidate list, and falls back to deterministic picks when the model or parsing fails.

## Request shape (Anthropic)

The integration uses a **real** top-level `system` parameter plus a single user turn (`messages: [{ role: 'user', content }]`), not cosmetic `[SYSTEM]` / `[USER]` labels inside one user message. The system block is **static** across requests so Anthropic can cache it; per-request data lives only in the user message.

- **`system`**: Role, JSON schema with placeholder example, validation rules, global reason-quality bar, and textured example reasons (voice reference only — not to be duplicated in user content).
- **`user`**: User profile (anchors + weak tags), time of day, strategy name/focus plus **one-sentence strategy-specific reason guidance**, and a **numbered candidate list** with expanded metadata (including trimmed TMDB `overview`).

`max_tokens` is **2048**. The want-to-watch candidate cap remains **20** (see AVIDX-252 for evaluating changes).

## Data loading

1. **Want-to-watch rows** — Up to 20 items from the default watchlist with status `want-to-watch`, `addedAt` descending. Includes list `rating`, `notes`, and shared TMDB fields on `WatchlistItem` (`tmdbOverview`, runtime, seasons, years, poster, etc.).
2. **Finished rows (profile only)** — Up to 40 recent `finished` list rows with the same TMDB select, used only to build taste anchors in the user message (not added to the candidate pool).

## Strategy selection

One of seven strategies is chosen at random; if its filter returns no items, the code scans other strategies, then falls back to a generic want-to-watch slice.

| Strategy name | Focus (summary) |
|----------------|-----------------|
| recent additions | Recently added want-to-watch |
| highly rated similar | Want-to-watch slice aligned with “similar to loved” intent |
| quick wins | Short movies and ≤2-season shows |
| deep dives | Long shows and long movies |
| mood boosters | Want-to-watch slice |
| hidden gems | Shuffled want-to-watch |
| continue watching | In-progress / multi-season shows (requires those statuses in the pool) |

Each strategy injects a **one-sentence “reason guidance”** line into the user message (e.g. quick wins → cite runtime or season count and short slots).

## User profile block

- **Anchors**: Up to five titles from **finished** items rated `loved` or `liked` (sorted loved first). If there are fewer than three anchors, the list is padded with **loved** want-to-watch titles (no low-signal padding).
- **Weak signals**: Simple title/year “tags” and a short spotlight of items in the current **candidate subset** (not the full 20 unless they appear in the shuffle).

## Candidate list (model input)

Each numbered row includes: `id`, `title`, `type`, list `status`, `rating`, `year`, movie runtime or season count, optional trimmed `notes`, and **`overview`** — TMDB overview trimmed to ~250 characters (`trimOverview` in `recommendations-helpers.ts`). This gives the model concrete hooks, especially for titles after the model’s knowledge cutoff.

## Validation and phases

Unchanged contract from prior versions:

- Parse JSON array via `parseRecommendationArray` (defensive parsing).
- Drop entries with missing id/title; require **title + id** to match the same shuffled candidate row.
- **Phases** (for UI / Umami): `llm-success`, `llm-mapping-fallback-stock-reasons`, `llm-pipeline-error`, `route-fatal`, etc. Umami `ai_fallback_fired` still fires when `phase !== 'llm-success'` (see `isFallbackPhase`).

## UI

- **Strategy badge**: Shown only when `phase === 'llm-success'` so fallback paths (e.g. `ai-unavailable`) do not show a misleading “strategy” pill; `strategyFocus` copy still explains the state.
- **Dev toolbar** (when `RECOMMENDATIONS_DEBUG=true` and `NEXT_PUBLIC_SHOW_RECOMMENDATIONS_DEBUG=true`): Shows separate **system** and **user** panels matching the Anthropic call; long lines wrap (`whitespace-pre-wrap` / `break-words`).

## Caching and refresh

- In-memory cache: **1 second** per user when debug is off; `?refresh=true` bypasses cache.
- Do not change phase strings or Umami `ai_fallback_fired` `{ reason }` without coordinating analytics.

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...
# Optional override:
# ANTHROPIC_RECOMMENDATIONS_MODEL=claude-haiku-4-5-20251001
RECOMMENDATIONS_DEBUG=true   # server: include debug payload
NEXT_PUBLIC_SHOW_RECOMMENDATIONS_DEBUG=true   # client: show dev strip
```

---

*Last updated: May 2026 (AVIDX-251).*
