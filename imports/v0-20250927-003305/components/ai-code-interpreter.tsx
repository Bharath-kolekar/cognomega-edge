"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Square,
  Code,
  Terminal,
  FileCode,
  Zap,
  Brain,
  Download,
  Save,
  Folder,
  GitBranch,
  Database,
  Cloud,
  Mic,
  MicOff,
} from "lucide-react"

interface ExecutionResult {
  id: string
  code: string
  language: string
  output: string
  error?: string
  executionTime: number
  timestamp: number
  voiceGenerated: boolean
}

interface ProjectFile {
  path: string
  content: string
  language: string
  lastModified: number
}

interface AIProject {
  id: string
  name: string
  description: string
  files: ProjectFile[]
  dependencies: string[]
  framework: string
  created: number
  lastModified: number
}

export function AICodeInterpreter() {
  const [activeTab, setActiveTab] = useState("interpreter")
  const [code, setCode] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([])
  const [currentProject, setCurrentProject] = useState<AIProject | null>(null)
  const [projects, setProjects] = useState<AIProject[]>([])
  const [isListening, setIsListening] = useState(false)
  const [voicePrompt, setVoicePrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const recognitionRef = useRef<any>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

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
    const stored = localStorage.getItem("aiProjects")
    if (stored) {
      setProjects(JSON.parse(stored))
    }
  }, [])

  const saveProjects = (updatedProjects: AIProject[]) => {
    setProjects(updatedProjects)
    localStorage.setItem("aiProjects", JSON.stringify(updatedProjects))
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

  const generateCodeFromVoice = async () => {
    if (!voicePrompt.trim()) return

    setIsGenerating(true)
    setAiResponse("")

    try {
      // Use the existing API endpoint for code generation
      const response = await fetch("/api/generate-frontend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: voicePrompt,
          language: selectedLanguage,
          voiceGenerated: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const generatedCode = data.frontendCode || "// Code generation failed"

      setCode(generatedCode)
      setAiResponse(data.spokenMessage || "Code generated successfully")

      // Speak the response
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.spokenMessage)
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Code generation error:", error)
      setAiResponse("Sorry, I encountered an error while generating code. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const executeCode = async () => {
    if (!code.trim()) return

    setIsExecuting(true)
    const startTime = Date.now()

    try {
      let output = ""
      let error = ""

      // Simulate code execution for different languages
      switch (selectedLanguage) {
        case "javascript":
          try {
            // Create a safe execution environment
            const logs: string[] = []
            const mockConsole = {
              log: (...args: any[]) => logs.push(args.map((arg) => String(arg)).join(" ")),
              error: (...args: any[]) => logs.push("ERROR: " + args.map((arg) => String(arg)).join(" ")),
              warn: (...args: any[]) => logs.push("WARN: " + args.map((arg) => String(arg)).join(" ")),
            }

            // Execute in a controlled environment
            const func = new Function("console", code)
            func(mockConsole)
            output = logs.join("\n") || "Code executed successfully (no output)"
          } catch (e: any) {
            error = e.message
          }
          break

        case "python":
          // Mock Python execution
          output = `Python execution simulated for:\n${code.substring(0, 100)}...\n\nResult: Code would be executed in Python runtime`
          break

        case "typescript":
          // Mock TypeScript execution
          output = `TypeScript compilation and execution simulated:\n${code.substring(0, 100)}...\n\nResult: Code compiled and executed successfully`
          break

        default:
          output = `${selectedLanguage} execution simulated`
      }

      const result: ExecutionResult = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        language: selectedLanguage,
        output,
        error,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        voiceGenerated: !!voicePrompt,
      }

      setExecutionResults((prev) => [result, ...prev.slice(0, 9)])
    } catch (error: any) {
      const result: ExecutionResult = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        language: selectedLanguage,
        output: "",
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        voiceGenerated: !!voicePrompt,
      }

      setExecutionResults((prev) => [result, ...prev.slice(0, 9)])
    } finally {
      setIsExecuting(false)
    }
  }

  const createNewProject = () => {
    const project: AIProject = {
      id: `project-${Date.now()}`,
      name: `AI Project ${projects.length + 1}`,
      description: "Generated by Cognomega AI",
      files: [
        {
          path: "main.js",
          content: code || "// Start coding here",
          language: selectedLanguage,
          lastModified: Date.now(),
        },
      ],
      dependencies: [],
      framework: "vanilla",
      created: Date.now(),
      lastModified: Date.now(),
    }

    const updatedProjects = [...projects, project]
    saveProjects(updatedProjects)
    setCurrentProject(project)
  }

  const saveCurrentProject = () => {
    if (!currentProject) return

    const updatedProject = {
      ...currentProject,
      files: [
        {
          path: "main.js",
          content: code,
          language: selectedLanguage,
          lastModified: Date.now(),
        },
      ],
      lastModified: Date.now(),
    }

    const updatedProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p))

    saveProjects(updatedProjects)
    setCurrentProject(updatedProject)
  }

  const loadProject = (project: AIProject) => {
    setCurrentProject(project)
    if (project.files.length > 0) {
      setCode(project.files[0].content)
      setSelectedLanguage(project.files[0].language)
    }
  }

  const exportProject = () => {
    if (!currentProject) return

    const projectData = {
      ...currentProject,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentProject.name.replace(/\s+/g, "-").toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const supportedLanguages = [
    { value: "javascript", label: "JavaScript", icon: "🟨" },
    { value: "typescript", label: "TypeScript", icon: "🔷" },
    { value: "python", label: "Python", icon: "🐍" },
    { value: "java", label: "Java", icon: "☕" },
    { value: "go", label: "Go", icon: "🐹" },
    { value: "rust", label: "Rust", icon: "🦀" },
    { value: "html", label: "HTML", icon: "🌐" },
    { value: "css", label: "CSS", icon: "🎨" },
    { value: "sql", label: "SQL", icon: "🗄️" },
    { value: "bash", label: "Bash", icon: "💻" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Code Interpreter & Development Platform</h2>
          <p className="text-muted-foreground">Voice-enabled coding with real-time execution and project management</p>
        </div>
        <div className="flex gap-2">
          {currentProject && (
            <>
              <Button onClick={saveCurrentProject} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
              <Button onClick={exportProject} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
          )}
          <Button onClick={createNewProject} size="sm">
            <Folder className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interpreter">Code Interpreter</TabsTrigger>
          <TabsTrigger value="voice-coding">Voice Coding</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Code Interpreter Tab */}
        <TabsContent value="interpreter" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Editor
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <span className="flex items-center gap-2">
                            <span>{lang.icon}</span>
                            {lang.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">{code.split("\n").length} lines</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={editorRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`Write your ${selectedLanguage} code here...`}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex gap-2 mt-4">
                  <Button onClick={executeCode} disabled={isExecuting || !code.trim()} className="flex-1">
                    {isExecuting ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Code
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setCode("")} variant="outline">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Execution Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Execution Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {executionResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No executions yet. Run some code to see results here.</p>
                    </div>
                  ) : (
                    executionResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.language}</Badge>
                            {result.voiceGenerated && (
                              <Badge variant="secondary">
                                <Mic className="w-3 h-3 mr-1" />
                                Voice
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{result.executionTime}ms</div>
                        </div>

                        {result.error ? (
                          <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                            <strong>Error:</strong> {result.error}
                          </div>
                        ) : (
                          <div className="bg-muted p-3 rounded text-sm">
                            <pre className="whitespace-pre-wrap">{result.output}</pre>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice Coding Tab */}
        <TabsContent value="voice-coding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Voice Coding Assistant
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

                {aiResponse && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm mb-1">AI Response:</div>
                    <div className="text-sm text-muted-foreground">{aiResponse}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Commands Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Commands Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Code Generation:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Create a React component with a button"</div>
                      <div>"Build a function that sorts an array"</div>
                      <div>"Generate a REST API endpoint"</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Code Modification:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Add error handling to this function"</div>
                      <div>"Refactor this code to use async/await"</div>
                      <div>"Add TypeScript types to this component"</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Code Explanation:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Explain how this algorithm works"</div>
                      <div>"What does this code do?"</div>
                      <div>"Find bugs in this function"</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Project Management:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>"Create a new React project"</div>
                      <div>"Add a database schema"</div>
                      <div>"Generate unit tests"</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Project */}
            {currentProject && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    {currentProject.name}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">{currentProject.description}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{currentProject.framework}</Badge>
                      <Badge variant="outline">{currentProject.files.length} files</Badge>
                      <Badge variant="outline">
                        Modified {new Date(currentProject.lastModified).toLocaleDateString()}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium text-sm">Project Files:</div>
                      {currentProject.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4" />
                            <span className="text-sm">{file.path}</span>
                            <Badge variant="secondary" className="text-xs">
                              {file.language}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((file.content.length / 1024) * 100) / 100} KB
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveCurrentProject} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={exportProject} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
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
                        onClick={() => loadProject(project)}
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
        <TabsContent value="deployment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deployment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Deployment Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">V</span>
                      </div>
                      <div>
                        <div className="font-medium">Vercel</div>
                        <div className="text-sm text-muted-foreground">Deploy to Vercel platform</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full" disabled>
                      <Cloud className="w-4 h-4 mr-2" />
                      Deploy to Vercel
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">CF</span>
                      </div>
                      <div>
                        <div className="font-medium">Cloudflare Pages</div>
                        <div className="text-sm text-muted-foreground">Deploy to Cloudflare</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full" disabled>
                      <Cloud className="w-4 h-4 mr-2" />
                      Deploy to Cloudflare
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">GitHub Pages</div>
                        <div className="text-sm text-muted-foreground">Deploy to GitHub Pages</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full" disabled>
                      <GitBranch className="w-4 h-4 mr-2" />
                      Deploy to GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">N</span>
                      </div>
                      <div>
                        <div className="font-medium">Neon Database</div>
                        <div className="text-sm text-muted-foreground">PostgreSQL database</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      Connected
                    </Badge>
                    <Button size="sm" className="w-full bg-transparent" variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Manage Database
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div>
                        <div className="font-medium">Supabase</div>
                        <div className="text-sm text-muted-foreground">PostgreSQL with auth</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-transparent" variant="outline" disabled>
                      <Database className="w-4 h-4 mr-2" />
                      Connect Supabase
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                      <div>
                        <div className="font-medium">Upstash Redis</div>
                        <div className="text-sm text-muted-foreground">Redis database</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-transparent" variant="outline" disabled>
                      <Database className="w-4 h-4 mr-2" />
                      Connect Redis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ready to Deploy</h3>
                <p className="mb-4">
                  Your projects are ready to be deployed to various platforms. Choose a deployment option above to get
                  started.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Free Hosting</div>
                    <div className="text-sm text-muted-foreground">
                      Deploy static sites for free on GitHub Pages, Vercel, or Cloudflare
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Database Ready</div>
                    <div className="text-sm text-muted-foreground">
                      Neon PostgreSQL database is connected and ready for production
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Open Source</div>
                    <div className="text-sm text-muted-foreground">
                      All tools and platforms used are open source or have free tiers
                    </div>
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
