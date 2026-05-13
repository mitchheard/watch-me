/**
 * AVIDX-266: staged progress caps at 90%; stage 4+ is indeterminate (no 100% while fetch pending).
 * loadingStage ticks 0→4 on an 800ms timer (same cadence as before).
 */
const STAGED_MAX = 4;

export function recommendationsLoadingBarPercent(loadingStage: number): number {
  const s = Math.min(Math.max(loadingStage, 0), STAGED_MAX);
  return Math.min(90, (s / STAGED_MAX) * 100);
}

export function recommendationsLoadingIsIndeterminate(loadingStage: number): boolean {
  return loadingStage >= STAGED_MAX;
}

/** Always show the capped numeric % (including 90% on the final wait stage) so the header stays consistent. */
export function recommendationsLoadingShowPercentLabel(loadingStage: number): boolean {
  return loadingStage <= STAGED_MAX;
}
