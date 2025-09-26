"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { useServiceGateway } from "../hooks/use-service-gateway"
import { Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function MicroservicesDashboard() {
  const { gateway, isReady, health, error, checkHealth } = useServiceGateway()
  const [isChecking, setIsChecking] = useState(false)

  const handleHealthCheck = async () => {
    setIsChecking(true)
    await checkHealth()
    setIsChecking(false)
  }

  const services = [
    { name: "Voice Processing", key: "voice", description: "Speech recognition and synthesis" },
    { name: "AI Conversation", key: "conversation", description: "Intelligent chat responses" },
    { name: "Data Visualization", key: "visualization", description: "Chart and graph generation" },
    { name: "Translation", key: "translation", description: "Multi-language support" },
    { name: "Vision Analysis", key: "vision", description: "Image recognition and analysis" },
    { name: "Context Memory", key: "memory", description: "Conversation history and context" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Microservices Dashboard</h2>
          <p className="text-muted-foreground">Monitor the health and status of all services</p>
        </div>
        <Button onClick={handleHealthCheck} disabled={isChecking || !isReady} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          Check Health
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isHealthy = health[service.key]
          const hasHealthData = service.key in health

          return (
            <Card key={service.key} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {hasHealthData ? (
                      isHealthy ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <Activity className="h-5 w-5 text-gray-400" />
                    )}
                    <Badge variant={!hasHealthData ? "secondary" : isHealthy ? "default" : "destructive"}>
                      {!hasHealthData ? "Unknown" : isHealthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={!hasHealthData ? "text-gray-500" : isHealthy ? "text-green-600" : "text-red-600"}>
                      {!hasHealthData ? "Checking..." : isHealthy ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gateway:</span>
                    <span className={isReady ? "text-green-600" : "text-red-600"}>
                      {isReady ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Overall microservices architecture status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Object.values(health).filter(Boolean).length}</div>
              <div className="text-sm text-muted-foreground">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(health).filter((h) => h === false).length}
              </div>
              <div className="text-sm text-muted-foreground">Unhealthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{isReady ? "1" : "0"}</div>
              <div className="text-sm text-muted-foreground">Gateway Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
