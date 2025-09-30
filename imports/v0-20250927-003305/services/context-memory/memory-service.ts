export interface UserContext {
  userId: string
  sessionId: string
  preferences: UserPreferences
  conversationHistory: ConversationEntry[]
  behaviorPatterns: BehaviorPattern[]
  skills: UserSkill[]
  projects: ProjectContext[]
  lastActivity: number
  createdAt: number
}

export interface UserPreferences {
  language: string
  voiceSettings: {
    preferredVoice?: string
    speechRate: number
    volume: number
  }
  uiPreferences: {
    theme: "light" | "dark" | "auto"
    compactMode: boolean
    animations: boolean
  }
  aiSettings: {
    responseStyle: "concise" | "detailed" | "conversational"
    expertise: "beginner" | "intermediate" | "advanced"
    domains: string[]
  }
}

export interface ConversationEntry {
  id: string
  timestamp: number
  type: "voice" | "text" | "action"
  content: string
  context: Record<string, any>
  sentiment: "positive" | "neutral" | "negative"
  intent: string
  confidence: number
}

export interface BehaviorPattern {
  pattern: string
  frequency: number
  lastOccurrence: number
  context: string[]
  confidence: number
}

export interface UserSkill {
  domain: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  evidence: string[]
  lastUpdated: number
}

export interface ProjectContext {
  id: string
  name: string
  type: string
  technologies: string[]
  status: "active" | "completed" | "paused"
  lastAccessed: number
  files: string[]
  notes: string[]
}

export interface ContextQuery {
  userId: string
  sessionId?: string
  type: "conversation" | "preferences" | "patterns" | "skills" | "projects" | "all"
  timeRange?: {
    start: number
    end: number
  }
  limit?: number
}

export interface ContextResponse {
  context: Partial<UserContext>
  relevantEntries: ConversationEntry[]
  patterns: BehaviorPattern[]
  suggestions: string[]
  confidence: number
}

export class ContextMemoryService {
  private userContexts = new Map<string, UserContext>()
  private sessionContexts = new Map<string, Partial<UserContext>>()
  private readonly maxHistoryEntries = 1000
  private readonly maxPatterns = 50

  async storeContext(userId: string, sessionId: string, data: Partial<UserContext>): Promise<void> {
    let userContext = this.userContexts.get(userId)

    if (!userContext) {
      userContext = this.createDefaultUserContext(userId, sessionId)
    }

    // Update user context with new data
    if (data.preferences) {
      userContext.preferences = { ...userContext.preferences, ...data.preferences }
    }

    if (data.conversationHistory) {
      userContext.conversationHistory.push(...data.conversationHistory)
      // Keep only recent entries
      if (userContext.conversationHistory.length > this.maxHistoryEntries) {
        userContext.conversationHistory = userContext.conversationHistory.slice(-this.maxHistoryEntries)
      }
    }

    if (data.behaviorPatterns) {
      this.updateBehaviorPatterns(userContext, data.behaviorPatterns)
    }

    if (data.skills) {
      this.updateUserSkills(userContext, data.skills)
    }

    if (data.projects) {
      this.updateProjectContexts(userContext, data.projects)
    }

    userContext.lastActivity = Date.now()
    this.userContexts.set(userId, userContext)
  }

  async retrieveContext(query: ContextQuery): Promise<ContextResponse> {
    const userContext = this.userContexts.get(query.userId)

    if (!userContext) {
      return {
        context: {},
        relevantEntries: [],
        patterns: [],
        suggestions: [],
        confidence: 0,
      }
    }

    let relevantEntries = userContext.conversationHistory
    const patterns = userContext.behaviorPatterns

    // Apply time range filter
    if (query.timeRange) {
      relevantEntries = relevantEntries.filter(
        (entry) => entry.timestamp >= query.timeRange!.start && entry.timestamp <= query.timeRange!.end,
      )
    }

    // Apply limit
    if (query.limit) {
      relevantEntries = relevantEntries.slice(-query.limit)
    }

    // Filter by type
    let context: Partial<UserContext> = {}
    switch (query.type) {
      case "conversation":
        context = { conversationHistory: relevantEntries }
        break
      case "preferences":
        context = { preferences: userContext.preferences }
        break
      case "patterns":
        context = { behaviorPatterns: patterns }
        break
      case "skills":
        context = { skills: userContext.skills }
        break
      case "projects":
        context = { projects: userContext.projects }
        break
      case "all":
        context = userContext
        break
    }

    const suggestions = this.generateContextualSuggestions(userContext, relevantEntries)
    const confidence = this.calculateContextConfidence(userContext, relevantEntries)

    return {
      context,
      relevantEntries,
      patterns,
      suggestions,
      confidence,
    }
  }

  async addConversationEntry(userId: string, sessionId: string, entry: Omit<ConversationEntry, "id">): Promise<void> {
    const conversationEntry: ConversationEntry = {
      ...entry,
      id: `${sessionId}-${Date.now()}-${Math.random()}`,
    }

    await this.storeContext(userId, sessionId, {
      conversationHistory: [conversationEntry],
    })

    // Analyze and update behavior patterns
    const patterns = this.analyzeBehaviorPatterns([conversationEntry])
    if (patterns.length > 0) {
      await this.storeContext(userId, sessionId, {
        behaviorPatterns: patterns,
      })
    }
  }

  async updateUserPreferences(userId: string, sessionId: string, preferences: Partial<UserPreferences>): Promise<void> {
    await this.storeContext(userId, sessionId, { preferences })
  }

  async analyzeUserSkills(userId: string, interactions: ConversationEntry[]): Promise<UserSkill[]> {
    const skillAnalysis = new Map<string, { level: number; evidence: string[] }>()

    for (const interaction of interactions) {
      const domains = this.extractDomains(interaction.content)
      const complexity = this.assessComplexity(interaction.content)

      for (const domain of domains) {
        if (!skillAnalysis.has(domain)) {
          skillAnalysis.set(domain, { level: 0, evidence: [] })
        }

        const skill = skillAnalysis.get(domain)!
        skill.level += complexity
        skill.evidence.push(interaction.content.substring(0, 100))
      }
    }

    const skills: UserSkill[] = []
    for (const [domain, analysis] of skillAnalysis) {
      const avgLevel = analysis.level / analysis.evidence.length
      let level: UserSkill["level"] = "beginner"

      if (avgLevel > 3) level = "expert"
      else if (avgLevel > 2) level = "advanced"
      else if (avgLevel > 1) level = "intermediate"

      skills.push({
        domain,
        level,
        evidence: analysis.evidence.slice(0, 5),
        lastUpdated: Date.now(),
      })
    }

    return skills
  }

  async getPersonalizedSuggestions(userId: string, currentContext?: string): Promise<string[]> {
    const userContext = this.userContexts.get(userId)
    if (!userContext) return []

    const suggestions = []
    const recentEntries = userContext.conversationHistory.slice(-10)

    // Based on recent activity
    const recentDomains = new Set(recentEntries.flatMap((entry) => this.extractDomains(entry.content)))

    for (const domain of recentDomains) {
      suggestions.push(`Continue working on ${domain} projects`)
      suggestions.push(`Learn advanced ${domain} techniques`)
    }

    // Based on user skills
    for (const skill of userContext.skills) {
      if (skill.level === "beginner") {
        suggestions.push(`Practice more ${skill.domain} fundamentals`)
      } else if (skill.level === "advanced") {
        suggestions.push(`Explore ${skill.domain} best practices`)
      }
    }

    // Based on behavior patterns
    for (const pattern of userContext.behaviorPatterns.slice(0, 3)) {
      if (pattern.pattern.includes("create")) {
        suggestions.push("Try building a new project")
      } else if (pattern.pattern.includes("debug")) {
        suggestions.push("Review error handling patterns")
      }
    }

    return suggestions.slice(0, 5)
  }

  private createDefaultUserContext(userId: string, sessionId: string): UserContext {
    return {
      userId,
      sessionId,
      preferences: {
        language: "en",
        voiceSettings: {
          speechRate: 1,
          volume: 1,
        },
        uiPreferences: {
          theme: "auto",
          compactMode: false,
          animations: true,
        },
        aiSettings: {
          responseStyle: "conversational",
          expertise: "intermediate",
          domains: [],
        },
      },
      conversationHistory: [],
      behaviorPatterns: [],
      skills: [],
      projects: [],
      lastActivity: Date.now(),
      createdAt: Date.now(),
    }
  }

  private updateBehaviorPatterns(userContext: UserContext, newPatterns: BehaviorPattern[]): void {
    const patternMap = new Map<string, BehaviorPattern>()

    // Add existing patterns
    for (const pattern of userContext.behaviorPatterns) {
      patternMap.set(pattern.pattern, pattern)
    }

    // Update with new patterns
    for (const newPattern of newPatterns) {
      const existing = patternMap.get(newPattern.pattern)
      if (existing) {
        existing.frequency += newPattern.frequency
        existing.lastOccurrence = Math.max(existing.lastOccurrence, newPattern.lastOccurrence)
        existing.confidence = (existing.confidence + newPattern.confidence) / 2
      } else {
        patternMap.set(newPattern.pattern, newPattern)
      }
    }

    // Keep only top patterns
    userContext.behaviorPatterns = Array.from(patternMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, this.maxPatterns)
  }

  private updateUserSkills(userContext: UserContext, newSkills: UserSkill[]): void {
    const skillMap = new Map<string, UserSkill>()

    // Add existing skills
    for (const skill of userContext.skills) {
      skillMap.set(skill.domain, skill)
    }

    // Update with new skills
    for (const newSkill of newSkills) {
      const existing = skillMap.get(newSkill.domain)
      if (existing) {
        // Update skill level if evidence suggests improvement
        if (newSkill.level !== existing.level) {
          existing.level = newSkill.level
          existing.evidence.push(...newSkill.evidence)
          existing.evidence = existing.evidence.slice(-10) // Keep recent evidence
        }
        existing.lastUpdated = Date.now()
      } else {
        skillMap.set(newSkill.domain, newSkill)
      }
    }

    userContext.skills = Array.from(skillMap.values())
  }

  private updateProjectContexts(userContext: UserContext, newProjects: ProjectContext[]): void {
    const projectMap = new Map<string, ProjectContext>()

    // Add existing projects
    for (const project of userContext.projects) {
      projectMap.set(project.id, project)
    }

    // Update with new projects
    for (const newProject of newProjects) {
      projectMap.set(newProject.id, newProject)
    }

    userContext.projects = Array.from(projectMap.values())
  }

  private analyzeBehaviorPatterns(entries: ConversationEntry[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = []
    const patternCounts = new Map<string, number>()

    for (const entry of entries) {
      const detectedPatterns = this.detectPatterns(entry.content, entry.intent)

      for (const pattern of detectedPatterns) {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
      }
    }

    for (const [pattern, frequency] of patternCounts) {
      patterns.push({
        pattern,
        frequency,
        lastOccurrence: Date.now(),
        context: ["conversation"],
        confidence: Math.min(0.95, frequency * 0.1 + 0.5),
      })
    }

    return patterns
  }

  private detectPatterns(content: string, intent: string): string[] {
    const patterns = []
    const lowerContent = content.toLowerCase()

    // Common interaction patterns
    if (lowerContent.includes("create") || lowerContent.includes("build")) {
      patterns.push("creation_requests")
    }
    if (lowerContent.includes("fix") || lowerContent.includes("debug")) {
      patterns.push("debugging_requests")
    }
    if (lowerContent.includes("explain") || lowerContent.includes("how")) {
      patterns.push("explanation_requests")
    }
    if (lowerContent.includes("optimize") || lowerContent.includes("improve")) {
      patterns.push("optimization_requests")
    }

    // Intent-based patterns
    if (intent) {
      patterns.push(`intent_${intent}`)
    }

    return patterns
  }

  private extractDomains(content: string): string[] {
    const domains = []
    const lowerContent = content.toLowerCase()

    const domainKeywords = {
      react: ["react", "jsx", "component", "hook"],
      nextjs: ["next", "nextjs", "app router"],
      typescript: ["typescript", "ts", "type"],
      javascript: ["javascript", "js", "function"],
      css: ["css", "style", "tailwind"],
      api: ["api", "endpoint", "rest"],
      database: ["database", "db", "sql"],
      ai: ["ai", "machine learning", "neural"],
    }

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        domains.push(domain)
      }
    }

    return domains
  }

  private assessComplexity(content: string): number {
    let complexity = 1

    // Length-based complexity
    if (content.length > 200) complexity += 1
    if (content.length > 500) complexity += 1

    // Technical term density
    const technicalTerms = ["function", "component", "interface", "async", "await", "promise"]
    const termCount = technicalTerms.filter((term) => content.toLowerCase().includes(term)).length
    complexity += termCount * 0.5

    return Math.min(4, complexity)
  }

  private generateContextualSuggestions(userContext: UserContext, recentEntries: ConversationEntry[]): string[] {
    const suggestions = []

    // Based on recent activity
    if (recentEntries.length > 0) {
      const lastEntry = recentEntries[recentEntries.length - 1]
      if (lastEntry.intent === "creation_request") {
        suggestions.push("Would you like to add more features?")
        suggestions.push("Need help with testing?")
      }
    }

    // Based on user expertise
    if (userContext.preferences.aiSettings.expertise === "beginner") {
      suggestions.push("Let me explain the basics")
      suggestions.push("Would you like a step-by-step guide?")
    } else if (userContext.preferences.aiSettings.expertise === "advanced") {
      suggestions.push("Ready for advanced techniques?")
      suggestions.push("Want to explore best practices?")
    }

    return suggestions.slice(0, 3)
  }

  private calculateContextConfidence(userContext: UserContext, relevantEntries: ConversationEntry[]): number {
    let confidence = 0.5

    // More entries = higher confidence
    confidence += Math.min(0.3, relevantEntries.length * 0.01)

    // Recent activity = higher confidence
    const hoursSinceLastActivity = (Date.now() - userContext.lastActivity) / (1000 * 60 * 60)
    if (hoursSinceLastActivity < 24) confidence += 0.2

    // Established patterns = higher confidence
    confidence += Math.min(0.2, userContext.behaviorPatterns.length * 0.02)

    return Math.min(0.95, confidence)
  }

  clearUserContext(userId: string): void {
    this.userContexts.delete(userId)
  }

  clearSessionContext(sessionId: string): void {
    this.sessionContexts.delete(sessionId)
  }
}

export const contextMemoryService = new ContextMemoryService()
