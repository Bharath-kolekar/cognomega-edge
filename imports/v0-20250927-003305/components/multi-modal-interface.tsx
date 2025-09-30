"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Camera, CameraOff, Hand, Eye, Brain, Zap, Volume2, VolumeX } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"
import { semanticNLPEngine } from "@/lib/semantic-nlp-engine"
import { contextualMemory } from "@/lib/contextual-memory"
import { predictiveAI } from "@/lib/predictive-ai"

interface MultiModalInput {
  text?: string
  voice?: {
    transcript: string
    confidence: number
    emotion: string
    intent: string
  }
  visual?: {
    imageData: string
    objects: Array<{ name: string; confidence: number; bbox: number[] }>
    text: string[]
    faces: Array<{ emotion: string; age: number; gender: string }>
  }
  gesture?: {
    type: "swipe" | "tap" | "pinch" | "rotate" | "hover"
    direction?: string
    intensity: number
    duration: number
  }
  context?: {
    timestamp: number
    location?: { x: number; y: number }
    deviceOrientation?: string
    ambientLight?: number
  }
}

interface AIResponse {
  text: string
  voice?: {
    speech: string
    tone: "friendly" | "professional" | "excited" | "calm"
    speed: number
  }
  visual?: {
    type: "chart" | "diagram" | "image" | "animation"
    data: any
  }
  actions?: Array<{
    type: string
    label: string
    callback: () => void
  }>
  predictions?: Array<{
    title: string
    confidence: number
    action: string
  }>
}

export function MultiModalInterface() {
  const [isListening, setIsListening] = useState(false)
  const [isCameraActive, setCameraActive] = useState(false)
  const [isGestureActive, setGestureActive] = useState(false)
  const [currentInput, setCurrentInput] = useState<MultiModalInput>({})
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [processingMode, setProcessingMode] = useState<"text" | "voice" | "visual" | "gesture" | "multi">("text")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureRef = useRef<HTMLDivElement>(null)
  const speechSynthesis = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthesis.current = window.speechSynthesis
    }
  }, [])

  // Voice Recognition Handler
  const handleVoiceInput = useCallback(async () => {
    if (!isListening) {
      setIsListening(true)
      setProcessingMode("voice")

      try {
        const result = await advancedVoiceEngine.startListening({
          continuous: true,
          interimResults: true,
          language: "en-US",
        })

        if (result.transcript) {
          const voiceData = {
            transcript: result.transcript,
            confidence: result.confidence,
            emotion: result.emotion || "neutral",
            intent: result.intent || "unknown",
          }

          setCurrentInput((prev) => ({ ...prev, voice: voiceData }))
          await processMultiModalInput({ voice: voiceData })
        }
      } catch (error) {
        console.error("Voice recognition error:", error)
      } finally {
        setIsListening(false)
      }
    } else {
      advancedVoiceEngine.stopListening()
      setIsListening(false)
    }
  }, [isListening])

  // Camera/Visual Input Handler
  const handleVisualInput = useCallback(async () => {
    if (!isCameraActive) {
      setCameraActive(true)
      setProcessingMode("visual")

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        // Capture frame every 2 seconds for analysis
        const captureInterval = setInterval(async () => {
          if (canvasRef.current && videoRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            const ctx = canvas.getContext("2d")

            if (ctx) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0)

              const imageData = canvas.toDataURL("image/jpeg", 0.8)
              const visualData = await analyzeVisualInput(imageData)

              setCurrentInput((prev) => ({ ...prev, visual: visualData }))
              await processMultiModalInput({ visual: visualData })
            }
          }
        }, 2000)

        // Store interval for cleanup
        return () => {
          clearInterval(captureInterval)
          stream.getTracks().forEach((track) => track.stop())
        }
      } catch (error) {
        console.error("Camera access error:", error)
        setCameraActive(false)
      }
    } else {
      setCameraActive(false)
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isCameraActive])

  // Gesture Recognition Handler
  const handleGestureInput = useCallback(() => {
    if (!isGestureActive) {
      setGestureActive(true)
      setProcessingMode("gesture")

      const gestureElement = gestureRef.current
      if (!gestureElement) return

      let startTime: number
      let startPosition: { x: number; y: number }

      const handleTouchStart = (e: TouchEvent) => {
        startTime = Date.now()
        startPosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        }
      }

      const handleTouchEnd = async (e: TouchEvent) => {
        const endTime = Date.now()
        const endPosition = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        }

        const duration = endTime - startTime
        const deltaX = endPosition.x - startPosition.x
        const deltaY = endPosition.y - startPosition.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        let gestureType: MultiModalInput["gesture"]["type"] = "tap"
        let direction = ""
        const intensity = distance / 100

        if (distance > 50) {
          gestureType = "swipe"
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? "right" : "left"
          } else {
            direction = deltaY > 0 ? "down" : "up"
          }
        }

        const gestureData = {
          type: gestureType,
          direction,
          intensity: Math.min(intensity, 1),
          duration,
        }

        setCurrentInput((prev) => ({ ...prev, gesture: gestureData }))
        await processMultiModalInput({ gesture: gestureData })
      }

      gestureElement.addEventListener("touchstart", handleTouchStart)
      gestureElement.addEventListener("touchend", handleTouchEnd)

      return () => {
        gestureElement.removeEventListener("touchstart", handleTouchStart)
        gestureElement.removeEventListener("touchend", handleTouchEnd)
      }
    } else {
      setGestureActive(false)
    }
  }, [isGestureActive])

  // Text Input Handler
  const handleTextInput = useCallback(async (text: string) => {
    setCurrentInput((prev) => ({ ...prev, text }))
    if (text.trim()) {
      await processMultiModalInput({ text })
    }
  }, [])

  // Multi-Modal Processing
  const processMultiModalInput = useCallback(
    async (input: MultiModalInput) => {
      setIsProcessing(true)

      try {
        // Combine all input modalities
        const combinedInput = { ...currentInput, ...input }

        // Add context information
        combinedInput.context = {
          timestamp: Date.now(),
          location: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          deviceOrientation: screen.orientation?.type || "unknown",
          ambientLight: 0.5, // Would be from ambient light sensor if available
        }

        // Process through NLP for intent understanding
        let processedText = ""
        if (combinedInput.text) {
          processedText = combinedInput.text
        } else if (combinedInput.voice?.transcript) {
          processedText = combinedInput.voice.transcript
        } else if (combinedInput.visual?.text?.length) {
          processedText = combinedInput.visual.text.join(" ")
        }

        const nlpResult = await semanticNLPEngine.processText(processedText)

        // Get contextual memory insights
        const memoryInsights = contextualMemory.getContextualInsights(processedText)

        // Get predictive suggestions
        const predictions = await predictiveAI.generatePredictions({
          currentInput: processedText,
          recentActions: ["input_received"],
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          userMood: (combinedInput.voice?.emotion as any) || "neutral",
          sessionDuration: Date.now() - (Date.now() - 60000), // Simplified
          lastInteractionTime: Date.now() - 1000,
        })

        // Calculate confidence score
        const confidence = calculateOverallConfidence(combinedInput, nlpResult)
        setConfidenceScore(confidence)

        // Generate AI response
        const response = await generateAIResponse(combinedInput, nlpResult, memoryInsights, predictions)
        setAiResponse(response)

        // Store interaction in memory
        contextualMemory.addMemory(
          "interaction",
          { input: combinedInput, response, nlpResult },
          confidence,
          nlpResult.entities.map((e) => e.label),
        )

        // Provide voice feedback if requested
        if (response.voice && !isSpeaking) {
          await speakResponse(response.voice)
        }
      } catch (error) {
        console.error("Multi-modal processing error:", error)
        setAiResponse({
          text: "I encountered an error processing your input. Please try again.",
          voice: {
            speech: "Sorry, I had trouble understanding that. Could you try again?",
            tone: "calm",
            speed: 1,
          },
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [currentInput, isSpeaking],
  )

  // Visual Analysis (simplified - would use actual computer vision APIs)
  const analyzeVisualInput = async (imageData: string): Promise<MultiModalInput["visual"]> => {
    // This would integrate with actual computer vision services
    return {
      imageData,
      objects: [
        { name: "person", confidence: 0.95, bbox: [100, 100, 200, 300] },
        { name: "laptop", confidence: 0.87, bbox: [250, 150, 400, 250] },
      ],
      text: ["Hello World", "Code Example"],
      faces: [{ emotion: "focused", age: 30, gender: "unknown" }],
    }
  }

  // Confidence Calculation
  const calculateOverallConfidence = (input: MultiModalInput, nlpResult: any): number => {
    let totalConfidence = 0
    let modalityCount = 0

    if (input.voice) {
      totalConfidence += input.voice.confidence
      modalityCount++
    }

    if (input.visual) {
      const avgObjectConfidence =
        input.visual.objects.reduce((sum, obj) => sum + obj.confidence, 0) / input.visual.objects.length
      totalConfidence += avgObjectConfidence || 0
      modalityCount++
    }

    if (input.text || input.voice?.transcript) {
      totalConfidence += nlpResult.confidence || 0.7
      modalityCount++
    }

    if (input.gesture) {
      totalConfidence += input.gesture.intensity
      modalityCount++
    }

    return modalityCount > 0 ? totalConfidence / modalityCount : 0
  }

  // AI Response Generation
  const generateAIResponse = async (
    input: MultiModalInput,
    nlpResult: any,
    memoryInsights: any,
    predictions: any[],
  ): Promise<AIResponse> => {
    let responseText = "I understand you're "

    if (nlpResult.intent === "question") {
      responseText = "Let me help you with that question. "
    } else if (nlpResult.intent === "request") {
      responseText = "I'll help you with that request. "
    } else if (nlpResult.intent === "greeting") {
      responseText = "Hello! How can I assist you today? "
    }

    // Add context from memory insights
    if (memoryInsights.recommendations.length > 0) {
      responseText += `Based on our previous interactions, ${memoryInsights.recommendations[0]}. `
    }

    // Add predictive suggestions
    const topPredictions = predictions.slice(0, 3).map((p) => ({
      title: p.title,
      confidence: p.confidence,
      action: p.suggestedAction,
    }))

    return {
      text: responseText,
      voice: {
        speech: responseText,
        tone: input.voice?.emotion === "excited" ? "excited" : "friendly",
        speed: 1,
      },
      predictions: topPredictions,
      actions: [
        {
          type: "continue",
          label: "Continue Conversation",
          callback: () => setProcessingMode("multi"),
        },
        {
          type: "clarify",
          label: "Need Clarification",
          callback: () => setProcessingMode("text"),
        },
      ],
    }
  }

  // Speech Synthesis
  const speakResponse = async (voiceResponse: AIResponse["voice"]) => {
    if (!speechSynthesis.current || !voiceResponse) return

    setIsSpeaking(true)

    const utterance = new SpeechSynthesisUtterance(voiceResponse.speech)
    utterance.rate = voiceResponse.speed
    utterance.pitch = voiceResponse.tone === "excited" ? 1.2 : 1
    utterance.volume = 0.8

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthesis.current.speak(utterance)
  }

  const stopSpeaking = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Multi-Modal AI Interface
        </h2>
        <p className="text-muted-foreground">Interact using voice, text, gestures, and visual input</p>
      </div>

      {/* Input Modality Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant={processingMode === "voice" ? "default" : "outline"}
            onClick={handleVoiceInput}
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening ? "Stop Listening" : "Voice Input"}
          </Button>

          <Button
            variant={processingMode === "visual" ? "default" : "outline"}
            onClick={handleVisualInput}
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {isCameraActive ? "Stop Camera" : "Visual Input"}
          </Button>

          <Button
            variant={processingMode === "gesture" ? "default" : "outline"}
            onClick={handleGestureInput}
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            <Hand className="w-4 h-4" />
            {isGestureActive ? "Stop Gestures" : "Gesture Input"}
          </Button>

          <Button
            variant={processingMode === "text" ? "default" : "outline"}
            onClick={() => setProcessingMode("text")}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Text Input
          </Button>

          {isSpeaking && (
            <Button variant="destructive" onClick={stopSpeaking} className="flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              Stop Speaking
            </Button>
          )}
        </div>
      </Card>

      {/* Active Input Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input */}
        {processingMode === "text" && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Text Input
            </h3>
            <Textarea
              ref={textareaRef}
              placeholder="Type your message here..."
              className="min-h-[120px]"
              onChange={(e) => handleTextInput(e.target.value)}
              disabled={isProcessing}
            />
          </Card>
        )}

        {/* Visual Input */}
        {isCameraActive && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visual Input
            </h3>
            <div className="relative">
              <video ref={videoRef} className="w-full h-48 bg-gray-100 rounded-lg object-cover" muted />
              <canvas ref={canvasRef} className="hidden" />
              {currentInput.visual && (
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {currentInput.visual.objects.map((obj, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {obj.name} ({Math.round(obj.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Gesture Input */}
        {isGestureActive && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Hand className="w-4 h-4" />
              Gesture Input
            </h3>
            <div
              ref={gestureRef}
              className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <div className="text-center text-muted-foreground">
                <Hand className="w-8 h-8 mx-auto mb-2" />
                <p>Touch and gesture here</p>
                {currentInput.gesture && (
                  <Badge className="mt-2">
                    {currentInput.gesture.type} {currentInput.gesture.direction}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-muted-foreground">Processing multi-modal input...</span>
          </div>
        </Card>
      )}

      {/* Confidence Score */}
      {confidenceScore > 0 && (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Understanding Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                  style={{ width: `${confidenceScore * 100}%` }}
                />
              </div>
              <span className="text-sm font-mono">{Math.round(confidenceScore * 100)}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* AI Response */}
      {aiResponse && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">AI Response</h3>
              {isSpeaking && (
                <Badge variant="secondary" className="animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking
                </Badge>
              )}
            </div>

            <p className="text-foreground leading-relaxed">{aiResponse.text}</p>

            {/* Predictions */}
            {aiResponse.predictions && aiResponse.predictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Suggested Actions</h4>
                <div className="grid gap-2">
                  {aiResponse.predictions.map((prediction, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{prediction.title}</p>
                        <p className="text-xs text-muted-foreground">{prediction.action}</p>
                      </div>
                      <Badge variant="outline">{Math.round(prediction.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {aiResponse.actions && (
              <div className="flex gap-2 pt-2">
                {aiResponse.actions.map((action, idx) => (
                  <Button key={idx} variant="outline" size="sm" onClick={action.callback}>
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Current Input Summary */}
      {Object.keys(currentInput).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Current Input Summary</h3>
          <div className="space-y-2 text-sm">
            {currentInput.text && (
              <div>
                <strong>Text:</strong> {currentInput.text}
              </div>
            )}
            {currentInput.voice && (
              <div>
                <strong>Voice:</strong> "{currentInput.voice.transcript}" (Emotion: {currentInput.voice.emotion})
              </div>
            )}
            {currentInput.visual && (
              <div>
                <strong>Visual:</strong> {currentInput.visual.objects.length} objects detected
              </div>
            )}
            {currentInput.gesture && (
              <div>
                <strong>Gesture:</strong> {currentInput.gesture.type} {currentInput.gesture.direction}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
