"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Download, FileText, Code, Package, Mic, MicOff } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface ExportFormat {
  id: string
  name: string
  extension: string
  description: string
  icon: any
  mimeType: string
}

interface ExportOptions {
  format: string
  includeComments: boolean
  minify: boolean
  bundleAssets: boolean
  includeTests: boolean
}

const exportFormats: ExportFormat[] = [
  {
    id: "typescript",
    name: "TypeScript",
    extension: "ts",
    description: "TypeScript source files with type definitions",
    icon: Code,
    mimeType: "text/typescript",
  },
  {
    id: "javascript",
    name: "JavaScript",
    extension: "js",
    description: "JavaScript source files (ES6+)",
    icon: Code,
    mimeType: "text/javascript",
  },
  {
    id: "react-tsx",
    name: "React TSX",
    extension: "tsx",
    description: "React components with TypeScript",
    icon: Code,
    mimeType: "text/typescript",
  },
  {
    id: "vue",
    name: "Vue.js",
    extension: "vue",
    description: "Vue.js single file components",
    icon: Code,
    mimeType: "text/x-vue",
  },
  {
    id: "angular",
    name: "Angular",
    extension: "ts",
    description: "Angular components and services",
    icon: Code,
    mimeType: "text/typescript",
  },
  {
    id: "html",
    name: "HTML",
    extension: "html",
    description: "Static HTML files with inline CSS/JS",
    icon: FileText,
    mimeType: "text/html",
  },
  {
    id: "markdown",
    name: "Markdown",
    extension: "md",
    description: "Documentation in Markdown format",
    icon: FileText,
    mimeType: "text/markdown",
  },
  {
    id: "zip",
    name: "ZIP Archive",
    extension: "zip",
    description: "Complete project as ZIP archive",
    icon: Package,
    mimeType: "application/zip",
  },
]

export function VoiceExportSystem() {
  const [isListening, setIsListening] = useState(false)
  const [currentCode, setCurrentCode] = useState("")
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "typescript",
    includeComments: true,
    minify: false,
    bundleAssets: true,
    includeTests: false,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastExportResult, setLastExportResult] = useState<string>("")

  const handleVoiceExportCommand = useCallback(
    async (transcript: string) => {
      setIsProcessing(true)
      const lowerTranscript = transcript.toLowerCase()

      try {
        // Parse voice commands for export instructions
        if (lowerTranscript.includes("export") || lowerTranscript.includes("download")) {
          let detectedFormat = exportOptions.format

          // Detect format from voice command
          if (lowerTranscript.includes("typescript") || lowerTranscript.includes("ts")) {
            detectedFormat = "typescript"
          } else if (lowerTranscript.includes("javascript") || lowerTranscript.includes("js")) {
            detectedFormat = "javascript"
          } else if (lowerTranscript.includes("react")) {
            detectedFormat = "react-tsx"
          } else if (lowerTranscript.includes("vue")) {
            detectedFormat = "vue"
          } else if (lowerTranscript.includes("angular")) {
            detectedFormat = "angular"
          } else if (lowerTranscript.includes("html")) {
            detectedFormat = "html"
          } else if (lowerTranscript.includes("markdown") || lowerTranscript.includes("documentation")) {
            detectedFormat = "markdown"
          } else if (lowerTranscript.includes("zip") || lowerTranscript.includes("archive")) {
            detectedFormat = "zip"
          }

          // Update format if detected
          if (detectedFormat !== exportOptions.format) {
            setExportOptions((prev) => ({ ...prev, format: detectedFormat }))
          }

          // Parse additional options
          const newOptions = { ...exportOptions, format: detectedFormat }

          if (lowerTranscript.includes("minify") || lowerTranscript.includes("minified")) {
            newOptions.minify = true
          }
          if (lowerTranscript.includes("no comments") || lowerTranscript.includes("without comments")) {
            newOptions.includeComments = false
          }
          if (lowerTranscript.includes("with tests") || lowerTranscript.includes("include tests")) {
            newOptions.includeTests = true
          }

          setExportOptions(newOptions)

          // Perform the export
          await performExport(newOptions)

          setLastExportResult(`Exported code as ${detectedFormat.toUpperCase()} format`)
        } else if (lowerTranscript.includes("set format") || lowerTranscript.includes("change format")) {
          // Handle format change commands
          const format = exportFormats.find(
            (f) => lowerTranscript.includes(f.name.toLowerCase()) || lowerTranscript.includes(f.id),
          )
          if (format) {
            setExportOptions((prev) => ({ ...prev, format: format.id }))
            setLastExportResult(`Format changed to ${format.name}`)
          }
        } else {
          setLastExportResult("Voice command not recognized. Try saying 'export as TypeScript' or 'download as ZIP'")
        }
      } catch (error) {
        console.error("Voice export error:", error)
        setLastExportResult("Error processing voice export command")
      } finally {
        setIsProcessing(false)
      }
    },
    [exportOptions],
  )

  const startVoiceListening = async () => {
    try {
      setIsListening(true)
      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
      })

      if (result.transcript) {
        await handleVoiceExportCommand(result.transcript)
      }
    } catch (error) {
      console.error("Voice listening error:", error)
      setLastExportResult("Failed to start voice listening")
    } finally {
      setIsListening(false)
    }
  }

  const performExport = async (options: ExportOptions) => {
    if (!currentCode.trim()) {
      setLastExportResult("No code to export. Please generate some code first.")
      return
    }

    const selectedFormat = exportFormats.find((f) => f.id === options.format)
    if (!selectedFormat) return

    try {
      let exportContent = currentCode
      let filename = `exported-code.${selectedFormat.extension}`

      // Process the code based on format and options
      switch (options.format) {
        case "typescript":
          exportContent = await convertToTypeScript(currentCode, options)
          filename = `component.${selectedFormat.extension}`
          break
        case "javascript":
          exportContent = await convertToJavaScript(currentCode, options)
          filename = `component.${selectedFormat.extension}`
          break
        case "react-tsx":
          exportContent = await convertToReactTSX(currentCode, options)
          filename = `Component.${selectedFormat.extension}`
          break
        case "vue":
          exportContent = await convertToVue(currentCode, options)
          filename = `Component.${selectedFormat.extension}`
          break
        case "angular":
          exportContent = await convertToAngular(currentCode, options)
          filename = `component.${selectedFormat.extension}`
          break
        case "html":
          exportContent = await convertToHTML(currentCode, options)
          filename = `index.${selectedFormat.extension}`
          break
        case "markdown":
          exportContent = await convertToMarkdown(currentCode, options)
          filename = `README.${selectedFormat.extension}`
          break
        case "zip":
          await createZipExport(currentCode, options)
          return
      }

      // Apply common options
      if (options.minify && options.format !== "markdown") {
        exportContent = minifyCode(exportContent)
      }

      if (!options.includeComments) {
        exportContent = removeComments(exportContent)
      }

      // Create and download file
      const blob = new Blob([exportContent], { type: selectedFormat.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setLastExportResult(`Successfully exported as ${selectedFormat.name}`)
    } catch (error) {
      console.error("Export error:", error)
      setLastExportResult("Failed to export code")
    }
  }

  // Conversion functions (simplified implementations)
  const convertToTypeScript = async (code: string, options: ExportOptions): Promise<string> => {
    // Add TypeScript type annotations and interfaces
    return `// TypeScript Export\n// Generated by Cognomega Voice Export\n\n${code}`
  }

  const convertToJavaScript = async (code: string, options: ExportOptions): Promise<string> => {
    // Convert TypeScript to JavaScript
    return `// JavaScript Export\n// Generated by Cognomega Voice Export\n\n${code}`
  }

  const convertToReactTSX = async (code: string, options: ExportOptions): Promise<string> => {
    return `import React from 'react'\n\n// React TSX Component\n// Generated by Cognomega Voice Export\n\n${code}`
  }

  const convertToVue = async (code: string, options: ExportOptions): Promise<string> => {
    return `<template>\n  <!-- Vue Component -->\n  <!-- Generated by Cognomega Voice Export -->\n</template>\n\n<script>\n${code}\n</script>\n\n<style scoped>\n</style>`
  }

  const convertToAngular = async (code: string, options: ExportOptions): Promise<string> => {
    return `import { Component } from '@angular/core'\n\n// Angular Component\n// Generated by Cognomega Voice Export\n\n${code}`
  }

  const convertToHTML = async (code: string, options: ExportOptions): Promise<string> => {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Cognomega Export</title>\n</head>\n<body>\n  <!-- Generated by Cognomega Voice Export -->\n  ${code}\n</body>\n</html>`
  }

  const convertToMarkdown = async (code: string, options: ExportOptions): Promise<string> => {
    return `# Cognomega Code Export\n\nGenerated by Cognomega Voice Export System\n\n## Code\n\n\`\`\`typescript\n${code}\n\`\`\`\n\n## Usage\n\nThis code was generated using voice commands and can be integrated into your project.\n`
  }

  const createZipExport = async (code: string, options: ExportOptions) => {
    // Create a ZIP file with multiple formats
    setLastExportResult("ZIP export functionality would be implemented here")
  }

  const minifyCode = (code: string): string => {
    // Simple minification (remove extra whitespace and comments)
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  const removeComments = (code: string): string => {
    return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
  }

  const selectedFormat = exportFormats.find((f) => f.id === exportOptions.format)

  return (
    <div className="space-y-6">
      {/* Voice Export Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Voice-Driven Export System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={startVoiceListening} disabled={isListening || isProcessing} className="flex-1">
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Export Command
                </>
              )}
            </Button>
            <Button
              onClick={() => performExport(exportOptions)}
              disabled={!currentCode.trim() || isProcessing}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Now
            </Button>
          </div>

          {lastExportResult && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">{lastExportResult}</div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <strong>Voice Commands:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>"Export as TypeScript"</li>
              <li>"Download as ZIP archive"</li>
              <li>"Export minified JavaScript"</li>
              <li>"Save as React component"</li>
              <li>"Export without comments"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Export Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={exportOptions.format}
                onValueChange={(value) => setExportOptions((prev) => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportFormats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center gap-2">
                        <format.icon className="w-4 h-4" />
                        {format.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormat && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <div className="p-2 bg-muted/50 rounded text-sm">{selectedFormat.description}</div>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <div className="font-medium text-sm">Export Options</div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeComments}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, includeComments: e.target.checked }))}
                />
                <span className="text-sm">Include Comments</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.minify}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, minify: e.target.checked }))}
                />
                <span className="text-sm">Minify Code</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.bundleAssets}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, bundleAssets: e.target.checked }))}
                />
                <span className="text-sm">Bundle Assets</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTests}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, includeTests: e.target.checked }))}
                />
                <span className="text-sm">Include Tests</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Input */}
      <Card>
        <CardHeader>
          <CardTitle>Code to Export</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your code here or generate code using voice commands..."
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  )
}
