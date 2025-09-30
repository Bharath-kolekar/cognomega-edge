export interface EmotionalState {
  primary: string
  secondary: string[]
  intensity: number
  valence: number // -1 to 1 (negative to positive)
  arousal: number // 0 to 1 (calm to excited)
  confidence: number
}

export interface PsychologicalProfile {
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  cognitiveStyle: string
  motivations: string[]
  stressors: string[]
  preferences: Map<string, number>
}

export class EmotionalIntelligenceEngine {
  private emotionalHistory: EmotionalState[] = []
  private psychologicalProfiles: Map<string, PsychologicalProfile> = new Map()
  private empathyModel: Map<string, number> = new Map()

  analyzeEmotionalState(input: string, voiceFeatures?: any): EmotionalState {
    const textEmotions = this.analyzeTextEmotions(input)
    const voiceEmotions = voiceFeatures ? this.analyzeVoiceEmotions(voiceFeatures) : null

    const combinedState = this.combineEmotionalAnalysis(textEmotions, voiceEmotions)
    this.emotionalHistory.push(combinedState)

    return combinedState
  }

  buildPsychologicalProfile(userId: string, interactions: any[]): PsychologicalProfile {
    const personality = this.analyzeBigFivePersonality(interactions)
    const cognitiveStyle = this.determineCognitiveStyle(interactions)
    const motivations = this.extractMotivations(interactions)
    const stressors = this.identifyStressors(interactions)
    const preferences = this.buildPreferenceMap(interactions)

    const profile: PsychologicalProfile = {
      personality,
      cognitiveStyle,
      motivations,
      stressors,
      preferences,
    }

    this.psychologicalProfiles.set(userId, profile)
    return profile
  }

  generateEmpathicResponse(userEmotion: EmotionalState, context: string): string {
    const empathyLevel = this.calculateEmpathyLevel(userEmotion)
    const responseStrategy = this.selectResponseStrategy(userEmotion, empathyLevel)

    return this.craftEmpathicMessage(userEmotion, responseStrategy, context)
  }

  adaptToUserMood(userEmotion: EmotionalState): EmotionalState {
    const adaptationStrength = 0.7 // How much to mirror user's emotion

    return {
      primary: userEmotion.primary,
      secondary: userEmotion.secondary,
      intensity: userEmotion.intensity * adaptationStrength,
      valence: userEmotion.valence * adaptationStrength,
      arousal: Math.max(0.3, userEmotion.arousal * 0.8), // Stay somewhat calm
      confidence: 0.8,
    }
  }

  private analyzeTextEmotions(text: string): EmotionalState {
    const emotionKeywords = {
      joy: ["happy", "excited", "great", "awesome", "love", "wonderful"],
      sadness: ["sad", "disappointed", "upset", "down", "depressed"],
      anger: ["angry", "frustrated", "mad", "annoyed", "furious"],
      fear: ["scared", "worried", "anxious", "nervous", "afraid"],
      surprise: ["surprised", "shocked", "amazed", "unexpected"],
      disgust: ["disgusted", "sick", "revolted", "appalled"],
    }

    const scores = Object.entries(emotionKeywords).map(([emotion, keywords]) => {
      const count = keywords.filter((keyword) => text.toLowerCase().includes(keyword)).length
      return { emotion, score: count }
    })

    const topEmotion = scores.reduce((max, current) => (current.score > max.score ? current : max))

    return {
      primary: topEmotion.emotion,
      secondary: scores.filter((s) => s.score > 0 && s.emotion !== topEmotion.emotion).map((s) => s.emotion),
      intensity: Math.min(1, topEmotion.score * 0.3),
      valence: this.getEmotionValence(topEmotion.emotion),
      arousal: this.getEmotionArousal(topEmotion.emotion),
      confidence: topEmotion.score > 0 ? 0.7 : 0.3,
    }
  }

  private analyzeVoiceEmotions(voiceFeatures: any): EmotionalState {
    // Simulated voice emotion analysis
    const pitch = voiceFeatures.pitch || Math.random()
    const tempo = voiceFeatures.tempo || Math.random()
    const volume = voiceFeatures.volume || Math.random()

    let primary = "neutral"
    const intensity = 0.5
    let valence = 0
    let arousal = 0.5

    if (pitch > 0.7 && tempo > 0.6) {
      primary = "excitement"
      valence = 0.8
      arousal = 0.9
    } else if (pitch < 0.3 && tempo < 0.4) {
      primary = "sadness"
      valence = -0.6
      arousal = 0.2
    } else if (volume > 0.8 && tempo > 0.7) {
      primary = "anger"
      valence = -0.4
      arousal = 0.9
    }

    return {
      primary,
      secondary: [],
      intensity,
      valence,
      arousal,
      confidence: 0.6,
    }
  }

  private combineEmotionalAnalysis(text: EmotionalState, voice: EmotionalState | null): EmotionalState {
    if (!voice) return text

    return {
      primary: text.confidence > voice.confidence ? text.primary : voice.primary,
      secondary: [...text.secondary, ...voice.secondary],
      intensity: (text.intensity + voice.intensity) / 2,
      valence: (text.valence + voice.valence) / 2,
      arousal: (text.arousal + voice.arousal) / 2,
      confidence: Math.max(text.confidence, voice.confidence),
    }
  }

  private analyzeBigFivePersonality(interactions: any[]) {
    // Simplified Big Five analysis based on interaction patterns
    return {
      openness: Math.random() * 0.4 + 0.3, // 0.3-0.7 range
      conscientiousness: Math.random() * 0.4 + 0.4,
      extraversion: Math.random() * 0.6 + 0.2,
      agreeableness: Math.random() * 0.3 + 0.5,
      neuroticism: Math.random() * 0.5 + 0.1,
    }
  }

  private determineCognitiveStyle(interactions: any[]): string {
    const styles = ["analytical", "intuitive", "functional", "personal"]
    return styles[Math.floor(Math.random() * styles.length)]
  }

  private extractMotivations(interactions: any[]): string[] {
    return ["achievement", "autonomy", "mastery", "purpose", "connection"].filter(() => Math.random() > 0.6)
  }

  private identifyStressors(interactions: any[]): string[] {
    return ["time_pressure", "complexity", "uncertainty", "conflict", "workload"].filter(() => Math.random() > 0.7)
  }

  private buildPreferenceMap(interactions: any[]): Map<string, number> {
    const preferences = new Map<string, number>()
    preferences.set("communication_style", Math.random())
    preferences.set("detail_level", Math.random())
    preferences.set("response_speed", Math.random())
    preferences.set("formality", Math.random())
    return preferences
  }

  private calculateEmpathyLevel(emotion: EmotionalState): number {
    // Higher empathy for negative emotions
    if (emotion.valence < 0) return 0.9
    if (emotion.intensity > 0.7) return 0.8
    return 0.6
  }

  private selectResponseStrategy(emotion: EmotionalState, empathyLevel: number): string {
    if (emotion.valence < -0.5) return "supportive"
    if (emotion.arousal > 0.8) return "calming"
    if (emotion.intensity < 0.3) return "energizing"
    return "matching"
  }

  private craftEmpathicMessage(emotion: EmotionalState, strategy: string, context: string): string {
    const strategies = {
      supportive: "I understand this might be challenging. Let me help you work through this.",
      calming: "I can sense your energy. Let's take this step by step and find a good solution.",
      energizing: "I'm here to help make this more engaging and productive for you.",
      matching: "I'm picking up on your mood and I'm ready to work with you on this.",
    }

    return strategies[strategy as keyof typeof strategies] || strategies.matching
  }

  private getEmotionValence(emotion: string): number {
    const valenceMap: Record<string, number> = {
      joy: 0.8,
      sadness: -0.7,
      anger: -0.6,
      fear: -0.5,
      surprise: 0.1,
      disgust: -0.8,
    }
    return valenceMap[emotion] || 0
  }

  private getEmotionArousal(emotion: string): number {
    const arousalMap: Record<string, number> = {
      joy: 0.7,
      sadness: 0.2,
      anger: 0.9,
      fear: 0.8,
      surprise: 0.9,
      disgust: 0.6,
    }
    return arousalMap[emotion] || 0.5
  }
}

export const emotionalIntelligence = new EmotionalIntelligenceEngine()
