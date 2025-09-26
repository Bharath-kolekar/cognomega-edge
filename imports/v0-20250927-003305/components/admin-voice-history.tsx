"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Search, Download, Calendar, Clock, Zap, TrendingUp } from "lucide-react"

interface VoiceCommand {
  id: string
  timestamp: number
  transcript: string
  intent: string
  confidence: number
  processingTime: number
  success: boolean
  response?: string
  language: string
  userId?: string
}

export function AdminVoiceHistory() {
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([])
  const [filteredCommands, setFilteredCommands] = useState<VoiceCommand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [intentFilter, setIntentFilter] = useState<string>("all")
  const [successFilter, setSuccessFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in production this would come from the voice processor
  useEffect(() => {
    const mockData: VoiceCommand[] = [
      {
        id: "1",
        timestamp: Date.now() - 1800000,
        transcript: "Create a landing page with a hero section",
        intent: "create_app",
        confidence: 0.95,
        processingTime: 1200,
        success: true,
        response: "I'll create a landing page with a hero section for you.",
        language: "en-US",
      },
      {
        id: "2",
        timestamp: Date.now() - 3600000,
        transcript: "Show me the voice settings",
        intent: "navigate_settings",
        confidence: 0.88,
        processingTime: 800,
        success: true,
        response: "Navigating to voice settings.",
        language: "en-US",
      },
      {
        id: "3",
        timestamp: Date.now() - 5400000,
        transcript: "Generate a React component for user authentication",
        intent: "generate_code",
        confidence: 0.92,
        processingTime: 2100,
        success: true,
        response: "I'll generate a React authentication component for you.",
        language: "en-US",
      },
      {
        id: "4",
        timestamp: Date.now() - 7200000,
        transcript: "Export the code to TypeScript format",
        intent: "export_code",
        confidence: 0.85,
        processingTime: 1500,
        success: false,
        response: "I couldn't process that export request. Please try again.",
        language: "en-US",
      },
      {
        id: "5",
        timestamp: Date.now() - 9000000,
        transcript: "Help me understand how voice commands work",
        intent: "help_request",
        confidence: 0.78,
        processingTime: 900,
        success: true,
        response: "I'd be happy to explain how voice commands work.",
        language: "en-US",
      },
    ]

    setTimeout(() => {
      setVoiceCommands(mockData)
      setFilteredCommands(mockData)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter commands based on search and filters
  useEffect(() => {
    let filtered = voiceCommands

    if (searchTerm) {
      filtered = filtered.filter(
        (command) =>
          command.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
          command.intent.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (intentFilter !== "all") {
      filtered = filtered.filter((command) => command.intent === intentFilter)
    }

    if (successFilter !== "all") {
      const isSuccess = successFilter === "success"
      filtered = filtered.filter((command) => command.success === isSuccess)
    }

    setFilteredCommands(filtered)
  }, [voiceCommands, searchTerm, intentFilter, successFilter])

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "create_app":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "generate_code":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "navigate_settings":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "export_code":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "help_request":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600"
    if (confidence >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const exportData = () => {
    const dataStr = JSON.stringify(filteredCommands, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `voice-history-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const averageConfidence =
    voiceCommands.length > 0 ? voiceCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / voiceCommands.length : 0

  const averageProcessingTime =
    voiceCommands.length > 0
      ? voiceCommands.reduce((sum, cmd) => sum + cmd.processingTime, 0) / voiceCommands.length
      : 0

  const successRate =
    voiceCommands.length > 0 ? (voiceCommands.filter((cmd) => cmd.success).length / voiceCommands.length) * 100 : 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Voice Command History</span>
            <Button onClick={exportData} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search commands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  <SelectItem value="create_app">Create App</SelectItem>
                  <SelectItem value="generate_code">Generate Code</SelectItem>
                  <SelectItem value="navigate_settings">Navigate</SelectItem>
                  <SelectItem value="export_code">Export Code</SelectItem>
                  <SelectItem value="help_request">Help Request</SelectItem>
                </SelectContent>
              </Select>

              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{voiceCommands.length}</div>
                <div className="text-sm text-muted-foreground">Total Commands</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{(averageConfidence * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{averageProcessingTime.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle>Commands ({filteredCommands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No voice commands found</p>
              </div>
            ) : (
              filteredCommands.map((command) => (
                <div key={command.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getIntentColor(command.intent)}>{command.intent.replace("_", " ")}</Badge>
                      <Badge variant={command.success ? "default" : "destructive"}>
                        {command.success ? "Success" : "Failed"}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(command.confidence)}`}>
                        {(command.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(command.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Transcript:</span>
                      <p className="text-sm text-muted-foreground">{command.transcript}</p>
                    </div>

                    {command.response && (
                      <div>
                        <span className="text-sm font-medium">Response:</span>
                        <p className="text-sm text-muted-foreground">{command.response}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {command.processingTime}ms
                    </div>
                    <div>Language: {command.language}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
