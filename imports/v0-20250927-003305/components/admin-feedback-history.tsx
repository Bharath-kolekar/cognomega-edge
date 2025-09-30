"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, ThumbsUp, ThumbsDown, Star, Search, Download, Calendar } from "lucide-react"

interface FeedbackEntry {
  id: string
  timestamp: number
  type: "voice" | "text"
  content: string
  rating?: number
  category: "bug" | "suggestion" | "praise" | "question"
  processed: boolean
  response?: string
  sentiment: "positive" | "negative" | "neutral"
  urgency: "low" | "medium" | "high"
  keywords: string[]
}

export function AdminFeedbackHistory() {
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<FeedbackEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sentimentFilter, setSentimentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in production this would come from an API
  useEffect(() => {
    const mockData: FeedbackEntry[] = [
      {
        id: "1",
        timestamp: Date.now() - 3600000,
        type: "voice",
        content: "The voice recognition is amazing! It understands me perfectly.",
        rating: 5,
        category: "praise",
        processed: true,
        response: "Thank you so much! It's wonderful to hear that you're enjoying the experience.",
        sentiment: "positive",
        urgency: "low",
        keywords: ["voice", "recognition", "amazing", "perfectly"],
      },
      {
        id: "2",
        timestamp: Date.now() - 7200000,
        type: "text",
        content: "There's a bug when I try to generate code with voice commands. It sometimes doesn't respond.",
        category: "bug",
        processed: true,
        response: "Thank you for reporting this issue. I'll make sure the development team investigates this problem.",
        sentiment: "negative",
        urgency: "high",
        keywords: ["bug", "generate", "code", "voice", "commands"],
      },
      {
        id: "3",
        timestamp: Date.now() - 10800000,
        type: "voice",
        content: "Could you add support for more languages? I'd love to use this in Spanish.",
        category: "suggestion",
        processed: true,
        response: "That's a great suggestion! I'll pass this along to help improve the user experience.",
        sentiment: "neutral",
        urgency: "medium",
        keywords: ["support", "languages", "Spanish"],
      },
      {
        id: "4",
        timestamp: Date.now() - 14400000,
        type: "text",
        content: "How do I export my generated code to different formats?",
        category: "question",
        processed: true,
        response: "That's a great question! Let me help you with that.",
        sentiment: "neutral",
        urgency: "low",
        keywords: ["export", "generated", "code", "formats"],
      },
      {
        id: "5",
        timestamp: Date.now() - 18000000,
        type: "voice",
        content: "The AI is too slow when processing complex requests. Can this be improved?",
        category: "suggestion",
        processed: false,
        sentiment: "negative",
        urgency: "medium",
        keywords: ["AI", "slow", "processing", "complex", "requests"],
      },
    ]

    setTimeout(() => {
      setFeedbackEntries(mockData)
      setFilteredEntries(mockData)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter entries based on search and filters
  useEffect(() => {
    let filtered = feedbackEntries

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((entry) => entry.category === categoryFilter)
    }

    if (sentimentFilter !== "all") {
      filtered = filtered.filter((entry) => entry.sentiment === sentimentFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((entry) => entry.type === typeFilter)
    }

    setFilteredEntries(filtered)
  }, [feedbackEntries, searchTerm, categoryFilter, sentimentFilter, typeFilter])

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      default:
        return "text-green-600"
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(filteredEntries, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `feedback-history-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Feedback History</span>
            <Button onClick={exportData} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{feedbackEntries.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {feedbackEntries.filter((e) => e.sentiment === "positive").length}
            </div>
            <div className="text-sm text-muted-foreground">Positive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {feedbackEntries.filter((e) => e.sentiment === "negative").length}
            </div>
            <div className="text-sm text-muted-foreground">Negative</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {feedbackEntries.filter((e) => !e.processed).length}
            </div>
            <div className="text-sm text-muted-foreground">Unprocessed</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Entries ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feedback entries found</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(entry.sentiment)}
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                      <Badge className={getCategoryColor(entry.category)}>{entry.category}</Badge>
                      <span className={`text-xs font-medium ${getUrgencyColor(entry.urgency)}`}>
                        {entry.urgency} priority
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-sm">{entry.content}</p>

                  {entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Rating:</span>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < entry.rating! ? "fill-current text-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  )}

                  {entry.response && (
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-1">AI Response:</p>
                      <p className="text-sm">{entry.response}</p>
                    </div>
                  )}

                  {!entry.processed && (
                    <Badge variant="outline" className="text-yellow-600">
                      Pending Review
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
