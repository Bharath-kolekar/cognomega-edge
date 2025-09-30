"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Settings, Languages, Brain, Heart, User, Trash2, Plus, Download, Upload } from "lucide-react"
import {
  getVoiceSettings,
  updateVoiceSettings,
  getUserVoiceProfile,
  addWakeWord,
  removeWakeWord,
  setAssistantName,
  addSupportedLanguage,
  calibrateUserVoice,
  clearVoiceMemory,
  toggleOfflineProcessing,
  isOfflineProcessingAvailable,
  type AdvancedVoiceSettings,
  type VoiceProfile,
} from "@/lib/advanced-voice-engine"

export function VoiceAssistantSettings() {
  const [settings, setSettings] = useState<AdvancedVoiceSettings | null>(null)
  const [profile, setProfile] = useState<VoiceProfile | null>(null)
  const [newWakeWord, setNewWakeWord] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationLanguage, setCalibrationLanguage] = useState("english")

  useEffect(() => {
    loadSettings()
    loadProfile()
  }, [])

  const loadSettings = () => {
    const currentSettings = getVoiceSettings()
    setSettings(currentSettings)
  }

  const loadProfile = () => {
    const currentProfile = getUserVoiceProfile()
    setProfile(currentProfile)
  }

  const handleSettingChange = (key: keyof AdvancedVoiceSettings, value: any) => {
    if (!settings) return

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateVoiceSettings({ [key]: value })
  }

  const handleAddWakeWord = () => {
    if (newWakeWord.trim()) {
      addWakeWord(newWakeWord.trim())
      setNewWakeWord("")
      loadSettings()
    }
  }

  const handleRemoveWakeWord = (wakeWord: string) => {
    removeWakeWord(wakeWord)
    loadSettings()
  }

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      addSupportedLanguage(newLanguage.trim().toLowerCase())
      setNewLanguage("")
      loadSettings()
    }
  }

  const handleCalibration = async () => {
    setIsCalibrating(true)
    try {
      await calibrateUserVoice(calibrationLanguage)
      loadProfile()
    } catch (error) {
      console.error("Calibration failed:", error)
    } finally {
      setIsCalibrating(false)
    }
  }

  const handleClearMemory = () => {
    clearVoiceMemory()
    loadProfile()
  }

  const handleAssistantNameChange = (name: string) => {
    setAssistantName(name)
    loadSettings()
    loadProfile()
  }

  if (!settings) {
    return <div>Loading voice settings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mic className="h-8 w-8 text-primary" />
          Voice Assistant Settings
        </h1>
        <p className="text-muted-foreground">Customize your advanced voice assistant experience</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="emotions" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Emotions
          </TabsTrigger>
          <TabsTrigger value="personalization" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Voice Settings</CardTitle>
              <CardDescription>Configure fundamental voice recognition and response settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Input
                  id="assistant-name"
                  value={settings.assistantName}
                  onChange={(e) => handleAssistantNameChange(e.target.value)}
                  placeholder="Enter assistant name (e.g., Vihaan, Ava, Riko)"
                />
                <p className="text-sm text-muted-foreground">
                  Your assistant will respond to this name and use it in conversations
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Continuous Listening</Label>
                  <p className="text-sm text-muted-foreground">Keep listening after each command</p>
                </div>
                <Switch
                  checked={settings.continuousListening}
                  onCheckedChange={(checked) => handleSettingChange("continuousListening", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold: {settings.confidenceThreshold}</Label>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={([value]) => handleSettingChange("confidenceThreshold", value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Higher values require clearer speech but reduce false positives
                </p>
              </div>

              <div className="space-y-2">
                <Label>Noise Reduction Level: {settings.noiseReductionLevel}</Label>
                <Slider
                  value={[settings.noiseReductionLevel]}
                  onValueChange={([value]) => handleSettingChange("noiseReductionLevel", value)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wake Words</CardTitle>
              <CardDescription>Customize phrases that activate your voice assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wake Word Detection</Label>
                  <p className="text-sm text-muted-foreground">Enable activation phrases</p>
                </div>
                <Switch
                  checked={settings.wakeWordEnabled}
                  onCheckedChange={(checked) => handleSettingChange("wakeWordEnabled", checked)}
                />
              </div>

              {settings.wakeWordEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Wake Word Sensitivity: {settings.wakeWordSensitivity}</Label>
                    <Slider
                      value={[settings.wakeWordSensitivity]}
                      onValueChange={([value]) => handleSettingChange("wakeWordSensitivity", value)}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Current Wake Words</Label>
                    <div className="flex flex-wrap gap-2">
                      {settings.customWakeWords.map((word, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {word}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRemoveWakeWord(word)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newWakeWord}
                      onChange={(e) => setNewWakeWord(e.target.value)}
                      placeholder="Add new wake word..."
                      onKeyPress={(e) => e.key === "Enter" && handleAddWakeWord()}
                    />
                    <Button onClick={handleAddWakeWord} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multilingual Support</CardTitle>
              <CardDescription>Configure language detection and multilingual capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-Language Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect and respond in different languages
                  </p>
                </div>
                <Switch
                  checked={settings.multiLanguageEnabled}
                  onCheckedChange={(checked) => handleSettingChange("multiLanguageEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Accent Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect and adapt to different accents</p>
                </div>
                <Switch
                  checked={settings.accentDetectionEnabled}
                  onCheckedChange={(checked) => handleSettingChange("accentDetectionEnabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Supported Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.supportedLanguages.map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add new language..."
                  onKeyPress={(e) => e.key === "Enter" && handleAddLanguage()}
                />
                <Button onClick={handleAddLanguage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Voice Calibration</Label>
                <div className="flex gap-2">
                  <select
                    value={calibrationLanguage}
                    onChange={(e) => setCalibrationLanguage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {settings.supportedLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleCalibration} disabled={isCalibrating} className="whitespace-nowrap">
                    {isCalibrating ? "Calibrating..." : "Calibrate Voice"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Improve recognition accuracy for your voice and accent</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion & Tone Settings</CardTitle>
              <CardDescription>Configure emotional intelligence and voice tone modulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Emotion Detection</Label>
                  <p className="text-sm text-muted-foreground">Analyze emotional context in your voice</p>
                </div>
                <Switch
                  checked={settings.emotionDetectionEnabled}
                  onCheckedChange={(checked) => handleSettingChange("emotionDetectionEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Tone Modulation</Label>
                  <p className="text-sm text-muted-foreground">Adjust response tone based on your emotions</p>
                </div>
                <Switch
                  checked={settings.voiceToneModulationEnabled}
                  onCheckedChange={(checked) => handleSettingChange("voiceToneModulationEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Context Awareness</Label>
                  <p className="text-sm text-muted-foreground">Consider time, mood, and scene in responses</p>
                </div>
                <Switch
                  checked={settings.contextAwarenessEnabled}
                  onCheckedChange={(checked) => handleSettingChange("contextAwarenessEnabled", checked)}
                />
              </div>

              {profile && (
                <div className="space-y-2">
                  <Label>Detected Emotions (Recent)</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <strong>Accent Type:</strong> {profile.accentType || "Not detected"}
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <strong>Preferred Languages:</strong> {profile.preferredLanguages?.join(", ") || "English"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Personalization</CardTitle>
              <CardDescription>Customize how the assistant learns and adapts to your voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Learning</Label>
                  <p className="text-sm text-muted-foreground">Learn from your voice patterns and preferences</p>
                </div>
                <Switch
                  checked={settings.voicePersonalizationEnabled}
                  onCheckedChange={(checked) => handleSettingChange("voicePersonalizationEnabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Memory Retention: {settings.memoryRetentionDays} days</Label>
                <Slider
                  value={[settings.memoryRetentionDays]}
                  onValueChange={([value]) => handleSettingChange("memoryRetentionDays", value)}
                  min={1}
                  max={90}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  How long to remember your voice patterns and preferences
                </p>
              </div>

              {profile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Voice Profile</Label>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <strong>Pitch:</strong> {profile.preferredPitch.toFixed(2)}
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Rate:</strong> {profile.preferredRate.toFixed(2)}
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Volume:</strong> {profile.preferredVolume.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Common Phrases</Label>
                    <div className="flex flex-wrap gap-1">
                      {profile.commonPhrases?.slice(0, 10).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Usage Statistics</Label>
                    {profile.voiceMemory && (
                      <div className="text-sm space-y-1">
                        <p>Total Commands: {profile.voiceMemory.usageHistory?.length || 0}</p>
                        <p>Frequent Commands: {Object.keys(profile.voiceMemory.frequentCommands || {}).length}</p>
                        <p>
                          Context Preferences: {Object.keys(profile.voiceMemory.contextualPreferences || {}).length}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleClearMemory}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Voice Memory
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>Configure advanced voice processing capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline Processing</Label>
                  <p className="text-sm text-muted-foreground">Process voice commands without internet connection</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isOfflineProcessingAvailable() ? "default" : "secondary"}>
                    {isOfflineProcessingAvailable() ? "Available" : "Not Available"}
                  </Badge>
                  <Switch
                    checked={settings.offlineProcessingEnabled}
                    onCheckedChange={(checked) => {
                      handleSettingChange("offlineProcessingEnabled", checked)
                      toggleOfflineProcessing(checked)
                    }}
                    disabled={!isOfflineProcessingAvailable()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voice Data Export/Import</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export Settings
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Import Settings
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Backup and restore your voice assistant configuration</p>
              </div>

              <div className="space-y-2">
                <Label>System Information</Label>
                <div className="text-sm space-y-1 p-3 bg-muted rounded">
                  <p>
                    <strong>Browser Support:</strong>{" "}
                    {typeof window !== "undefined" && "webkitSpeechRecognition" in window ? "Full" : "Limited"}
                  </p>
                  <p>
                    <strong>Audio Context:</strong>{" "}
                    {typeof window !== "undefined" && "AudioContext" in window ? "Available" : "Not Available"}
                  </p>
                  <p>
                    <strong>Offline Audio:</strong>{" "}
                    {typeof window !== "undefined" && "OfflineAudioContext" in window ? "Available" : "Not Available"}
                  </p>
                  <p>
                    <strong>Speech Synthesis:</strong>{" "}
                    {typeof window !== "undefined" && "speechSynthesis" in window ? "Available" : "Not Available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
