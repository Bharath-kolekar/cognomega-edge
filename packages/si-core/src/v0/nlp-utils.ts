// RESOLVED CONFLICT: Merged callable NLPProcessor type with additional NLP utilities.

export type IntentType = 'unknown' | 'question' | 'command' | 'chitchat' | 'create' | 'delete' | 'update';
export type EnhancedNLPAnalysis = {
  intent: IntentType;
  entities: Record<string, string[]>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyphrases?: string[];
};

export type NLPProcessor = {
  (text: string): EnhancedNLPAnalysis;
  analyzeTextEnhanced: (text: string) => EnhancedNLPAnalysis;
};

export const nlpProcessor: NLPProcessor = Object.assign(
  (text: string): EnhancedNLPAnalysis => ({
    intent: detectIntent(text),
    entities: extractEntitiesMap(text),
    sentiment: detectSentiment(text),
    keyphrases: extractTopics(text),
  }),
  {
    analyzeTextEnhanced: (text: string): EnhancedNLPAnalysis => ({
      intent: detectIntent(text),
      entities: extractEntitiesMap(text),
      sentiment: detectSentiment(text),
      keyphrases: extractTopics(text),
    }),
  }
);

// --- Utility Functions from main branch ---
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

export function extractEntitiesMap(text: string): Record<string, string[]> {
  const entities = extractEntities(text);
  return entities.length ? { entity: entities } : {};
}

export function extractTopics(text: string): string[] {
  const tokens = tokenize(text.toLowerCase());
  const freq: Record<string, number> = {};
  tokens.forEach(token => { freq[token] = (freq[token] || 0) + 1; });
  return Object.entries(freq)
    .filter(([, c]) => c > 1)
    .map(([token]) => token);
}

// --- Minimal intent/sentiment detection ---
export function detectIntent(text: string): IntentType {
  if (/^(what|how|why|when|who|where|can|is|do|does|did|will|are)\b/i.test(text)) return 'question';
  if (/^(please|run|start|stop|execute|build|deploy|create|delete)\b/i.test(text)) return 'command';
  if (/^(hi|hello|hey|thanks|bye|good\s?morning|good\s?night)/i.test(text)) return 'chitchat';
  return 'unknown';
}

export function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const pos = /\b(good|great|excellent|love|happy|awesome|fantastic|excited)\b/i;
  const neg = /\b(bad|sad|angry|hate|terrible|frustrated|awful)\b/i;
  if (pos.test(text)) return 'positive';
  if (neg.test(text)) return 'negative';
  return 'neutral';
}