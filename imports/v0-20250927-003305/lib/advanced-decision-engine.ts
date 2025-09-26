"use client"

export interface DecisionContext {
  userGoal: string
  technicalRequirements: string[]
  constraints: string[]
  preferences: Record<string, any>
  complexity: "simple" | "moderate" | "complex" | "enterprise"
  timeline: "immediate" | "short" | "medium" | "long"
}

export interface DecisionPath {
  id: string
  name: string
  confidence: number
  reasoning: string[]
  steps: Array<{
    action: string
    description: string
    estimatedTime: number
    dependencies: string[]
  }>
  alternatives: string[]
  risks: string[]
  benefits: string[]
}

export class AdvancedDecisionEngine {
  private decisionTree: Map<string, any>
  private contextHistory: DecisionContext[]
  private learningWeights: Map<string, number>

  constructor() {
    this.decisionTree = new Map()
    this.contextHistory = []
    this.learningWeights = new Map()
    this.initializeDecisionTree()
  }

  private initializeDecisionTree() {
    // Web Application Decision Paths
    this.decisionTree.set("web_application", {
      triggers: ["website", "web app", "landing page", "dashboard", "portal"],
      paths: {
        simple: {
          frameworks: ["Next.js", "React"],
          styling: ["Tailwind CSS", "CSS Modules"],
          deployment: ["Vercel", "Netlify"],
          timeline: "1-3 days",
        },
        moderate: {
          frameworks: ["Next.js", "React", "TypeScript"],
          styling: ["Tailwind CSS", "Styled Components"],
          backend: ["API Routes", "Serverless Functions"],
          database: ["Supabase", "PlanetScale"],
          deployment: ["Vercel", "AWS"],
          timeline: "1-2 weeks",
        },
        complex: {
          frameworks: ["Next.js", "React", "TypeScript", "Node.js"],
          styling: ["Tailwind CSS", "Design System"],
          backend: ["Express", "GraphQL", "REST API"],
          database: ["PostgreSQL", "Redis", "MongoDB"],
          auth: ["NextAuth", "Auth0", "Supabase Auth"],
          deployment: ["Docker", "Kubernetes", "AWS"],
          timeline: "2-8 weeks",
        },
      },
    })

    // Mobile Application Decision Paths
    this.decisionTree.set("mobile_application", {
      triggers: ["mobile app", "ios", "android", "react native", "flutter"],
      paths: {
        simple: {
          frameworks: ["React Native", "Expo"],
          styling: ["NativeBase", "React Native Elements"],
          deployment: ["Expo Go", "TestFlight"],
          timeline: "1-2 weeks",
        },
        moderate: {
          frameworks: ["React Native", "TypeScript"],
          styling: ["Styled Components", "NativeWind"],
          backend: ["Firebase", "Supabase"],
          deployment: ["App Store", "Google Play"],
          timeline: "3-6 weeks",
        },
        complex: {
          frameworks: ["React Native", "TypeScript", "Native Modules"],
          styling: ["Custom Design System"],
          backend: ["Custom API", "Microservices"],
          database: ["SQLite", "Realm", "Cloud Database"],
          deployment: ["CI/CD Pipeline", "App Store", "Google Play"],
          timeline: "2-6 months",
        },
      },
    })

    // E-commerce Decision Paths
    this.decisionTree.set("ecommerce", {
      triggers: ["store", "shop", "ecommerce", "marketplace", "sell", "buy"],
      paths: {
        simple: {
          platform: ["Shopify", "WooCommerce"],
          payment: ["Stripe", "PayPal"],
          features: ["Product Catalog", "Shopping Cart", "Checkout"],
          timeline: "1-2 weeks",
        },
        moderate: {
          frameworks: ["Next.js", "Shopify Storefront API"],
          payment: ["Stripe", "PayPal", "Apple Pay"],
          features: ["Custom Checkout", "Inventory Management", "Order Tracking"],
          backend: ["Headless CMS", "API Integration"],
          timeline: "3-8 weeks",
        },
        complex: {
          frameworks: ["Custom Full-Stack Solution"],
          payment: ["Multi-gateway", "Subscription Billing"],
          features: ["Multi-vendor", "Advanced Analytics", "AI Recommendations"],
          backend: ["Microservices", "Event-driven Architecture"],
          timeline: "3-12 months",
        },
      },
    })
  }

  public async makeDecision(userInput: string, context: Partial<DecisionContext> = {}): Promise<DecisionPath[]> {
    // Analyze user input to determine application type and complexity
    const appType = this.determineApplicationType(userInput)
    const complexity = this.assessComplexity(userInput, context)
    const requirements = this.extractRequirements(userInput)

    // Build decision context
    const decisionContext: DecisionContext = {
      userGoal: userInput,
      technicalRequirements: requirements.technical,
      constraints: requirements.constraints,
      preferences: context.preferences || {},
      complexity,
      timeline: context.timeline || "medium",
    }

    this.contextHistory.push(decisionContext)

    // Generate decision paths
    const paths = this.generateDecisionPaths(appType, decisionContext)

    // Rank paths by confidence and feasibility
    return this.rankDecisionPaths(paths, decisionContext)
  }

  private determineApplicationType(input: string): string {
    const normalizedInput = input.toLowerCase()
    let bestMatch = "web_application" // default
    let highestScore = 0

    for (const [type, config] of this.decisionTree.entries()) {
      const score = config.triggers.reduce((acc: number, trigger: string) => {
        return acc + (normalizedInput.includes(trigger) ? 1 : 0)
      }, 0)

      if (score > highestScore) {
        highestScore = score
        bestMatch = type
      }
    }

    return bestMatch
  }

  private assessComplexity(input: string, context: Partial<DecisionContext>): DecisionContext["complexity"] {
    const complexityIndicators = {
      simple: ["simple", "basic", "quick", "minimal", "landing page"],
      moderate: ["dashboard", "user auth", "database", "api", "responsive"],
      complex: ["enterprise", "scalable", "microservices", "advanced", "ai", "machine learning"],
      enterprise: ["enterprise", "large scale", "multi-tenant", "high availability"],
    }

    const normalizedInput = input.toLowerCase()
    let maxScore = 0
    let detectedComplexity: DecisionContext["complexity"] = "simple"

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      const score = indicators.reduce((acc, indicator) => {
        return acc + (normalizedInput.includes(indicator) ? 1 : 0)
      }, 0)

      if (score > maxScore) {
        maxScore = score
        detectedComplexity = level as DecisionContext["complexity"]
      }
    }

    // Adjust based on context
    if (context.timeline === "immediate") {
      detectedComplexity = "simple"
    } else if (context.timeline === "long") {
      detectedComplexity = detectedComplexity === "simple" ? "moderate" : detectedComplexity
    }

    return detectedComplexity
  }

  private extractRequirements(input: string): {
    technical: string[]
    constraints: string[]
  } {
    const technicalKeywords = [
      "react",
      "nextjs",
      "typescript",
      "tailwind",
      "database",
      "auth",
      "api",
      "mobile",
      "responsive",
      "seo",
      "analytics",
      "payment",
      "real-time",
      "ai",
      "ml",
    ]

    const constraintKeywords = ["budget", "timeline", "performance", "security", "scalability", "accessibility"]

    const normalizedInput = input.toLowerCase()
    const technical = technicalKeywords.filter((keyword) => normalizedInput.includes(keyword))
    const constraints = constraintKeywords.filter((keyword) => normalizedInput.includes(keyword))

    return { technical, constraints }
  }

  private generateDecisionPaths(appType: string, context: DecisionContext): DecisionPath[] {
    const config = this.decisionTree.get(appType)
    if (!config) return []

    const paths: DecisionPath[] = []
    const complexityPath = config.paths[context.complexity]

    if (complexityPath) {
      // Primary recommended path
      paths.push({
        id: `${appType}_${context.complexity}_primary`,
        name: `${appType.replace("_", " ")} - ${context.complexity} approach`,
        confidence: this.calculatePathConfidence(complexityPath, context),
        reasoning: this.generateReasoning(complexityPath, context),
        steps: this.generateImplementationSteps(complexityPath, context),
        alternatives: this.generateAlternatives(config, context.complexity),
        risks: this.assessRisks(complexityPath, context),
        benefits: this.identifyBenefits(complexityPath, context),
      })

      // Alternative paths
      if (context.complexity !== "simple") {
        const simplerPath = config.paths.simple
        paths.push({
          id: `${appType}_simple_alternative`,
          name: `${appType.replace("_", " ")} - simplified approach`,
          confidence: this.calculatePathConfidence(simplerPath, context) * 0.8,
          reasoning: ["Faster to implement", "Lower complexity", "Easier to maintain"],
          steps: this.generateImplementationSteps(simplerPath, context),
          alternatives: [],
          risks: ["May not meet all requirements", "Limited scalability"],
          benefits: ["Quick delivery", "Lower cost", "Easier debugging"],
        })
      }
    }

    return paths
  }

  private calculatePathConfidence(path: any, context: DecisionContext): number {
    let confidence = 0.7 // base confidence

    // Adjust based on requirement match
    const pathTechnologies = Object.values(path).flat()
    const matchingRequirements = context.technicalRequirements.filter((req) =>
      pathTechnologies.some((tech: any) => tech.toLowerCase().includes(req)),
    )

    confidence += (matchingRequirements.length / Math.max(context.technicalRequirements.length, 1)) * 0.2

    // Adjust based on timeline compatibility
    if (context.timeline === "immediate" && path.timeline?.includes("days")) {
      confidence += 0.1
    } else if (context.timeline === "long" && path.timeline?.includes("months")) {
      confidence += 0.1
    }

    return Math.min(confidence, 1)
  }

  private generateReasoning(path: any, context: DecisionContext): string[] {
    const reasoning = []

    if (path.frameworks) {
      reasoning.push(`Using ${path.frameworks.join(", ")} for robust development foundation`)
    }

    if (path.database) {
      reasoning.push(`${path.database.join(" or ")} for reliable data management`)
    }

    if (path.deployment) {
      reasoning.push(`Deploying with ${path.deployment.join(" or ")} for optimal performance`)
    }

    if (context.complexity === "simple") {
      reasoning.push("Optimized for quick delivery and ease of use")
    } else if (context.complexity === "complex") {
      reasoning.push("Designed for scalability and advanced features")
    }

    return reasoning
  }

  private generateImplementationSteps(path: any, context: DecisionContext): DecisionPath["steps"] {
    const steps = []

    // Setup phase
    steps.push({
      action: "project_setup",
      description: `Initialize project with ${path.frameworks?.[0] || "chosen framework"}`,
      estimatedTime: 30,
      dependencies: [],
    })

    // Development phases
    if (path.styling) {
      steps.push({
        action: "styling_setup",
        description: `Configure ${path.styling[0]} for consistent design`,
        estimatedTime: 60,
        dependencies: ["project_setup"],
      })
    }

    if (path.backend) {
      steps.push({
        action: "backend_development",
        description: `Implement ${path.backend.join(" and ")} functionality`,
        estimatedTime: 240,
        dependencies: ["project_setup"],
      })
    }

    if (path.database) {
      steps.push({
        action: "database_integration",
        description: `Set up ${path.database[0]} for data persistence`,
        estimatedTime: 120,
        dependencies: ["backend_development"],
      })
    }

    // Deployment phase
    steps.push({
      action: "deployment",
      description: `Deploy to ${path.deployment?.[0] || "production environment"}`,
      estimatedTime: 90,
      dependencies: steps.map((s) => s.action).slice(0, -1),
    })

    return steps
  }

  private generateAlternatives(config: any, currentComplexity: string): string[] {
    const alternatives = []
    const complexityLevels = Object.keys(config.paths)

    for (const level of complexityLevels) {
      if (level !== currentComplexity) {
        alternatives.push(`${level} implementation approach`)
      }
    }

    return alternatives
  }

  private assessRisks(path: any, context: DecisionContext): string[] {
    const risks = []

    if (context.complexity === "complex") {
      risks.push("Higher development complexity", "Longer implementation time", "Increased maintenance overhead")
    }

    if (context.timeline === "immediate") {
      risks.push("Potential quality compromises due to tight timeline")
    }

    if (path.database && path.database.length > 1) {
      risks.push("Database selection may impact performance")
    }

    return risks
  }

  private identifyBenefits(path: any, context: DecisionContext): string[] {
    const benefits = []

    if (path.frameworks?.includes("Next.js")) {
      benefits.push("SEO optimization", "Server-side rendering", "Excellent performance")
    }

    if (path.styling?.includes("Tailwind")) {
      benefits.push("Rapid UI development", "Consistent design system", "Responsive by default")
    }

    if (context.complexity === "simple") {
      benefits.push("Quick time to market", "Lower development cost", "Easy to maintain")
    }

    return benefits
  }

  private rankDecisionPaths(paths: DecisionPath[], context: DecisionContext): DecisionPath[] {
    return paths.sort((a, b) => {
      // Primary sort by confidence
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence
      }

      // Secondary sort by benefit count
      return b.benefits.length - a.benefits.length
    })
  }

  public getDecisionHistory(): DecisionContext[] {
    return this.contextHistory
  }

  public updateLearningWeights(pathId: string, success: boolean) {
    const currentWeight = this.learningWeights.get(pathId) || 0
    this.learningWeights.set(pathId, currentWeight + (success ? 1 : -0.5))
  }
}

export const advancedDecisionEngine = new AdvancedDecisionEngine()
