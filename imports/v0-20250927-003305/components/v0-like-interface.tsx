"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sparkles,
  Code,
  Eye,
  Download,
  Copy,
  Wand2,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Mic,
  MicOff,
  RefreshCw,
  FileCode,
  Lightbulb,
  Target,
  Layers,
  Box,
} from "lucide-react"

interface GeneratedComponent {
  id: string
  name: string
  description: string
  code: string
  preview: string
  framework: string
  category: string
  created: number
  prompt: string
  voiceGenerated: boolean
}

interface DesignSystem {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
  }
  typography: {
    heading: string
    body: string
  }
  spacing: string
  borderRadius: string
}

export function V0LikeInterface() {
  const [activeTab, setActiveTab] = useState("generate")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedComponents, setGeneratedComponents] = useState<GeneratedComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<GeneratedComponent | null>(null)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [designSystem, setDesignSystem] = useState<DesignSystem>({
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#f59e0b",
      background: "#ffffff",
      foreground: "#0f172a",
    },
    typography: {
      heading: "Inter",
      body: "Inter",
    },
    spacing: "1rem",
    borderRadius: "0.5rem",
  })
  const [isListening, setIsListening] = useState(false)
  const [voicePrompt, setVoicePrompt] = useState("")

  const recognitionRef = useRef<any>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setVoicePrompt(finalTranscript)
            setPrompt(finalTranscript)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  // Load components from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cognomegaComponents")
    if (stored) {
      const components = JSON.parse(stored)
      setGeneratedComponents(components)
      if (components.length > 0) {
        setSelectedComponent(components[0])
      }
    }
  }, [])

  const saveComponents = (components: GeneratedComponent[]) => {
    setGeneratedComponents(components)
    localStorage.setItem("cognomegaComponents", JSON.stringify(components))
  }

  const generateComponent = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-frontend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          designSystem,
          voiceGenerated: !!voicePrompt,
          framework: "react",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const newComponent: GeneratedComponent = {
        id: `comp-${Date.now()}`,
        name: extractComponentName(prompt),
        description: prompt,
        code: data.frontendCode || generateFallbackCode(prompt),
        preview: generatePreviewHTML(data.frontendCode || generateFallbackCode(prompt)),
        framework: "react",
        category: detectCategory(prompt),
        created: Date.now(),
        prompt,
        voiceGenerated: !!voicePrompt,
      }

      const updatedComponents = [newComponent, ...generatedComponents]
      saveComponents(updatedComponents)
      setSelectedComponent(newComponent)

      // Speak the response
      if ("speechSynthesis" in window && data.spokenMessage) {
        const utterance = new SpeechSynthesisUtterance(data.spokenMessage)
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Component generation error:", error)

      // Generate fallback component
      const fallbackComponent: GeneratedComponent = {
        id: `comp-${Date.now()}`,
        name: extractComponentName(prompt),
        description: prompt,
        code: generateFallbackCode(prompt),
        preview: generatePreviewHTML(generateFallbackCode(prompt)),
        framework: "react",
        category: detectCategory(prompt),
        created: Date.now(),
        prompt,
        voiceGenerated: !!voicePrompt,
      }

      const updatedComponents = [fallbackComponent, ...generatedComponents]
      saveComponents(updatedComponents)
      setSelectedComponent(fallbackComponent)
    } finally {
      setIsGenerating(false)
      setPrompt("")
      setVoicePrompt("")
    }
  }

  const extractComponentName = (prompt: string): string => {
    const words = prompt.toLowerCase().split(" ")
    if (words.includes("button")) return "Button Component"
    if (words.includes("card")) return "Card Component"
    if (words.includes("form")) return "Form Component"
    if (words.includes("navbar") || words.includes("navigation")) return "Navigation Component"
    if (words.includes("hero")) return "Hero Section"
    if (words.includes("footer")) return "Footer Component"
    if (words.includes("sidebar")) return "Sidebar Component"
    if (words.includes("modal")) return "Modal Component"
    if (words.includes("table")) return "Table Component"
    if (words.includes("dashboard")) return "Dashboard Component"
    return "Custom Component"
  }

  const detectCategory = (prompt: string): string => {
    const words = prompt.toLowerCase()
    if (words.includes("button") || words.includes("input") || words.includes("form")) return "Forms"
    if (words.includes("card") || words.includes("layout") || words.includes("grid")) return "Layout"
    if (words.includes("navbar") || words.includes("menu") || words.includes("navigation")) return "Navigation"
    if (words.includes("hero") || words.includes("banner") || words.includes("header")) return "Headers"
    if (words.includes("dashboard") || words.includes("chart") || words.includes("analytics")) return "Data"
    return "Components"
  }

  const generateFallbackCode = (prompt: string): string => {
    const componentName = extractComponentName(prompt).replace(" Component", "").replace(" ", "")

    return `import React from 'react'

interface ${componentName}Props {
  className?: string
}

export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <div className={\`p-6 bg-white rounded-lg shadow-lg \${className}\`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ${componentName}
      </h2>
      <p className="text-gray-600">
        Generated from: "${prompt}"
      </p>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Primary Action
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
          Secondary Action
        </button>
      </div>
    </div>
  )
}

export default ${componentName}`
  }

  const generatePreviewHTML = (code: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${code.replace(/export\s+default\s+\w+/, "ReactDOM.render(<$&.name />, document.getElementById('root'))")}
    </script>
</body>
</html>`
  }

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const copyCode = () => {
    if (selectedComponent) {
      navigator.clipboard.writeText(selectedComponent.code)
    }
  }

  const downloadComponent = () => {
    if (!selectedComponent) return

    const blob = new Blob([selectedComponent.code], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedComponent.name.replace(/\s+/g, "")}.tsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "375px"
      case "tablet":
        return "768px"
      case "desktop":
        return "100%"
      default:
        return "100%"
    }
  }

  const categories = ["All", "Forms", "Layout", "Navigation", "Headers", "Data", "Components"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cognomega v0-like Interface</h2>
          <p className="text-muted-foreground">Generate UI components with AI and voice commands</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="neural-glow">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
          <Badge variant="outline" className="neural-glow">
            <Mic className="w-3 h-3 mr-1" />
            Voice Enabled
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="design">Design System</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI Component Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Describe your component</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Create a modern button with hover effects..."
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                {isListening && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Mic className="w-3 h-3 mr-1" />
                    Listening for voice input...
                  </Badge>
                )}
              </div>

              <Button
                onClick={generateComponent}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Component...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Component
                  </>
                )}
              </Button>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <Label>Quick Prompts</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    "Modern button with gradient",
                    "Responsive card component",
                    "Navigation bar with logo",
                    "Hero section with CTA",
                    "Contact form with validation",
                    "Dashboard sidebar",
                    "Pricing table",
                    "Footer with links",
                  ].map((quickPrompt) => (
                    <Button
                      key={quickPrompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(quickPrompt)}
                      className="text-left justify-start h-auto p-2"
                    >
                      <Lightbulb className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-xs">{quickPrompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Generations */}
          {generatedComponents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recent Generations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedComponents.slice(0, 6).map((component) => (
                    <div
                      key={component.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedComponent?.id === component.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">{component.name}</h3>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {component.category}
                          </Badge>
                          {component.voiceGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Mic className="w-2 h-2 mr-1" />
                              Voice
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{component.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {new Date(component.created).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Component Preview
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPreviewMode("desktop")}
                    variant={previewMode === "desktop" ? "default" : "outline"}
                    size="sm"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setPreviewMode("tablet")}
                    variant={previewMode === "tablet" ? "default" : "outline"}
                    size="sm"
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setPreviewMode("mobile")}
                    variant={previewMode === "mobile" ? "default" : "outline"}
                    size="sm"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div
                  className="border rounded-lg overflow-hidden transition-all duration-300"
                  style={{
                    width: getPreviewWidth(),
                    height: "600px",
                    maxWidth: "100%",
                  }}
                >
                  {selectedComponent ? (
                    <iframe
                      ref={previewRef}
                      srcDoc={selectedComponent.preview}
                      className="w-full h-full border-0"
                      title="Component Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Component Selected</h3>
                        <p>Generate a component to see the preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Component Code
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyCode} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={downloadComponent} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedComponent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{selectedComponent.framework}</Badge>
                    <Badge variant="outline">{selectedComponent.category}</Badge>
                    <div className="text-sm text-muted-foreground">
                      {selectedComponent.code.split("\n").length} lines
                    </div>
                  </div>
                  <Textarea value={selectedComponent.code} readOnly className="min-h-[500px] font-mono text-sm" />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Component Selected</h3>
                  <p>Generate a component to see the code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Component Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button key={category} variant="outline" size="sm">
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedComponents.map((component) => (
                    <div
                      key={component.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedComponent?.id === component.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{component.name}</h3>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {component.category}
                          </Badge>
                          {component.voiceGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Mic className="w-2 h-2 mr-1" />
                              Voice
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{component.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(component.created).toLocaleDateString()}</span>
                        <span>{component.code.split("\n").length} lines</span>
                      </div>
                    </div>
                  ))}
                </div>

                {generatedComponents.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Components Yet</h3>
                    <p>Generate your first component to build your library</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design System Tab */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Design System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Colors</h3>
                  <div className="space-y-3">
                    {Object.entries(designSystem.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Label className="w-20 capitalize">{key}</Label>
                        <div className="w-8 h-8 rounded border" style={{ backgroundColor: value }} />
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            setDesignSystem({
                              ...designSystem,
                              colors: { ...designSystem.colors, [key]: e.target.value },
                            })
                          }
                          className="w-16 h-8 p-0 border-0"
                        />
                        <Input
                          value={value}
                          onChange={(e) =>
                            setDesignSystem({
                              ...designSystem,
                              colors: { ...designSystem.colors, [key]: e.target.value },
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Typography</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Heading</Label>
                      <Select
                        value={designSystem.typography.heading}
                        onValueChange={(value) =>
                          setDesignSystem({
                            ...designSystem,
                            typography: { ...designSystem.typography, heading: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Body</Label>
                      <Select
                        value={designSystem.typography.body}
                        onValueChange={(value) =>
                          setDesignSystem({
                            ...designSystem,
                            typography: { ...designSystem.typography, body: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Spacing & Layout</h3>
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Spacing</Label>
                      <Input
                        value={designSystem.spacing}
                        onChange={(e) => setDesignSystem({ ...designSystem, spacing: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Border Radius</Label>
                      <Input
                        value={designSystem.borderRadius}
                        onChange={(e) => setDesignSystem({ ...designSystem, borderRadius: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Design System Preview</h3>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: designSystem.colors.background,
                    color: designSystem.colors.foreground,
                    borderRadius: designSystem.borderRadius,
                  }}
                >
                  <h1
                    className="text-2xl font-bold mb-4"
                    style={{
                      fontFamily: designSystem.typography.heading,
                      color: designSystem.colors.primary,
                    }}
                  >
                    Sample Heading
                  </h1>
                  <p
                    className="mb-4"
                    style={{
                      fontFamily: designSystem.typography.body,
                      color: designSystem.colors.foreground,
                    }}
                  >
                    This is a sample paragraph using your design system settings.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: designSystem.colors.primary,
                        color: designSystem.colors.background,
                        borderRadius: designSystem.borderRadius,
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: designSystem.colors.secondary,
                        color: designSystem.colors.background,
                        borderRadius: designSystem.borderRadius,
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
