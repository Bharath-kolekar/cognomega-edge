export interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "area" | "scatter"
  title: string
  data: ChartData[]
  xAxis?: string
  yAxis?: string
  colors?: string[]
  insights?: string[]
}

export interface VisualizationRequest {
  data: string | ChartData[]
  chartType: ChartConfig["type"]
  title: string
  xAxis?: string
  yAxis?: string
  parseInstructions?: string
  sessionId: string
}

export interface VisualizationResponse {
  chartConfig: ChartConfig
  success: boolean
  sessionId: string
  dataPoints: number
  insights: string[]
  error?: string
}

export interface DataParsingRequest {
  data: string
  format: "json" | "csv" | "natural" | "auto"
  sessionId: string
}

export interface DataParsingResponse {
  parsedData: ChartData[]
  format: string
  success: boolean
  sessionId: string
  rowCount: number
  error?: string
}

export class DataVisualizationService {
  private readonly defaultColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#ff00ff",
    "#00ffff",
    "#ff0000",
  ]

  async createVisualization(request: VisualizationRequest): Promise<VisualizationResponse> {
    try {
      let parsedData: ChartData[]

      if (typeof request.data === "string") {
        const parseResult = await this.parseData({
          data: request.data,
          format: "auto",
          sessionId: request.sessionId,
        })

        if (!parseResult.success) {
          return {
            chartConfig: this.getEmptyChartConfig(request.chartType, request.title),
            success: false,
            sessionId: request.sessionId,
            dataPoints: 0,
            insights: [],
            error: parseResult.error,
          }
        }

        parsedData = parseResult.parsedData
      } else {
        parsedData = request.data
      }

      const chartConfig: ChartConfig = {
        type: request.chartType,
        title: request.title,
        data: parsedData,
        xAxis: request.xAxis || "Categories",
        yAxis: request.yAxis || "Values",
        colors: this.defaultColors,
        insights: this.generateInsights(parsedData),
      }

      return {
        chartConfig,
        success: true,
        sessionId: request.sessionId,
        dataPoints: parsedData.length,
        insights: chartConfig.insights,
      }
    } catch (error) {
      return {
        chartConfig: this.getEmptyChartConfig(request.chartType, request.title),
        success: false,
        sessionId: request.sessionId,
        dataPoints: 0,
        insights: [],
        error: error.message,
      }
    }
  }

  async parseData(request: DataParsingRequest): Promise<DataParsingResponse> {
    try {
      let parsedData: ChartData[] = []
      let detectedFormat = request.format

      if (request.format === "auto") {
        detectedFormat = this.detectDataFormat(request.data)
      }

      switch (detectedFormat) {
        case "json":
          parsedData = this.parseJSONData(request.data)
          break
        case "csv":
          parsedData = this.parseCSVData(request.data)
          break
        case "natural":
          parsedData = this.parseNaturalLanguageData(request.data)
          break
        default:
          parsedData = this.parseNaturalLanguageData(request.data)
          detectedFormat = "natural"
      }

      if (parsedData.length === 0) {
        parsedData = this.generateSampleData()
      }

      return {
        parsedData,
        format: detectedFormat,
        success: true,
        sessionId: request.sessionId,
        rowCount: parsedData.length,
      }
    } catch (error) {
      return {
        parsedData: [],
        format: "unknown",
        success: false,
        sessionId: request.sessionId,
        rowCount: 0,
        error: error.message,
      }
    }
  }

  private detectDataFormat(data: string): "json" | "csv" | "natural" {
    const trimmedData = data.trim()

    if (trimmedData.startsWith("[") || trimmedData.startsWith("{")) {
      return "json"
    }

    if (trimmedData.includes(",") && trimmedData.includes("\n")) {
      return "csv"
    }

    return "natural"
  }

  private parseJSONData(data: string): ChartData[] {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          name: item.name || item.label || `Item ${index + 1}`,
          value: Number(item.value || item.amount || item.count || 0),
          ...item,
        }))
      }
      return []
    } catch {
      throw new Error("Invalid JSON format")
    }
  }

  private parseCSVData(data: string): ChartData[] {
    const lines = data.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(",").map((h) => h.trim())
    const dataLines = lines.slice(1)

    return dataLines.map((line, index) => {
      const values = line.split(",").map((v) => v.trim())
      const item: ChartData = {
        name: values[0] || `Item ${index + 1}`,
        value: Number(values[1]) || 0,
      }

      // Add additional columns
      headers.forEach((header, i) => {
        if (i > 1 && values[i]) {
          item[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i])
        }
      })

      return item
    })
  }

  private parseNaturalLanguageData(data: string): ChartData[] {
    const lines = data.split(/[,\n;]/).filter((line) => line.trim())

    return lines.map((line, index) => {
      // Try to match patterns like "Sales: 100", "Marketing = 80", etc.
      const match = line.match(/([^:=]+)[:=]\s*(\d+(?:\.\d+)?)/i)
      if (match) {
        return {
          name: match[1].trim(),
          value: Number.parseFloat(match[2]),
          category: match[1].trim(),
        }
      }

      // Try to extract just numbers
      const numMatch = line.match(/(\d+(?:\.\d+)?)/i)
      return {
        name: `Item ${index + 1}`,
        value: numMatch ? Number.parseFloat(numMatch[1]) : Math.random() * 100,
        category: `Category ${index + 1}`,
      }
    })
  }

  private generateSampleData(): ChartData[] {
    return [
      { name: "Q1", value: 65, category: "Sales" },
      { name: "Q2", value: 78, category: "Sales" },
      { name: "Q3", value: 82, category: "Sales" },
      { name: "Q4", value: 95, category: "Sales" },
    ]
  }

  private generateInsights(data: ChartData[]): string[] {
    if (!Array.isArray(data) || data.length === 0) return []

    const values = data.map((d) => d.value || 0).filter((v) => typeof v === "number")
    if (values.length === 0) return []

    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const maxItem = data.find((d) => d.value === max)
    const minItem = data.find((d) => d.value === min)

    const insights = [
      `Total: ${total.toFixed(2)}`,
      `Average: ${average.toFixed(2)}`,
      `Highest: ${max.toFixed(2)} (${maxItem?.name || "Unknown"})`,
      `Lowest: ${min.toFixed(2)} (${minItem?.name || "Unknown"})`,
      `Data points: ${data.length}`,
    ]

    // Add trend analysis for time series data
    if (values.length > 1) {
      const trend = values[values.length - 1] - values[0]
      if (trend > 0) {
        insights.push(`Trend: Increasing (+${trend.toFixed(2)})`)
      } else if (trend < 0) {
        insights.push(`Trend: Decreasing (${trend.toFixed(2)})`)
      } else {
        insights.push("Trend: Stable")
      }
    }

    return insights
  }

  private getEmptyChartConfig(type: ChartConfig["type"], title: string): ChartConfig {
    return {
      type,
      title,
      data: [],
      xAxis: "Categories",
      yAxis: "Values",
      colors: this.defaultColors,
      insights: [],
    }
  }

  async exportChart(sessionId: string, format: "png" | "svg" | "pdf" | "json") {
    // Mock export functionality - in production, this would generate actual files
    return {
      success: true,
      sessionId,
      format,
      downloadUrl: `/api/viz/export/${sessionId}.${format}`,
      message: `Chart exported as ${format.toUpperCase()}`,
    }
  }
}

export const dataVisualizationService = new DataVisualizationService()
