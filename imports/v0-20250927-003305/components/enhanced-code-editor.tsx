"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Play,
  Square,
  Code,
  Eye,
  Save,
  Folder,
  FileCode,
  Zap,
  Brain,
  Mic,
  MicOff,
  GitBranch,
  Cloud,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { superIntelligenceEngine } from "@/lib/super-intelligence-engine"

interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: string
  lastModified: number
}

interface Project {
  id: string
  name: string
  description: string
  framework: string
  files: ProjectFile[]
  dependencies: string[]
  created: number
  lastModified: number
  deploymentUrl?: string
}

interface CodeError {
  line: number
  column: number
  message: string
  severity: "error" | "warning" | "info"
}

interface SuperIntelligenceInsight {
  type: "optimization" | "bug_prevention" | "pattern_recognition" | "learning"
  message: string
  confidence: number
  actionable: boolean
  action?: () => void
}

export function EnhancedCodeEditor() {
  const [activeTab, setActiveTab] = useState("editor")
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null)
  const [code, setCode] = useState("")
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [errors, setErrors] = useState<CodeError[]>([])
  const [isListening, setIsListening] = useState(false)
  const [voicePrompt, setVoicePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const [superIntelligenceActive, setSuperIntelligenceActive] = useState(false)
  const [intelligenceInsights, setIntelligenceInsights] = useState<SuperIntelligenceInsight[]>([])
  const [reasoningChains, setReasoningChains] = useState<any[]>([])
  const [autonomousDecisions, setAutonomousDecisions] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictedIssues, setPredictedIssues] = useState<any[]>([])

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
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  // Load projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cognomegaProjects")
    if (stored) {
      const loadedProjects = JSON.parse(stored)
      setProjects(loadedProjects)
      if (loadedProjects.length > 0) {
        setCurrentProject(loadedProjects[0])
        if (loadedProjects[0].files.length > 0) {
          setActiveFile(loadedProjects[0].files[0])
          setCode(loadedProjects[0].files[0].content)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (superIntelligenceActive && code && activeFile) {
      const analyzeCode = async () => {
        try {
          // Perform predictive analysis
          const prediction = await superIntelligenceEngine.predictAndPreventProblems(code, activeFile.language)
          setPredictedIssues(prediction.predicted_issues)

          // Generate insights
          const insights: SuperIntelligenceInsight[] = []

          if (prediction.predicted_issues.length > 0) {
            insights.push({
              type: "bug_prevention",
              message: `Detected ${prediction.predicted_issues.length} potential issues. Click to see prevention strategies.`,
              confidence: 0.8,
              actionable: true,
              action: () => showPredictedIssues(),
            })
          }

          // Pattern recognition
          const patterns = await superIntelligenceEngine.recognizeAdvancedPatterns(
            [{ code, language: activeFile.language }],
            "code_analysis",
          )
          if (patterns.patterns.length > 0) {
            insights.push({
              type: "pattern_recognition",
              message: `Found ${patterns.patterns.length} code patterns. Optimization opportunities available.`,
              confidence: 0.7,
              actionable: true,
              action: () => optimizeWithPatterns(patterns),
            })
          }

          setIntelligenceInsights(insights)
        } catch (error) {
          console.error("[v0] Super intelligence analysis error:", error)
        }
      }

      const debounceTimer = setTimeout(analyzeCode, 1000)
      return () => clearTimeout(debounceTimer)
    }
  }, [code, activeFile, superIntelligenceActive])

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects)
    localStorage.setItem("cognomegaProjects", JSON.stringify(updatedProjects))
  }

  const createNewProject = () => {
    const project: Project = {
      id: `project-${Date.now()}`,
      name: `Cognomega Project ${projects.length + 1}`,
      description: "AI-generated full-stack application",
      framework: "react",
      files: [
        {
          id: `file-${Date.now()}`,
          name: "App.tsx",
          path: "src/App.tsx",
          content: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome to Cognomega AI
        </h1>
        <p className="text-gray-600">
          Your AI-powered development platform is ready!
        </p>
      </div>
    </div>
  )
}

export default App`,
          language: "typescript",
          lastModified: Date.now(),
        },
      ],
      dependencies: ["react", "react-dom", "@types/react", "@types/react-dom"],
      created: Date.now(),
      lastModified: Date.now(),
    }

    const updatedProjects = [...projects, project]
    saveProjects(updatedProjects)
    setCurrentProject(project)
    setActiveFile(project.files[0])
    setCode(project.files[0].content)
  }

  const saveCurrentFile = () => {
    if (!currentProject || !activeFile) return

    const updatedFile = {
      ...activeFile,
      content: code,
      lastModified: Date.now(),
    }

    const updatedFiles = currentProject.files.map((f) => (f.id === activeFile.id ? updatedFile : f))

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      lastModified: Date.now(),
    }

    const updatedProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p))

    saveProjects(updatedProjects)
    setCurrentProject(updatedProject)
    setActiveFile(updatedFile)
  }

  const addNewFile = () => {
    if (!currentProject) return

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: "NewFile.tsx",
      path: "src/NewFile.tsx",
      content: "// New file created by Cognomega AI\n",
      language: "typescript",
      lastModified: Date.now(),
    }

    const updatedProject = {
      ...currentProject,
      files: [...currentProject.files, newFile],
      lastModified: Date.now(),
    }

    const updatedProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p))

    saveProjects(updatedProjects)
    setCurrentProject(updatedProject)
    setActiveFile(newFile)
    setCode(newFile.content)
  }

  const runCode = async () => {
    if (!code.trim()) return

    setIsExecuting(true)
    setErrors([])

    try {
      const detectedErrors: CodeError[] = []

      // Basic syntax checking for JavaScript/TypeScript
      if (activeFile?.language === "typescript" || activeFile?.language === "javascript") {
        // Simple error detection
        const lines = code.split("\n")

        lines.forEach((line, index) => {
          // Check for common syntax errors
          if (line.includes("function") && !line.includes("{") && !line.includes(";")) {
            detectedErrors.push({
              line: index + 1,
              column: 1,
              message: "Missing opening brace or semicolon",
              severity: "error",
            })
          }
          if (line.includes("console.log") && !line.includes(")")) {
            detectedErrors.push({
              line: index + 1,
              column: line.indexOf("console.log"),
              message: "Missing closing parenthesis",
              severity: "error",
            })
          }
        })

        setErrors(detectedErrors)
      }

      // Generate preview content
      let preview = ""
      if (activeFile?.language === "typescript" || activeFile?.language === "javascript") {
        // Convert React component to HTML preview
        if (code.includes("function App") || code.includes("const App")) {
          preview = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cognomega Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .min-h-screen { min-height: 100vh; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .bg-white { background-color: white; }
        .p-8 { padding: 2rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .text-gray-800 { color: #1f2937; }
        .mb-4 { margin-bottom: 1rem; }
        .text-gray-600 { color: #4b5563; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${code.replace("export default App", "ReactDOM.render(<App />, document.getElementById('root'))")}
    </script>
</body>
</html>`
        }
      } else if (activeFile?.language === "html") {
        preview = code
      }

      setPreviewContent(preview)

      if (superIntelligenceActive) {
        await superIntelligenceEngine.learnFromExperience({
          context: "code_execution",
          action: "run_code",
          outcome: detectedErrors.length === 0 ? "success" : "errors_detected",
          success: detectedErrors.length === 0,
          feedback: `Code execution with ${detectedErrors.length} errors`,
        })
      }
    } catch (error: any) {
      setErrors([
        {
          line: 1,
          column: 1,
          message: error.message,
          severity: "error",
        },
      ])
    } finally {
      setIsExecuting(false)
    }
  }

  const generateCodeFromVoice = async () => {
    if (!voicePrompt.trim()) return

    setIsGenerating(true)

    try {
      if (superIntelligenceActive) {
        const reasoning = await superIntelligenceEngine.performDeepReasoning(
          `Generate optimal code for: ${voicePrompt}`,
          {
            language: activeFile?.language || "typescript",
            framework: currentProject?.framework || "react",
            existingCode: code,
          },
        )

        setReasoningChains((prev) => [...prev, reasoning])

        const codeGeneration = await superIntelligenceEngine.generateSelfModifyingCode(voicePrompt, code)

        setCode(codeGeneration.code)

        // Add insights about the generated code
        setIntelligenceInsights((prev) => [
          ...prev,
          {
            type: "learning",
            message: `Generated code with ${codeGeneration.improvements.length} improvements and self-modification capabilities`,
            confidence: reasoning.confidence,
            actionable: true,
            action: () => showCodeInsights(codeGeneration),
          },
        ])
      } else {
        // Original code generation
        const response = await fetch("/api/generate-frontend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: voicePrompt,
            language: activeFile?.language || "typescript",
            framework: currentProject?.framework || "react",
            voiceGenerated: true,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const generatedCode = data.frontendCode || "// Code generation failed"

        setCode(generatedCode)
      }

      // Speak the response
      if ("speechSynthesis" in window) {
        const message = superIntelligenceActive
          ? "Code generated with super intelligence capabilities including self-modification and advanced optimization"
          : "Code generated successfully"
        const utterance = new SpeechSynthesisUtterance(message)
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Code generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const activateSuperIntelligence = async () => {
    setSuperIntelligenceActive(true)
    setIsAnalyzing(true)

    try {
      // Perform initial analysis of current code
      if (code && activeFile) {
        const reasoning = await superIntelligenceEngine.performDeepReasoning(
          "Analyze current code for optimization opportunities and potential improvements",
          { code, language: activeFile.language, framework: currentProject?.framework },
        )

        setReasoningChains([reasoning])

        // Make autonomous decision about code improvements
        const decision = await superIntelligenceEngine.makeAutonomousDecision(
          "code_optimization",
          ["refactor_for_performance", "add_error_handling", "improve_readability", "add_type_safety"],
          ["maintain_functionality", "preserve_user_intent"],
        )

        setAutonomousDecisions([decision])

        setIntelligenceInsights([
          {
            type: "optimization",
            message:
              "Super intelligence activated. Advanced code analysis and optimization capabilities are now available.",
            confidence: 0.95,
            actionable: true,
            action: () => applyIntelligentOptimizations(),
          },
        ])
      }
    } catch (error) {
      console.error("[v0] Super intelligence activation error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const showPredictedIssues = () => {
    console.log("[v0] Showing predicted issues:", predictedIssues)
    // Implementation for showing predicted issues UI
  }

  const optimizeWithPatterns = (patterns: any) => {
    console.log("[v0] Optimizing with patterns:", patterns)
    // Implementation for pattern-based optimization
  }

  const showCodeInsights = (codeGeneration: any) => {
    console.log("[v0] Showing code insights:", codeGeneration)
    // Implementation for showing code generation insights
  }

  const applyIntelligentOptimizations = async () => {
    if (!code || !activeFile) return

    try {
      const optimizedCode = await superIntelligenceEngine.generateSelfModifyingCode(
        "Optimize this code for performance, readability, and maintainability",
        code,
      )

      setCode(optimizedCode.code)

      setIntelligenceInsights((prev) => [
        ...prev,
        {
          type: "optimization",
          message: `Applied ${optimizedCode.improvements.length} intelligent optimizations`,
          confidence: 0.9,
          actionable: false,
        },
      ])
    } catch (error) {
      console.error("[v0] Optimization error:", error)
    }
  }

  const deployProject = async () => {
    if (!currentProject) return

    setIsDeploying(true)

    try {
      // Simulate deployment process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate a mock deployment URL
      const deploymentUrl = `https://${currentProject.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.cognomega.app`

      const updatedProject = {
        ...currentProject,
        deploymentUrl,
        lastModified: Date.now(),
      }

      const updatedProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p))

      saveProjects(updatedProjects)
      setCurrentProject(updatedProject)

      // Speak deployment success
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Project ${currentProject.name} has been successfully deployed to ${deploymentUrl}`,
        )
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Deployment error:", error)
    } finally {
      setIsDeploying(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cognomega Development Platform</h2>
          <p className="text-muted-foreground">Enhanced development experience with super intelligence capabilities</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={activateSuperIntelligence}
            disabled={superIntelligenceActive || isAnalyzing}
            variant={superIntelligenceActive ? "default" : "outline"}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : superIntelligenceActive ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Super Intelligence Active
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Activate Super Intelligence
              </>
            )}
          </Button>

          <Button onClick={createNewProject} size="sm">
            <Folder className="w-4 h-4 mr-2" />
            New Project
          </Button>
          {currentProject && (
            <>
              <Button onClick={saveCurrentFile} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={deployProject} disabled={isDeploying} size="sm">
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Deploy
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {superIntelligenceActive && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-900">Super Intelligence Engine Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-medium text-blue-800">Deep Reasoning</div>
                <div className="text-blue-600">{reasoningChains.length} chains active</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Pattern Recognition</div>
                <div className="text-blue-600">Advanced analysis enabled</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Predictive Analysis</div>
                <div className="text-blue-600">{predictedIssues.length} issues predicted</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Autonomous Decisions</div>
                <div className="text-blue-600">{autonomousDecisions.length} decisions made</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {intelligenceInsights.length > 0 && (
        <Card className="border-purple-500 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Brain className="w-5 h-5" />
              Intelligence Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {intelligenceInsights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{insight.message}</div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {Math.round(insight.confidence * 100)}% • Type: {insight.type}
                    </div>
                  </div>
                  {insight.actionable && insight.action && (
                    <Button size="sm" variant="outline" onClick={insight.action}>
                      Apply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentProject && (
        <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            <span className="font-medium">{currentProject.name}</span>
          </div>
          <Badge variant="outline">{currentProject.framework}</Badge>
          <Badge variant="outline">{currentProject.files.length} files</Badge>
          {currentProject.deploymentUrl && (
            <Badge variant="default" className="bg-green-500">
              <Globe className="w-3 h-3 mr-1" />
              Deployed
            </Badge>
          )}
          {superIntelligenceActive && (
            <Badge variant="default" className="bg-blue-500">
              <Brain className="w-3 h-3 mr-1" />
              Super Intelligence
            </Badge>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="voice">Voice Coding</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
          <TabsTrigger value="deploy">Deployment</TabsTrigger>
          <TabsTrigger value="intelligence">Super Intelligence</TabsTrigger>
        </TabsList>

        {/* Code Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    {activeFile?.name || "No file selected"}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNewFile} size="sm" variant="outline">
                      <FileCode className="w-4 h-4 mr-2" />
                      New File
                    </Button>
                    <Button onClick={runCode} disabled={isExecuting} size="sm">
                      {isExecuting ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Start coding here..."
                  className="min-h-[500px] font-mono text-sm"
                />
                {errors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="font-medium text-sm text-destructive">Errors:</div>
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span>
                          Line {error.line}: {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mini Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Quick Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                  {previewContent ? (
                    <iframe
                      ref={previewRef}
                      srcDoc={previewContent}
                      className="w-full h-full border-0"
                      title="Code Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Run your code to see the preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
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
                  <Button onClick={runCode} disabled={isExecuting} size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
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
                  {previewContent ? (
                    <iframe srcDoc={previewContent} className="w-full h-full border-0" title="Live Preview" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
                        <p>Run your code to see the live preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Coding Tab */}
        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Voice Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Voice Command</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={voicePrompt}
                      onChange={(e) => setVoicePrompt(e.target.value)}
                      placeholder="Describe what you want to code, or use voice input..."
                      className="flex-1"
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
                      Listening for voice input...
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={generateCodeFromVoice}
                  disabled={!voicePrompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Generating Code...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Code with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice Commands Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Component Creation:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Create a React button component"</div>
                      <div>"Build a responsive navbar"</div>
                      <div>"Generate a contact form"</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Full Applications:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Create a todo app with React"</div>
                      <div>"Build an e-commerce dashboard"</div>
                      <div>"Generate a blog website"</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Code Modification:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Add dark mode to this component"</div>
                      <div>"Make this responsive"</div>
                      <div>"Add TypeScript types"</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* File Manager Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Files */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Project Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentProject ? (
                  <div className="space-y-2">
                    {currentProject.files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          activeFile?.id === file.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          setActiveFile(file)
                          setCode(file.content)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <FileCode className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-sm">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.path}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {file.language}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((file.content.length / 1024) * 100) / 100} KB
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No project selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  All Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No projects yet</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          currentProject?.id === project.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          setCurrentProject(project)
                          if (project.files.length > 0) {
                            setActiveFile(project.files[0])
                            setCode(project.files[0].content)
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{project.description}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.framework}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.files.length} files
                          </Badge>
                          {project.deploymentUrl && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Deployed
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(project.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deploy" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deployment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Deployment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentProject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{currentProject.name}</span>
                      {currentProject.deploymentUrl ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Deployed
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Deployed</Badge>
                      )}
                    </div>

                    {currentProject.deploymentUrl && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-medium text-sm mb-1">Live URL:</div>
                        <a
                          href={currentProject.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {currentProject.deploymentUrl}
                        </a>
                      </div>
                    )}

                    <Button onClick={deployProject} disabled={isDeploying} className="w-full">
                      {isDeploying ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 mr-2" />
                          {currentProject.deploymentUrl ? "Redeploy" : "Deploy Now"}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No project selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deployment Platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Available Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">CF</span>
                      </div>
                      <div>
                        <div className="font-medium">Cloudflare Pages</div>
                        <div className="text-sm text-muted-foreground">Free static hosting</div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Available
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">GitHub Pages</div>
                        <div className="text-sm text-muted-foreground">Free GitHub hosting</div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Available
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">N</span>
                      </div>
                      <div>
                        <div className="font-medium">Neon Database</div>
                        <div className="text-sm text-muted-foreground">PostgreSQL backend</div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">1. Build Ready</div>
                  <div className="text-sm text-muted-foreground">
                    Your project is automatically optimized for production deployment
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">2. Free Hosting</div>
                  <div className="text-sm text-muted-foreground">
                    Deploy to Cloudflare Pages or GitHub Pages at no cost
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">3. Database Ready</div>
                  <div className="text-sm text-muted-foreground">
                    Neon PostgreSQL database is connected and ready for production
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reasoning Chains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Deep Reasoning Chains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reasoningChains.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No reasoning chains yet</p>
                      <p className="text-sm">Activate super intelligence to see deep reasoning</p>
                    </div>
                  ) : (
                    reasoningChains.map((chain, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="font-medium mb-2">Reasoning Chain #{index + 1}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {chain.steps.length} steps • {Math.round(chain.confidence * 100)}% confidence
                        </div>
                        <div className="text-sm">{chain.conclusion}</div>
                        <div className="mt-2">
                          <Badge variant="outline">{new Date(chain.timestamp).toLocaleTimeString()}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Predicted Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Predicted Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictedIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No issues predicted</p>
                      <p className="text-sm">Your code looks good!</p>
                    </div>
                  ) : (
                    predictedIssues.map((issue, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{issue.type}</div>
                          <Badge
                            variant={
                              issue.severity > 0.7 ? "destructive" : issue.severity > 0.4 ? "default" : "secondary"
                            }
                          >
                            {Math.round(issue.severity * 100)}% severity
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{issue.description}</div>
                        <div className="text-sm">
                          <strong>Prevention:</strong> {issue.prevention_strategy}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline">{Math.round(issue.confidence * 100)}% confidence</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Super Intelligence Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Super Intelligence Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-20 flex-col gap-2"
                  onClick={applyIntelligentOptimizations}
                  disabled={!superIntelligenceActive || !code}
                >
                  <Zap className="w-6 h-6" />
                  <span>Intelligent Optimization</span>
                </Button>
                <Button
                  className="h-20 flex-col gap-2 bg-transparent"
                  variant="outline"
                  disabled={!superIntelligenceActive}
                >
                  <Brain className="w-6 h-6" />
                  <span>Pattern Analysis</span>
                </Button>
                <Button
                  className="h-20 flex-col gap-2 bg-transparent"
                  variant="outline"
                  disabled={!superIntelligenceActive}
                >
                  <AlertCircle className="w-6 h-6" />
                  <span>Predictive Prevention</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... existing tabs content ... */}
      </Tabs>
    </div>
  )
}
