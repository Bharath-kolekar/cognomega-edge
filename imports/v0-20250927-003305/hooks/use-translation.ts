"use client"

import { useState, useCallback } from "react"

interface TranslationResult {
  translation: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  alternatives: string[]
}

interface UseTranslationOptions {
  onTranslationComplete?: (result: TranslationResult) => void
  onError?: (error: string) => void
}

export function useTranslation(options: UseTranslationOptions = {}) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [supportedLanguages, setSupportedLanguages] = useState<Record<string, string>>({})
  const [sessionId] = useState(() => `translation-session-${Date.now()}-${Math.random()}`)

  const translate = useCallback(
    async (
      text: string,
      targetLanguage: string,
      sourceLanguage?: string,
      formality: "formal" | "informal" | "auto" = "auto",
    ) => {
      if (!text.trim()) return null

      setIsTranslating(true)

      try {
        const response = await fetch("/api/translation/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "translate",
            text,
            targetLanguage,
            sourceLanguage,
            formality,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Translation failed")

        const result = await response.json()
        options.onTranslationComplete?.(result)
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsTranslating(false)
      }
    },
    [sessionId, options],
  )

  const detectLanguage = useCallback(
    async (text: string) => {
      try {
        const response = await fetch("/api/translation/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "detect",
            text,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Language detection failed")

        const result = await response.json()
        return result.detectedLanguage
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [sessionId, options],
  )

  const batchTranslate = useCallback(
    async (texts: string[], targetLanguage: string, sourceLanguage?: string) => {
      setIsTranslating(true)

      try {
        const response = await fetch("/api/translation/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "batch",
            texts,
            targetLanguage,
            sourceLanguage,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Batch translation failed")

        const result = await response.json()
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsTranslating(false)
      }
    },
    [sessionId, options],
  )

  const loadSupportedLanguages = useCallback(async () => {
    try {
      const response = await fetch("/api/translation/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "languages" }),
      })

      if (!response.ok) throw new Error("Failed to load languages")

      const result = await response.json()
      setSupportedLanguages(result.languages)
      return result.languages
    } catch (error) {
      options.onError?.(error.message)
      throw error
    }
  }, [options])

  return {
    translate,
    detectLanguage,
    batchTranslate,
    loadSupportedLanguages,
    isTranslating,
    supportedLanguages,
    sessionId,
  }
}
