class FreeSpeechServices {
  private synthesis: SpeechSynthesis
  private recognition: any
  private voices: SpeechSynthesisVoice[] = []
  private isListening = false

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initializeRecognition()
    this.loadVoices()
  }

  private initializeRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = "en-US"
      this.recognition.maxAlternatives = 3
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices()

    if (this.voices.length === 0) {
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices()
      }
    }
  }

  // FREE Speech-to-Text using browser native API
  async speechToText(
    options: {
      continuous?: boolean
      language?: string
      onResult?: (text: string, isFinal: boolean) => void
      onError?: (error: any) => void
    } = {},
  ): Promise<string> {
    if (!this.recognition) {
      throw new Error("Speech recognition not supported in this browser")
    }

    return new Promise((resolve, reject) => {
      this.recognition.lang = options.language || "en-US"
      this.recognition.continuous = options.continuous || false

      let finalTranscript = ""

      this.recognition.onresult = (event: any) => {
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcript
            options.onResult?.(transcript, true)
          } else {
            interimTranscript += transcript
            options.onResult?.(transcript, false)
          }
        }
      }

      this.recognition.onend = () => {
        this.isListening = false
        resolve(finalTranscript)
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        options.onError?.(event.error)
        reject(event.error)
      }

      this.isListening = true
      this.recognition.start()
    })
  }

  // FREE Text-to-Speech using browser native API
  async textToSpeech(
    text: string,
    options: {
      voice?: string
      rate?: number
      pitch?: number
      volume?: number
      language?: string
    } = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // Find voice by name or language
      if (options.voice || options.language) {
        const voice = this.voices.find(
          (v) => v.name.includes(options.voice || "") || v.lang.includes(options.language || ""),
        )
        if (voice) utterance.voice = voice
      }

      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event.error)

      this.synthesis.speak(utterance)
    })
  }

  // Get available voices (FREE)
  getAvailableVoices(): Array<{
    name: string
    language: string
    gender: string
    quality: string
  }> {
    return this.voices.map((voice) => ({
      name: voice.name,
      language: voice.lang,
      gender: voice.name.toLowerCase().includes("female") ? "female" : "male",
      quality: voice.localService ? "high" : "standard",
    }))
  }

  // Stop current speech/recognition
  stop(): void {
    if (this.isListening && this.recognition) {
      this.recognition.stop()
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening
  }

  // Check if currently speaking
  isCurrentlySpeaking(): boolean {
    return this.synthesis.speaking
  }

  // FREE Language detection (basic)
  detectLanguage(text: string): string {
    const languagePatterns = {
      es: /[ñáéíóúü]/i,
      fr: /[àâäéèêëïîôöùûüÿç]/i,
      de: /[äöüß]/i,
      it: /[àèéìíîòóù]/i,
      pt: /[ãâáàçéêíóôõú]/i,
      ru: /[а-яё]/i,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      ar: /[\u0600-\u06ff]/,
    }

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(text)) {
        return lang
      }
    }

    return "en" // Default to English
  }

  // FREE Translation using basic word replacement (limited but free)
  async basicTranslation(text: string, targetLanguage: string): Promise<string> {
    const basicTranslations: Record<string, Record<string, string>> = {
      es: {
        hello: "hola",
        goodbye: "adiós",
        "thank you": "gracias",
        please: "por favor",
        yes: "sí",
        no: "no",
        "good morning": "buenos días",
        "good night": "buenas noches",
      },
      fr: {
        hello: "bonjour",
        goodbye: "au revoir",
        "thank you": "merci",
        please: "s'il vous plaît",
        yes: "oui",
        no: "non",
        "good morning": "bonjour",
        "good night": "bonne nuit",
      },
      de: {
        hello: "hallo",
        goodbye: "auf wiedersehen",
        "thank you": "danke",
        please: "bitte",
        yes: "ja",
        no: "nein",
        "good morning": "guten morgen",
        "good night": "gute nacht",
      },
    }

    const translations = basicTranslations[targetLanguage]
    if (!translations) {
      return `[Translation to ${targetLanguage} not available in free mode] ${text}`
    }

    let translatedText = text.toLowerCase()

    for (const [english, translated] of Object.entries(translations)) {
      translatedText = translatedText.replace(new RegExp(english, "gi"), translated)
    }

    return translatedText
  }

  // Get cost savings report
  getCostSavings(): any {
    return {
      speechToText: {
        oldCost: 150, // per month
        newCost: 0,
        savings: 150,
        provider: "Browser Native Speech Recognition",
      },
      textToSpeech: {
        oldCost: 100,
        newCost: 0,
        savings: 100,
        provider: "Browser Native Speech Synthesis",
      },
      translation: {
        oldCost: 80,
        newCost: 0,
        savings: 80,
        provider: "Basic Pattern Matching",
      },
      totalMonthlySavings: 330,
    }
  }
}

export const freeSpeechServices = new FreeSpeechServices()
export default freeSpeechServices
