"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, VolumeX, Settings, Mic, MessageSquare } from "lucide-react"

interface VoiceSettings {
  enabled: boolean
  rate: number
  pitch: number
  volume: number
  voice: string
  language: string
}

interface VoiceResponseSystemProps {
  onSettingsChange?: (settings: VoiceSettings) => void
}

export function VoiceResponseSystem({ onSettingsChange }: VoiceResponseSystemProps) {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    voice: "default",
    language: "en-US",
  })
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [responseHistory, setResponseHistory] = useState<
    Array<{
      text: string
      timestamp: Date
      type: string
    }>
  >([])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const updateSettings = useCallback(
    (newSettings: Partial<VoiceSettings>) => {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      onSettingsChange?.(updatedSettings)
    },
    [settings, onSettingsChange],
  )

  const speakText = useCallback(
    (text: string, type = "general") => {
      if (!settings.enabled || !text.trim()) return

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)

      // Apply settings
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      utterance.volume = settings.volume
      utterance.lang = settings.language

      // Set voice if available
      if (settings.voice !== "default") {
        const selectedVoice = availableVoices.find((voice) => voice.name === settings.voice)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      // Add to history
      setResponseHistory((prev) => [
        {
          text,
          timestamp: new Date(),
          type,
        },
        ...prev.slice(0, 9),
      ]) // Keep last 10 responses

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechSynthesis.speak(utterance)
    },
    [settings, availableVoices],
  )

  const testVoice = useCallback(() => {
    const testMessages = [
      "Hello! I'm your Cognomega AI assistant. I can help you with data visualization, translation, image analysis, and report generation.",
      "Voice response system is working perfectly. You can adjust my speaking rate, pitch, and volume to your preference.",
      "I'm ready to assist you with any voice-enabled tasks. Just speak your commands and I'll respond accordingly.",
    ]
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)]
    speakText(randomMessage, "test")
  }, [speakText])

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // Enhanced response templates for different contexts
  const getContextualResponse = useCallback((context: string, data?: any) => {
    const responses = {
      dataVisualization: [
        `I've created your ${data?.chartType || "chart"} visualization with ${data?.dataPoints || "multiple"} data points.`,
        `Your ${data?.chartType || "chart"} is ready! The data shows interesting patterns that might be worth exploring further.`,
        `Data visualization complete. I've generated a ${data?.chartType || "chart"} that clearly displays your information.`,
      ],
      translation: [
        `Translation complete! I've translated your text to ${data?.targetLanguage || "the target language"} with ${Math.round((data?.confidence || 0.9) * 100)}% confidence.`,
        `Here's your translation in ${data?.targetLanguage || "the target language"}. The translation maintains the original meaning and context.`,
        `I've successfully translated your text. The ${data?.formality || "standard"} tone has been preserved in the translation.`,
      ],
      visionAnalysis: [
        `Image analysis complete! I can see ${data?.objects?.length || "several"} objects in this image with ${Math.round((data?.confidence || 0.9) * 100)}% confidence.`,
        `I've analyzed your image and found interesting details. The scene appears to be ${data?.description || "well-composed and clear"}.`,
        `Vision analysis finished. I've identified key elements and can provide detailed insights about what I observe.`,
      ],
      reportGeneration: [
        `Your ${data?.reportType || "report"} has been generated successfully with ${data?.wordCount || "comprehensive"} content.`,
        `Report generation complete! I've created a detailed ${data?.reportType || "analysis"} based on your input data.`,
        `I've finished generating your report. It includes comprehensive analysis and actionable recommendations.`,
      ],
      general: [
        "I'm here to help with any voice-enabled tasks. What would you like me to assist you with?",
        "Ready to help! You can ask me to create charts, translate text, analyze images, or generate reports.",
        "How can I assist you today? I have advanced capabilities in data visualization, translation, vision analysis, and report generation.",
      ],
    }

    const contextResponses = responses[context as keyof typeof responses] || responses.general
    return contextResponses[Math.floor(Math.random() * contextResponses.length)]
  }, [])

  // Expose the speak function globally for other components
  useEffect(() => {
    ;(window as any).cognomegaSpeak = speakText(window as any).cognomegaGetContextualResponse = getContextualResponse
  }, [speakText, getContextualResponse])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Response System
          {isSpeaking && (
            <Badge variant="secondary" className="ml-auto">
              Speaking...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            variant={settings.enabled ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {settings.enabled ? "Voice On" : "Voice Off"}
          </Button>

          <Button
            onClick={testVoice}
            disabled={!settings.enabled}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Mic className="h-4 w-4" />
            Test Voice
          </Button>

          {isSpeaking && (
            <Button onClick={stopSpeaking} variant="destructive" className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              Stop
            </Button>
          )}
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Voice Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={settings.voice} onValueChange={(value) => updateSettings({ voice: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Voice</SelectItem>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={settings.language} onValueChange={(value) => updateSettings({ language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="es-ES">Spanish</SelectItem>
                  <SelectItem value="fr-FR">French</SelectItem>
                  <SelectItem value="de-DE">German</SelectItem>
                  <SelectItem value="it-IT">Italian</SelectItem>
                  <SelectItem value="pt-BR">Portuguese</SelectItem>
                  <SelectItem value="ja-JP">Japanese</SelectItem>
                  <SelectItem value="ko-KR">Korean</SelectItem>
                  <SelectItem value="zh-CN">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice Parameters */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Speaking Rate: {settings.rate.toFixed(1)}x</label>
              <Slider
                value={[settings.rate]}
                onValueChange={([value]) => updateSettings({ rate: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pitch: {settings.pitch.toFixed(1)}</label>
              <Slider
                value={[settings.pitch]}
                onValueChange={([value]) => updateSettings({ pitch: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Volume: {Math.round(settings.volume * 100)}%</label>
              <Slider
                value={[settings.volume]}
                onValueChange={([value]) => updateSettings({ volume: value })}
                min={0.0}
                max={1.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Response History */}
        {responseHistory.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Responses
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {responseHistory.map((response, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {response.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{response.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm">
                    {response.text.length > 100 ? `${response.text.substring(0, 100)}...` : response.text}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => speakText(response.text, response.type)}
                    className="mt-1 h-6 px-2 text-xs"
                  >
                    Replay
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Response Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Smart Responses</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Context-aware voice feedback</li>
              <li>• Automatic response generation</li>
              <li>• Multi-language support</li>
              <li>• Customizable voice parameters</li>
              <li>• Response history tracking</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">Integration</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Works with all AI features</li>
              <li>• Real-time voice synthesis</li>
              <li>• Intelligent response timing</li>
              <li>• Cross-component compatibility</li>
              <li>• Accessibility optimized</li>
            </ul>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
