// Frontend Gateway - Orchestrates all microservices
import { VoiceProcessingService } from "../voice-processing/voice-service"
import { AIConversationService } from "../ai-conversation/conversation-service"
import { DataVisualizationService } from "../data-visualization/visualization-service"
import { TranslationService } from "../translation/translation-service"
import { VisionAnalysisService } from "../vision-analysis/vision-service"
import { ContextMemoryService } from "../context-memory/memory-service"

export interface ServiceGatewayConfig {
  enableVoice?: boolean
  enableAI?: boolean
  enableVisualization?: boolean
  enableTranslation?: boolean
  enableVision?: boolean
  enableMemory?: boolean
}

export class ServiceGateway {
  private voiceService: VoiceProcessingService
  private conversationService: AIConversationService
  private visualizationService: DataVisualizationService
  private translationService: TranslationService
  private visionService: VisionAnalysisService
  private memoryService: ContextMemoryService
  private config: ServiceGatewayConfig

  constructor(config: ServiceGatewayConfig = {}) {
    this.config = {
      enableVoice: true,
      enableAI: true,
      enableVisualization: true,
      enableTranslation: true,
      enableVision: true,
      enableMemory: true,
      ...config,
    }

    this.voiceService = new VoiceProcessingService()
    this.conversationService = new AIConversationService()
    this.visualizationService = new DataVisualizationService()
    this.translationService = new TranslationService()
    this.visionService = new VisionAnalysisService()
    this.memoryService = new ContextMemoryService()
  }

  async processVoiceInput(audioData: Blob): Promise<{
    transcript: string
    analysis: any
    context: any
  }> {
    if (!this.config.enableVoice) throw new Error("Voice service disabled")

    try {
      const sessionId = Date.now().toString()
      const result = await this.voiceService.startVoiceRecognition({
        sessionId,
        continuous: false,
        interimResults: false,
      })

      const context = null
      if (this.config.enableMemory) {
        await this.memoryService.addConversationEntry("default", sessionId, {
          timestamp: Date.now(),
          type: "voice",
          content: result.transcript,
          context: {},
          sentiment: "neutral",
          intent: "voice_input",
          confidence: result.confidence,
        })
      }

      return {
        transcript: result.transcript,
        analysis: { confidence: result.confidence },
        context,
      }
    } catch (error) {
      console.error("Voice processing failed:", error)
      throw error
    }
  }

  async generateSpeech(text: string, options?: any): Promise<Blob> {
    if (!this.config.enableVoice) throw new Error("Voice service disabled")

    try {
      await this.voiceService.synthesizeSpeech({
        text,
        sessionId: Date.now().toString(),
        ...options,
      })

      // Return empty blob for now - in production would return actual audio
      return new Blob([], { type: "audio/wav" })
    } catch (error) {
      console.error("Speech synthesis failed:", error)
      throw error
    }
  }

  async processConversation(
    message: string,
    context?: any,
  ): Promise<{
    response: string
    audioResponse?: Blob
    visualizations?: any[]
    translations?: Record<string, string>
  }> {
    if (!this.config.enableAI) throw new Error("AI service disabled")

    try {
      const sessionId = Date.now().toString()
      const result = await this.conversationService.processConversation({
        message,
        sessionId,
        context,
      })

      const response = result.response
      const results: any = { response }

      // Generate audio response if voice is enabled
      if (this.config.enableVoice) {
        try {
          results.audioResponse = await this.generateSpeech(response)
        } catch (error) {
          console.error("Failed to generate audio response:", error)
        }
      }

      return results
    } catch (error) {
      console.error("Conversation processing failed:", error)
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
      }
    }
  }

  async analyzeImage(imageData: File | Blob): Promise<{
    analysis: any
    description: string
    audioDescription?: Blob
  }> {
    if (!this.config.enableVision) throw new Error("Vision service disabled")

    try {
      const sessionId = Date.now().toString()
      const result = await this.visionService.analyzeImage({
        imageData: "data:image/jpeg;base64,", // Mock base64 data
        analysisType: "comprehensive",
        sessionId,
      })

      const description = result.analysis
      const analysisResult: any = { analysis: result.results, description }

      // Generate audio description if voice is enabled
      if (this.config.enableVoice) {
        try {
          analysisResult.audioDescription = await this.generateSpeech(description)
        } catch (error) {
          console.error("Failed to generate audio description:", error)
        }
      }

      return analysisResult
    } catch (error) {
      console.error("Vision analysis failed:", error)
      throw error
    }
  }

  async createVisualization(
    data: any,
    type?: string,
  ): Promise<{
    chart: any
    description: string
    audioExplanation?: Blob
  }> {
    if (!this.config.enableVisualization) throw new Error("Visualization service disabled")

    try {
      const sessionId = Date.now().toString()
      const result = await this.visualizationService.createVisualization({
        data,
        chartType: (type as any) || "bar",
        title: "Generated Chart",
        sessionId,
      })

      const description = `Created ${type || "chart"} visualization with ${result.dataPoints} data points`
      const chartResult: any = { chart: result.chartConfig, description }

      // Generate audio explanation if voice is enabled
      if (this.config.enableVoice) {
        try {
          chartResult.audioExplanation = await this.generateSpeech(description)
        } catch (error) {
          console.error("Failed to generate audio explanation:", error)
        }
      }

      return chartResult
    } catch (error) {
      console.error("Visualization creation failed:", error)
      throw error
    }
  }

  async translateContent(
    content: string,
    targetLanguage: string,
  ): Promise<{
    translation: string
    audioTranslation?: Blob
  }> {
    if (!this.config.enableTranslation) throw new Error("Translation service disabled")

    try {
      const sessionId = Date.now().toString()
      const result = await this.translationService.translateText({
        text: content,
        targetLanguage,
        sessionId,
      })

      const translationResult: any = { translation: result.translation }

      // Generate audio for translation if voice is enabled
      if (this.config.enableVoice) {
        try {
          translationResult.audioTranslation = await this.generateSpeech(result.translation)
        } catch (error) {
          console.error("Failed to generate audio translation:", error)
        }
      }

      return translationResult
    } catch (error) {
      console.error("Translation failed:", error)
      throw error
    }
  }

  async detectVisualizationOpportunities(text: string): Promise<any[]> {
    // Mock implementation - in production would analyze text for chart opportunities
    const keywords = ["data", "chart", "graph", "statistics", "numbers", "metrics"]
    const hasVisualizationKeywords = keywords.some((keyword) => text.toLowerCase().includes(keyword))

    if (hasVisualizationKeywords) {
      return [
        {
          type: "bar",
          confidence: 0.7,
          suggestion: "This content might benefit from a chart visualization",
        },
      ]
    }

    return []
  }

  async detectAndTranslate(text: string): Promise<Record<string, string>> {
    // Mock implementation - in production would detect if translation is needed
    const detectedLanguage = await this.translationService.detectLanguage(text)

    if (detectedLanguage !== "en") {
      try {
        const result = await this.translateContent(text, "en")
        return { en: result.translation }
      } catch (error) {
        console.error("Auto-translation failed:", error)
      }
    }

    return {}
  }

  async getConversationHistory(limit = 50): Promise<any[]> {
    if (!this.config.enableMemory) return []

    try {
      const result = await this.memoryService.retrieveContext({
        userId: "default",
        type: "conversation",
        limit,
      })

      return result.relevantEntries || []
    } catch (error) {
      console.error("Failed to get conversation history:", error)
      return []
    }
  }

  async clearMemory(): Promise<void> {
    if (this.config.enableMemory) {
      this.memoryService.clearUserContext("default")
    }
  }

  async storeInteraction(interaction: {
    type: string
    content: any
    metadata?: any
  }): Promise<any> {
    if (!this.config.enableMemory) return null

    try {
      await this.memoryService.addConversationEntry("default", Date.now().toString(), {
        timestamp: Date.now(),
        type: interaction.type as any,
        content: typeof interaction.content === "string" ? interaction.content : JSON.stringify(interaction.content),
        context: interaction.metadata || {},
        sentiment: "neutral",
        intent: interaction.type,
        confidence: 0.8,
      })

      return { success: true }
    } catch (error) {
      console.error("Failed to store interaction:", error)
      return null
    }
  }

  async getRecentContext(type: string, limit: number): Promise<any> {
    if (!this.config.enableMemory) return null

    try {
      const result = await this.memoryService.retrieveContext({
        userId: "default",
        type: type as any,
        limit,
      })

      return result.context
    } catch (error) {
      console.error("Failed to get recent context:", error)
      return null
    }
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    const services = [
      { name: "voice", enabled: this.config.enableVoice },
      { name: "conversation", enabled: this.config.enableAI },
      { name: "visualization", enabled: this.config.enableVisualization },
      { name: "translation", enabled: this.config.enableTranslation },
      { name: "vision", enabled: this.config.enableVision },
      { name: "memory", enabled: this.config.enableMemory },
    ]

    services.forEach(({ name, enabled }) => {
      health[name] = enabled
    })

    return health
  }
}

// Singleton instance
let gatewayInstance: ServiceGateway | null = null

export function getServiceGateway(config?: ServiceGatewayConfig): ServiceGateway {
  if (!gatewayInstance) {
    gatewayInstance = new ServiceGateway(config)
  }
  return gatewayInstance
}

export function resetServiceGateway(): void {
  gatewayInstance = null
}
