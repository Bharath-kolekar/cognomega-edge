import { contextualMemory } from "./contextual-memory"

export interface ProactiveInsight {
  id: string
  type: "suggestion" | "warning" | "opportunity" | "learning"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  actionable: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
  dismissible: boolean
  expiresAt?: number
}

export interface UserBehaviorPattern {
  pattern: string
  frequency: number
  lastSeen: number
  confidence: number
  context: string[]
}

export class ProactiveAISystem {
  private insights: Map<string, ProactiveInsight>
  private behaviorPatterns: Map<string, UserBehaviorPattern>
  private observationQueue: Array<{ timestamp: number; event: string; context: any }>
  private analysisInterval: NodeJS.Timeout | null = null
  private isActive = true

  constructor() {
    this.insights = new Map()
    this.behaviorPatterns = new Map()
    this.observationQueue = []
    this.startProactiveAnalysis()
  }

  public observeUserBehavior(event: string, context: any = {}) {
    if (!this.isActive) return

    this.observationQueue.push({
      timestamp: Date.now(),
      event,
      context,
    })

    // Immediate analysis for critical events
    if (this.isCriticalEvent(event)) {
      this.analyzeImmediate(event, context)
    }

    // Keep queue manageable
    if (this.observationQueue.length > 100) {
      this.observationQueue = this.observationQueue.slice(-50)
    }
  }

  public getActiveInsights(): ProactiveInsight[] {
    const now = Date.now()
    const activeInsights = Array.from(this.insights.values()).filter((insight) => {
      return !insight.expiresAt || insight.expiresAt > now
    })

    return activeInsights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  public dismissInsight(insightId: string) {
    const insight = this.insights.get(insightId)
    if (insight && insight.dismissible) {
      this.insights.delete(insightId)
      contextualMemory.addMemory("interaction", { action: "dismissed_insight", insightId }, 0.2, [
        "proactive_ai",
        "dismissed",
      ])
    }
  }

  public getContextualSuggestions(currentContext: string): string[] {
    const relevantPatterns = Array.from(this.behaviorPatterns.values()).filter((pattern) =>
      pattern.context.some((ctx) => currentContext.includes(ctx)),
    )

    const suggestions = []

    // Based on behavior patterns
    for (const pattern of relevantPatterns) {
      if (pattern.confidence > 0.7 && pattern.frequency > 2) {
        suggestions.push(this.generateSuggestionFromPattern(pattern))
      }
    }

    // Based on memory insights
    const memoryInsights = contextualMemory.getContextualInsights(currentContext)
    suggestions.push(...memoryInsights.recommendations.slice(0, 2))

    return suggestions.filter(Boolean).slice(0, 3)
  }

  public predictUserIntent(currentInput: string): {
    intent: string
    confidence: number
    reasoning: string[]
  } {
    const patterns = Array.from(this.behaviorPatterns.values())
    const relevantPatterns = patterns.filter((pattern) =>
      pattern.context.some((ctx) => currentInput.toLowerCase().includes(ctx.toLowerCase())),
    )

    if (relevantPatterns.length === 0) {
      return {
        intent: "exploration",
        confidence: 0.5,
        reasoning: ["No clear patterns detected, user appears to be exploring"],
      }
    }

    // Find the most confident pattern
    const bestPattern = relevantPatterns.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    )

    return {
      intent: bestPattern.pattern,
      confidence: bestPattern.confidence,
      reasoning: [
        `Pattern "${bestPattern.pattern}" detected with ${bestPattern.frequency} occurrences`,
        `Last seen ${Math.round((Date.now() - bestPattern.lastSeen) / (1000 * 60))} minutes ago`,
      ],
    }
  }

  private startProactiveAnalysis() {
    this.analysisInterval = setInterval(() => {
      this.analyzeUserBehavior()
      this.generateProactiveInsights()
      this.cleanupExpiredInsights()
    }, 30000) // Analyze every 30 seconds
  }

  private isCriticalEvent(event: string): boolean {
    const criticalEvents = ["error", "stuck", "repeated_failure", "long_idle", "confusion_detected"]
    return criticalEvents.includes(event)
  }

  private analyzeImmediate(event: string, context: any) {
    switch (event) {
      case "error":
        this.generateErrorInsight(context)
        break
      case "stuck":
        this.generateStuckInsight(context)
        break
      case "repeated_failure":
        this.generateRepeatedFailureInsight(context)
        break
      case "long_idle":
        this.generateIdleInsight(context)
        break
      case "confusion_detected":
        this.generateConfusionInsight(context)
        break
    }
  }

  private analyzeUserBehavior() {
    const recentEvents = this.observationQueue.filter((obs) => Date.now() - obs.timestamp < 300000) // Last 5 minutes

    // Detect patterns
    const eventFrequency = new Map<string, number>()
    const eventContexts = new Map<string, string[]>()

    recentEvents.forEach((obs) => {
      eventFrequency.set(obs.event, (eventFrequency.get(obs.event) || 0) + 1)

      if (!eventContexts.has(obs.event)) {
        eventContexts.set(obs.event, [])
      }
      eventContexts.get(obs.event)!.push(JSON.stringify(obs.context))
    })

    // Update behavior patterns
    for (const [event, frequency] of eventFrequency.entries()) {
      const existingPattern = this.behaviorPatterns.get(event)
      const contexts = eventContexts.get(event) || []

      if (existingPattern) {
        existingPattern.frequency += frequency
        existingPattern.lastSeen = Date.now()
        existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1)
        existingPattern.context = [...new Set([...existingPattern.context, ...contexts])]
      } else {
        this.behaviorPatterns.set(event, {
          pattern: event,
          frequency,
          lastSeen: Date.now(),
          confidence: frequency > 2 ? 0.7 : 0.4,
          context: contexts,
        })
      }
    }
  }

  private generateProactiveInsights() {
    // Analyze current patterns for insights
    const patterns = Array.from(this.behaviorPatterns.values())

    // Look for learning opportunities
    const explorationPattern = patterns.find((p) => p.pattern.includes("hover") && p.frequency > 5)
    if (explorationPattern && !this.insights.has("learning_opportunity")) {
      this.addInsight({
        id: "learning_opportunity",
        type: "learning",
        priority: "medium",
        title: "Learning Opportunity Detected",
        message: "I notice you're exploring different features. Would you like a guided tour of my capabilities?",
        actionable: true,
        actions: [
          {
            label: "Start Tour",
            action: () => this.startGuidedTour(),
          },
        ],
        dismissible: true,
        expiresAt: Date.now() + 600000, // 10 minutes
      })
    }

    // Look for efficiency opportunities
    const repetitivePattern = patterns.find((p) => p.frequency > 10 && p.confidence > 0.8)
    if (repetitivePattern && !this.insights.has("efficiency_opportunity")) {
      this.addInsight({
        id: "efficiency_opportunity",
        type: "opportunity",
        priority: "medium",
        title: "Efficiency Improvement Available",
        message: `I've noticed you frequently ${repetitivePattern.pattern}. I can help automate this process.`,
        actionable: true,
        dismissible: true,
        expiresAt: Date.now() + 900000, // 15 minutes
      })
    }

    // Look for success patterns
    const successPattern = patterns.find((p) => p.pattern.includes("success") && p.frequency > 3)
    if (successPattern && !this.insights.has("success_reinforcement")) {
      this.addInsight({
        id: "success_reinforcement",
        type: "suggestion",
        priority: "low",
        title: "Great Progress!",
        message: "I see you're having success with this approach. Would you like me to suggest similar patterns?",
        actionable: true,
        dismissible: true,
        expiresAt: Date.now() + 300000, // 5 minutes
      })
    }
  }

  private generateErrorInsight(context: any) {
    this.addInsight({
      id: `error_${Date.now()}`,
      type: "warning",
      priority: "high",
      title: "Error Detected",
      message: "I noticed an error occurred. Let me help you resolve this issue.",
      actionable: true,
      actions: [
        {
          label: "Get Help",
          action: () => this.provideErrorHelp(context),
        },
      ],
      dismissible: true,
      expiresAt: Date.now() + 300000,
    })
  }

  private generateStuckInsight(context: any) {
    this.addInsight({
      id: `stuck_${Date.now()}`,
      type: "suggestion",
      priority: "high",
      title: "Need Assistance?",
      message: "It looks like you might be stuck. I can provide guidance or suggest alternative approaches.",
      actionable: true,
      actions: [
        {
          label: "Get Suggestions",
          action: () => this.provideSuggestions(context),
        },
      ],
      dismissible: true,
      expiresAt: Date.now() + 600000,
    })
  }

  private generateRepeatedFailureInsight(context: any) {
    this.addInsight({
      id: `repeated_failure_${Date.now()}`,
      type: "warning",
      priority: "critical",
      title: "Repeated Issues Detected",
      message: "I've noticed multiple attempts that aren't working. Let me suggest a different approach.",
      actionable: true,
      actions: [
        {
          label: "Try Different Approach",
          action: () => this.suggestAlternativeApproach(context),
        },
      ],
      dismissible: false,
      expiresAt: Date.now() + 900000,
    })
  }

  private generateIdleInsight(context: any) {
    this.addInsight({
      id: `idle_${Date.now()}`,
      type: "suggestion",
      priority: "low",
      title: "Still There?",
      message: "I'm here when you're ready to continue. Would you like some suggestions to get started?",
      actionable: true,
      actions: [
        {
          label: "Get Suggestions",
          action: () => this.provideIdleSuggestions(),
        },
      ],
      dismissible: true,
      expiresAt: Date.now() + 300000,
    })
  }

  private generateConfusionInsight(context: any) {
    this.addInsight({
      id: `confusion_${Date.now()}`,
      type: "suggestion",
      priority: "medium",
      title: "Let Me Help",
      message: "I sense you might be unsure about something. I can provide clearer guidance.",
      actionable: true,
      actions: [
        {
          label: "Explain Better",
          action: () => this.provideClearerExplanation(context),
        },
      ],
      dismissible: true,
      expiresAt: Date.now() + 600000,
    })
  }

  private generateSuggestionFromPattern(pattern: UserBehaviorPattern): string {
    const suggestions = {
      hover_exploration: "Try using voice commands for faster interaction",
      repeated_generation: "Consider saving your favorite prompts for quick reuse",
      error_recovery: "I can help you avoid common pitfalls in your next attempt",
      feature_discovery: "There are more advanced features you might find useful",
    }

    return (
      suggestions[pattern.pattern as keyof typeof suggestions] ||
      `Based on your ${pattern.pattern} pattern, I have suggestions to help`
    )
  }

  private addInsight(insight: ProactiveInsight) {
    this.insights.set(insight.id, insight)
    contextualMemory.addMemory("insight", insight, 0.6, ["proactive_ai", insight.type, insight.priority])
  }

  private cleanupExpiredInsights() {
    const now = Date.now()
    for (const [id, insight] of this.insights.entries()) {
      if (insight.expiresAt && insight.expiresAt < now) {
        this.insights.delete(id)
      }
    }
  }

  // Action handlers
  private startGuidedTour() {
    console.log("[v0] Starting guided tour...")
    // Implementation for guided tour
  }

  private provideErrorHelp(context: any) {
    console.log("[v0] Providing error help for:", context)
    // Implementation for error help
  }

  private provideSuggestions(context: any) {
    console.log("[v0] Providing suggestions for:", context)
    // Implementation for suggestions
  }

  private suggestAlternativeApproach(context: any) {
    console.log("[v0] Suggesting alternative approach for:", context)
    // Implementation for alternative approaches
  }

  private provideIdleSuggestions() {
    console.log("[v0] Providing idle suggestions...")
    // Implementation for idle suggestions
  }

  private provideClearerExplanation(context: any) {
    console.log("[v0] Providing clearer explanation for:", context)
    // Implementation for clearer explanations
  }

  public stop() {
    this.isActive = false
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
  }
}

export const proactiveAISystem = new ProactiveAISystem()
