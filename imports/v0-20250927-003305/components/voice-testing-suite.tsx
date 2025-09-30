"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TestTube,
  Mic,
  Code,
  Download,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  Zap,
  FileCode,
  Bug,
} from "lucide-react"
import { voiceAIIntegration } from "@/lib/voice-ai-integration"

interface TestResult {
  id: string
  testName: string
  status: "passed" | "failed" | "running" | "pending"
  duration: number
  details: string
  timestamp: number
  voiceInput: string
  expectedOutput: string
  actualOutput: string
  confidence: number
}

interface CodeAnalysisResult {
  id: string
  code: string
  language: string
  analysis: {
    complexity: number
    maintainability: number
    testability: number
    performance: number
    security: number
  }
  suggestions: string[]
  issues: Array<{
    type: "error" | "warning" | "info"
    message: string
    line?: number
  }>
  voiceExplanation: string
}

export function VoiceTestingSuite() {
  const [activeTab, setActiveTab] = useState("voice-tests")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [codeAnalysisResults, setCodeAnalysisResults] = useState<CodeAnalysisResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [voiceInput, setVoiceInput] = useState("")
  const [expectedOutput, setExpectedOutput] = useState("")
  const [codeToAnalyze, setCodeToAnalyze] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition()
      newRecognition.continuous = false
      newRecognition.interimResults = true
      newRecognition.lang = "en-US"

      newRecognition.onresult = (event) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setVoiceInput(finalTranscript)
        }
      }

      newRecognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(newRecognition)
    }
  }, [])

  const predefinedTests = [
    {
      name: "Voice Code Generation",
      voiceInput: "Create a React component with a button that says hello",
      expectedOutput: "React component with button element",
      testType: "code_generation",
    },
    {
      name: "Voice Navigation",
      voiceInput: "Go to the admin dashboard",
      expectedOutput: "Navigation to admin route",
      testType: "navigation",
    },
    {
      name: "Voice Summarization",
      voiceInput: "Summarize this code: function add(a, b) { return a + b; }",
      expectedOutput: "Function that adds two numbers",
      testType: "summarization",
    },
    {
      name: "Voice Export",
      voiceInput: "Export the current data as JSON",
      expectedOutput: "JSON export initiated",
      testType: "export",
    },
    {
      name: "Voice Testing",
      voiceInput: "Run unit tests for the authentication module",
      expectedOutput: "Test execution started",
      testType: "testing",
    },
    {
      name: "Voice Code Explanation",
      voiceInput: "Explain how this async function works",
      expectedOutput: "Detailed explanation of async function",
      testType: "explanation",
    },
  ]

  const runVoiceTest = async (testInput: string, expectedOutput: string, testName: string) => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newTest: TestResult = {
      id: testId,
      testName,
      status: "running",
      duration: 0,
      details: "Processing voice input...",
      timestamp: Date.now(),
      voiceInput: testInput,
      expectedOutput,
      actualOutput: "",
      confidence: 0,
    }

    setTestResults((prev) => [newTest, ...prev])

    const startTime = Date.now()

    try {
      // Process voice input with AI integration
      const result = await voiceAIIntegration.processVoiceInput(testInput)
      const duration = Date.now() - startTime

      const actualOutput = result.aiResponse.message || "No response generated"
      const confidence = result.voiceResult.confidence || 0

      // Determine if test passed based on simple keyword matching
      const passed = actualOutput.toLowerCase().includes(expectedOutput.toLowerCase().split(" ")[0]) || confidence > 0.7

      const updatedTest: TestResult = {
        ...newTest,
        status: passed ? "passed" : "failed",
        duration,
        details: passed ? "Test completed successfully" : "Test failed - output doesn't match expected result",
        actualOutput,
        confidence,
      }

      setTestResults((prev) => prev.map((test) => (test.id === testId ? updatedTest : test)))
    } catch (error) {
      const updatedTest: TestResult = {
        ...newTest,
        status: "failed",
        duration: Date.now() - startTime,
        details: `Test failed with error: ${error.message}`,
        actualOutput: "Error occurred",
        confidence: 0,
      }

      setTestResults((prev) => prev.map((test) => (test.id === testId ? updatedTest : test)))
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestProgress(0)

    for (let i = 0; i < predefinedTests.length; i++) {
      const test = predefinedTests[i]
      await runVoiceTest(test.voiceInput, test.expectedOutput, test.name)
      setTestProgress(((i + 1) / predefinedTests.length) * 100)

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsRunningTests(false)
  }

  const analyzeCode = async () => {
    if (!codeToAnalyze.trim()) return

    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Simulate code analysis (in real implementation, this would use actual analysis tools)
    const mockAnalysis: CodeAnalysisResult = {
      id: analysisId,
      code: codeToAnalyze,
      language: selectedLanguage,
      analysis: {
        complexity: Math.floor(Math.random() * 100),
        maintainability: Math.floor(Math.random() * 100),
        testability: Math.floor(Math.random() * 100),
        performance: Math.floor(Math.random() * 100),
        security: Math.floor(Math.random() * 100),
      },
      suggestions: [
        "Consider breaking down complex functions into smaller, more manageable pieces",
        "Add error handling for edge cases",
        "Implement proper input validation",
        "Consider using TypeScript for better type safety",
        "Add comprehensive unit tests",
      ],
      issues: [
        { type: "warning", message: "Function complexity is high", line: 5 },
        { type: "info", message: "Consider adding JSDoc comments", line: 1 },
        { type: "error", message: "Potential null reference", line: 12 },
      ],
      voiceExplanation: `This ${selectedLanguage} code has a complexity score of ${Math.floor(Math.random() * 100)}. The main areas for improvement include error handling, input validation, and code documentation. Consider refactoring complex functions and adding comprehensive tests.`,
    }

    setCodeAnalysisResults((prev) => [mockAnalysis, ...prev])

    // Generate voice explanation
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(mockAnalysis.voiceExplanation)
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (recognition) {
      setIsListening(true)
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition) {
      setIsListening(false)
      recognition.stop()
    }
  }

  const exportResults = (format: "json" | "csv" | "pdf") => {
    const data = {
      testResults,
      codeAnalysisResults,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        passedTests: testResults.filter((t) => t.status === "passed").length,
        failedTests: testResults.filter((t) => t.status === "failed").length,
        averageConfidence: testResults.reduce((acc, t) => acc + t.confidence, 0) / testResults.length || 0,
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `voice-testing-results-${Date.now()}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Voice Testing & Code Analysis Suite</h2>
          <p className="text-muted-foreground">Comprehensive testing and analysis tools for voice-enabled features</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportResults("json")} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voice-tests">Voice Tests</TabsTrigger>
          <TabsTrigger value="code-analysis">Code Analysis</TabsTrigger>
          <TabsTrigger value="end-to-end">E2E Testing</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Voice Tests Tab */}
        <TabsContent value="voice-tests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Voice Test Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Voice Input</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Enter voice command to test..."
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                    >
                      {isListening ? <Pause className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Expected Output</Label>
                  <Input
                    placeholder="Expected result..."
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => runVoiceTest(voiceInput, expectedOutput, "Custom Test")}
                    disabled={!voiceInput || !expectedOutput}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Single Test
                  </Button>
                  <Button
                    onClick={runAllTests}
                    disabled={isRunningTests}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Run All Tests
                  </Button>
                </div>

                {isRunningTests && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Running tests...</span>
                      <span>{Math.round(testProgress)}%</span>
                    </div>
                    <Progress value={testProgress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Predefined Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Predefined Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predefinedTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{test.name}</div>
                        <div className="text-xs text-muted-foreground">"{test.voiceInput}"</div>
                      </div>
                      <Button
                        onClick={() => runVoiceTest(test.voiceInput, test.expectedOutput, test.name)}
                        size="sm"
                        variant="outline"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{result.testName}</div>
                        <div className="text-xs text-muted-foreground">{result.details}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          result.status === "passed"
                            ? "default"
                            : result.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {result.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">{result.duration}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Analysis Tab */}
        <TabsContent value="code-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Programming Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Code to Analyze</Label>
                  <Textarea
                    placeholder="Paste your code here for analysis..."
                    value={codeToAnalyze}
                    onChange={(e) => setCodeToAnalyze(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <Button onClick={analyzeCode} disabled={!codeToAnalyze.trim()} className="w-full">
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Code with Voice Explanation
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Features */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Performance Analysis</div>
                      <div className="text-sm text-muted-foreground">Identify performance bottlenecks</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Bug className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium">Bug Detection</div>
                      <div className="text-sm text-muted-foreground">Find potential issues and bugs</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileCode className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">Code Quality</div>
                      <div className="text-sm text-muted-foreground">Assess maintainability and readability</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <TestTube className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Test Generation</div>
                      <div className="text-sm text-muted-foreground">Generate unit tests automatically</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          {codeAnalysisResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {codeAnalysisResults.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{analysis.language}</Badge>
                        <div className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</div>
                      </div>

                      {/* Quality Scores */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(analysis.analysis).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</div>
                            <div className="text-xs text-muted-foreground capitalize">{key}</div>
                          </div>
                        ))}
                      </div>

                      {/* Issues */}
                      {analysis.issues.length > 0 && (
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Issues Found:</div>
                          {analysis.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {issue.type === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                              {issue.type === "warning" && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                              {issue.type === "info" && <AlertCircle className="w-4 h-4 text-blue-500" />}
                              <span>{issue.message}</span>
                              {issue.line && <span className="text-muted-foreground">(Line {issue.line})</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Voice Explanation */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium text-sm mb-1">Voice Explanation:</div>
                        <div className="text-sm text-muted-foreground">{analysis.voiceExplanation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* E2E Testing Tab */}
        <TabsContent value="end-to-end" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Voice-Enabled End-to-End Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">E2E Testing Suite</h3>
                <p className="text-muted-foreground mb-4">
                  Comprehensive end-to-end testing with voice commands, automated workflows, and integration testing.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Voice Workflow Testing</div>
                    <div className="text-sm text-muted-foreground">
                      Test complete user journeys using voice commands
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Integration Testing</div>
                    <div className="text-sm text-muted-foreground">
                      Verify voice features work with all system components
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Performance Testing</div>
                    <div className="text-sm text-muted-foreground">Measure voice processing speed and accuracy</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Accessibility Testing</div>
                    <div className="text-sm text-muted-foreground">
                      Ensure voice features are accessible to all users
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{testResults.length}</p>
                  </div>
                  <TestTube className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Passed Tests</p>
                    <p className="text-2xl font-bold text-green-600">
                      {testResults.filter((t) => t.status === "passed").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {testResults.length > 0
                        ? Math.round(
                            (testResults.filter((t) => t.status === "passed").length / testResults.length) * 100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.testName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.status === "passed" ? "default" : "destructive"}>{result.status}</Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {result.duration}ms | {Math.round(result.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium mb-1">Voice Input:</div>
                        <div className="text-muted-foreground">"{result.voiceInput}"</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Expected Output:</div>
                        <div className="text-muted-foreground">"{result.expectedOutput}"</div>
                      </div>
                    </div>

                    {result.actualOutput && (
                      <div className="mt-3 text-sm">
                        <div className="font-medium mb-1">Actual Output:</div>
                        <div className="text-muted-foreground">"{result.actualOutput}"</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
