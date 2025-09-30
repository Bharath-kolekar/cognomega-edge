export interface TextAnalysis {
  originalText: string
  cleanedText: string
  tokens: string[]
  stemmedTokens: string[]
  namedEntities: NamedEntity[]
  readabilityScore: number
  complexity: "simple" | "moderate" | "complex"
  languageDetection: string
  textStatistics: TextStatistics
}

export interface NamedEntity {
  text: string
  type: "PERSON" | "ORGANIZATION" | "LOCATION" | "TECHNOLOGY" | "COMPONENT" | "OTHER"
  confidence: number
  position: { start: number; end: number }
}

export interface TextStatistics {
  wordCount: number
  sentenceCount: number
  averageWordsPerSentence: number
  uniqueWords: number
  lexicalDiversity: number
  mostFrequentWords: Array<{ word: string; count: number }>
}

class AdvancedTextProcessor {
  private static instance: AdvancedTextProcessor

  public static getInstance(): AdvancedTextProcessor {
    if (!AdvancedTextProcessor.instance) {
      AdvancedTextProcessor.instance = new AdvancedTextProcessor()
    }
    return AdvancedTextProcessor.instance
  }

  async processText(text: string): Promise<TextAnalysis> {
    const cleanedText = this.cleanText(text)
    const tokens = this.tokenizeText(cleanedText)
    const stemmedTokens = this.stemTokens(tokens)
    const namedEntities = this.extractNamedEntities(text)
    const readabilityScore = this.calculateReadability(text)
    const complexity = this.determineComplexity(readabilityScore, tokens.length)
    const languageDetection = this.detectLanguage(text)
    const textStatistics = this.calculateStatistics(text, tokens)

    return {
      originalText: text,
      cleanedText,
      tokens,
      stemmedTokens,
      namedEntities,
      readabilityScore,
      complexity,
      languageDetection,
      textStatistics,
    }
  }

  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
  }

  private tokenizeText(text: string): string[] {
    return text.split(/\s+/).filter((token) => token.length > 0)
  }

  private stemTokens(tokens: string[]): string[] {
    // Simple stemming algorithm (Porter Stemmer approximation)
    return tokens.map((token) => this.simpleStem(token))
  }

  private simpleStem(word: string): string {
    // Basic stemming rules
    if (word.endsWith("ing")) return word.slice(0, -3)
    if (word.endsWith("ed")) return word.slice(0, -2)
    if (word.endsWith("er")) return word.slice(0, -2)
    if (word.endsWith("est")) return word.slice(0, -3)
    if (word.endsWith("ly")) return word.slice(0, -2)
    if (word.endsWith("s") && word.length > 3) return word.slice(0, -1)
    return word
  }

  private extractNamedEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = []

    // Technology entities
    const techPatterns = [
      { pattern: /\b(react|reactjs|react\.js)\b/gi, type: "TECHNOLOGY" as const },
      { pattern: /\b(next|nextjs|next\.js)\b/gi, type: "TECHNOLOGY" as const },
      { pattern: /\b(typescript|javascript|ts|js)\b/gi, type: "TECHNOLOGY" as const },
      { pattern: /\b(tailwind|tailwindcss|css)\b/gi, type: "TECHNOLOGY" as const },
      { pattern: /\b(node|nodejs|express|fastify)\b/gi, type: "TECHNOLOGY" as const },
      { pattern: /\b(mongodb|mysql|postgresql|sqlite|supabase|neon)\b/gi, type: "TECHNOLOGY" as const },
    ]

    // Component entities
    const componentPatterns = [
      {
        pattern: /\b(button|btn|form|modal|dialog|navbar|navigation|header|footer|sidebar|card|table|grid|list)\b/gi,
        type: "COMPONENT" as const,
      },
      {
        pattern: /\b(input|textarea|select|dropdown|checkbox|radio|slider|toggle|switch)\b/gi,
        type: "COMPONENT" as const,
      },
    ]

    // Person entities (simple pattern matching)
    const personPatterns = [{ pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: "PERSON" as const }]

    // Organization entities
    const orgPatterns = [
      {
        pattern: /\b(Google|Microsoft|Apple|Amazon|Meta|Facebook|Netflix|Spotify|Uber|Airbnb|Tesla)\b/gi,
        type: "ORGANIZATION" as const,
      },
    ]

    const allPatterns = [...techPatterns, ...componentPatterns, ...personPatterns, ...orgPatterns]

    allPatterns.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type,
          confidence: 0.8, // Simple confidence score
          position: { start: match.index, end: match.index + match[0].length },
        })
      }
    })

    return entities
  }

  private calculateReadability(text: string): number {
    // Simplified Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const words = this.tokenizeText(text)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)

    if (sentences.length === 0 || words.length === 0) return 0

    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    return Math.max(0, Math.min(100, score))
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    word = word.toLowerCase()
    if (word.length <= 3) return 1

    const vowels = "aeiouy"
    let syllableCount = 0
    let previousWasVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        syllableCount++
      }
      previousWasVowel = isVowel
    }

    // Handle silent 'e'
    if (word.endsWith("e")) {
      syllableCount--
    }

    return Math.max(1, syllableCount)
  }

  private determineComplexity(readabilityScore: number, tokenCount: number): "simple" | "moderate" | "complex" {
    if (readabilityScore > 70 && tokenCount < 20) return "simple"
    if (readabilityScore > 50 && tokenCount < 50) return "moderate"
    return "complex"
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "a", "an"]
    const words = this.tokenizeText(text.toLowerCase())
    const englishWordCount = words.filter((word) => englishWords.includes(word)).length
    const englishRatio = englishWordCount / words.length

    return englishRatio > 0.1 ? "en" : "unknown"
  }

  private calculateStatistics(text: string, tokens: string[]): TextStatistics {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const wordFrequency = new Map<string, number>()

    tokens.forEach((token) => {
      wordFrequency.set(token, (wordFrequency.get(token) || 0) + 1)
    })

    const uniqueWords = wordFrequency.size
    const lexicalDiversity = uniqueWords / tokens.length

    const mostFrequentWords = Array.from(wordFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))

    return {
      wordCount: tokens.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: tokens.length / Math.max(1, sentences.length),
      uniqueWords,
      lexicalDiversity,
      mostFrequentWords,
    }
  }

  // Advanced preprocessing for better AI understanding
  preprocessForAI(text: string): string {
    return text // Simple implementation for browser compatibility
  }

  // Text similarity calculation
  calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenizeText(this.cleanText(text1)))
    const tokens2 = new Set(this.tokenizeText(this.cleanText(text2)))

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])

    return intersection.size / union.size // Jaccard similarity
  }

  // Extract key phrases using n-grams
  extractKeyPhrases(text: string, n = 2): string[] {
    const tokens = this.tokenizeText(this.cleanText(text))
    const nGrams: string[] = []

    for (let i = 0; i <= tokens.length - n; i++) {
      const nGram = tokens.slice(i, i + n).join(" ")
      nGrams.push(nGram)
    }

    // Filter out common phrases and return unique ones
    const commonPhrases = new Set(["of the", "in the", "to the", "for the", "and the", "with the"])
    return [...new Set(nGrams.filter((phrase) => !commonPhrases.has(phrase)))]
  }
}

// Export singleton instance
export const textProcessor = AdvancedTextProcessor.getInstance()

// Utility functions
export async function analyzeText(text: string): Promise<TextAnalysis> {
  return await textProcessor.processText(text)
}

export function preprocessTextForAI(text: string): string {
  return textProcessor.preprocessForAI(text)
}

export function calculateTextSimilarity(text1: string, text2: string): number {
  return textProcessor.calculateSimilarity(text1, text2)
}

export function extractKeyPhrases(text: string, n = 2): string[] {
  return textProcessor.extractKeyPhrases(text, n)
}
