/**
 * AVIDX-266: staged progress caps at 90%; stage 4+ is the final wait (no 100% while fetch pending).
 * loadingStage ticks 0→4 on RECOMMENDATIONS_LOADING_STAGE_MS. Bar uses equal fifths of 90%
 * (0 → 22.5 → … → 90). Interval is sized so 90% lands near typical Haiku latency (~6–8s),
 * not at ~3.2s with a long frozen hold.
 */
const STAGED_MAX = 4;

/** Delay between staged ticks (4 × 1600ms ≈ 6.4s to the 90% wait). */
export const RECOMMENDATIONS_LOADING_STAGE_MS = 1600;

export function recommendationsLoadingBarPercent(loadingStage: number): number {
  const s = Math.min(Math.max(loadingStage, 0), STAGED_MAX);
  return Math.min(90, (s / STAGED_MAX) * 90);
}

/** Cycles .., ..., .... so the 90% wait phase still feels alive (non-layout-shifting width). */
export function finalizingEllipsisSuffix(tick: number): string {
  return ['..', '...', '....'][tick % 3];
}

export function recommendationsLoadingIsIndeterminate(loadingStage: number): boolean {
  return loadingStage >= STAGED_MAX;
}

/** Hide the frozen 90% during the wait so the hold does not look stuck. */
export function recommendationsLoadingShowPercentLabel(loadingStage: number): boolean {
  return loadingStage < STAGED_MAX;
}
