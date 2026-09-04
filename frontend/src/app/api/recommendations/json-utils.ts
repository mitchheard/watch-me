const CODE_FENCE_JSON_PREFIX = /^```json\s*\n?/i;
const CODE_FENCE_PREFIX = /^```\s*\n?/;
const CODE_FENCE_SUFFIX = /\n?```\s*$/;

export function stripJsonMarkdownFences(rawText: string): string {
  let cleanText = rawText.trim();
  if (CODE_FENCE_JSON_PREFIX.test(cleanText)) {
    cleanText = cleanText.replace(CODE_FENCE_JSON_PREFIX, '').replace(CODE_FENCE_SUFFIX, '');
  } else if (CODE_FENCE_PREFIX.test(cleanText)) {
    cleanText = cleanText.replace(CODE_FENCE_PREFIX, '').replace(CODE_FENCE_SUFFIX, '');
  }

  return cleanText.trim();
}

function recommendationsFromParsedJson(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { recommendations?: unknown }).recommendations)
  ) {
    return (parsed as { recommendations: unknown[] }).recommendations;
  }
  return null;
}

export function parseRecommendationArray(rawText: string): unknown[] {
  const sanitized = stripJsonMarkdownFences(rawText);

  try {
    const direct = recommendationsFromParsedJson(JSON.parse(sanitized));
    if (direct) return direct;
  } catch {
    // Fall through to bracket extraction for trailing prose / fences.
  }

  const arrayStart = sanitized.indexOf('[');
  const arrayEnd = sanitized.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error('No JSON array found in LLM response');
  }

  const candidateJson = sanitized.slice(arrayStart, arrayEnd + 1);
  const parsed = JSON.parse(candidateJson);
  if (!Array.isArray(parsed)) {
    throw new Error('LLM returned invalid JSON shape');
  }

  return parsed;
}
