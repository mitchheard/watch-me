import { describe, expect, it } from 'vitest';
import { isFallbackPhase } from './analytics';

describe('isFallbackPhase', () => {
  it('returns false for llm-success', () => {
    expect(isFallbackPhase('llm-success')).toBe(false);
  });

  it('returns true for non-success phases used in fallback analytics', () => {
    expect(isFallbackPhase('llm-mapping-fallback-stock-reasons')).toBe(true);
    expect(isFallbackPhase('llm-pipeline-error')).toBe(true);
  });
});
