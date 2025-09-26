"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { costOptimizationEngine, type CostMetrics, type OptimizationRule } from "@/lib/cost-optimization-engine"

export function CostOptimizationDashboard() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null)
  const [costEstimate, setCostEstimate] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<OptimizationRule[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  useEffect(() => {
    const updateData = () => {
      setMetrics(costOptimizationEngine.getMetrics())
      setCostEstimate(costOptimizationEngine.getCostEstimate())
      setRecommendations(costOptimizationEngine.getOptimizationRecommendations())
    }

    updateData()
    const interval = setInterval(updateData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleOptimizeAll = async () => {
    setIsOptimizing(true)
    try {
      await costOptimizationEngine.implementAllOptimizations()
      // Refresh data after optimization
      setMetrics(costOptimizationEngine.getMetrics())
      setRecommendations(costOptimizationEngine.getOptimizationRecommendations())
    } catch (error) {
      console.error("Optimization failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!metrics || !costEstimate) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading cost optimization data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Optimization Dashboard</h2>
          <p className="text-muted-foreground">Monitor and optimize resource usage across your application</p>
        </div>
        <Button
          onClick={handleOptimizeAll}
          disabled={isOptimizing || recommendations.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isOptimizing ? "Optimizing..." : `Optimize All (${recommendations.length})`}
        </Button>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${costEstimate.monthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Projected monthly spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.apiCalls.total}</div>
            <p className="text-xs text-muted-foreground">${metrics.apiCalls.cost.toFixed(4)} cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(metrics.storage.localStorage)}</div>
            <p className="text-xs text-muted-foreground">Local storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(metrics.storage.memory)}</div>
            <p className="text-xs text-muted-foreground">JS heap size</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Current resource consumption levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Calls</span>
                    <span>{metrics.apiCalls.total}/1000</span>
                  </div>
                  <Progress value={(metrics.apiCalls.total / 1000) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage</span>
                    <span>{formatBytes(metrics.storage.localStorage)}</span>
                  </div>
                  <Progress value={(metrics.storage.localStorage / (50 * 1024 * 1024)) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Network Requests</span>
                    <span>{metrics.network.requests}/1000</span>
                  </div>
                  <Progress value={(metrics.network.requests / 1000) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Status</CardTitle>
                <CardDescription>Active optimizations and potential savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Optimizations</span>
                    <Badge variant="outline">
                      {costOptimizationEngine.getOptimizationRecommendations().length} pending
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Potential Monthly Savings</span>
                    <span className="font-semibold text-green-600">
                      ${recommendations.reduce((sum, r) => sum + r.costImpact, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Leaks Detected</span>
                    <Badge variant={metrics.performance.memoryLeaks > 5 ? "destructive" : "outline"}>
                      {metrics.performance.memoryLeaks}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>Implement these optimizations to reduce costs and improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  🎉 All optimizations are active! Your application is fully optimized.
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <div key={recommendation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{recommendation.name}</h4>
                            <Badge variant={getSeverityColor(recommendation.severity) as any}>
                              {recommendation.severity}
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              ${recommendation.costImpact}/month savings
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{recommendation.description}</p>
                          <div className="text-xs text-muted-foreground">Category: {recommendation.category}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total API Calls:</span>
                  <span className="font-mono">{metrics.apiCalls.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>OpenAI Calls:</span>
                  <span className="font-mono">{metrics.apiCalls.openai}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Cost:</span>
                  <span className="font-mono">${metrics.apiCalls.cost.toFixed(4)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>localStorage:</span>
                  <span className="font-mono">{formatBytes(metrics.storage.localStorage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span className="font-mono">{formatBytes(metrics.storage.memory)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Size:</span>
                  <span className="font-mono">{formatBytes(metrics.storage.cacheSize)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Render Time:</span>
                  <span className="font-mono">{metrics.performance.renderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Leaks:</span>
                  <span className="font-mono">{metrics.performance.memoryLeaks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unoptimized Ops:</span>
                  <span className="font-mono">{metrics.performance.unoptimizedOperations}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span className="font-mono">{metrics.network.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Transfer:</span>
                  <span className="font-mono">{formatBytes(metrics.network.dataTransfer)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Redundant Calls:</span>
                  <span className="font-mono">{metrics.network.redundantCalls}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of estimated monthly costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">API Costs</span>
                  <span className="font-mono">${costEstimate.breakdown.api.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Storage Costs</span>
                  <span className="font-mono">${costEstimate.breakdown.storage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Compute Costs</span>
                  <span className="font-mono">${costEstimate.breakdown.compute.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Monthly Estimate</span>
                    <span className="font-mono text-green-600">${costEstimate.monthly.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
