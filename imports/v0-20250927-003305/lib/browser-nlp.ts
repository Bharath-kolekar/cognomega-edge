// Browser-compatible NLP utilities using pure JavaScript
export interface NLPAnalysis {
  intent: string
  confidence: number
  entities: string[]
  sentiment: "positive" | "negative" | "neutral"
  keywords: string[]
  complexity: number
}

export interface TextStats {
  wordCount: number
  sentenceCount: number
  avgWordsPerSentence: number
  readabilityScore: number
}

export class BrowserNLP {
  private static instance: BrowserNLP

  // Intent patterns for different types of requests
  private intentPatterns = {
    ui_creation: [
      /create|build|make|design|generate.*(?:component|ui|interface|page|form|button|modal|dashboard)/i,
      /(?:component|ui|interface|page|form|button|modal|dashboard).*(?:create|build|make|design|generate)/i,
      /add.*(?:component|ui|interface|page|form|button|modal|dashboard)/i,
    ],
    backend_setup: [
      /(?:api|backend|server|database|auth|authentication).*(?:setup|create|build|configure)/i,
      /setup|create|build|configure.*(?:api|backend|server|database|auth|authentication)/i,
      /add.*(?:api|backend|server|database|auth|authentication)/i,
    ],
    styling: [
      /(?:style|css|design|color|theme|layout).*(?:change|update|modify|fix)/i,
      /change|update|modify|fix.*(?:style|css|design|color|theme|layout)/i,
      /make.*(?:blue|red|green|yellow|purple|orange|black|white|gray)/i,
    ],
    data_management: [
      /(?:data|database|table|record|user|crud).*(?:manage|handle|process|store)/i,
      /manage|handle|process|store.*(?:data|database|table|record|user)/i,
      /(?:add|create|update|delete|fetch|get).*(?:data|record|user)/i,
    ],
    enhancement: [
      /(?:improve|enhance|optimize|upgrade|better|fix)/i,
      /add.*(?:feature|functionality|capability)/i,
      /make.*(?:better|faster|more|responsive)/i,
    ],
  }

  // Technology and UI keywords
  private techKeywords = [
    "react",
    "nextjs",
    "typescript",
    "javascript",
    "tailwind",
    "css",
    "html",
    "api",
    "database",
    "auth",
    "authentication",
    "component",
    "hook",
    "state",
    "form",
    "button",
    "modal",
    "dashboard",
    "chart",
    "table",
    "card",
    "layout",
  ]

  // Sentiment indicators
  private positiveWords = ["good", "great", "awesome", "excellent", "perfect", "love", "like", "amazing", "wonderful"]
  private negativeWords = [
    "bad",
    "terrible",
    "awful",
    "hate",
    "dislike",
    "broken",
    "wrong",
    "error",
    "problem",
    "issue",
  ]

  public static getInstance(): BrowserNLP {
    if (!BrowserNLP.instance) {
      BrowserNLP.instance = new BrowserNLP()
    }
    return BrowserNLP.instance
  }

  public analyzeText(text: string): NLPAnalysis {
    const cleanText = this.preprocessText(text)
    const words = this.tokenize(cleanText)

    return {
      intent: this.detectIntent(cleanText),
      confidence: this.calculateConfidence(cleanText),
      entities: this.extractEntities(words),
      sentiment: this.analyzeSentiment(words),
      keywords: this.extractKeywords(words),
      complexity: this.calculateComplexity(cleanText),
    }
  }

  public getTextStats(text: string): TextStats {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const words = this.tokenize(text)

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      readabilityScore: this.calculateReadability(text, words.length, sentences.length),
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter((word) => word.length > 0)
  }

  private detectIntent(text: string): string {
    let bestIntent = "general"
    let maxMatches = 0

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      const matches = patterns.reduce((count, pattern) => {
        return count + (pattern.test(text) ? 1 : 0)
      }, 0)

      if (matches > maxMatches) {
        maxMatches = matches
        bestIntent = intent
      }
    }

    return bestIntent
  }

  private calculateConfidence(text: string): number {
    const words = this.tokenize(text)
    const techWordCount = words.filter((word) => this.techKeywords.some((tech) => word.includes(tech))).length

    // Base confidence on text length and tech keyword density
    const lengthScore = Math.min(words.length / 10, 1)
    const techScore = Math.min((techWordCount / words.length) * 5, 1)

    return Math.round((lengthScore * 0.6 + techScore * 0.4) * 100) / 100
  }

  private extractEntities(words: string[]): string[] {
    const entities = new Set<string>()

    // Extract tech-related entities
    words.forEach((word) => {
      this.techKeywords.forEach((tech) => {
        if (word.includes(tech)) {
          entities.add(tech)
        }
      })
    })

    // Extract potential UI components (words ending in common UI suffixes)
    words.forEach((word) => {
      if (/(?:button|form|modal|card|table|chart|menu|nav|header|footer)$/.test(word)) {
        entities.add(word)
      }
    })

    return Array.from(entities)
  }

  private analyzeSentiment(words: string[]): "positive" | "negative" | "neutral" {
    let positiveScore = 0
    let negativeScore = 0

    words.forEach((word) => {
      if (this.positiveWords.includes(word)) positiveScore++
      if (this.negativeWords.includes(word)) negativeScore++
    })

    if (positiveScore > negativeScore) return "positive"
    if (negativeScore > positiveScore) return "negative"
    return "neutral"
  }

  private extractKeywords(words: string[]): string[] {
    // Simple keyword extraction based on word frequency and relevance
    const wordFreq = new Map<string, number>()

    words.forEach((word) => {
      if (word.length > 3) {
        // Filter out short words
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    // Sort by frequency and relevance
    return Array.from(wordFreq.entries())
      .sort((a, b) => {
        const aRelevance = this.techKeywords.includes(a[0]) ? 2 : 1
        const bRelevance = this.techKeywords.includes(b[0]) ? 2 : 1
        return b[1] * bRelevance - a[1] * aRelevance
      })
      .slice(0, 5)
      .map(([word]) => word)
  }

  private calculateComplexity(text: string): number {
    const words = this.tokenize(text)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgSentenceLength = words.length / sentences.length

    // Normalize complexity score (0-1)
    return Math.min((avgWordLength / 10 + avgSentenceLength / 20) / 2, 1)
  }

  private calculateReadability(text: string, wordCount: number, sentenceCount: number): number {
    if (sentenceCount === 0) return 0

    // Simplified Flesch Reading Ease approximation
    const avgSentenceLength = wordCount / sentenceCount
    const avgWordLength = text.replace(/\s/g, "").length / wordCount

    // Higher score = easier to read
    return Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - (84.6 * avgWordLength) / 5))
  }
}

// Export singleton instance
export const browserNLP = BrowserNLP.getInstance()
