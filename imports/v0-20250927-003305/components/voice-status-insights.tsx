"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Activity, Clock, Mic, Brain, Zap, Volume2 } from "lucide-react"

interface VoiceStats {
  totalCommands: number
  successRate: number
  averageConfidence: number
  mostUsedCommands: Array<{ command: string; count: number }>
  languageDistribution: Array<{ language: string; percentage: number }>
  dailyUsage: Array<{ date: string; commands: number }>
  responseTime: number
  voiceQuality: number
}

interface SystemStatus {
  voiceRecognition: "active" | "inactive" | "error"
  speechSynthesis: "active" | "inactive" | "error"
  aiIntegration: "connected" | "disconnected" | "limited"
  networkLatency: number
  processingLoad: number
}

export function VoiceStatusInsights() {
  const [stats, setStats] = useState<VoiceStats>({
    totalCommands: 0,
    successRate: 0,
    averageConfidence: 0,
    mostUsedCommands: [],
    languageDistribution: [],
    dailyUsage: [],
    responseTime: 0,
    voiceQuality: 0,
  })
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    voiceRecognition: "inactive",
    speechSynthesis: "inactive",
    aiIntegration: "disconnected",
    networkLatency: 0,
    processingLoad: 0,
  })
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    loadVoiceStats()
    checkSystemStatus()

    // Update stats every 30 seconds
    const interval = setInterval(() => {
      loadVoiceStats()
      checkSystemStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadVoiceStats = () => {
    // Load from localStorage or generate mock data
    const storedStats = localStorage.getItem("voiceStats")
    if (storedStats) {
      setStats(JSON.parse(storedStats))
    } else {
      // Generate sample data
      const mockStats: VoiceStats = {
        totalCommands: 247,
        successRate: 94.2,
        averageConfidence: 0.87,
        mostUsedCommands: [
          { command: "create chart", count: 45 },
          { command: "translate text", count: 38 },
          { command: "analyze image", count: 32 },
          { command: "generate report", count: 28 },
          { command: "voice settings", count: 24 },
        ],
        languageDistribution: [
          { language: "English", percentage: 78 },
          { language: "Spanish", percentage: 12 },
          { language: "French", percentage: 6 },
          { language: "German", percentage: 4 },
        ],
        dailyUsage: [
          { date: "Mon", commands: 32 },
          { date: "Tue", commands: 45 },
          { date: "Wed", commands: 38 },
          { date: "Thu", commands: 52 },
          { date: "Fri", commands: 41 },
          { date: "Sat", commands: 28 },
          { date: "Sun", commands: 35 },
        ],
        responseTime: 1.2,
        voiceQuality: 8.7,
      }
      setStats(mockStats)
      localStorage.setItem("voiceStats", JSON.stringify(mockStats))
    }
  }

  const checkSystemStatus = () => {
    const status: SystemStatus = {
      voiceRecognition: "webkitSpeechRecognition" in window ? "active" : "inactive",
      speechSynthesis: "speechSynthesis" in window ? "active" : "inactive",
      aiIntegration: "connected", // Assume connected for demo
      networkLatency: Math.random() * 100 + 50, // Mock latency
      processingLoad: Math.random() * 30 + 20, // Mock processing load
    }
    setSystemStatus(status)
  }

  const requestVoiceStatus = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      speakResponse("Voice recognition is not supported in this browser.")
      return
    }

    setIsListening(true)

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase()
      processStatusCommand(command)
    }

    recognition.onerror = () => {
      setIsListening(false)
      speakResponse("Sorry, I couldn't hear your command clearly.")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()

    speakResponse("What would you like to know about your voice assistant status?")
  }, [])

  const processStatusCommand = (command: string) => {
    let response = ""

    if (command.includes("total commands") || command.includes("how many commands")) {
      response = `You have executed ${stats.totalCommands} voice commands in total.`
    } else if (command.includes("success rate") || command.includes("accuracy")) {
      response = `Your voice command success rate is ${stats.successRate}% with an average confidence of ${Math.round(stats.averageConfidence * 100)}%.`
    } else if (command.includes("most used") || command.includes("popular commands")) {
      const topCommand = stats.mostUsedCommands[0]
      response = `Your most used command is "${topCommand?.command}" with ${topCommand?.count} uses.`
    } else if (command.includes("languages") || command.includes("language distribution")) {
      const primaryLang = stats.languageDistribution[0]
      response = `You primarily use ${primaryLang?.language} at ${primaryLang?.percentage}% of the time.`
    } else if (command.includes("today") || command.includes("daily usage")) {
      const today = stats.dailyUsage[stats.dailyUsage.length - 1]
      response = `Today you've used ${today?.commands || 0} voice commands.`
    } else if (command.includes("system status") || command.includes("system health")) {
      response =
        `System status: Voice recognition is ${systemStatus.voiceRecognition}, ` +
        `speech synthesis is ${systemStatus.speechSynthesis}, ` +
        `and AI integration is ${systemStatus.aiIntegration}. ` +
        `Network latency is ${Math.round(systemStatus.networkLatency)} milliseconds.`
    } else if (command.includes("response time") || command.includes("performance")) {
      response = `Average response time is ${stats.responseTime} seconds with a voice quality rating of ${stats.voiceQuality} out of 10.`
    } else if (command.includes("help") || command.includes("what can i ask")) {
      response =
        "You can ask about total commands, success rate, most used commands, " +
        "language distribution, daily usage, system status, or performance metrics."
    } else {
      response =
        "I can provide information about your voice usage statistics, system status, " +
        "performance metrics, and command history. What would you like to know?"
    }

    speakResponse(response)
  }

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return "text-green-500"
      case "inactive":
      case "disconnected":
        return "text-red-500"
      case "limited":
      case "error":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return "✅"
      case "inactive":
      case "disconnected":
        return "❌"
      case "limited":
      case "error":
        return "⚠️"
      default:
        return "❓"
    }
  }

  return (
    <div className="space-y-6">
      {/* Voice Status Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Voice Status & Insights
            {isListening && (
              <Badge className="bg-red-500 animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                Listening
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Ask about your voice usage statistics and system performance
            </p>
            <Button onClick={requestVoiceStatus} disabled={isListening} className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {isListening ? "Listening..." : "Ask Status"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "How many commands have I used?",
              "What's my success rate?",
              "What are my most used commands?",
              "Show me system status",
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => processStatusCommand(question.toLowerCase())}
                className="text-xs h-auto py-2 px-3 whitespace-normal"
              >
                "{question}"
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">{getStatusIcon(systemStatus.voiceRecognition)}</div>
              <div className="text-sm font-medium">Voice Recognition</div>
              <div className={`text-xs ${getStatusColor(systemStatus.voiceRecognition)}`}>
                {systemStatus.voiceRecognition}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">{getStatusIcon(systemStatus.speechSynthesis)}</div>
              <div className="text-sm font-medium">Speech Synthesis</div>
              <div className={`text-xs ${getStatusColor(systemStatus.speechSynthesis)}`}>
                {systemStatus.speechSynthesis}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">{getStatusIcon(systemStatus.aiIntegration)}</div>
              <div className="text-sm font-medium">AI Integration</div>
              <div className={`text-xs ${getStatusColor(systemStatus.aiIntegration)}`}>
                {systemStatus.aiIntegration}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm font-medium">Latency</div>
              <div className="text-xs text-muted-foreground">{Math.round(systemStatus.networkLatency)}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Commands</span>
                <Badge variant="secondary">{stats.totalCommands}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>{stats.successRate}%</span>
                </div>
                <Progress value={stats.successRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Confidence</span>
                  <span>{Math.round(stats.averageConfidence * 100)}%</span>
                </div>
                <Progress value={stats.averageConfidence * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Voice Quality</span>
                  <span>{stats.voiceQuality}/10</span>
                </div>
                <Progress value={stats.voiceQuality * 10} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commands" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Most Used Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.mostUsedCommands.map((cmd, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{cmd.command}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{cmd.count} uses</span>
                  <Progress value={(cmd.count / stats.mostUsedCommands[0]?.count) * 100} className="w-20 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.languageDistribution.map((lang, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{lang.language}</span>
                  <span>{lang.percentage}%</span>
                </div>
                <Progress value={lang.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
