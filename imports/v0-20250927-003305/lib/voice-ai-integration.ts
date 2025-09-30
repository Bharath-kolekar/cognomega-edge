import { advancedVoiceEngine, type VoiceResult } from "./advanced-voice-engine"
import type { AIResponse } from "./ai-conversation-engine"
import { contextualMemory } from "./contextual-memory"
import { proactiveAISystem } from "./proactive-ai-system"
import { dualAIEngine } from "./dual-ai-engine"

export interface VoiceAICapabilities {
  realTimeTranscription: boolean
  emotionAwareResponses: boolean
  contextualUnderstanding: boolean
  multilingualSupport: boolean
  voicePersonalization: boolean
  proactiveAssistance: boolean
  codeGenerationViaVoice: boolean
  voiceBasedDebugging: boolean
  automatedBugDiscovery: boolean
  voiceSecurityScanning: boolean
  voicePerformanceAnalysis: boolean
}

export interface VoiceAIResult {
  voiceResult: VoiceResult
  aiResponse: AIResponse
  generatedCode?: string
  voicePersonality: {
    tone: "professional" | "friendly" | "enthusiastic" | "calm"
    speed: number
    pitch: number
    accent: string
  }
  contextualActions: Array<{
    type:
      | "code_generation"
      | "navigation"
      | "explanation"
      | "debugging"
      | "bug_discovery"
      | "auto_fix_bugs"
      | "security_scan"
      | "performance_analysis"
      | "fullstack_app_creation"
      | "report_generation"
      | "system_deployment"
      | "ai_analysis"
      | "advanced_reasoning"
      | "predictive_analysis"
      | "anomaly_detection"
      | "metacognitive_reflection"
      | "quantum_analysis"
      | "emotional_analysis"
      | "psychological_profiling"
      | "codebase_access"
      | "codebase_analysis"
      | "download_fixes"
      | "deploy_fixed_code"
      | "setup_ci_cd"
    payload: any
    confidence: number
  }>
}

export interface VoiceAISettings {
  capabilities: VoiceAICapabilities
  personality: {
    name: string
    tone: "professional" | "friendly" | "enthusiastic" | "calm"
    responseStyle: "concise" | "detailed" | "conversational"
    voiceCharacteristics: {
      speed: number
      pitch: number
      volume: number
    }
  }
  learningPreferences: {
    adaptToUserStyle: boolean
    rememberPreferences: boolean
    improveOverTime: boolean
    personalizedSuggestions: boolean
  }
}

class VoiceAIIntegration {
  private static instance: VoiceAIIntegration
  private settings: VoiceAISettings
  private conversationHistory: Array<{
    input: string
    voiceResult: VoiceResult
    aiResponse: AIResponse
    timestamp: number
  }> = []

  private constructor() {
    this.settings = this.loadSettings()
    this.initializeVoiceAI()
  }

  static getInstance(): VoiceAIIntegration {
    if (!VoiceAIIntegration.instance) {
      VoiceAIIntegration.instance = new VoiceAIIntegration()
    }
    return VoiceAIIntegration.instance
  }

  private loadSettings(): VoiceAISettings {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("voiceAISettings")
      if (stored) {
        return JSON.parse(stored)
      }
    }

    return {
      capabilities: {
        realTimeTranscription: true,
        emotionAwareResponses: true,
        contextualUnderstanding: true,
        multilingualSupport: true,
        voicePersonalization: true,
        proactiveAssistance: true,
        codeGenerationViaVoice: true,
        voiceBasedDebugging: true,
        automatedBugDiscovery: true,
        voiceSecurityScanning: true,
        voicePerformanceAnalysis: true,
      },
      personality: {
        name: "Cognomega AI",
        tone: "friendly",
        responseStyle: "conversational",
        voiceCharacteristics: {
          speed: 1.0,
          pitch: 1.0,
          volume: 0.8,
        },
      },
      learningPreferences: {
        adaptToUserStyle: true,
        rememberPreferences: true,
        improveOverTime: true,
        personalizedSuggestions: true,
      },
    }
  }

  private saveSettings() {
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceAISettings", JSON.stringify(this.settings))
    }
  }

  private initializeVoiceAI() {
    // Set up advanced voice engine with AI integration
    advancedVoiceEngine.setAssistantName(this.settings.personality.name)

    // Initialize proactive AI system for voice interactions
    proactiveAISystem.observeUserBehavior("voice_ai_initialized", {
      capabilities: this.settings.capabilities,
      personality: this.settings.personality.name,
    })
  }

  async processVoiceInput(input: string, context?: any): Promise<VoiceAIResult> {
    try {
      const voiceResult = await advancedVoiceEngine.processVoice(input, {
        enableEmotionDetection: this.settings.capabilities.emotionAwareResponses,
        enableContextualUnderstanding: this.settings.capabilities.contextualUnderstanding,
        multilingualSupport: this.settings.capabilities.multilingualSupport,
        voicePersonalization: this.settings.capabilities.voicePersonalization,
      })

      const aiResponse = await this.generateDualAIResponse(input, voiceResult, context)

      // Generate contextual actions based on voice input
      const actions = await this.generateContextualActions(input, voiceResult, aiResponse)

      const result: VoiceAIResult = {
        voiceResult,
        aiResponse,
        voicePersonality: {
          tone: this.settings.personality.tone,
          speed: this.settings.personality.voiceCharacteristics.speed,
          pitch: this.settings.personality.voiceCharacteristics.pitch,
          accent: "neutral",
        },
        contextualActions: actions,
      }

      // Store conversation history with compression
      this.addToHistory(input, voiceResult, aiResponse)

      return result
    } catch (error) {
      throw new Error("Voice AI processing failed")
    }
  }

  private async generateDualAIResponse(input: string, voiceResult: VoiceResult, context?: any): Promise<AIResponse> {
    try {
      // Determine complexity and urgency for AI routing
      const complexity = this.assessComplexity(input, voiceResult)
      const urgency = this.assessUrgency(input, voiceResult)

      const response = await dualAIEngine.processRequest({
        message: input,
        context: {
          voiceResult,
          conversationHistory: this.conversationHistory.slice(-5),
          userPreferences: this.settings,
          ...context,
        },
        urgency,
        complexity,
      })

      return {
        text: response.response,
        confidence: response.confidence || 0.85,
        intent: this.detectIntent(input),
        entities: this.extractEntities(input),
        sentiment: voiceResult.emotion || "neutral",
        suggestions: this.generateSuggestions(input),
        processingTime: response.processingTime || 150,
        voiceMessage: response.response, // Add voice-specific message
      }
    } catch (error) {
      console.error("Dual AI engine error:", error)
      // Fallback to basic response
      return {
        text: "I understand your request. Let me help you with that.",
        confidence: 0.7,
        intent: this.detectIntent(input),
        entities: this.extractEntities(input),
        sentiment: voiceResult.emotion || "neutral",
        suggestions: this.generateSuggestions(input),
        processingTime: 200,
        voiceMessage: "I understand your request. Let me help you with that.",
      }
    }
  }

  private assessComplexity(input: string, voiceResult: VoiceResult): "low" | "medium" | "high" {
    const complexityIndicators = [
      "analyze",
      "comprehensive",
      "detailed",
      "complex",
      "advanced",
      "multi-step",
      "reasoning",
      "quantum",
      "emotional",
      "psychological",
    ]

    const hasComplexKeywords = complexityIndicators.some((keyword) => input.toLowerCase().includes(keyword))

    if (hasComplexKeywords || input.length > 100) return "high"
    if (input.length > 50 || voiceResult.confidence < 0.8) return "medium"
    return "low"
  }

  private assessUrgency(input: string, voiceResult: VoiceResult): "low" | "normal" | "high" {
    const urgentKeywords = [
      "urgent",
      "immediately",
      "asap",
      "critical",
      "emergency",
      "fix",
      "error",
      "broken",
      "not working",
    ]

    const hasUrgentKeywords = urgentKeywords.some((keyword) => input.toLowerCase().includes(keyword))

    if (hasUrgentKeywords) return "high"
    if (voiceResult.emotion === "frustrated" || voiceResult.emotion === "angry") return "high"
    return "normal"
  }

  private detectIntent(input: string): string {
    const lowerInput = input.toLowerCase()
    if (lowerInput.includes("create") || lowerInput.includes("generate")) return "creation"
    if (lowerInput.includes("analyze") || lowerInput.includes("check")) return "analysis"
    if (lowerInput.includes("translate")) return "translation"
    if (lowerInput.includes("help") || lowerInput.includes("how")) return "assistance"
    if (lowerInput.includes("reason") || lowerInput.includes("think")) return "reasoning"
    if (lowerInput.includes("predict") || lowerInput.includes("forecast")) return "prediction"
    if (lowerInput.includes("quantum") || lowerInput.includes("superposition")) return "quantum"
    if (lowerInput.includes("emotion") || lowerInput.includes("feel")) return "emotional"
    return "general"
  }

  private extractEntities(input: string): Array<{ type: string; value: string; confidence: number }> {
    const entities = []
    const words = input.split(" ")

    // Simple entity extraction
    words.forEach((word) => {
      if (word.includes("@")) entities.push({ type: "email", value: word, confidence: 0.9 })
      if (word.match(/^\d+$/)) entities.push({ type: "number", value: word, confidence: 0.8 })
      if (word.startsWith("http")) entities.push({ type: "url", value: word, confidence: 0.9 })
    })

    return entities
  }

  private generateSuggestions(input: string): string[] {
    const suggestions = [
      "Try asking for code generation",
      "Request data visualization",
      "Ask for translation help",
      "Get analysis insights",
      "Use advanced reasoning",
      "Try quantum analysis",
      "Request emotional analysis",
    ]
    return suggestions.slice(0, 2)
  }

  private async generateContextualActions(input: string, voiceResult: VoiceResult, aiResponse: AIResponse) {
    const actions: VoiceAIResult["contextualActions"] = []

    // Advanced reasoning actions
    if (this.isAdvancedReasoningRequest(input)) {
      actions.push({
        type: "advanced_reasoning",
        payload: {
          query: input,
          context: this.conversationHistory.slice(-3),
          requiresMultiStep: this.requiresMultiStepReasoning(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Predictive analysis actions
    if (this.isPredictiveAnalysisRequest(input)) {
      actions.push({
        type: "predictive_analysis",
        payload: {
          context: { userInput: input, voiceResult },
          timeHorizon: this.extractTimeHorizon(input),
          analysisType: this.extractAnalysisType(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Anomaly detection actions
    if (this.isAnomalyDetectionRequest(input)) {
      actions.push({
        type: "anomaly_detection",
        payload: {
          dataStream: this.conversationHistory,
          threshold: this.extractThreshold(input),
          realTime: this.shouldEnableRealTime(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Metacognitive reflection actions
    if (this.isMetacognitiveRequest(input)) {
      actions.push({
        type: "metacognitive_reflection",
        payload: {
          reflectionType: this.extractReflectionType(input),
          includeKnowledgeGraph: true,
        },
        confidence: voiceResult.confidence,
      })
    }

    // Quantum analysis actions
    if (this.isQuantumAnalysisRequest(input)) {
      actions.push({
        type: "quantum_analysis",
        payload: {
          inputs: [input],
          context: { voiceResult, conversationHistory: this.conversationHistory.slice(-5) },
          quantumStates: this.extractQuantumStates(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Emotional analysis actions
    if (this.isEmotionalAnalysisRequest(input)) {
      actions.push({
        type: "emotional_analysis",
        payload: {
          voiceFeatures: voiceResult,
          context: input,
          analysisDepth: this.extractEmotionalDepth(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Psychological profiling actions
    if (this.isPsychologicalProfilingRequest(input)) {
      actions.push({
        type: "psychological_profiling",
        payload: {
          userId: "current_user",
          interactions: this.conversationHistory.slice(-10),
          profileDepth: this.extractProfileDepth(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Codebase access actions
    if (this.isCodebaseAccessRequest(input)) {
      actions.push({
        type: "codebase_access",
        payload: {
          repositoryUrl: this.extractRepositoryUrl(input),
          permissions: this.extractPermissions(input),
          analysisTypes: this.extractAnalysisTypes(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Codebase analysis actions
    if (this.isCodebaseAnalysisRequest(input)) {
      actions.push({
        type: "codebase_analysis",
        payload: {
          codebaseId: this.extractCodebaseId(input),
          repositoryUrl: this.extractRepositoryUrl(input),
          branch: this.extractBranch(input),
          analysisTypes: this.extractAnalysisTypes(input),
          autoFix: this.shouldAutoFix(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Download fixes actions
    if (this.isDownloadFixesRequest(input)) {
      actions.push({
        type: "download_fixes",
        payload: {
          format: this.extractDownloadFormat(input),
          codebaseId: this.extractCodebaseId(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Deploy fixed code actions
    if (this.isDeployFixedCodeRequest(input)) {
      actions.push({
        type: "deploy_fixed_code",
        payload: {
          platform: this.extractDeploymentPlatform(input),
          environment: this.extractEnvironment(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Setup CI/CD actions
    if (this.isSetupCICDRequest(input)) {
      actions.push({
        type: "setup_ci_cd",
        payload: {
          platform: this.extractCICDPlatform(input),
          features: this.extractCICDFeatures(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Code generation actions
    if (this.isCodeGenerationRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: voiceResult.intent,
          requirements: input,
          confidence: voiceResult.confidence,
        },
        confidence: voiceResult.confidence,
      })
    }

    // Bug discovery actions
    if (this.isBugDiscoveryRequest(input)) {
      actions.push({
        type: "bug_discovery",
        payload: {
          scanType: this.extractScanType(input),
          autoFix: this.shouldAutoFix(input),
          realTime: this.shouldEnableRealTime(input),
          severity: this.extractSeverityFilter(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Auto-fix bugs actions
    if (this.isAutoFixRequest(input)) {
      actions.push({
        type: "auto_fix_bugs",
        payload: {
          severity: this.extractSeverityFilter(input),
          testAfterFix: this.shouldTestAfterFix(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Security scan actions
    if (this.isSecurityScanRequest(input)) {
      actions.push({
        type: "security_scan",
        payload: {
          includeDependencies: this.shouldIncludeDependencies(input),
          severity: this.extractSeverityFilter(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Performance analysis actions
    if (this.isPerformanceAnalysisRequest(input)) {
      actions.push({
        type: "performance_analysis",
        payload: {
          includeMemory: this.shouldIncludeMemoryAnalysis(input),
          includeBundleSize: this.shouldIncludeBundleAnalysis(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Full-stack app creation actions
    if (this.isFullStackAppRequest(input)) {
      actions.push({
        type: "fullstack_app_creation",
        payload: {
          framework: this.extractFramework(input),
          description: input,
          features: this.extractFeatures(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Report generation actions
    if (this.isReportGenerationRequest(input)) {
      actions.push({
        type: "report_generation",
        payload: {
          description: input,
          format: this.extractReportFormat(input),
          includeCharts: this.shouldIncludeCharts(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // System deployment actions
    if (this.isDeploymentRequest(input)) {
      actions.push({
        type: "system_deployment",
        payload: {
          environment: this.extractEnvironment(input),
          autoTest: this.shouldAutoTest(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // AI analysis actions
    if (this.isAIAnalysisRequest(input)) {
      actions.push({
        type: "ai_analysis",
        payload: {
          subject: this.extractAnalysisSubject(input),
          detail_level: this.extractDetailLevel(input),
        },
        confidence: voiceResult.confidence,
      })
    }

    // Visualization generation actions
    if (this.isVisualizationRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: "data_visualization",
          requirements: input,
          confidence: voiceResult.confidence,
          category: "visualization",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Translation actions
    if (this.isTranslationRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: "translation",
          requirements: input,
          confidence: voiceResult.confidence,
          category: "translation",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Vision analysis actions
    if (this.isVisionAnalysisRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: "vision_analysis",
          requirements: input,
          confidence: voiceResult.confidence,
          category: "vision",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Vision-to-code actions
    if (this.isVisionToCodeRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: "vision_code_generation",
          requirements: input,
          confidence: voiceResult.confidence,
          category: "vision_code",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Summarization actions
    if (this.isSummarizationRequest(input)) {
      actions.push({
        type: "code_generation",
        payload: {
          intent: "document_summarization",
          requirements: input,
          confidence: voiceResult.confidence,
          category: "summary",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Navigation actions based on voice commands
    if (voiceResult.intent === "navigation") {
      actions.push({
        type: "navigation",
        payload: {
          target: this.extractNavigationTarget(input),
          method: "voice_command",
        },
        confidence: voiceResult.confidence,
      })
    }

    // Explanation actions for questions
    if (voiceResult.intent === "question") {
      actions.push({
        type: "explanation",
        payload: {
          topic: this.extractQuestionTopic(input),
          detail_level: this.settings.personality.responseStyle,
        },
        confidence: voiceResult.confidence,
      })
    }

    // Debugging actions for error-related queries
    if (this.isDebuggingRequest(input)) {
      actions.push({
        type: "debugging",
        payload: {
          issue: input,
          context: "voice_reported_issue",
        },
        confidence: voiceResult.confidence,
      })
    }

    return actions
  }

  private isAdvancedReasoningRequest(input: string): boolean {
    const reasoningKeywords = [
      "reason",
      "reasoning",
      "think",
      "analyze deeply",
      "step by step",
      "logical analysis",
      "complex reasoning",
      "multi-step",
      "metacognitive",
    ]
    return reasoningKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isPredictiveAnalysisRequest(input: string): boolean {
    const predictiveKeywords = [
      "predict",
      "forecast",
      "future",
      "trend",
      "projection",
      "what will happen",
      "anticipate",
      "foresee",
      "scenario",
    ]
    return predictiveKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isAnomalyDetectionRequest(input: string): boolean {
    const anomalyKeywords = [
      "anomaly",
      "anomalies",
      "unusual",
      "outlier",
      "abnormal",
      "detect anomalies",
      "find anomalies",
      "strange behavior",
    ]
    return anomalyKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isMetacognitiveRequest(input: string): boolean {
    const metacognitiveKeywords = [
      "self-reflection",
      "metacognitive",
      "think about thinking",
      "self-awareness",
      "introspection",
      "self-analysis",
    ]
    return metacognitiveKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isQuantumAnalysisRequest(input: string): boolean {
    const quantumKeywords = [
      "quantum",
      "superposition",
      "entanglement",
      "quantum analysis",
      "quantum computing",
      "quantum intelligence",
      "multi-dimensional",
    ]
    return quantumKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isEmotionalAnalysisRequest(input: string): boolean {
    const emotionalKeywords = [
      "emotion",
      "emotional",
      "feeling",
      "mood",
      "sentiment",
      "empathy",
      "emotional analysis",
      "how do I feel",
    ]
    return emotionalKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isPsychologicalProfilingRequest(input: string): boolean {
    const psychKeywords = [
      "psychological",
      "psychology",
      "personality",
      "profile",
      "cognitive style",
      "behavior pattern",
      "psychological analysis",
    ]
    return psychKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isCodebaseAccessRequest(input: string): boolean {
    const accessKeywords = [
      "access codebase",
      "connect repository",
      "analyze repository",
      "scan my code",
      "access my project",
      "connect to github",
    ]
    return accessKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isCodebaseAnalysisRequest(input: string): boolean {
    const analysisKeywords = [
      "analyze codebase",
      "code analysis",
      "repository analysis",
      "scan repository",
      "comprehensive analysis",
      "code review",
    ]
    return analysisKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isDownloadFixesRequest(input: string): boolean {
    const downloadKeywords = [
      "download fixes",
      "export fixes",
      "get fixes",
      "download patches",
      "save fixes",
      "export patches",
    ]
    return downloadKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isDeployFixedCodeRequest(input: string): boolean {
    const deployKeywords = [
      "deploy fixed",
      "deploy patches",
      "deploy fixes",
      "publish fixed",
      "release fixed",
      "deploy updated",
    ]
    return deployKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isSetupCICDRequest(input: string): boolean {
    const cicdKeywords = [
      "setup ci/cd",
      "configure pipeline",
      "continuous integration",
      "continuous deployment",
      "automated deployment",
      "ci cd pipeline",
    ]
    return cicdKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private requiresMultiStepReasoning(input: string): boolean {
    return input.toLowerCase().includes("step by step") || input.toLowerCase().includes("complex") || input.length > 100
  }

  private extractTimeHorizon(input: string): number {
    const timeMatches = input.match(/(\d+)\s*(day|week|month|year)s?/i)
    if (timeMatches) {
      const value = Number.parseInt(timeMatches[1])
      const unit = timeMatches[2].toLowerCase()
      switch (unit) {
        case "day":
          return value
        case "week":
          return value * 7
        case "month":
          return value * 30
        case "year":
          return value * 365
      }
    }
    return 30 // Default 30 days
  }

  private extractAnalysisType(input: string): string {
    if (input.toLowerCase().includes("behavior")) return "behavioral"
    if (input.toLowerCase().includes("trend")) return "trend"
    if (input.toLowerCase().includes("pattern")) return "pattern"
    return "general"
  }

  private extractThreshold(input: string): number {
    const thresholdMatch = input.match(/threshold\s*(\d+(?:\.\d+)?)/i)
    return thresholdMatch ? Number.parseFloat(thresholdMatch[1]) : 0.8
  }

  private extractReflectionType(input: string): string {
    if (input.toLowerCase().includes("learning")) return "learning"
    if (input.toLowerCase().includes("reasoning")) return "reasoning"
    if (input.toLowerCase().includes("knowledge")) return "knowledge"
    return "general"
  }

  private extractQuantumStates(input: string): number {
    const stateMatch = input.match(/(\d+)\s*states?/i)
    return stateMatch ? Number.parseInt(stateMatch[1]) : 8
  }

  private extractEmotionalDepth(input: string): string {
    if (input.toLowerCase().includes("deep")) return "deep"
    if (input.toLowerCase().includes("surface")) return "surface"
    return "standard"
  }

  private extractProfileDepth(input: string): string {
    if (input.toLowerCase().includes("comprehensive")) return "comprehensive"
    if (input.toLowerCase().includes("basic")) return "basic"
    return "standard"
  }

  private extractRepositoryUrl(input: string): string {
    const urlMatch = input.match(/(https?:\/\/[^\s]+)/i)
    return urlMatch ? urlMatch[1] : ""
  }

  private extractPermissions(input: string): string[] {
    const permissions = ["read"]
    if (input.toLowerCase().includes("write")) permissions.push("write")
    if (input.toLowerCase().includes("analyze")) permissions.push("analyze")
    if (input.toLowerCase().includes("fix")) permissions.push("fix")
    return permissions
  }

  private extractAnalysisTypes(input: string): string[] {
    const types = []
    if (input.toLowerCase().includes("lint")) types.push("lint")
    if (input.toLowerCase().includes("security")) types.push("security")
    if (input.toLowerCase().includes("performance")) types.push("performance")
    if (input.toLowerCase().includes("accessibility")) types.push("accessibility")
    return types.length > 0 ? types : ["lint", "security", "performance"]
  }

  private extractCodebaseId(input: string): string {
    const idMatch = input.match(/codebase[_\s]?id[:\s]*([a-zA-Z0-9_-]+)/i)
    return idMatch ? idMatch[1] : `codebase_${Date.now()}`
  }

  private extractBranch(input: string): string {
    const branchMatch = input.match(/branch[:\s]*([a-zA-Z0-9_/-]+)/i)
    return branchMatch ? branchMatch[1] : "main"
  }

  private extractDownloadFormat(input: string): string {
    if (input.toLowerCase().includes("zip")) return "zip"
    if (input.toLowerCase().includes("tar")) return "tar"
    if (input.toLowerCase().includes("patch")) return "patch"
    return "zip"
  }

  private extractDeploymentPlatform(input: string): string {
    if (input.toLowerCase().includes("vercel")) return "vercel"
    if (input.toLowerCase().includes("netlify")) return "netlify"
    if (input.toLowerCase().includes("aws")) return "aws"
    if (input.toLowerCase().includes("heroku")) return "heroku"
    return "vercel"
  }

  private extractCICDPlatform(input: string): string {
    if (input.toLowerCase().includes("github")) return "github-actions"
    if (input.toLowerCase().includes("gitlab")) return "gitlab-ci"
    if (input.toLowerCase().includes("jenkins")) return "jenkins"
    if (input.toLowerCase().includes("circleci")) return "circleci"
    return "github-actions"
  }

  private extractCICDFeatures(input: string): string[] {
    const features = ["automated-testing", "deployment"]
    if (input.toLowerCase().includes("security")) features.push("security-checks")
    if (input.toLowerCase().includes("bug")) features.push("bug-scanning")
    if (input.toLowerCase().includes("performance")) features.push("performance-testing")
    return features
  }

  // Bug discovery detection methods
  private isBugDiscoveryRequest(input: string): boolean {
    const bugDiscoveryKeywords = [
      "scan for bugs",
      "find bugs",
      "discover bugs",
      "bug discovery",
      "analyze code",
      "check for issues",
      "find problems",
      "code analysis",
      "static analysis",
      "comprehensive scan",
      "quick scan",
      "security scan",
      "performance scan",
    ]
    return bugDiscoveryKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isAutoFixRequest(input: string): boolean {
    const autoFixKeywords = [
      "fix all bugs",
      "auto fix",
      "automatically fix",
      "patch bugs",
      "repair issues",
      "fix issues",
      "apply fixes",
    ]
    return autoFixKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isSecurityScanRequest(input: string): boolean {
    const securityKeywords = [
      "security scan",
      "find vulnerabilities",
      "security issues",
      "security analysis",
      "vulnerability scan",
      "check security",
      "security audit",
    ]
    return securityKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isPerformanceAnalysisRequest(input: string): boolean {
    const performanceKeywords = [
      "performance analysis",
      "performance scan",
      "check performance",
      "analyze performance",
      "performance issues",
      "memory leaks",
      "bundle size",
      "optimization",
    ]
    return performanceKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isFullStackAppRequest(input: string): boolean {
    const fullStackKeywords = [
      "create app",
      "build application",
      "full stack app",
      "create application",
      "build full stack",
      "generate app",
      "make application",
    ]
    return fullStackKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isDeploymentRequest(input: string): boolean {
    const deploymentKeywords = ["deploy", "deployment", "publish", "release", "go live", "production"]
    return deploymentKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isAIAnalysisRequest(input: string): boolean {
    const analysisKeywords = ["analyze", "analysis", "examine", "investigate", "study", "review", "assess"]
    return analysisKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  // Extraction methods for bug discovery parameters
  private extractScanType(input: string): string {
    if (input.toLowerCase().includes("comprehensive")) return "comprehensive"
    if (input.toLowerCase().includes("security")) return "security"
    if (input.toLowerCase().includes("performance")) return "performance"
    if (input.toLowerCase().includes("quick")) return "quick"
    return "comprehensive"
  }

  private shouldAutoFix(input: string): boolean {
    return input.toLowerCase().includes("auto fix") || input.toLowerCase().includes("automatically")
  }

  private shouldEnableRealTime(input: string): boolean {
    return input.toLowerCase().includes("real time") || input.toLowerCase().includes("continuous")
  }

  private extractSeverityFilter(input: string): string {
    if (input.toLowerCase().includes("critical")) return "critical"
    if (input.toLowerCase().includes("high")) return "high"
    if (input.toLowerCase().includes("medium")) return "medium"
    if (input.toLowerCase().includes("low")) return "low"
    return "all"
  }

  private shouldTestAfterFix(input: string): boolean {
    return !input.toLowerCase().includes("no test") && !input.toLowerCase().includes("skip test")
  }

  private shouldIncludeDependencies(input: string): boolean {
    return !input.toLowerCase().includes("no dependencies") && !input.toLowerCase().includes("skip dependencies")
  }

  private shouldIncludeMemoryAnalysis(input: string): boolean {
    return input.toLowerCase().includes("memory") || input.toLowerCase().includes("comprehensive")
  }

  private shouldIncludeBundleAnalysis(input: string): boolean {
    return (
      input.toLowerCase().includes("bundle") ||
      input.toLowerCase().includes("size") ||
      input.toLowerCase().includes("comprehensive")
    )
  }

  private extractFramework(input: string): string {
    if (input.toLowerCase().includes("react")) return "react"
    if (input.toLowerCase().includes("vue")) return "vue"
    if (input.toLowerCase().includes("angular")) return "angular"
    if (input.toLowerCase().includes("svelte")) return "svelte"
    if (input.toLowerCase().includes("next")) return "nextjs"
    return "react"
  }

  private extractFeatures(input: string): string[] {
    const features: string[] = []
    if (input.toLowerCase().includes("auth")) features.push("authentication")
    if (input.toLowerCase().includes("database")) features.push("database")
    if (input.toLowerCase().includes("api")) features.push("api")
    if (input.toLowerCase().includes("dashboard")) features.push("dashboard")
    if (input.toLowerCase().includes("payment")) features.push("payments")
    return features
  }

  private extractReportFormat(input: string): string {
    if (input.toLowerCase().includes("pdf")) return "pdf"
    if (input.toLowerCase().includes("csv")) return "csv"
    if (input.toLowerCase().includes("excel")) return "xlsx"
    return "json"
  }

  private shouldIncludeCharts(input: string): boolean {
    return !input.toLowerCase().includes("no charts") && !input.toLowerCase().includes("text only")
  }

  private extractEnvironment(input: string): string {
    if (input.toLowerCase().includes("staging")) return "staging"
    if (input.toLowerCase().includes("development")) return "development"
    if (input.toLowerCase().includes("test")) return "test"
    return "production"
  }

  private shouldAutoTest(input: string): boolean {
    return !input.toLowerCase().includes("no test") && !input.toLowerCase().includes("skip test")
  }

  private extractAnalysisSubject(input: string): string {
    const patterns = [
      { pattern: /analyze ([^.!?]+)/i, group: 1 },
      { pattern: /analysis of ([^.!?]+)/i, group: 1 },
      { pattern: /examine ([^.!?]+)/i, group: 1 },
    ]

    for (const { pattern, group } of patterns) {
      const match = input.match(pattern)
      if (match && match[group]) {
        return match[group].trim()
      }
    }

    return "general analysis"
  }

  private extractDetailLevel(input: string): string {
    if (input.toLowerCase().includes("detailed")) return "detailed"
    if (input.toLowerCase().includes("brief")) return "brief"
    if (input.toLowerCase().includes("comprehensive")) return "comprehensive"
    return "standard"
  }

  private isCodeGenerationRequest(input: string): boolean {
    const codeKeywords = [
      "create",
      "build",
      "make",
      "generate",
      "code",
      "component",
      "function",
      "class",
      "interface",
      "api",
      "database",
      "form",
      "page",
      "website",
      "app",
      "application",
      "chart",
      "graph",
      "dashboard",
      "visualization",
      "translate",
      "analyze image",
      "analyze design",
      "generate from image",
      "create report",
      "summarize",
      "extract insights",
    ]

    return codeKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isVisualizationRequest(input: string): boolean {
    const vizKeywords = [
      "chart",
      "graph",
      "dashboard",
      "plot",
      "diagram",
      "visualization",
      "bar chart",
      "line chart",
      "pie chart",
      "scatter plot",
      "heatmap",
    ]
    return vizKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isTranslationRequest(input: string): boolean {
    const translationKeywords = [
      "translate",
      "translation",
      "i18n",
      "localization",
      "language",
      "spanish",
      "french",
      "german",
      "chinese",
      "japanese",
      "multilingual",
    ]
    return translationKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isVisionAnalysisRequest(input: string): boolean {
    const visionKeywords = [
      "analyze image",
      "analyze photo",
      "analyze design",
      "extract text",
      "describe image",
      "what's in this image",
      "analyze visual",
      "image analysis",
      "design analysis",
      "color analysis",
      "ui analysis",
    ]
    return visionKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isVisionToCodeRequest(input: string): boolean {
    const visionCodeKeywords = [
      "generate code from image",
      "create component from design",
      "build from mockup",
      "code from screenshot",
      "implement this design",
      "recreate this ui",
    ]
    return visionCodeKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isReportGenerationRequest(input: string): boolean {
    const reportKeywords = [
      "generate report",
      "create report",
      "build documentation",
      "write summary",
      "create analysis",
      "generate documentation",
      "project report",
      "status report",
    ]
    return reportKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private isSummarizationRequest(input: string): boolean {
    const summaryKeywords = [
      "summarize",
      "summary",
      "key points",
      "extract insights",
      "main points",
      "tldr",
      "brief overview",
      "executive summary",
      "condense",
    ]
    return summaryKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private extractNavigationTarget(input: string): string {
    const navigationPatterns = [
      { pattern: /go to ([\w\s]+)/i, group: 1 },
      { pattern: /show me ([\w\s]+)/i, group: 1 },
      { pattern: /navigate to ([\w\s]+)/i, group: 1 },
      { pattern: /open ([\w\s]+)/i, group: 1 },
    ]

    for (const { pattern, group } of navigationPatterns) {
      const match = input.match(pattern)
      if (match && match[group]) {
        return match[group].trim()
      }
    }

    return "home"
  }

  private extractQuestionTopic(input: string): string {
    const questionPatterns = [
      { pattern: /what is ([\w\s]+)/i, group: 1 },
      { pattern: /how do I ([\w\s]+)/i, group: 1 },
      { pattern: /explain ([\w\s]+)/i, group: 1 },
      { pattern: /tell me about ([\w\s]+)/i, group: 1 },
    ]

    for (const { pattern, group } of questionPatterns) {
      const match = input.match(pattern)
      if (match && match[group]) {
        return match[group].trim()
      }
    }

    return "general_help"
  }

  private async generateCodeFromVoice(input: string, voiceResult: VoiceResult): Promise<string> {
    let codePrompt = `Generate code based on voice input: "${input}"`
    let category = "general"

    // Determine the specific category for enhanced code generation
    if (this.isVisualizationRequest(input)) {
      category = "visualization"
      codePrompt +=
        "\n\nFocus on creating interactive data visualizations with proper accessibility and responsive design."
    } else if (this.isTranslationRequest(input)) {
      category = "translation"
      codePrompt += "\n\nFocus on i18n implementation with proper locale handling and cultural considerations."
    } else if (this.isVisionAnalysisRequest(input)) {
      category = "vision"
      codePrompt += "\n\nFocus on image analysis capabilities with proper error handling and accessibility features."
    } else if (this.isVisionToCodeRequest(input)) {
      category = "vision_code"
      codePrompt += "\n\nFocus on generating pixel-perfect code that matches the visual design exactly."
    } else if (this.isReportGenerationRequest(input)) {
      category = "report"
      codePrompt += "\n\nFocus on creating comprehensive, well-structured reports with proper formatting."
    } else if (this.isSummarizationRequest(input)) {
      category = "summary"
      codePrompt += "\n\nFocus on extracting key insights and creating concise, actionable summaries."
    }

    // Store the voice-to-code request in contextual memory
    contextualMemory.addMemory(
      "voice_code_generation",
      {
        input,
        category,
        voiceCharacteristics: voiceResult,
        timestamp: Date.now(),
      },
      0.9,
      ["voice", "code_generation", "ai_assisted", category],
    )

    return `// Code generated from voice input: "${input}"
// Category: ${category}
// This would be replaced with actual generated code for ${category} functionality`
  }

  private determineVoicePersonality(voiceResult: VoiceResult): VoiceAIResult["voicePersonality"] {
    let tone = this.settings.personality.tone
    let speed = this.settings.personality.voiceCharacteristics.speed
    let pitch = this.settings.personality.voiceCharacteristics.pitch

    // Adapt based on detected emotion
    if (this.settings.capabilities.emotionAwareResponses && voiceResult.emotion) {
      switch (voiceResult.emotion) {
        case "excited":
          tone = "enthusiastic"
          speed = 1.1
          pitch = 1.1
          break
        case "frustrated":
          tone = "calm"
          speed = 0.9
          pitch = 0.9
          break
        case "confused":
          tone = "professional"
          speed = 0.8
          pitch = 1.0
          break
        default:
          // Keep default settings
          break
      }
    }

    return {
      tone,
      speed,
      pitch,
      accent: voiceResult.accent || "neutral",
    }
  }

  private async learnFromInteraction(result: VoiceAIResult) {
    // Store successful patterns
    if (result.voiceResult.confidence > 0.8) {
      contextualMemory.addMemory(
        "successful_voice_interaction",
        {
          transcript: result.voiceResult.transcript,
          intent: result.voiceResult.intent,
          emotion: result.voiceResult.emotion,
          response_quality: result.aiResponse.confidence,
        },
        result.voiceResult.confidence,
        ["learning", "voice_ai", "successful_pattern"],
      )
    }

    // Update proactive AI system
    proactiveAISystem.observeUserBehavior("voice_ai_interaction", {
      intent: result.voiceResult.intent,
      emotion: result.voiceResult.emotion,
      confidence: result.voiceResult.confidence,
      actions_taken: result.contextualActions.length,
    })
  }

  // Public methods for configuration
  updateSettings(newSettings: Partial<VoiceAISettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    this.initializeVoiceAI()
  }

  getSettings(): VoiceAISettings {
    return { ...this.settings }
  }

  getConversationHistory(limit = 10) {
    return this.conversationHistory.slice(-limit)
  }

  clearConversationHistory() {
    this.conversationHistory = []
  }

  // Voice-specific AI capabilities
  async generateVoiceResponse(text: string, personality: VoiceAIResult["voicePersonality"]): Promise<void> {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = personality.speed
      utterance.pitch = personality.pitch
      utterance.volume = this.settings.personality.voiceCharacteristics.volume

      // Try to find a voice that matches the accent
      const voices = speechSynthesis.getVoices()
      const matchingVoice = voices.find(
        (voice) =>
          voice.lang.toLowerCase().includes(personality.accent) ||
          voice.name.toLowerCase().includes(personality.accent),
      )

      if (matchingVoice) {
        utterance.voice = matchingVoice
      }

      speechSynthesis.speak(utterance)
    }
  }

  async enableProactiveVoiceAssistance() {
    if (!this.settings.capabilities.proactiveAssistance) return

    // Set up proactive voice suggestions based on user behavior
    const recentMemories = contextualMemory.getRecentMemories(10)
    const suggestions = await this.generateProactiveSuggestions(recentMemories)

    if (suggestions.length > 0) {
      const suggestion = suggestions[0]
      await this.generateVoiceResponse(
        `I noticed you might be interested in ${suggestion}. Would you like me to help with that?`,
        this.determineVoicePersonality({ confidence: 0.8 } as VoiceResult),
      )
    }
  }

  private async generateProactiveSuggestions(memories: any[]): Promise<string[]> {
    const suggestions: string[] = []

    // Analyze patterns in user behavior
    const codeGenerationCount = memories.filter((m) => m.tags.includes("code_generation")).length
    const voiceInteractionCount = memories.filter((m) => m.tags.includes("voice")).length
    const visualizationCount = memories.filter((m) => m.tags.includes("visualization")).length
    const translationCount = memories.filter((m) => m.tags.includes("translation")).length
    const visionCount = memories.filter((m) => m.tags.includes("vision")).length
    const reportCount = memories.filter((m) => m.tags.includes("report")).length
    const bugDiscoveryCount = memories.filter((m) => m.tags.includes("bug_discovery")).length

    if (codeGenerationCount > 3 && voiceInteractionCount < 2) {
      suggestions.push("trying voice commands for faster code generation")
    }

    if (voiceInteractionCount > 5) {
      suggestions.push("exploring advanced voice features like multi-language support")
    }

    // New proactive suggestions for enhanced features
    if (visualizationCount > 2 && voiceInteractionCount > 0) {
      suggestions.push("using voice commands to create charts and dashboards more efficiently")
    }

    if (translationCount > 1) {
      suggestions.push("setting up voice-controlled i18n workflows for faster localization")
    }

    if (visionCount > 1) {
      suggestions.push("using voice commands to analyze designs and generate code from images")
    }

    if (reportCount > 2) {
      suggestions.push("automating report generation with voice-triggered workflows")
    }

    if (codeGenerationCount > 5 && visualizationCount === 0) {
      suggestions.push("exploring data visualization features to enhance your applications")
    }

    // Bug discovery proactive suggestions
    if (codeGenerationCount > 3 && bugDiscoveryCount === 0) {
      suggestions.push("using automated bug discovery to ensure code quality")
    }

    if (bugDiscoveryCount > 2) {
      suggestions.push("setting up real-time monitoring for continuous bug detection")
    }

    return suggestions
  }

  private isDebuggingRequest(input: string): boolean {
    const debugKeywords = ["debug", "error", "issue", "problem", "fix", "troubleshoot", "not working", "broken"]
    return debugKeywords.some((keyword) => input.toLowerCase().includes(keyword))
  }

  private addToHistory(input: string, voiceResult: VoiceResult, aiResponse: AIResponse): void {
    const compressedEntry = {
      input: input.slice(0, 200), // Limit input length
      voiceResult: {
        transcript: voiceResult.transcript?.slice(0, 100),
        confidence: voiceResult.confidence,
        emotion: voiceResult.emotion,
      },
      aiResponse: {
        text: aiResponse.text?.slice(0, 300),
        confidence: aiResponse.confidence,
        intent: aiResponse.intent,
      },
      timestamp: Date.now(),
    }

    this.conversationHistory.push(compressedEntry)

    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-25)
    }

    if (typeof window !== "undefined") {
      try {
        const compressed = JSON.stringify(this.conversationHistory.slice(-10)) // Only store last 10
        localStorage.setItem("voiceAIHistory", compressed)
      } catch (error) {
        // Storage failed, clear old data
        localStorage.removeItem("voiceAIHistory")
      }
    }
  }
}

export const voiceAIIntegration = VoiceAIIntegration.getInstance()

// Utility functions
export async function processVoiceWithAI(transcript: string): Promise<VoiceAIResult> {
  return await voiceAIIntegration.processVoiceInput(transcript)
}

export function updateVoiceAISettings(settings: Partial<VoiceAISettings>) {
  voiceAIIntegration.updateSettings(settings)
}

export function getVoiceAISettings(): VoiceAISettings {
  return voiceAIIntegration.getSettings()
}

export async function processUnifiedVoiceCommand(
  transcript: string,
  context?: {
    currentPage?: string
    userPreferences?: any
    sessionData?: any
  },
): Promise<VoiceAIResult> {
  const integration = VoiceAIIntegration.getInstance()

  // Enhanced processing with context
  const result = await integration.processVoiceInput(transcript)

  // Add context-specific actions
  if (context?.currentPage) {
    result.contextualActions.push({
      type: "navigation",
      payload: {
        currentPage: context.currentPage,
        suggestedActions: ["scroll", "navigate", "interact"],
      },
      confidence: 0.8,
    })
  }

  // Store unified command in memory
  contextualMemory.addMemory(
    "unified_voice_command",
    {
      transcript,
      result,
      context,
      timestamp: Date.now(),
    },
    result.voiceResult.confidence,
    ["unified", "voice", "ai_assistant"],
  )

  return result
}

export function coordinateVoiceFeatures(activeFeatures: string[]) {
  const integration = VoiceAIIntegration.getInstance()
  const settings = integration.getSettings()

  // Enable/disable capabilities based on active features
  const updatedCapabilities = { ...settings.capabilities }

  activeFeatures.forEach((feature) => {
    switch (feature) {
      case "continuous-listening":
        updatedCapabilities.realTimeTranscription = true
        break
      case "multi-language":
        updatedCapabilities.multilingualSupport = true
        break
      case "code-generation":
        updatedCapabilities.codeGenerationViaVoice = true
        break
      case "voice-navigation":
        updatedCapabilities.contextualUnderstanding = true
        break
    }
  })

  integration.updateSettings({ capabilities: updatedCapabilities })

  // Notify proactive AI system
  proactiveAISystem.observeUserBehavior("voice_features_coordinated", {
    activeFeatures,
    capabilitiesEnabled: Object.keys(updatedCapabilities).filter((key) => updatedCapabilities[key]).length,
  })
}
