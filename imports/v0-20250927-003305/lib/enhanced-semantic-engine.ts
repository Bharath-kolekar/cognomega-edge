"use client"

import { semanticNLPEngine, type SemanticAnalysis } from "./semantic-nlp-engine"
import { hybridVectorStorage, type VectorSearchResult } from "./hybrid-vector-storage"

export interface EnhancedSemanticResult extends SemanticAnalysis {
  vectorId?: string
  similarTexts: Array<{
    text: string
    similarity: number
    metadata: Record<string, any>
  }>
  contextualRecommendations: string[]
  semanticMemory: {
    shortTerm: string[]
    longTerm: string[]
    patterns: string[]
  }
}

export interface SemanticMemoryConfig {
  maxShortTermMemory: number
  maxLongTermMemory: number
  memoryDecayHours: number
  patternThreshold: number
}

class EnhancedSemanticEngine {
  private static instance: EnhancedSemanticEngine
  private memoryConfig: SemanticMemoryConfig
  private shortTermMemory: Array<{ text: string; timestamp: number; vector: number[] }>
  private longTermPatterns: Map<string, { count: number; lastSeen: number }>

  constructor() {
    this.memoryConfig = {
      maxShortTermMemory: 50,
      maxLongTermMemory: 200,
      memoryDecayHours: 72,
      patternThreshold: 3,
    }
    this.shortTermMemory = []
    this.longTermPatterns = new Map()
    if (typeof window !== "undefined") {
      this.loadMemoryFromStorage()
    }
  }

  public static getInstance(): EnhancedSemanticEngine {
    if (!EnhancedSemanticEngine.instance) {
      EnhancedSemanticEngine.instance = new EnhancedSemanticEngine()
    }
    return EnhancedSemanticEngine.instance
  }

  public async analyzeWithVectorStorage(text: string): Promise<EnhancedSemanticResult> {
    // Get basic semantic analysis
    const basicAnalysis = await semanticNLPEngine.analyzeSemanticText(text)

    // Generate vector embedding for the text
    const vector = this.generateTextVector(text, basicAnalysis.semanticConcepts)

    // Store in hybrid vector storage
    const vectorId = await hybridVectorStorage.storeEmbedding(text, vector, {
      intent: basicAnalysis.intent,
      concepts: basicAnalysis.semanticConcepts,
      confidence: basicAnalysis.confidence,
      timestamp: Date.now(),
    })

    // Find similar texts from storage
    const similarResults = await hybridVectorStorage.searchSimilar(vector, 5)
    const similarTexts = similarResults.map((result) => ({
      text: result.embedding.text,
      similarity: result.similarity,
      metadata: result.embedding.metadata,
    }))

    // Generate contextual recommendations
    const contextualRecommendations = this.generateContextualRecommendations(basicAnalysis, similarResults)

    // Update and get semantic memory
    this.updateSemanticMemory(text, vector, basicAnalysis.semanticConcepts)
    const semanticMemory = this.getSemanticMemory()

    return {
      ...basicAnalysis,
      vectorId,
      similarTexts,
      contextualRecommendations,
      semanticMemory,
    }
  }

  private generateTextVector(text: string, concepts: string[]): number[] {
    // Enhanced vector generation combining multiple approaches
    const vectorSize = 128
    const vector = new Array(vectorSize).fill(0)

    // 1. Character-based features (first 32 dimensions)
    const chars = text.toLowerCase()
    for (let i = 0; i < Math.min(32, chars.length); i++) {
      vector[i] = chars.charCodeAt(i) / 255
    }

    // 2. Word-based features (next 32 dimensions)
    const words = text.toLowerCase().split(/\s+/)
    for (let i = 0; i < Math.min(32, words.length); i++) {
      let wordHash = 0
      for (let j = 0; j < words[i].length; j++) {
        wordHash = ((wordHash << 5) - wordHash + words[i].charCodeAt(j)) & 0xffffffff
      }
      vector[32 + i] = (wordHash % 1000) / 1000
    }

    // 3. Concept-based features (next 32 dimensions)
    concepts.forEach((concept, index) => {
      if (index < 32) {
        let conceptHash = 0
        for (let i = 0; i < concept.length; i++) {
          conceptHash = ((conceptHash << 3) + concept.charCodeAt(i)) & 0xffffffff
        }
        vector[64 + index] = (conceptHash % 1000) / 1000
      }
    })

    // 4. Statistical features (last 32 dimensions)
    vector[96] = text.length / 1000 // Text length
    vector[97] = words.length / 100 // Word count
    vector[98] = concepts.length / 20 // Concept count
    vector[99] = (text.match(/[.!?]/g) || []).length / 10 // Sentence count

    // Fill remaining with derived features
    for (let i = 100; i < vectorSize; i++) {
      vector[i] = Math.sin(i * 0.1) * vector[i % 32] + Math.cos(i * 0.05) * vector[(i + 16) % 64]
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector
  }

  private generateContextualRecommendations(
    analysis: SemanticAnalysis,
    similarResults: VectorSearchResult[],
  ): string[] {
    const recommendations: string[] = []

    // Based on similar texts
    if (similarResults.length > 0) {
      const topSimilar = similarResults[0]
      if (topSimilar.similarity > 0.8) {
        recommendations.push(`This is very similar to: "${topSimilar.embedding.text.substring(0, 50)}..."`)
      }
    }

    // Based on concepts
    if (analysis.semanticConcepts.includes("responsive")) {
      recommendations.push("Consider mobile-first design principles")
    }
    if (analysis.semanticConcepts.includes("authentication")) {
      recommendations.push("Implement secure session management")
    }
    if (analysis.semanticConcepts.includes("database")) {
      recommendations.push("Consider data validation and backup strategies")
    }

    // Based on ambiguity
    if (analysis.contextualAmbiguity > 0.7) {
      recommendations.push("Request more specific requirements to reduce ambiguity")
    }

    // Based on domain specificity
    if (analysis.domainSpecificity < 0.3) {
      recommendations.push("Consider adding technical specifications")
    }

    // Based on conversation patterns
    const patterns = this.detectConversationPatterns()
    if (patterns.includes("iterative_refinement")) {
      recommendations.push("Building on previous iterations - maintain consistency")
    }

    return recommendations.slice(0, 5)
  }

  private updateSemanticMemory(text: string, vector: number[], concepts: string[]) {
    const now = Date.now()

    // Add to short-term memory
    this.shortTermMemory.push({ text, timestamp: now, vector })

    // Maintain short-term memory size
    if (this.shortTermMemory.length > this.memoryConfig.maxShortTermMemory) {
      this.shortTermMemory.shift()
    }

    // Update long-term patterns
    concepts.forEach((concept) => {
      const existing = this.longTermPatterns.get(concept)
      if (existing) {
        existing.count++
        existing.lastSeen = now
      } else {
        this.longTermPatterns.set(concept, { count: 1, lastSeen: now })
      }
    })

    // Clean up old patterns
    const expiryTime = this.memoryConfig.memoryDecayHours * 60 * 60 * 1000
    for (const [concept, data] of this.longTermPatterns.entries()) {
      if (now - data.lastSeen > expiryTime) {
        this.longTermPatterns.delete(concept)
      }
    }

    this.saveMemoryToStorage()
  }

  private getSemanticMemory() {
    const now = Date.now()
    const recentThreshold = 30 * 60 * 1000 // 30 minutes

    // Short-term: recent inputs
    const shortTerm = this.shortTermMemory
      .filter((item) => now - item.timestamp < recentThreshold)
      .map((item) => item.text.substring(0, 100))

    // Long-term: frequent patterns
    const longTerm = Array.from(this.longTermPatterns.entries())
      .filter(([, data]) => data.count >= this.memoryConfig.patternThreshold)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, this.memoryConfig.maxLongTermMemory)
      .map(([concept]) => concept)

    // Patterns: detected conversation patterns
    const patterns = this.detectConversationPatterns()

    return { shortTerm, longTerm, patterns }
  }

  private detectConversationPatterns(): string[] {
    const patterns: string[] = []

    // Analyze short-term memory for patterns
    if (this.shortTermMemory.length >= 3) {
      const recentTexts = this.shortTermMemory.slice(-3).map((item) => item.text.toLowerCase())

      // Iterative refinement pattern
      if (recentTexts.some((text) => text.includes("change") || text.includes("modify") || text.includes("update"))) {
        patterns.push("iterative_refinement")
      }

      // Feature addition pattern
      if (recentTexts.some((text) => text.includes("add") || text.includes("include") || text.includes("also"))) {
        patterns.push("feature_expansion")
      }

      // Problem-solving pattern
      if (recentTexts.some((text) => text.includes("fix") || text.includes("error") || text.includes("issue"))) {
        patterns.push("problem_solving")
      }
    }

    // Analyze long-term patterns
    const frequentConcepts = Array.from(this.longTermPatterns.entries())
      .filter(([, data]) => data.count >= 5)
      .map(([concept]) => concept)

    if (frequentConcepts.includes("responsive") && frequentConcepts.includes("mobile")) {
      patterns.push("mobile_focus")
    }

    if (frequentConcepts.includes("database") && frequentConcepts.includes("api")) {
      patterns.push("full_stack_development")
    }

    return patterns
  }

  private loadMemoryFromStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      console.warn("[v0] Failed to load semantic memory: localStorage not available")
      return
    }

    try {
      const shortTermData = localStorage.getItem("cognomega_short_term_memory")
      if (shortTermData) {
        this.shortTermMemory = JSON.parse(shortTermData)
      }

      const longTermData = localStorage.getItem("cognomega_long_term_patterns")
      if (longTermData) {
        const data = JSON.parse(longTermData)
        this.longTermPatterns = new Map(Object.entries(data))
      }
    } catch (error) {
      console.warn("[v0] Failed to load semantic memory:", error)
    }
  }

  private saveMemoryToStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return
    }

    try {
      localStorage.setItem("cognomega_short_term_memory", JSON.stringify(this.shortTermMemory))

      const longTermData: Record<string, any> = {}
      this.longTermPatterns.forEach((value, key) => {
        longTermData[key] = value
      })
      localStorage.setItem("cognomega_long_term_patterns", JSON.stringify(longTermData))
    } catch (error) {
      console.warn("[v0] Failed to save semantic memory:", error)
    }
  }

  public async findSemanticallySimilarTexts(text: string, limit = 10): Promise<VectorSearchResult[]> {
    const analysis = await semanticNLPEngine.analyzeSemanticText(text)
    const vector = this.generateTextVector(text, analysis.semanticConcepts)
    return await hybridVectorStorage.searchSimilar(vector, limit)
  }

  public getMemoryStats() {
    return {
      shortTermCount: this.shortTermMemory.length,
      longTermPatterns: this.longTermPatterns.size,
      topPatterns: Array.from(this.longTermPatterns.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([concept, data]) => ({ concept, count: data.count })),
    }
  }

  public clearMemory() {
    this.shortTermMemory = []
    this.longTermPatterns.clear()
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("cognomega_short_term_memory")
        localStorage.removeItem("cognomega_long_term_patterns")
      } catch (error) {
        console.warn("[v0] Failed to clear memory storage:", error)
      }
    }
  }
}

let _enhancedSemanticEngineInstance: EnhancedSemanticEngine | null = null

export const enhancedSemanticEngine = new Proxy({} as EnhancedSemanticEngine, {
  get(target, prop) {
    if (!_enhancedSemanticEngineInstance) {
      _enhancedSemanticEngineInstance = EnhancedSemanticEngine.getInstance()
    }
    return _enhancedSemanticEngineInstance[prop as keyof EnhancedSemanticEngine]
  },
})

// Utility functions
export async function analyzeTextWithVectors(text: string): Promise<EnhancedSemanticResult> {
  return await enhancedSemanticEngine.analyzeWithVectorStorage(text)
}

export async function findSimilarTexts(text: string, limit?: number): Promise<VectorSearchResult[]> {
  return await enhancedSemanticEngine.findSemanticallySimilarTexts(text, limit)
}

export function getSemanticMemoryStats() {
  return enhancedSemanticEngine.getMemoryStats()
}
