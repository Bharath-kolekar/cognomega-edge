interface AIConfig {
  useGroq: boolean
  fallbackToFree: boolean
  dailyTokenLimit: number
  currentUsage: number
}

class SmartAIRouter {
  private config: AIConfig = {
    useGroq: true,
    fallbackToFree: true,
    dailyTokenLimit: 100000, // Conservative limit
    currentUsage: 0,
  }

  async generateResponse(prompt: string): Promise<string> {
    // Check if we should use Groq
    if (this.shouldUseGroq(prompt)) {
      try {
        const response = await this.callGroqAPI(prompt)
        this.trackUsage(response.usage.total_tokens)
        return response.content
      } catch (error) {
        console.log("[v0] Groq failed, falling back to free alternative:", error)
        return this.freeAlternativeResponse(prompt)
      }
    }

    // Use free alternative
    return this.freeAlternativeResponse(prompt)
  }

  private shouldUseGroq(prompt: string): boolean {
    // Use Groq for complex queries, free alternatives for simple ones
    const complexity = this.assessComplexity(prompt)
    const withinLimits = this.config.currentUsage < this.config.dailyTokenLimit

    return this.config.useGroq && complexity > 0.6 && withinLimits
  }

  private assessComplexity(prompt: string): number {
    // Simple complexity scoring
    const indicators = [
      /code|programming|function|algorithm/i,
      /explain|analyze|compare|evaluate/i,
      /creative|story|poem|essay/i,
      /complex|detailed|comprehensive/i,
    ]

    const matches = indicators.filter((regex) => regex.test(prompt)).length
    return matches / indicators.length
  }

  private async callGroqAPI(prompt: string): Promise<any> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    return response.json()
  }

  private freeAlternativeResponse(prompt: string): string {
    // Fallback to our existing free alternatives
    return this.generateRuleBasedResponse(prompt)
  }

  private generateRuleBasedResponse(prompt: string): string {
    // Our existing free alternative logic
    const patterns = [
      { pattern: /hello|hi|hey/i, response: "Hello! How can I help you today?" },
      { pattern: /code|programming/i, response: "I can help with coding questions using templates and patterns." },
      { pattern: /explain|what is/i, response: "Let me provide a structured explanation based on common patterns." },
    ]

    for (const { pattern, response } of patterns) {
      if (pattern.test(prompt)) {
        return response
      }
    }

    return "I understand your request. Let me provide a helpful response using available resources."
  }

  private trackUsage(tokens: number): void {
    this.config.currentUsage += tokens
    // Reset daily usage (implement proper date tracking)
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      this.config.currentUsage = 0
    }
  }
}

export const aiRouter = new SmartAIRouter()
