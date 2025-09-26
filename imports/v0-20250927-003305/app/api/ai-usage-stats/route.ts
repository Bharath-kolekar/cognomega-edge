import { dualAIEngine } from "@/lib/dual-ai-engine"

export async function GET() {
  try {
    const stats = dualAIEngine.getUsageStats()

    // Mock provider breakdown for demonstration
    const providerBreakdown = {
      groq: { requests: 45, tokens: 12500, cost: 0.0008 },
      fireworks: { requests: 23, tokens: 8200, cost: 0.0012 },
      free: { requests: 156, tokens: 0, cost: 0 },
    }

    const totalCost = Object.values(providerBreakdown).reduce((sum, provider) => sum + provider.cost, 0)

    return Response.json({
      ...stats,
      totalCost,
      providerBreakdown,
    })
  } catch (error) {
    return Response.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
