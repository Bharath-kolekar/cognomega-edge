export interface VoiceRecognitionRequest {
  sessionId: string
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

export interface VoiceRecognitionResponse {
  transcript: string
  confidence: number
  isFinal: boolean
  sessionId: string
  timestamp: number
}

export interface TextToSpeechRequest {
  text: string
  sessionId: string
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  language?: string
}

export interface TextToSpeechResponse {
  success: boolean
  sessionId: string
  audioUrl?: string
  duration?: number
  error?: string
}

export interface VoiceAnalysisRequest {
  audioData: string
  analysisType: "emotion" | "accent" | "language" | "quality"
  sessionId: string
}

export interface VoiceAnalysisResponse {
  analysis: {
    emotion?: string
    accent?: string
    language?: string
    quality?: number
    confidence: number
  }
  sessionId: string
}

export class VoiceProcessingService {
  private activeRecognitions = new Map<string, any>()
  private speechSynthesis: SpeechSynthesis | null = null
  private availableVoices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (this.speechSynthesis) {
      const updateVoices = () => {
        this.availableVoices = this.speechSynthesis!.getVoices()
      }
      updateVoices()
      this.speechSynthesis.onvoiceschanged = updateVoices
    }
  }

  async startVoiceRecognition(request: VoiceRecognitionRequest): Promise<VoiceRecognitionResponse> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        reject(new Error("Speech recognition not supported"))
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = request.continuous ?? true
      recognition.interimResults = request.interimResults ?? true
      recognition.lang = request.language ?? "en-US"

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          resolve({
            transcript: result[0].transcript,
            confidence: result[0].confidence,
            isFinal: result.isFinal,
            sessionId: request.sessionId,
            timestamp: Date.now(),
          })
        }
      }

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      recognition.start()
      this.activeRecognitions.set(request.sessionId, recognition)
    })
  }

  stopVoiceRecognition(sessionId: string): void {
    const recognition = this.activeRecognitions.get(sessionId)
    if (recognition) {
      recognition.stop()
      this.activeRecognitions.delete(sessionId)
    }
  }

  async synthesizeSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        resolve({
          success: false,
          sessionId: request.sessionId,
          error: "Text-to-speech not supported",
        })
        return
      }

      const utterance = new SpeechSynthesisUtterance(request.text)

      // Set voice options
      if (request.voice) {
        const voice = this.availableVoices.find((v) => v.name === request.voice)
        if (voice) utterance.voice = voice
      }

      utterance.rate = request.rate ?? 1
      utterance.pitch = request.pitch ?? 1
      utterance.volume = request.volume ?? 1

      utterance.onend = () => {
        resolve({
          success: true,
          sessionId: request.sessionId,
          duration: request.text.length * 100, // Rough estimate
        })
      }

      utterance.onerror = (event) => {
        resolve({
          success: false,
          sessionId: request.sessionId,
          error: `Speech synthesis error: ${event.error}`,
        })
      }

      this.speechSynthesis.speak(utterance)
    })
  }

  async analyzeVoice(request: VoiceAnalysisRequest): Promise<VoiceAnalysisResponse> {
    // Mock voice analysis - in production, this would use advanced ML models
    const mockAnalysis = {
      emotion: "neutral",
      accent: "american",
      language: "en-US",
      quality: 0.85,
      confidence: 0.78,
    }

    return {
      analysis: mockAnalysis,
      sessionId: request.sessionId,
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices
  }

  cleanup(): void {
    this.activeRecognitions.forEach((recognition) => {
      recognition.stop()
    })
    this.activeRecognitions.clear()
  }
}

export const voiceProcessingService = new VoiceProcessingService()
