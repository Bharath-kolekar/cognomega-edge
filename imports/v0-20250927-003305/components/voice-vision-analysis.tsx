"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Eye, Mic, MicOff, Volume2 } from "lucide-react"

interface VisionAnalysis {
  description: string
  objects: string[]
  text: string
  colors: string[]
  emotions: string[]
  confidence: number
  timestamp: Date
}

interface VoiceVisionAnalysisProps {
  onAnalysis?: (analysis: VisionAnalysis) => void
}

export function VoiceVisionAnalysis({ onAnalysis }: VoiceVisionAnalysisProps) {
  const [isListening, setIsListening] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string)
        setAnalysis(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const captureFromCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }, [])

  const takePicture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg")
      setCurrentImage(imageData)

      // Stop camera stream
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  }, [])

  const analyzeImage = useCallback(
    async (voiceCommand?: string) => {
      if (!currentImage) return

      setIsAnalyzing(true)
      try {
        const response = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: voiceCommand || "Analyze this image in detail",
            image: currentImage,
            tool: "vision_analysis",
          }),
        })

        const data = await response.json()
        const newAnalysis: VisionAnalysis = {
          description: data.description || "Image analysis completed",
          objects: data.objects || [],
          text: data.text || "",
          colors: data.colors || [],
          emotions: data.emotions || [],
          confidence: data.confidence || 0.85,
          timestamp: new Date(),
        }

        setAnalysis(newAnalysis)
        onAnalysis?.(newAnalysis)

        // Speak the analysis
        if (data.response) {
          speakText(data.response)
        }
      } catch (error) {
        console.error("Error analyzing image:", error)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [currentImage, onAnalysis],
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

  const startVoiceCommand = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase()
        console.log("[v0] Voice command received:", command)

        if (command.includes("analyze") || command.includes("describe") || command.includes("what")) {
          analyzeImage(command)
        } else if (command.includes("capture") || command.includes("take picture")) {
          takePicture()
        } else if (command.includes("camera")) {
          captureFromCamera()
        } else if (command.includes("upload")) {
          fileInputRef.current?.click()
        }
      }

      recognition.start()
    }
  }, [analyzeImage, takePicture, captureFromCamera])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Voice Vision Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Input Controls */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          <Button onClick={captureFromCamera} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Camera className="h-4 w-4" />
            Use Camera
          </Button>
          <Button
            onClick={startVoiceCommand}
            variant={isListening ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Listening..." : "Voice Command"}
          </Button>
          {isSpeaking && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Speaking
            </Badge>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {/* Camera Preview */}
        <div className="space-y-3">
          <video ref={videoRef} className="w-full max-w-md mx-auto rounded-lg border hidden" autoPlay muted />
          <canvas ref={canvasRef} className="hidden" />
          {videoRef.current?.srcObject && (
            <div className="text-center">
              <Button onClick={takePicture} className="flex items-center gap-2 mx-auto">
                <Camera className="h-4 w-4" />
                Take Picture
              </Button>
            </div>
          )}
        </div>

        {/* Current Image */}
        {currentImage && (
          <div className="space-y-3">
            <img
              src={currentImage || "/placeholder.svg"}
              alt="Image to analyze"
              className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
            />
            <div className="text-center">
              <Button onClick={() => analyzeImage()} disabled={isAnalyzing} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze Image"}
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg">Analysis Results</h3>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{analysis.description}</p>
              </div>

              {analysis.objects.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Objects Detected</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.objects.map((object, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {object}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.text && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Text Found</h4>
                  <p className="text-sm font-mono bg-background p-2 rounded border">{analysis.text}</p>
                </div>
              )}

              {analysis.colors.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.colors.map((color, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.emotions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Emotions Detected</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.emotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Confidence: {Math.round(analysis.confidence * 100)}%</span>
                <span>{analysis.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Voice Commands:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>"Analyze this image" - Perform detailed analysis</li>
            <li>"What do you see?" - Get image description</li>
            <li>"Take picture" - Capture from camera</li>
            <li>"Use camera" - Start camera preview</li>
            <li>"Upload image" - Open file picker</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
