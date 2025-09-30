"use client"

import { useState, useEffect } from "react"
import { X, Lightbulb, AlertTriangle, TrendingUp, Brain, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { proactiveAISystem, type ProactiveInsight } from "@/lib/proactive-ai-system"

interface ProactiveAIPanelProps {
  className?: string
}

export default function ProactiveAIPanel({ className = "" }: ProactiveAIPanelProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateInsights = () => {
      const activeInsights = proactiveAISystem.getActiveInsights()
      setInsights(activeInsights)
      setIsVisible(activeInsights.length > 0)
    }

    // Initial load
    updateInsights()

    // Update every 10 seconds
    const interval = setInterval(updateInsights, 10000)

    return () => clearInterval(interval)
  }, [])

  const getInsightIcon = (type: ProactiveInsight["type"]) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "opportunity":
        return <TrendingUp className="w-4 h-4" />
      case "learning":
        return <Brain className="w-4 h-4" />
      default:
        return <Lightbulb className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: ProactiveInsight["priority"]) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20"
      case "medium":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "low":
        return "text-green-400 bg-green-500/10 border-green-500/20"
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
    }
  }

  const handleDismiss = (insightId: string) => {
    proactiveAISystem.dismissInsight(insightId)
    setInsights((prev) => prev.filter((insight) => insight.id !== insightId))
  }

  const handleAction = (action: () => void) => {
    action()
    // Optionally close the panel or update insights after action
  }

  if (!isVisible) return null

  return (
    <div className={`fixed top-20 right-4 z-40 max-w-sm ${className}`}>
      <div className="ai-glass-effect rounded-lg border shadow-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary animate-ai-pulse" />
            <h3 className="font-semibold text-sm">AI Insights</h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{insights.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 p-0">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="w-6 h-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Insights List */}
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 border-b border-border/30 last:border-b-0 ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-foreground/80 leading-relaxed mb-2">{insight.message}</p>

                    {/* Actions */}
                    {insight.actionable && insight.actions && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {insight.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(action.action)}
                            className="text-xs h-6 px-2"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Dismiss button */}
                    {insight.dismissible && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(insight.id)}
                          className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-2 bg-muted/20 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            AI continuously analyzing your workflow for improvements
          </p>
        </div>
      </div>
    </div>
  )
}
