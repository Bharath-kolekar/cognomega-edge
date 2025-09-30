"use client"

import { useState, useEffect, useCallback } from "react"
import { getServiceGateway, type ServiceGateway, type ServiceGatewayConfig } from "../services/gateway/service-gateway"

interface ServiceGatewayHook {
  gateway: ServiceGateway | null
  isReady: boolean
  health: Record<string, boolean>
  error: string | null

  // Voice methods
  processVoice: (audioData: Blob) => Promise<any>
  generateSpeech: (text: string, options?: any) => Promise<Blob>

  // Conversation methods
  sendMessage: (message: string, context?: any) => Promise<any>

  // Vision methods
  analyzeImage: (imageData: File | Blob) => Promise<any>

  // Visualization methods
  createChart: (data: any, type?: string) => Promise<any>

  // Translation methods
  translate: (content: string, targetLanguage: string) => Promise<any>

  // Memory methods
  getHistory: (limit?: number) => Promise<any[]>
  clearHistory: () => Promise<void>

  // Utility methods
  checkHealth: () => Promise<void>
}

export function useServiceGateway(config?: ServiceGatewayConfig): ServiceGatewayHook {
  const [gateway, setGateway] = useState<ServiceGateway | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [health, setHealth] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // Initialize gateway
  useEffect(() => {
    try {
      const gatewayInstance = getServiceGateway(config)
      setGateway(gatewayInstance)
      setIsReady(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize gateway")
      setIsReady(false)
    }
  }, [config])

  // Health check
  const checkHealth = useCallback(async () => {
    if (!gateway) return

    try {
      const healthStatus = await gateway.healthCheck()
      setHealth(healthStatus)
    } catch (err) {
      console.error("Health check failed:", err)
      setError(err instanceof Error ? err.message : "Health check failed")
    }
  }, [gateway])

  // Run initial health check
  useEffect(() => {
    if (isReady && gateway) {
      checkHealth()
    }
  }, [isReady, gateway, checkHealth])

  // Voice methods
  const processVoice = useCallback(
    async (audioData: Blob) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.processVoiceInput(audioData)
    },
    [gateway],
  )

  const generateSpeech = useCallback(
    async (text: string, options?: any) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.generateSpeech(text, options)
    },
    [gateway],
  )

  // Conversation methods
  const sendMessage = useCallback(
    async (message: string, context?: any) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.processConversation(message, context)
    },
    [gateway],
  )

  // Vision methods
  const analyzeImage = useCallback(
    async (imageData: File | Blob) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.analyzeImage(imageData)
    },
    [gateway],
  )

  // Visualization methods
  const createChart = useCallback(
    async (data: any, type?: string) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.createVisualization(data, type)
    },
    [gateway],
  )

  // Translation methods
  const translate = useCallback(
    async (content: string, targetLanguage: string) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.translateContent(content, targetLanguage)
    },
    [gateway],
  )

  // Memory methods
  const getHistory = useCallback(
    async (limit?: number) => {
      if (!gateway) throw new Error("Gateway not ready")
      return gateway.getConversationHistory(limit)
    },
    [gateway],
  )

  const clearHistory = useCallback(async () => {
    if (!gateway) throw new Error("Gateway not ready")
    return gateway.clearMemory()
  }, [gateway])

  return {
    gateway,
    isReady,
    health,
    error,
    processVoice,
    generateSpeech,
    sendMessage,
    analyzeImage,
    createChart,
    translate,
    getHistory,
    clearHistory,
    checkHealth,
  }
}
