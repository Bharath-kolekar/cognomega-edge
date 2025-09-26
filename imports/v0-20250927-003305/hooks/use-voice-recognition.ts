"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface VoiceRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        const recognition = recognitionRef.current

        recognition.continuous = options.continuous ?? true
        recognition.interimResults = options.interimResults ?? true
        recognition.lang = options.language ?? "en-US"

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
          options.onStart?.()
        }

        recognition.onresult = (event) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript)
            options.onResult?.(finalTranscript, true)
          }

          setInterimTranscript(interimTranscript)
          if (interimTranscript) {
            options.onResult?.(interimTranscript, false)
          }

          // Auto-stop after 3 seconds of silence
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            if (recognition && isListening) {
              recognition.stop()
            }
          }, 3000)
        }

        recognition.onerror = (event) => {
          const errorMessage = `Speech recognition error: ${event.error}`
          setError(errorMessage)
          setIsListening(false)
          options.onError?.(errorMessage)
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript("")
          options.onEnd?.()
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [options])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("")
      setInterimTranscript("")
      setError(null)
      recognitionRef.current.start()
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
