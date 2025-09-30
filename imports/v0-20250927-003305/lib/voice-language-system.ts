export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  voiceCommands: string[]
  speechSynthesisLang: string
  speechRecognitionLang: string
}

export interface VoiceLanguageState {
  currentLanguage: LanguageConfig
  availableLanguages: LanguageConfig[]
  isDetecting: boolean
  lastDetectedLanguage?: string
  confidence: number
}

class VoiceLanguageSystem {
  private static instance: VoiceLanguageSystem
  private state: VoiceLanguageState
  private listeners: ((state: VoiceLanguageState) => void)[] = []

  private constructor() {
    this.state = {
      currentLanguage: this.getDefaultLanguage(),
      availableLanguages: this.getSupportedLanguages(),
      isDetecting: false,
      confidence: 1.0,
    }
  }

  public static getInstance(): VoiceLanguageSystem {
    if (!VoiceLanguageSystem.instance) {
      VoiceLanguageSystem.instance = new VoiceLanguageSystem()
    }
    return VoiceLanguageSystem.instance
  }

  private getSupportedLanguages(): LanguageConfig[] {
    return [
      {
        code: "en",
        name: "English",
        nativeName: "English",
        flag: "🇺🇸",
        voiceCommands: ["switch to english", "change language to english", "english mode"],
        speechSynthesisLang: "en-US",
        speechRecognitionLang: "en-US",
      },
      {
        code: "es",
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        voiceCommands: ["cambiar a español", "español", "switch to spanish"],
        speechSynthesisLang: "es-ES",
        speechRecognitionLang: "es-ES",
      },
      {
        code: "fr",
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
        voiceCommands: ["changer en français", "français", "switch to french"],
        speechSynthesisLang: "fr-FR",
        speechRecognitionLang: "fr-FR",
      },
      {
        code: "de",
        name: "German",
        nativeName: "Deutsch",
        flag: "🇩🇪",
        voiceCommands: ["wechseln zu deutsch", "deutsch", "switch to german"],
        speechSynthesisLang: "de-DE",
        speechRecognitionLang: "de-DE",
      },
      {
        code: "it",
        name: "Italian",
        nativeName: "Italiano",
        flag: "🇮🇹",
        voiceCommands: ["cambia in italiano", "italiano", "switch to italian"],
        speechSynthesisLang: "it-IT",
        speechRecognitionLang: "it-IT",
      },
      {
        code: "pt",
        name: "Portuguese",
        nativeName: "Português",
        flag: "🇵🇹",
        voiceCommands: ["mudar para português", "português", "switch to portuguese"],
        speechSynthesisLang: "pt-PT",
        speechRecognitionLang: "pt-PT",
      },
      {
        code: "ru",
        name: "Russian",
        nativeName: "Русский",
        flag: "🇷🇺",
        voiceCommands: ["переключить на русский", "русский", "switch to russian"],
        speechSynthesisLang: "ru-RU",
        speechRecognitionLang: "ru-RU",
      },
      {
        code: "zh",
        name: "Chinese",
        nativeName: "中文",
        flag: "🇨🇳",
        voiceCommands: ["切换到中文", "中文", "switch to chinese"],
        speechSynthesisLang: "zh-CN",
        speechRecognitionLang: "zh-CN",
      },
      {
        code: "ja",
        name: "Japanese",
        nativeName: "日本語",
        flag: "🇯🇵",
        voiceCommands: ["日本語に切り替え", "日本語", "switch to japanese"],
        speechSynthesisLang: "ja-JP",
        speechRecognitionLang: "ja-JP",
      },
      {
        code: "ko",
        name: "Korean",
        nativeName: "한국어",
        flag: "🇰🇷",
        voiceCommands: ["한국어로 전환", "한국어", "switch to korean"],
        speechSynthesisLang: "ko-KR",
        speechRecognitionLang: "ko-KR",
      },
    ]
  }

  private getDefaultLanguage(): LanguageConfig {
    const browserLang = navigator.language.split("-")[0]
    return this.getSupportedLanguages().find((lang) => lang.code === browserLang) || this.getSupportedLanguages()[0]
  }

  public async detectLanguageFromVoice(transcript: string): Promise<string | null> {
    this.state.isDetecting = true
    this.notifyListeners()

    try {
      // Simple language detection based on voice commands
      for (const lang of this.state.availableLanguages) {
        for (const command of lang.voiceCommands) {
          if (transcript.toLowerCase().includes(command.toLowerCase())) {
            this.state.lastDetectedLanguage = lang.code
            this.state.confidence = 0.9
            this.state.isDetecting = false
            this.notifyListeners()
            return lang.code
          }
        }
      }

      // Fallback: detect based on character patterns
      const detectedLang = this.detectLanguageByPattern(transcript)
      if (detectedLang) {
        this.state.lastDetectedLanguage = detectedLang
        this.state.confidence = 0.7
        this.state.isDetecting = false
        this.notifyListeners()
        return detectedLang
      }

      this.state.isDetecting = false
      this.notifyListeners()
      return null
    } catch (error) {
      console.error("[v0] Language detection error:", error)
      this.state.isDetecting = false
      this.notifyListeners()
      return null
    }
  }

  private detectLanguageByPattern(text: string): string | null {
    // Simple pattern-based language detection
    if (/[\u4e00-\u9fff]/.test(text)) return "zh" // Chinese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return "ja" // Japanese hiragana/katakana
    if (/[\uac00-\ud7af]/.test(text)) return "ko" // Korean characters
    if (/[\u0400-\u04ff]/.test(text)) return "ru" // Cyrillic characters

    // European language patterns (very basic)
    if (/\b(el|la|los|las|un|una)\b/.test(text.toLowerCase())) return "es"
    if (/\b(le|la|les|un|une|des)\b/.test(text.toLowerCase())) return "fr"
    if (/\b(der|die|das|ein|eine)\b/.test(text.toLowerCase())) return "de"
    if (/\b(il|la|gli|le|un|una)\b/.test(text.toLowerCase())) return "it"
    if (/\b(o|a|os|as|um|uma)\b/.test(text.toLowerCase())) return "pt"

    return null
  }

  public async switchLanguage(languageCode: string): Promise<boolean> {
    const targetLanguage = this.state.availableLanguages.find((lang) => lang.code === languageCode)
    if (!targetLanguage) {
      console.error("[v0] Language not supported:", languageCode)
      return false
    }

    try {
      this.state.currentLanguage = targetLanguage
      this.state.confidence = 1.0
      this.notifyListeners()

      // Announce language switch in the target language
      await this.announceLanguageSwitch(targetLanguage)

      // Dispatch event for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("languageChanged", {
            detail: { language: targetLanguage },
          }),
        )
      }

      return true
    } catch (error) {
      console.error("[v0] Language switch error:", error)
      return false
    }
  }

  private async announceLanguageSwitch(language: LanguageConfig): Promise<void> {
    if ("speechSynthesis" in window) {
      const messages = {
        en: `Language switched to ${language.name}`,
        es: `Idioma cambiado a ${language.nativeName}`,
        fr: `Langue changée en ${language.nativeName}`,
        de: `Sprache geändert zu ${language.nativeName}`,
        it: `Lingua cambiata in ${language.nativeName}`,
        pt: `Idioma alterado para ${language.nativeName}`,
        ru: `Язык изменен на ${language.nativeName}`,
        zh: `语言已切换为${language.nativeName}`,
        ja: `言語が${language.nativeName}に変更されました`,
        ko: `언어가 ${language.nativeName}로 변경되었습니다`,
      }

      const message = messages[language.code as keyof typeof messages] || messages.en
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = language.speechSynthesisLang
      utterance.rate = 0.9
      utterance.pitch = 1.0

      window.speechSynthesis.speak(utterance)
    }
  }

  public handleVoiceCommand(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase()

    // Check for language switch commands
    for (const lang of this.state.availableLanguages) {
      for (const command of lang.voiceCommands) {
        if (lowerTranscript.includes(command.toLowerCase())) {
          this.switchLanguage(lang.code)
          return true
        }
      }
    }

    return false
  }

  public getCurrentLanguage(): LanguageConfig {
    return this.state.currentLanguage
  }

  public getAvailableLanguages(): LanguageConfig[] {
    return this.state.availableLanguages
  }

  public getState(): VoiceLanguageState {
    return { ...this.state }
  }

  public subscribe(listener: (state: VoiceLanguageState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }))
  }

  public getLanguageTranslations(key: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      welcome: {
        en: "Welcome to Cognomega",
        es: "Bienvenido a Cognomega",
        fr: "Bienvenue à Cognomega",
        de: "Willkommen bei Cognomega",
        it: "Benvenuto in Cognomega",
        pt: "Bem-vindo ao Cognomega",
        ru: "Добро пожаловать в Cognomega",
        zh: "欢迎来到Cognomega",
        ja: "Cognomegaへようこそ",
        ko: "Cognomega에 오신 것을 환영합니다",
      },
      listening: {
        en: "I'm listening...",
        es: "Estoy escuchando...",
        fr: "J'écoute...",
        de: "Ich höre zu...",
        it: "Sto ascoltando...",
        pt: "Estou ouvindo...",
        ru: "Я слушаю...",
        zh: "我在听...",
        ja: "聞いています...",
        ko: "듣고 있습니다...",
      },
      processing: {
        en: "Processing your request...",
        es: "Procesando tu solicitud...",
        fr: "Traitement de votre demande...",
        de: "Verarbeite deine Anfrage...",
        it: "Elaborando la tua richiesta...",
        pt: "Processando seu pedido...",
        ru: "Обрабатываю ваш запрос...",
        zh: "正在处理您的请求...",
        ja: "リクエストを処理しています...",
        ko: "요청을 처리하고 있습니다...",
      },
    }

    return translations[key] || {}
  }

  public getLocalizedText(key: string, languageCode?: string): string {
    const lang = languageCode || this.state.currentLanguage.code
    const translations = this.getLanguageTranslations(key)
    return translations[lang] || translations.en || key
  }
}

export const voiceLanguageSystem = VoiceLanguageSystem.getInstance()
