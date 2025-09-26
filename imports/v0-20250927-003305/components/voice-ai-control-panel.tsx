"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Brain, Zap, Settings, Volume2 } from "lucide-react"
import { voiceAIIntegration, type VoiceAISettings, type VoiceAIResult } from "@/lib/voice-ai-integration"

export function VoiceAIControlPanel() {
  const [settings, setSettings] = useState<VoiceAISettings | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [lastResult, setLastResult] = useState<VoiceAIResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const currentSettings = voiceAIIntegration.getSettings()
    setSettings(currentSettings)
  }, [])

  const handleSettingChange = (key: string, value: any) => {
    if (!settings) return

    const newSettings = { ...settings }
    const keys = key.split(".")
    let current: any = newSettings

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value

    setSettings(newSettings)
    voiceAIIntegration.updateSettings(newSettings)
  }

  const startVoiceInteraction = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    setIsListening(true)
    setIsProcessing(true)

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript
        console.log("Voice input:", transcript)

        try {
          const result = await voiceAIIntegration.processVoiceInput(transcript)
          setLastResult(result)

          // Generate voice response
          await voiceAIIntegration.generateVoiceResponse(result.aiResponse.voiceMessage, result.voicePersonality)
        } catch (error) {
          console.error("Voice AI processing error:", error)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        setIsProcessing(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setIsProcessing(false)
      }

      recognition.start()
    } catch (error) {
      console.error("Failed to start voice recognition:", error)
      setIsListening(false)
      setIsProcessing(false)
    }
  }

  const stopVoiceInteraction = () => {
    setIsListening(false)
    setIsProcessing(false)
  }

  if (!settings) {
    return <div>Loading Voice AI Control Panel...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Voice AI Control Panel
          </CardTitle>
          <CardDescription>Configure and control your advanced voice-enabled AI assistant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Interaction Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={isListening ? stopVoiceInteraction : startVoiceInteraction}
              disabled={isProcessing}
              size="lg"
              className="flex items-center gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Voice AI
                </>
              )}
            </Button>

            {isProcessing && (
              <Badge variant="secondary" className="animate-pulse">
                Processing...
              </Badge>
            )}
          </div>

          {/* Last Interaction Result */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last Voice Interaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs font-medium">Input:</Label>
                  <p className="text-sm text-muted-foreground">"{lastResult.voiceResult.transcript}"</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">AI Response:</Label>
                  <p className="text-sm text-muted-foreground">{lastResult.aiResponse.message}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Confidence: {Math.round(lastResult.voiceResult.confidence * 100)}%</Badge>
                  {lastResult.voiceResult.emotion && (
                    <Badge variant="outline">Emotion: {lastResult.voiceResult.emotion}</Badge>
                  )}
                  {lastResult.voiceResult.language && (
                    <Badge variant="outline">Language: {lastResult.voiceResult.language}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* AI Capabilities Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Capabilities
          </CardTitle>
          <CardDescription>Enable or disable specific AI features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="realtime">Real-time Transcription</Label>
              <Switch
                id="realtime"
                checked={settings.capabilities.realTimeTranscription}
                onCheckedChange={(checked) => handleSettingChange("capabilities.realTimeTranscription", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emotion">Emotion Awareness</Label>
              <Switch
                id="emotion"
                checked={settings.capabilities.emotionAwareResponses}
                onCheckedChange={(checked) => handleSettingChange("capabilities.emotionAwareResponses", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="contextual">Contextual Understanding</Label>
              <Switch
                id="contextual"
                checked={settings.capabilities.contextualUnderstanding}
                onCheckedChange={(checked) => handleSettingChange("capabilities.contextualUnderstanding", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="multilingual">Multilingual Support</Label>
              <Switch
                id="multilingual"
                checked={settings.capabilities.multilingualSupport}
                onCheckedChange={(checked) => handleSettingChange("capabilities.multilingualSupport", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="personalization">Voice Personalization</Label>
              <Switch
                id="personalization"
                checked={settings.capabilities.voicePersonalization}
                onCheckedChange={(checked) => handleSettingChange("capabilities.voicePersonalization", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="proactive">Proactive Assistance</Label>
              <Switch
                id="proactive"
                checked={settings.capabilities.proactiveAssistance}
                onCheckedChange={(checked) => handleSettingChange("capabilities.proactiveAssistance", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="codegen">Code Generation via Voice</Label>
              <Switch
                id="codegen"
                checked={settings.capabilities.codeGenerationViaVoice}
                onCheckedChange={(checked) => handleSettingChange("capabilities.codeGenerationViaVoice", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="debugging">Voice-based Debugging</Label>
              <Switch
                id="debugging"
                checked={settings.capabilities.voiceBasedDebugging}
                onCheckedChange={(checked) => handleSettingChange("capabilities.voiceBasedDebugging", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Personality
          </CardTitle>
          <CardDescription>Customize how your AI assistant behaves and responds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Assistant Name</Label>
            <input
              type="text"
              value={settings.personality.name}
              onChange={(e) => handleSettingChange("personality.name", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <Label>Response Tone</Label>
            <Select
              value={settings.personality.tone}
              onValueChange={(value) => handleSettingChange("personality.tone", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="calm">Calm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select
              value={settings.personality.responseStyle}
              onValueChange={(value) => handleSettingChange("personality.responseStyle", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Voice Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Characteristics
          </CardTitle>
          <CardDescription>Adjust the voice output settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Speech Speed: {settings.personality.voiceCharacteristics.speed}</Label>
            <Slider
              value={[settings.personality.voiceCharacteristics.speed]}
              onValueChange={([value]) => handleSettingChange("personality.voiceCharacteristics.speed", value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Voice Pitch: {settings.personality.voiceCharacteristics.pitch}</Label>
            <Slider
              value={[settings.personality.voiceCharacteristics.pitch]}
              onValueChange={([value]) => handleSettingChange("personality.voiceCharacteristics.pitch", value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Volume: {settings.personality.voiceCharacteristics.volume}</Label>
            <Slider
              value={[settings.personality.voiceCharacteristics.volume]}
              onValueChange={([value]) => handleSettingChange("personality.voiceCharacteristics.volume", value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>Configure how the AI learns and adapts to your usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="adapt">Adapt to User Style</Label>
            <Switch
              id="adapt"
              checked={settings.learningPreferences.adaptToUserStyle}
              onCheckedChange={(checked) => handleSettingChange("learningPreferences.adaptToUserStyle", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="remember">Remember Preferences</Label>
            <Switch
              id="remember"
              checked={settings.learningPreferences.rememberPreferences}
              onCheckedChange={(checked) => handleSettingChange("learningPreferences.rememberPreferences", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="improve">Improve Over Time</Label>
            <Switch
              id="improve"
              checked={settings.learningPreferences.improveOverTime}
              onCheckedChange={(checked) => handleSettingChange("learningPreferences.improveOverTime", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suggestions">Personalized Suggestions</Label>
            <Switch
              id="suggestions"
              checked={settings.learningPreferences.personalizedSuggestions}
              onCheckedChange={(checked) => handleSettingChange("learningPreferences.personalizedSuggestions", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
