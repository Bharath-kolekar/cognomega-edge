"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface NLPAnalysis {
  sentiment: "positive" | "negative" | "neutral"
  confidence: number
  entities: string[]
  intent: string
  language: string
  complexity: number
}

export function AdvancedNLPInterface() {
  const [input, setInput] = useState("")
  const [analysis, setAnalysis] = useState<NLPAnalysis | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [semanticNodes, setSemanticNodes] = useState<Array<{ x: number; y: number; word: string; importance: number }>>(
    [],
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const analyzeText = async (text: string) => {
    if (!text.trim()) return

    setIsProcessing(true)

    // Simulate advanced NLP processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const words = text.split(" ").filter((word) => word.length > 2)
    const entities = words.filter((word) => word[0] === word[0].toUpperCase())

    const mockAnalysis: NLPAnalysis = {
      sentiment: Math.random() > 0.5 ? "positive" : Math.random() > 0.5 ? "negative" : "neutral",
      confidence: Math.random() * 0.4 + 0.6,
      entities,
      intent: ["question", "request", "statement", "command"][Math.floor(Math.random() * 4)],
      language: "en",
      complexity: Math.min(words.length / 10, 1),
    }

    setAnalysis(mockAnalysis)

    // Generate semantic nodes
    const nodes = words.slice(0, 8).map((word, index) => ({
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      word,
      importance: Math.random(),
    }))
    setSemanticNodes(nodes)

    setIsProcessing(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || semanticNodes.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections between nodes
      ctx.strokeStyle = "rgba(79, 70, 229, 0.3)"
      ctx.lineWidth = 1

      for (let i = 0; i < semanticNodes.length; i++) {
        for (let j = i + 1; j < semanticNodes.length; j++) {
          const node1 = semanticNodes[i]
          const node2 = semanticNodes[j]
          const distance = Math.sqrt((node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(node1.x, node1.y)
            ctx.lineTo(node2.x, node2.y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      semanticNodes.forEach((node) => {
        const radius = 4 + node.importance * 8

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(79, 70, 229, ${0.6 + node.importance * 0.4})`
        ctx.fill()

        // Draw word labels
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.font = "12px Inter"
        ctx.textAlign = "center"
        ctx.fillText(node.word, node.x, node.y - radius - 5)
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [semanticNodes])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "negative":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2 holographic-text">Advanced NLP Processing</h3>
        <p className="text-muted-foreground">Real-time natural language understanding with semantic analysis</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text for advanced NLP analysis..."
            className="flex-1 glass-morphism"
            onKeyDown={(e) => e.key === "Enter" && analyzeText(input)}
          />
          <Button onClick={() => analyzeText(input)} disabled={isProcessing || !input.trim()} className="neural-glow">
            {isProcessing ? "Processing..." : "Analyze"}
          </Button>
        </div>

        {isProcessing && (
          <Card className="p-6 glass-morphism nlp-processing">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-secondary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              <span className="text-sm text-muted-foreground ml-4">Processing natural language...</span>
            </div>
          </Card>
        )}

        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 glass-morphism">
              <h4 className="text-lg font-semibold mb-4">Analysis Results</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sentiment:</span>
                  <Badge className={getSentimentColor(analysis.sentiment)}>
                    {analysis.sentiment} ({Math.round(analysis.confidence * 100)}%)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Intent:</span>
                  <Badge variant="outline" className="neural-glow">
                    {analysis.intent}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language:</span>
                  <Badge variant="secondary">{analysis.language.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Complexity:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${analysis.complexity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(analysis.complexity * 100)}%</span>
                  </div>
                </div>
                {analysis.entities.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Entities:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.entities.map((entity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 glass-morphism">
              <h4 className="text-lg font-semibold mb-4">Semantic Network</h4>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="w-full h-64 rounded-lg bg-card/50 semantic-field"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full language-nodes rounded-lg"></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Visual representation of semantic relationships and word importance
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
