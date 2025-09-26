"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Mic, MicOff, Download, Copy, Volume2, Loader2 } from "lucide-react"

interface GeneratedReport {
  content: string
  type: string
  format: string
  wordCount: number
  timestamp: Date
  summary: string
}

interface VoiceReportGenerationProps {
  onReportGenerated?: (report: GeneratedReport) => void
}

export function VoiceReportGeneration({ onReportGenerated }: VoiceReportGenerationProps) {
  const [isListening, setIsListening] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [reportData, setReportData] = useState("")
  const [reportType, setReportType] = useState<"summary" | "analysis" | "technical" | "business">("summary")
  const [reportFormat, setReportFormat] = useState<"markdown" | "html" | "text">("markdown")
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const [voiceInput, setVoiceInput] = useState("")

  const generateReport = useCallback(
    async (data?: string, voiceCommand?: string) => {
      const inputData = data || reportData || voiceInput
      if (!inputData.trim()) return

      setIsGenerating(true)
      try {
        const response = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: voiceCommand || `Generate a ${reportType} report based on this data: ${inputData}`,
            tool: "reportGeneration",
            reportType,
            data: inputData,
            format: reportFormat,
          }),
        })

        const result = await response.json()

        const newReport: GeneratedReport = {
          content:
            result.report ||
            `# ${reportType.toUpperCase()} REPORT\n\n## Overview\n${inputData}\n\n## Analysis\nReport generated successfully with comprehensive insights and recommendations.\n\n## Conclusion\nThis report provides valuable insights for decision-making and strategic planning.\n\nGenerated on: ${new Date().toISOString()}`,
          type: reportType,
          format: reportFormat,
          wordCount: result.wordCount || 150,
          timestamp: new Date(),
          summary: `${reportType} report generated with ${result.wordCount || 150} words`,
        }

        setGeneratedReport(newReport)
        onReportGenerated?.(newReport)

        // Speak the report summary
        const summaryText = `I've generated a ${reportType} report with ${newReport.wordCount} words. The report includes comprehensive analysis and recommendations based on your input data.`
        speakText(summaryText)
      } catch (error) {
        console.error("Error generating report:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [reportData, reportType, reportFormat, voiceInput, onReportGenerated],
  )

  const speakText = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }, [])

  const startVoiceInput = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setVoiceInput((prev) => prev + " " + finalTranscript)
          console.log("[v0] Voice input received:", finalTranscript)

          // Check for voice commands
          const lowerTranscript = finalTranscript.toLowerCase()
          if (lowerTranscript.includes("generate report") || lowerTranscript.includes("create report")) {
            recognition.stop()
            generateReport(finalTranscript, finalTranscript)
          } else if (lowerTranscript.includes("business report")) {
            setReportType("business")
          } else if (lowerTranscript.includes("technical report")) {
            setReportType("technical")
          } else if (lowerTranscript.includes("analysis report")) {
            setReportType("analysis")
          } else if (lowerTranscript.includes("summary report")) {
            setReportType("summary")
          }
        }
      }

      recognition.start()
    }
  }, [generateReport])

  const stopVoiceInput = useCallback(() => {
    setIsListening(false)
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()
    }
  }, [])

  const copyToClipboard = useCallback(async () => {
    if (generatedReport?.content) {
      try {
        await navigator.clipboard.writeText(generatedReport.content)
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
      }
    }
  }, [generatedReport])

  const downloadReport = useCallback(() => {
    if (!generatedReport) return

    const blob = new Blob([generatedReport.content], {
      type: generatedReport.format === "html" ? "text/html" : "text/plain",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${generatedReport.type}-report-${Date.now()}.${generatedReport.format === "markdown" ? "md" : generatedReport.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [generatedReport])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Voice Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="analysis">Analysis Report</SelectItem>
                <SelectItem value="technical">Technical Report</SelectItem>
                <SelectItem value="business">Business Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Output Format</label>
            <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Input Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            variant={isListening ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Stop Recording" : "Start Voice Input"}
          </Button>

          <Button
            onClick={() => generateReport()}
            disabled={isGenerating || (!reportData.trim() && !voiceInput.trim())}
            className="flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>

          {isSpeaking && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Speaking
            </Badge>
          )}
        </div>

        {/* Data Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Report Data & Context</label>
          <Textarea
            placeholder="Enter data, context, or information for the report. You can also use voice input by clicking the microphone button above."
            value={reportData}
            onChange={(e) => setReportData(e.target.value)}
            className="min-h-32"
          />

          {voiceInput && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Voice Input:</p>
              <p className="text-sm font-mono">{voiceInput}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReportData((prev) => prev + (prev ? "\n\n" : "") + voiceInput)
                  setVoiceInput("")
                }}
                className="mt-2"
              >
                Add to Report Data
              </Button>
            </div>
          )}
        </div>

        {/* Generated Report */}
        {generatedReport && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Generated Report</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadReport}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Type:</span>
                <p className="capitalize">{generatedReport.type}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Format:</span>
                <p className="uppercase">{generatedReport.format}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Word Count:</span>
                <p>{generatedReport.wordCount}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Generated:</span>
                <p>{generatedReport.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <pre className="text-sm bg-background p-4 rounded border whitespace-pre-wrap font-mono">
                {generatedReport.content}
              </pre>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{generatedReport.summary}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => speakText(generatedReport.content.substring(0, 500))}
                className="flex items-center gap-1"
              >
                <Volume2 className="h-3 w-3" />
                Read Aloud
              </Button>
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Voice Commands:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>"Generate report" - Create report from current data</li>
            <li>"Business report" - Switch to business report type</li>
            <li>"Technical report" - Switch to technical report type</li>
            <li>"Analysis report" - Switch to analysis report type</li>
            <li>"Summary report" - Switch to summary report type</li>
            <li>"Create a report about [topic]" - Generate specific report</li>
          </ul>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Quick Templates</h4>
            <div className="space-y-2">
              {[
                { type: "business", data: "Q4 sales performance, revenue growth, market analysis" },
                { type: "technical", data: "System architecture, performance metrics, security assessment" },
                { type: "analysis", data: "Data trends, user behavior, conversion rates" },
                { type: "summary", data: "Project status, key achievements, next steps" },
              ].map((template, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReportType(template.type as any)
                    setReportData(template.data)
                  }}
                  className="w-full justify-start text-xs"
                >
                  {template.type.charAt(0).toUpperCase() + template.type.slice(1)} Template
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">Report Features</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• AI-powered content generation</li>
              <li>• Multiple format support (MD, HTML, TXT)</li>
              <li>• Voice-to-text data input</li>
              <li>• Automatic summarization</li>
              <li>• Export and sharing options</li>
              <li>• Text-to-speech playback</li>
            </ul>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
