/**
 * NLP Utilities (Resource-Optimized)
 * Stateless, low-memory, rule-based, with sparse topic extraction.
 */

export function zeroShotDetectLanguage(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return "en";
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function extractEntities(text: string): string[] {
  return Array.from(new Set(text.match(/\b([A-Z][a-z]+)\b/g) ?? []));
}

export function extractTopics(text: string): string[] {
  // Sparse topic extraction: only keywords with freq > 1
  const tokens = tokenize(text.toLowerCase());
  const freq: Record<string, number> = {};
  tokens.forEach(token => { freq[token] = (freq[token] || 0) + 1; });
  return Object.entries(freq)
    .filter(([, c]) => c > 1)
    .map(([token]) => token);
}