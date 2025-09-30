"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mic,
  MicOff,
  Brain,
  Volume2,
  VolumeX,
  Code2,
  Database,
  TestTube,
  Layers,
  RefreshCw,
  Minimize2,
  BarChart3,
} from "lucide-react"

import type { VoiceAIResult } from "@/lib/voice-ai-integration"

interface AIAssistantState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  currentMode: "idle" | "listening" | "processing" | "responding"
  lastResult: VoiceAIResult | null
  currentLanguage: string
  voiceEnabled: boolean
}

interface AICapability {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  category: "development" | "analysis" | "design" | "testing"
}

export function EnhancedAIAssistant() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState("assistant")
  const [aiState, setAIState] = useState<AIAssistantState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    currentMode: "idle",
    lastResult: null,
    currentLanguage: "en-US",
    voiceEnabled: true,
  })

  const [currentMessage, setCurrentMessage] = useState(
    "AI Assistant ready. Try saying 'Generate API for user management' or 'Refactor this component'",
  )
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const recognitionRef = useRef<any>(null)

  const aiCapabilities: AICapability[] = [
    {
      id: "api-design",
      name: "API Designer",
      description: "Generate REST APIs, GraphQL schemas, and database models via voice",
      icon: <Code2 className="w-4 h-4" />,
      enabled: true,
      category: "development",
    },
    {
      id: "app-refactor",
      name: "Code Refactor",
      description: "Analyze and refactor applications with voice guidance",
      icon: <RefreshCw className="w-4 h-4" />,
      enabled: true,
      category: "development",
    },
    {
      id: "test-generator",
      name: "Test Suite",
      description: "Generate comprehensive tests using voice descriptions",
      icon: <TestTube className="w-4 h-4" />,
      enabled: true,
      category: "testing",
    },
    {
      id: "app-planner",
      name: "App Planner",
      description: "Decompose complex applications into manageable components",
      icon: <Layers className="w-4 h-4" />,
      enabled: true,
      category: "design",
    },
    {
      id: "sql-analytics",
      name: "Data Analytics",
      description: "Generate SQL queries and analyze data patterns via voice",
      icon: <BarChart3 className="w-4 h-4" />,
      enabled: true,
      category: "analysis",
    },
    {
      id: "database-design",
      name: "DB Designer",
      description: "Design database schemas and relationships",
      icon: <Database className="w-4 h-4" />,
      enabled: true,
      category: "development",
    },
  ]

  // Initialize AI systems
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = true
          recognition.lang = aiState.currentLanguage

          recognition.onresult = handleVoiceResult
          recognition.onerror = handleVoiceError
          recognition.onstart = () => updateAIState({ isListening: true, currentMode: "listening" })
          recognition.onend = () => updateAIState({ isListening: false, currentMode: "idle" })

          recognitionRef.current = recognition
        }

        setCurrentMessage("🤖 Enhanced AI Assistant initialized with voice-enabled development tools!")
      } catch (error) {
        console.error("AI initialization error:", error)
        setCurrentMessage("⚠️ Some features may not be available in this browser.")
      }
    }

    initializeAI()
  }, [])

  const updateAIState = useCallback((updates: Partial<AIAssistantState>) => {
    setAIState((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleVoiceResult = useCallback(
    async (event: any) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript.trim()) {
        updateAIState({ isProcessing: true, currentMode: "processing" })

        try {
          const result = await processEnhancedVoiceCommand(finalTranscript)

          updateAIState({
            lastResult: result,
            isProcessing: false,
            currentMode: "responding",
          })

          // Execute the appropriate action
          await executeAIAction(result)

          setConversationHistory((prev) => [
            ...prev.slice(-9),
            {
              timestamp: Date.now(),
              input: finalTranscript,
              result,
              capability: result.detectedCapability,
            },
          ])

          if (aiState.voiceEnabled && result.aiResponse.voiceMessage) {
            await speak(result.aiResponse.voiceMessage)
          }

          setCurrentMessage(result.aiResponse.message)
        } catch (error) {
          console.error("AI processing error:", error)
          setCurrentMessage("❌ Error processing command. Please try again.")
          updateAIState({ isProcessing: false, currentMode: "idle" })
        }
      }
    },
    [aiState.voiceEnabled],
  )

  const processEnhancedVoiceCommand = async (transcript: string): Promise<any> => {
    const lowerTranscript = transcript.toLowerCase()

    // Detect capability based on voice input
    let detectedCapability = "general"
    let actionType = "explanation"

    if (lowerTranscript.includes("api") || lowerTranscript.includes("endpoint") || lowerTranscript.includes("rest")) {
      detectedCapability = "api-design"
      actionType = "api_generation"
    } else if (
      lowerTranscript.includes("refactor") ||
      lowerTranscript.includes("improve") ||
      lowerTranscript.includes("optimize")
    ) {
      detectedCapability = "app-refactor"
      actionType = "code_refactoring"
    } else if (
      lowerTranscript.includes("test") ||
      lowerTranscript.includes("unit test") ||
      lowerTranscript.includes("testing")
    ) {
      detectedCapability = "test-generator"
      actionType = "test_generation"
    } else if (
      lowerTranscript.includes("plan") ||
      lowerTranscript.includes("architecture") ||
      lowerTranscript.includes("decompose")
    ) {
      detectedCapability = "app-planner"
      actionType = "app_planning"
    } else if (
      lowerTranscript.includes("sql") ||
      lowerTranscript.includes("query") ||
      lowerTranscript.includes("analytics")
    ) {
      detectedCapability = "sql-analytics"
      actionType = "sql_generation"
    } else if (
      lowerTranscript.includes("database") ||
      lowerTranscript.includes("schema") ||
      lowerTranscript.includes("table")
    ) {
      detectedCapability = "database-design"
      actionType = "database_design"
    }

    return {
      voiceResult: {
        transcript,
        confidence: 0.95,
        language: aiState.currentLanguage,
      },
      aiResponse: {
        message: `Processing ${detectedCapability.replace("-", " ")} request: "${transcript}"`,
        voiceMessage: `I'll help you with ${detectedCapability.replace("-", " ")}. Processing your request now.`,
      },
      contextualActions: [
        {
          type: actionType,
          confidence: 0.9,
          payload: {
            transcript,
            capability: detectedCapability,
            requirements: transcript,
          },
        },
      ],
      detectedCapability,
      voicePersonality: { speed: 1.0, pitch: 1.0 },
    }
  }

  const executeAIAction = useCallback(async (result: any) => {
    const action = result.contextualActions[0]

    try {
      switch (action.type) {
        case "api_generation":
          const apiEvent = new CustomEvent("voiceAPIGeneration", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(apiEvent)
          setCurrentMessage("🔧 Generating API based on your voice description...")
          break

        case "code_refactoring":
          const refactorEvent = new CustomEvent("voiceCodeRefactor", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(refactorEvent)
          setCurrentMessage("♻️ Analyzing code for refactoring opportunities...")
          break

        case "test_generation":
          const testEvent = new CustomEvent("voiceTestGeneration", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(testEvent)
          setCurrentMessage("🧪 Generating comprehensive test suite...")
          break

        case "app_planning":
          const planEvent = new CustomEvent("voiceAppPlanning", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(planEvent)
          setCurrentMessage("📋 Creating application architecture plan...")
          break

        case "sql_generation":
          const sqlEvent = new CustomEvent("voiceSQLGeneration", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(sqlEvent)
          setCurrentMessage("📊 Generating SQL queries and analytics...")
          break

        case "database_design":
          const dbEvent = new CustomEvent("voiceDatabaseDesign", {
            detail: {
              requirements: action.payload.requirements,
              transcript: action.payload.transcript,
            },
          })
          window.dispatchEvent(dbEvent)
          setCurrentMessage("🗄️ Designing database schema...")
          break

        default:
          setCurrentMessage("💬 I understand your request. How can I help you further?")
      }
    } catch (error) {
      console.error(`Error executing ${action.type}:`, error)
      setCurrentMessage("❌ Error executing command. Please try again.")
    }
  }, [])

  const handleVoiceError = useCallback((event: any) => {
    console.error("Voice recognition error:", event.error)
    const errorMessages = {
      "no-speech": "🎤 No speech detected. Please try speaking closer to your microphone.",
      "audio-capture": "🎤 Cannot access microphone. Please check permissions.",
      "not-allowed": "🔒 Microphone access denied. Please allow microphone access.",
      network: "🌐 Network error. Please check your connection.",
    }
    setCurrentMessage(errorMessages[event.error] || `❌ Voice error: ${event.error}`)
    updateAIState({ isListening: false, isProcessing: false, currentMode: "idle" })
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!aiState.voiceEnabled || !("speechSynthesis" in window)) return

      window.speechSynthesis.cancel()
      updateAIState({ isSpeaking: true })

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.8

      utterance.onend = () => updateAIState({ isSpeaking: false, currentMode: "idle" })
      utterance.onerror = () => updateAIState({ isSpeaking: false, currentMode: "idle" })

      window.speechSynthesis.speak(utterance)
    },
    [aiState.voiceEnabled],
  )

  const startVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      setCurrentMessage("❌ Voice recognition not available in this browser.")
      return
    }

    try {
      recognitionRef.current.start()
      setCurrentMessage("🎤 Listening... Describe what you'd like me to help you build or analyze.")
    } catch (error) {
      console.error("Error starting voice recognition:", error)
      setCurrentMessage("❌ Failed to start voice recognition.")
    }
  }, [])

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    updateAIState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      currentMode: "idle",
    })
  }, [])

  const toggleVoiceEnabled = useCallback(() => {
    const newState = !aiState.voiceEnabled
    updateAIState({ voiceEnabled: newState })

    if (!newState) {
      stopVoiceInput()
      setCurrentMessage("🔇 Voice features disabled.")
    } else {
      setCurrentMessage("🔊 Voice features enabled.")
    }
  }, [aiState.voiceEnabled, stopVoiceInput])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          title="Open AI Assistant"
        >
          <Brain className="w-6 h-6" />
          {aiState.currentMode !== "idle" && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg">
      <Card className="shadow-xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              AI Assistant
              <Badge variant="outline" className="text-xs">
                {aiState.currentMode}
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoiceEnabled}
                className="w-8 h-8 p-0"
                title={aiState.voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {aiState.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 p-0"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
              <TabsTrigger value="capabilities">Tools</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="space-y-4">
              {/* Current Status */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      aiState.currentMode === "idle"
                        ? "bg-gray-400"
                        : aiState.currentMode === "listening"
                          ? "bg-blue-500 animate-pulse"
                          : aiState.currentMode === "processing"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-green-500 animate-pulse"
                    }`}
                  />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-sm text-muted-foreground">{currentMessage}</p>
              </div>

              {/* Voice Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={aiState.isListening ? stopVoiceInput : startVoiceInput}
                  disabled={!aiState.voiceEnabled}
                  className="flex-1"
                  variant={aiState.isListening ? "destructive" : "default"}
                >
                  {aiState.isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Listen
                    </>
                  )}
                </Button>

                {aiState.isSpeaking && (
                  <Button onClick={() => window.speechSynthesis.cancel()} variant="outline" className="px-3">
                    <VolumeX className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => startVoiceInput()} className="text-xs">
                  <Code2 className="w-3 h-3 mr-1" />
                  Generate API
                </Button>
                <Button variant="outline" size="sm" onClick={() => startVoiceInput()} className="text-xs">
                  <TestTube className="w-3 h-3 mr-1" />
                  Create Tests
                </Button>
                <Button variant="outline" size="sm" onClick={() => startVoiceInput()} className="text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refactor Code
                </Button>
                <Button variant="outline" size="sm" onClick={() => startVoiceInput()} className="text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Analyze Data
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4">
              {["development", "analysis", "design", "testing"].map((category) => (
                <div key={category}>
                  <h4 className="text-sm font-medium mb-2 capitalize">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {aiCapabilities
                      .filter((cap) => cap.category === category)
                      .map((capability) => (
                        <Button
                          key={capability.id}
                          variant="outline"
                          size="sm"
                          onClick={() => startVoiceInput()}
                          className="h-auto p-2 flex flex-col items-center gap-1"
                          title={capability.description}
                          disabled={!capability.enabled}
                        >
                          {capability.icon}
                          <span className="text-xs leading-tight text-center">{capability.name}</span>
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {conversationHistory.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {conversationHistory.slice(-5).map((item, idx) => (
                    <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                      <div className="font-medium mb-1">"{item.input.substring(0, 40)}..."</div>
                      <Badge variant="secondary" className="text-xs">
                        {item.capability?.replace("-", " ") || "general"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No conversation history yet. Start by giving a voice command!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
