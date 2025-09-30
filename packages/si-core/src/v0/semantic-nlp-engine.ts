/**
 * Semantic NLP Engine (Resource-Optimized)
 * Uses on-the-fly graph construction, sparse entity/topic extraction.
 */
import { tokenize, extractEntities, extractTopics } from './nlp-utils';

export interface SemanticEntity {
  type: string;
  value: string;
  relevance?: number;
  position?: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  attributes?: Record<string, any>;
  links?: string[];
}

export interface SemanticAnalysis {
  entities: SemanticEntity[];
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  context?: string;
  topics?: string[];
  knowledgeGraph?: KnowledgeGraphNode[];
}

export function activeKnowledgeGraph(text: string): KnowledgeGraphNode[] {
  // Sparse graph (only proper nouns, linked by sequence)
  const words = tokenize(text);
  return words.filter(w => w[0] === w[0]?.toUpperCase())
    .map((w, idx) => ({
      id: `${w}_${idx}`,
      label: w,
      links: idx < words.length - 1 ? [`${words[idx + 1]}_${idx + 1}`] : [],
    }));
}

export function analyzeSemantics(text: string): SemanticAnalysis {
  const entities: SemanticEntity[] = extractEntities(text).map((e, idx) => ({
    type: 'ProperNoun',
    value: e,
    position: idx,
    relevance: 0.8,
  }));

  const intent =
    /create|build|generate|make/.test(text) ? "create" :
    /delete|remove|destroy/.test(text) ? "delete" :
    /update|change|modify/.test(text) ? "update" : "unknown";

  const sentiment =
    /good|great|positive|happy/.test(text) ? "positive" :
    /bad|poor|negative|sad/.test(text) ? "negative" : "neutral";

  const context = text.match(/for (.+)/)?.[1] || undefined;
  const topics = extractTopics(text);

  const knowledgeGraph = activeKnowledgeGraph(text);

  return {
    entities,
    intent,
    sentiment,
    context,
    topics,
    knowledgeGraph,
  };
}