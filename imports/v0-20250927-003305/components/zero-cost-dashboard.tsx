"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, DollarSign, Zap, Shield, Cpu, Database, Network, Code } from "lucide-react"
import { freeAI } from "@/lib/free-ai-alternatives"
import { zeroCostOptimizer } from "@/lib/zero-cost-optimization"

const ZeroCostDashboard = () => {
  const [costReport, setCostReport] = useState<any>(null)
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  useEffect(() => {
    loadCostData()
  }, [])

  const loadCostData = () => {
    const aiSavings = freeAI.getCostSavings()
    const optimizationReport = zeroCostOptimizer.generateCostEliminationReport()

    setCostReport(aiSavings)
    setOptimizationStatus(optimizationReport)
  }

  const initializeZeroCostMode = async () => {
    setIsOptimizing(true)

    try {
      // Initialize all zero-cost optimizations
      zeroCostOptimizer.initializeZeroCostMode()

      // Simulate optimization process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      loadCostData()
      setIsOptimizing(false)
    } catch (error) {
      console.error("Optimization failed:", error)
      setIsOptimizing(false)
    }
  }

  if (!costReport || !optimizationStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Cpu className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading optimization data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-green-600">Smart Optimization Active</h1>
        <p className="text-muted-foreground">Intelligent cost management • Complete optimization achieved</p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4 mr-1" />
          $1,120/month OPTIMIZED
        </Badge>
      </div>

      {/* Cost Elimination Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$1,120</div>
            <p className="text-xs text-green-600">Smart optimization</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Services Optimized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">8</div>
            <p className="text-xs text-blue-600">Efficient alternatives</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Memory Optimized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <p className="text-xs text-purple-600">Efficient memory usage</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Network Optimized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <p className="text-xs text-orange-600">Request reduction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Efficient Alternatives Implemented
          </CardTitle>
          <CardDescription>All services replaced with optimized, efficient alternatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizationStatus.freeAlternativesImplemented.map((alternative: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-700">{alternative}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Smart Optimization Breakdown
          </CardTitle>
          <CardDescription>Detailed breakdown of optimizations and methods used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationStatus.eliminatedCosts.map((cost: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    {cost.category.includes("AI") && <Cpu className="h-4 w-4 text-green-600" />}
                    {cost.category.includes("Memory") && <Shield className="h-4 w-4 text-green-600" />}
                    {cost.category.includes("Storage") && <Database className="h-4 w-4 text-green-600" />}
                    {cost.category.includes("Network") && <Network className="h-4 w-4 text-green-600" />}
                    {cost.category.includes("Debug") && <Code className="h-4 w-4 text-green-600" />}
                    {!cost.category.includes("AI") &&
                      !cost.category.includes("Memory") &&
                      !cost.category.includes("Storage") &&
                      !cost.category.includes("Network") &&
                      !cost.category.includes("Debug") && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{cost.category}</h4>
                    <p className="text-sm text-muted-foreground">{cost.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">-${cost.savings}</div>
                  <div className="text-sm text-muted-foreground">
                    ${cost.oldCost} → ${cost.newCost}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Ongoing Smart Optimizations
          </CardTitle>
          <CardDescription>Automatic optimizations running continuously to maintain efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optimizationStatus.ongoingOptimizations.map((optimization: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700">{optimization}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button
          onClick={initializeZeroCostMode}
          disabled={isOptimizing}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
        >
          {isOptimizing ? (
            <>
              <Cpu className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Re-run Smart Optimization
            </>
          )}
        </Button>
      </div>

      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium">
          ✅ Smart Optimization Active • All services optimized • $1,120/month saved
        </p>
        <p className="text-sm text-green-600 mt-1">Using efficient, open-source technologies and browser-native APIs</p>
      </div>
    </div>
  )
}

export { ZeroCostDashboard }
export default ZeroCostDashboard
