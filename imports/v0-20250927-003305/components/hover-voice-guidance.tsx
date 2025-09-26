"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Volume2, VolumeX, HelpCircle } from "lucide-react"
import { aiConversationEngine } from "@/lib/ai-conversation-engine"
import { contextualMemory } from "@/lib/contextual-memory"

interface HoverGuidanceProps {
  children: React.ReactNode
  guidanceKey: string
  customMessage?: string
  priority?: "low" | "medium" | "high"
  delay?: number
  className?: string
}

interface GuidanceState {
  isActive: boolean
  currentMessage: string
  isPlaying: boolean
  position: { x: number; y: number }
  element: string
}

export function HoverVoiceGuidance({
  children,
  guidanceKey,
  customMessage,
  priority = "medium",
  delay = 800,
  className = "",
}: HoverGuidanceProps) {
  const [guidanceState, setGuidanceState] = useState<GuidanceState>({
    isActive: false,
    currentMessage: "",
    isPlaying: false,
    position: { x: 0, y: 0 },
    element: guidanceKey,
  })

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Contextual guidance messages
  const getContextualMessage = useCallback(async (): Promise<string> => {
    if (customMessage) return customMessage

    // Get contextual guidance from AI engine
    const baseMessage = aiConversationEngine.getContextualGuidance(guidanceKey)

    // Get personalized suggestions from memory
    const personalizedSuggestions = contextualMemory.getPersonalizedSuggestions(guidanceKey)
    const insights = contextualMemory.getContextualInsights(guidanceKey)

    // Combine base message with personalized insights
    let enhancedMessage = baseMessage

    if (personalizedSuggestions.length > 0 && Math.random() > 0.7) {
      enhancedMessage += ` ${personalizedSuggestions[0]}`
    }

    if (insights.recommendations.length > 0 && Math.random() > 0.8) {
      enhancedMessage += ` Pro tip: ${insights.recommendations[0]}`
    }

    return enhancedMessage
  }, [guidanceKey, customMessage])

  const speakMessage = useCallback(
    async (message: string) => {
      if (!isVoiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

      // Stop any current speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      // Choose a pleasant voice if available
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) => voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.lang.includes("en"),
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        setGuidanceState((prev) => ({ ...prev, isPlaying: true }))
      }

      utterance.onend = () => {
        setGuidanceState((prev) => ({ ...prev, isPlaying: false }))
      }

      utterance.onerror = () => {
        setGuidanceState((prev) => ({ ...prev, isPlaying: false }))
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)

      // Record interaction for learning
      contextualMemory.addMemory("interaction", { element: guidanceKey, message }, 0.3, ["hover_guidance", guidanceKey])
    },
    [isVoiceEnabled, guidanceKey],
  )

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }

      const rect = elementRef.current?.getBoundingClientRect()
      if (rect) {
        setGuidanceState((prev) => ({
          ...prev,
          position: { x: rect.left + rect.width / 2, y: rect.top },
        }))
      }

      const timeout = setTimeout(async () => {
        const message = await getContextualMessage()
        setGuidanceState((prev) => ({
          ...prev,
          isActive: true,
          currentMessage: message,
          element: guidanceKey,
        }))

        // Speak the message if voice is enabled
        if (isVoiceEnabled) {
          await speakMessage(message)
        }
      }, delay)

      setHoverTimeout(timeout)
    },
    [delay, getContextualMessage, guidanceKey, isVoiceEnabled, speakMessage, hoverTimeout],
  )

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    setGuidanceState((prev) => ({
      ...prev,
      isActive: false,
      currentMessage: "",
    }))

    // Stop speech
    if (utteranceRef.current && typeof window !== "undefined") {
      window.speechSynthesis.cancel()
    }
  }, [hoverTimeout])

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => !prev)
    if (!isVoiceEnabled && typeof window !== "undefined") {
      window.speechSynthesis.cancel()
    }
  }, [isVoiceEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel()
      }
    }
  }, [hoverTimeout])

  return (
    <>
      <div
        ref={elementRef}
        className={`relative ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {/* Hover indicator */}
        {guidanceState.isActive && (
          <div className="absolute -top-2 -right-2 z-50">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center animate-ai-pulse">
              <HelpCircle className="w-3 h-3 text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Global voice toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleVoice}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
            ${
              isVoiceEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }
            ${guidanceState.isPlaying ? "animate-ai-pulse" : ""}
          `}
          title={isVoiceEnabled ? "Disable voice guidance" : "Enable voice guidance"}
        >
          {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Guidance tooltip */}
      {guidanceState.isActive && guidanceState.currentMessage && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: guidanceState.position.x,
            top: guidanceState.position.y - 10,
            transform: "translateX(-50%) translateY(-100%)",
          }}
        >
          <div className="ai-glass-effect rounded-lg p-3 max-w-xs shadow-lg animate-slide-up">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                {guidanceState.isPlaying ? (
                  <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground/90 leading-relaxed">{guidanceState.currentMessage}</p>
                {priority === "high" && <div className="mt-1 text-xs text-primary font-medium">Important guidance</div>}
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Higher-order component for easy wrapping
export function withHoverGuidance<P extends object>(
  Component: React.ComponentType<P>,
  guidanceKey: string,
  customMessage?: string,
) {
  return function WrappedComponent(props: P) {
    return (
      <HoverVoiceGuidance guidanceKey={guidanceKey} customMessage={customMessage}>
        <Component {...props} />
      </HoverVoiceGuidance>
    )
  }
}

// Specialized guidance components
export function GuidedButton({
  children,
  guidanceKey,
  customMessage,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  guidanceKey: string
  customMessage?: string
}) {
  return (
    <HoverVoiceGuidance guidanceKey={guidanceKey} customMessage={customMessage}>
      <button {...props}>{children}</button>
    </HoverVoiceGuidance>
  )
}

export function GuidedTextarea({
  guidanceKey,
  customMessage,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  guidanceKey: string
  customMessage?: string
}) {
  return (
    <HoverVoiceGuidance guidanceKey={guidanceKey} customMessage={customMessage}>
      <textarea {...props} />
    </HoverVoiceGuidance>
  )
}

export function GuidedSection({
  children,
  guidanceKey,
  customMessage,
  className = "",
}: {
  children: React.ReactNode
  guidanceKey: string
  customMessage?: string
  className?: string
}) {
  return (
    <HoverVoiceGuidance guidanceKey={guidanceKey} customMessage={customMessage} className={className}>
      <div>{children}</div>
    </HoverVoiceGuidance>
  )
}
