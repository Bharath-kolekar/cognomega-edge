"use client"

import { useState, useCallback } from "react"

interface UseVoiceServiceOptions {
  onRecognitionResult?: (transcript: string, isFinal: boolean) => void
  onSpeechEnd?: () => void
  onError?: (error: string) => void
}

export function useVoiceService(options: UseVoiceServiceOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`)

  const startListening = useCallback(
    async (language = "en-US") => {
      try {
        setIsListening(true)
        const response = await fetch("/api/voice/recognition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            sessionId,
            language,
            continuous: true,
            interimResults: true,
          }),
        })

        if (!response.ok) throw new Error("Failed to start recognition")

        const result = await response.json()
        options.onRecognitionResult?.(result.transcript, result.isFinal)
      } catch (error) {
        setIsListening(false)
        options.onError?.(error.message)
      }
    },
    [sessionId, options],
  )

  const stopListening = useCallback(async () => {
    try {
      await fetch("/api/voice/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", sessionId }),
      })
      setIsListening(false)
    } catch (error) {
      options.onError?.(error.message)
    }
  }, [sessionId, options])

  const speak = useCallback(
    async (text: string, voiceOptions = {}) => {
      try {
        setIsSpeaking(true)
        const response = await fetch("/api/voice/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sessionId,
            ...voiceOptions,
          }),
        })

        if (!response.ok) throw new Error("Failed to synthesize speech")

        const result = await response.json()
        if (result.success) {
          options.onSpeechEnd?.()
        }
        setIsSpeaking(false)
      } catch (error) {
        setIsSpeaking(false)
        options.onError?.(error.message)
      }
    },
    [sessionId, options],
  )

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    sessionId,
  }
}
