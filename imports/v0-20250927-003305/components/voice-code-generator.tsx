"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Code, Zap, Copy, Download } from "lucide-react"
import { voiceAIIntegration, type VoiceAIResult } from "@/lib/voice-ai-integration"
import CodePreview from "@/components/code-preview"

export function VoiceCodeGenerator() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [voiceResult, setVoiceResult] = useState<VoiceAIResult | null>(null)
  const [codeHistory, setCodeHistory] = useState<
    Array<{
      transcript: string
      code: string
      timestamp: number
    }>
  >([])

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Load code history from localStorage
    const stored = localStorage.getItem("voiceCodeHistory")
    if (stored) {
      setCodeHistory(JSON.parse(stored))
    }
  }, [])

  const saveCodeHistory = (newEntry: { transcript: string; code: string; timestamp: number }) => {
    const updated = [...codeHistory, newEntry].slice(-10) // Keep last 10 entries
    setCodeHistory(updated)
    localStorage.setItem("voiceCodeHistory", JSON.stringify(updated))
  }

  const startVoiceCodeGeneration = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    setIsListening(true)
    setTranscript("")

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error("Failed to start voice recognition:", error)
      setIsListening(false)
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const generateCodeFromVoice = async () => {
    if (!transcript.trim()) return

    setIsProcessing(true)

    try {
      // Process with Voice AI Integration
      const result = await voiceAIIntegration.processVoiceInput(transcript)
      setVoiceResult(result)

      // Generate code using the existing API
      const response = await fetch("/api/generate-frontend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: transcript,
          voiceGenerated: true,
          voiceCharacteristics: result.voiceResult,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const code = data.frontendCode || "// Code generation failed"

      setGeneratedCode(code)

      // Save to history
      saveCodeHistory({
        transcript,
        code,
        timestamp: Date.now(),
      })

      // Provide voice feedback
      await voiceAIIntegration.generateVoiceResponse(
        `I've generated the code based on your request: "${transcript}". The code is now ready for you to review.`,
        result.voicePersonality,
      )
    } catch (error) {
      console.error("Code generation error:", error)
      setGeneratedCode("// Error generating code. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "voice-generated-code.tsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Voice Code Generator
          </CardTitle>
          <CardDescription>Generate code using natural language voice commands with AI assistance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Input Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={isListening ? stopVoiceInput : startVoiceCodeGeneration}
              disabled={isProcessing}
              size="lg"
              className="flex items-center gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Voice Input
                </>
              )}
            </Button>

            <Button
              onClick={generateCodeFromVoice}
              disabled={!transcript.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {isProcessing ? "Generating..." : "Generate Code"}
            </Button>
          </div>

          {/* Live Transcript */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Voice Input</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">"{transcript}"</p>
                {isListening && (
                  <Badge variant="secondary" className="mt-2 animate-pulse">
                    Listening...
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voice Analysis Results */}
          {voiceResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Voice Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Confidence: {Math.round(voiceResult.voiceResult.confidence * 100)}%</Badge>
                  {voiceResult.voiceResult.emotion && (
                    <Badge variant="outline">Emotion: {voiceResult.voiceResult.emotion}</Badge>
                  )}
                  {voiceResult.voiceResult.intent && (
                    <Badge variant="outline">Intent: {voiceResult.voiceResult.intent}</Badge>
                  )}
                  {voiceResult.voiceResult.language && (
                    <Badge variant="outline">Language: {voiceResult.voiceResult.language}</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">AI Response:</p>
                  <p className="text-sm text-muted-foreground">{voiceResult.aiResponse.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Input Fallback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or type your request:</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Describe the code you want to generate..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Generated Code Display */}
      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Code</span>
              <div className="flex gap-2">
                <Button onClick={copyCode} size="sm" variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button onClick={downloadCode} size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodePreview code={generatedCode} />
          </CardContent>
        </Card>
      )}

      {/* Code History */}
      {codeHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Voice-Generated Code</CardTitle>
            <CardDescription>Your last 10 voice code generation sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {codeHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">"{entry.transcript}"</p>
                      <Badge variant="outline" className="text-xs">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <pre className="text-xs overflow-x-auto">
                        <code>{entry.code.substring(0, 200)}...</code>
                      </pre>
                    </div>
                    <Button onClick={() => setGeneratedCode(entry.code)} size="sm" variant="ghost" className="mt-2">
                      Load Full Code
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
