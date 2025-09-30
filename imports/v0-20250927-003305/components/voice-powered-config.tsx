"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Mic, Volume2, Brain, Zap, User } from "lucide-react"

interface VoiceConfigState {
  isListening: boolean
  currentCommand: string
  configMode: "general" | "voice" | "ai" | "interface"
  pendingChanges: Record<string, any>
}

export function VoicePoweredConfig() {
  const [state, setState] = useState<VoiceConfigState>({
    isListening: false,
    currentCommand: "",
    configMode: "general",
    pendingChanges: {},
  })
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    initializeVoiceRecognition()
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  const initializeVoiceRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }

          if (finalTranscript.trim()) {
            processVoiceCommand(finalTranscript.trim())
          }
        }

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setState((prev) => ({ ...prev, isListening: false }))
        }

        recognitionInstance.onend = () => {
          setState((prev) => ({ ...prev, isListening: false }))
        }

        setRecognition(recognitionInstance)
      }
    }
  }

  const startVoiceConfig = () => {
    if (recognition && !state.isListening) {
      recognition.start()
      setState((prev) => ({ ...prev, isListening: true }))

      // Speak instructions
      const utterance = new SpeechSynthesisUtterance(
        "Voice configuration mode activated. You can now change settings using voice commands. " +
          "Try saying 'set voice speed to 1.2' or 'enable continuous listening' or 'switch to AI settings'.",
      )
      utterance.rate = 0.9
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopVoiceConfig = () => {
    if (recognition && state.isListening) {
      recognition.stop()
      setState((prev) => ({ ...prev, isListening: false }))
    }
  }

  const processVoiceCommand = useCallback((command: string) => {
    setState((prev) => ({ ...prev, currentCommand: command }))

    const lowerCommand = command.toLowerCase()
    let response = "I didn't understand that command."
    let configChanged = false

    // Voice settings commands
    if (lowerCommand.includes("voice speed") || lowerCommand.includes("speaking rate")) {
      const speedMatch = lowerCommand.match(/(\d+\.?\d*)/)
      if (speedMatch) {
        const speed = Number.parseFloat(speedMatch[1])
        if (speed >= 0.5 && speed <= 2.0) {
          updateVoiceSetting("rate", speed)
          response = `Voice speed set to ${speed}`
          configChanged = true
        }
      }
    } else if (lowerCommand.includes("voice pitch")) {
      const pitchMatch = lowerCommand.match(/(\d+\.?\d*)/)
      if (pitchMatch) {
        const pitch = Number.parseFloat(pitchMatch[1])
        if (pitch >= 0.5 && pitch <= 2.0) {
          updateVoiceSetting("pitch", pitch)
          response = `Voice pitch set to ${pitch}`
          configChanged = true
        }
      }
    } else if (lowerCommand.includes("voice volume")) {
      const volumeMatch = lowerCommand.match(/(\d+)/)
      if (volumeMatch) {
        const volume = Number.parseInt(volumeMatch[1]) / 100
        if (volume >= 0 && volume <= 1) {
          updateVoiceSetting("volume", volume)
          response = `Voice volume set to ${Math.round(volume * 100)}%`
          configChanged = true
        }
      }
    }

    // Mode switching commands
    else if (lowerCommand.includes("switch to") || lowerCommand.includes("go to")) {
      if (lowerCommand.includes("general")) {
        setState((prev) => ({ ...prev, configMode: "general" }))
        response = "Switched to general settings"
      } else if (lowerCommand.includes("voice")) {
        setState((prev) => ({ ...prev, configMode: "voice" }))
        response = "Switched to voice settings"
      } else if (lowerCommand.includes("ai") || lowerCommand.includes("artificial intelligence")) {
        setState((prev) => ({ ...prev, configMode: "ai" }))
        response = "Switched to AI settings"
      } else if (lowerCommand.includes("interface")) {
        setState((prev) => ({ ...prev, configMode: "interface" }))
        response = "Switched to interface settings"
      }
    }

    // Toggle commands
    else if (lowerCommand.includes("enable") || lowerCommand.includes("turn on")) {
      if (lowerCommand.includes("continuous listening")) {
        updateSetting("continuousListening", true)
        response = "Continuous listening enabled"
        configChanged = true
      } else if (lowerCommand.includes("wake word")) {
        updateSetting("wakeWordEnabled", true)
        response = "Wake word detection enabled"
        configChanged = true
      } else if (lowerCommand.includes("emotion detection")) {
        updateSetting("emotionDetection", true)
        response = "Emotion detection enabled"
        configChanged = true
      }
    } else if (lowerCommand.includes("disable") || lowerCommand.includes("turn off")) {
      if (lowerCommand.includes("continuous listening")) {
        updateSetting("continuousListening", false)
        response = "Continuous listening disabled"
        configChanged = true
      } else if (lowerCommand.includes("wake word")) {
        updateSetting("wakeWordEnabled", false)
        response = "Wake word detection disabled"
        configChanged = true
      } else if (lowerCommand.includes("emotion detection")) {
        updateSetting("emotionDetection", false)
        response = "Emotion detection disabled"
        configChanged = true
      }
    }

    // Assistant name commands
    else if (lowerCommand.includes("set assistant name to") || lowerCommand.includes("call me")) {
      const nameMatch = lowerCommand.match(/(?:set assistant name to|call me) (.+)/)
      if (nameMatch) {
        const name = nameMatch[1].trim()
        updateSetting("assistantName", name)
        response = `Assistant name set to ${name}`
        configChanged = true
      }
    }

    // Help commands
    else if (lowerCommand.includes("help") || lowerCommand.includes("what can i say")) {
      response =
        "You can say commands like: 'set voice speed to 1.2', 'enable continuous listening', " +
        "'switch to AI settings', 'set assistant name to Sarah', 'disable wake word detection', " +
        "'set voice volume to 80', or 'what are my current settings'"
    }

    // Status commands
    else if (lowerCommand.includes("current settings") || lowerCommand.includes("show settings")) {
      const settings = getCurrentSettings()
      response =
        `Current settings: Voice speed ${settings.rate}, pitch ${settings.pitch}, ` +
        `volume ${Math.round(settings.volume * 100)}%, assistant name ${settings.assistantName}`
    }

    // Speak the response
    const utterance = new SpeechSynthesisUtterance(response)
    utterance.rate = 0.9
    utterance.pitch = configChanged ? 1.1 : 1.0
    window.speechSynthesis.speak(utterance)

    // Clear command after processing
    setTimeout(() => {
      setState((prev) => ({ ...prev, currentCommand: "" }))
    }, 3000)
  }, [])

  const updateSetting = (key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      pendingChanges: { ...prev.pendingChanges, [key]: value },
    }))

    // Apply setting immediately
    const currentSettings = JSON.parse(localStorage.getItem("voiceSettings") || "{}")
    const newSettings = { ...currentSettings, [key]: value }
    localStorage.setItem("voiceSettings", JSON.stringify(newSettings))
  }

  const updateVoiceSetting = (key: string, value: any) => {
    const currentSettings = JSON.parse(localStorage.getItem("naturalVoiceSettings") || "{}")
    const newSettings = { ...currentSettings, [key]: value }
    localStorage.setItem("naturalVoiceSettings", JSON.stringify(newSettings))
  }

  const getCurrentSettings = () => {
    const voiceSettings = JSON.parse(localStorage.getItem("naturalVoiceSettings") || "{}")
    const generalSettings = JSON.parse(localStorage.getItem("voiceSettings") || "{}")

    return {
      rate: voiceSettings.rate || 1.0,
      pitch: voiceSettings.pitch || 1.0,
      volume: voiceSettings.volume || 0.8,
      assistantName: generalSettings.assistantName || "Assistant",
      continuousListening: generalSettings.continuousListening || false,
      wakeWordEnabled: generalSettings.wakeWordEnabled || false,
      emotionDetection: generalSettings.emotionDetection || false,
    }
  }

  const voiceCommands = [
    { command: "Set voice speed to [0.5-2.0]", example: "Set voice speed to 1.2" },
    { command: "Set voice pitch to [0.5-2.0]", example: "Set voice pitch to 1.1" },
    { command: "Set voice volume to [0-100]", example: "Set voice volume to 80" },
    { command: "Enable/Disable continuous listening", example: "Enable continuous listening" },
    { command: "Enable/Disable wake word detection", example: "Disable wake word" },
    { command: "Set assistant name to [name]", example: "Set assistant name to Sarah" },
    { command: "Switch to [general/voice/AI/interface]", example: "Switch to voice settings" },
    { command: "What are my current settings", example: "Show current settings" },
  ]

  return (
    <div className="space-y-6">
      {/* Voice Control Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice-Powered Configuration
            {state.isListening && (
              <Badge className="bg-red-500 animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                Listening
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Configure your voice assistant settings using voice commands
              </p>
              {state.currentCommand && (
                <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                  <strong>Processing:</strong> "{state.currentCommand}"
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!state.isListening ? (
                <Button onClick={startVoiceConfig} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Voice Config
                </Button>
              ) : (
                <Button onClick={stopVoiceConfig} variant="destructive" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Stop Listening
                </Button>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { id: "general", label: "General", icon: Settings },
              { id: "voice", label: "Voice", icon: Volume2 },
              { id: "ai", label: "AI", icon: Brain },
              { id: "interface", label: "Interface", icon: User },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={state.configMode === id ? "default" : "outline"}
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, configMode: id as any }))}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Available Voice Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceCommands.map((cmd, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-sm mb-1">{cmd.command}</div>
                <div className="text-xs text-muted-foreground italic">"{cmd.example}"</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const settings = getCurrentSettings()
              return [
                { label: "Voice Speed", value: `${settings.rate}x` },
                { label: "Voice Pitch", value: settings.pitch.toFixed(1) },
                { label: "Volume", value: `${Math.round(settings.volume * 100)}%` },
                { label: "Assistant", value: settings.assistantName },
              ]
            })().map((setting, index) => (
              <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">{setting.label}</div>
                <div className="font-semibold">{setting.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Voice Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { text: "Show current settings", action: () => processVoiceCommand("show current settings") },
              { text: "Enable continuous listening", action: () => processVoiceCommand("enable continuous listening") },
              { text: "Set voice speed to 1.2", action: () => processVoiceCommand("set voice speed to 1.2") },
              { text: "Switch to voice settings", action: () => processVoiceCommand("switch to voice settings") },
              { text: "Set volume to 80", action: () => processVoiceCommand("set voice volume to 80") },
              { text: "Help with commands", action: () => processVoiceCommand("help") },
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="text-xs h-auto py-2 px-3 whitespace-normal bg-transparent"
              >
                "{action.text}"
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
