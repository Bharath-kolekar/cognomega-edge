"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket, Code, Database, Shield, Layout, Globe, CheckCircle, Clock, ExternalLink, Download } from "lucide-react"

interface AppBuildStatus {
  projectId: string
  appType: string
  features: string[]
  buildStatus: string
  deploymentUrl?: string
  progress: number
  currentStep: string
  logs: string[]
}

export function RealTimeAppBuilder() {
  const [buildStatus, setBuildStatus] = useState<AppBuildStatus | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildHistory, setBuildHistory] = useState<AppBuildStatus[]>([])

  useEffect(() => {
    // Listen for full-stack app creation events
    const handleAppCreated = (event: CustomEvent) => {
      const appData = event.detail
      setBuildStatus({
        projectId: appData.projectId,
        appType: appData.appType,
        features: appData.features,
        buildStatus: appData.buildStatus,
        deploymentUrl: appData.deploymentUrl,
        progress: 100,
        currentStep: "Completed",
        logs: [`✅ ${appData.message}`],
      })

      setBuildHistory((prev) => [appData, ...prev.slice(0, 4)])
      setIsBuilding(false)
    }

    // Listen for deployment events
    const handleDeployment = (event: CustomEvent) => {
      const deployData = event.detail
      if (buildStatus) {
        setBuildStatus((prev) =>
          prev
            ? {
                ...prev,
                deploymentUrl: deployData.url,
                currentStep: "Deployed",
                logs: [...prev.logs, `🚀 Deployed to ${deployData.url}`],
              }
            : null,
        )
      }
    }

    window.addEventListener("fullStackAppCreated", handleAppCreated as EventListener)
    window.addEventListener("deploymentCompleted", handleDeployment as EventListener)

    return () => {
      window.removeEventListener("fullStackAppCreated", handleAppCreated as EventListener)
      window.removeEventListener("deploymentCompleted", handleDeployment as EventListener)
    }
  }, [buildStatus])

  const createSampleApp = async (type: string, features: string[]) => {
    setIsBuilding(true)
    setBuildStatus({
      projectId: `sample-${Date.now()}`,
      appType: type,
      features,
      buildStatus: "building",
      progress: 0,
      currentStep: "Initializing",
      logs: ["🚀 Starting application creation..."],
    })

    // Simulate build process
    const steps = [
      { step: "Generating project structure", progress: 20 },
      { step: "Installing dependencies", progress: 40 },
      { step: "Building application", progress: 60 },
      { step: "Running tests", progress: 80 },
      { step: "Deploying to production", progress: 100 },
    ]

    for (const { step, progress } of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setBuildStatus((prev) =>
        prev
          ? {
              ...prev,
              currentStep: step,
              progress,
              logs: [...prev.logs, `⏳ ${step}...`],
            }
          : null,
      )
    }

    // Complete the build
    const deploymentUrl = `https://sample-${type}-${Date.now()}.cognomega.app`
    setBuildStatus((prev) =>
      prev
        ? {
            ...prev,
            buildStatus: "completed",
            deploymentUrl,
            currentStep: "Completed",
            logs: [...prev.logs, `✅ Application deployed successfully!`],
          }
        : null,
    )

    setIsBuilding(false)
  }

  const getFeatureIcon = (feature: string) => {
    const icons = {
      authentication: <Shield className="w-4 h-4" />,
      database: <Database className="w-4 h-4" />,
      api: <Code className="w-4 h-4" />,
      dashboard: <Layout className="w-4 h-4" />,
    }
    return icons[feature as keyof typeof icons] || <Code className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Real-Time App Builder</h2>
        <p className="text-muted-foreground">
          Create full-stack applications instantly with voice commands or quick actions
        </p>
      </div>

      {/* Quick Build Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => createSampleApp("react", ["authentication", "api"])}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="w-5 h-5 text-blue-500" />
              React App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Modern React application with authentication and API integration
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Authentication</Badge>
              <Badge variant="outline">API</Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => createSampleApp("nextjs", ["authentication", "database", "dashboard"])}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="w-5 h-5 text-green-500" />
              Next.js App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Full-stack Next.js application with database and admin dashboard
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Auth</Badge>
              <Badge variant="outline">Database</Badge>
              <Badge variant="outline">Dashboard</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Build Status */}
      {buildStatus && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              {buildStatus.appType.charAt(0).toUpperCase() + buildStatus.appType.slice(1)} Application
              <Badge variant={buildStatus.buildStatus === "completed" ? "default" : "secondary"}>
                {buildStatus.buildStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{buildStatus.progress}%</span>
              </div>
              <Progress value={buildStatus.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{buildStatus.currentStep}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {buildStatus.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {getFeatureIcon(feature)}
                  {feature}
                </Badge>
              ))}
            </div>

            {buildStatus.deploymentUrl && (
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <a href={buildStatus.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live App
                  </a>
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Code
                </Button>
              </div>
            )}

            <Tabs defaultValue="logs" className="w-full">
              <TabsList>
                <TabsTrigger value="logs">Build Logs</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="logs" className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {buildStatus.logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Project ID:</span>
                    <p className="text-muted-foreground">{buildStatus.projectId}</p>
                  </div>
                  <div>
                    <span className="font-medium">Framework:</span>
                    <p className="text-muted-foreground">{buildStatus.appType}</p>
                  </div>
                  <div>
                    <span className="font-medium">Features:</span>
                    <p className="text-muted-foreground">{buildStatus.features.length} enabled</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-muted-foreground">{buildStatus.buildStatus}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Build History */}
      {buildHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Builds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buildHistory.map((build, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="font-medium">{build.appType} App</p>
                      <p className="text-sm text-muted-foreground">{build.features.join(", ")}</p>
                    </div>
                  </div>
                  {build.deploymentUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={build.deploymentUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Commands Help */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>"Create a React app with authentication"</strong> - Builds a React app with auth
            </p>
            <p>
              <strong>"Build a Next.js dashboard with database"</strong> - Creates full-stack dashboard
            </p>
            <p>
              <strong>"Deploy my application"</strong> - Deploys current project to production
            </p>
            <p>
              <strong>"Generate a report on system performance"</strong> - Creates detailed analytics report
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
