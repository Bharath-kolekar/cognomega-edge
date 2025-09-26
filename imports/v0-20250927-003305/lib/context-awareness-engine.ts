"use client"

import { contextualMemory } from "./contextual-memory"
import { proactiveAISystem } from "./proactive-ai-system"

export interface ContextState {
  currentPage: string
  userFocus: string
  timeOnPage: number
  scrollPosition: number
  mouseActivity: number
  keyboardActivity: number
  lastInteraction: number
  sessionDuration: number
  errorCount: number
  successCount: number
}

export interface ContextualPrediction {
  nextAction: string
  confidence: number
  reasoning: string[]
  suggestions: string[]
  preventativeActions: string[]
}

export class ContextAwarenessEngine {
  private contextState: ContextState
  private activityBuffer: Array<{ timestamp: number; type: string; data: any }>
  private observers: Map<string, MutationObserver>
  private isActive = true
  private sessionStartTime = Date.now()

  constructor() {
    this.contextState = {
      currentPage: typeof window !== "undefined" ? window.location.pathname : "/",
      userFocus: "unknown",
      timeOnPage: 0,
      scrollPosition: 0,
      mouseActivity: 0,
      keyboardActivity: 0,
      lastInteraction: Date.now(),
      sessionDuration: 0,
      errorCount: 0,
      successCount: 0,
    }
    this.activityBuffer = []
    this.observers = new Map()

    if (typeof window !== "undefined") {
      this.initializeContextTracking()
    }
  }

  private initializeContextTracking() {
    this.trackMouseActivity()
    this.trackKeyboardActivity()
    this.trackScrollBehavior()
    this.trackFocusChanges()
    this.trackPageVisibility()
    this.trackFormInteractions()
    this.trackErrors()
    setInterval(() => this.updateContextState(), 5000)
    setInterval(() => this.analyzeContextForPredictions(), 15000)
  }

  private trackMouseActivity() {
    if (typeof document === "undefined") return

    let mouseMovements = 0
    let lastMouseTime = Date.now()

    document.addEventListener("mousemove", (e) => {
      mouseMovements++
      this.contextState.lastInteraction = Date.now()

      const target = e.target as HTMLElement
      if (target) {
        this.recordActivity("mouse_hover", {
          element: target.tagName.toLowerCase(),
          className: target.className,
          position: { x: e.clientX, y: e.clientY },
        })
      }

      if (Date.now() - lastMouseTime > 1000) {
        this.contextState.mouseActivity = mouseMovements
        mouseMovements = 0
        lastMouseTime = Date.now()
      }
    })

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement
      this.recordActivity("click", {
        element: target.tagName.toLowerCase(),
        className: target.className,
        text: target.textContent?.substring(0, 50),
      })

      this.contextState.lastInteraction = Date.now()
      proactiveAISystem.observeUserBehavior("click", { element: target.tagName.toLowerCase() })
    })
  }

  private trackKeyboardActivity() {
    if (typeof document === "undefined") return

    let keystrokes = 0
    let lastKeyTime = Date.now()

    document.addEventListener("keydown", (e) => {
      keystrokes++
      this.contextState.lastInteraction = Date.now()

      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        this.recordActivity("typing", {
          element: e.target.tagName.toLowerCase(),
          length: e.target.value.length,
          key: e.key,
        })

        if (e.key === "Backspace") {
          this.detectConfusion("excessive_backspacing")
        }
      }

      if (Date.now() - lastKeyTime > 1000) {
        this.contextState.keyboardActivity = keystrokes
        keystrokes = 0
        lastKeyTime = Date.now()
      }
    })
  }

  private trackScrollBehavior() {
    if (typeof window === "undefined") return

    let scrollTimeout: NodeJS.Timeout

    window.addEventListener("scroll", () => {
      this.contextState.scrollPosition = window.scrollY
      this.contextState.lastInteraction = Date.now()

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.recordActivity("scroll_stop", {
          position: window.scrollY,
          percentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
        })

        this.detectStuckBehavior()
      }, 2000)
    })
  }

  private trackFocusChanges() {
    if (typeof document === "undefined") return

    document.addEventListener("focusin", (e) => {
      const target = e.target as HTMLElement
      this.contextState.userFocus = target.tagName.toLowerCase()

      this.recordActivity("focus_change", {
        element: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id,
      })

      proactiveAISystem.observeUserBehavior("focus_change", { element: target.tagName.toLowerCase() })
    })
  }

  private trackPageVisibility() {
    if (typeof document === "undefined") return

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.recordActivity("page_hidden", { duration: Date.now() - this.contextState.lastInteraction })
      } else {
        this.recordActivity("page_visible", { awayTime: Date.now() - this.contextState.lastInteraction })
        this.contextState.lastInteraction = Date.now()
      }
    })
  }

  private trackFormInteractions() {
    if (typeof document === "undefined") return

    document.addEventListener("input", (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.recordActivity("form_input", {
          element: e.target.tagName.toLowerCase(),
          type: e.target.type,
          valueLength: e.target.value.length,
        })

        if (e.target.value.length > 100 && !e.target.value.trim()) {
          this.detectConfusion("empty_long_input")
        }
      }
    })

    document.addEventListener("submit", (e) => {
      this.recordActivity("form_submit", {
        formId: (e.target as HTMLFormElement).id,
        formClass: (e.target as HTMLFormElement).className,
      })

      this.contextState.successCount++
      proactiveAISystem.observeUserBehavior("form_submit", { success: true })
    })
  }

  private trackErrors() {
    if (typeof window === "undefined") return

    window.addEventListener("error", (e) => {
      this.contextState.errorCount++
      this.recordActivity("error", {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
      })

      proactiveAISystem.observeUserBehavior("error", { message: e.message })
    })

    window.addEventListener("unhandledrejection", (e) => {
      this.contextState.errorCount++
      this.recordActivity("promise_rejection", {
        reason: e.reason?.toString(),
      })

      proactiveAISystem.observeUserBehavior("error", { type: "promise_rejection" })
    })
  }

  private recordActivity(type: string, data: any) {
    this.activityBuffer.push({
      timestamp: Date.now(),
      type,
      data,
    })

    if (this.activityBuffer.length > 200) {
      this.activityBuffer = this.activityBuffer.slice(-100)
    }
  }

  private updateContextState() {
    this.contextState.timeOnPage = Date.now() - this.sessionStartTime
    this.contextState.sessionDuration = Date.now() - this.sessionStartTime

    const timeSinceLastInteraction = Date.now() - this.contextState.lastInteraction
    if (timeSinceLastInteraction > 60000) {
      proactiveAISystem.observeUserBehavior("long_idle", { duration: timeSinceLastInteraction })
    }

    contextualMemory.addMemory("context", this.contextState, 0.4, ["context_state", "user_behavior"])
  }

  private analyzeContextForPredictions() {
    const prediction = this.predictNextUserAction()
    if (prediction.confidence > 0.7) {
      this.takeProactiveAction(prediction)
    }
  }

  private predictNextUserAction(): ContextualPrediction {
    const recentActivities = this.activityBuffer.filter((activity) => Date.now() - activity.timestamp < 30000)
    const activityTypes = recentActivities.map((a) => a.type)
    const mostCommonActivity = this.getMostFrequent(activityTypes)

    let nextAction = "unknown"
    let confidence = 0.5
    const reasoning = []
    const suggestions = []
    const preventativeActions = []

    const hoverCount = activityTypes.filter((type) => type === "mouse_hover").length
    const clickCount = activityTypes.filter((type) => type === "click").length
    if (hoverCount > 10 && clickCount < 2) {
      nextAction = "needs_guidance"
      confidence = 0.8
      reasoning.push("High hover activity with low click activity suggests exploration")
      suggestions.push("Provide contextual guidance")
      suggestions.push("Offer voice assistance")
    }

    const formInputs = activityTypes.filter((type) => type === "form_input").length
    const formSubmits = activityTypes.filter((type) => type === "form_submit").length
    if (formInputs > 5 && formSubmits === 0) {
      nextAction = "form_assistance_needed"
      confidence = 0.75
      reasoning.push("Multiple form inputs without submission suggests difficulty")
      suggestions.push("Offer form completion help")
      preventativeActions.push("Validate inputs in real-time")
    }

    const scrollStops = activityTypes.filter((type) => type === "scroll_stop").length
    if (scrollStops > 5) {
      nextAction = "content_search"
      confidence = 0.7
      reasoning.push("Frequent scrolling suggests searching for specific content")
      suggestions.push("Offer search functionality")
      suggestions.push("Provide content navigation")
    }

    if (this.contextState.errorCount > 2) {
      nextAction = "error_assistance_needed"
      confidence = 0.9
      reasoning.push("Multiple errors indicate user needs help")
      suggestions.push("Provide error resolution guidance")
      preventativeActions.push("Implement better error prevention")
    }

    return {
      nextAction,
      confidence,
      reasoning,
      suggestions,
      preventativeActions,
    }
  }

  private takeProactiveAction(prediction: ContextualPrediction) {
    switch (prediction.nextAction) {
      case "needs_guidance":
        proactiveAISystem.observeUserBehavior("guidance_needed", { confidence: prediction.confidence })
        break
      case "form_assistance_needed":
        proactiveAISystem.observeUserBehavior("form_help_needed", { confidence: prediction.confidence })
        break
      case "content_search":
        proactiveAISystem.observeUserBehavior("search_intent", { confidence: prediction.confidence })
        break
      case "error_assistance_needed":
        proactiveAISystem.observeUserBehavior("error_help_needed", { confidence: prediction.confidence })
        break
    }
  }

  private detectStuckBehavior() {
    const recentScrolls = this.activityBuffer
      .filter((activity) => activity.type === "scroll_stop" && Date.now() - activity.timestamp < 60000)
      .map((activity) => activity.data.position)

    const positionVariance = this.calculateVariance(recentScrolls)
    if (recentScrolls.length > 3 && positionVariance < 1000) {
      proactiveAISystem.observeUserBehavior("stuck", { scrollPositions: recentScrolls })
    }
  }

  private detectConfusion(type: string) {
    proactiveAISystem.observeUserBehavior("confusion_detected", { type })
  }

  private getMostFrequent(arr: string[]): string {
    const frequency = arr.reduce(
      (acc, item) => {
        acc[item] = (acc[item] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b))
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map((num) => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }

  public getContextState(): ContextState {
    return { ...this.contextState }
  }

  public getRecentActivity(minutes = 5): Array<{ timestamp: number; type: string; data: any }> {
    const cutoff = Date.now() - minutes * 60 * 1000
    return this.activityBuffer.filter((activity) => activity.timestamp > cutoff)
  }

  public stop() {
    this.isActive = false
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}

let contextAwarenessEngineInstance: ContextAwarenessEngine | null = null

export const contextAwarenessEngine = new Proxy({} as ContextAwarenessEngine, {
  get(target, prop) {
    if (!contextAwarenessEngineInstance) {
      contextAwarenessEngineInstance = new ContextAwarenessEngine()
    }
    return contextAwarenessEngineInstance[prop as keyof ContextAwarenessEngine]
  },
})
