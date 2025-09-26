export class SecurityUtils {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(html: string): string {
    const div = document.createElement("div")
    div.textContent = html
    return div.innerHTML
  }

  // Validate and sanitize localStorage keys
  static sanitizeStorageKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50)
  }

  // Safe localStorage wrapper with error handling
  static safeLocalStorage = {
    setItem: (key: string, value: string): boolean => {
      try {
        const sanitizedKey = SecurityUtils.sanitizeStorageKey(key)
        localStorage.setItem(sanitizedKey, value)
        return true
      } catch (error) {
        console.error("[Security] localStorage.setItem failed:", error)
        return false
      }
    },

    getItem: (key: string): string | null => {
      try {
        const sanitizedKey = SecurityUtils.sanitizeStorageKey(key)
        return localStorage.getItem(sanitizedKey)
      } catch (error) {
        console.error("[Security] localStorage.getItem failed:", error)
        return null
      }
    },

    removeItem: (key: string): boolean => {
      try {
        const sanitizedKey = SecurityUtils.sanitizeStorageKey(key)
        localStorage.removeItem(sanitizedKey)
        return true
      } catch (error) {
        console.error("[Security] localStorage.removeItem failed:", error)
        return false
      }
    },
  }

  // Input validation utilities
  static validateInput(input: string, maxLength = 1000): string {
    if (typeof input !== "string") {
      throw new Error("Input must be a string")
    }

    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength}`)
    }

    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
  }

  // Safe JSON parsing
  static safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.error("[Security] JSON parse failed:", error)
      return fallback
    }
  }

  // Rate limiting utility
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>()

    return (identifier: string): boolean => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []

      // Remove old requests outside the window
      const validRequests = userRequests.filter((time) => now - time < windowMs)

      if (validRequests.length >= maxRequests) {
        return false // Rate limit exceeded
      }

      validRequests.push(now)
      requests.set(identifier, validRequests)
      return true
    }
  }
}
