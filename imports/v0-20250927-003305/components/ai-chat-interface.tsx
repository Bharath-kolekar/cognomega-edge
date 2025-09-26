"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Trash2, Copy } from "lucide-react"
import { useServiceGateway } from "@/hooks/use-service-gateway"

interface AIChatInterfaceProps {
  voiceCommand?: string
  onResponse?: (response: string) => void
  className?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export function AIChatInterface({ voiceCommand, onResponse, className }: AIChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { sendMessage, generateSpeech, isReady, health, error: gatewayError } = useServiceGateway()

  // Handle voice commands
  useEffect(() => {
    if (voiceCommand && voiceCommand.trim()) {
      console.log("[v0] Processing voice command:", voiceCommand)
      setInput(voiceCommand)
      handleSendMessage(voiceCommand)
    }
  }, [voiceCommand])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendMessage(textToSend)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      onResponse?.(result.response)

      // Auto-speak AI responses if audio is available
      if (result.audioResponse) {
        setIsSpeaking(true)
        const audioUrl = URL.createObjectURL(result.audioResponse)
        const audio = new Audio(audioUrl)

        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }

        await audio.play()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const stopSpeaking = () => {
    setIsSpeaking(false)
    // In a real implementation, you'd stop the current audio playback
  }

  if (!isReady) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Initializing AI services...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Assistant Chat
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={isLoading ? "default" : "secondary"}>{isLoading ? "Processing..." : "Ready"}</Badge>
            <Badge variant={health.conversation ? "default" : "destructive"}>
              AI {health.conversation ? "ON" : "OFF"}
            </Badge>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-96 w-full border rounded-lg p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation with voice commands or text input.</p>
                <p className="text-sm mt-2">
                  Try saying: "Create a chart", "Translate to Spanish", or "Analyze an image"
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {message.role === "user" ? "You" : "AI"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error Display */}
        {(error || gatewayError) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error: {error || gatewayError}</p>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice commands..."
            className="flex-1 min-h-[60px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="lg">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>

        {/* Voice Status */}
        {isSpeaking && (
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm">AI is speaking...</span>
            </div>
            <Button variant="outline" size="sm" onClick={stopSpeaking}>
              Stop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
