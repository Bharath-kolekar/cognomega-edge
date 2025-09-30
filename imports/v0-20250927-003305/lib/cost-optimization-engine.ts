/**
 * Comprehensive Cost Optimization Engine
 * Monitors, analyzes, and optimizes resource usage across the entire application
 */

interface CostMetrics {
  apiCalls: {
    openai: number
    total: number
    cost: number
  }
  storage: {
    localStorage: number
    memory: number
    cacheSize: number
  }
  performance: {
    renderTime: number
    memoryLeaks: number
    unoptimizedOperations: number
  }
  network: {
    requests: number
    dataTransfer: number
    redundantCalls: number
  }
}

interface OptimizationRule {
  id: string
  name: string
  description: string
  category: "api" | "storage" | "performance" | "network"
  severity: "low" | "medium" | "high" | "critical"
  costImpact: number // estimated monthly cost impact in USD
  implementation: () => Promise<void>
}

class CostOptimizationEngine {
  private metrics: CostMetrics = {
    apiCalls: { openai: 0, total: 0, cost: 0 },
    storage: { localStorage: 0, memory: 0, cacheSize: 0 },
    performance: { renderTime: 0, memoryLeaks: 0, unoptimizedOperations: 0 },
    network: { requests: 0, dataTransfer: 0, redundantCalls: 0 },
  }

  private optimizationRules: OptimizationRule[] = []
  private activeOptimizations: Set<string> = new Set()
  private costThresholds = {
    apiCallsPerHour: 100,
    storageSize: 50 * 1024 * 1024, // 50MB
    memoryUsage: 100 * 1024 * 1024, // 100MB
    networkRequests: 1000,
  }

  constructor() {
    this.initializeOptimizationRules()
    this.startMonitoring()
  }

  private initializeOptimizationRules() {
    this.optimizationRules = [
      // API Optimization Rules
      {
        id: "api-request-batching",
        name: "Batch API Requests",
        description: "Combine multiple API requests into single calls",
        category: "api",
        severity: "high",
        costImpact: 150,
        implementation: this.implementAPIBatching.bind(this),
      },
      {
        id: "api-response-caching",
        name: "Cache API Responses",
        description: "Cache frequently requested API responses",
        category: "api",
        severity: "critical",
        costImpact: 300,
        implementation: this.implementAPIResponseCaching.bind(this),
      },
      {
        id: "api-rate-limiting",
        name: "Implement Rate Limiting",
        description: "Prevent excessive API calls with intelligent rate limiting",
        category: "api",
        severity: "high",
        costImpact: 200,
        implementation: this.implementRateLimiting.bind(this),
      },

      // Storage Optimization Rules
      {
        id: "storage-cleanup",
        name: "Clean Up Storage",
        description: "Remove unused localStorage and memory data",
        category: "storage",
        severity: "medium",
        costImpact: 50,
        implementation: this.implementStorageCleanup.bind(this),
      },
      {
        id: "storage-compression",
        name: "Compress Storage Data",
        description: "Compress data before storing in localStorage",
        category: "storage",
        severity: "medium",
        costImpact: 75,
        implementation: this.implementStorageCompression.bind(this),
      },

      // Performance Optimization Rules
      {
        id: "memory-leak-prevention",
        name: "Prevent Memory Leaks",
        description: "Clean up intervals, timeouts, and event listeners",
        category: "performance",
        severity: "critical",
        costImpact: 100,
        implementation: this.implementMemoryLeakPrevention.bind(this),
      },
      {
        id: "lazy-loading",
        name: "Implement Lazy Loading",
        description: "Load components and data only when needed",
        category: "performance",
        severity: "high",
        costImpact: 80,
        implementation: this.implementLazyLoading.bind(this),
      },

      // Network Optimization Rules
      {
        id: "request-deduplication",
        name: "Deduplicate Requests",
        description: "Prevent duplicate network requests",
        category: "network",
        severity: "high",
        costImpact: 120,
        implementation: this.implementRequestDeduplication.bind(this),
      },
    ]
  }

  private startMonitoring() {
    // Monitor API calls
    this.interceptAPIRequests()

    // Monitor storage usage
    setInterval(() => this.monitorStorageUsage(), 30000)

    // Monitor performance
    setInterval(() => this.monitorPerformance(), 60000)

    // Monitor network requests
    this.interceptNetworkRequests()

    // Run optimization checks
    setInterval(() => this.runOptimizationChecks(), 300000) // Every 5 minutes
  }

  private interceptAPIRequests() {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args

      // Track API call
      this.metrics.apiCalls.total++

      // Estimate cost for OpenAI calls
      if (typeof url === "string" && url.includes("openai")) {
        this.metrics.apiCalls.openai++
        this.metrics.apiCalls.cost += this.estimateOpenAICost(options?.body)
      }

      return originalFetch(...args)
    }
  }

  private interceptNetworkRequests() {
    const originalXHR = window.XMLHttpRequest
    const self = this

    window.XMLHttpRequest = () => {
      const xhr = new originalXHR()
      const originalSend = xhr.send

      xhr.send = function (...args) {
        self.metrics.network.requests++
        return originalSend.apply(this, args)
      }

      return xhr
    }
  }

  private monitorStorageUsage() {
    // Calculate localStorage usage
    let localStorageSize = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length + key.length
      }
    }
    this.metrics.storage.localStorage = localStorageSize

    // Estimate memory usage
    if (performance.memory) {
      this.metrics.storage.memory = performance.memory.usedJSHeapSize
    }
  }

  private monitorPerformance() {
    // Monitor render performance
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType("paint")
      if (paintEntries.length > 0) {
        this.metrics.performance.renderTime = paintEntries[paintEntries.length - 1].startTime
      }
    }

    // Check for potential memory leaks
    this.detectMemoryLeaks()
  }

  private detectMemoryLeaks() {
    // Check for uncleared intervals and timeouts
    const intervals = (window as any).__intervals || []
    const timeouts = (window as any).__timeouts || []

    this.metrics.performance.memoryLeaks = intervals.length + timeouts.length
  }

  private estimateOpenAICost(body: any): number {
    if (!body) return 0

    try {
      const parsed = typeof body === "string" ? JSON.parse(body) : body
      const tokens = this.estimateTokens(parsed.messages || parsed.prompt || "")

      // GPT-4 pricing: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
      // Estimate average response is 2x input tokens
      return (tokens / 1000) * 0.03 + ((tokens * 2) / 1000) * 0.06
    } catch {
      return 0.05 // Default estimate
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  private async runOptimizationChecks() {
    const recommendations: OptimizationRule[] = []

    // Check API usage
    if (this.metrics.apiCalls.total > this.costThresholds.apiCallsPerHour) {
      recommendations.push(...this.optimizationRules.filter((r) => r.category === "api"))
    }

    // Check storage usage
    if (this.metrics.storage.localStorage > this.costThresholds.storageSize) {
      recommendations.push(...this.optimizationRules.filter((r) => r.category === "storage"))
    }

    // Check performance
    if (this.metrics.performance.memoryLeaks > 5) {
      recommendations.push(...this.optimizationRules.filter((r) => r.category === "performance"))
    }

    // Check network usage
    if (this.metrics.network.requests > this.costThresholds.networkRequests) {
      recommendations.push(...this.optimizationRules.filter((r) => r.category === "network"))
    }

    // Auto-implement critical optimizations
    for (const rule of recommendations) {
      if (rule.severity === "critical" && !this.activeOptimizations.has(rule.id)) {
        await this.implementOptimization(rule)
      }
    }
  }

  private async implementOptimization(rule: OptimizationRule) {
    try {
      this.activeOptimizations.add(rule.id)
      await rule.implementation()
      console.log(`[Cost Optimization] Implemented: ${rule.name}`)
    } catch (error) {
      console.error(`[Cost Optimization] Failed to implement ${rule.name}:`, error)
      this.activeOptimizations.delete(rule.id)
    }
  }

  // Implementation methods for each optimization rule
  private async implementAPIBatching() {
    // Create a request queue and batch similar requests
    const requestQueue = new Map<string, any[]>()
    const batchDelay = 100 // ms

    const originalFetch = window.fetch
    window.fetch = async (url: string, options?: RequestInit) => {
      if (options?.method === "POST" && url.includes("/api/")) {
        // Queue the request for batching
        if (!requestQueue.has(url)) {
          requestQueue.set(url, [])
          setTimeout(() => this.processBatchedRequests(url, requestQueue), batchDelay)
        }

        return new Promise((resolve, reject) => {
          requestQueue.get(url)!.push({ options, resolve, reject })
        })
      }

      return originalFetch(url, options)
    }
  }

  private async processBatchedRequests(url: string, requestQueue: Map<string, any[]>) {
    const requests = requestQueue.get(url) || []
    if (requests.length === 0) return

    requestQueue.delete(url)

    if (requests.length === 1) {
      // Single request, process normally
      const { options, resolve, reject } = requests[0]
      try {
        const response = await fetch(url, options)
        resolve(response)
      } catch (error) {
        reject(error)
      }
    } else {
      // Batch multiple requests
      try {
        const batchedBody = {
          batch: requests.map((r) => JSON.parse(r.options.body || "{}")),
        }

        const response = await fetch(url + "/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchedBody),
        })

        const results = await response.json()

        // Resolve each request with its corresponding result
        requests.forEach((request, index) => {
          request.resolve(new Response(JSON.stringify(results[index])))
        })
      } catch (error) {
        // If batching fails, process individually
        requests.forEach(async ({ options, resolve, reject }) => {
          try {
            const response = await fetch(url, options)
            resolve(response)
          } catch (err) {
            reject(err)
          }
        })
      }
    }
  }

  private async implementAPIResponseCaching() {
    const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
    const defaultTTL = 5 * 60 * 1000 // 5 minutes

    const originalFetch = window.fetch
    window.fetch = async (url: string, options?: RequestInit) => {
      // Only cache GET requests and specific POST requests
      const shouldCache =
        !options?.method ||
        options.method === "GET" ||
        (options?.method === "POST" && url.includes("/api/ai-assistant"))

      if (shouldCache) {
        const cacheKey = `${url}:${JSON.stringify(options?.body || {})}`
        const cached = cache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          return new Response(JSON.stringify(cached.data))
        }

        const response = await originalFetch(url, options)
        const data = await response.clone().json()

        // Cache successful responses
        if (response.ok) {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: defaultTTL,
          })
        }

        return response
      }

      return originalFetch(url, options)
    }
  }

  private async implementRateLimiting() {
    const rateLimits = new Map<string, { count: number; resetTime: number }>()
    const limits = {
      "/api/ai-assistant": { max: 10, window: 60000 }, // 10 requests per minute
      "/api/generate-frontend": { max: 5, window: 60000 }, // 5 requests per minute
      default: { max: 100, window: 60000 }, // 100 requests per minute
    }

    const originalFetch = window.fetch
    window.fetch = async (url: string, options?: RequestInit) => {
      const endpoint = typeof url === "string" ? url.split("?")[0] : "unknown"
      const limit = limits[endpoint as keyof typeof limits] || limits.default

      const now = Date.now()
      const rateLimitData = rateLimits.get(endpoint) || { count: 0, resetTime: now + limit.window }

      // Reset counter if window has passed
      if (now > rateLimitData.resetTime) {
        rateLimitData.count = 0
        rateLimitData.resetTime = now + limit.window
      }

      // Check if rate limit exceeded
      if (rateLimitData.count >= limit.max) {
        const waitTime = rateLimitData.resetTime - now
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        rateLimitData.count = 0
        rateLimitData.resetTime = Date.now() + limit.window
      }

      rateLimitData.count++
      rateLimits.set(endpoint, rateLimitData)

      return originalFetch(url, options)
    }
  }

  private async implementStorageCleanup() {
    const storageKeys = Object.keys(localStorage)
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

    for (const key of storageKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}")

        // Remove old data
        if (data.timestamp && now - data.timestamp > maxAge) {
          localStorage.removeItem(key)
          continue
        }

        // Remove large unused data
        if (localStorage.getItem(key)!.length > 100000) {
          // > 100KB
          localStorage.removeItem(key)
        }
      } catch {
        // Remove invalid JSON data
        localStorage.removeItem(key)
      }
    }
  }

  private async implementStorageCompression() {
    // Simple compression for localStorage
    const compress = (str: string): string => {
      return btoa(str).replace(/(.{76})/g, "$1\n")
    }

    const decompress = (str: string): string => {
      return atob(str.replace(/\n/g, ""))
    }

    // Override localStorage methods
    const originalSetItem = localStorage.setItem
    const originalGetItem = localStorage.getItem

    localStorage.setItem = function (key: string, value: string) {
      try {
        const compressed = compress(value)
        if (compressed.length < value.length) {
          originalSetItem.call(this, key, `__compressed__${compressed}`)
        } else {
          originalSetItem.call(this, key, value)
        }
      } catch {
        originalSetItem.call(this, key, value)
      }
    }

    localStorage.getItem = function (key: string): string | null {
      const value = originalGetItem.call(this, key)
      if (value?.startsWith("__compressed__")) {
        try {
          return decompress(value.substring(14))
        } catch {
          return value
        }
      }
      return value
    }
  }

  private async implementMemoryLeakPrevention() {
    // Track and clean up intervals and timeouts
    const intervals: number[] = []
    const timeouts: number[] = []

    const originalSetInterval = window.setInterval
    const originalSetTimeout = window.setTimeout
    const originalClearInterval = window.clearInterval
    const originalClearTimeout = window.clearTimeout

    window.setInterval = (callback: Function, delay: number) => {
      const id = originalSetInterval(callback, delay)
      intervals.push(id)
      return id
    }

    window.setTimeout = (callback: Function, delay: number) => {
      const id = originalSetTimeout(callback, delay)
      timeouts.push(id)
      return id
    }

    window.clearInterval = (id: number) => {
      const index = intervals.indexOf(id)
      if (index > -1) intervals.splice(index, 1)
      return originalClearInterval(id)
    }

    window.clearTimeout = (id: number) => {
      const index = timeouts.indexOf(id)
      if (index > -1) timeouts.splice(index, 1)
      return originalClearTimeout(id)
    }

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
      intervals.forEach((id) => clearInterval(id))
      timeouts.forEach((id) => clearTimeout(id))
    })

    // Store references for monitoring
    ;(window as any).__intervals = intervals
    ;(window as any).__timeouts = timeouts
  }

  private async implementLazyLoading() {
    // Implement intersection observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const src = element.dataset.src
          if (src) {
            element.setAttribute("src", src)
            element.removeAttribute("data-src")
            observer.unobserve(element)
          }
        }
      })
    })

    // Observe all images with data-src
    document.querySelectorAll("img[data-src]").forEach((img) => {
      observer.observe(img)
    })
  }

  private async implementRequestDeduplication() {
    const pendingRequests = new Map<string, Promise<Response>>()

    const originalFetch = window.fetch
    window.fetch = async (url: string, options?: RequestInit) => {
      const key = `${url}:${JSON.stringify(options || {})}`

      // Return existing promise if request is already pending
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!.then((response) => response.clone())
      }

      // Create new request
      const requestPromise = originalFetch(url, options)
      pendingRequests.set(key, requestPromise)

      // Clean up after request completes
      requestPromise.finally(() => {
        pendingRequests.delete(key)
      })

      return requestPromise
    }
  }

  // Public methods for monitoring and reporting
  public getMetrics(): CostMetrics {
    return { ...this.metrics }
  }

  public getCostEstimate(): { monthly: number; breakdown: any } {
    const apiCost = this.metrics.apiCalls.cost * 24 * 30 // Extrapolate to monthly
    const storageCost = (this.metrics.storage.localStorage / (1024 * 1024 * 1024)) * 0.023 * 30 // $0.023 per GB/month
    const computeCost = (this.metrics.storage.memory / (1024 * 1024 * 1024)) * 0.05 * 30 // Estimated compute cost

    return {
      monthly: apiCost + storageCost + computeCost,
      breakdown: {
        api: apiCost,
        storage: storageCost,
        compute: computeCost,
      },
    }
  }

  public getOptimizationRecommendations(): OptimizationRule[] {
    return this.optimizationRules.filter((rule) => !this.activeOptimizations.has(rule.id))
  }

  public async implementAllOptimizations() {
    for (const rule of this.optimizationRules) {
      if (!this.activeOptimizations.has(rule.id)) {
        await this.implementOptimization(rule)
      }
    }
  }
}

// Export singleton instance
export const costOptimizationEngine = new CostOptimizationEngine()
export type { CostMetrics, OptimizationRule }
