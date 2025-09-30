export interface ConversationContext {
  userIntent: string
  confidence: number
  previousMessages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: number
  }>
  sessionId: string
  emotionalTone: "neutral" | "excited" | "frustrated" | "curious" | "confident"
  complexity: "simple" | "moderate" | "complex"
  domain: string[]
}

export interface ConversationResponse {
  message: string
  suggestions: string[]
  followUpQuestions: string[]
  confidence: number
  requiresClarification: boolean
  actionItems: Array<{
    type: "code" | "explanation" | "resource" | "next_step"
    content: string
    priority: "low" | "medium" | "high"
  }>
}

export class AIConversationEngine {
  private conversationHistory: Map<string, ConversationContext>
  private responsePatterns: Map<string, string[]>
  private contextWindow = 10 // Number of previous messages to consider

  constructor() {
    this.conversationHistory = new Map()
    this.responsePatterns = new Map()
    this.initializeResponsePatterns()
  }

  public processUserInput(
    input: string,
    sessionId: string,
    context?: Partial<ConversationContext>,
  ): ConversationResponse {
    const conversationContext = this.getOrCreateContext(sessionId, context)

    // Update conversation history
    conversationContext.previousMessages.push({
      role: "user",
      content: input,
      timestamp: Date.now(),
    })

    // Keep only recent messages
    if (conversationContext.previousMessages.length > this.contextWindow) {
      conversationContext.previousMessages = conversationContext.previousMessages.slice(-this.contextWindow)
    }

    // Analyze user intent and emotional tone
    const analysis = this.analyzeUserInput(input, conversationContext)
    conversationContext.userIntent = analysis.intent
    conversationContext.confidence = analysis.confidence
    conversationContext.emotionalTone = analysis.emotionalTone
    conversationContext.complexity = analysis.complexity
    conversationContext.domain = analysis.domain

    // Generate response
    const response = this.generateResponse(input, conversationContext)

    // Add assistant response to history
    conversationContext.previousMessages.push({
      role: "assistant",
      content: response.message,
      timestamp: Date.now(),
    })

    this.conversationHistory.set(sessionId, conversationContext)
    return response
  }

  public getConversationContext(sessionId: string): ConversationContext | undefined {
    return this.conversationHistory.get(sessionId)
  }

  public clearConversation(sessionId: string) {
    this.conversationHistory.delete(sessionId)
  }

  public generateContextualSuggestions(sessionId: string): string[] {
    const context = this.conversationHistory.get(sessionId)
    if (!context) return []

    const suggestions = []

    // Based on current domain
    if (context.domain.includes("react")) {
      suggestions.push("Would you like me to explain React hooks?")
      suggestions.push("Should we add state management to your component?")
    }

    if (context.domain.includes("api")) {
      suggestions.push("Need help with API error handling?")
      suggestions.push("Want to add authentication to your API?")
    }

    // Based on emotional tone
    if (context.emotionalTone === "frustrated") {
      suggestions.push("Let's break this down into smaller steps")
      suggestions.push("Would you like me to explain this differently?")
    } else if (context.emotionalTone === "excited") {
      suggestions.push("Great! Let's add some advanced features")
      suggestions.push("Ready to tackle something more challenging?")
    }

    // Based on complexity
    if (context.complexity === "complex") {
      suggestions.push("Should we simplify this approach?")
      suggestions.push("Need me to explain any concepts in detail?")
    }

    return suggestions.slice(0, 3)
  }

  private getOrCreateContext(sessionId: string, context?: Partial<ConversationContext>): ConversationContext {
    let conversationContext = this.conversationHistory.get(sessionId)

    if (!conversationContext) {
      conversationContext = {
        userIntent: "unknown",
        confidence: 0.5,
        previousMessages: [],
        sessionId,
        emotionalTone: "neutral",
        complexity: "moderate",
        domain: [],
        ...context,
      }
    } else if (context) {
      Object.assign(conversationContext, context)
    }

    return conversationContext
  }

  private analyzeUserInput(
    input: string,
    context: ConversationContext,
  ): {
    intent: string
    confidence: number
    emotionalTone: ConversationContext["emotionalTone"]
    complexity: ConversationContext["complexity"]
    domain: string[]
  } {
    const lowerInput = input.toLowerCase()

    // Analyze intent
    let intent = "general_inquiry"
    let confidence = 0.5

    if (lowerInput.includes("create") || lowerInput.includes("build") || lowerInput.includes("make")) {
      intent = "creation_request"
      confidence = 0.8
    } else if (lowerInput.includes("fix") || lowerInput.includes("error") || lowerInput.includes("bug")) {
      intent = "problem_solving"
      confidence = 0.9
    } else if (lowerInput.includes("explain") || lowerInput.includes("how") || lowerInput.includes("what")) {
      intent = "explanation_request"
      confidence = 0.7
    } else if (lowerInput.includes("improve") || lowerInput.includes("optimize") || lowerInput.includes("better")) {
      intent = "improvement_request"
      confidence = 0.8
    }

    // Analyze emotional tone
    let emotionalTone: ConversationContext["emotionalTone"] = "neutral"
    if (lowerInput.includes("awesome") || lowerInput.includes("great") || lowerInput.includes("love")) {
      emotionalTone = "excited"
    } else if (lowerInput.includes("stuck") || lowerInput.includes("frustrated") || lowerInput.includes("difficult")) {
      emotionalTone = "frustrated"
    } else if (
      lowerInput.includes("curious") ||
      lowerInput.includes("wondering") ||
      lowerInput.includes("interested")
    ) {
      emotionalTone = "curious"
    } else if (lowerInput.includes("sure") || lowerInput.includes("confident") || lowerInput.includes("ready")) {
      emotionalTone = "confident"
    }

    // Analyze complexity
    let complexity: ConversationContext["complexity"] = "moderate"
    const complexityIndicators = ["advanced", "complex", "sophisticated", "enterprise", "scalable"]
    const simpleIndicators = ["simple", "basic", "easy", "quick", "minimal"]

    if (complexityIndicators.some((indicator) => lowerInput.includes(indicator))) {
      complexity = "complex"
    } else if (simpleIndicators.some((indicator) => lowerInput.includes(indicator))) {
      complexity = "simple"
    }

    // Analyze domain
    const domain = []
    const domainKeywords = {
      react: ["react", "jsx", "component", "hook", "state"],
      nextjs: ["next", "nextjs", "app router", "pages"],
      typescript: ["typescript", "ts", "type", "interface"],
      api: ["api", "endpoint", "rest", "graphql", "server"],
      database: ["database", "db", "sql", "mongodb", "postgres"],
      styling: ["css", "tailwind", "style", "design", "ui"],
      auth: ["auth", "login", "authentication", "user", "session"],
    }

    for (const [domainName, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some((keyword) => lowerInput.includes(keyword))) {
        domain.push(domainName)
      }
    }

    return { intent, confidence, emotionalTone, complexity, domain }
  }

  private generateResponse(input: string, context: ConversationContext): ConversationResponse {
    const suggestions = []
    const followUpQuestions = []
    const actionItems = []

    // Generate base response based on intent
    let message = ""
    let confidence = context.confidence
    let requiresClarification = false

    switch (context.userIntent) {
      case "creation_request":
        message = this.generateCreationResponse(input, context)
        suggestions.push("Would you like me to add any specific features?")
        suggestions.push("Should I include error handling?")
        followUpQuestions.push("What's the main purpose of this component?")
        actionItems.push({
          type: "code",
          content: "Generate initial code structure",
          priority: "high",
        })
        break

      case "problem_solving":
        message = this.generateProblemSolvingResponse(input, context)
        suggestions.push("Let me help debug this step by step")
        suggestions.push("Would you like me to explain what might be causing this?")
        followUpQuestions.push("Can you share the specific error message?")
        actionItems.push({
          type: "explanation",
          content: "Analyze the problem and provide solution",
          priority: "high",
        })
        break

      case "explanation_request":
        message = this.generateExplanationResponse(input, context)
        suggestions.push("Would you like a more detailed explanation?")
        suggestions.push("Should I show you a practical example?")
        followUpQuestions.push("Which part would you like me to elaborate on?")
        actionItems.push({
          type: "explanation",
          content: "Provide comprehensive explanation with examples",
          priority: "medium",
        })
        break

      case "improvement_request":
        message = this.generateImprovementResponse(input, context)
        suggestions.push("I can suggest performance optimizations")
        suggestions.push("Would you like me to refactor this code?")
        followUpQuestions.push("What specific aspects would you like to improve?")
        actionItems.push({
          type: "code",
          content: "Provide improved version with explanations",
          priority: "medium",
        })
        break

      default:
        message = "I'm here to help! Could you tell me more about what you'd like to work on?"
        requiresClarification = true
        confidence = 0.3
        suggestions.push("I can help you build components, fix issues, or explain concepts")
        followUpQuestions.push("What type of project are you working on?")
    }

    // Adjust response based on emotional tone
    message = this.adjustForEmotionalTone(message, context.emotionalTone)

    return {
      message,
      suggestions,
      followUpQuestions,
      confidence,
      requiresClarification,
      actionItems,
    }
  }

  private generateCreationResponse(input: string, context: ConversationContext): string {
    const responses = [
      "I'd be happy to help you create that! Let me understand your requirements better.",
      "Great idea! I can help you build that. Let me start by understanding what you need.",
      "Perfect! I love helping create new things. Let's break down what you're looking for.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  private generateProblemSolvingResponse(input: string, context: ConversationContext): string {
    const responses = [
      "I can help you solve this issue. Let me analyze what might be going wrong.",
      "Don't worry, we'll figure this out together. Let me help you debug this step by step.",
      "I see you're running into a problem. Let me help you identify and fix the issue.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  private generateExplanationResponse(input: string, context: ConversationContext): string {
    const responses = [
      "I'd be happy to explain that concept! Let me break it down for you.",
      "Great question! Let me walk you through this step by step.",
      "I can definitely explain that. Let me provide a clear overview with examples.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  private generateImprovementResponse(input: string, context: ConversationContext): string {
    const responses = [
      "I can definitely help improve that! Let me suggest some enhancements.",
      "Great thinking! There are several ways we can make this better.",
      "I love optimization challenges! Let me show you how to enhance this.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  private adjustForEmotionalTone(message: string, tone: ConversationContext["emotionalTone"]): string {
    switch (tone) {
      case "excited":
        return `🚀 ${message} This is going to be awesome!`
      case "frustrated":
        return `I understand this can be challenging. ${message} We'll work through this together.`
      case "curious":
        return `${message} I love your curiosity - let's explore this together!`
      case "confident":
        return `${message} I can see you're ready to dive in!`
      default:
        return message
    }
  }

  private initializeResponsePatterns() {
    this.responsePatterns.set("greeting", [
      "Hello! I'm here to help you build amazing things with code.",
      "Hi there! Ready to create something awesome together?",
      "Welcome! I'm your AI development assistant. What can we build today?",
    ])

    this.responsePatterns.set("farewell", [
      "Great working with you! Feel free to come back anytime.",
      "Thanks for the session! I'm here whenever you need help.",
      "See you next time! Keep building amazing things!",
    ])
  }
}

export const aiConversationEngine = new AIConversationEngine()
