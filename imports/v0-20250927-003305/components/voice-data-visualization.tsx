"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useVoiceRecognition } from "@/hooks/use-voice-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { Mic, MicOff, RefreshCw } from "lucide-react"

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface ChartConfig {
  type: "bar" | "line" | "pie" | "area" | "scatter"
  title: string
  data: ChartData[]
  xKey?: string
  yKey?: string
  colors?: string[]
}

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff", "#00ffff"]

const SAMPLE_DATA_SETS = {
  sales: [
    { name: "Jan", value: 4000, sales: 4000, profit: 2400 },
    { name: "Feb", value: 3000, sales: 3000, profit: 1398 },
    { name: "Mar", value: 2000, sales: 2000, profit: 9800 },
    { name: "Apr", value: 2780, sales: 2780, profit: 3908 },
    { name: "May", value: 1890, sales: 1890, profit: 4800 },
    { name: "Jun", value: 2390, sales: 2390, profit: 3800 },
  ],
  expenses: [
    { name: "Marketing", value: 30 },
    { name: "Development", value: 25 },
    { name: "Operations", value: 20 },
    { name: "Support", value: 15 },
    { name: "Other", value: 10 },
  ],
  performance: [
    { name: "Week 1", value: 85, performance: 85, target: 90 },
    { name: "Week 2", value: 92, performance: 92, target: 90 },
    { name: "Week 3", value: 78, performance: 78, target: 90 },
    { name: "Week 4", value: 95, performance: 95, target: 90 },
  ],
}

export function VoiceDataVisualization() {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "bar",
    title: "Sample Data",
    data: SAMPLE_DATA_SETS.sales,
  })
  const [customData, setCustomData] = useState("")
  const [isListeningForData, setIsListeningForData] = useState(false)
  const [voiceCommand, setVoiceCommand] = useState("")

  const { speak } = useTextToSpeech()

  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition({
    onResult: (text, isFinal) => {
      if (isFinal) {
        handleVoiceCommand(text)
      }
    },
  })

  const handleVoiceCommand = (command: string) => {
    console.log("[v0] Processing visualization command:", command)
    setVoiceCommand(command)

    const lowerCommand = command.toLowerCase()

    // Chart type detection
    if (lowerCommand.includes("bar chart") || lowerCommand.includes("bar graph")) {
      updateChart("bar", "Bar Chart from Voice Command")
      speak("Creating bar chart visualization")
    } else if (lowerCommand.includes("line chart") || lowerCommand.includes("line graph")) {
      updateChart("line", "Line Chart from Voice Command")
      speak("Creating line chart visualization")
    } else if (lowerCommand.includes("pie chart") || lowerCommand.includes("pie graph")) {
      updateChart("pie", "Pie Chart from Voice Command")
      speak("Creating pie chart visualization")
    } else if (lowerCommand.includes("area chart") || lowerCommand.includes("area graph")) {
      updateChart("area", "Area Chart from Voice Command")
      speak("Creating area chart visualization")
    } else if (lowerCommand.includes("scatter plot") || lowerCommand.includes("scatter chart")) {
      updateChart("scatter", "Scatter Plot from Voice Command")
      speak("Creating scatter plot visualization")
    }

    // Data set detection
    if (lowerCommand.includes("sales") || lowerCommand.includes("revenue")) {
      setChartConfig((prev) => ({ ...prev, data: SAMPLE_DATA_SETS.sales, title: "Sales Data Visualization" }))
      speak("Loading sales data")
    } else if (lowerCommand.includes("expense") || lowerCommand.includes("cost")) {
      setChartConfig((prev) => ({ ...prev, data: SAMPLE_DATA_SETS.expenses, title: "Expense Breakdown" }))
      speak("Loading expense data")
    } else if (lowerCommand.includes("performance") || lowerCommand.includes("metric")) {
      setChartConfig((prev) => ({ ...prev, data: SAMPLE_DATA_SETS.performance, title: "Performance Metrics" }))
      speak("Loading performance data")
    }

    // Custom data input
    if (lowerCommand.includes("custom data") || lowerCommand.includes("my data")) {
      setIsListeningForData(true)
      speak("Please provide your custom data. Say the values you want to visualize.")
    }
  }

  const updateChart = (type: ChartConfig["type"], title: string) => {
    setChartConfig((prev) => ({ ...prev, type, title }))
  }

  const parseCustomData = (dataString: string) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(dataString)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // If JSON parsing fails, try to parse as simple key-value pairs
      const lines = dataString.split("\n").filter((line) => line.trim())
      const data = lines.map((line, index) => {
        const parts = line.split(/[,:=]/).map((p) => p.trim())
        if (parts.length >= 2) {
          return {
            name: parts[0],
            value: Number.parseFloat(parts[1]) || 0,
          }
        }
        return { name: `Item ${index + 1}`, value: 0 }
      })
      return data.length > 0 ? data : SAMPLE_DATA_SETS.sales
    }
    return SAMPLE_DATA_SETS.sales
  }

  const applyCustomData = () => {
    if (customData.trim()) {
      const parsedData = parseCustomData(customData)
      setChartConfig((prev) => ({
        ...prev,
        data: parsedData,
        title: "Custom Data Visualization",
      }))
      speak("Custom data applied to chart")
    }
  }

  const renderChart = () => {
    const { type, data, title } = chartConfig

    const commonProps = {
      width: "100%",
      height: 300,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={CHART_COLORS[0]} />
              {data[0]?.sales && <Bar dataKey="sales" fill={CHART_COLORS[1]} />}
              {data[0]?.profit && <Bar dataKey="profit" fill={CHART_COLORS[2]} />}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} />
              {data[0]?.performance && (
                <Line type="monotone" dataKey="performance" stroke={CHART_COLORS[1]} strokeWidth={2} />
              )}
              {data[0]?.target && (
                <Line type="monotone" dataKey="target" stroke={CHART_COLORS[2]} strokeWidth={2} strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stackId="1" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} />
              {data[0]?.sales && (
                <Area type="monotone" dataKey="sales" stackId="1" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={data}>
              <CartesianGrid />
              <XAxis dataKey="value" type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter dataKey="value" fill={CHART_COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Voice-Enabled Data Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="font-medium">{isListening ? "Listening for chart commands..." : "Voice Ready"}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant={isListening ? "destructive" : "secondary"}>{isListening ? "Recording" : "Standby"}</Badge>
            </div>
          </div>

          {/* Voice Commands */}
          <div className="flex gap-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Voice Commands
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                resetTranscript()
                setVoiceCommand("")
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Current Voice Command */}
          {voiceCommand && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Last Voice Command:</p>
              <p className="text-sm font-mono">{voiceCommand}</p>
            </div>
          )}

          {/* Voice Command Examples */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="font-medium mb-2">Try these voice commands:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-primary">Chart Types:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>"Create a bar chart"</li>
                  <li>"Show me a line graph"</li>
                  <li>"Make a pie chart"</li>
                  <li>"Generate area chart"</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-primary">Data Sets:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>"Show sales data"</li>
                  <li>"Display expenses"</li>
                  <li>"Load performance metrics"</li>
                  <li>"Use custom data"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{chartConfig.title}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{chartConfig.type} chart</Badge>
              <Badge variant="secondary">{chartConfig.data.length} data points</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">{renderChart()}</div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Chart Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select
                value={chartConfig.type}
                onValueChange={(value: ChartConfig["type"]) => setChartConfig((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sample Data</label>
              <Select
                onValueChange={(value: keyof typeof SAMPLE_DATA_SETS) =>
                  setChartConfig((prev) => ({
                    ...prev,
                    data: SAMPLE_DATA_SETS[value],
                    title: `${value.charAt(0).toUpperCase() + value.slice(1)} Data`,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Data</SelectItem>
                  <SelectItem value="expenses">Expense Data</SelectItem>
                  <SelectItem value="performance">Performance Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() =>
                  speak(
                    `Currently displaying a ${chartConfig.type} chart with ${chartConfig.data.length} data points titled ${chartConfig.title}`,
                  )
                }
                variant="outline"
                className="w-full"
              >
                Describe Chart
              </Button>
            </div>
          </div>

          {/* Custom Data Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Custom Data (JSON or Key:Value format)</label>
            <Textarea
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder={`Enter data as JSON or simple format like:
Sales: 100
Marketing: 80
Development: 120`}
              className="min-h-[100px]"
            />
            <Button onClick={applyCustomData} disabled={!customData.trim()} className="mt-2">
              Apply Custom Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
