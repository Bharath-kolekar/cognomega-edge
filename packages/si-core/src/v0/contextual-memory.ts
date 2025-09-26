export interface MemoryEntry {
  id: string
  timestamp: number
  type: "interaction" | "preference" | "success" | "failure" | "context" | "project" | "session" | "learning"
  content: any
  importance: number
  tags: string[]
  relatedEntries: string[]
  sessionId: string
  projectId?: string
  emotionalContext?: "positive" | "negative" | "neutral" | "frustrated" | "excited"
  confidenceLevel: number
  memoryStrength: number
  lastAccessed: number
  accessCount: number
}

export interface UserProfile {
  preferences: {
    frameworks: string[]
    designStyle: string
    complexity: string
    timeline: string
    voiceInteractionStyle: "formal" | "casual" | "technical"
    learningPace: "slow" | "moderate" | "fast"
    preferredExplanationDepth: "brief" | "detailed" | "comprehensive"
  }
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
  projectHistory: string[]
  successPatterns: Map<string, number>
  learningGoals: string[]
  workingHours: { start: number; end: number }
  timezone: string
  collaborationStyle: "independent" | "guided" | "collaborative"
  errorTolerance: "low" | "medium" | "high"
  creativityPreference: "conservative" | "balanced" | "experimental"
}

export interface ProjectContext {
  id: string
  name: string
  type: "web_app" | "mobile_app" | "api" | "library" | "website" | "other"
  technologies: string[]
  startDate: number
  lastActivity: number
  status: "planning" | "development" | "testing" | "deployed" | "archived"
  goals: string[]
  challenges: string[]
  achievements: string[]
  collaborators: string[]
  codebaseSize: "small" | "medium" | "large"
  complexity: "simple" | "moderate" | "complex"
}

export interface SessionContext {
  id: string
  startTime: number
  endTime?: number
  duration?: number
  interactions: number
  projectsWorkedOn: string[]
  topicsDiscussed: string[]
  emotionalJourney: Array<{
    timestamp: number
    emotion: string
    trigger: string
  }>
  productivity: "low" | "medium" | "high"
  satisfaction: number
}

export interface LearningPattern {
  concept: string
  masteryLevel: number
  learningVelocity: number
  strugglingAreas: string[]
  strongAreas: string[]
  preferredLearningMethods: string[]
  lastPracticed: number
  practiceFrequency: number
}

export class ContextualMemory {
  private shortTermMemory: Map<string, MemoryEntry>
  private longTermMemory: Map<string, MemoryEntry>
  private userProfile: UserProfile
  private memoryIndex: Map<string, string[]>
  private maxShortTermEntries = 50
  private maxLongTermEntries = 500
  private projectContexts: Map<string, ProjectContext>
  private sessionHistory: Map<string, SessionContext>
  private currentSessionId: string
  private learningPatterns: Map<string, LearningPattern>
  private memoryGraph: Map<string, Set<string>>
  private semanticIndex: Map<string, Array<{ entryId: string; relevance: number }>>
  private crossSessionPatterns: Map<string, Array<{ pattern: string; frequency: number; lastSeen: number }>>

  constructor() {
    this.shortTermMemory = new Map()
    this.longTermMemory = new Map()
    this.memoryIndex = new Map()
    this.projectContexts = new Map()
    this.sessionHistory = new Map()
    this.learningPatterns = new Map()
    this.memoryGraph = new Map()
    this.semanticIndex = new Map()
    this.crossSessionPatterns = new Map()
    this.currentSessionId = this.generateSessionId()

    this.userProfile = {
      preferences: {
        frameworks: [],
        designStyle: "modern",
        complexity: "moderate",
        timeline: "medium",
        voiceInteractionStyle: "casual",
        learningPace: "moderate",
        preferredExplanationDepth: "detailed",
      },
      skillLevel: "intermediate",
      projectHistory: [],
      successPatterns: new Map(),
      learningGoals: [],
      workingHours: { start: 9, end: 17 },
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
      collaborationStyle: "guided",
      errorTolerance: "medium",
      creativityPreference: "balanced",
    }

    if (typeof window !== "undefined") {
      this.loadFromStorage()
      this.startNewSession()
    }
  }

  public addMemory(
    type: MemoryEntry["type"],
    content: any,
    importance = 0.5,
    tags: string[] = [],
    projectId?: string,
    emotionalContext?: MemoryEntry["emotionalContext"],
  ): string {
    const id = this.generateId()
    const entry: MemoryEntry = {
      id,
      timestamp: Date.now(),
      type,
      content,
      importance,
      tags,
      relatedEntries: [],
      sessionId: this.currentSessionId,
      projectId,
      emotionalContext,
      confidenceLevel: this.calculateConfidenceLevel(content, tags),
      memoryStrength: importance,
      lastAccessed: Date.now(),
      accessCount: 0,
    }

    this.shortTermMemory.set(id, entry)

    this.indexMemoryEntry(entry)

    this.findAdvancedRelatedEntries(entry)

    this.updateLearningPatterns(entry)

    this.updateCrossSessionPatterns(entry)

    this.manageMemorySize()

    this.advancedConsolidation(entry)

    this.saveToStorage()
    return id
  }

  public getRelevantMemories(
    query: string,
    limit = 10,
    contextFilters?: {
      projectId?: string
      sessionId?: string
      timeRange?: { start: number; end: number }
      emotionalContext?: string[]
      minImportance?: number
    },
  ): MemoryEntry[] {
    const queryTags = this.extractTags(query)
    const semanticConcepts = this.extractSemanticConcepts(query)
    const relevantEntries: Array<{ entry: MemoryEntry; score: number }> = []

    const allMemories = new Map([...this.shortTermMemory, ...this.longTermMemory])

    for (const entry of allMemories.values()) {
      if (contextFilters) {
        if (contextFilters.projectId && entry.projectId !== contextFilters.projectId) continue
        if (contextFilters.sessionId && entry.sessionId !== contextFilters.sessionId) continue
        if (contextFilters.timeRange) {
          if (entry.timestamp < contextFilters.timeRange.start || entry.timestamp > contextFilters.timeRange.end)
            continue
        }
        if (
          contextFilters.emotionalContext &&
          !contextFilters.emotionalContext.includes(entry.emotionalContext || "neutral")
        )
          continue
        if (contextFilters.minImportance && entry.importance < contextFilters.minImportance) continue
      }

      const score = this.calculateAdvancedRelevanceScore(entry, queryTags, query, semanticConcepts)
      if (score > 0.2) {
        relevantEntries.push({ entry, score })
        entry.lastAccessed = Date.now()
        entry.accessCount++
      }
    }

    relevantEntries.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) < 0.05) {
        const strengthDiff = b.entry.memoryStrength - a.entry.memoryStrength
        if (Math.abs(strengthDiff) < 0.1) {
          return b.entry.timestamp - a.entry.timestamp
        }
        return strengthDiff
      }
      return scoreDiff
    })

    return relevantEntries.slice(0, limit).map((item) => item.entry)
  }

  public createProjectContext(name: string, type: ProjectContext["type"], technologies: string[] = []): string {
    const id = this.generateProjectId()
    const project: ProjectContext = {
      id,
      name,
      type,
      technologies,
      startDate: Date.now(),
      lastActivity: Date.now(),
      status: "planning",
      goals: [],
      challenges: [],
      achievements: [],
      collaborators: [],
      codebaseSize: "small",
      complexity: "simple",
    }

    this.projectContexts.set(id, project)
    this.addMemory("project", { action: "created", project }, 0.8, ["project_management", type], id)
    this.saveToStorage()
    return id
  }

  public updateProjectContext(projectId: string, updates: Partial<ProjectContext>) {
    const project = this.projectContexts.get(projectId)
    if (project) {
      Object.assign(project, updates)
      project.lastActivity = Date.now()
      this.addMemory("project", { action: "updated", updates }, 0.6, ["project_management"], projectId)
      this.saveToStorage()
    }
  }

  public getProjectContext(projectId: string): ProjectContext | undefined {
    return this.projectContexts.get(projectId)
  }

  public getAllProjects(): ProjectContext[] {
    return Array.from(this.projectContexts.values())
  }

  private startNewSession() {
    const session: SessionContext = {
      id: this.currentSessionId,
      startTime: Date.now(),
      interactions: 0,
      projectsWorkedOn: [],
      topicsDiscussed: [],
      emotionalJourney: [],
      productivity: "medium",
      satisfaction: 0.5,
    }

    this.sessionHistory.set(this.currentSessionId, session)
  }

  public endCurrentSession() {
    const session = this.sessionHistory.get(this.currentSessionId)
    if (session) {
      session.endTime = Date.now()
      session.duration = session.endTime - session.startTime
      this.addMemory("session", { action: "ended", session }, 0.7, ["session_management"])
      this.saveToStorage()
    }
  }

  public getCurrentSession(): SessionContext | undefined {
    return this.sessionHistory.get(this.currentSessionId)
  }

  public updateLearningProgress(concept: string, success: boolean, difficulty: number) {
    let pattern = this.learningPatterns.get(concept)

    if (!pattern) {
      pattern = {
        concept,
        masteryLevel: 0,
        learningVelocity: 0,
        strugglingAreas: [],
        strongAreas: [],
        preferredLearningMethods: [],
        lastPracticed: Date.now(),
        practiceFrequency: 0,
      }
      this.learningPatterns.set(concept, pattern)
    }

    if (success) {
      pattern.masteryLevel = Math.min(pattern.masteryLevel + 0.1, 1.0)
      if (difficulty < 0.3) {
        pattern.strongAreas.push(concept)
      }
    } else {
      pattern.masteryLevel = Math.max(pattern.masteryLevel - 0.05, 0)
      if (difficulty > 0.7) {
        pattern.strugglingAreas.push(concept)
      }
    }

    const timeSinceLastPractice = Date.now() - pattern.lastPracticed
    pattern.learningVelocity = this.calculateLearningVelocity(pattern.masteryLevel, timeSinceLastPractice)
    pattern.lastPracticed = Date.now()
    pattern.practiceFrequency++

    this.addMemory("learning", { concept, success, difficulty, pattern }, 0.6, ["learning_progress", concept])
  }

  public getLearningInsights(): Array<{ concept: string; insight: string; recommendation: string }> {
    const insights = []

    for (const [concept, pattern] of this.learningPatterns.entries()) {
      let insight = ""
      let recommendation = ""

      if (pattern.masteryLevel > 0.8) {
        insight = `Strong mastery of ${concept}`
        recommendation = "Consider teaching others or exploring advanced topics"
      } else if (pattern.masteryLevel < 0.3) {
        insight = `Struggling with ${concept}`
        recommendation = "Focus on fundamentals and practice more frequently"
      } else if (pattern.learningVelocity > 0.5) {
        insight = `Rapid progress in ${concept}`
        recommendation = "Maintain current learning approach"
      } else {
        insight = `Steady progress in ${concept}`
        recommendation = "Consider varying learning methods"
      }

      insights.push({ concept, insight, recommendation })
    }

    return insights
  }

  public getPersonalizedSuggestions(context: string): string[] {
    const suggestions = []
    const relevantMemories = this.getRelevantMemories(context, 10)
    const currentProject = this.getCurrentProject()
    const learningInsights = this.getLearningInsights()

    const patterns = this.analyzeCrossSessionPatterns(context)
    patterns.forEach((pattern) => {
      if (pattern.frequency > 3) {
        suggestions.push(
          `Based on your recurring interest in ${pattern.pattern}, consider exploring advanced techniques`,
        )
      }
    })

    if (currentProject) {
      if (currentProject.challenges.length > 0) {
        suggestions.push(
          `Let's address the ${currentProject.challenges[0]} challenge in your ${currentProject.name} project`,
        )
      }

      if (currentProject.status === "development" && currentProject.technologies.length > 0) {
        suggestions.push(`Consider optimizing your ${currentProject.technologies[0]} implementation`)
      }
    }

    learningInsights.forEach((insight) => {
      if (insight.concept.toLowerCase().includes(context.toLowerCase())) {
        suggestions.push(insight.recommendation)
      }
    })

    const currentHour = new Date().getHours()
    if (currentHour >= this.userProfile.workingHours.start && currentHour <= this.userProfile.workingHours.end) {
      suggestions.push("You're in your productive hours - great time for complex development tasks")
    }

    const recentEmotions = this.getRecentEmotionalContext()
    if (recentEmotions.includes("frustrated")) {
      suggestions.push("Let's break this down into smaller, manageable steps")
    } else if (recentEmotions.includes("excited")) {
      suggestions.push("Great energy! Let's tackle something challenging")
    }

    return suggestions.slice(0, 4)
  }

  public getContextualInsights(currentInput: string): {
    patterns: string[]
    recommendations: string[]
    warnings: string[]
  } {
    const relevantMemories = this.getRelevantMemories(currentInput, 10)
    const patterns = []
    const recommendations: any[] = []
    const warnings: any[] = []

    const typeFrequency = new Map<string, number>()
    relevantMemories.forEach((memory) => {
      memory.tags.forEach((tag) => {
        typeFrequency.set(tag, (typeFrequency.get(tag) || 0) + 1)
      })
    })

    for (const [tag, frequency] of typeFrequency.entries()) {
      if (frequency > 2) {
        patterns.push(`Frequent interest in ${tag}`)
      }
    }

    const successfulMemories = relevantMemories.filter((m) => m.type === "success")
    successfulMemories.forEach((memory) => {
      recommendations.push(`Previous success with ${memory.tags.join(", ")}`)
    })

    const failureMemories = relevantMemories.filter((m) => m.type === "failure")
    failureMemories.forEach((memory) => {
      warnings.push(`Be cautious with ${memory.tags.join(", ")} - had issues before`)
    })

    return { patterns, recommendations, warnings }
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractTags(text: string): string[] {
    const commonTags = [
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
      "deployment",
      "mobile",
      "web",
      "dashboard",
      "landing",
      "ecommerce",
      "blog",
      "portfolio",
    ]

    const normalizedText = text.toLowerCase()
    return commonTags.filter((tag) => normalizedText.includes(tag))
  }

  private calculateRelevanceScore(entry: MemoryEntry, queryTags: string[], query: string): number {
    let score = 0

    const matchingTags = entry.tags.filter((tag) => queryTags.includes(tag))
    score += (matchingTags.length / Math.max(queryTags.length, 1)) * 0.4

    const contentStr = JSON.stringify(entry.content).toLowerCase()
    const queryWords = query.toLowerCase().split(" ")
    const matchingWords = queryWords.filter((word) => contentStr.includes(word))
    score += (matchingWords.length / queryWords.length) * 0.3

    score += entry.importance * 0.2

    const ageInDays = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 1 - ageInDays / 30)
    score += recencyScore * 0.1

    return Math.min(score, 1)
  }

  private findRelatedEntries(entry: MemoryEntry) {
    const relatedIds = []

    for (const [id, existingEntry] of this.shortTermMemory.entries()) {
      if (id === entry.id) continue

      const commonTags = entry.tags.filter((tag) => existingEntry.tags.includes(tag))
      if (commonTags.length > 0) {
        relatedIds.push(id)
        existingEntry.relatedEntries.push(entry.id)
      }
    }

    entry.relatedEntries = relatedIds
  }

  private manageMemorySize() {
    if (this.shortTermMemory.size > this.maxShortTermEntries) {
      const entries = Array.from(this.shortTermMemory.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = entries.slice(0, this.shortTermMemory.size - this.maxShortTermEntries)
      toRemove.forEach(([id]) => {
        this.shortTermMemory.delete(id)
      })
    }

    if (this.longTermMemory.size > this.maxLongTermEntries) {
      const entries = Array.from(this.longTermMemory.entries())
      entries.sort((a, b) => a[1].importance - b[1].importance)

      const toRemove = entries.slice(0, this.longTermMemory.size - this.maxLongTermEntries)
      toRemove.forEach(([id]) => {
        this.longTermMemory.delete(id)
      })
    }
  }

  private consolidateToLongTerm(entry: MemoryEntry) {
    this.longTermMemory.set(entry.id, { ...entry })
  }

  private saveToStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return

    try {
      const data = {
        userProfile: this.userProfile,
        longTermMemory: Array.from(this.longTermMemory.entries()),
        memoryIndex: Array.from(this.memoryIndex.entries()),
        projectContexts: Array.from(this.projectContexts.entries()),
        sessionHistory: Array.from(this.sessionHistory.entries()),
        learningPatterns: Array.from(this.learningPatterns.entries()),
        crossSessionPatterns: Array.from(this.crossSessionPatterns.entries()),
        semanticIndex: Array.from(this.semanticIndex.entries()),
      }
      localStorage.setItem("cognomega_memory", JSON.stringify(data))
    } catch (error) {
      console.warn("[v0] Failed to save memory to storage:", error)
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return

    try {
      const data = localStorage.getItem("cognomega_memory")
      if (data) {
        const parsed = JSON.parse(data)
        this.userProfile = { ...this.userProfile, ...parsed.userProfile }
        this.longTermMemory = new Map(parsed.longTermMemory || [])
        this.memoryIndex = new Map(parsed.memoryIndex || [])
        this.projectContexts = new Map(parsed.projectContexts || [])
        this.sessionHistory = new Map(parsed.sessionHistory || [])
        this.learningPatterns = new Map(parsed.learningPatterns || [])
        this.crossSessionPatterns = new Map(parsed.crossSessionPatterns || [])
        this.semanticIndex = new Map(parsed.semanticIndex || [])
      }
    } catch (error) {
      console.warn("[v0] Failed to load memory from storage:", error)
    }
  }

  private calculateConfidenceLevel(content: any, tags: string[]): number {
    let confidence = 0.5

    confidence += Math.min(tags.length * 0.1, 0.3)

    if (typeof content === "object" && content !== null) {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0)
  }

  private indexMemoryEntry(entry: MemoryEntry) {
    const allConcepts = [...entry.tags, ...this.extractSemanticConcepts(JSON.stringify(entry.content))]

    allConcepts.forEach((concept) => {
      if (!this.memoryIndex.has(concept)) {
        this.memoryIndex.set(concept, [])
      }
      this.memoryIndex.get(concept)!.push(entry.id)

      if (!this.semanticIndex.has(concept)) {
        this.semanticIndex.set(concept, [])
      }
      this.semanticIndex.get(concept)!.push({
        entryId: entry.id,
        relevance: entry.importance,
      })
    })
  }

  private extractSemanticConcepts(text: string): string[] {
    const concepts: any[] = []
    const lowerText = text.toLowerCase()

    const techConcepts = [
      "authentication",
      "authorization",
      "database",
      "api",
      "frontend",
      "backend",
      "responsive",
      "mobile",
      "desktop",
      "performance",
      "security",
      "testing",
      "deployment",
      "optimization",
      "scalability",
      "architecture",
      "design_patterns",
    ]

    techConcepts.forEach((concept) => {
      if (lowerText.includes(concept.replace("_", " "))) {
        concepts.push(concept)
      }
    })

    return concepts
  }

  private findAdvancedRelatedEntries(entry: MemoryEntry) {
    const relatedIds = new Set<string>()

    entry.tags.forEach((tag) => {
      const semanticMatches = this.semanticIndex.get(tag) || []
      semanticMatches.forEach((match) => {
        if (match.entryId !== entry.id && match.relevance > 0.5) {
          relatedIds.add(match.entryId)
        }
      })
    })

    if (entry.projectId) {
      for (const [id, existingEntry] of this.shortTermMemory.entries()) {
        if (existingEntry.projectId === entry.projectId && id !== entry.id) {
          relatedIds.add(id)
        }
      }
    }

    entry.relatedEntries = Array.from(relatedIds)

    if (!this.memoryGraph.has(entry.id)) {
      this.memoryGraph.set(entry.id, new Set())
    }
    relatedIds.forEach((relatedId) => {
      this.memoryGraph.get(entry.id)!.add(relatedId)
      if (!this.memoryGraph.has(relatedId)) {
        this.memoryGraph.set(relatedId, new Set())
      }
      this.memoryGraph.get(relatedId)!.add(entry.id)
    })
  }

  private updateLearningPatterns(entry: MemoryEntry) {
    if (entry.type === "success" || entry.type === "failure") {
      entry.tags.forEach((tag) => {
        this.updateLearningProgress(tag, entry.type === "success", entry.importance)
      })
    }
  }

  private updateCrossSessionPatterns(entry: MemoryEntry) {
    entry.tags.forEach((tag) => {
      if (!this.crossSessionPatterns.has(entry.sessionId)) {
        this.crossSessionPatterns.set(entry.sessionId, [])
      }

      const sessionPatterns = this.crossSessionPatterns.get(entry.sessionId)!
      const existingPattern = sessionPatterns.find((p) => p.pattern === tag)

      if (existingPattern) {
        existingPattern.frequency++
        existingPattern.lastSeen = Date.now()
      } else {
        sessionPatterns.push({
          pattern: tag,
          frequency: 1,
          lastSeen: Date.now(),
        })
      }
    })
  }

  private calculateAdvancedRelevanceScore(
    entry: MemoryEntry,
    queryTags: string[],
    query: string,
    semanticConcepts: string[],
  ): number {
    let score = 0

    const matchingTags = entry.tags.filter((tag) => queryTags.includes(tag))
    score += (matchingTags.length / Math.max(queryTags.length, 1)) * 0.3

    const matchingConcepts = entry.tags.filter((tag) => semanticConcepts.includes(tag))
    score += (matchingConcepts.length / Math.max(semanticConcepts.length, 1)) * 0.2

    const contentStr = JSON.stringify(entry.content).toLowerCase()
    const queryWords = query.toLowerCase().split(" ")
    const matchingWords = queryWords.filter((word) => contentStr.includes(word))
    score += (matchingWords.length / queryWords.length) * 0.2

    score += entry.memoryStrength * 0.15
    score += Math.min(entry.accessCount / 10, 0.1) * 0.05

    const ageInDays = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 1 - ageInDays / 30)
    score += recencyScore * 0.1

    return Math.min(score, 1)
  }

  private advancedConsolidation(entry: MemoryEntry) {
    let consolidationScore = entry.importance * 0.4

    if (entry.accessCount > 5) {
      consolidationScore += 0.2
    }

    if (entry.relatedEntries.length > 3) {
      consolidationScore += 0.2
    }

    if (entry.projectId) {
      const project = this.projectContexts.get(entry.projectId)
      if (project && project.status === "development") {
        consolidationScore += 0.2
      }
    }

    if (consolidationScore > 0.7) {
      this.consolidateToLongTerm(entry)
    }
  }

  private calculateLearningVelocity(masteryLevel: number, timeSinceLastPractice: number): number {
    const daysSinceLastPractice = timeSinceLastPractice / (1000 * 60 * 60 * 24)
    const velocityDecay = Math.max(0, 1 - daysSinceLastPractice / 7)
    return masteryLevel * velocityDecay
  }

  private analyzeCrossSessionPatterns(context: string): Array<{ pattern: string; frequency: number }> {
    const patternFrequency = new Map<string, number>()

    for (const sessionPatterns of this.crossSessionPatterns.values()) {
      sessionPatterns.forEach((pattern) => {
        if (pattern.pattern.toLowerCase().includes(context.toLowerCase())) {
          patternFrequency.set(pattern.pattern, (patternFrequency.get(pattern.pattern) || 0) + pattern.frequency)
        }
      })
    }

    return Array.from(patternFrequency.entries())
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
  }

  private getCurrentProject(): ProjectContext | undefined {
    const recentMemories = this.getRelevantMemories("", 5, {
      timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
    })

    for (const memory of recentMemories) {
      if (memory.projectId) {
        return this.projectContexts.get(memory.projectId)
      }
    }

    return undefined
  }

  private getRecentEmotionalContext(): string[] {
    const recentMemories = this.getRelevantMemories("", 10, {
      timeRange: { start: Date.now() - 60 * 60 * 1000, end: Date.now() },
    })

    return recentMemories.map((m) => m.emotionalContext).filter(Boolean) as string[]
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

let contextualMemoryInstance: ContextualMemory | null = null

export const contextualMemory = {
  get instance(): ContextualMemory {
    if (!contextualMemoryInstance) {
      contextualMemoryInstance = new ContextualMemory()
    }
    return contextualMemoryInstance
  },

  // Proxy all methods to the singleton instance
  addMemory: (
    type: MemoryEntry["type"],
    content: any,
    importance?: number,
    tags?: string[],
    projectId?: string,
    emotionalContext?: MemoryEntry["emotionalContext"],
  ) => contextualMemory.instance.addMemory(type, content, importance, tags, projectId, emotionalContext),
  getRelevantMemories: (query: string, limit?: number, contextFilters?: any) =>
    contextualMemory.instance.getRelevantMemories(query, limit, contextFilters),
  createProjectContext: (name: string, type: ProjectContext["type"], technologies?: string[]) =>
    contextualMemory.instance.createProjectContext(name, type, technologies),
  updateProjectContext: (projectId: string, updates: Partial<ProjectContext>) =>
    contextualMemory.instance.updateProjectContext(projectId, updates),
  getProjectContext: (projectId: string) => contextualMemory.instance.getProjectContext(projectId),
  getAllProjects: () => contextualMemory.instance.getAllProjects(),
  endCurrentSession: () => contextualMemory.instance.endCurrentSession(),
  getCurrentSession: () => contextualMemory.instance.getCurrentSession(),
  updateLearningProgress: (concept: string, success: boolean, difficulty: number) =>
    contextualMemory.instance.updateLearningProgress(concept, success, difficulty),
  getLearningInsights: () => contextualMemory.instance.getLearningInsights(),
  getPersonalizedSuggestions: (context: string) => contextualMemory.instance.getPersonalizedSuggestions(context),
  getContextualInsights: (currentInput: string) => contextualMemory.instance.getContextualInsights(currentInput),
}
