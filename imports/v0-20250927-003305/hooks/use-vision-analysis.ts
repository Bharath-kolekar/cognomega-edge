"use client"

import { useState, useCallback } from "react"

interface VisionResult {
  analysis: string
  analysisType: string
  results: any
  confidence: number
  processingTime: number
}

interface UseVisionAnalysisOptions {
  onAnalysisComplete?: (result: VisionResult) => void
  onError?: (error: string) => void
}

export function useVisionAnalysis(options: UseVisionAnalysisOptions = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sessionId] = useState(() => `vision-session-${Date.now()}-${Math.random()}`)

  const analyzeImage = useCallback(
    async (
      imageData: string,
      analysisType: "describe" | "objects" | "text" | "faces" | "colors" | "emotions" | "comprehensive",
      analysisOptions: any = {},
    ) => {
      setIsAnalyzing(true)

      try {
        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "analyze",
            imageData,
            analysisType,
            sessionId,
            options: analysisOptions,
          }),
        })

        if (!response.ok) throw new Error("Vision analysis failed")

        const result = await response.json()
        options.onAnalysisComplete?.(result)
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsAnalyzing(false)
      }
    },
    [sessionId, options],
  )

  const extractText = useCallback(
    async (imageData: string, language = "en") => {
      setIsAnalyzing(true)

      try {
        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ocr",
            imageData,
            language,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("OCR failed")

        const result = await response.json()
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsAnalyzing(false)
      }
    },
    [sessionId, options],
  )

  const analyzeFaces = useCallback(
    async (
      imageData: string,
      faceOptions: {
        includeEmotions?: boolean
        includeAge?: boolean
        includeGender?: boolean
      } = {},
    ) => {
      setIsAnalyzing(true)

      try {
        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "faces",
            imageData,
            sessionId,
            ...faceOptions,
          }),
        })

        if (!response.ok) throw new Error("Face analysis failed")

        const result = await response.json()
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsAnalyzing(false)
      }
    },
    [sessionId, options],
  )

  const batchAnalyze = useCallback(
    async (
      requests: Array<{
        imageData: string
        analysisType: string
        options?: any
      }>,
    ) => {
      setIsAnalyzing(true)

      try {
        const analysisRequests = requests.map((req) => ({
          ...req,
          sessionId: `${sessionId}-batch-${Date.now()}`,
        }))

        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "batch",
            requests: analysisRequests,
          }),
        })

        if (!response.ok) throw new Error("Batch analysis failed")

        const result = await response.json()
        return result.results
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsAnalyzing(false)
      }
    },
    [sessionId, options],
  )

  return {
    analyzeImage,
    extractText,
    analyzeFaces,
    batchAnalyze,
    isAnalyzing,
    sessionId,
  }
}
