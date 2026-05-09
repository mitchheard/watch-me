export function isFallbackPhase(phase?: string): phase is string {
  return Boolean(phase && phase !== 'llm-success');
}
