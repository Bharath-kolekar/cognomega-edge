"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useServiceGateway } from "@/hooks/use-service-gateway"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface VoiceInterfaceProps {
  onVoiceCommand?: (command: string) => void
  onTranscriptChange?: (transcript: string) => void
  className?: string
}

export function VoiceInterface({ onVoiceCommand, onTranscriptChange, className }: VoiceInterfaceProps) {
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<any>(null)
  const { generateSpeech, isReady, health, error: gatewayError } = useServiceGateway()

  useEffect(() => {
    const checkSupport = () => {
      const hasWebSpeech =
        typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
      const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window

      setIsSupported(hasWebSpeech || hasSpeechSynthesis)

      if (!hasWebSpeech) {
        setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.")
      }
    }

    checkSupport()
  }, [])

  const startListening = () => {
    if (typeof window === "undefined") return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition not supported")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("[v0] Voice recognition started")
      setIsListening(true)
      setError(null)
      setInterimTranscript("")
    }

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

      setInterimTranscript(interimTranscript)

      if (finalTranscript) {
        console.log("[v0] Final transcript:", finalTranscript)
        setTranscript(finalTranscript)
        setCurrentCommand(finalTranscript)
        setCommandHistory((prev) => [...prev.slice(-4), finalTranscript])
        onVoiceCommand?.(finalTranscript)
        onTranscriptChange?.(finalTranscript)

        // Auto-respond to the command
        handleAutoResponse(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error("[v0] Speech recognition error:", event.error)
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      console.log("[v0] Voice recognition ended")
      setIsListening(false)
      setInterimTranscript("")
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript("")
  }

  const handleAutoResponse = (command: string) => {
    const lowerCommand = command.toLowerCase()
    let response = ""

    if (lowerCommand.includes("hello") || lowerCommand.includes("hi")) {
      response = "Hello! I'm Cognomega AI. How can I help you today?"
    } else if (lowerCommand.includes("create") || lowerCommand.includes("build") || lowerCommand.includes("make")) {
      response = "I'd be happy to help you create something! What would you like to build?"
    } else if (
      lowerCommand.includes("chart") ||
      lowerCommand.includes("graph") ||
      lowerCommand.includes("visualization")
    ) {
      response = "I can help you create data visualizations. What type of chart would you like?"
    } else if (lowerCommand.includes("translate")) {
      response = "I can translate text between multiple languages. What would you like me to translate?"
    } else if (lowerCommand.includes("analyze") || lowerCommand.includes("image") || lowerCommand.includes("picture")) {
      response = "I can analyze images for you. Please upload an image and I'll describe what I see."
    } else if (lowerCommand.includes("help")) {
      response =
        "I can help you with data visualization, voice translation, image analysis, report generation, and more. What would you like to try?"
    } else {
      response = `I heard you say: "${command}". How can I help you with that?`
    }

    // Speak the response
    setTimeout(() => {
      handleSpeakResponse(response)
    }, 500)
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSpeakResponse = async (text: string) => {
    if (isSpeaking) {
      // Stop current speech
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    try {
      setIsSpeaking(true)

      // Use browser's built-in speech synthesis for immediate response
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 0.8

        // Try to use a pleasant voice
        const voices = window.speechSynthesis.getVoices()
        const preferredVoice = voices.find(
          (voice) => voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.lang.includes("en"),
        )
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }

        utterance.onend = () => {
          setIsSpeaking(false)
        }

        utterance.onerror = () => {
          setIsSpeaking(false)
          setError("Failed to play speech")
        }

        window.speechSynthesis.speak(utterance)
      }
    } catch (err) {
      setIsSpeaking(false)
      setError(err instanceof Error ? err.message : "Text-to-speech failed")
    }
  }

  const voiceSupported =
    isSupported &&
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window

  if (!isReady) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Initializing voice services...</p>
        </CardContent>
      </Card>
    )
  }

  if (!voiceSupported && !ttsSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Voice features require a modern browser with Web Speech API support. Please use Chrome, Edge, or Safari for
            the best experience.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-4">
        {/* Voice Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
            <span className="font-medium">{isListening ? "Listening..." : "Voice Ready"}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant={voiceSupported ? "default" : "secondary"}>STT {voiceSupported ? "ON" : "OFF"}</Badge>
            <Badge variant={ttsSupported ? "default" : "secondary"}>TTS {ttsSupported ? "ON" : "OFF"}</Badge>
          </div>
        </div>

        {/* Current Transcript */}
        {(transcript || interimTranscript) && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">{transcript ? "You said:" : "Listening..."}</p>
            <p className="text-sm">
              {transcript}
              {interimTranscript && <span className="text-muted-foreground italic"> {interimTranscript}</span>}
            </p>
          </div>
        )}

        {/* Error Display */}
        {(error || gatewayError) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error || gatewayError}</p>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleVoiceToggle}
            disabled={!voiceSupported}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="flex-1 max-w-xs"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Voice Chat
              </>
            )}
          </Button>

          <Button
            onClick={() =>
              handleSpeakResponse(
                "Hello! I'm Cognomega AI, your voice assistant. I can help with data visualization, translation, image analysis, and much more. What would you like to try?",
              )
            }
            disabled={!ttsSupported}
            variant="outline"
            size="lg"
            title="Test voice output"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Commands:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {commandHistory
                .slice()
                .reverse()
                .map((command, index) => (
                  <div key={index} className="text-xs p-2 bg-muted/50 rounded text-muted-foreground">
                    {command}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            <strong>Voice Commands You Can Try:</strong>
          </p>
          <p>• "Hello" or "Hi" - Start a conversation</p>
          <p>• "Create a chart" - Build data visualizations</p>
          <p>• "Translate hello to Spanish" - Language translation</p>
          <p>• "Help me code a website" - Get coding assistance</p>
          <p>• "What can you do?" - Learn about all features</p>
        </div>
      </CardContent>
    </Card>
  )
}
