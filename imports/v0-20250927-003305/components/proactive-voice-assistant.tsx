"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, Volume2, VolumeX, Brain, Lightbulb, Clock, User, X, Minimize2 } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"
import { contextualMemory } from "@/lib/contextual-memory"

interface ProactiveMessage {
  id: string
  type: "suggestion" | "reminder" | "tip" | "question" | "celebration"
  content: string
  voiceContent: string
  priority: "low" | "medium" | "high"
  timestamp: number
  context: string
  dismissed?: boolean
  responded?: boolean
}

interface UserContext {
  currentActivity: string
  timeSpent: number
  lastInteraction: number
  strugglingWith?: string
  achievements: string[]
  preferences: {
    proactiveLevel: "minimal" | "moderate" | "active"
    voiceEnabled: boolean
    reminderFrequency: number
  }
}

export function ProactiveVoiceAssistant() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<ProactiveMessage | null>(null)
  const [messageQueue, setMessageQueue] = useState<ProactiveMessage[]>([])
  const [userContext, setUserContext] = useState<UserContext>({
    currentActivity: "browsing",
    timeSpent: 0,
    lastInteraction: Date.now(),
    achievements: [],
    preferences: {
      proactiveLevel: "moderate",
      voiceEnabled: true,
      reminderFrequency: 300000, // 5 minutes
    },
  })
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [contextRecall, setContextRecall] = useState<any[]>([])

  const activityTimer = useRef<NodeJS.Timeout>()
  const proactiveTimer = useRef<NodeJS.Timeout>()
  const lastMessageTime = useRef(Date.now())

  // Context awareness and memory recall
  const updateContextRecall = useCallback(() => {
    const recentMemories = contextualMemory.getRelevantMemories("", 10, {
      timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
    })
    const personalizedSuggestions = contextualMemory.getPersonalizedSuggestions("current_activity")

    setContextRecall([...recentMemories.slice(0, 5), ...personalizedSuggestions.slice(0, 3)])
  }, [])

  // Generate proactive messages based on context
  const generateProactiveMessage = useCallback((): ProactiveMessage | null => {
    const now = Date.now()
    const timeSinceLastMessage = now - lastMessageTime.current
    const timeSinceLastInteraction = now - userContext.lastInteraction

    // Don't be too frequent
    if (timeSinceLastMessage < userContext.preferences.reminderFrequency) {
      return null
    }

    // Context-based message generation
    const messages: Omit<ProactiveMessage, "id" | "timestamp">[] = []

    // Time-based suggestions
    if (userContext.timeSpent > 600000) {
      // 10 minutes
      messages.push({
        type: "suggestion",
        content: "You've been exploring for a while! Would you like me to help you create something specific?",
        voiceContent:
          'I notice you\'ve been browsing for about 10 minutes. Would you like me to help you create something specific? Just say "create" followed by what you want to build.',
        priority: "medium",
        context: "long_session",
      })
    }

    // Inactivity reminders
    if (timeSinceLastInteraction > 180000) {
      // 3 minutes
      messages.push({
        type: "reminder",
        content: 'I\'m here if you need help! Try saying "help" or describe what you want to create.',
        voiceContent:
          'I\'m still here to help! You can say "help" for guidance, or simply describe any app you want to create.',
        priority: "low",
        context: "inactive",
      })
    }

    // Feature discovery
    if (!userContext.achievements.includes("used_voice_navigation")) {
      messages.push({
        type: "tip",
        content: 'Pro tip: You can navigate using voice commands! Try saying "show features" or "go home".',
        voiceContent:
          'Here\'s a pro tip: You can navigate the entire interface using voice commands. Try saying "show features" or "go home" to see how it works.',
        priority: "medium",
        context: "feature_discovery",
      })
    }

    // Context recall suggestions
    if (contextRecall.length > 0) {
      const recentMemory = contextRecall[0]
      if (recentMemory && recentMemory.type === "interaction") {
        messages.push({
          type: "suggestion",
          content: `I remember you were working on "${recentMemory.content.input}". Would you like to continue or try something new?`,
          voiceContent: `I remember you were working on ${recentMemory.content.input}. Would you like to continue with that, or shall we try something new?`,
          priority: "high",
          context: "memory_recall",
        })
      }
    }

    // Celebration messages
    if (userContext.achievements.length > 0) {
      const latestAchievement = userContext.achievements[userContext.achievements.length - 1]
      if (!messageQueue.some((m) => m.context === `celebration_${latestAchievement}`)) {
        messages.push({
          type: "celebration",
          content: `Great job! You've successfully ${latestAchievement}. What would you like to explore next?`,
          voiceContent: `Excellent work! You\'ve successfully ${latestAchievement}. I\'m impressed! What would you like to explore next?`,
          priority: "high",
          context: `celebration_${latestAchievement}`,
        })
      }
    }

    // Filter by proactive level
    const filteredMessages = messages.filter((msg) => {
      if (userContext.preferences.proactiveLevel === "minimal") {
        return msg.priority === "high"
      } else if (userContext.preferences.proactiveLevel === "moderate") {
        return msg.priority !== "low"
      }
      return true
    })

    if (filteredMessages.length === 0) return null

    // Select message based on priority and context
    const selectedMessage = filteredMessages.reduce((prev, current) => {
      const priorityWeight = { low: 1, medium: 2, high: 3 }
      return priorityWeight[current.priority] > priorityWeight[prev.priority] ? current : prev
    })

    return {
      ...selectedMessage,
      id: `proactive_${now}`,
      timestamp: now,
    }
  }, [userContext, messageQueue, contextRecall])

  // Speak message
  const speak = useCallback(
    (text: string) => {
      if (userContext.preferences.voiceEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
        setIsSpeaking(true)

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 0.7

        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
      }
    },
    [userContext.preferences.voiceEnabled],
  )

  // Handle user response to proactive message
  const handleUserResponse = useCallback(async () => {
    try {
      setIsListening(true)

      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
      })

      if (result.transcript.trim()) {
        // Process the response
        const response = result.transcript.toLowerCase()

        // Update context based on response
        if (response.includes("yes") || response.includes("sure") || response.includes("okay")) {
          if (currentMessage?.type === "suggestion") {
            // User accepted suggestion
            setUserContext((prev) => ({
              ...prev,
              lastInteraction: Date.now(),
              achievements: [...prev.achievements, "accepted_suggestion"],
            }))
          }
        } else if (response.includes("no") || response.includes("not now") || response.includes("later")) {
          // User declined
          setUserContext((prev) => ({
            ...prev,
            lastInteraction: Date.now(),
          }))
        }

        // Mark message as responded
        if (currentMessage) {
          setCurrentMessage({ ...currentMessage, responded: true })
          setTimeout(() => setCurrentMessage(null), 2000)
        }

        // Store interaction in contextual memory
        contextualMemory.addMemory(
          "proactive_interaction",
          {
            messageType: currentMessage?.type,
            userResponse: result.transcript,
            context: currentMessage?.context,
          },
          0.6,
          ["proactive", "voice_interaction"],
        )
      }
    } catch (error) {
      console.error("Voice response error:", error)
    } finally {
      setIsListening(false)
    }
  }, [currentMessage])

  // Dismiss current message
  const dismissMessage = useCallback(() => {
    if (currentMessage) {
      setCurrentMessage({ ...currentMessage, dismissed: true })
      setTimeout(() => setCurrentMessage(null), 500)
    }
  }, [currentMessage])

  // Activity tracking
  useEffect(() => {
    const trackActivity = () => {
      setUserContext((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + 1000,
        lastInteraction: Date.now(),
      }))
    }

    activityTimer.current = setInterval(trackActivity, 1000)
    return () => {
      if (activityTimer.current) clearInterval(activityTimer.current)
    }
  }, [])

  // Proactive message generation
  useEffect(() => {
    const generateMessages = () => {
      const newMessage = generateProactiveMessage()
      if (newMessage && !currentMessage) {
        setCurrentMessage(newMessage)
        setMessageQueue((prev) => [...prev, newMessage])
        lastMessageTime.current = Date.now()

        // Speak the message after a short delay
        setTimeout(() => {
          speak(newMessage.voiceContent)
        }, 1000)
      }
    }

    proactiveTimer.current = setInterval(generateMessages, 30000) // Check every 30 seconds
    return () => {
      if (proactiveTimer.current) clearInterval(proactiveTimer.current)
    }
  }, [generateProactiveMessage, currentMessage, speak])

  // Update context recall periodically
  useEffect(() => {
    updateContextRecall()
    const interval = setInterval(updateContextRecall, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [updateContextRecall])

  // Listen for user interactions to update context
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserContext((prev) => ({
        ...prev,
        lastInteraction: Date.now(),
      }))
    }

    const events = ["click", "keypress", "scroll", "touchstart"]
    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsMinimized(false)} className="rounded-full w-12 h-12 shadow-lg">
          <Brain className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  if (!currentMessage) {
    return null
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4" />
      case "reminder":
        return <Clock className="w-4 h-4" />
      case "tip":
        return <Brain className="w-4 h-4" />
      case "question":
        return <User className="w-4 h-4" />
      case "celebration":
        return <span className="text-lg">🎉</span>
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getMessageColor = (type: string) => {
    switch (type) {
      case "suggestion":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
      case "reminder":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
      case "tip":
        return "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
      case "question":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
      case "celebration":
        return "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/20"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className={`${getMessageColor(currentMessage.type)} border-2 shadow-lg animate-slide-up`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getMessageIcon(currentMessage.type)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {currentMessage.type}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    currentMessage.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : currentMessage.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {currentMessage.priority}
                </Badge>
              </div>

              <p className="text-sm">{currentMessage.content}</p>

              {/* Context recall info */}
              {currentMessage.context === "memory_recall" && contextRecall.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <span className="font-medium">Context:</span> Based on your recent activity
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleUserResponse}
                  disabled={isListening || isSpeaking}
                  className={isListening ? "animate-pulse" : ""}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-3 h-3 mr-1" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 mr-1" />
                      Respond
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => speak(currentMessage.voiceContent)}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)} className="w-6 h-6 p-0">
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissMessage} className="w-6 h-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
