"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, Play, Pause, Settings, User, Heart } from "lucide-react"

interface VoiceOption {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  accent: string
  mood: string
  description: string
  premium: boolean
  naturalness: number
  sample: string
}

interface VoiceSettings {
  selectedVoice: string
  rate: number
  pitch: number
  volume: number
  emotion: string
  style: string
}

export function NaturalVoiceSelector() {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [settings, setSettings] = useState<VoiceSettings>({
    selectedVoice: "neural-sarah",
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    emotion: "neutral",
    style: "conversational",
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    initializeNaturalVoices()
    loadVoiceSettings()
  }, [])

  const initializeNaturalVoices = () => {
    const naturalVoices: VoiceOption[] = [
      {
        id: "neural-sarah",
        name: "Sarah",
        gender: "female",
        accent: "American",
        mood: "friendly",
        description: "Warm and professional voice perfect for assistance",
        premium: false,
        naturalness: 9.2,
        sample:
          "Hello! I'm Sarah, your friendly AI assistant. I'm here to help you with voice commands and make your experience more natural and engaging.",
      },
      {
        id: "neural-david",
        name: "David",
        gender: "male",
        accent: "British",
        mood: "confident",
        description: "Sophisticated British accent with clear articulation",
        premium: false,
        naturalness: 9.0,
        sample:
          "Good day! I'm David, and I'll be assisting you today. My British accent and confident tone will guide you through your voice interactions.",
      },
      {
        id: "neural-emma",
        name: "Emma",
        gender: "female",
        accent: "Australian",
        mood: "cheerful",
        description: "Upbeat Australian voice with natural intonation",
        premium: true,
        naturalness: 9.5,
        sample:
          "G'day! I'm Emma from down under. I bring a cheerful and energetic approach to your voice assistant experience.",
      },
      {
        id: "neural-alex",
        name: "Alex",
        gender: "neutral",
        accent: "Canadian",
        mood: "calm",
        description: "Gender-neutral voice with soothing Canadian accent",
        premium: true,
        naturalness: 9.3,
        sample:
          "Hello there! I'm Alex, your calm and neutral voice assistant. I provide clear guidance with a gentle Canadian touch.",
      },
      {
        id: "neural-priya",
        name: "Priya",
        gender: "female",
        accent: "Indian",
        mood: "enthusiastic",
        description: "Vibrant Indian English with warm personality",
        premium: true,
        naturalness: 9.1,
        sample:
          "Namaste! I'm Priya, and I'm absolutely delighted to be your voice assistant. Let's make your experience wonderful together!",
      },
      {
        id: "neural-james",
        name: "James",
        gender: "male",
        accent: "Scottish",
        mood: "witty",
        description: "Charming Scottish accent with intelligent humor",
        premium: true,
        naturalness: 8.9,
        sample:
          "Och, hello there! I'm James from Scotland. I'll help ye with yer voice commands with a wee bit of Scottish charm.",
      },
      {
        id: "neural-sophia",
        name: "Sophia",
        gender: "female",
        accent: "American",
        mood: "professional",
        description: "Executive-level voice for business interactions",
        premium: true,
        naturalness: 9.4,
        sample:
          "Good morning. I'm Sophia, your professional voice assistant. I provide clear, articulate guidance for all your business needs.",
      },
      {
        id: "neural-kai",
        name: "Kai",
        gender: "male",
        accent: "American",
        mood: "energetic",
        description: "Young, dynamic voice perfect for creative tasks",
        premium: false,
        naturalness: 8.8,
        sample:
          "Hey there! I'm Kai, your energetic voice assistant. Ready to tackle some awesome voice commands together? Let's do this!",
      },
    ]

    setVoices(naturalVoices)
  }

  const loadVoiceSettings = () => {
    const stored = localStorage.getItem("naturalVoiceSettings")
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }

  const saveVoiceSettings = (newSettings: VoiceSettings) => {
    localStorage.setItem("naturalVoiceSettings", JSON.stringify(newSettings))
    setSettings(newSettings)
  }

  const updateSetting = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    saveVoiceSettings(newSettings)
  }

  const playVoiceSample = useCallback(
    (voiceId: string) => {
      const voice = voices.find((v) => v.id === voiceId)
      if (!voice) return

      // Stop any current speech
      if (currentUtterance) {
        speechSynthesis.cancel()
        setIsPlaying(false)
      }

      const utterance = new SpeechSynthesisUtterance(voice.sample)

      // Apply current settings
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      utterance.volume = settings.volume

      // Try to find a matching system voice
      const systemVoices = speechSynthesis.getVoices()
      let selectedSystemVoice = null

      // Match by gender and accent preferences
      if (voice.gender === "female") {
        selectedSystemVoice = systemVoices.find(
          (sv) =>
            sv.name.toLowerCase().includes("female") ||
            sv.name.toLowerCase().includes("woman") ||
            sv.name.toLowerCase().includes("sarah") ||
            sv.name.toLowerCase().includes("emma") ||
            sv.name.toLowerCase().includes("sophia"),
        )
      } else if (voice.gender === "male") {
        selectedSystemVoice = systemVoices.find(
          (sv) =>
            sv.name.toLowerCase().includes("male") ||
            sv.name.toLowerCase().includes("man") ||
            sv.name.toLowerCase().includes("david") ||
            sv.name.toLowerCase().includes("james"),
        )
      }

      // Fallback to accent matching
      if (!selectedSystemVoice) {
        if (voice.accent.includes("British")) {
          selectedSystemVoice = systemVoices.find((sv) => sv.lang.includes("en-GB"))
        } else if (voice.accent.includes("Australian")) {
          selectedSystemVoice = systemVoices.find((sv) => sv.lang.includes("en-AU"))
        } else if (voice.accent.includes("Indian")) {
          selectedSystemVoice = systemVoices.find((sv) => sv.lang.includes("en-IN"))
        }
      }

      if (selectedSystemVoice) {
        utterance.voice = selectedSystemVoice
      }

      // Adjust pitch and rate based on mood
      switch (voice.mood) {
        case "cheerful":
        case "enthusiastic":
          utterance.pitch = Math.min(settings.pitch * 1.1, 2.0)
          utterance.rate = Math.min(settings.rate * 1.05, 2.0)
          break
        case "calm":
          utterance.pitch = Math.max(settings.pitch * 0.95, 0.5)
          utterance.rate = Math.max(settings.rate * 0.95, 0.5)
          break
        case "confident":
        case "professional":
          utterance.pitch = Math.max(settings.pitch * 0.9, 0.5)
          break
        case "energetic":
          utterance.rate = Math.min(settings.rate * 1.1, 2.0)
          break
      }

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => {
        setIsPlaying(false)
        setCurrentUtterance(null)
      }
      utterance.onerror = () => {
        setIsPlaying(false)
        setCurrentUtterance(null)
      }

      setCurrentUtterance(utterance)
      speechSynthesis.speak(utterance)
    },
    [voices, settings, currentUtterance],
  )

  const stopPlayback = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setCurrentUtterance(null)
  }

  const getSelectedVoice = () => {
    return voices.find((v) => v.id === settings.selectedVoice) || voices[0]
  }

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "friendly":
        return "text-green-600"
      case "confident":
        return "text-blue-600"
      case "cheerful":
        return "text-yellow-600"
      case "calm":
        return "text-purple-600"
      case "enthusiastic":
        return "text-orange-600"
      case "witty":
        return "text-pink-600"
      case "professional":
        return "text-gray-600"
      case "energetic":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Voice Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Voice: {getSelectedVoice()?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getSelectedVoice()?.gender}</Badge>
                <Badge variant="outline">{getSelectedVoice()?.accent}</Badge>
                <Badge variant="outline" className={getMoodColor(getSelectedVoice()?.mood || "")}>
                  {getSelectedVoice()?.mood}
                </Badge>
                {getSelectedVoice()?.premium && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{getSelectedVoice()?.description}</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Naturalness:</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Heart
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor((getSelectedVoice()?.naturalness || 0) / 2)
                          ? "text-red-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">{getSelectedVoice()?.naturalness}/10</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => playVoiceSample(settings.selectedVoice)}
                disabled={isPlaying}
                variant="outline"
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                Sample
              </Button>
              {isPlaying && (
                <Button onClick={stopPlayback} variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Choose Your Voice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  settings.selectedVoice === voice.id
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => updateSetting("selectedVoice", voice.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{voice.name}</h4>
                    {voice.premium && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">Premium</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {voice.gender}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {voice.accent}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${getMoodColor(voice.mood)}`}>
                      {voice.mood}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{voice.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Heart
                          key={i}
                          className={`h-2 w-2 ${
                            i < Math.floor(voice.naturalness / 2) ? "text-red-500 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        playVoiceSample(voice.id)
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Speaking Rate: {settings.rate.toFixed(1)}x</label>
                <Slider
                  value={[settings.rate]}
                  onValueChange={([value]) => updateSetting("rate", value)}
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
                  onValueChange={([value]) => updateSetting("pitch", value)}
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
                  onValueChange={([value]) => updateSetting("volume", value)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emotion Style</label>
                <Select value={settings.emotion} onValueChange={(value) => updateSetting("emotion", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Speaking Style</label>
                <Select value={settings.style} onValueChange={(value) => updateSetting("style", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => playVoiceSample(settings.selectedVoice)} className="w-full" disabled={isPlaying}>
                <Volume2 className="h-4 w-4 mr-2" />
                Test Current Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
