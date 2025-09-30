// RESOLVED CONFLICT: Merged advanced SemanticNLPEngine (with conversation/context memory, concept graph, embeddings, suggestions) and lightweight semantic entity/knowledge graph analysis utilities. All features preserved.

"use client"

import {
  nlpProcessor,
  type EnhancedNLPAnalysis,
  type IntentType,
  tokenize,
  extractEntities,
  extractEntitiesMap,
  extractTopics
} from "./nlp-utils"

// --- Types from both branches ---
export interface SemanticVector {
  word: string;
  vector: number[];
  frequency: number;
}

export interface SemanticSimilarity {
  word1: string;
  word2: string;
  similarity: number;
}

export interface SemanticEntity {
  type: string;
  value: string;
  relevance?: number;
  position?: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  attributes?: Record<string, string | number | boolean | object>;
  links?: string[];
}

export interface SemanticAnalysis extends EnhancedNLPAnalysis {
  semanticConcepts: string[];
  conceptConfidence: Record<string, number>;
  semanticSimilarities: SemanticSimilarity[];
  abstractMeaning: string;
  contextualAmbiguity: number;
  domainSpecificity: number;
  semanticEntities?: SemanticEntity[];
  context?: string;
  topics?: string[];
  knowledgeGraph?: KnowledgeGraphNode[];
}

export interface ConversationMemory {
  previousInputs: string[];
  contextualConcepts: string[];
  userPreferences: Record<string, number>;
  conversationFlow: Array<{
    input: string;
    intent: IntentType;
    concepts: string[];
    timestamp: number;
  }>;
}

// --- SemanticNLPEngine from feat/v0-import (with merged util functions) ---
class SemanticNLPEngine {
  private static instance: SemanticNLPEngine;
  private wordEmbeddings: Map<string, number[]>;
  private conceptGraph: Map<string, Set<string>>;
  private conversationMemory: ConversationMemory;
  private domainKnowledge: Map<string, Array<{ concept: string; weight: number }>>;

  constructor() {
    this.wordEmbeddings = new Map();
    this.conceptGraph = new Map();
    this.conversationMemory = {
      previousInputs: [],
      contextualConcepts: [],
      userPreferences: {},
      conversationFlow: [],
    };
    this.domainKnowledge = new Map();
    this.initializeSemanticKnowledge();
  }

  public static getInstance(): SemanticNLPEngine {
    if (!SemanticNLPEngine.instance) {
      SemanticNLPEngine.instance = new SemanticNLPEngine();
    }
    return SemanticNLPEngine.instance;
  }

  private initializeSemanticKnowledge() {
    // Domain mappings
    this.domainKnowledge.set("web_development", [
      { concept: "frontend", weight: 0.9 },
      { concept: "backend", weight: 0.9 },
      { concept: "database", weight: 0.8 },
      { concept: "api", weight: 0.8 },
      { concept: "ui_ux", weight: 0.7 },
      { concept: "responsive", weight: 0.7 },
      { concept: "authentication", weight: 0.6 },
    ]);
    this.domainKnowledge.set("ui_components", [
      { concept: "interactive", weight: 0.9 },
      { concept: "visual", weight: 0.8 },
      { concept: "user_input", weight: 0.8 },
      { concept: "navigation", weight: 0.7 },
      { concept: "data_display", weight: 0.7 },
    ]);
    this.domainKnowledge.set("data_management", [
      { concept: "storage", weight: 0.9 },
      { concept: "retrieval", weight: 0.8 },
      { concept: "processing", weight: 0.8 },
      { concept: "validation", weight: 0.7 },
      { concept: "security", weight: 0.9 },
    ]);
    this.buildConceptGraph();
    this.initializeWordEmbeddings();
  }

  private buildConceptGraph() {
    const relationships = [
      ["frontend", "ui", "component", "react", "interface"],
      ["backend", "api", "server", "database", "logic"],
      ["authentication", "login", "user", "security", "session"],
      ["responsive", "mobile", "desktop", "layout", "design"],
      ["database", "data", "storage", "query", "table"],
      ["form", "input", "validation", "submit", "field"],
      ["dashboard", "chart", "analytics", "data", "visualization"],
      ["navigation", "menu", "routing", "page", "link"],
    ];
    relationships.forEach((group) => {
      group.forEach((concept) => {
        if (!this.conceptGraph.has(concept)) {
          this.conceptGraph.set(concept, new Set());
        }
        group.forEach((relatedConcept) => {
          if (concept !== relatedConcept) {
            this.conceptGraph.get(concept)!.add(relatedConcept);
          }
        });
      });
    });
  }

  private initializeWordEmbeddings() {
    const technicalTerms = [
      "react", "nextjs", "typescript", "javascript", "html", "css", "api", "database", "authentication",
      "frontend", "backend", "component", "form", "button", "modal", "dashboard", "chart",
      "responsive", "mobile", "desktop", "layout", "design", "user", "login", "security",
      "data", "storage", "query",
    ];
    technicalTerms.forEach((term, index) => {
      const vector = Array.from(
        { length: 50 },
        (_, i) => Math.sin((index + 1) * (i + 1) * 0.1) + Math.cos((index + 1) * (i + 1) * 0.05),
      );
      this.wordEmbeddings.set(term, vector);
    });
  }

  public async analyzeSemanticText(text: string): Promise<SemanticAnalysis> {
    // Get basic NLP analysis
    const basicAnalysis = await nlpProcessor.analyzeTextEnhanced(text);

    // Entities, context, topics, knowledge graph
    const semanticEntities: SemanticEntity[] = extractEntities(text).map((e, idx) => ({
      type: 'ProperNoun',
      value: e,
      position: idx,
      relevance: 0.8,
    }));
    const context = text.match(/for (.+)/)?.[1] || undefined;
    const topics = extractTopics(text);
    const knowledgeGraph = activeKnowledgeGraph(text);

    // Extract semantic concepts
    const semanticConcepts = this.extractSemanticConcepts(text);
    // Concept confidence
    const conceptConfidence = this.calculateConceptConfidence(text, semanticConcepts);
    // Semantic similarities
    const semanticSimilarities = this.findSemanticSimilarities(text);
    // Abstract meaning
    const abstractMeaning = this.generateAbstractMeaning(text, semanticConcepts);
    // Contextual ambiguity
    const contextualAmbiguity = this.calculateContextualAmbiguity(text);
    // Domain specificity
    const domainSpecificity = this.calculateDomainSpecificity(semanticConcepts);

    // Conversation memory
    this.updateConversationMemory(text, basicAnalysis.intent, semanticConcepts);

    return {
      ...basicAnalysis,
      semanticConcepts,
      conceptConfidence,
      semanticSimilarities,
      abstractMeaning,
      contextualAmbiguity,
      domainSpecificity,
      semanticEntities,
      context,
      topics,
      knowledgeGraph,
    };
  }

  private extractSemanticConcepts(text: string): string[] {
    const tokens = tokenize(text.toLowerCase());
    const concepts: Set<string> = new Set();
    
    tokens.forEach((token) => {
      if (this.conceptGraph.has(token)) {
        concepts.add(token);
        this.conceptGraph.get(token)!.forEach((related) => {
          if (tokens.includes(related)) {
            concepts.add(related);
          }
        });
      }
    });

    this.domainKnowledge.forEach((domainConcepts) => {
      domainConcepts.forEach(({ concept }) => {
        if (tokens.some((token) => token.includes(concept) || concept.includes(token))) {
          concepts.add(concept);
        }
      });
    });

    return Array.from(concepts);
  }

  private calculateConceptConfidence(text: string, concepts: string[]): Record<string, number> {
    const confidence: Record<string, number> = {};
    const tokens = tokenize(text.toLowerCase());
    
    concepts.forEach((concept) => {
      let score = 0;
      if (tokens.includes(concept)) score += 0.8;
      if (this.conceptGraph.has(concept)) {
        const relatedCount = Array.from(this.conceptGraph.get(concept)!).filter((related) =>
          tokens.includes(related),
        ).length;
        score += relatedCount * 0.1;
      }
      confidence[concept] = Math.min(score, 1.0);
    });

    return confidence;
  }

  private findSemanticSimilarities(text: string): SemanticSimilarity[] {
    const tokens = tokenize(text.toLowerCase()).filter((t) => this.wordEmbeddings.has(t));
    const similarities: SemanticSimilarity[] = [];

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const vec1 = this.wordEmbeddings.get(tokens[i]);
        const vec2 = this.wordEmbeddings.get(tokens[j]);
        if (vec1 && vec2) {
          const similarity = this.cosineSimilarity(vec1, vec2);
          if (similarity > 0.5) {
            similarities.push({
              word1: tokens[i],
              word2: tokens[j],
              similarity,
            });
          }
        }
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (mag1 * mag2);
  }

  private generateAbstractMeaning(text: string, concepts: string[]): string {
    if (concepts.length === 0) {
      return "General inquiry or statement without specific technical concepts.";
    }

    const primaryConcepts = concepts.slice(0, 3).join(", ");
    return `Text involves ${primaryConcepts} with technical focus on ${concepts.length} semantic concepts.`;
  }

  private calculateContextualAmbiguity(text: string): number {
    const tokens = tokenize(text.toLowerCase());
    let ambiguityScore = 0;

    const ambiguousWords = ["it", "this", "that", "they", "thing", "stuff", "something"];
    ambiguityScore += tokens.filter((t) => ambiguousWords.includes(t)).length * 0.2;

    if (tokens.length < 5) ambiguityScore += 0.3;
    if (tokens.filter((t) => t.length > 2).length < 3) ambiguityScore += 0.2;

    return Math.min(ambiguityScore, 1.0);
  }

  private calculateDomainSpecificity(concepts: string[]): number {
    if (concepts.length === 0) return 0;

    let specificityScore = 0;
    this.domainKnowledge.forEach((domainConcepts) => {
      const matchCount = concepts.filter((c) => domainConcepts.some(({ concept }) => concept === c)).length;
      specificityScore = Math.max(specificityScore, matchCount / concepts.length);
    });

    return specificityScore;
  }

  private updateConversationMemory(text: string, intent: IntentType, concepts: string[]): void {
    this.conversationMemory.previousInputs.push(text);
    if (this.conversationMemory.previousInputs.length > 10) {
      this.conversationMemory.previousInputs.shift();
    }

    concepts.forEach((concept) => {
      if (!this.conversationMemory.contextualConcepts.includes(concept)) {
        this.conversationMemory.contextualConcepts.push(concept);
      }
      this.conversationMemory.userPreferences[concept] =
        (this.conversationMemory.userPreferences[concept] || 0) + 1;
    });

    if (this.conversationMemory.contextualConcepts.length > 20) {
      this.conversationMemory.contextualConcepts = this.conversationMemory.contextualConcepts.slice(-20);
    }

    this.conversationMemory.conversationFlow.push({
      input: text,
      intent,
      concepts,
      timestamp: Date.now(),
    });

    if (this.conversationMemory.conversationFlow.length > 50) {
      this.conversationMemory.conversationFlow.shift();
    }
  }

  public resolveAmbiguity(text: string, context: string[] = []): string {
    const tokens = tokenize(text.toLowerCase());
    const ambiguousWords = tokens.filter((t) => ["it", "this", "that", "they"].includes(t));

    if (ambiguousWords.length === 0) return text;

    let resolved = text;
    context.forEach((contextItem) => {
      ambiguousWords.forEach((word) => {
        resolved = resolved.replace(new RegExp(`\\b${word}\\b`, "gi"), contextItem);
      });
    });

    return resolved;
  }

  public generateContextualSuggestions(input: string): string[] {
    const concepts = this.extractSemanticConcepts(input);
    const suggestions: Set<string> = new Set();

    concepts.forEach((concept) => {
      if (this.conceptGraph.has(concept)) {
        this.conceptGraph.get(concept)!.forEach((related) => {
          suggestions.add(`Consider adding ${related} functionality`);
        });
      }
    });

    const topPreferences = Object.entries(this.conversationMemory.userPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concept]) => concept);

    topPreferences.forEach((concept) => {
      suggestions.add(`Based on your preferences: ${concept}`);
    });

    return Array.from(suggestions).slice(0, 5);
  }

  public getConversationContext(): ConversationMemory {
    return { ...this.conversationMemory };
  }

  // Utility: Active knowledge graph (from main)
  private activeKnowledgeGraph(text: string): KnowledgeGraphNode[] {
    const words = tokenize(text);
    return words.filter(w => w[0] === w[0]?.toUpperCase())
      .map((w, idx) => ({
        id: `${w}_${idx}`,
        label: w,
        links: idx < words.length - 1 ? [`${words[idx + 1]}_${idx + 1}`] : [],
      }));
  }
}

export const semanticNLPEngine = SemanticNLPEngine.getInstance();

export async function analyzeSemanticText(text: string): Promise<SemanticAnalysis> {
  return await semanticNLPEngine.analyzeSemanticText(text);
}

export function resolveTextAmbiguity(text: string, context: string[] = []): string {
  return semanticNLPEngine.resolveAmbiguity(text, context);
}

export function getContextualSuggestions(input: string): string[] {
  return semanticNLPEngine.generateContextualSuggestions(input);
}

export function getConversationMemory(): ConversationMemory {
  return semanticNLPEngine.getConversationContext();
}

// --- Utility functions from main branch ---
export function activeKnowledgeGraph(text: string): KnowledgeGraphNode[] {
  const words = tokenize(text);
  return words.filter(w => w[0] === w[0]?.toUpperCase())
    .map((w, idx) => ({
      id: `${w}_${idx}`,
      label: w,
      links: idx < words.length - 1 ? [`${words[idx + 1]}_${idx + 1}`] : [],
    }));
}

export function analyzeSemantics(text: string): SemanticAnalysis {
  const semanticEntities: SemanticEntity[] = extractEntities(text).map((e, idx) => ({
    type: 'ProperNoun',
    value: e,
    position: idx,
    relevance: 0.8,
  }));

  // Convert to entities map for base interface compatibility
  const entities = extractEntitiesMap(text);

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
    entities: {},
    intent: intent as IntentType,
    sentiment,
    context,
    topics,
    knowledgeGraph,
    semanticEntities,
    // Other fields left undefined for compatibility
    semanticConcepts: [],
    conceptConfidence: {},
    semanticSimilarities: [],
    abstractMeaning: "",
    contextualAmbiguity: 0,
    domainSpecificity: 0,
  };
}