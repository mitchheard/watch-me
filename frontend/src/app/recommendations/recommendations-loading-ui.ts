/**
 * AVIDX-266: staged progress caps at 90%; stage 4+ is the final wait (no 100% while fetch pending).
 * loadingStage ticks 0→4 on an 800ms timer. Bar uses equal fifths of 90% (0 → 22.5 → … → 90)
 * so each timer step is the same size; the label rounds for display (e.g. 23%, 45%, 68%, 90%).
 */
const STAGED_MAX = 4;

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

/** Always show the capped numeric % (including 90% on the final wait stage) so the header stays consistent. */
export function recommendationsLoadingShowPercentLabel(loadingStage: number): boolean {
  return loadingStage <= STAGED_MAX;
}
