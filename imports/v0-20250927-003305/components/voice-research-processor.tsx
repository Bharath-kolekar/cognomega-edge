"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Search, Mic, MicOff, Brain, FileText, Link, Lightbulb, Clock } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface ResearchQuery {
  id: string
  query: string
  timestamp: number
  status: "processing" | "completed" | "failed"
  results?: ResearchResult[]
  processingTime?: number
}

interface ResearchResult {
  title: string
  summary: string
  source: string
  relevance: number
  type: "article" | "documentation" | "tutorial" | "reference"
  url?: string
  keyPoints: string[]
}

export function VoiceResearchProcessor() {
  const [isListening, setIsListening] = useState(false)
  const [currentQuery, setCurrentQuery] = useState("")
  const [queries, setQueries] = useState<ResearchQuery[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  const processResearchQuery = useCallback(async (query: string): Promise<ResearchResult[]> => {
    // Simulate research processing with mock data
    const mockResults: ResearchResult[] = [
      {
        title: "Advanced React Patterns and Best Practices",
        summary:
          "Comprehensive guide covering modern React patterns including hooks, context, and performance optimization techniques.",
        source: "React Documentation",
        relevance: 0.95,
        type: "documentation",
        url: "https://react.dev/learn",
        keyPoints: [
          "Use custom hooks for reusable logic",
          "Implement proper error boundaries",
          "Optimize with React.memo and useMemo",
          "Follow component composition patterns",
        ],
      },
      {
        title: "TypeScript Integration with React Components",
        summary: "Learn how to effectively use TypeScript with React for better type safety and developer experience.",
        source: "TypeScript Handbook",
        relevance: 0.88,
        type: "tutorial",
        url: "https://www.typescriptlang.org/docs/",
        keyPoints: [
          "Define proper prop interfaces",
          "Use generic components when needed",
          "Implement proper event typing",
          "Leverage TypeScript's strict mode",
        ],
      },
      {
        title: "Voice User Interface Design Principles",
        summary: "Essential guidelines for creating effective voice-controlled applications and interfaces.",
        source: "UX Design Research",
        relevance: 0.82,
        type: "article",
        keyPoints: [
          "Design for conversation flow",
          "Provide clear voice feedback",
          "Handle errors gracefully",
          "Support multiple input methods",
        ],
      },
      {
        title: "AI-Powered Code Generation Techniques",
        summary:
          "Exploring modern approaches to automated code generation using machine learning and natural language processing.",
        source: "AI Research Papers",
        relevance: 0.79,
        type: "reference",
        keyPoints: [
          "Natural language to code translation",
          "Context-aware code completion",
          "Automated testing generation",
          "Code quality assessment",
        ],
      },
    ]

    // Simulate processing time
    for (let i = 0; i <= 100; i += 10) {
      setProcessingProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    return mockResults
  }, [])

  const handleVoiceResearch = useCallback(async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase()

    // Parse research commands
    if (
      lowerTranscript.includes("research") ||
      lowerTranscript.includes("find") ||
      lowerTranscript.includes("search")
    ) {
      let query = transcript

      // Extract the actual query from voice command
      const researchTriggers = ["research", "find information about", "search for", "look up", "tell me about"]
      for (const trigger of researchTriggers) {
        if (lowerTranscript.includes(trigger)) {
          query = transcript.substring(transcript.toLowerCase().indexOf(trigger) + trigger.length).trim()
          break
        }
      }

      if (query.length > 0) {
        await performResearch(query)
      }
    } else {
      // Treat the entire transcript as a research query
      await performResearch(transcript)
    }
  }, [])

  const performResearch = async (query: string) => {
    const newQuery: ResearchQuery = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      status: "processing",
    }

    setQueries((prev) => [newQuery, ...prev])
    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const startTime = Date.now()
      const results = await processResearchQuery(query)
      const processingTime = Date.now() - startTime

      setQueries((prev) =>
        prev.map((q) => (q.id === newQuery.id ? { ...q, status: "completed", results, processingTime } : q)),
      )
    } catch (error) {
      console.error("Research processing error:", error)
      setQueries((prev) => prev.map((q) => (q.id === newQuery.id ? { ...q, status: "failed" } : q)))
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const startVoiceResearch = async () => {
    try {
      setIsListening(true)
      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
      })

      if (result.transcript) {
        await handleVoiceResearch(result.transcript)
      }
    } catch (error) {
      console.error("Voice research error:", error)
    } finally {
      setIsListening(false)
    }
  }

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case "documentation":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "tutorial":
        return <Lightbulb className="w-4 h-4 text-yellow-500" />
      case "article":
        return <FileText className="w-4 h-4 text-green-500" />
      case "reference":
        return <Link className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return "text-green-600"
    if (relevance >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Voice Research Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Voice Research Processor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={startVoiceResearch} disabled={isListening || isProcessing} className="flex-1">
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Listening for research query...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Voice Research
                </>
              )}
            </Button>
            <Button
              onClick={() => currentQuery && performResearch(currentQuery)}
              disabled={!currentQuery.trim() || isProcessing}
              variant="outline"
            >
              <Search className="w-4 h-4 mr-2" />
              Research Now
            </Button>
          </div>

          <Textarea
            placeholder="Or type your research query here..."
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            className="min-h-[80px]"
          />

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Processing research query...</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <strong>Voice Commands:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>"Research React best practices"</li>
              <li>"Find information about TypeScript"</li>
              <li>"Search for voice UI design patterns"</li>
              <li>"Look up AI code generation techniques"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Research Results */}
      <div className="space-y-4">
        {queries.map((query) => (
          <Card key={query.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{query.query}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      query.status === "completed"
                        ? "default"
                        : query.status === "processing"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {query.status}
                  </Badge>
                  {query.processingTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {query.processingTime}ms
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {query.status === "processing" && (
                <div className="text-center py-4">
                  <Brain className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Researching...</p>
                </div>
              )}

              {query.status === "failed" && (
                <div className="text-center py-4">
                  <p className="text-sm text-red-600">Research failed. Please try again.</p>
                </div>
              )}

              {query.status === "completed" && query.results && (
                <div className="space-y-4">
                  {query.results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getResultTypeIcon(result.type)}
                          <h4 className="font-medium">{result.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getRelevanceColor(result.relevance)}`}>
                            {Math.round(result.relevance * 100)}% relevant
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{result.summary}</p>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Key Points:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {result.keyPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Source: {result.source}</span>
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {queries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No research queries yet. Use voice commands or type a query to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
