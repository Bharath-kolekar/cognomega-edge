import { IntentType, type EnhancedNLPAnalysis } from "./nlp-utils"
import type { VoiceCommand, VoiceProcessingResult } from "./voice-processor"

export interface SmartResponse {
  spokenMessage: string
  displayMessage: string
  actionSuggestions: string[]
  followUpQuestions: string[]
  confidence: number
  responseType: "success" | "error" | "clarification" | "suggestion"
  metadata: {
    processingTime: number
    intentMatched: boolean
    contextUsed: boolean
    personalizedLevel: "low" | "medium" | "high"
  }
}

export interface ResponseContext {
  userHistory: VoiceCommand[]
  previousResponses: SmartResponse[]
  sessionDuration: number
  userPreferences: UserPreferences
}

export interface UserPreferences {
  verbosity: "concise" | "detailed" | "comprehensive"
  technicalLevel: "beginner" | "intermediate" | "advanced"
  preferredTechnologies: string[]
  communicationStyle: "formal" | "casual" | "friendly"
}

class SmartResponseGenerator {
  private responseTemplates: Map<IntentType, ResponseTemplate[]> = new Map()
  private userSessions: Map<string, ResponseContext> = new Map()
  private defaultPreferences: UserPreferences = {
    verbosity: "detailed",
    technicalLevel: "intermediate",
    preferredTechnologies: ["react", "typescript", "tailwind"],
    communicationStyle: "friendly",
  }

  constructor() {
    this.initializeResponseTemplates()
  }

  private initializeResponseTemplates() {
    // UI Creation templates
    this.responseTemplates.set(IntentType.UI_CREATION, [
      {
        pattern: /dashboard|admin/i,
        spokenTemplate:
          "I've created a {componentType} with modern design and responsive layout. It includes {features} and follows best practices for user experience.",
        displayTemplate: "✨ Generated {componentType} with {features}",
        suggestions: ["Add charts and analytics", "Include user management", "Add dark mode support"],
        followUps: ["Would you like to add authentication?", "Should I include data visualization?"],
      },
      {
        pattern: /landing|homepage/i,
        spokenTemplate:
          "Your {componentType} is ready! I've included a compelling hero section, feature highlights, and clear call-to-action buttons.",
        displayTemplate: "🚀 Built {componentType} with conversion-focused design",
        suggestions: ["Add testimonials section", "Include pricing tiers", "Add contact form"],
        followUps: ["Want to add a newsletter signup?", "Should I include social proof elements?"],
      },
      {
        pattern: /form|contact/i,
        spokenTemplate:
          "I've built a {componentType} with proper validation, accessibility features, and smooth user interactions.",
        displayTemplate: "📝 Created {componentType} with validation",
        suggestions: ["Add file upload capability", "Include multi-step wizard", "Add real-time validation"],
        followUps: ["Need email integration?", "Want to add captcha protection?"],
      },
    ])

    // Backend Setup templates
    this.responseTemplates.set(IntentType.BACKEND_SETUP, [
      {
        pattern: /api|endpoint/i,
        spokenTemplate:
          "Your API is set up with proper error handling, type safety, and scalable architecture. All endpoints are ready for production.",
        displayTemplate: "⚡ API endpoints configured with security",
        suggestions: ["Add rate limiting", "Include API documentation", "Set up monitoring"],
        followUps: ["Need authentication middleware?", "Want to add caching?"],
      },
      {
        pattern: /auth|login/i,
        spokenTemplate:
          "Authentication system is configured with secure password handling, session management, and user verification.",
        displayTemplate: "🔐 Authentication system implemented",
        suggestions: ["Add OAuth providers", "Include two-factor auth", "Set up password reset"],
        followUps: ["Want to add social login?", "Need role-based permissions?"],
      },
    ])

    // Database Operation templates
    this.responseTemplates.set(IntentType.DATABASE_OPERATION, [
      {
        pattern: /schema|table/i,
        spokenTemplate:
          "Database schema is created with proper relationships, indexes, and constraints for optimal performance.",
        displayTemplate: "🗄️ Database schema configured",
        suggestions: ["Add data seeding", "Include backup strategy", "Set up migrations"],
        followUps: ["Need sample data?", "Want to add search indexes?"],
      },
    ])

    // Styling Request templates
    this.responseTemplates.set(IntentType.STYLING_REQUEST, [
      {
        pattern: /color|theme/i,
        spokenTemplate:
          "I've updated the styling with a beautiful {style} theme that's consistent across all components.",
        displayTemplate: "🎨 Applied {style} styling theme",
        suggestions: ["Add animations", "Include hover effects", "Create dark mode"],
        followUps: ["Want to customize the color palette?", "Should I add micro-interactions?"],
      },
    ])

    // Feature Request templates
    this.responseTemplates.set(IntentType.FEATURE_REQUEST, [
      {
        pattern: /.*/,
        spokenTemplate:
          "I've implemented the {featureType} feature with all necessary functionality and proper integration.",
        displayTemplate: "✅ Added {featureType} feature",
        suggestions: ["Add testing", "Include documentation", "Set up monitoring"],
        followUps: ["Need additional configuration?", "Want to add related features?"],
      },
    ])

    // Question templates
    this.responseTemplates.set(IntentType.QUESTION, [
      {
        pattern: /.*/,
        spokenTemplate: "Great question! Let me explain {topic} and provide you with a practical solution.",
        displayTemplate: "💡 Explaining {topic}",
        suggestions: ["Show code example", "Provide documentation", "Create tutorial"],
        followUps: ["Need a code example?", "Want more detailed explanation?"],
      },
    ])
  }

  async generateSmartResponse(
    nlpAnalysis: EnhancedNLPAnalysis,
    voiceResult: VoiceProcessingResult,
    generationResult: any,
    sessionId = "default",
  ): Promise<SmartResponse> {
    const startTime = Date.now()

    // Get or create user context
    const context = this.getUserContext(sessionId)

    // Find matching template
    const template = this.findBestTemplate(nlpAnalysis.intent, voiceResult.cleanedTranscript)

    // Extract parameters from voice commands and NLP analysis
    const parameters = this.extractParameters(voiceResult, nlpAnalysis)

    // Generate personalized response
    const response = this.generatePersonalizedResponse(template, parameters, context, nlpAnalysis, generationResult)

    const processingTime = Date.now() - startTime

    // Update context
    this.updateUserContext(sessionId, response, voiceResult.commands)

    return {
      ...response,
      metadata: {
        processingTime,
        intentMatched: nlpAnalysis.confidence > 0.7,
        contextUsed: context.userHistory.length > 0,
        personalizedLevel: this.calculatePersonalizationLevel(context),
      },
    }
  }

  private findBestTemplate(intent: IntentType, transcript: string): ResponseTemplate {
    const templates = this.responseTemplates.get(intent) || []

    for (const template of templates) {
      if (template.pattern.test(transcript)) {
        return template
      }
    }

    // Return default template if no match
    return {
      pattern: /.*/,
      spokenTemplate: "I've processed your request and generated the code as requested.",
      displayTemplate: "✅ Request completed",
      suggestions: ["Review the code", "Test functionality", "Add more features"],
      followUps: ["Need any modifications?", "Want to add more features?"],
    }
  }

  private extractParameters(voiceResult: VoiceProcessingResult, nlpAnalysis: EnhancedNLPAnalysis): Record<string, any> {
    const parameters: Record<string, any> = {}

    // Extract from voice commands
    voiceResult.commands.forEach((cmd) => {
      Object.assign(parameters, cmd.parameters)
    })

    // Extract from NLP entities
    nlpAnalysis.entities.forEach((entity) => {
      parameters[entity.entity] = entity.option
    })

    // Extract from key phrases
    parameters.keyPhrases = nlpAnalysis.keyPhrases
    parameters.keywords = nlpAnalysis.keywords

    // Set defaults
    parameters.componentType = parameters.componentType || "component"
    parameters.features = parameters.features || "modern functionality"
    parameters.style = parameters.style || "professional"
    parameters.featureType = parameters.featureType || "requested"
    parameters.topic = parameters.about || parameters.question || "the concept"

    return parameters
  }

  private generatePersonalizedResponse(
    template: ResponseTemplate,
    parameters: Record<string, any>,
    context: ResponseContext,
    nlpAnalysis: EnhancedNLPAnalysis,
    generationResult: any,
  ): Omit<SmartResponse, "metadata"> {
    const preferences = context.userPreferences

    // Customize based on technical level
    let spokenMessage = this.interpolateTemplate(template.spokenTemplate, parameters)
    const displayMessage = this.interpolateTemplate(template.displayTemplate, parameters)

    // Adjust verbosity
    if (preferences.verbosity === "concise") {
      spokenMessage = this.makeConcise(spokenMessage)
    } else if (preferences.verbosity === "comprehensive") {
      spokenMessage = this.makeComprehensive(spokenMessage, nlpAnalysis, generationResult)
    }

    // Adjust communication style
    if (preferences.communicationStyle === "formal") {
      spokenMessage = this.makeFormal(spokenMessage)
    } else if (preferences.communicationStyle === "casual") {
      spokenMessage = this.makeCasual(spokenMessage)
    }

    // Generate contextual suggestions
    const actionSuggestions = this.generateContextualSuggestions(
      template.suggestions,
      context,
      nlpAnalysis,
      preferences,
    )

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(template.followUps, context, nlpAnalysis)

    // Determine response type
    const responseType = this.determineResponseType(nlpAnalysis, generationResult)

    return {
      spokenMessage,
      displayMessage,
      actionSuggestions,
      followUpQuestions,
      confidence: nlpAnalysis.confidence,
      responseType,
    }
  }

  private interpolateTemplate(template: string, parameters: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return parameters[key] || match
    })
  }

  private makeConcise(message: string): string {
    return message.split(".")[0] + "."
  }

  private makeComprehensive(message: string, nlpAnalysis: EnhancedNLPAnalysis, result: any): string {
    let comprehensive = message

    if (nlpAnalysis.textAnalysis.complexity === "complex") {
      comprehensive += " I've broken down your complex request into manageable components."
    }

    if (result.backendFiles && result.backendFiles.length > 0) {
      comprehensive += ` I've also generated ${result.backendFiles.length} backend files to support the functionality.`
    }

    return comprehensive
  }

  private makeFormal(message: string): string {
    return message
      .replace(/I've/g, "I have")
      .replace(/you're/g, "you are")
      .replace(/it's/g, "it is")
  }

  private makeCasual(message: string): string {
    return message
      .replace(/I have/g, "I've")
      .replace(/you are/g, "you're")
      .replace(/it is/g, "it's")
  }

  private generateContextualSuggestions(
    baseSuggestions: string[],
    context: ResponseContext,
    nlpAnalysis: EnhancedNLPAnalysis,
    preferences: UserPreferences,
  ): string[] {
    const suggestions = [...baseSuggestions]

    // Add technology-specific suggestions
    const techEntities = nlpAnalysis.entities.filter((e) => e.entity === "technology")
    if (techEntities.length > 0) {
      suggestions.push(`Optimize for ${techEntities[0].option}`)
    }

    // Add preference-based suggestions
    if (preferences.technicalLevel === "advanced") {
      suggestions.push("Add TypeScript interfaces", "Include unit tests")
    } else if (preferences.technicalLevel === "beginner") {
      suggestions.push("Add code comments", "Include usage examples")
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  private generateFollowUpQuestions(
    baseQuestions: string[],
    context: ResponseContext,
    nlpAnalysis: EnhancedNLPAnalysis,
  ): string[] {
    const questions = [...baseQuestions]

    // Add complexity-based questions
    if (nlpAnalysis.complexity === "simple") {
      questions.push("Would you like to add more advanced features?")
    } else if (nlpAnalysis.complexity === "complex") {
      questions.push("Should I break this down into smaller components?")
    }

    return questions.slice(0, 2) // Limit to 2 questions
  }

  private determineResponseType(nlpAnalysis: EnhancedNLPAnalysis, result: any): SmartResponse["responseType"] {
    if (result.error) return "error"
    if (nlpAnalysis.confidence < 0.5) return "clarification"
    if (nlpAnalysis.intent === IntentType.QUESTION) return "suggestion"
    return "success"
  }

  private getUserContext(sessionId: string): ResponseContext {
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, {
        userHistory: [],
        previousResponses: [],
        sessionDuration: 0,
        userPreferences: { ...this.defaultPreferences },
      })
    }
    return this.userSessions.get(sessionId)!
  }

  private updateUserContext(
    sessionId: string,
    response: Omit<SmartResponse, "metadata">,
    commands: VoiceCommand[],
  ): void {
    const context = this.getUserContext(sessionId)
    context.previousResponses.push(response as SmartResponse)
    context.userHistory.push(...commands)

    // Keep only recent history
    if (context.userHistory.length > 10) {
      context.userHistory = context.userHistory.slice(-10)
    }
    if (context.previousResponses.length > 5) {
      context.previousResponses = context.previousResponses.slice(-5)
    }
  }

  private calculatePersonalizationLevel(context: ResponseContext): "low" | "medium" | "high" {
    const historyLength = context.userHistory.length
    if (historyLength < 2) return "low"
    if (historyLength < 5) return "medium"
    return "high"
  }

  // Public methods for customization
  updateUserPreferences(sessionId: string, preferences: Partial<UserPreferences>): void {
    const context = this.getUserContext(sessionId)
    context.userPreferences = { ...context.userPreferences, ...preferences }
  }

  clearUserSession(sessionId: string): void {
    this.userSessions.delete(sessionId)
  }
}

interface ResponseTemplate {
  pattern: RegExp
  spokenTemplate: string
  displayTemplate: string
  suggestions: string[]
  followUps: string[]
}

// Export singleton instance
export const responseGenerator = new SmartResponseGenerator()

// Utility functions
export async function generateSmartResponse(
  nlpAnalysis: EnhancedNLPAnalysis,
  voiceResult: VoiceProcessingResult,
  generationResult: any,
  sessionId?: string,
): Promise<SmartResponse> {
  return await responseGenerator.generateSmartResponse(nlpAnalysis, voiceResult, generationResult, sessionId)
}

export function updateUserPreferences(sessionId: string, preferences: Partial<UserPreferences>): void {
  responseGenerator.updateUserPreferences(sessionId, preferences)
}

export function clearSession(sessionId: string): void {
  responseGenerator.clearUserSession(sessionId)
}
