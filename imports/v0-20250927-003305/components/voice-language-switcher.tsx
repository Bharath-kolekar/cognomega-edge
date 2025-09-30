"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Mic, Volume2, Check } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  voiceCommands: string[]
}

interface VoiceLanguageState {
  currentLanguage: string
  detectedLanguage?: string
  isListening: boolean
  switchInProgress: boolean
  lastSwitchTime: number
}

export function VoiceLanguageSwitcher() {
  const [languageState, setLanguageState] = useState<VoiceLanguageState>({
    currentLanguage: "en-US",
    isListening: false,
    switchInProgress: false,
    lastSwitchTime: 0,
  })

  const [supportedLanguages] = useState<Language[]>([
    {
      code: "en-US",
      name: "English (US)",
      nativeName: "English",
      flag: "🇺🇸",
      voiceCommands: ["switch to english", "english please", "speak english", "change to english"],
    },
    {
      code: "es-ES",
      name: "Spanish (Spain)",
      nativeName: "Español",
      flag: "🇪🇸",
      voiceCommands: ["cambiar a español", "español por favor", "habla español", "cambiar idioma"],
    },
    {
      code: "fr-FR",
      name: "French (France)",
      nativeName: "Français",
      flag: "🇫🇷",
      voiceCommands: ["changer en français", "français s'il vous plaît", "parler français", "changer langue"],
    },
    {
      code: "de-DE",
      name: "German (Germany)",
      nativeName: "Deutsch",
      flag: "🇩🇪",
      voiceCommands: ["wechseln zu deutsch", "deutsch bitte", "sprechen deutsch", "sprache ändern"],
    },
    {
      code: "it-IT",
      name: "Italian (Italy)",
      nativeName: "Italiano",
      flag: "🇮🇹",
      voiceCommands: ["cambia in italiano", "italiano per favore", "parla italiano", "cambia lingua"],
    },
    {
      code: "pt-BR",
      name: "Portuguese (Brazil)",
      nativeName: "Português",
      flag: "🇧🇷",
      voiceCommands: ["mudar para português", "português por favor", "falar português", "mudar idioma"],
    },
    {
      code: "zh-CN",
      name: "Chinese (Simplified)",
      nativeName: "中文",
      flag: "🇨🇳",
      voiceCommands: ["切换到中文", "请说中文", "中文模式", "更改语言"],
    },
    {
      code: "ja-JP",
      name: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵",
      voiceCommands: ["日本語に切り替え", "日本語でお願いします", "日本語モード", "言語を変更"],
    },
    {
      code: "hi-IN",
      name: "Hindi (India)",
      nativeName: "हिन्दी",
      flag: "🇮🇳",
      voiceCommands: ["हिंदी में बदलें", "हिंदी बोलें", "भाषा बदलें", "हिंदी मोड"],
    },
    {
      code: "ar-SA",
      name: "Arabic (Saudi Arabia)",
      nativeName: "العربية",
      flag: "🇸🇦",
      voiceCommands: ["تغيير إلى العربية", "تحدث بالعربية", "اللغة العربية", "تغيير اللغة"],
    },
  ])

  const getCurrentLanguage = useCallback(() => {
    return supportedLanguages.find((lang) => lang.code === languageState.currentLanguage) || supportedLanguages[0]
  }, [languageState.currentLanguage, supportedLanguages])

  const switchLanguage = useCallback(
    async (languageCode: string, triggeredByVoice = false) => {
      setLanguageState((prev) => ({ ...prev, switchInProgress: true }))

      try {
        // Update voice engine language
        const preferences = advancedVoiceEngine.getUserPreferences()
        advancedVoiceEngine.updateUserPreferences({
          ...preferences,
          preferredLanguage: languageCode,
        })

        // Update local state
        setLanguageState((prev) => ({
          ...prev,
          currentLanguage: languageCode,
          lastSwitchTime: Date.now(),
          switchInProgress: false,
        }))

        // Provide feedback in the new language
        const newLanguage = supportedLanguages.find((lang) => lang.code === languageCode)
        if (newLanguage && "speechSynthesis" in window) {
          const confirmationMessages: Record<string, string> = {
            "en-US": `Language switched to ${newLanguage.name}`,
            "es-ES": `Idioma cambiado a ${newLanguage.name}`,
            "fr-FR": `Langue changée en ${newLanguage.name}`,
            "de-DE": `Sprache geändert zu ${newLanguage.name}`,
            "it-IT": `Lingua cambiata in ${newLanguage.name}`,
            "pt-BR": `Idioma alterado para ${newLanguage.name}`,
            "zh-CN": `语言已切换到${newLanguage.name}`,
            "ja-JP": `言語が${newLanguage.name}に変更されました`,
            "hi-IN": `भाषा ${newLanguage.name} में बदल गई`,
            "ar-SA": `تم تغيير اللغة إلى ${newLanguage.name}`,
          }

          const message = confirmationMessages[languageCode] || confirmationMessages["en-US"]

          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(message)
            utterance.lang = languageCode
            window.speechSynthesis.speak(utterance)
          }, 500)
        }

        // Dispatch language change event
        window.dispatchEvent(
          new CustomEvent("languageChanged", {
            detail: {
              language: languageCode,
              triggeredByVoice,
              previousLanguage: languageState.currentLanguage,
            },
          }),
        )
      } catch (error) {
        console.error("Language switch error:", error)
        setLanguageState((prev) => ({ ...prev, switchInProgress: false }))
      }
    },
    [languageState.currentLanguage, supportedLanguages],
  )

  const startVoiceLanguageDetection = useCallback(async () => {
    setLanguageState((prev) => ({ ...prev, isListening: true }))

    try {
      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
        language: "auto", // Let the engine detect language
      })

      if (result.transcript.trim()) {
        // Check if the transcript matches any language switch commands
        const detectedLanguageSwitch = supportedLanguages.find((lang) =>
          lang.voiceCommands.some((command) => result.transcript.toLowerCase().includes(command.toLowerCase())),
        )

        if (detectedLanguageSwitch) {
          await switchLanguage(detectedLanguageSwitch.code, true)
        } else {
          // Try to detect language from the transcript
          const detectedLang = result.language
          if (detectedLang && detectedLang !== languageState.currentLanguage) {
            const matchingLanguage = supportedLanguages.find(
              (lang) => lang.code.startsWith(detectedLang) || lang.code.includes(detectedLang),
            )

            if (matchingLanguage) {
              setLanguageState((prev) => ({ ...prev, detectedLanguage: matchingLanguage.code }))

              // Ask for confirmation
              if ("speechSynthesis" in window) {
                const confirmationMessage = `I detected ${matchingLanguage.name}. Would you like to switch to this language?`
                const utterance = new SpeechSynthesisUtterance(confirmationMessage)
                window.speechSynthesis.speak(utterance)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Voice language detection error:", error)
    } finally {
      setLanguageState((prev) => ({ ...prev, isListening: false }))
    }
  }, [languageState.currentLanguage, supportedLanguages, switchLanguage])

  const confirmLanguageSwitch = useCallback(() => {
    if (languageState.detectedLanguage) {
      switchLanguage(languageState.detectedLanguage, true)
      setLanguageState((prev) => ({ ...prev, detectedLanguage: undefined }))
    }
  }, [languageState.detectedLanguage, switchLanguage])

  // Listen for global voice commands for language switching
  useEffect(() => {
    const handleVoiceCommand = (event: any) => {
      const transcript = event.detail.transcript?.toLowerCase() || ""

      // Check for language switch commands
      const matchedLanguage = supportedLanguages.find((lang) =>
        lang.voiceCommands.some((command) => transcript.includes(command.toLowerCase())),
      )

      if (matchedLanguage && matchedLanguage.code !== languageState.currentLanguage) {
        switchLanguage(matchedLanguage.code, true)
      }
    }

    window.addEventListener("voiceCommand", handleVoiceCommand)
    return () => window.removeEventListener("voiceCommand", handleVoiceCommand)
  }, [supportedLanguages, languageState.currentLanguage, switchLanguage])

  const currentLang = getCurrentLanguage()
  const detectedLang = languageState.detectedLanguage
    ? supportedLanguages.find((lang) => lang.code === languageState.detectedLanguage)
    : null

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Voice Language Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Language Display */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-2xl">{currentLang.flag}</span>
          <div className="flex-1">
            <p className="font-medium">{currentLang.name}</p>
            <p className="text-sm text-muted-foreground">{currentLang.nativeName}</p>
          </div>
          <Badge variant="outline">Current</Badge>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Language:</label>
          <Select
            value={languageState.currentLanguage}
            onValueChange={(value) => switchLanguage(value)}
            disabled={languageState.switchInProgress}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Language Detection */}
        <div className="space-y-3">
          <Button
            onClick={startVoiceLanguageDetection}
            disabled={languageState.isListening || languageState.switchInProgress}
            className={`w-full ${languageState.isListening ? "animate-pulse" : ""}`}
          >
            {languageState.isListening ? (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Listening for language...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Detect Language by Voice
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Speak in any supported language or say a language switch command
          </p>
        </div>

        {/* Detected Language Confirmation */}
        {detectedLang && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{detectedLang.flag}</span>
                <div className="flex-1">
                  <p className="font-medium">Detected: {detectedLang.name}</p>
                  <p className="text-sm text-muted-foreground">{detectedLang.nativeName}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={confirmLanguageSwitch}>
                  <Check className="w-3 h-3 mr-1" />
                  Switch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLanguageState((prev) => ({ ...prev, detectedLanguage: undefined }))}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Commands Help */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Voice Commands for {currentLang.name}:</p>
          <div className="space-y-1">
            {currentLang.voiceCommands.map((command, index) => (
              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                "{command}"
              </Badge>
            ))}
          </div>
        </div>

        {/* Processing Indicator */}
        {languageState.switchInProgress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            Switching language...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
