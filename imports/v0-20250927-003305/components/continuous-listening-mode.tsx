"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Mic, MicOff, Shield, Settings, Pause, Play } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface ContinuousListeningSettings {
  enabled: boolean
  privacyMode: boolean
  sensitivity: number
  pauseOnInactivity: boolean
  inactivityTimeout: number
  wakeWords: string[]
  backgroundProcessing: boolean
}

export function ContinuousListeningMode() {
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [settings, setSettings] = useState<ContinuousListeningSettings>({
    enabled: false,
    privacyMode: true,
    sensitivity: 70,
    pauseOnInactivity: true,
    inactivityTimeout: 30,
    wakeWords: ["hey cognomega", "cognomega", "voice command"],
    backgroundProcessing: false,
  })
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [recognition, setRecognition] = useState<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition()
      newRecognition.continuous = true
      newRecognition.interimResults = true
      newRecognition.lang = "en-US"

      newRecognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const currentTranscript = finalTranscript || interimTranscript
        setCurrentTranscript(currentTranscript)
        setLastActivity(Date.now())

        if (finalTranscript) {
          handleVoiceCommand(finalTranscript)
        }
      }

      newRecognition.onerror = (event) => {
        console.error("Continuous listening error:", event.error)
        if (event.error === "not-allowed") {
          setSettings((prev) => ({ ...prev, enabled: false }))
          setIsListening(false)
        }
      }

      newRecognition.onend = () => {
        if (settings.enabled && !isPaused) {
          // Restart recognition if it stops unexpectedly
          setTimeout(() => {
            try {
              newRecognition.start()
            } catch (error) {
              console.error("Failed to restart recognition:", error)
            }
          }, 1000)
        }
      }

      setRecognition(newRecognition)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  // Handle inactivity timeout
  useEffect(() => {
    if (!settings.pauseOnInactivity || !isListening) return

    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity > settings.inactivityTimeout * 1000) {
        setIsPaused(true)
        if (recognition) {
          recognition.stop()
        }
      }
    }, 5000)

    return () => clearInterval(checkInactivity)
  }, [lastActivity, settings.pauseOnInactivity, settings.inactivityTimeout, isListening, recognition])

  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      const lowerTranscript = transcript.toLowerCase()

      // Check for wake words
      const hasWakeWord = settings.wakeWords.some((word) => lowerTranscript.includes(word.toLowerCase()))

      if (!hasWakeWord && settings.privacyMode) {
        return // Ignore commands without wake words in privacy mode
      }

      setIsProcessing(true)
      try {
        // Process the voice command
        await advancedVoiceEngine.processVoiceCommand(transcript)
        setCurrentTranscript("")
      } catch (error) {
        console.error("Error processing voice command:", error)
      } finally {
        setIsProcessing(false)
      }
    },
    [settings.wakeWords, settings.privacyMode],
  )

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      setIsPaused(false)
    } else {
      try {
        recognition.start()
        setIsListening(true)
        setIsPaused(false)
        setLastActivity(Date.now())
      } catch (error) {
        console.error("Failed to start continuous listening:", error)
      }
    }
  }

  const togglePause = () => {
    if (!recognition) return

    if (isPaused) {
      recognition.start()
      setIsPaused(false)
      setLastActivity(Date.now())
    } else {
      recognition.stop()
      setIsPaused(true)
    }
  }

  const updateSettings = (key: keyof ContinuousListeningSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Main Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Continuous Listening Mode
            {settings.privacyMode && <Shield className="w-4 h-4 text-green-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Enable Continuous Listening</div>
              <div className="text-sm text-muted-foreground">Always listen for voice commands in the background</div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => {
                updateSettings("enabled", checked)
                if (!checked && isListening) {
                  toggleListening()
                }
              }}
            />
          </div>

          {settings.enabled && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={toggleListening} variant={isListening ? "destructive" : "default"} className="flex-1">
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Listening
                    </>
                  )}
                </Button>

                {isListening && (
                  <Button onClick={togglePause} variant="outline">
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex gap-2">
                <Badge variant={isListening ? "default" : "secondary"}>{isListening ? "Listening" : "Stopped"}</Badge>
                {isPaused && <Badge variant="outline">Paused</Badge>}
                {isProcessing && <Badge variant="outline">Processing</Badge>}
                {settings.privacyMode && (
                  <Badge variant="outline" className="text-green-600">
                    Privacy Mode
                  </Badge>
                )}
              </div>

              {/* Current Transcript */}
              {currentTranscript && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-1">Current Input:</div>
                  <div className="text-sm text-muted-foreground">{currentTranscript}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Privacy Mode</div>
              <div className="text-sm text-muted-foreground">Only process commands that start with wake words</div>
            </div>
            <Switch
              checked={settings.privacyMode}
              onCheckedChange={(checked) => updateSettings("privacyMode", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="font-medium">Wake Words</div>
            <div className="text-sm text-muted-foreground mb-2">Commands must start with one of these phrases</div>
            <div className="flex flex-wrap gap-2">
              {settings.wakeWords.map((word, index) => (
                <Badge key={index} variant="outline">
                  "{word}"
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Background Processing</div>
              <div className="text-sm text-muted-foreground">Process commands even when tab is not active</div>
            </div>
            <Switch
              checked={settings.backgroundProcessing}
              onCheckedChange={(checked) => updateSettings("backgroundProcessing", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">Sensitivity</div>
              <div className="text-sm text-muted-foreground">{settings.sensitivity}%</div>
            </div>
            <Slider
              value={[settings.sensitivity]}
              onValueChange={([value]) => updateSettings("sensitivity", value)}
              max={100}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Higher sensitivity picks up quieter speech but may increase false positives
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Auto-pause on Inactivity</div>
              <div className="text-sm text-muted-foreground">Automatically pause listening after period of silence</div>
            </div>
            <Switch
              checked={settings.pauseOnInactivity}
              onCheckedChange={(checked) => updateSettings("pauseOnInactivity", checked)}
            />
          </div>

          {settings.pauseOnInactivity && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Inactivity Timeout</div>
                <div className="text-sm text-muted-foreground">{settings.inactivityTimeout}s</div>
              </div>
              <Slider
                value={[settings.inactivityTimeout]}
                onValueChange={([value]) => updateSettings("inactivityTimeout", value)}
                max={300}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
