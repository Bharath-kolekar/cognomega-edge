import { freeAI } from "@/lib/free-ai-alternatives"

export interface ConversationRequest {
  message: string
  sessionId: string
  context?: ConversationContext
  tools?: string[]
}

export interface ConversationResponse {
  response: string
  sessionId: string
  confidence: number
  suggestions: string[]
  followUpQuestions: string[]
  toolsUsed: string[]
  timestamp: number
}

export interface ConversationContext {
  previousMessages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: number
  }>
  userIntent: string
  emotionalTone: "neutral" | "excited" | "frustrated" | "curious" | "confident"
  complexity: "simple" | "moderate" | "complex"
  domain: string[]
  sessionMetadata: Record<string, any>
}

export class AIConversationService {
  private conversations = new Map<string, ConversationContext>()

  async processConversation(request: ConversationRequest): Promise<ConversationResponse> {
    const context = this.getOrCreateContext(request.sessionId, request.context)

    // Update conversation history
    context.previousMessages.push({
      role: "user",
      content: request.message,
      timestamp: Date.now(),
    })

    // Analyze user intent
    const analysis = await this.analyzeUserIntent(request.message, context)
    context.userIntent = analysis.intent
    context.emotionalTone = analysis.emotionalTone
    context.complexity = analysis.complexity
    context.domain = analysis.domain

    // Generate AI response using free alternatives
    const aiResponse = await this.generateAIResponse(request.message, context, request.tools)

    // Update conversation history with AI response
    context.previousMessages.push({
      role: "assistant",
      content: aiResponse.response,
      timestamp: Date.now(),
    })

    // Keep only recent messages (last 20)
    if (context.previousMessages.length > 20) {
      context.previousMessages = context.previousMessages.slice(-20)
    }

    this.conversations.set(request.sessionId, context)

    return {
      response: aiResponse.response,
      sessionId: request.sessionId,
      confidence: aiResponse.confidence,
      suggestions: this.generateSuggestions(context),
      followUpQuestions: this.generateFollowUpQuestions(context),
      toolsUsed: aiResponse.toolsUsed,
      timestamp: Date.now(),
    }
  }

  async streamConversation(request: ConversationRequest): Promise<ReadableStream> {
    const context = this.getOrCreateContext(request.sessionId, request.context)

    const response = await this.generateAIResponse(request.message, context, request.tools)

    const stream = new ReadableStream({
      start(controller) {
        const words = response.response.split(" ")
        let index = 0

        const interval = setInterval(() => {
          if (index < words.length) {
            controller.enqueue(new TextEncoder().encode(words[index] + " "))
            index++
          } else {
            controller.close()
            clearInterval(interval)
          }
        }, 50) // Stream words every 50ms
      },
    })

    return stream
  }

  private getOrCreateContext(sessionId: string, context?: ConversationContext): ConversationContext {
    let conversationContext = this.conversations.get(sessionId)

    if (!conversationContext) {
      conversationContext = {
        previousMessages: [],
        userIntent: "unknown",
        emotionalTone: "neutral",
        complexity: "moderate",
        domain: [],
        sessionMetadata: {},
        ...context,
      }
    } else if (context) {
      Object.assign(conversationContext, context)
    }

    return conversationContext
  }

  private async analyzeUserIntent(message: string, context: ConversationContext) {
    const lowerMessage = message.toLowerCase()

    // Intent analysis
    let intent = "general_inquiry"
    if (lowerMessage.includes("create") || lowerMessage.includes("build")) {
      intent = "creation_request"
    } else if (lowerMessage.includes("fix") || lowerMessage.includes("error")) {
      intent = "problem_solving"
    } else if (lowerMessage.includes("explain") || lowerMessage.includes("how")) {
      intent = "explanation_request"
    } else if (lowerMessage.includes("improve") || lowerMessage.includes("optimize")) {
      intent = "improvement_request"
    }

    // Emotional tone analysis
    let emotionalTone: ConversationContext["emotionalTone"] = "neutral"
    if (lowerMessage.includes("awesome") || lowerMessage.includes("great")) {
      emotionalTone = "excited"
    } else if (lowerMessage.includes("stuck") || lowerMessage.includes("frustrated")) {
      emotionalTone = "frustrated"
    } else if (lowerMessage.includes("curious") || lowerMessage.includes("wondering")) {
      emotionalTone = "curious"
    }

    // Complexity analysis
    let complexity: ConversationContext["complexity"] = "moderate"
    if (lowerMessage.includes("advanced") || lowerMessage.includes("complex")) {
      complexity = "complex"
    } else if (lowerMessage.includes("simple") || lowerMessage.includes("basic")) {
      complexity = "simple"
    }

    // Domain analysis
    const domain = []
    const domainKeywords = {
      react: ["react", "jsx", "component", "hook"],
      nextjs: ["next", "nextjs", "app router"],
      typescript: ["typescript", "ts", "type"],
      api: ["api", "endpoint", "rest"],
      database: ["database", "db", "sql"],
      styling: ["css", "tailwind", "style"],
      auth: ["auth", "login", "authentication"],
    }

    for (const [domainName, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        domain.push(domainName)
      }
    }

    return { intent, emotionalTone, complexity, domain }
  }

  private async generateAIResponse(message: string, context: ConversationContext, tools?: string[]) {
    const systemPrompt = this.buildSystemPrompt(context)
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`

    try {
      const result = await freeAI.generateText(fullPrompt, {
        maxTokens: 800,
        temperature: 0.7,
        context: context,
      })

      return {
        response: result,
        confidence: 0.85,
        toolsUsed: tools || [],
      }
    } catch (error) {
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
        confidence: 0.3,
        toolsUsed: [],
      }
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = `You are Cognomega AI, a helpful and intelligent assistant specializing in web development, AI, and voice interfaces.

Current conversation context:
- User intent: ${context.userIntent}
- Emotional tone: ${context.emotionalTone}
- Complexity level: ${context.complexity}
- Domain focus: ${context.domain.join(", ") || "general"}

Guidelines:
- Be helpful, accurate, and concise
- Match the user's emotional tone appropriately
- Adjust complexity based on their level
- Focus on their domain of interest
- Provide actionable advice when possible`

    // Adjust based on emotional tone
    if (context.emotionalTone === "frustrated") {
      prompt += "\n- Be extra patient and break down complex concepts"
    } else if (context.emotionalTone === "excited") {
      prompt += "\n- Match their enthusiasm and suggest advanced features"
    }

    return prompt
  }

  private generateSuggestions(context: ConversationContext): string[] {
    const suggestions = []

    if (context.domain.includes("react")) {
      suggestions.push("Would you like help with React hooks?")
      suggestions.push("Need assistance with component optimization?")
    }

    if (context.domain.includes("api")) {
      suggestions.push("Want to add error handling to your API?")
      suggestions.push("Need help with authentication?")
    }

    if (context.emotionalTone === "frustrated") {
      suggestions.push("Let's break this down into smaller steps")
    }

    return suggestions.slice(0, 3)
  }

  private generateFollowUpQuestions(context: ConversationContext): string[] {
    const questions = []

    switch (context.userIntent) {
      case "creation_request":
        questions.push("What specific features do you need?")
        questions.push("What's your target audience?")
        break
      case "problem_solving":
        questions.push("Can you share the error message?")
        questions.push("What have you tried so far?")
        break
      case "explanation_request":
        questions.push("Which part needs more detail?")
        questions.push("Would you like a practical example?")
        break
    }

    return questions.slice(0, 2)
  }

  getConversationHistory(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId)
  }

  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId)
  }
}

export const aiConversationService = new AIConversationService()
