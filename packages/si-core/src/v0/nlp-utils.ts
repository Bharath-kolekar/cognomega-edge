export type IntentType = 'unknown' | 'question' | 'command' | 'chitchat';
export type EnhancedNLPAnalysis = {
  intent: IntentType;
  entities: Record<string, string[]>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyphrases?: string[];
};
export function nlpProcessor(text: string): EnhancedNLPAnalysis {
  return { intent: 'unknown', entities: {} };
}