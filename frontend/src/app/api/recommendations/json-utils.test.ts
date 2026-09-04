import { describe, expect, it } from 'vitest';
import { parseRecommendationArray, stripJsonMarkdownFences } from './json-utils';

describe('json-utils', () => {
  it('strips markdown fences around JSON content', () => {
    const response = '```json\n[{"id":"1"}]\n```';
    expect(stripJsonMarkdownFences(response)).toBe('[{"id":"1"}]');
  });

  it('parses JSON array while tolerating trailing prose', () => {
    const response = '[{"id":"1","title":"Example"}]\nThese are your recommendations.';
    expect(parseRecommendationArray(response)).toEqual([{ id: '1', title: 'Example' }]);
  });

  it('throws when the JSON payload is truncated', () => {
    const response = '[{"id":"1","title":"Broken"';
    expect(() => parseRecommendationArray(response)).toThrow('No JSON array found');
  });

  it('parses structured-output object wrapper', () => {
    const response = JSON.stringify({
      recommendations: [{ id: 'abc', title: 'Example', reason: 'Hook.', confidence: 0.8 }],
    });
    expect(parseRecommendationArray(response)).toEqual([
      { id: 'abc', title: 'Example', reason: 'Hook.', confidence: 0.8 },
    ]);
  });

  it('parses object wrapper inside markdown fences', () => {
    const response =
      '```json\n{"recommendations":[{"id":"abc","title":"Example"}]}\n```';
    expect(parseRecommendationArray(response)).toEqual([{ id: 'abc', title: 'Example' }]);
  });
});
