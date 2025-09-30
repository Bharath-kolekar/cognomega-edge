"use client"

import { contextualMemory, type MemoryEntry, type ProjectContext } from "./contextual-memory"

export interface PredictionContext {
  currentInput: string
  recentActions: string[]
  timeOfDay: number
  dayOfWeek: number
  projectContext?: ProjectContext
  userMood: "focused" | "exploratory" | "frustrated" | "excited" | "neutral"
  sessionDuration: number
  lastInteractionTime: number
}

export interface Prediction {
  id: string
  type: "next_action" | "resource_suggestion" | "workflow_optimization" | "learning_opportunity" | "problem_prevention"
  confidence: number
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  description: string
  suggestedAction: string
  reasoning: string
  expectedOutcome: string
  timeToComplete: number // in minutes
  requiredSkills: string[]
  relatedMemories: string[]
  contextFactors: string[]
  timestamp: number
  expiresAt?: number
}

export interface WorkflowPattern {
  id: string
  name: string
  steps: Array<{
    action: string
    duration: number
    successRate: number
    commonIssues: string[]
  }>
  frequency: number
  lastUsed: number
  effectiveness: number
  userSatisfaction: number
  adaptations: Array<{
    condition: string
    modification: string
    improvement: number
  }>
}

export interface PredictiveInsight {
  category: "productivity" | "learning" | "technical" | "creative" | "collaboration"
  insight: string
  confidence: number
  actionable: boolean
  impact: "low" | "medium" | "high"
  timeframe: "immediate" | "short_term" | "long_term"
  evidence: string[]
}

export class PredictiveAI {
  private workflowPatterns: Map<string, WorkflowPattern>
  private predictionHistory: Map<string, Prediction>
  private userBehaviorModel: Map<string, number>
  private contextualTriggers: Map<string, Array<{ condition: string; prediction: string; accuracy: number }>>
  private adaptiveLearning: Map<string, { successes: number; failures: number; adaptations: string[] }>

  constructor() {
    this.workflowPatterns = new Map()
    this.predictionHistory = new Map()
    this.userBehaviorModel = new Map()
    this.contextualTriggers = new Map()
    this.adaptiveLearning = new Map()

    if (typeof window !== "undefined") {
      this.loadFromStorage()
      this.initializeDefaultPatterns()
    }
  }

  public async generatePredictions(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []

    // Analyze current context and generate predictions
    const nextActionPredictions = await this.predictNextActions(context)
    const resourcePredictions = await this.predictResourceNeeds(context)
    const workflowPredictions = await this.predictWorkflowOptimizations(context)
    const learningPredictions = await this.predictLearningOpportunities(context)
    const preventionPredictions = await this.predictPotentialProblems(context)

    predictions.push(
      ...nextActionPredictions,
      ...resourcePredictions,
      ...workflowPredictions,
      ...learningPredictions,
      ...preventionPredictions,
    )

    // Sort by priority and confidence
    predictions.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })

    // Store predictions for learning
    predictions.forEach((prediction) => {
      this.predictionHistory.set(prediction.id, prediction)
    })

    this.saveToStorage()
    return predictions.slice(0, 8) // Return top 8 predictions
  }

  public async predictNextActions(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []
    const relevantMemories = contextualMemory.getRelevantMemories(context.currentInput, 10)
    const recentPatterns = this.analyzeRecentPatterns(context.recentActions)

    // Pattern-based predictions
    for (const pattern of recentPatterns) {
      if (pattern.confidence > 0.6) {
        predictions.push({
          id: this.generateId(),
          type: "next_action",
          confidence: pattern.confidence,
          priority: pattern.confidence > 0.8 ? "high" : "medium",
          title: `Continue with ${pattern.nextAction}`,
          description: `Based on your recent workflow, you typically ${pattern.nextAction} next`,
          suggestedAction: pattern.actionDetails,
          reasoning: `This follows your established pattern of ${pattern.patternName}`,
          expectedOutcome: pattern.expectedResult,
          timeToComplete: pattern.estimatedTime,
          requiredSkills: pattern.skills,
          relatedMemories: pattern.relatedMemoryIds,
          contextFactors: ["workflow_pattern", "recent_actions"],
          timestamp: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        })
      }
    }

    // Context-based predictions
    if (context.projectContext) {
      const projectPredictions = await this.predictProjectNextSteps(context.projectContext, context)
      predictions.push(...projectPredictions)
    }

    // Time-based predictions
    const timePredictions = this.predictTimeBasedActions(context)
    predictions.push(...timePredictions)

    return predictions
  }

  public async predictResourceNeeds(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []
    const relevantMemories = contextualMemory.getRelevantMemories(context.currentInput, 5)

    // Analyze what resources were helpful in similar contexts
    const resourcePatterns = this.analyzeResourceUsagePatterns(relevantMemories)

    resourcePatterns.forEach((pattern) => {
      if (pattern.effectiveness > 0.7) {
        predictions.push({
          id: this.generateId(),
          type: "resource_suggestion",
          confidence: pattern.effectiveness,
          priority: pattern.urgency as Prediction["priority"],
          title: `You might need ${pattern.resourceType}`,
          description: pattern.description,
          suggestedAction: pattern.howToAccess,
          reasoning: pattern.reasoning,
          expectedOutcome: pattern.benefit,
          timeToComplete: pattern.timeToAccess,
          requiredSkills: pattern.prerequisites,
          relatedMemories: pattern.relatedMemoryIds,
          contextFactors: ["resource_history", "similar_contexts"],
          timestamp: Date.now(),
        })
      }
    })

    return predictions
  }

  public async predictWorkflowOptimizations(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []
    const currentWorkflow = this.identifyCurrentWorkflow(context)

    if (currentWorkflow) {
      const optimizations = this.analyzeWorkflowEfficiency(currentWorkflow, context)

      optimizations.forEach((optimization) => {
        predictions.push({
          id: this.generateId(),
          type: "workflow_optimization",
          confidence: optimization.confidence,
          priority: optimization.impact > 0.6 ? "high" : "medium",
          title: optimization.title,
          description: optimization.description,
          suggestedAction: optimization.action,
          reasoning: optimization.reasoning,
          expectedOutcome: `${Math.round(optimization.improvement * 100)}% efficiency improvement`,
          timeToComplete: optimization.implementationTime,
          requiredSkills: optimization.requiredSkills,
          relatedMemories: optimization.relatedMemories,
          contextFactors: ["workflow_analysis", "efficiency_patterns"],
          timestamp: Date.now(),
        })
      })
    }

    return predictions
  }

  public async predictLearningOpportunities(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []
    const learningInsights = contextualMemory.getLearningInsights()
    const skillGaps = this.identifySkillGaps(context, learningInsights)

    skillGaps.forEach((gap) => {
      if (gap.priority > 0.5) {
        predictions.push({
          id: this.generateId(),
          type: "learning_opportunity",
          confidence: gap.confidence,
          priority: gap.priority > 0.8 ? "high" : "medium",
          title: `Learn ${gap.skill}`,
          description: gap.description,
          suggestedAction: gap.learningPath,
          reasoning: gap.reasoning,
          expectedOutcome: gap.expectedBenefit,
          timeToComplete: gap.estimatedLearningTime,
          requiredSkills: gap.prerequisites,
          relatedMemories: gap.relatedMemories,
          contextFactors: ["skill_analysis", "learning_patterns"],
          timestamp: Date.now(),
        })
      }
    })

    return predictions
  }

  public async predictPotentialProblems(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []
    const riskFactors = this.analyzeRiskFactors(context)

    riskFactors.forEach((risk) => {
      if (risk.probability > 0.4) {
        predictions.push({
          id: this.generateId(),
          type: "problem_prevention",
          confidence: risk.probability,
          priority: risk.severity > 0.7 ? "urgent" : "high",
          title: `Potential issue: ${risk.problemType}`,
          description: risk.description,
          suggestedAction: risk.preventionAction,
          reasoning: risk.reasoning,
          expectedOutcome: risk.preventionBenefit,
          timeToComplete: risk.preventionTime,
          requiredSkills: risk.requiredSkills,
          relatedMemories: risk.relatedMemories,
          contextFactors: ["risk_analysis", "historical_issues"],
          timestamp: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        })
      }
    })

    return predictions
  }

  public recordPredictionOutcome(predictionId: string, wasAccurate: boolean, userFeedback?: string) {
    const prediction = this.predictionHistory.get(predictionId)
    if (!prediction) return

    // Update adaptive learning
    const key = `${prediction.type}_${prediction.contextFactors.join("_")}`
    if (!this.adaptiveLearning.has(key)) {
      this.adaptiveLearning.set(key, { successes: 0, failures: 0, adaptations: [] })
    }

    const learning = this.adaptiveLearning.get(key)!
    if (wasAccurate) {
      learning.successes++
    } else {
      learning.failures++
      if (userFeedback) {
        learning.adaptations.push(userFeedback)
      }
    }

    // Update contextual triggers
    prediction.contextFactors.forEach((factor) => {
      if (!this.contextualTriggers.has(factor)) {
        this.contextualTriggers.set(factor, [])
      }

      const triggers = this.contextualTriggers.get(factor)!
      const existingTrigger = triggers.find((t) => t.prediction === prediction.type)

      if (existingTrigger) {
        const totalPredictions = learning.successes + learning.failures
        existingTrigger.accuracy = learning.successes / totalPredictions
      } else {
        triggers.push({
          condition: factor,
          prediction: prediction.type,
          accuracy: wasAccurate ? 1 : 0,
        })
      }
    })

    this.saveToStorage()
  }

  public getPersonalizedInsights(context: PredictionContext): PredictiveInsight[] {
    const insights: PredictiveInsight[] = []

    // Productivity insights
    const productivityInsight = this.analyzeProductivityPatterns(context)
    if (productivityInsight) insights.push(productivityInsight)

    // Learning insights
    const learningInsight = this.analyzeLearningEffectiveness(context)
    if (learningInsight) insights.push(learningInsight)

    // Technical insights
    const technicalInsight = this.analyzeTechnicalPatterns(context)
    if (technicalInsight) insights.push(technicalInsight)

    // Creative insights
    const creativeInsight = this.analyzeCreativePatterns(context)
    if (creativeInsight) insights.push(creativeInsight)

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  private analyzeRecentPatterns(recentActions: string[]): Array<{
    patternName: string
    nextAction: string
    actionDetails: string
    confidence: number
    expectedResult: string
    estimatedTime: number
    skills: string[]
    relatedMemoryIds: string[]
  }> {
    const patterns = []

    // Analyze sequences in recent actions
    for (let i = 0; i < recentActions.length - 1; i++) {
      const sequence = recentActions.slice(i, i + 3).join(" -> ")
      const pattern = this.workflowPatterns.get(sequence)

      if (pattern && pattern.effectiveness > 0.6) {
        const nextStep = pattern.steps.find((step) => !recentActions.includes(step.action))

        if (nextStep) {
          patterns.push({
            patternName: pattern.name,
            nextAction: nextStep.action,
            actionDetails: `Execute ${nextStep.action}`,
            confidence: pattern.effectiveness * (nextStep.successRate / 100),
            expectedResult: `Complete ${nextStep.action} successfully`,
            estimatedTime: nextStep.duration,
            skills: [],
            relatedMemoryIds: [],
          })
        }
      }
    }

    return patterns
  }

  private async predictProjectNextSteps(project: ProjectContext, context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = []

    // Based on project status and type
    if (project.status === "planning") {
      predictions.push({
        id: this.generateId(),
        type: "next_action",
        confidence: 0.8,
        priority: "high",
        title: "Set up project structure",
        description: "Initialize the basic project structure and dependencies",
        suggestedAction: "Create initial files and folder structure",
        reasoning: "Projects in planning phase typically need structure setup",
        expectedOutcome: "Ready-to-develop project foundation",
        timeToComplete: 15,
        requiredSkills: ["project_setup"],
        relatedMemories: [],
        contextFactors: ["project_status"],
        timestamp: Date.now(),
      })
    } else if (project.status === "development") {
      if (project.challenges.length > 0) {
        predictions.push({
          id: this.generateId(),
          type: "next_action",
          confidence: 0.7,
          priority: "medium",
          title: `Address ${project.challenges[0]}`,
          description: `Focus on resolving the current challenge: ${project.challenges[0]}`,
          suggestedAction: `Research and implement solution for ${project.challenges[0]}`,
          reasoning: "Unresolved challenges can block project progress",
          expectedOutcome: "Challenge resolved, project can continue",
          timeToComplete: 45,
          requiredSkills: ["problem_solving"],
          relatedMemories: [],
          contextFactors: ["project_challenges"],
          timestamp: Date.now(),
        })
      }
    }

    return predictions
  }

  private predictTimeBasedActions(context: PredictionContext): Prediction[] {
    const predictions: Prediction[] = []
    const currentHour = new Date().getHours()

    // Morning productivity suggestions
    if (currentHour >= 8 && currentHour <= 10) {
      predictions.push({
        id: this.generateId(),
        type: "next_action",
        confidence: 0.6,
        priority: "medium",
        title: "Tackle complex tasks",
        description: "Morning hours are typically best for complex problem-solving",
        suggestedAction: "Focus on the most challenging aspect of your current project",
        reasoning: "Research shows peak cognitive performance in morning hours",
        expectedOutcome: "Higher quality work on difficult tasks",
        timeToComplete: 60,
        requiredSkills: ["focus", "problem_solving"],
        relatedMemories: [],
        contextFactors: ["time_of_day", "cognitive_performance"],
        timestamp: Date.now(),
      })
    }

    // End of day wrap-up
    if (currentHour >= 16 && currentHour <= 18) {
      predictions.push({
        id: this.generateId(),
        type: "next_action",
        confidence: 0.7,
        priority: "medium",
        title: "Review and plan",
        description: "Good time to review progress and plan tomorrow",
        suggestedAction: "Document today's progress and set tomorrow's priorities",
        reasoning: "End-of-day reflection improves next-day productivity",
        expectedOutcome: "Clear plan for tomorrow, sense of accomplishment",
        timeToComplete: 15,
        requiredSkills: ["planning", "reflection"],
        relatedMemories: [],
        contextFactors: ["time_of_day", "productivity_patterns"],
        timestamp: Date.now(),
      })
    }

    return predictions
  }

  private analyzeResourceUsagePatterns(memories: MemoryEntry[]): Array<{
    resourceType: string
    description: string
    howToAccess: string
    reasoning: string
    benefit: string
    timeToAccess: number
    prerequisites: string[]
    relatedMemoryIds: string[]
    effectiveness: number
    urgency: string
  }> {
    const patterns = []

    // Analyze successful memory patterns
    const successfulMemories = memories.filter((m) => m.type === "success")

    successfulMemories.forEach((memory) => {
      if (memory.tags.includes("documentation")) {
        patterns.push({
          resourceType: "Documentation",
          description: "Access relevant documentation for current task",
          howToAccess: "Search official docs or community resources",
          reasoning: "Previous success involved consulting documentation",
          benefit: "Faster problem resolution and better understanding",
          timeToAccess: 10,
          prerequisites: [],
          relatedMemoryIds: [memory.id],
          effectiveness: 0.8,
          urgency: "medium",
        })
      }
    })

    return patterns
  }

  private identifyCurrentWorkflow(context: PredictionContext): WorkflowPattern | null {
    // Analyze recent actions to identify current workflow
    const recentSequence = context.recentActions.slice(-3).join(" -> ")

    for (const [key, pattern] of this.workflowPatterns.entries()) {
      if (key.includes(recentSequence) || recentSequence.includes(key)) {
        return pattern
      }
    }

    return null
  }

  private analyzeWorkflowEfficiency(
    workflow: WorkflowPattern,
    context: PredictionContext,
  ): Array<{
    title: string
    description: string
    action: string
    reasoning: string
    improvement: number
    implementationTime: number
    requiredSkills: string[]
    relatedMemories: string[]
    confidence: number
    impact: number
  }> {
    const optimizations = []

    // Check for inefficient steps
    workflow.steps.forEach((step, index) => {
      if (step.successRate < 70) {
        optimizations.push({
          title: `Improve ${step.action}`,
          description: `Step "${step.action}" has low success rate (${step.successRate}%)`,
          action: `Review and optimize the ${step.action} process`,
          reasoning: "Low success rate indicates potential for improvement",
          improvement: (100 - step.successRate) / 100,
          implementationTime: 20,
          requiredSkills: ["process_optimization"],
          relatedMemories: [],
          confidence: 0.7,
          impact: 0.6,
        })
      }
    })

    return optimizations
  }

  private identifySkillGaps(
    context: PredictionContext,
    learningInsights: any[],
  ): Array<{
    skill: string
    description: string
    learningPath: string
    reasoning: string
    expectedBenefit: string
    estimatedLearningTime: number
    prerequisites: string[]
    relatedMemories: string[]
    confidence: number
    priority: number
  }> {
    const gaps = []

    // Analyze learning insights for gaps
    learningInsights.forEach((insight) => {
      if (insight.insight.includes("Struggling")) {
        gaps.push({
          skill: insight.concept,
          description: `Improve understanding of ${insight.concept}`,
          learningPath: insight.recommendation,
          reasoning: insight.insight,
          expectedBenefit: `Better proficiency in ${insight.concept}`,
          estimatedLearningTime: 120,
          prerequisites: [],
          relatedMemories: [],
          confidence: 0.8,
          priority: 0.7,
        })
      }
    })

    return gaps
  }

  private analyzeRiskFactors(context: PredictionContext): Array<{
    problemType: string
    description: string
    preventionAction: string
    reasoning: string
    preventionBenefit: string
    preventionTime: number
    requiredSkills: string[]
    relatedMemories: string[]
    probability: number
    severity: number
  }> {
    const risks = []

    // Check for common risk patterns
    if (context.sessionDuration > 4 * 60 * 60 * 1000) {
      // 4 hours
      risks.push({
        problemType: "Fatigue",
        description: "Long session may lead to decreased productivity and errors",
        preventionAction: "Take a 15-minute break",
        reasoning: "Extended work sessions without breaks reduce effectiveness",
        preventionBenefit: "Maintained focus and reduced error rate",
        preventionTime: 15,
        requiredSkills: [],
        relatedMemories: [],
        probability: 0.7,
        severity: 0.5,
      })
    }

    if (context.userMood === "frustrated") {
      risks.push({
        problemType: "Decision Fatigue",
        description: "Frustration may lead to poor decisions or giving up",
        preventionAction: "Step back and break down the problem",
        reasoning: "Frustration often indicates need for different approach",
        preventionBenefit: "Clearer thinking and better problem-solving",
        preventionTime: 10,
        requiredSkills: ["problem_decomposition"],
        relatedMemories: [],
        probability: 0.6,
        severity: 0.6,
      })
    }

    return risks
  }

  private analyzeProductivityPatterns(context: PredictionContext): PredictiveInsight | null {
    const currentHour = new Date().getHours()
    const isInProductiveHours = currentHour >= 9 && currentHour <= 17

    if (isInProductiveHours && context.sessionDuration < 2 * 60 * 60 * 1000) {
      return {
        category: "productivity",
        insight: "You're in your productive hours with good session length",
        confidence: 0.8,
        actionable: true,
        impact: "medium",
        timeframe: "immediate",
        evidence: ["time_of_day", "session_duration"],
      }
    }

    return null
  }

  private analyzeLearningEffectiveness(context: PredictionContext): PredictiveInsight | null {
    // This would analyze learning patterns from memory
    return {
      category: "learning",
      insight: "Your learning velocity is optimal for current complexity level",
      confidence: 0.7,
      actionable: true,
      impact: "high",
      timeframe: "short_term",
      evidence: ["learning_patterns", "success_rate"],
    }
  }

  private analyzeTechnicalPatterns(context: PredictionContext): PredictiveInsight | null {
    if (context.projectContext?.technologies.length) {
      return {
        category: "technical",
        insight: `Strong alignment between your skills and ${context.projectContext.technologies[0]}`,
        confidence: 0.6,
        actionable: false,
        impact: "medium",
        timeframe: "immediate",
        evidence: ["skill_match", "project_technologies"],
      }
    }

    return null
  }

  private analyzeCreativePatterns(context: PredictionContext): PredictiveInsight | null {
    if (context.userMood === "excited") {
      return {
        category: "creative",
        insight: "High creative energy detected - good time for innovative solutions",
        confidence: 0.7,
        actionable: true,
        impact: "high",
        timeframe: "immediate",
        evidence: ["emotional_state", "energy_level"],
      }
    }

    return null
  }

  private initializeDefaultPatterns() {
    // Initialize some common workflow patterns
    this.workflowPatterns.set("planning -> setup -> development", {
      id: "standard_dev_workflow",
      name: "Standard Development Workflow",
      steps: [
        { action: "planning", duration: 30, successRate: 85, commonIssues: ["unclear_requirements"] },
        { action: "setup", duration: 15, successRate: 90, commonIssues: ["dependency_conflicts"] },
        { action: "development", duration: 120, successRate: 75, commonIssues: ["technical_challenges"] },
        { action: "testing", duration: 45, successRate: 80, commonIssues: ["edge_cases"] },
        { action: "deployment", duration: 20, successRate: 85, commonIssues: ["configuration_errors"] },
      ],
      frequency: 10,
      lastUsed: Date.now(),
      effectiveness: 0.8,
      userSatisfaction: 0.75,
      adaptations: [],
    })
  }

  private generateId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private saveToStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return

    try {
      const data = {
        workflowPatterns: Array.from(this.workflowPatterns.entries()),
        predictionHistory: Array.from(this.predictionHistory.entries()),
        userBehaviorModel: Array.from(this.userBehaviorModel.entries()),
        contextualTriggers: Array.from(this.contextualTriggers.entries()),
        adaptiveLearning: Array.from(this.adaptiveLearning.entries()),
      }
      localStorage.setItem("cognomega_predictive_ai", JSON.stringify(data))
    } catch (error) {
      console.warn("[v0] Failed to save predictive AI data:", error)
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return

    try {
      const data = localStorage.getItem("cognomega_predictive_ai")
      if (data) {
        const parsed = JSON.parse(data)
        this.workflowPatterns = new Map(parsed.workflowPatterns || [])
        this.predictionHistory = new Map(parsed.predictionHistory || [])
        this.userBehaviorModel = new Map(parsed.userBehaviorModel || [])
        this.contextualTriggers = new Map(parsed.contextualTriggers || [])
        this.adaptiveLearning = new Map(parsed.adaptiveLearning || [])
      }
    } catch (error) {
      console.warn("[v0] Failed to load predictive AI data:", error)
    }
  }
}

let predictiveAIInstance: PredictiveAI | null = null

export const predictiveAI = {
  get instance(): PredictiveAI {
    if (!predictiveAIInstance) {
      predictiveAIInstance = new PredictiveAI()
    }
    return predictiveAIInstance
  },

  // Proxy all methods to the singleton instance
  generatePredictions: (context: PredictionContext) => predictiveAI.instance.generatePredictions(context),
  predictNextActions: (context: PredictionContext) => predictiveAI.instance.predictNextActions(context),
  predictResourceNeeds: (context: PredictionContext) => predictiveAI.instance.predictResourceNeeds(context),
  predictWorkflowOptimizations: (context: PredictionContext) =>
    predictiveAI.instance.predictWorkflowOptimizations(context),
  predictLearningOpportunities: (context: PredictionContext) =>
    predictiveAI.instance.predictLearningOpportunities(context),
  predictPotentialProblems: (context: PredictionContext) => predictiveAI.instance.predictPotentialProblems(context),
  recordPredictionOutcome: (predictionId: string, wasAccurate: boolean, userFeedback?: string) =>
    predictiveAI.instance.recordPredictionOutcome(predictionId, wasAccurate, userFeedback),
  getPersonalizedInsights: (context: PredictionContext) => predictiveAI.instance.getPersonalizedInsights(context),
}
