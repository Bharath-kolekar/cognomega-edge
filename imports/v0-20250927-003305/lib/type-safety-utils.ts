import type React from "react"

// Type-safe event handler
export type SafeEventHandler<T = HTMLElement> = (event: React.SyntheticEvent<T>) => void

// Type-safe API response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  timestamp: number
}

// Type-safe local storage wrapper
export interface StorageItem<T> {
  value: T
  timestamp: number
  version: string
}

export class TypeSafeStorage {
  private static version = "1.0.0"

  static set<T>(key: string, value: T): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: this.version,
      }
      localStorage.setItem(key, JSON.stringify(item))
      return true
    } catch (error) {
      console.error("[TypeSafeStorage] Set failed:", error)
      return false
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return defaultValue

      const item: StorageItem<T> = JSON.parse(stored)

      // Check version compatibility
      if (item.version !== this.version) {
        console.warn("[TypeSafeStorage] Version mismatch, using default value")
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error("[TypeSafeStorage] Get failed:", error)
      return defaultValue
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error("[TypeSafeStorage] Remove failed:", error)
      return false
    }
  }
}

// Type-safe form validation
export interface ValidationRule<T> {
  validate: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class FormValidator {
  static validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: string[] = []

    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Common validation rules
  static rules = {
    required: (message = "This field is required"): ValidationRule<any> => ({
      validate: (value) => value !== null && value !== undefined && value !== "",
      message,
    }),

    minLength: (min: number, message?: string): ValidationRule<string> => ({
      validate: (value) => typeof value === "string" && value.length >= min,
      message: message || `Minimum length is ${min} characters`,
    }),

    maxLength: (max: number, message?: string): ValidationRule<string> => ({
      validate: (value) => typeof value === "string" && value.length <= max,
      message: message || `Maximum length is ${max} characters`,
    }),

    email: (message = "Invalid email format"): ValidationRule<string> => ({
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return typeof value === "string" && emailRegex.test(value)
      },
      message,
    }),
  }
}

// Type-safe async utilities
export class AsyncUtils {
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = "Operation timed out",
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  static async retry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts) {
          throw lastError
        }

        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError!
  }
}
