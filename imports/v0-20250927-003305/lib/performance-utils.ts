export class PerformanceUtils {
  private static intervals = new Map<string, NodeJS.Timeout>()
  private static observers = new Map<string, PerformanceObserver>()

  // Safe interval management
  static createManagedInterval(id: string, callback: () => void, delay: number, maxExecutions?: number): void {
    // Clear existing interval if it exists
    this.clearManagedInterval(id)

    let executionCount = 0
    const intervalId = setInterval(() => {
      try {
        callback()
        executionCount++

        if (maxExecutions && executionCount >= maxExecutions) {
          this.clearManagedInterval(id)
        }
      } catch (error) {
        console.error(`[Performance] Interval ${id} error:`, error)
        this.clearManagedInterval(id)
      }
    }, delay)

    this.intervals.set(id, intervalId)
  }

  static clearManagedInterval(id: string): void {
    const intervalId = this.intervals.get(id)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(id)
    }
  }

  static clearAllManagedIntervals(): void {
    this.intervals.forEach((intervalId) => clearInterval(intervalId))
    this.intervals.clear()
  }

  // Debounce utility
  static debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  // Throttle utility
  static throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func(...args)
      }
    }
  }

  // Memory usage monitoring
  static monitorMemoryUsage(threshold: number = 100 * 1024 * 1024): void {
    if ("memory" in performance) {
      const checkMemory = () => {
        const memInfo = (performance as any).memory
        if (memInfo.usedJSHeapSize > threshold) {
          console.warn("[Performance] High memory usage detected:", {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + "MB",
            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + "MB",
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + "MB",
          })
        }
      }

      this.createManagedInterval("memory-monitor", checkMemory, 30000) // Check every 30 seconds
    }
  }

  // Performance observer for monitoring
  static observePerformance(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void): void {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })

      try {
        observer.observe({ entryTypes })
        this.observers.set(entryTypes.join(","), observer)
      } catch (error) {
        console.error("[Performance] Observer setup failed:", error)
      }
    }
  }

  static disconnectAllObservers(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}
