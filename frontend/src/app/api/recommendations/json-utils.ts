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

export function parseRecommendationArray(rawText: string): unknown[] {
  const sanitized = stripJsonMarkdownFences(rawText);
  const arrayStart = sanitized.indexOf('[');
  const arrayEnd = sanitized.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error('No JSON array found in LLM response');
  }

  const candidateJson = sanitized.slice(arrayStart, arrayEnd + 1);
  const trailingJunk = sanitized.slice(arrayEnd + 1).trim();
  if (trailingJunk.length > 0) {
    // Allow trailing prose outside the JSON payload while still parsing safely.
  }

  const parsed = JSON.parse(candidateJson);
  if (!Array.isArray(parsed)) {
    throw new Error('LLM returned invalid JSON shape');
  }

  return parsed;
}
