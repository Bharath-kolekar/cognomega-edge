import { analyzeUserInputEnhanced, type EnhancedNLPAnalysis, IntentType } from "./nlp-utils"
import type { VoiceCommand as AdvancedVoiceCommand } from "./advanced-voice-engine"

export interface VoiceCommand {
  command: string
  confidence: number
  intent: IntentType
  parameters: Record<string, any>
  timestamp: Date
}

export interface VoiceProcessingResult {
  originalTranscript: string
  cleanedTranscript: string
  commands: VoiceCommand[]
  nlpAnalysis: EnhancedNLPAnalysis
  processingTime: number
  suggestions: string[]
  emotionAnalysis?: import("./advanced-voice-engine").EmotionAnalysis
  voiceCharacteristics?: AdvancedVoiceCommand["voiceCharacteristics"]
  language?: string
}

export interface SpeechPattern {
  pattern: RegExp
  intent: IntentType
  extractor: (match: RegExpMatchArray) => Record<string, any>
  confidence: number
}

class VoiceCommandProcessor {
  private speechPatterns: SpeechPattern[] = []
  private commandHistory: VoiceCommand[] = []

  constructor() {
    this.initializeSpeechPatterns()
    this.initializeAdvancedVoiceListeners()
  }

  private initializeSpeechPatterns() {
    this.speechPatterns = [
      // UI Creation patterns
      {
        pattern: /create\s+(?:a\s+)?(\w+)\s+(?:page|component|interface)/i,
        intent: IntentType.UI_CREATION,
        extractor: (match) => ({ componentType: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /build\s+(?:a\s+)?(\w+)\s+with\s+(.+)/i,
        intent: IntentType.UI_CREATION,
        extractor: (match) => ({ componentType: match[1], features: match[2] }),
        confidence: 0.85,
      },
      {
        pattern: /make\s+(?:a\s+)?responsive\s+(.+)/i,
        intent: IntentType.UI_CREATION,
        extractor: (match) => ({ componentType: match[1], responsive: true }),
        confidence: 0.8,
      },

      // Backend patterns
      {
        pattern: /setup\s+(?:an?\s+)?api\s+(?:for\s+)?(.+)/i,
        intent: IntentType.BACKEND_SETUP,
        extractor: (match) => ({ apiFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /create\s+(?:a\s+)?server\s+function\s+(?:for\s+)?(.+)/i,
        intent: IntentType.BACKEND_SETUP,
        extractor: (match) => ({ functionFor: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /add\s+authentication\s+(?:to\s+)?(.+)/i,
        intent: IntentType.BACKEND_SETUP,
        extractor: (match) => ({ authFor: match[1] }),
        confidence: 0.9,
      },

      // Database patterns
      {
        pattern: /create\s+(?:a\s+)?database\s+(?:table\s+)?(?:for\s+)?(.+)/i,
        intent: IntentType.DATABASE_OPERATION,
        extractor: (match) => ({ tableFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /setup\s+(?:a\s+)?schema\s+(?:for\s+)?(.+)/i,
        intent: IntentType.DATABASE_OPERATION,
        extractor: (match) => ({ schemaFor: match[1] }),
        confidence: 0.85,
      },

      // API Design patterns
      {
        pattern: /design\s+(?:an?\s+)?(?:api\s+)?(?:for\s+)?(.+)/i,
        intent: IntentType.API_DESIGN,
        extractor: (match) => ({ apiFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /create\s+(?:an?\s+)?api\s+specification\s+(?:for\s+)?(.+)/i,
        intent: IntentType.API_DESIGN,
        extractor: (match) => ({ specFor: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /generate\s+(?:an?\s+)?openapi\s+(?:spec|schema)\s+(?:for\s+)?(.+)/i,
        intent: IntentType.API_DESIGN,
        extractor: (match) => ({ openApiFor: match[1] }),
        confidence: 0.9,
      },

      // Code Refactor patterns
      {
        pattern: /refactor\s+(?:the\s+)?(.+)/i,
        intent: IntentType.CODE_REFACTOR,
        extractor: (match) => ({ codeToRefactor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /optimize\s+(?:the\s+)?(.+)/i,
        intent: IntentType.CODE_REFACTOR,
        extractor: (match) => ({ codeToOptimize: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /improve\s+(?:the\s+)?performance\s+of\s+(.+)/i,
        intent: IntentType.CODE_REFACTOR,
        extractor: (match) => ({ performanceTarget: match[1] }),
        confidence: 0.9,
      },

      // Test Generation patterns
      {
        pattern: /generate\s+tests\s+(?:for\s+)?(.+)/i,
        intent: IntentType.TEST_GENERATION,
        extractor: (match) => ({ testFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /create\s+(?:unit\s+)?tests\s+(?:for\s+)?(.+)/i,
        intent: IntentType.TEST_GENERATION,
        extractor: (match) => ({ unitTestFor: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /write\s+(?:integration\s+)?tests\s+(?:for\s+)?(.+)/i,
        intent: IntentType.TEST_GENERATION,
        extractor: (match) => ({ integrationTestFor: match[1] }),
        confidence: 0.85,
      },

      // App Planning patterns
      {
        pattern: /plan\s+(?:an?\s+)?(?:application|app)\s+(?:for\s+)?(.+)/i,
        intent: IntentType.APP_PLANNING,
        extractor: (match) => ({ appFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /decompose\s+(?:the\s+)?(.+)\s+(?:application|app)/i,
        intent: IntentType.APP_PLANNING,
        extractor: (match) => ({ appToDecompose: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /create\s+(?:an?\s+)?architecture\s+(?:plan\s+)?(?:for\s+)?(.+)/i,
        intent: IntentType.APP_PLANNING,
        extractor: (match) => ({ architectureFor: match[1] }),
        confidence: 0.9,
      },

      // SQL Analytics patterns
      {
        pattern: /generate\s+sql\s+(?:query|queries)\s+(?:for\s+)?(.+)/i,
        intent: IntentType.SQL_ANALYTICS,
        extractor: (match) => ({ sqlFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /analyze\s+(?:the\s+)?(.+)\s+data/i,
        intent: IntentType.SQL_ANALYTICS,
        extractor: (match) => ({ dataToAnalyze: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /create\s+(?:a\s+)?report\s+(?:for\s+)?(.+)/i,
        intent: IntentType.SQL_ANALYTICS,
        extractor: (match) => ({ reportFor: match[1] }),
        confidence: 0.8,
      },

      // Database Design patterns
      {
        pattern: /design\s+(?:a\s+)?database\s+(?:schema\s+)?(?:for\s+)?(.+)/i,
        intent: IntentType.DATABASE_DESIGN,
        extractor: (match) => ({ schemaFor: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /create\s+(?:database\s+)?tables\s+(?:for\s+)?(.+)/i,
        intent: IntentType.DATABASE_DESIGN,
        extractor: (match) => ({ tablesFor: match[1] }),
        confidence: 0.85,
      },
      {
        pattern: /model\s+(?:the\s+)?(.+)\s+(?:data|entities)/i,
        intent: IntentType.DATABASE_DESIGN,
        extractor: (match) => ({ entitiesToModel: match[1] }),
        confidence: 0.8,
      },

      // Styling patterns
      {
        pattern: /make\s+(?:it\s+)?look\s+(\w+)/i,
        intent: IntentType.STYLING_REQUEST,
        extractor: (match) => ({ style: match[1] }),
        confidence: 0.8,
      },
      {
        pattern: /change\s+(?:the\s+)?color(?:s)?\s+to\s+(\w+)/i,
        intent: IntentType.STYLING_REQUEST,
        extractor: (match) => ({ color: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /add\s+(?:some\s+)?animations?\s+(?:to\s+)?(.+)/i,
        intent: IntentType.STYLING_REQUEST,
        extractor: (match) => ({ animateWhat: match[1] }),
        confidence: 0.85,
      },

      // Feature patterns
      {
        pattern: /add\s+(?:a\s+)?(\w+)\s+feature/i,
        intent: IntentType.FEATURE_REQUEST,
        extractor: (match) => ({ featureType: match[1] }),
        confidence: 0.9,
      },
      {
        pattern: /integrate\s+with\s+(\w+)/i,
        intent: IntentType.FEATURE_REQUEST,
        extractor: (match) => ({ integration: match[1] }),
        confidence: 0.85,
      },

      // Question patterns
      {
        pattern: /how\s+(?:do\s+i|can\s+i)\s+(.+)/i,
        intent: IntentType.QUESTION,
        extractor: (match) => ({ question: match[1] }),
        confidence: 0.8,
      },
      {
        pattern: /what\s+is\s+(.+)/i,
        intent: IntentType.QUESTION,
        extractor: (match) => ({ about: match[1] }),
        confidence: 0.8,
      },
    ]
  }

  private initializeAdvancedVoiceListeners() {
    if (typeof window !== "undefined") {
      window.addEventListener("advancedVoiceCommand", (event: any) => {
        this.handleAdvancedVoiceCommand(event.detail)
      })
    }
  }

  private async handleAdvancedVoiceCommand(detail: {
    voiceCommand: AdvancedVoiceCommand
    semanticAnalysis: any
    timestamp: number
  }) {
    const { voiceCommand, semanticAnalysis } = detail

    // Process with enhanced capabilities
    const result = await this.processVoiceInput(voiceCommand.transcript)

    // Add advanced voice data to result
    const enhancedResult: VoiceProcessingResult = {
      ...result,
      emotionAnalysis: voiceCommand.emotion,
      voiceCharacteristics: voiceCommand.voiceCharacteristics,
      language: voiceCommand.language,
    }

    // Dispatch enhanced result
    window.dispatchEvent(new CustomEvent("enhancedVoiceResult", { detail: enhancedResult }))
  }

  async processVoiceInput(transcript: string): Promise<VoiceProcessingResult> {
    const startTime = Date.now()

    // Clean the transcript
    const cleanedTranscript = this.cleanTranscript(transcript)

    // Get enhanced NLP analysis
    const nlpAnalysis = await analyzeUserInputEnhanced(cleanedTranscript)

    // Extract voice commands using pattern matching
    const commands = this.extractCommands(cleanedTranscript, nlpAnalysis)

    // Generate suggestions based on analysis
    const suggestions = this.generateSuggestions(nlpAnalysis)

    const processingTime = Date.now() - startTime

    // Store in history
    commands.forEach((cmd) => this.commandHistory.push(cmd))

    return {
      originalTranscript: transcript,
      cleanedTranscript,
      commands,
      nlpAnalysis,
      processingTime,
      suggestions,
    }
  }

  private cleanTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .replace(/\buh+\b/g, "") // Remove filler words
      .replace(/\bum+\b/g, "")
      .replace(/\ber+\b/g, "")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
  }

  private extractCommands(transcript: string, nlpAnalysis: EnhancedNLPAnalysis): VoiceCommand[] {
    const commands: VoiceCommand[] = []

    // Try pattern matching first
    for (const pattern of this.speechPatterns) {
      const match = transcript.match(pattern.pattern)
      if (match) {
        const parameters = pattern.extractor(match)
        commands.push({
          command: match[0],
          confidence: pattern.confidence,
          intent: pattern.intent,
          parameters,
          timestamp: new Date(),
        })
      }
    }

    // If no patterns matched, create a command from NLP analysis
    if (commands.length === 0) {
      commands.push({
        command: transcript,
        confidence: nlpAnalysis.confidence,
        intent: nlpAnalysis.intent,
        parameters: {
          keywords: nlpAnalysis.keywords,
          entities: nlpAnalysis.entities,
          keyPhrases: nlpAnalysis.keyPhrases,
        },
        timestamp: new Date(),
      })
    }

    return commands
  }

  private generateSuggestions(analysis: EnhancedNLPAnalysis): string[] {
    const suggestions: string[] = []

    // Intent-based suggestions
    switch (analysis.intent) {
      case IntentType.UI_CREATION:
        suggestions.push(
          "Try: 'Create a responsive dashboard with charts'",
          "Try: 'Build a landing page with hero section'",
          "Try: 'Make a contact form with validation'",
        )
        break
      case IntentType.BACKEND_SETUP:
        suggestions.push(
          "Try: 'Setup API for user management'",
          "Try: 'Create authentication system'",
          "Try: 'Add server functions for data processing'",
        )
        break
      case IntentType.DATABASE_OPERATION:
        suggestions.push(
          "Try: 'Create database schema for users'",
          "Try: 'Setup tables for blog posts'",
          "Try: 'Add CRUD operations for products'",
        )
        break
      case IntentType.STYLING_REQUEST:
        suggestions.push(
          "Try: 'Make it look modern'",
          "Try: 'Change colors to blue theme'",
          "Try: 'Add smooth animations'",
        )
        break
      case IntentType.API_DESIGN:
        suggestions.push(
          "Try: 'Design API for user management'",
          "Try: 'Create OpenAPI spec for e-commerce'",
          "Try: 'Generate REST endpoints for blog'",
        )
        break
      case IntentType.CODE_REFACTOR:
        suggestions.push(
          "Try: 'Refactor the authentication logic'",
          "Try: 'Optimize the database queries'",
          "Try: 'Improve performance of the dashboard'",
        )
        break
      case IntentType.TEST_GENERATION:
        suggestions.push(
          "Try: 'Generate tests for user service'",
          "Try: 'Create unit tests for API endpoints'",
          "Try: 'Write integration tests for checkout'",
        )
        break
      case IntentType.APP_PLANNING:
        suggestions.push(
          "Try: 'Plan application for task management'",
          "Try: 'Create architecture for social media app'",
          "Try: 'Decompose e-commerce application'",
        )
        break
      case IntentType.SQL_ANALYTICS:
        suggestions.push(
          "Try: 'Generate SQL for sales analysis'",
          "Try: 'Create report for user engagement'",
          "Try: 'Analyze customer behavior data'",
        )
        break
      case IntentType.DATABASE_DESIGN:
        suggestions.push(
          "Try: 'Design database for inventory system'",
          "Try: 'Create tables for blog platform'",
          "Try: 'Model user relationship data'",
        )
        break
      default:
        suggestions.push(
          "Try being more specific about what you want to create",
          "Mention the type of component or feature you need",
          "Include details about styling or functionality",
        )
    }

    // Complexity-based suggestions
    if (analysis.complexity === "simple") {
      suggestions.push("You can add more details for a richer implementation")
    } else if (analysis.complexity === "complex") {
      suggestions.push("Consider breaking this into smaller, specific requests")
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  // Get command history for context
  getCommandHistory(limit = 10): VoiceCommand[] {
    return this.commandHistory.slice(-limit)
  }

  // Clear command history
  clearHistory(): void {
    this.commandHistory = []
  }

  // Get most common intents from history
  getCommonIntents(): Array<{ intent: IntentType; count: number }> {
    const intentCounts = new Map<IntentType, number>()

    this.commandHistory.forEach((cmd) => {
      intentCounts.set(cmd.intent, (intentCounts.get(cmd.intent) || 0) + 1)
    })

    return Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Contextual command processing based on history
  processWithContext(transcript: string): Promise<VoiceProcessingResult> {
    // Add context from recent commands
    const recentCommands = this.getCommandHistory(3)
    const contextualTranscript = this.addContextToTranscript(transcript, recentCommands)

    return this.processVoiceInput(contextualTranscript)
  }

  private addContextToTranscript(transcript: string, recentCommands: VoiceCommand[]): string {
    if (recentCommands.length === 0) return transcript

    // If the current transcript is very short, add context from recent commands
    if (transcript.split(" ").length < 3) {
      const lastCommand = recentCommands[recentCommands.length - 1]
      if (lastCommand.parameters.componentType) {
        return `${transcript} for ${lastCommand.parameters.componentType}`
      }
    }

    return transcript
  }
}

// Export singleton instance
export const voiceProcessor = new VoiceCommandProcessor()

// Utility functions
export async function processVoiceCommand(transcript: string): Promise<VoiceProcessingResult> {
  return await voiceProcessor.processVoiceInput(transcript)
}

export function getVoiceCommandHistory(limit?: number): VoiceCommand[] {
  return voiceProcessor.getCommandHistory(limit)
}

export function clearVoiceHistory(): void {
  voiceProcessor.clearHistory()
}

export async function processVoiceWithContext(transcript: string): Promise<VoiceProcessingResult> {
  return await voiceProcessor.processWithContext(transcript)
}
