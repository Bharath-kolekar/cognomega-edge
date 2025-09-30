"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, ThumbsUp, ThumbsDown, Star, Send } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface FeedbackEntry {
  id: string
  timestamp: number
  type: "voice" | "text"
  content: string
  rating?: number
  category: "bug" | "suggestion" | "praise" | "question"
  processed: boolean
  response?: string
}

interface VoiceFeedbackAnalysis {
  sentiment: "positive" | "negative" | "neutral"
  category: "bug" | "suggestion" | "praise" | "question"
  confidence: number
  keywords: string[]
  urgency: "low" | "medium" | "high"
}

export function VoiceFeedbackSystem() {
  const [isListening, setIsListening] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<VoiceFeedbackAnalysis | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState(true)
  const [quickRating, setQuickRating] = useState<number | null>(null)

  const analysisRef = useRef<VoiceFeedbackAnalysis | null>(null)

  const analyzeFeedback = useCallback((text: string): VoiceFeedbackAnalysis => {
    const normalizedText = text.toLowerCase()

    // Sentiment analysis
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "love",
      "perfect",
      "awesome",
      "fantastic",
      "helpful",
      "useful",
    ]
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "broken",
      "bug",
      "error",
      "problem",
      "issue",
      "wrong",
      "slow",
      "confusing",
    ]

    const positiveCount = positiveWords.filter((word) => normalizedText.includes(word)).length
    const negativeCount = negativeWords.filter((word) => normalizedText.includes(word)).length

    let sentiment: "positive" | "negative" | "neutral" = "neutral"
    if (positiveCount > negativeCount) sentiment = "positive"
    else if (negativeCount > positiveCount) sentiment = "negative"

    // Category detection
    let category: "bug" | "suggestion" | "praise" | "question" = "suggestion"
    if (normalizedText.includes("bug") || normalizedText.includes("error") || normalizedText.includes("broken")) {
      category = "bug"
    } else if (sentiment === "positive" && (normalizedText.includes("good") || normalizedText.includes("great"))) {
      category = "praise"
    } else if (
      normalizedText.includes("?") ||
      normalizedText.includes("how") ||
      normalizedText.includes("what") ||
      normalizedText.includes("why")
    ) {
      category = "question"
    }

    // Urgency detection
    let urgency: "low" | "medium" | "high" = "low"
    if (
      normalizedText.includes("urgent") ||
      normalizedText.includes("critical") ||
      normalizedText.includes("immediately")
    ) {
      urgency = "high"
    } else if (normalizedText.includes("soon") || normalizedText.includes("important") || category === "bug") {
      urgency = "medium"
    }

    // Extract keywords
    const keywords = text
      .split(" ")
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "this",
            "that",
            "with",
            "have",
            "will",
            "been",
            "from",
            "they",
            "know",
            "want",
            "been",
            "good",
            "just",
            "like",
            "time",
            "very",
            "when",
            "come",
            "here",
            "could",
            "would",
            "there",
            "each",
            "which",
            "their",
            "said",
            "make",
            "most",
            "over",
            "think",
            "also",
            "back",
            "after",
            "first",
            "well",
            "work",
            "life",
            "only",
            "new",
            "years",
            "way",
            "may",
            "say",
          ].includes(word.toLowerCase()),
      )
      .slice(0, 5)

    return {
      sentiment,
      category,
      confidence: Math.min(0.9, Math.max(0.3, (positiveCount + negativeCount) / 10 + 0.5)),
      keywords,
      urgency,
    }
  }, [])

  const generateResponse = useCallback((analysis: VoiceFeedbackAnalysis, content: string): string => {
    const responses = {
      bug: [
        "Thank you for reporting this issue. I'll make sure the development team investigates this problem.",
        "I appreciate you bringing this bug to my attention. This helps improve the system for everyone.",
        "Thanks for the bug report! I've logged this issue and it will be prioritized for fixing.",
      ],
      suggestion: [
        "That's a great suggestion! I'll pass this along to help improve the user experience.",
        "Thank you for the feedback. Your suggestions help make the system better.",
        "I appreciate your input! This suggestion will be considered for future updates.",
      ],
      praise: [
        "Thank you so much! It's wonderful to hear that you're enjoying the experience.",
        "I'm delighted that you're having a positive experience! Your feedback motivates continued improvement.",
        "That's fantastic to hear! Thank you for taking the time to share your positive experience.",
      ],
      question: [
        "That's a great question! Let me help you with that.",
        "I'd be happy to help answer your question.",
        "Thanks for asking! I'll do my best to provide you with a helpful answer.",
      ],
    }

    const categoryResponses = responses[analysis.category]
    const baseResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)]

    // Add specific guidance based on content
    let specificGuidance = ""
    if (analysis.category === "question") {
      if (content.toLowerCase().includes("voice")) {
        specificGuidance = " For voice-related questions, you can say 'voice settings' to customize your experience."
      } else if (content.toLowerCase().includes("create") || content.toLowerCase().includes("build")) {
        specificGuidance = " To create apps, simply describe what you want to build and I'll generate the code for you."
      }
    }

    return baseResponse + specificGuidance
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (audioFeedback && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      }
    },
    [audioFeedback],
  )

  const startVoiceFeedback = useCallback(async () => {
    try {
      setIsListening(true)
      setIsProcessing(false)

      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
      })

      if (result.transcript.trim()) {
        setFeedbackText(result.transcript)
        await processFeedback(result.transcript, "voice")
      }
    } catch (error) {
      console.error("Voice feedback error:", error)
      speak("Sorry, I couldn't capture your voice feedback. Please try again.")
    } finally {
      setIsListening(false)
    }
  }, [])

  const processFeedback = useCallback(
    async (content: string, type: "voice" | "text") => {
      setIsProcessing(true)

      const analysis = analyzeFeedback(content)
      setCurrentAnalysis(analysis)
      analysisRef.current = analysis

      const response = generateResponse(analysis, content)

      const newEntry: FeedbackEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
        content,
        category: analysis.category,
        processed: true,
        response,
        rating: quickRating || undefined,
      }

      setFeedbackEntries((prev) => [newEntry, ...prev])

      // Provide audio feedback
      speak(response)

      // Reset form
      setFeedbackText("")
      setQuickRating(null)
      setIsProcessing(false)

      // Auto-hide analysis after 5 seconds
      setTimeout(() => {
        setCurrentAnalysis(null)
      }, 5000)
    },
    [analyzeFeedback, generateResponse, speak, quickRating],
  )

  const submitTextFeedback = () => {
    if (feedbackText.trim()) {
      processFeedback(feedbackText, "text")
    }
  }

  const handleQuickRating = (rating: number) => {
    setQuickRating(rating)
    const ratingText = `I rate this experience ${rating} out of 5 stars`
    processFeedback(ratingText, "text")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bug":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "suggestion":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "praise":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "question":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="w-4 h-4 text-green-500" />
      case "negative":
        return <ThumbsDown className="w-4 h-4 text-red-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Feedback Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Voice Feedback & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Rating:</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRating(rating)}
                  className={quickRating === rating ? "bg-primary text-primary-foreground" : ""}
                >
                  <Star className={`w-4 h-4 ${rating <= (quickRating || 0) ? "fill-current" : ""}`} />
                </Button>
              ))}
            </div>
          </div>

          {/* Voice Input */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={startVoiceFeedback}
                disabled={isListening || isProcessing}
                className={`flex-1 ${isListening ? "animate-pulse" : ""}`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Listening for feedback...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Give Voice Feedback
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={() => setAudioFeedback(!audioFeedback)}>
                {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>

            {/* Text Input Alternative */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Or type your feedback:</p>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Share your thoughts, report bugs, or ask questions..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button onClick={submitTextFeedback} disabled={!feedbackText.trim() || isProcessing}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Analysis */}
          {currentAnalysis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {getSentimentIcon(currentAnalysis.sentiment)}
                  <span className="font-medium">Feedback Analysis</span>
                  <Badge className={getCategoryColor(currentAnalysis.category)}>{currentAnalysis.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sentiment:</span>
                    <span className="ml-2 capitalize">{currentAnalysis.sentiment}</span>
                  </div>
                  <div>
                    <span className="font-medium">Urgency:</span>
                    <span className="ml-2 capitalize">{currentAnalysis.urgency}</span>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-2">{Math.round(currentAnalysis.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Keywords:</span>
                    <span className="ml-2">{currentAnalysis.keywords.join(", ")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              Processing your feedback...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Feedback History</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Hide" : "Show"} History
            </Button>
          </div>
        </CardHeader>

        {showHistory && (
          <CardContent>
            <div className="space-y-4">
              {feedbackEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No feedback entries yet. Share your thoughts to get started!
                </p>
              ) : (
                feedbackEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                      <Badge className={getCategoryColor(entry.category)}>{entry.category}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm">{entry.content}</p>

                    {entry.response && (
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-xs text-muted-foreground mb-1">AI Response:</p>
                        <p className="text-sm">{entry.response}</p>
                      </div>
                    )}

                    {entry.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Rating:</span>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < entry.rating! ? "fill-current text-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
