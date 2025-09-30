"use client"

import { useState, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface UseAIConversationOptions {
  onResponse?: (response: string) => void
  onError?: (error: string) => void
}

export function useAIConversation(options: UseAIConversationOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `ai-session-${Date.now()}-${Math.random()}`)

  const sendMessage = useCallback(
    async (message: string, tools?: string[]) => {
      if (!message.trim()) return

      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            sessionId,
            tools,
            context: {
              previousMessages: messages.slice(-10),
            },
          }),
        })

        if (!response.ok) throw new Error("Failed to get AI response")

        const result = await response.json()

        const assistantMessage: Message = {
          role: "assistant",
          content: result.response,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        options.onResponse?.(result.response)

        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [messages, sessionId, options],
  )

  const clearConversation = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    sessionId,
  }
}
