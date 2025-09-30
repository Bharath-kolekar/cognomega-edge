"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Monitor, Palette, Type, Layout, Eye, Mic, Volume2 } from "lucide-react"

interface UIControlState {
  isListening: boolean
  currentCommand: string
  controlMode: "theme" | "layout" | "accessibility" | "navigation"
  pendingChanges: Record<string, any>
}

interface UISettings {
  theme: "light" | "dark" | "auto"
  fontSize: number
  contrast: number
  reducedMotion: boolean
  colorBlindMode: boolean
  layout: "compact" | "comfortable" | "spacious"
  sidebarCollapsed: boolean
}

export function VoiceUIController() {
  const [state, setState] = useState<UIControlState>({
    isListening: false,
    currentCommand: "",
    controlMode: "theme",
    pendingChanges: {},
  })
  const [uiSettings, setUISettings] = useState<UISettings>({
    theme: "dark",
    fontSize: 16,
    contrast: 100,
    reducedMotion: false,
    colorBlindMode: false,
    layout: "comfortable",
    sidebarCollapsed: false,
  })
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    initializeVoiceRecognition()
    loadUISettings()
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
            processUICommand(finalTranscript.trim())
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

  const loadUISettings = () => {
    const stored = localStorage.getItem("voiceUISettings")
    if (stored) {
      setUISettings(JSON.parse(stored))
    }
  }

  const saveUISettings = (settings: UISettings) => {
    localStorage.setItem("voiceUISettings", JSON.stringify(settings))
    setUISettings(settings)
    applyUIChanges(settings)
  }

  const applyUIChanges = (settings: UISettings) => {
    // Apply theme
    document.documentElement.setAttribute("data-theme", settings.theme)

    // Apply font size
    document.documentElement.style.fontSize = `${settings.fontSize}px`

    // Apply contrast
    document.documentElement.style.filter = `contrast(${settings.contrast}%)`

    // Apply reduced motion
    if (settings.reducedMotion) {
      document.documentElement.style.setProperty("--animation-duration", "0s")
    } else {
      document.documentElement.style.removeProperty("--animation-duration")
    }

    // Apply color blind mode
    if (settings.colorBlindMode) {
      document.documentElement.classList.add("colorblind-mode")
    } else {
      document.documentElement.classList.remove("colorblind-mode")
    }
  }

  const startVoiceUIControl = () => {
    if (recognition && !state.isListening) {
      recognition.start()
      setState((prev) => ({ ...prev, isListening: true }))

      const utterance = new SpeechSynthesisUtterance(
        "Voice UI control activated. You can now change the interface using voice commands. " +
          "Try saying 'switch to dark theme', 'increase font size', 'enable high contrast', or 'make layout compact'.",
      )
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopVoiceUIControl = () => {
    if (recognition && state.isListening) {
      recognition.stop()
      setState((prev) => ({ ...prev, isListening: false }))
    }
  }

  const processUICommand = useCallback(
    (command: string) => {
      setState((prev) => ({ ...prev, currentCommand: command }))

      const lowerCommand = command.toLowerCase()
      let response = "I didn't understand that UI command."
      let settingsChanged = false

      // Theme commands
      if (lowerCommand.includes("dark theme") || lowerCommand.includes("dark mode")) {
        updateUISetting("theme", "dark")
        response = "Switched to dark theme"
        settingsChanged = true
      } else if (lowerCommand.includes("light theme") || lowerCommand.includes("light mode")) {
        updateUISetting("theme", "light")
        response = "Switched to light theme"
        settingsChanged = true
      } else if (lowerCommand.includes("auto theme") || lowerCommand.includes("system theme")) {
        updateUISetting("theme", "auto")
        response = "Switched to automatic theme"
        settingsChanged = true
      }

      // Font size commands
      else if (lowerCommand.includes("increase font") || lowerCommand.includes("bigger text")) {
        const newSize = Math.min(uiSettings.fontSize + 2, 24)
        updateUISetting("fontSize", newSize)
        response = `Font size increased to ${newSize} pixels`
        settingsChanged = true
      } else if (lowerCommand.includes("decrease font") || lowerCommand.includes("smaller text")) {
        const newSize = Math.max(uiSettings.fontSize - 2, 12)
        updateUISetting("fontSize", newSize)
        response = `Font size decreased to ${newSize} pixels`
        settingsChanged = true
      } else if (lowerCommand.includes("font size")) {
        const sizeMatch = lowerCommand.match(/(\d+)/)
        if (sizeMatch) {
          const size = Number.parseInt(sizeMatch[1])
          if (size >= 12 && size <= 24) {
            updateUISetting("fontSize", size)
            response = `Font size set to ${size} pixels`
            settingsChanged = true
          }
        }
      }

      // Contrast commands
      else if (lowerCommand.includes("high contrast") || lowerCommand.includes("increase contrast")) {
        updateUISetting("contrast", 150)
        response = "High contrast mode enabled"
        settingsChanged = true
      } else if (lowerCommand.includes("normal contrast") || lowerCommand.includes("reset contrast")) {
        updateUISetting("contrast", 100)
        response = "Contrast reset to normal"
        settingsChanged = true
      }

      // Layout commands
      else if (lowerCommand.includes("compact layout")) {
        updateUISetting("layout", "compact")
        response = "Switched to compact layout"
        settingsChanged = true
      } else if (lowerCommand.includes("comfortable layout")) {
        updateUISetting("layout", "comfortable")
        response = "Switched to comfortable layout"
        settingsChanged = true
      } else if (lowerCommand.includes("spacious layout")) {
        updateUISetting("layout", "spacious")
        response = "Switched to spacious layout"
        settingsChanged = true
      }

      // Accessibility commands
      else if (lowerCommand.includes("reduce motion") || lowerCommand.includes("disable animations")) {
        updateUISetting("reducedMotion", true)
        response = "Reduced motion enabled"
        settingsChanged = true
      } else if (lowerCommand.includes("enable motion") || lowerCommand.includes("enable animations")) {
        updateUISetting("reducedMotion", false)
        response = "Animations enabled"
        settingsChanged = true
      } else if (lowerCommand.includes("colorblind mode") || lowerCommand.includes("color blind")) {
        updateUISetting("colorBlindMode", !uiSettings.colorBlindMode)
        response = `Colorblind mode ${!uiSettings.colorBlindMode ? "enabled" : "disabled"}`
        settingsChanged = true
      }

      // Navigation commands
      else if (lowerCommand.includes("collapse sidebar") || lowerCommand.includes("hide sidebar")) {
        updateUISetting("sidebarCollapsed", true)
        response = "Sidebar collapsed"
        settingsChanged = true
      } else if (lowerCommand.includes("expand sidebar") || lowerCommand.includes("show sidebar")) {
        updateUISetting("sidebarCollapsed", false)
        response = "Sidebar expanded"
        settingsChanged = true
      }

      // Mode switching
      else if (lowerCommand.includes("switch to") || lowerCommand.includes("go to")) {
        if (lowerCommand.includes("theme")) {
          setState((prev) => ({ ...prev, controlMode: "theme" }))
          response = "Switched to theme controls"
        } else if (lowerCommand.includes("layout")) {
          setState((prev) => ({ ...prev, controlMode: "layout" }))
          response = "Switched to layout controls"
        } else if (lowerCommand.includes("accessibility")) {
          setState((prev) => ({ ...prev, controlMode: "accessibility" }))
          response = "Switched to accessibility controls"
        } else if (lowerCommand.includes("navigation")) {
          setState((prev) => ({ ...prev, controlMode: "navigation" }))
          response = "Switched to navigation controls"
        }
      }

      // Help commands
      else if (lowerCommand.includes("help") || lowerCommand.includes("what can i say")) {
        response =
          "You can say commands like: 'switch to dark theme', 'increase font size', " +
          "'enable high contrast', 'compact layout', 'reduce motion', 'colorblind mode', " +
          "'collapse sidebar', or 'show current settings'"
      }

      // Status commands
      else if (lowerCommand.includes("current settings") || lowerCommand.includes("show settings")) {
        response =
          `Current UI settings: ${uiSettings.theme} theme, ${uiSettings.fontSize}px font, ` +
          `${uiSettings.contrast}% contrast, ${uiSettings.layout} layout`
      }

      // Speak the response
      const utterance = new SpeechSynthesisUtterance(response)
      utterance.rate = 0.9
      utterance.pitch = settingsChanged ? 1.1 : 1.0
      window.speechSynthesis.speak(utterance)

      // Clear command after processing
      setTimeout(() => {
        setState((prev) => ({ ...prev, currentCommand: "" }))
      }, 3000)
    },
    [uiSettings],
  )

  const updateUISetting = (key: keyof UISettings, value: any) => {
    const newSettings = { ...uiSettings, [key]: value }
    saveUISettings(newSettings)
  }

  const uiCommands = [
    { command: "Switch to [light/dark/auto] theme", example: "Switch to dark theme" },
    { command: "Increase/Decrease font size", example: "Increase font size" },
    { command: "Set font size to [12-24]", example: "Set font size to 18" },
    { command: "Enable/Disable high contrast", example: "Enable high contrast" },
    { command: "Switch to [compact/comfortable/spacious] layout", example: "Compact layout" },
    { command: "Enable/Disable reduced motion", example: "Reduce motion" },
    { command: "Toggle colorblind mode", example: "Enable colorblind mode" },
    { command: "Collapse/Expand sidebar", example: "Collapse sidebar" },
  ]

  return (
    <div className="space-y-6">
      {/* Voice UI Control Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Voice UI Controller
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
              <p className="text-sm text-muted-foreground">Control the user interface using voice commands</p>
              {state.currentCommand && (
                <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                  <strong>Processing:</strong> "{state.currentCommand}"
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!state.isListening ? (
                <Button onClick={startVoiceUIControl} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Voice UI Control
                </Button>
              ) : (
                <Button onClick={stopVoiceUIControl} variant="destructive" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Stop Listening
                </Button>
              )}
            </div>
          </div>

          {/* Control Mode Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { id: "theme", label: "Theme", icon: Palette },
              { id: "layout", label: "Layout", icon: Layout },
              { id: "accessibility", label: "Accessibility", icon: Eye },
              { id: "navigation", label: "Navigation", icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={state.controlMode === id ? "default" : "outline"}
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, controlMode: id as any }))}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current UI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Current UI Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Theme</div>
              <div className="font-semibold capitalize">{uiSettings.theme}</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Font Size</div>
              <div className="font-semibold">{uiSettings.fontSize}px</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Contrast</div>
              <div className="font-semibold">{uiSettings.contrast}%</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Layout</div>
              <div className="font-semibold capitalize">{uiSettings.layout}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Available UI Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uiCommands.map((cmd, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-sm mb-1">{cmd.command}</div>
                <div className="text-xs text-muted-foreground italic">"{cmd.example}"</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick UI Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Voice Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { text: "Switch to dark theme", action: () => processUICommand("switch to dark theme") },
              { text: "Increase font size", action: () => processUICommand("increase font size") },
              { text: "Enable high contrast", action: () => processUICommand("enable high contrast") },
              { text: "Compact layout", action: () => processUICommand("compact layout") },
              { text: "Reduce motion", action: () => processUICommand("reduce motion") },
              { text: "Show current settings", action: () => processUICommand("show current settings") },
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

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Reduced Motion</label>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                checked={uiSettings.reducedMotion}
                onCheckedChange={(checked) => updateUISetting("reducedMotion", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Colorblind Mode</label>
                <p className="text-sm text-muted-foreground">Enhanced color contrast for accessibility</p>
              </div>
              <Switch
                checked={uiSettings.colorBlindMode}
                onCheckedChange={(checked) => updateUISetting("colorBlindMode", checked)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Font Size: {uiSettings.fontSize}px</label>
              <Slider
                value={[uiSettings.fontSize]}
                onValueChange={([value]) => updateUISetting("fontSize", value)}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Contrast: {uiSettings.contrast}%</label>
              <Slider
                value={[uiSettings.contrast]}
                onValueChange={([value]) => updateUISetting("contrast", value)}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
