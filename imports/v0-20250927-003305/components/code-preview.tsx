"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface CodePreviewProps {
  code: string
}

export default function CodePreview({ code }: CodePreviewProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setComponent(null)
      setError(null)
      return
    }

    try {
      // For security reasons, we'll show a static preview instead of executing arbitrary code
      setError("Code preview disabled for security reasons. Use the enhanced editor for safe code execution.")
      setComponent(null)

      // TODO: Implement iframe-based sandboxed execution or use a proper code sandbox service
      // This would require setting up a secure execution environment
    } catch (e: any) {
      setError(`Error compiling/rendering code: ${e.message}`)
      setComponent(null)
    }
  }, [code])

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <h3 className="text-xl font-semibold mb-4">Code Preview:</h3>
      {error && (
        <div className="bg-destructive/20 text-destructive p-3 rounded mb-4">
          <p className="font-medium">Security Notice:</p>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      <div className="p-4 border border-dashed border-muted-foreground/50 rounded-md">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">🔒 Secure Code Preview</p>
          <p className="text-sm">Code execution has been disabled for security reasons.</p>
          <p className="text-sm">Use the Enhanced Code Editor for safe code testing.</p>
        </div>
      </div>
    </div>
  )
}
