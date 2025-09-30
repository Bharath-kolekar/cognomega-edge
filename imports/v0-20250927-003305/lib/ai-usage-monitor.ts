import { dualAIEngine } from "./dual-ai-engine"

export class AIUsageMonitor {
  static getDetailedStats() {
    const stats = dualAIEngine.getUsageStats()

    return {
      ...stats,
      costEstimate: this.calculateDailyCost(stats.dailyUsage),
      recommendedProvider: this.getProviderRecommendation(stats),
      status: this.getUsageStatus(stats.utilizationPercent),
    }
  }

  private static calculateDailyCost(tokens: number): number {
    // Estimate based on average provider costs
    return (tokens * 0.08) / 1000000 // Average of Groq and Fireworks pricing
  }

  private static getProviderRecommendation(stats: any): string {
    if (stats.utilizationPercent > 80) {
      return "Consider using free alternatives for simple queries"
    } else if (stats.utilizationPercent > 50) {
      return "Optimal usage - continue with smart routing"
    } else {
      return "Low usage - safe to use premium providers"
    }
  }

  private static getUsageStatus(utilizationPercent: number): "low" | "medium" | "high" | "critical" {
    if (utilizationPercent < 25) return "low"
    if (utilizationPercent < 60) return "medium"
    if (utilizationPercent < 90) return "high"
    return "critical"
  }

  static async logUsage(provider: string, tokens: number, cost: number, latency: number) {
    // Log usage for analytics (could be sent to analytics service)
    console.log(`[AI Usage] Provider: ${provider}, Tokens: ${tokens}, Cost: $${cost.toFixed(6)}, Latency: ${latency}ms`)
  }
}
