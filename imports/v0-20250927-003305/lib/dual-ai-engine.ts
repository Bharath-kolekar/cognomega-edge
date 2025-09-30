import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"
import { FreeAIAlternatives } from "./free-ai-alternatives"

// Initialize AI providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const fireworks = createOpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
})

interface AIResponse {
  text: string
  provider: "groq" | "fireworks" | "free"
  tokens: number
  latency: number
  cost: number
}

interface AIConfig {
  dailyTokenLimit: number
  currentUsage: number
  lastResetDate: string
  preferredProvider: "groq" | "fireworks" | "auto"
  fallbackEnabled: boolean
}

class DualAIEngine {
  private config: AIConfig = {
    dailyTokenLimit: 100000, // Conservative limit for free tier
    currentUsage: 0,
    lastResetDate: new Date().toDateString(),
    preferredProvider: "auto",
    fallbackEnabled: true,
  }

  async generateResponse(
    prompt: string,
    options?: {
      maxTokens?: number
      temperature?: number
      urgency?: "low" | "medium" | "high"
      complexity?: "simple" | "medium" | "complex"
    },
  ): Promise<AIResponse> {
    const startTime = Date.now()

    // Reset daily usage if needed
    this.resetDailyUsageIfNeeded()

    // Determine best provider based on requirements
    const provider = this.selectOptimalProvider(prompt, options)

    try {
      let response: AIResponse

      switch (provider) {
        case "groq":
          response = await this.callGroqAPI(prompt, options)
          break
        case "fireworks":
          response = await this.callFireworksAPI(prompt, options)
          break
        default:
          response = await this.callFreeAlternative(prompt, options)
      }

      response.latency = Date.now() - startTime
      this.trackUsage(response.tokens)

      return response
    } catch (error) {
      console.log(`[v0] ${provider} failed, attempting fallback:`, error)

      if (this.config.fallbackEnabled && provider !== "free") {
        return this.callFreeAlternative(prompt, options)
      }

      throw error
    }
  }

  private selectOptimalProvider(prompt: string, options?: any): "groq" | "fireworks" | "free" {
    const complexity = this.assessComplexity(prompt)
    const urgency = options?.urgency || "medium"
    const withinLimits = this.config.currentUsage < this.config.dailyTokenLimit

    // If over daily limits, use free alternative
    if (!withinLimits) {
      return "free"
    }

    // High urgency = Fireworks (fastest at 40ms)
    if (urgency === "high") {
      return "fireworks"
    }

    // Low complexity = Groq (cheapest)
    if (complexity < 0.4) {
      return "groq"
    }

    // Medium/High complexity = Fireworks (better performance)
    if (complexity > 0.6) {
      return "fireworks"
    }

    // Default to Groq for best cost/performance
    return "groq"
  }

  private assessComplexity(prompt: string): number {
    const complexityIndicators = [
      /code|programming|function|algorithm|debug/i,
      /explain|analyze|compare|evaluate|assess/i,
      /creative|story|poem|essay|write/i,
      /complex|detailed|comprehensive|thorough/i,
      /translate|language|multilingual/i,
      /data|chart|visualization|analysis/i,
      /image|vision|photo|picture|visual/i,
    ]

    const matches = complexityIndicators.filter((regex) => regex.test(prompt)).length
    const lengthFactor = Math.min(prompt.length / 500, 1) // Longer prompts = more complex

    return (matches / complexityIndicators.length) * 0.7 + lengthFactor * 0.3
  }

  private async callGroqAPI(prompt: string, options?: any): Promise<AIResponse> {
    const { text, usage } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    })

    return {
      text,
      provider: "groq",
      tokens: usage?.totalTokens || 0,
      latency: 0, // Will be set by caller
      cost: this.calculateGroqCost(usage?.totalTokens || 0),
    }
  }

  private async callFireworksAPI(prompt: string, options?: any): Promise<AIResponse> {
    const { text, usage } = await generateText({
      model: fireworks("accounts/fireworks/models/llama-v3p1-8b-instruct"),
      prompt,
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    })

    return {
      text,
      provider: "fireworks",
      tokens: usage?.totalTokens || 0,
      latency: 0, // Will be set by caller
      cost: this.calculateFireworksCost(usage?.totalTokens || 0),
    }
  }

  private async callFreeAlternative(prompt: string, options?: any): Promise<AIResponse> {
    const response = await FreeAIAlternatives.generateText(prompt, {
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    })

    return {
      text: response.text,
      provider: "free",
      tokens: 0, // Free alternative doesn't count tokens
      latency: 0, // Will be set by caller
      cost: 0,
    }
  }

  private calculateGroqCost(tokens: number): number {
    // Groq pricing: $0.05 input + $0.08 output per 1M tokens
    // Assuming 50/50 split for estimation
    return (tokens * 0.065) / 1000000
  }

  private calculateFireworksCost(tokens: number): number {
    // Fireworks pricing: ~$0.15 per 1M tokens (estimated)
    return (tokens * 0.15) / 1000000
  }

  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toDateString()
    if (this.config.lastResetDate !== today) {
      this.config.currentUsage = 0
      this.config.lastResetDate = today
    }
  }

  private trackUsage(tokens: number): void {
    this.config.currentUsage += tokens
  }

  // Public methods for monitoring
  getUsageStats() {
    return {
      dailyUsage: this.config.currentUsage,
      dailyLimit: this.config.dailyTokenLimit,
      remainingTokens: this.config.dailyTokenLimit - this.config.currentUsage,
      utilizationPercent: (this.config.currentUsage / this.config.dailyTokenLimit) * 100,
    }
  }

  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

export const dualAIEngine = new DualAIEngine()
