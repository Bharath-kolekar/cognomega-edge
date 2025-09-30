export interface TranslationRequest {
  text: string
  targetLanguage: string
  sourceLanguage?: string
  context?: string
  formality?: "formal" | "informal" | "auto"
  sessionId: string
}

export interface TranslationResponse {
  translation: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  formality: string
  context: string
  alternatives: string[]
  sessionId: string
  timestamp: number
}

export interface LanguageDetectionRequest {
  text: string
  sessionId: string
}

export interface LanguageDetectionResponse {
  detectedLanguage: string
  confidence: number
  alternatives: Array<{ language: string; confidence: number }>
  sessionId: string
}

export interface BatchTranslationRequest {
  texts: string[]
  targetLanguage: string
  sourceLanguage?: string
  sessionId: string
}

export interface BatchTranslationResponse {
  translations: Array<{
    original: string
    translation: string
    confidence: number
  }>
  sessionId: string
  totalProcessed: number
}

export class TranslationService {
  private readonly supportedLanguages = {
    en: "English",
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
    nl: "Dutch",
    sv: "Swedish",
    no: "Norwegian",
    da: "Danish",
    fi: "Finnish",
    pl: "Polish",
    tr: "Turkish",
    th: "Thai",
  }

  private readonly translationDatabase = new Map<string, Map<string, string>>()

  constructor() {
    this.initializeTranslationDatabase()
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const sourceLanguage = request.sourceLanguage || (await this.detectLanguage(request.text))
      const translationKey = `${sourceLanguage}-${request.targetLanguage}`

      let translation = this.getStoredTranslation(request.text.toLowerCase(), translationKey)

      if (!translation) {
        translation = await this.performTranslation(
          request.text,
          sourceLanguage,
          request.targetLanguage,
          request.formality,
          request.context,
        )
      }

      const alternatives = this.generateAlternatives(translation, request.formality)
      const confidence = this.calculateConfidence(request.text, translation, sourceLanguage, request.targetLanguage)

      return {
        translation,
        sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence,
        formality: request.formality || "auto",
        context: request.context || "general",
        alternatives,
        sessionId: request.sessionId,
        timestamp: Date.now(),
      }
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`)
    }
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character patterns and common words
    const lowerText = text.toLowerCase()

    // Check for specific language patterns
    if (/[а-я]/i.test(text)) return "ru" // Cyrillic
    if (/[ñáéíóúü]/i.test(text)) return "es" // Spanish accents
    if (/[àâäéèêëïîôöùûüÿç]/i.test(text)) return "fr" // French accents
    if (/[äöüß]/i.test(text)) return "de" // German umlauts
    if (/[àèéìíîòóù]/i.test(text)) return "it" // Italian accents
    if (/[ãâáàçéêíóôõú]/i.test(text)) return "pt" // Portuguese accents
    if (/[\u4e00-\u9fff]/i.test(text)) return "zh" // Chinese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/i.test(text)) return "ja" // Japanese hiragana/katakana
    if (/[\uac00-\ud7af]/i.test(text)) return "ko" // Korean hangul
    if (/[\u0600-\u06ff]/i.test(text)) return "ar" // Arabic
    if (/[\u0900-\u097f]/i.test(text)) return "hi" // Hindi

    // Check for common words
    const commonWords = {
      en: ["the", "and", "is", "in", "to", "of", "a", "that", "it", "with"],
      es: ["el", "la", "de", "que", "y", "en", "un", "es", "se", "no"],
      fr: ["le", "de", "et", "à", "un", "il", "être", "et", "en", "avoir"],
      de: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich"],
      it: ["il", "di", "che", "e", "la", "per", "un", "in", "con", "del"],
      pt: ["o", "de", "e", "do", "da", "em", "um", "para", "é", "com"],
    }

    const words = lowerText.split(/\s+/)
    let maxMatches = 0
    let detectedLang = "en"

    for (const [lang, commonWordList] of Object.entries(commonWords)) {
      const matches = words.filter((word) => commonWordList.includes(word)).length
      if (matches > maxMatches) {
        maxMatches = matches
        detectedLang = lang
      }
    }

    return detectedLang
  }

  async batchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResponse> {
    const translations = []

    for (const text of request.texts) {
      try {
        const result = await this.translateText({
          text,
          targetLanguage: request.targetLanguage,
          sourceLanguage: request.sourceLanguage,
          sessionId: request.sessionId,
        })

        translations.push({
          original: text,
          translation: result.translation,
          confidence: result.confidence,
        })
      } catch (error) {
        translations.push({
          original: text,
          translation: `[Translation Error: ${error.message}]`,
          confidence: 0,
        })
      }
    }

    return {
      translations,
      sessionId: request.sessionId,
      totalProcessed: translations.length,
    }
  }

  private async performTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    formality?: string,
    context?: string,
  ): Promise<string> {
    // In production, this would call external translation APIs
    // For now, using a mock translation system with stored translations

    const translationKey = `${sourceLanguage}-${targetLanguage}`
    const storedTranslation = this.getStoredTranslation(text.toLowerCase(), translationKey)

    if (storedTranslation) {
      return this.adjustForFormality(storedTranslation, formality)
    }

    // Fallback: return formatted text indicating translation
    return `[${this.supportedLanguages[targetLanguage] || targetLanguage}] ${text}`
  }

  private getStoredTranslation(text: string, translationKey: string): string | null {
    const languageMap = this.translationDatabase.get(translationKey)
    return languageMap?.get(text) || null
  }

  private adjustForFormality(translation: string, formality?: string): string {
    if (!formality || formality === "auto") return translation

    // Simple formality adjustments for common languages
    if (formality === "formal") {
      // Add formal markers or replace informal terms
      return translation
        .replace(/\bhey\b/gi, "hello")
        .replace(/\byeah\b/gi, "yes")
        .replace(/\bokay\b/gi, "very well")
    } else if (formality === "informal") {
      // Add informal markers or replace formal terms
      return translation
        .replace(/\bhello\b/gi, "hey")
        .replace(/\byes\b/gi, "yeah")
        .replace(/\bvery well\b/gi, "okay")
    }

    return translation
  }

  private generateAlternatives(translation: string, formality?: string): string[] {
    const alternatives = []

    // Generate formal/informal alternatives
    if (formality !== "formal") {
      alternatives.push(this.adjustForFormality(translation, "formal"))
    }
    if (formality !== "informal") {
      alternatives.push(this.adjustForFormality(translation, "informal"))
    }

    // Add contextual alternatives (mock)
    alternatives.push(`${translation} (alternative phrasing)`)

    return alternatives.filter((alt) => alt !== translation).slice(0, 3)
  }

  private calculateConfidence(
    originalText: string,
    translation: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): number {
    // Mock confidence calculation based on various factors
    let confidence = 0.8

    // Adjust based on text length
    if (originalText.length < 10) confidence -= 0.1
    if (originalText.length > 100) confidence += 0.1

    // Adjust based on language pair
    const commonPairs = ["en-es", "en-fr", "en-de", "es-en", "fr-en", "de-en"]
    if (commonPairs.includes(`${sourceLanguage}-${targetLanguage}`)) {
      confidence += 0.1
    }

    // Adjust based on stored translation availability
    const translationKey = `${sourceLanguage}-${targetLanguage}`
    if (this.getStoredTranslation(originalText.toLowerCase(), translationKey)) {
      confidence += 0.15
    }

    return Math.min(0.95, Math.max(0.3, confidence))
  }

  private initializeTranslationDatabase() {
    // Initialize with common translations
    const translations = {
      "en-es": new Map([
        ["hello", "hola"],
        ["goodbye", "adiós"],
        ["thank you", "gracias"],
        ["please", "por favor"],
        ["yes", "sí"],
        ["no", "no"],
        ["how are you", "¿cómo estás?"],
        ["good morning", "buenos días"],
        ["good night", "buenas noches"],
        ["excuse me", "disculpe"],
      ]),
      "en-fr": new Map([
        ["hello", "bonjour"],
        ["goodbye", "au revoir"],
        ["thank you", "merci"],
        ["please", "s'il vous plaît"],
        ["yes", "oui"],
        ["no", "non"],
        ["how are you", "comment allez-vous?"],
        ["good morning", "bonjour"],
        ["good night", "bonne nuit"],
        ["excuse me", "excusez-moi"],
      ]),
      "en-de": new Map([
        ["hello", "hallo"],
        ["goodbye", "auf wiedersehen"],
        ["thank you", "danke"],
        ["please", "bitte"],
        ["yes", "ja"],
        ["no", "nein"],
        ["how are you", "wie geht es dir?"],
        ["good morning", "guten morgen"],
        ["good night", "gute nacht"],
        ["excuse me", "entschuldigung"],
      ]),
    }

    for (const [key, map] of Object.entries(translations)) {
      this.translationDatabase.set(key, map)
    }
  }

  getSupportedLanguages(): Record<string, string> {
    return { ...this.supportedLanguages }
  }

  isLanguageSupported(languageCode: string): boolean {
    return languageCode in this.supportedLanguages
  }
}

export const translationService = new TranslationService()
