"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useVoiceRecognition } from "@/hooks/use-voice-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { Mic, MicOff, Volume2, VolumeX, Copy, RefreshCw, ArrowRightLeft } from "lucide-react"

interface Translation {
  id: string
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: Date
  confidence?: number
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
]

// Mock translation function - in real app, use translation service
const translateText = async (text: string, targetLang: string, sourceLang = "auto"): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const translations: Record<string, Record<string, string>> = {
    "hello world": {
      es: "Hola mundo",
      fr: "Bonjour le monde",
      de: "Hallo Welt",
      it: "Ciao mondo",
      pt: "Olá mundo",
      ru: "Привет мир",
      ja: "こんにちは世界",
      ko: "안녕하세요 세계",
      zh: "你好世界",
      ar: "مرحبا بالعالم",
      hi: "नमस्ते दुनिया",
    },
    "how are you": {
      es: "¿Cómo estás?",
      fr: "Comment allez-vous?",
      de: "Wie geht es dir?",
      it: "Come stai?",
      pt: "Como você está?",
      ru: "Как дела?",
      ja: "元気ですか？",
      ko: "어떻게 지내세요?",
      zh: "你好吗？",
      ar: "كيف حالك؟",
      hi: "आप कैसे हैं?",
    },
    "thank you": {
      es: "Gracias",
      fr: "Merci",
      de: "Danke",
      it: "Grazie",
      pt: "Obrigado",
      ru: "Спасибо",
      ja: "ありがとう",
      ko: "감사합니다",
      zh: "谢谢",
      ar: "شكرا لك",
      hi: "धन्यवाद",
    },
  }

  const lowerText = text.toLowerCase()
  const translation = translations[lowerText]?.[targetLang]

  if (translation) {
    return translation
  }

  // Fallback mock translation
  const langNames: Record<string, string> = {
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
  }

  return `[${langNames[targetLang] || targetLang}] ${text}`
}

export function VoiceTranslation() {
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [inputText, setInputText] = useState("")
  const [translations, setTranslations] = useState<Translation[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [voiceCommand, setVoiceCommand] = useState("")

  const { speak, isSpeaking, stop: stopSpeaking, voices } = useTextToSpeech()

  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition({
    language: sourceLanguage === "auto" ? "en-US" : `${sourceLanguage}-${sourceLanguage.toUpperCase()}`,
    onResult: (text, isFinal) => {
      if (isFinal) {
        handleVoiceInput(text)
      }
    },
  })

  const handleVoiceInput = async (text: string) => {
    console.log("[v0] Processing voice input for translation:", text)
    setVoiceCommand(text)
    setInputText(text)

    // Check for voice commands
    const lowerText = text.toLowerCase()

    // Language switching commands
    if (lowerText.includes("translate to") || lowerText.includes("switch to")) {
      const langMatch = SUPPORTED_LANGUAGES.find((lang) => lowerText.includes(lang.name.toLowerCase()))
      if (langMatch) {
        setTargetLanguage(langMatch.code)
        speak(`Switching target language to ${langMatch.name}`)
        return
      }
    }

    // Swap languages command
    if (lowerText.includes("swap languages") || lowerText.includes("reverse languages")) {
      const temp = sourceLanguage
      setSourceLanguage(targetLanguage)
      setTargetLanguage(temp)
      speak("Languages swapped")
      return
    }

    // Auto-translate voice input
    if (text.trim()) {
      await performTranslation(text)
    }
  }

  const performTranslation = async (text: string = inputText) => {
    if (!text.trim()) return

    setIsTranslating(true)

    try {
      const translatedText = await translateText(text, targetLanguage, sourceLanguage)

      const newTranslation: Translation = {
        id: Date.now().toString(),
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        timestamp: new Date(),
        confidence: Math.random() * 0.3 + 0.7, // Mock confidence score
      }

      setTranslations((prev) => [newTranslation, ...prev.slice(0, 9)]) // Keep last 10 translations

      // Speak the translation
      const targetLangVoice = voices.find((voice) => voice.lang.startsWith(targetLanguage))

      speak(translatedText)
    } catch (error) {
      console.error("[v0] Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const swapLanguages = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    speak("Languages swapped")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    speak("Text copied to clipboard")
  }

  const speakTranslation = (translation: Translation) => {
    speak(translation.translatedText)
  }

  const clearHistory = () => {
    setTranslations([])
    speak("Translation history cleared")
  }

  return (
    <div className="space-y-6">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            Voice Translation System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="font-medium">{isListening ? "Listening for translation..." : "Voice Ready"}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant={isListening ? "destructive" : "secondary"}>{isListening ? "Recording" : "Standby"}</Badge>
              <Badge variant={isTranslating ? "default" : "outline"}>
                {isTranslating ? "Translating..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Language</label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🌍 Auto-detect</SelectItem>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-center">
              <Button variant="outline" size="sm" onClick={swapLanguages} className="mb-2 bg-transparent">
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice Controls */}
          <div className="flex gap-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              className="flex-1"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Voice Translation
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                resetTranscript()
                setVoiceCommand("")
                setInputText("")
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Current Voice Command */}
          {voiceCommand && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Voice Input:</p>
              <p className="text-sm font-mono">{voiceCommand}</p>
            </div>
          )}

          {/* Voice Command Examples */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="font-medium mb-2">Voice Commands:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-primary">Translation:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>"Hello world"</li>
                  <li>"How are you today?"</li>
                  <li>"Thank you very much"</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-primary">Commands:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>"Translate to Spanish"</li>
                  <li>"Switch to French"</li>
                  <li>"Swap languages"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Translation Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type text to translate or use voice input above..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => performTranslation()}
              disabled={!inputText.trim() || isTranslating}
              className="flex-1"
            >
              {isTranslating ? "Translating..." : "Translate Text"}
            </Button>
            <Button variant="outline" onClick={() => speak(inputText)} disabled={!inputText.trim() || isSpeaking}>
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Translation History */}
      {translations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Translation History</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{translations.length} translations</Badge>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-4">
                {translations.map((translation) => (
                  <div key={translation.id} className="p-4 border rounded-lg space-y-3">
                    {/* Translation Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {SUPPORTED_LANGUAGES.find((l) => l.code === translation.sourceLanguage)?.flag}
                          {SUPPORTED_LANGUAGES.find((l) => l.code === translation.sourceLanguage)?.name ||
                            translation.sourceLanguage}
                        </Badge>
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                        <Badge variant="outline">
                          {SUPPORTED_LANGUAGES.find((l) => l.code === translation.targetLanguage)?.flag}
                          {SUPPORTED_LANGUAGES.find((l) => l.code === translation.targetLanguage)?.name ||
                            translation.targetLanguage}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => speakTranslation(translation)}>
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(translation.translatedText)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Original Text */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Original:</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{translation.originalText}</p>
                    </div>

                    {/* Translated Text */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Translation:</p>
                      <p className="text-sm bg-primary/5 p-2 rounded font-medium">{translation.translatedText}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{translation.timestamp.toLocaleTimeString()}</span>
                      {translation.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(translation.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
