"use client"

import { useState, useCallback } from "react"
import type { ChartConfig, ChartData } from "@/services/data-visualization/visualization-service"

interface UseDataVisualizationOptions {
  onChartCreated?: (config: ChartConfig) => void
  onError?: (error: string) => void
}

export function useDataVisualization(options: UseDataVisualizationOptions = {}) {
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `viz-session-${Date.now()}-${Math.random()}`)

  const createChart = useCallback(
    async (
      data: string | ChartData[],
      chartType: ChartConfig["type"],
      title: string,
      options: { xAxis?: string; yAxis?: string } = {},
    ) => {
      setIsLoading(true)

      try {
        const response = await fetch("/api/viz/create-chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            chartType,
            title,
            xAxis: options.xAxis,
            yAxis: options.yAxis,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Failed to create chart")

        const result = await response.json()

        if (result.success) {
          setChartConfig(result.chartConfig)
          options.onChartCreated?.(result.chartConfig)
        } else {
          throw new Error(result.error || "Chart creation failed")
        }

        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, options],
  )

  const parseData = useCallback(
    async (data: string, format: "json" | "csv" | "natural" | "auto" = "auto") => {
      try {
        const response = await fetch("/api/viz/parse-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            format,
            sessionId,
          }),
        })

        if (!response.ok) throw new Error("Failed to parse data")

        const result = await response.json()
        return result
      } catch (error) {
        options.onError?.(error.message)
        throw error
      }
    },
    [sessionId, options],
  )

  const updateChartType = useCallback(
    (type: ChartConfig["type"]) => {
      if (chartConfig) {
        setChartConfig((prev) => (prev ? { ...prev, type } : null))
      }
    },
    [chartConfig],
  )

  const clearChart = useCallback(() => {
    setChartConfig(null)
  }, [])

  return {
    chartConfig,
    isLoading,
    createChart,
    parseData,
    updateChartType,
    clearChart,
    sessionId,
  }
}
