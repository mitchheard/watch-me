/**
 * AVIDX-266: Never attach recommender debug payloads (prompts, raw LLM) on production surfaces,
 * even if RECOMMENDATIONS_DEBUG is mistakenly set. Client chrome uses the same surface rules via
 * NEXT_PUBLIC_VERCEL_ENV (see next.config).
 */
function vercelSurfaceEnv(): string | undefined {
  const v = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV;
  return v && v.length > 0 ? v : undefined;
}

/** True when this deployment should behave like production for recommender debug exposure. */
export function isRecommendationsProdSurface(): boolean {
  const vercel = vercelSurfaceEnv();
  if (vercel === 'production') return true;
  if (process.env.NODE_ENV !== 'production') return false;
  if (vercel === 'preview' || vercel === 'development') return false;
  return true;
}

/** Server + client: show recommendations debug toolbar / empty-state hint. */
export function allowRecommendationsDebugChrome(): boolean {
  return !isRecommendationsProdSurface();
}

/** Server only: include debug payload in API JSON when flag is on and surface is non-prod. */
export function shouldAttachRecommendationsApiDebug(): boolean {
  return process.env.RECOMMENDATIONS_DEBUG === 'true' && !isRecommendationsProdSurface();
}
