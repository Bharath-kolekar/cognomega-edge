"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Brain, Zap, Eye, MessageCircle, User, Cpu } from "lucide-react"

interface AIAssistantAvatarProps {
  isListening?: boolean
  isProcessing?: boolean
  isThinking?: boolean
  onStartListening?: () => void
  onStopListening?: () => void
  onHover?: (message: string) => void
  className?: string
}

export default function AIAssistantAvatar({
  isListening = false,
  isProcessing = false,
  isThinking = false,
  onStartListening,
  onStopListening,
  onHover,
  className = "",
}: AIAssistantAvatarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const avatarRef = useRef<HTMLDivElement>(null)

  const proactiveMessages = [
    "🤖 Digital consciousness online. Ready to architect your vision.",
    "👁️ Neural networks synchronized. What shall we create together?",
    "🧠 AI humanoid systems activated. Describe your project.",
    "⚡ Advanced intelligence ready. Let's build something extraordinary.",
    "🔮 Consciousness matrix engaged. Your ideas become reality.",
    "🌐 Human-AI collaboration mode active. Ready for complex solutions.",
  ]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const deltaX = (e.clientX - centerX) / 10
        const deltaY = (e.clientY - centerY) / 10
        setEyePosition({
          x: Math.max(-3, Math.min(3, deltaX)),
          y: Math.max(-2, Math.min(2, deltaY)),
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Proactive message rotation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage = proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)]
      setCurrentMessage(randomMessage)
      if (onHover) {
        onHover(randomMessage)
      }
    }, 12000)

    return () => clearInterval(interval)
  }, [onHover])

  const handleClick = () => {
    if (isListening) {
      onStopListening?.()
    } else {
      onStartListening?.()
    }
  }

  const handleHover = () => {
    setIsHovered(true)
    const contextualMessage = isProcessing
      ? "🔄 Neural pathways processing your request across quantum dimensions..."
      : isThinking
        ? "🧠 AI consciousness analyzing infinite solution matrices..."
        : "✨ Click to activate voice interface, or explore for intelligent guidance!"

    setCurrentMessage(contextualMessage)
    if (onHover) {
      onHover(contextualMessage)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 neural-pathways opacity-20" />
      <div className="absolute inset-0 consciousness-core opacity-10" />

      <div
        ref={avatarRef}
        className={`
          relative w-48 h-64 mx-auto cursor-pointer transition-all duration-700
          ${isHovered ? "scale-105" : "scale-100"}
          ${isListening ? "animate-pulse" : ""}
        `}
        onClick={handleClick}
        onMouseEnter={handleHover}
        onMouseLeave={() => setIsHovered(false)}
        style={{ animation: "humanoidFloat 6s ease-in-out infinite" }}
      >
        <div className="absolute inset-0 humanoid-silhouette rounded-3xl overflow-hidden">
          {/* Head section */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-24 rounded-2xl tech-human-border overflow-hidden">
            {/* Digital face background */}
            <div className="w-full h-full digital-face relative">
              {/* Eyes */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                <div
                  className="w-3 h-3 rounded-full android-glow bg-primary"
                  style={{
                    transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                    animation: "digitalEyeGlow 2s ease-in-out infinite",
                  }}
                />
                <div
                  className="w-3 h-3 rounded-full android-glow bg-secondary"
                  style={{
                    transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                    animation: "digitalEyeGlow 2s ease-in-out infinite 0.5s",
                  }}
                />
              </div>

              {/* Neural interface lines */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-4 bg-gradient-to-t from-primary to-transparent opacity-60"
                  style={{
                    top: "60%",
                    left: `${30 + i * 15}%`,
                    animation: `neural-line 3s ease-in-out infinite ${i * 0.3}s`,
                  }}
                />
              ))}

              {/* Consciousness indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full consciousness-core" />
            </div>
          </div>

          {/* Torso section */}
          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-16 h-20 rounded-xl tech-human-border overflow-hidden">
            <div className="w-full h-full humanoid-silhouette relative">
              {/* Central processing core */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full android-glow flex items-center justify-center">
                <Cpu className="w-4 h-4 text-primary animate-pulse" />
              </div>

              {/* Data flow lines */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-6 bg-gradient-to-t from-secondary to-transparent opacity-40"
                  style={{
                    top: "20%",
                    left: `${20 + i * 12}%`,
                    transform: `rotate(${i * 30}deg)`,
                    transformOrigin: "bottom center",
                    animation: `neural-line 4s ease-in-out infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Status indicators */}
          <div className="absolute top-2 right-2">
            {isListening && (
              <div className="w-6 h-6 rounded-full android-glow flex items-center justify-center animate-pulse">
                <Mic className="w-3 h-3 text-primary" />
              </div>
            )}
            {isThinking && (
              <div className="w-6 h-6 rounded-full android-glow flex items-center justify-center">
                <Brain className="w-3 h-3 text-secondary animate-pulse" />
              </div>
            )}
          </div>

          {/* Capability orbs around the humanoid */}
          <div className="absolute -inset-8 pointer-events-none">
            {/* Vision capability */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-8 h-8 rounded-full android-glow flex items-center justify-center animate-pulse">
                <Eye className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Processing capability */}
            <div className="absolute top-1/2 right-0 transform translate-x-2 -translate-y-1/2">
              <div
                className="w-8 h-8 rounded-full android-glow flex items-center justify-center"
                style={{ animation: "humanoidFloat 4s ease-in-out infinite 2s" }}
              >
                <Zap className="w-4 h-4 text-secondary" />
              </div>
            </div>

            {/* Communication capability */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
              <div
                className="w-8 h-8 rounded-full android-glow flex items-center justify-center"
                style={{ animation: "humanoidFloat 4s ease-in-out infinite 4s" }}
              >
                <MessageCircle className="w-4 h-4 text-accent" />
              </div>
            </div>

            {/* Identity capability */}
            <div className="absolute top-1/2 left-0 transform -translate-x-2 -translate-y-1/2">
              <div
                className="w-8 h-8 rounded-full android-glow flex items-center justify-center"
                style={{ animation: "humanoidFloat 4s ease-in-out infinite 6s" }}
              >
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Processing overlay */}
          {isProcessing && <div className="absolute inset-0 neural-pathways opacity-60 animate-pulse" />}

          {/* Ambient particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary opacity-40"
                style={{
                  top: `${15 + Math.random() * 70}%`,
                  left: `${15 + Math.random() * 70}%`,
                  animation: `sparkle ${3 + Math.random() * 2}s ease-in-out infinite ${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Message tooltip */}
      {currentMessage && isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6 max-w-sm z-10">
          <div className="tech-human-border android-glow rounded-xl p-4 text-sm text-center animate-slide-up backdrop-blur-xl">
            <p className="text-foreground font-medium">{currentMessage}</p>
            <div className="flex justify-center mt-2 space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
