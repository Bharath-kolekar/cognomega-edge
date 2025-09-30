"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface TextToSpeechOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export function useTextToSpeech(options: TextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)

      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return

      // Stop any current speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      // Set voice options
      if (options.voice) {
        utterance.voice = options.voice
      } else {
        // Default to first English voice
        const englishVoice = voices.find((voice) => voice.lang.startsWith("en"))
        if (englishVoice) utterance.voice = englishVoice
      }

      utterance.rate = options.rate ?? 1
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1

      utterance.onstart = () => {
        setIsSpeaking(true)
        options.onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        options.onEnd?.()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        const errorMessage = `Text-to-speech error: ${event.error}`
        options.onError?.(errorMessage)
      }

      speechSynthesis.speak(utterance)
    },
    [isSupported, voices, options],
  )

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause()
    }
  }, [isSupported, isSpeaking])

  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume()
    }
  }, [isSupported])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    voices,
    isSupported,
  }
}
