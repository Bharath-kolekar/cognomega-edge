export type IntentType = 'unknown' | 'question' | 'command' | 'chitchat';
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

// Callable + method (both return a safe minimal structure)
export const nlpProcessor: NLPProcessor = Object.assign(
  (text: string): EnhancedNLPAnalysis => ({ intent: 'unknown', entities: {} }),
  {
    analyzeTextEnhanced: (text: string): EnhancedNLPAnalysis => ({ intent: 'unknown', entities: {} }),
  }
);