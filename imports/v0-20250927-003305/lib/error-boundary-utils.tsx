import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log error to monitoring service
    console.error("[ErrorBoundary] Component error:", error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
            <h3 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-2">An error occurred while rendering this component.</p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Global error handler
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorQueue: Array<{ error: Error; timestamp: number }> = []
  private maxErrors = 50

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  init(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("[GlobalErrorHandler] Unhandled promise rejection:", event.reason)
      this.logError(new Error(`Unhandled promise rejection: ${event.reason}`))
      event.preventDefault()
    })

    // Handle global errors
    window.addEventListener("error", (event) => {
      console.error("[GlobalErrorHandler] Global error:", event.error)
      this.logError(event.error || new Error(event.message))
    })
  }

  private logError(error: Error): void {
    const errorEntry = {
      error,
      timestamp: Date.now(),
    }

    this.errorQueue.push(errorEntry)

    // Keep only recent errors
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue = this.errorQueue.slice(-this.maxErrors)
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring(errorEntry)
    }
  }

  private sendToMonitoring(errorEntry: { error: Error; timestamp: number }): void {
    // Implement your monitoring service integration here
    // Example: Sentry, LogRocket, etc.
    console.log("[GlobalErrorHandler] Would send to monitoring:", errorEntry)
  }

  getRecentErrors(): Array<{ error: Error; timestamp: number }> {
    return [...this.errorQueue]
  }

  clearErrors(): void {
    this.errorQueue = []
  }
}
