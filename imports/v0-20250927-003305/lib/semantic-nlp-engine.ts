"use client"

import { nlpProcessor, type EnhancedNLPAnalysis, type IntentType } from "./nlp-utils"

export interface SemanticVector {
  word: string
  vector: number[]
  frequency: number
}

export interface SemanticSimilarity {
  word1: string
  word2: string
  similarity: number
}

export interface SemanticAnalysis extends EnhancedNLPAnalysis {
  semanticConcepts: string[]
  conceptConfidence: Record<string, number>
  semanticSimilarities: SemanticSimilarity[]
  abstractMeaning: string
  contextualAmbiguity: number
  domainSpecificity: number
}

export interface ConversationMemory {
  previousInputs: string[]
  contextualConcepts: string[]
  userPreferences: Record<string, number>
  conversationFlow: Array<{
    input: string
    intent: IntentType
    concepts: string[]
    timestamp: number
  }>
}

class SemanticNLPEngine {
  private static instance: SemanticNLPEngine
  private wordEmbeddings: Map<string, number[]>
  private conceptGraph: Map<string, Set<string>>
  private conversationMemory: ConversationMemory
  private domainKnowledge: Map<string, Array<{ concept: string; weight: number }>>

  constructor() {
    this.wordEmbeddings = new Map()
    this.conceptGraph = new Map()
    this.conversationMemory = {
      previousInputs: [],
      contextualConcepts: [],
      userPreferences: {},
      conversationFlow: [],
    }
    this.domainKnowledge = new Map()
    this.initializeSemanticKnowledge()
  }

  public static getInstance(): SemanticNLPEngine {
    if (!SemanticNLPEngine.instance) {
      SemanticNLPEngine.instance = new SemanticNLPEngine()
    }
    return SemanticNLPEngine.instance
  }

  private initializeSemanticKnowledge() {
    // Initialize domain-specific concept mappings
    this.domainKnowledge.set("web_development", [
      { concept: "frontend", weight: 0.9 },
      { concept: "backend", weight: 0.9 },
      { concept: "database", weight: 0.8 },
      { concept: "api", weight: 0.8 },
      { concept: "ui_ux", weight: 0.7 },
      { concept: "responsive", weight: 0.7 },
      { concept: "authentication", weight: 0.6 },
    ])

    this.domainKnowledge.set("ui_components", [
      { concept: "interactive", weight: 0.9 },
      { concept: "visual", weight: 0.8 },
      { concept: "user_input", weight: 0.8 },
      { concept: "navigation", weight: 0.7 },
      { concept: "data_display", weight: 0.7 },
    ])

    this.domainKnowledge.set("data_management", [
      { concept: "storage", weight: 0.9 },
      { concept: "retrieval", weight: 0.8 },
      { concept: "processing", weight: 0.8 },
      { concept: "validation", weight: 0.7 },
      { concept: "security", weight: 0.9 },
    ])

    // Build concept relationships
    this.buildConceptGraph()

    // Initialize basic word embeddings (simplified approach)
    this.initializeWordEmbeddings()
  }

  private buildConceptGraph() {
    // Define semantic relationships between concepts
    const relationships = [
      ["frontend", "ui", "component", "react", "interface"],
      ["backend", "api", "server", "database", "logic"],
      ["authentication", "login", "user", "security", "session"],
      ["responsive", "mobile", "desktop", "layout", "design"],
      ["database", "data", "storage", "query", "table"],
      ["form", "input", "validation", "submit", "field"],
      ["dashboard", "chart", "analytics", "data", "visualization"],
      ["navigation", "menu", "routing", "page", "link"],
    ]

    relationships.forEach((group) => {
      group.forEach((concept) => {
        if (!this.conceptGraph.has(concept)) {
          this.conceptGraph.set(concept, new Set())
        }
        // Connect each concept to others in the same group
        group.forEach((relatedConcept) => {
          if (concept !== relatedConcept) {
            this.conceptGraph.get(concept)!.add(relatedConcept)
          }
        })
      })
    })
  }

  private initializeWordEmbeddings() {
    // Simplified word embeddings for key technical terms
    const technicalTerms = [
      "react",
      "nextjs",
      "typescript",
      "javascript",
      "html",
      "css",
      "api",
      "database",
      "authentication",
      "frontend",
      "backend",
      "component",
      "form",
      "button",
      "modal",
      "dashboard",
      "chart",
      "responsive",
      "mobile",
      "desktop",
      "layout",
      "design",
      "user",
      "login",
      "security",
      "data",
      "storage",
      "query",
    ]

    technicalTerms.forEach((term, index) => {
      // Generate a simple embedding vector (in real implementation, use pre-trained embeddings)
      const vector = Array.from(
        { length: 50 },
        (_, i) => Math.sin((index + 1) * (i + 1) * 0.1) + Math.cos((index + 1) * (i + 1) * 0.05),
      )
      this.wordEmbeddings.set(term, vector)
    })
  }

  public async analyzeSemanticText(text: string): Promise<SemanticAnalysis> {
    // Get basic NLP analysis first
    const basicAnalysis = await nlpProcessor.analyzeTextEnhanced(text)

    // Extract semantic concepts
    const semanticConcepts = this.extractSemanticConcepts(text)

    // Calculate concept confidence scores
    const conceptConfidence = this.calculateConceptConfidence(text, semanticConcepts)

    // Find semantic similarities
    const semanticSimilarities = this.findSemanticSimilarities(text)

    // Generate abstract meaning
    const abstractMeaning = this.generateAbstractMeaning(text, semanticConcepts)

    // Calculate contextual ambiguity
    const contextualAmbiguity = this.calculateContextualAmbiguity(text)

    // Calculate domain specificity
    const domainSpecificity = this.calculateDomainSpecificity(semanticConcepts)

    // Update conversation memory
    this.updateConversationMemory(text, basicAnalysis.intent, semanticConcepts)

    return {
      ...basicAnalysis,
      semanticConcepts,
      conceptConfidence,
      semanticSimilarities,
      abstractMeaning,
      contextualAmbiguity,
      domainSpecificity,
    }
  }

  private extractSemanticConcepts(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/)
    const concepts = new Set<string>()

    // Direct concept matching
    words.forEach((word) => {
      if (this.conceptGraph.has(word)) {
        concepts.add(word)
        // Add related concepts
        this.conceptGraph.get(word)!.forEach((related) => {
          if (Math.random() > 0.7) {
            // Add some randomness to avoid over-connection
            concepts.add(related)
          }
        })
      }
    })

    // Pattern-based concept extraction
    const patterns = [
      { pattern: /create|build|make|generate/, concept: "creation" },
      { pattern: /responsive|mobile|desktop/, concept: "responsive_design" },
      { pattern: /user|login|auth/, concept: "user_management" },
      { pattern: /data|database|store/, concept: "data_management" },
      { pattern: /api|server|backend/, concept: "backend_development" },
      { pattern: /ui|interface|component/, concept: "frontend_development" },
    ]

    patterns.forEach(({ pattern, concept }) => {
      if (pattern.test(text.toLowerCase())) {
        concepts.add(concept)
      }
    })

    return Array.from(concepts)
  }

  private calculateConceptConfidence(text: string, concepts: string[]): Record<string, number> {
    const confidence: Record<string, number> = {}
    const words = text.toLowerCase().split(/\s+/)

    concepts.forEach((concept) => {
      let score = 0

      // Direct mention score
      if (words.includes(concept)) {
        score += 0.8
      }

      // Related words score
      const relatedWords = this.conceptGraph.get(concept) || new Set()
      relatedWords.forEach((related) => {
        if (words.includes(related)) {
          score += 0.3
        }
      })

      // Context score based on conversation history
      const contextScore = this.getContextualConceptScore(concept)
      score += contextScore * 0.2

      confidence[concept] = Math.min(score, 1.0)
    })

    return confidence
  }

  private findSemanticSimilarities(text: string): SemanticSimilarity[] {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
    const similarities: SemanticSimilarity[] = []

    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const similarity = this.calculateWordSimilarity(words[i], words[j])
        if (similarity > 0.5) {
          similarities.push({
            word1: words[i],
            word2: words[j],
            similarity,
          })
        }
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5)
  }

  private calculateWordSimilarity(word1: string, word2: string): number {
    // Check if both words have embeddings
    const vec1 = this.wordEmbeddings.get(word1)
    const vec2 = this.wordEmbeddings.get(word2)

    if (vec1 && vec2) {
      return this.cosineSimilarity(vec1, vec2)
    }

    // Fallback to concept graph similarity
    if (this.conceptGraph.has(word1) && this.conceptGraph.get(word1)!.has(word2)) {
      return 0.8
    }

    // Fallback to string similarity
    return this.stringSimilarity(word1, word2)
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator)
      }
    }

    return matrix[str2.length][str1.length]
  }

  private generateAbstractMeaning(text: string, concepts: string[]): string {
    // Analyze the primary domain
    const primaryDomain = this.identifyPrimaryDomain(concepts)

    // Generate abstract interpretation
    const meanings = {
      web_development: "The user wants to create or modify web-based applications with modern technologies.",
      ui_components: "The user is focused on creating interactive user interface elements and experiences.",
      data_management: "The user needs to handle, store, or process data in their application.",
      general: "The user has a development-related request that requires technical implementation.",
    }

    let baseMeaning = meanings[primaryDomain as keyof typeof meanings] || meanings.general

    // Add concept-specific context
    if (concepts.includes("responsive")) {
      baseMeaning += " They emphasize cross-device compatibility."
    }
    if (concepts.includes("authentication")) {
      baseMeaning += " Security and user management are important considerations."
    }
    if (concepts.includes("data")) {
      baseMeaning += " Data handling and persistence are key requirements."
    }

    return baseMeaning
  }

  private identifyPrimaryDomain(concepts: string[]): string {
    const domainScores: Record<string, number> = {}

    this.domainKnowledge.forEach((domainConcepts, domain) => {
      let score = 0
      domainConcepts.forEach(({ concept, weight }) => {
        if (concepts.includes(concept)) {
          score += weight
        }
      })
      domainScores[domain] = score
    })

    const primaryDomain = Object.keys(domainScores).reduce((a, b) => (domainScores[a] > domainScores[b] ? a : b))

    return domainScores[primaryDomain] > 0 ? primaryDomain : "general"
  }

  private calculateContextualAmbiguity(text: string): number {
    const words = text.split(/\s+/)
    let ambiguityScore = 0

    // Check for ambiguous words
    const ambiguousWords = ["it", "this", "that", "thing", "stuff", "something"]
    ambiguousWords.forEach((word) => {
      if (text.toLowerCase().includes(word)) {
        ambiguityScore += 0.2
      }
    })

    // Check for vague descriptors
    const vagueDescriptors = ["nice", "good", "better", "modern", "cool", "awesome"]
    vagueDescriptors.forEach((descriptor) => {
      if (text.toLowerCase().includes(descriptor)) {
        ambiguityScore += 0.15
      }
    })

    // Length-based ambiguity (very short requests are often ambiguous)
    if (words.length < 5) {
      ambiguityScore += 0.3
    }

    return Math.min(ambiguityScore, 1.0)
  }

  private calculateDomainSpecificity(concepts: string[]): number {
    let specificityScore = 0
    const totalConcepts = concepts.length

    if (totalConcepts === 0) return 0

    // Technical concepts increase specificity
    const technicalConcepts = ["api", "database", "authentication", "responsive", "component"]
    technicalConcepts.forEach((tech) => {
      if (concepts.includes(tech)) {
        specificityScore += 0.2
      }
    })

    // Domain clustering increases specificity
    const domainClusters = Array.from(this.domainKnowledge.keys())
    domainClusters.forEach((domain) => {
      const domainConcepts = this.domainKnowledge.get(domain)!
      const matchingConcepts = concepts.filter((concept) => domainConcepts.some((dc) => dc.concept === concept))
      if (matchingConcepts.length > 1) {
        specificityScore += 0.3
      }
    })

    return Math.min(specificityScore, 1.0)
  }

  private updateConversationMemory(text: string, intent: IntentType, concepts: string[]) {
    // Add to conversation flow
    this.conversationMemory.conversationFlow.push({
      input: text,
      intent,
      concepts,
      timestamp: Date.now(),
    })

    // Update previous inputs (keep last 10)
    this.conversationMemory.previousInputs.push(text)
    if (this.conversationMemory.previousInputs.length > 10) {
      this.conversationMemory.previousInputs.shift()
    }

    // Update contextual concepts
    concepts.forEach((concept) => {
      if (!this.conversationMemory.contextualConcepts.includes(concept)) {
        this.conversationMemory.contextualConcepts.push(concept)
      }
    })

    // Update user preferences based on repeated concepts
    concepts.forEach((concept) => {
      this.conversationMemory.userPreferences[concept] = (this.conversationMemory.userPreferences[concept] || 0) + 1
    })

    // Keep memory manageable
    if (this.conversationMemory.conversationFlow.length > 50) {
      this.conversationMemory.conversationFlow = this.conversationMemory.conversationFlow.slice(-25)
    }
  }

  private getContextualConceptScore(concept: string): number {
    const recentMentions = this.conversationMemory.conversationFlow
      .filter((flow) => Date.now() - flow.timestamp < 300000) // Last 5 minutes
      .filter((flow) => flow.concepts.includes(concept)).length

    return Math.min(recentMentions * 0.2, 1.0)
  }

  public getConversationContext(): ConversationMemory {
    return { ...this.conversationMemory }
  }

  public resolveAmbiguity(text: string, context: string[]): string {
    // Use conversation context to resolve ambiguous references
    let resolvedText = text

    // Replace pronouns with likely references
    const pronounMap: Record<string, string> = {}

    // Find recent nouns that could be referenced
    const recentConcepts = this.conversationMemory.contextualConcepts.slice(-5)

    if (recentConcepts.length > 0) {
      pronounMap["it"] = recentConcepts[recentConcepts.length - 1]
      pronounMap["this"] = recentConcepts[recentConcepts.length - 1]
      pronounMap["that"] = recentConcepts.length > 1 ? recentConcepts[recentConcepts.length - 2] : recentConcepts[0]
    }

    // Apply pronoun resolution
    Object.entries(pronounMap).forEach(([pronoun, replacement]) => {
      const regex = new RegExp(`\\b${pronoun}\\b`, "gi")
      resolvedText = resolvedText.replace(regex, replacement)
    })

    return resolvedText
  }

  public generateContextualSuggestions(currentInput: string): string[] {
    const analysis = this.analyzeSemanticText(currentInput)
    const suggestions: string[] = []

    // Based on conversation history
    const commonConcepts = Object.entries(this.conversationMemory.userPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concept]) => concept)

    if (commonConcepts.length > 0) {
      suggestions.push(`Continue working with ${commonConcepts[0]}`)
    }

    // Based on current concepts
    analysis.then((result) => {
      result.semanticConcepts.forEach((concept) => {
        const relatedConcepts = this.conceptGraph.get(concept)
        if (relatedConcepts) {
          const related = Array.from(relatedConcepts)[0]
          suggestions.push(`Consider adding ${related} functionality`)
        }
      })
    })

    return suggestions.slice(0, 3)
  }
}

export const semanticNLPEngine = SemanticNLPEngine.getInstance()

// Utility functions
export async function analyzeSemanticText(text: string): Promise<SemanticAnalysis> {
  return await semanticNLPEngine.analyzeSemanticText(text)
}

export function resolveTextAmbiguity(text: string, context: string[] = []): string {
  return semanticNLPEngine.resolveAmbiguity(text, context)
}

export function getContextualSuggestions(input: string): string[] {
  return semanticNLPEngine.generateContextualSuggestions(input)
}

export function getConversationMemory(): ConversationMemory {
  return semanticNLPEngine.getConversationContext()
}
