"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Zap, DollarSign, Activity, RefreshCw } from "lucide-react"

interface UsageStats {
  dailyUsage: number
  dailyLimit: number
  remainingTokens: number
  utilizationPercent: number
  totalCost: number
  providerBreakdown: {
    groq: { requests: number; tokens: number; cost: number }
    fireworks: { requests: number; tokens: number; cost: number }
    free: { requests: number; tokens: number; cost: number }
  }
}

export function AIUsageDashboard() {
  const [stats, setStats] = useState<UsageStats>({
    dailyUsage: 0,
    dailyLimit: 100000,
    remainingTokens: 100000,
    utilizationPercent: 0,
    totalCost: 0,
    providerBreakdown: {
      groq: { requests: 0, tokens: 0, cost: 0 },
      fireworks: { requests: 0, tokens: 0, cost: 0 },
      free: { requests: 0, tokens: 0, cost: 0 },
    },
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchUsageStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-usage-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch usage stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsageStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getUtilizationColor = (percent: number) => {
    if (percent < 50) return "text-green-600"
    if (percent < 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case "groq":
        return "bg-blue-100 text-blue-800"
      case "fireworks":
        return "bg-orange-100 text-orange-800"
      case "free":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Daily Usage Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Token Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dailyUsage.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">of {stats.dailyLimit.toLocaleString()} limit</p>
          <Progress value={stats.utilizationPercent} className="mt-2" />
          <p className={`text-xs mt-1 ${getUtilizationColor(stats.utilizationPercent)}`}>
            {stats.utilizationPercent.toFixed(1)}% utilized
          </p>
        </CardContent>
      </Card>

      {/* Cost Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalCost < 0.01 ? "Mostly free tier" : "Paid usage active"}
          </p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {stats.totalCost < 0.01 ? "99%+ savings" : `$${(stats.totalCost * 30).toFixed(2)}/month est.`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Tokens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Tokens</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.remainingTokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.remainingTokens > 50000 ? "Plenty available" : "Consider upgrading"}
          </p>
          <div className="mt-2">
            <Badge variant={stats.remainingTokens > 50000 ? "default" : "destructive"} className="text-xs">
              {Math.floor(stats.remainingTokens / 100)} conversations left
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Provider Usage</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={fetchUsageStats} disabled={isLoading}>
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.providerBreakdown).map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between">
                <Badge className={`text-xs ${getProviderBadgeColor(provider)}`}>{provider.toUpperCase()}</Badge>
                <div className="text-right">
                  <div className="text-sm font-medium">{data.requests}</div>
                  <div className="text-xs text-muted-foreground">
                    {data.tokens > 0 ? `${data.tokens.toLocaleString()} tokens` : "No usage"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
