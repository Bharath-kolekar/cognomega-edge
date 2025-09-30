"use client"

import { useState, useCallback, useEffect } from "react"

interface UserPreferences {
  language: string
  voiceSettings: {
    preferredVoice?: string
    speechRate: number
    volume: number
  }
  uiPreferences: {
    theme: "light" | "dark" | "auto"
    compactMode: boolean
    animations: boolean
  }
  aiSettings: {
    responseStyle: "concise" | "detailed" | "conversational"
    expertise: "beginner" | "intermediate" | "advanced"
    domains: string[]
  }
}

interface UseContextMemoryOptions {
  userId: string
  onContextLoaded?: (context: any) => void
  onError?: (error: string) => void
}

export function useContextMemory(options: UseContextMemoryOptions) {
  const [context, setContext] = useState<any>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `context-session-${Date.now()}-${Math.random()}`)

  const storeContext = useCallback(
    async (data: any) => {
      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "store",
            userId: options.userId,
            sessionId,
            data,
          }),
        })

        if (!response.ok) throw new Error("Failed to store context")
        return await response.json()
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [options.userId, sessionId, options],
  )

  const retrieveContext = useCallback(
    async (query: any) => {
      setIsLoading(true)

      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "retrieve",
            query: {
              userId: options.userId,
              sessionId,
              ...query,
            },
          }),
        })

        if (!response.ok) throw new Error("Failed to retrieve context")

        const result = await response.json()
        setContext(result.context)
        options.onContextLoaded?.(result.context)
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options, sessionId],
  )

  const addConversationEntry = useCallback(
    async (entry: {
      timestamp: number
      type: "voice" | "text" | "action"
      content: string
      context?: Record<string, any>
      sentiment?: "positive" | "neutral" | "negative"
      intent?: string
      confidence?: number
    }) => {
      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_conversation",
            userId: options.userId,
            sessionId,
            entry: {
              timestamp: Date.now(),
              sentiment: "neutral",
              confidence: 0.8,
              ...entry,
            },
          }),
        })

        if (!response.ok) throw new Error("Failed to add conversation entry")
        return await response.json()
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [options.userId, sessionId, options],
  )

  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_preferences",
            userId: options.userId,
            sessionId,
            preferences: newPreferences,
          }),
        })

        if (!response.ok) throw new Error("Failed to update preferences")

        setPreferences((prev) => (prev ? { ...prev, ...newPreferences } : null))
        return await response.json()
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [options.userId, sessionId, options],
  )

  const getPersonalizedSuggestions = useCallback(
    async (currentContext?: string) => {
      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_suggestions",
            userId: options.userId,
            currentContext,
          }),
        })

        if (!response.ok) throw new Error("Failed to get suggestions")

        const result = await response.json()
        setSuggestions(result.suggestions)
        return result.suggestions
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [options],
  )

  const clearContext = useCallback(
    async (type: "user" | "session" = "session") => {
      try {
        const response = await fetch("/api/context/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: type === "user" ? "clear_user" : "clear_session",
            userId: options.userId,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Failed to clear context")

        if (type === "user") {
          setContext(null)
          setPreferences(null)
          setSuggestions([])
        }

        return await response.json()
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [options.userId, sessionId, options],
  )

  // Load initial context on mount
  useEffect(() => {
    retrieveContext({ type: "all" })
  }, [retrieveContext])

  return {
    context,
    preferences,
    suggestions,
    isLoading,
    sessionId,
    storeContext,
    retrieveContext,
    addConversationEntry,
    updatePreferences,
    getPersonalizedSuggestions,
    clearContext,
  }
}
