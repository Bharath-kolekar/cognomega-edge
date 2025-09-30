"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitBranch, Shield, Code, Download, Cloud, Terminal, Zap, Lock, Eye } from "lucide-react"

interface CodebaseConnection {
  id: string
  name: string
  url: string
  status: "connected" | "analyzing" | "complete" | "error"
  issues: number
  fixes: number
  lastAnalyzed?: Date
}

export function CodebaseAccessPanel() {
  const [connections, setConnections] = useState<CodebaseConnection[]>([])
  const [repoUrl, setRepoUrl] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [consentGiven, setConsentGiven] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)

  const connectRepository = useCallback(async () => {
    if (!repoUrl.trim() || !consentGiven) return

    setIsConnecting(true)

    const newConnection: CodebaseConnection = {
      id: Date.now().toString(),
      name: repoUrl.split("/").pop() || "Unknown Repository",
      url: repoUrl,
      status: "connected",
      issues: 0,
      fixes: 0,
    }

    setConnections((prev) => [...prev, newConnection])

    // Simulate connection process
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((conn) => (conn.id === newConnection.id ? { ...conn, status: "connected" } : conn)),
      )
      setIsConnecting(false)
      setRepoUrl("")

      // Dispatch voice event
      window.dispatchEvent(
        new CustomEvent("voiceCodebaseConnected", {
          detail: { connection: newConnection },
        }),
      )
    }, 2000)
  }, [repoUrl, consentGiven])

  const analyzeCodebase = useCallback(async (connectionId: string) => {
    setSelectedConnection(connectionId)
    setAnalysisProgress(0)

    setConnections((prev) => prev.map((conn) => (conn.id === connectionId ? { ...conn, status: "analyzing" } : conn)))

    // Simulate analysis progress
    const progressSteps = [10, 25, 40, 55, 70, 85, 100]

    for (const progress of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setAnalysisProgress(progress)
    }

    // Complete analysis
    const issues = Math.floor(Math.random() * 25) + 5
    const fixes = Math.floor(issues * 0.7)

    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              status: "complete",
              issues,
              fixes,
              lastAnalyzed: new Date(),
            }
          : conn,
      ),
    )

    setSelectedConnection(null)
    setAnalysisProgress(0)

    // Dispatch analysis complete event
    window.dispatchEvent(
      new CustomEvent("voiceCodebaseAnalysisComplete", {
        detail: { connectionId, issues, fixes },
      }),
    )
  }, [])

  const downloadFixes = useCallback(
    (connectionId: string, format: "patch" | "zip" | "diff") => {
      const connection = connections.find((c) => c.id === connectionId)
      if (!connection) return

      // Simulate download
      const filename = `${connection.name}-fixes-${Date.now()}.${format}`
      console.log(`[v0] Downloading ${filename}`)

      // Create download link
      const link = document.createElement("a")
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(`Fixed code for ${connection.name} in ${format} format`)}`
      link.download = filename
      link.click()

      // Dispatch download event
      window.dispatchEvent(
        new CustomEvent("voiceCodebaseDownload", {
          detail: { connectionId, format, filename },
        }),
      )
    },
    [connections],
  )

  const deployFixed = useCallback(
    async (connectionId: string, platform: string) => {
      const connection = connections.find((c) => c.id === connectionId)
      if (!connection) return

      // Simulate deployment
      const deploymentUrl = `https://${platform}-${Date.now()}.app`

      // Dispatch deployment event
      window.dispatchEvent(
        new CustomEvent("voiceCodebaseDeployment", {
          detail: { connectionId, platform, url: deploymentUrl },
        }),
      )
    },
    [connections],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Quick Codebase Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Form */}
          <div className="space-y-3">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your code privacy is protected. We only access what you authorize.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="repo-url" className="text-xs">
                Repository URL
              </Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="consent-panel"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-3 h-3"
              />
              <Label htmlFor="consent-panel" className="text-xs">
                I consent to automated analysis and bug fixing
              </Label>
            </div>

            <Button
              onClick={connectRepository}
              disabled={!repoUrl.trim() || !consentGiven || isConnecting}
              size="sm"
              className="w-full text-xs"
            >
              <GitBranch className="h-3 w-3 mr-1" />
              {isConnecting ? "Connecting..." : "Connect Repository"}
            </Button>
          </div>

          {/* Connected Repositories */}
          {connections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Connected Repositories</h4>
              {connections.map((connection) => (
                <Card key={connection.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-medium">{connection.name}</h5>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{connection.url}</p>
                      </div>
                      <Badge
                        variant={
                          connection.status === "complete"
                            ? "default"
                            : connection.status === "analyzing"
                              ? "secondary"
                              : connection.status === "connected"
                                ? "outline"
                                : "destructive"
                        }
                        className="text-xs"
                      >
                        {connection.status}
                      </Badge>
                    </div>

                    {connection.status === "analyzing" && selectedConnection === connection.id && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Analyzing...</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="h-1" />
                      </div>
                    )}

                    {connection.status === "complete" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Issues: {connection.issues}</div>
                          <div>Fixed: {connection.fixes}</div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFixes(connection.id, "patch")}
                            className="text-xs h-6 px-2"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Patch
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFixes(connection.id, "zip")}
                            className="text-xs h-6 px-2"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            ZIP
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deployFixed(connection.id, "vercel")}
                            className="text-xs h-6 px-2"
                          >
                            <Cloud className="h-3 w-3 mr-1" />
                            Deploy
                          </Button>
                        </div>
                      </div>
                    )}

                    {connection.status === "connected" && (
                      <Button size="sm" onClick={() => analyzeCodebase(connection.id)} className="w-full text-xs h-6">
                        <Eye className="h-3 w-3 mr-1" />
                        Analyze Code
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Voice Commands</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("voiceCommand", {
                      detail: { command: "analyze my repository" },
                    }),
                  )
                }
                className="text-xs h-6"
              >
                <Code className="h-3 w-3 mr-1" />
                Analyze
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("voiceCommand", {
                      detail: { command: "fix all bugs" },
                    }),
                  )
                }
                className="text-xs h-6"
              >
                <Zap className="h-3 w-3 mr-1" />
                Auto Fix
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("voiceCommand", {
                      detail: { command: "security scan" },
                    }),
                  )
                }
                className="text-xs h-6"
              >
                <Shield className="h-3 w-3 mr-1" />
                Security
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("voiceCommand", {
                      detail: { command: "deploy to production" },
                    }),
                  )
                }
                className="text-xs h-6"
              >
                <Terminal className="h-3 w-3 mr-1" />
                Deploy
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-muted-foreground">
            Say "analyze my repository" or "connect to GitHub" to get started
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
