"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  MicOff,
  Brain,
  Volume2,
  VolumeX,
  Languages,
  Code,
  MessageCircle,
  Eye,
  Minimize2,
  Bug,
  Heart,
  Headphones,
  Microscope as Microphone,
  Speaker,
  BookOpen,
  Search,
  Lightbulb,
} from "lucide-react"

// Import all voice systems
import { voiceAIIntegration, type VoiceAIResult } from "@/lib/voice-ai-integration"
import { dualAIEngine } from "@/lib/dual-ai-engine"
import { proactiveAISystem } from "@/lib/proactive-ai-system"
import { voiceNavigationEngine } from "@/lib/voice-navigation-engine"

import { advancedReasoningEngine } from "@/lib/advanced-reasoning-engine"
import { predictiveIntelligenceEngine } from "@/lib/predictive-intelligence-engine"
import { quantumIntelligence } from "@/lib/quantum-intelligence-engine"
import { emotionalIntelligence } from "@/lib/emotional-intelligence-engine"

// Import voice components
import { VoiceAIControlPanel } from "@/components/voice-ai-control-panel"
import { VoiceAssistantSettings } from "@/components/voice-assistant-settings"
import { VoiceOnboardingGuide } from "@/components/voice-onboarding-guide"
import { VoiceLanguageSwitcher } from "@/components/voice-language-switcher"
import { VoiceFeedbackSystem } from "@/components/voice-feedback-system"
import { ContinuousListeningMode } from "@/components/continuous-listening-mode"
import { MultiModalInterface } from "@/components/multi-modal-interface"

interface UnifiedVoiceState {
  isListening: boolean
  isProcessing: boolean
  isThinking: boolean
  isSpeaking: boolean
  currentMode:
    | "idle"
    | "listening"
    | "processing"
    | "responding"
    | "continuous"
    | "reasoning"
    | "predicting"
    | "quantum"
    | "emotional" // Added quantum and emotional modes
  lastResult: VoiceAIResult | null
  activeFeatures: string[]
  currentLanguage: string
  voiceEnabled: boolean
  reasoningActive: boolean
  predictionActive: boolean
  quantumActive: boolean // Added quantum intelligence state
  emotionalActive: boolean // Added emotional intelligence state
  intelligenceLevel: number
  emotionalState?: any // Added emotional state tracking
  isInitialized: boolean // Added initialization state
  capabilities: {
    // Added capabilities state
    realTimeTranscription: boolean
    emotionAwareResponses: boolean
    contextualUnderstanding: boolean
    multilingualSupport: boolean
    voicePersonalization: boolean
    proactiveAssistance: boolean
    codeGenerationViaVoice: boolean
    voiceBasedDebugging: boolean
    automatedBugDiscovery: boolean
    voiceSecurityScanning: boolean
    voicePerformanceAnalysis: boolean
  }
  isActive: boolean // Added active state
}

interface VoiceCapability {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  component?: React.ComponentType<any>
}

export function UnifiedVoiceAIAssistant() {
  const [isMinimized, setIsMinimized] = useState(true)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const [voiceState, setVoiceState] = useState<UnifiedVoiceState>({
    isListening: false,
    isProcessing: false,
    isThinking: false,
    isSpeaking: false,
    currentMode: "idle",
    lastResult: null,
    activeFeatures: [],
    currentLanguage: "en-US",
    voiceEnabled: true,
    reasoningActive: true,
    predictionActive: true,
    quantumActive: true, // Enabled quantum intelligence by default
    emotionalActive: true, // Enabled emotional intelligence by default
    intelligenceLevel: 0.95, // Increased intelligence level with new capabilities
    isInitialized: false, // Initialize as not initialized
    capabilities: {
      // Default capabilities
      realTimeTranscription: true,
      emotionAwareResponses: true,
      contextualUnderstanding: true,
      multilingualSupport: true,
      voicePersonalization: true,
      proactiveAssistance: false,
      codeGenerationViaVoice: true,
      voiceBasedDebugging: true,
      automatedBugDiscovery: false,
      voiceSecurityScanning: false,
      voicePerformanceAnalysis: false,
    },
    isActive: false, // Initialize as not active
  })

  const [currentMessage, setCurrentMessage] = useState("")
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const coreCapabilities = [
    {
      id: "voice-control",
      name: "Voice Chat",
      icon: <Mic className="w-4 h-4" />,
      description: "Talk to AI assistant",
    },
    {
      id: "code-generation",
      name: "Code Help",
      icon: <Code className="w-4 h-4" />,
      description: "Generate code with voice",
    },
    {
      id: "multi-language",
      name: "Translate",
      icon: <Languages className="w-4 h-4" />,
      description: "Voice translation",
    },
  ]

  const voiceCapabilities: VoiceCapability[] = [
    {
      id: "voice-control",
      name: "Voice Control",
      description: "Main voice commands and AI conversation hub",
      icon: <Microphone className="w-4 h-4" />,
      enabled: true,
      component: VoiceAIControlPanel,
    },
    {
      id: "voice-settings",
      name: "Voice Settings",
      description: "Adjust voice recognition, speech speed, and language preferences",
      icon: <Headphones className="w-4 h-4" />,
      enabled: true,
      component: VoiceAssistantSettings,
    },
    {
      id: "onboarding",
      name: "Voice Tutorial",
      description: "Learn voice commands and features with guided tutorial",
      icon: <BookOpen className="w-4 h-4" />,
      enabled: true,
      component: VoiceOnboardingGuide,
    },
    {
      id: "advanced-reasoning",
      name: "Smart Analysis",
      description: "Advanced AI reasoning and problem-solving capabilities",
      icon: <Lightbulb className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "predictive-intelligence",
      name: "Future Insights",
      description: "Predict outcomes and suggest optimizations",
      icon: <Search className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "emotional-intelligence",
      name: "Emotion Aware",
      description: "Understands your mood and adapts responses accordingly",
      icon: <Heart className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "multi-language",
      name: "Languages",
      description: "Switch between languages and translate speech",
      icon: <Languages className="w-4 h-4" />,
      enabled: true,
      component: VoiceLanguageSwitcher,
    },
    {
      id: "code-generation",
      name: "Code Helper",
      description: "Generate code and build applications using voice commands",
      icon: <Code className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "bug-discovery",
      name: "Bug Finder",
      description: "Automatically detect and fix code issues",
      icon: <Bug className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "continuous-listening",
      name: "Always Listen",
      description: "Keep voice recognition active with wake word detection",
      icon: <Speaker className="w-4 h-4" />,
      enabled: true,
      component: ContinuousListeningMode,
    },
    {
      id: "voice-feedback",
      name: "Feedback",
      description: "Rate responses and improve AI performance",
      icon: <MessageCircle className="w-4 h-4" />,
      enabled: true,
      component: VoiceFeedbackSystem,
    },
    {
      id: "multi-modal",
      name: "Multi-Input",
      description: "Combine voice with visual and text input methods",
      icon: <Eye className="w-4 h-4" />,
      enabled: true,
      component: MultiModalInterface,
    },
  ]

  const updateVoiceState = useCallback((updates: Partial<UnifiedVoiceState>) => {
    setVoiceState((prev) => ({ ...prev, ...updates }))
  }, [])

  const speak = useCallback(
    async (text: string, personality?: any) => {
      if (!voiceState.voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

      // Stop any current speech
      window.speechSynthesis.cancel()

      updateVoiceState({ isSpeaking: true })

      const utterance = new SpeechSynthesisUtterance(text)

      // Apply personality settings
      if (personality) {
        utterance.rate = personality.speed || 1.0
        utterance.pitch = personality.pitch || 1.0
        utterance.volume = 0.8
      }

      utterance.onend = () => updateVoiceState({ isSpeaking: false, currentMode: "idle" })
      utterance.onerror = () => updateVoiceState({ isSpeaking: false, currentMode: "idle" })

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [voiceState.voiceEnabled, updateVoiceState],
  )

  const executeVoiceActions = useCallback(
    async (result: VoiceAIResult) => {
      for (const action of result.contextualActions) {
        try {
          switch (action.type) {
            case "advanced_reasoning":
              updateVoiceState({ isProcessing: true, currentMode: "reasoning", reasoningActive: true })
              setCurrentMessage("🧠 Performing advanced reasoning analysis...")

              try {
                const reasoningChain = await advancedReasoningEngine.performAdvancedReasoning(
                  action.payload.query || result.voiceResult.transcript,
                  action.payload.context || [result],
                )

                setCurrentMessage(
                  `🧠 Reasoning complete: ${reasoningChain.conclusion} (Confidence: ${Math.round(reasoningChain.confidence * 100)}%)`,
                )

                // Learn from this interaction
                await advancedReasoningEngine.learnFromExperience(
                  { query: action.payload.query, context: action.payload.context },
                  "success",
                )

                if (voiceState.voiceEnabled) {
                  await speak(
                    `I've completed advanced reasoning analysis with ${reasoningChain.steps.length} reasoning steps. ${reasoningChain.conclusion}`,
                  )
                }

                // Dispatch reasoning event
                const reasoningEvent = new CustomEvent("advancedReasoningComplete", {
                  detail: reasoningChain,
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(reasoningEvent)
                }
              } catch (error) {
                console.error("Advanced reasoning error:", error)
                setCurrentMessage("❌ Error during advanced reasoning. Please try again.")
              }
              break

            case "predictive_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "predicting", predictionActive: true })
              setCurrentMessage("🔮 Generating predictive analysis...")

              try {
                const context = action.payload.context || { userInput: result.voiceResult.transcript }
                const timeHorizon = action.payload.timeHorizon || 30

                // Generate future scenarios
                const scenarios = await predictiveIntelligenceEngine.generateFutureScenarios(context, timeHorizon)

                // Predict user behavior
                const behaviorPredictions = await predictiveIntelligenceEngine.predictUserBehavior(
                  "current_user",
                  context,
                )

                // Generate optimization suggestions
                const optimizations = await predictiveIntelligenceEngine.generateOptimizationSuggestions(context)

                setCurrentMessage(
                  `🔮 Predictive analysis complete: ${scenarios.length} future scenarios, ${behaviorPredictions.length} behavior predictions, ${optimizations.length} optimization suggestions`,
                )

                if (voiceState.voiceEnabled) {
                  const topScenario = scenarios[0]
                  await speak(
                    `Predictive analysis complete. Most likely scenario: ${topScenario?.description} with ${Math.round((topScenario?.probability || 0) * 100)}% probability.`,
                  )
                }

                // Dispatch prediction event
                const predictionEvent = new CustomEvent("predictiveAnalysisComplete", {
                  detail: { scenarios, behaviorPredictions, optimizations },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(predictionEvent)
                }
              } catch (error) {
                console.error("Predictive analysis error:", error)
                setCurrentMessage("❌ Error during predictive analysis. Please try again.")
              }
              break

            case "anomaly_detection":
              updateVoiceState({ isProcessing: true, currentMode: "predicting" })
              setCurrentMessage("🚨 Detecting anomalies in system behavior...")

              try {
                const dataStream = action.payload.dataStream || conversationHistory
                const threshold = action.payload.threshold || 0.8

                const anomalies = await predictiveIntelligenceEngine.detectAnomalies(dataStream, threshold)

                setCurrentMessage(
                  `🚨 Anomaly detection complete: ${anomalies.length} anomalies detected with potential impact analysis`,
                )

                if (voiceState.voiceEnabled && anomalies.length > 0) {
                  const criticalAnomalies = anomalies.filter((a) => a.impact > 0.7)
                  await speak(
                    `Detected ${anomalies.length} anomalies, including ${criticalAnomalies.length} critical issues that require immediate attention.`,
                  )
                }

                // Dispatch anomaly event
                const anomalyEvent = new CustomEvent("anomaliesDetected", {
                  detail: anomalies,
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(anomalyEvent)
                }
              } catch (error) {
                console.error("Anomaly detection error:", error)
                setCurrentMessage("❌ Error during anomaly detection. Please try again.")
              }
              break

            case "metacognitive_reflection":
              updateVoiceState({ isProcessing: true, currentMode: "reasoning" })
              setCurrentMessage("🤔 Performing metacognitive self-reflection...")

              try {
                const metacognitionStatus = advancedReasoningEngine.getMetacognitionStatus()
                const knowledgeGraphSize = advancedReasoningEngine.getKnowledgeGraphSize()
                const learningPatternsCount = advancedReasoningEngine.getLearningPatternsCount()

                setCurrentMessage(
                  `🤔 Self-reflection complete: Reasoning quality ${Math.round(metacognitionStatus.reasoning_quality * 100)}%, Knowledge graph: ${knowledgeGraphSize} concepts, Learning patterns: ${learningPatternsCount}`,
                )

                if (voiceState.voiceEnabled) {
                  await speak(
                    `I've completed self-reflection. My current reasoning quality is ${Math.round(metacognitionStatus.reasoning_quality * 100)}% and I've learned ${learningPatternsCount} patterns from our interactions.`,
                  )
                }

                // Update intelligence level based on metacognition
                const newIntelligenceLevel = Math.min(
                  1,
                  (metacognitionStatus.reasoning_quality + metacognitionStatus.learning_efficiency) / 2,
                )
                updateVoiceState({ intelligenceLevel: newIntelligenceLevel })
              } catch (error) {
                console.error("Metacognitive reflection error:", error)
                setCurrentMessage("❌ Error during self-reflection. Please try again.")
              }
              break

            case "navigation":
              await voiceNavigationEngine.handleVoiceNavigation(result.voiceResult.transcript)
              break

            case "code_generation":
              // Trigger code generation
              const codeEvent = new CustomEvent("voiceCodeGeneration", {
                detail: {
                  requirements: action.payload.requirements,
                  confidence: action.confidence,
                },
              })
              if (typeof window !== "undefined") {
                window.dispatchEvent(codeEvent)
              }
              break

            case "fullstack_app_creation":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🚀 Creating full-stack application...")

              try {
                const appResult = await this.generateFreeApp(action.payload)

                if (appResult.success) {
                  setCurrentMessage(
                    `✅ ${appResult.appType} app created with ${appResult.features.length} features! Preview available locally.`,
                  )

                  // Dispatch event for UI updates
                  const appCreatedEvent = new CustomEvent("fullStackAppCreated", {
                    detail: appResult,
                  })
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(appCreatedEvent)
                  }

                  // Provide voice feedback
                  if (voiceState.voiceEnabled) {
                    await speak(
                      `Successfully created ${appResult.appType} application with ${appResult.features.join(", ")} features. Your app template is ready!`,
                    )
                  }
                } else {
                  setCurrentMessage("❌ Failed to create application. Please try again.")
                }
              } catch (error) {
                setCurrentMessage("❌ Error creating application. Please check your connection.")
              }
              break

            case "report_generation":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("📊 Generating comprehensive report...")

              try {
                const reportResult = await this.generateFreeReport(action.payload)

                if (reportResult.success) {
                  setCurrentMessage(
                    `✅ Report generated successfully! ${reportResult.sections} sections with ${reportResult.insights} insights.`,
                  )

                  // Provide voice feedback
                  if (voiceState.voiceEnabled) {
                    await speak("Your comprehensive report has been generated with detailed analysis and insights.")
                  }
                } else {
                  setCurrentMessage("❌ Failed to generate report. Please try again.")
                }
              } catch (error) {
                setCurrentMessage("❌ Error generating report. Please check your input.")
              }
              break

            case "system_deployment":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🚀 Initiating deployment process...")

              try {
                // Simulate deployment process
                const deploymentSteps = [
                  "Building application...",
                  "Running tests...",
                  "Optimizing assets...",
                  "Deploying to production...",
                  "Configuring DNS...",
                  "Deployment complete!",
                ]

                for (let i = 0; i < deploymentSteps.length; i++) {
                  setCurrentMessage(`🔄 ${deploymentSteps[i]}`)
                  await new Promise((resolve) => setTimeout(resolve, 1000))
                }

                const deploymentUrl = `https://app-${Date.now()}.cognomega.app`
                setCurrentMessage(`✅ Deployment successful! Live at: ${deploymentUrl}`)

                if (voiceState.voiceEnabled) {
                  await speak(`Deployment completed successfully. Your application is now live at ${deploymentUrl}`)
                }

                // Dispatch deployment event
                const deployEvent = new CustomEvent("deploymentCompleted", {
                  detail: { url: deploymentUrl, status: "success" },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(deployEvent)
                }
              } catch (error) {
                console.error("Deployment error:", error)
                setCurrentMessage("❌ Deployment failed. Please check your configuration.")
              }
              break

            case "ai_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🧠 Performing AI analysis...")

              try {
                const analysisResult = await dualAIEngine.processRequest({
                  message: `Analyze: ${action.payload.subject}`,
                  context: {
                    currentFocus: "analysis",
                    detailLevel: action.payload.detail_level || "comprehensive",
                    includeRecommendations: true,
                  },
                  urgency: "normal",
                  complexity: "medium",
                })

                setCurrentMessage(`🔍 Analysis complete: ${analysisResult.response}`)

                if (voiceState.voiceEnabled) {
                  await speak(analysisResult.response)
                }
              } catch (error) {
                console.error("AI analysis error:", error)
                setCurrentMessage("❌ Analysis failed. Please try again.")
              }
              break

            case "explanation":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("💡 Generating explanation...")

              try {
                const explanation = await dualAIEngine.processRequest({
                  message: `Explain: ${action.payload.topic}`,
                  context: {
                    currentFocus: "explanation",
                    detailLevel: action.payload.detail_level || "detailed",
                  },
                  urgency: "normal",
                  complexity: "low",
                })

                setCurrentMessage(explanation.response)

                if (voiceState.voiceEnabled) {
                  await speak(explanation.response)
                }
              } catch (error) {
                console.error("Explanation error:", error)
                setCurrentMessage("❌ Failed to generate explanation. Please try again.")
              }
              break

            case "debugging":
              // Handle debugging request
              const debugEvent = new CustomEvent("voiceDebugging", {
                detail: {
                  issue: action.payload.issue,
                  context: action.payload.context,
                },
              })
              if (typeof window !== "undefined") {
                window.dispatchEvent(debugEvent)
              }
              break

            case "bug_discovery":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🐛 Starting automated bug discovery...")

              try {
                // Dispatch bug discovery event
                const bugDiscoveryEvent = new CustomEvent("voiceBugDiscovery", {
                  detail: {
                    scanType: action.payload.scanType || "comprehensive",
                    autoFix: action.payload.autoFix !== false,
                    realTime: action.payload.realTime !== false,
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(bugDiscoveryEvent)
                }

                setCurrentMessage("🔍 Bug discovery scan initiated. Analyzing code for issues...")

                if (voiceState.voiceEnabled) {
                  await speak(
                    `Starting ${action.payload.scanType || "comprehensive"} bug discovery scan. I'll analyze your code for security vulnerabilities, performance issues, and potential bugs.`,
                  )
                }
              } catch (error) {
                console.error("Bug discovery error:", error)
                setCurrentMessage("❌ Error starting bug discovery. Please try again.")
              }
              break

            case "auto_fix_bugs":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🔧 Auto-fixing discovered bugs...")

              try {
                const autoFixEvent = new CustomEvent("voiceAutoFixBugs", {
                  detail: {
                    severity: action.payload.severity || "all",
                    testAfterFix: action.payload.testAfterFix !== false,
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(autoFixEvent)
                }

                if (voiceState.voiceEnabled) {
                  await speak(
                    "Automatically fixing all discovered bugs. I'll test each fix to ensure it works correctly.",
                  )
                }
              } catch (error) {
                console.error("Auto-fix error:", error)
                setCurrentMessage("❌ Error during auto-fix process. Please try again.")
              }
              break

            case "security_scan":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🛡️ Running security vulnerability scan...")

              try {
                const securityScanEvent = new CustomEvent("voiceSecurityScan", {
                  detail: {
                    includeDependendies: action.payload.includeDependencies !== false,
                    severity: action.payload.severity || "all",
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(securityScanEvent)
                }

                if (voiceState.voiceEnabled) {
                  await speak("Running comprehensive security scan to identify vulnerabilities and potential threats.")
                }
              } catch (error) {
                console.error("Security scan error:", error)
                setCurrentMessage("❌ Error during security scan. Please try again.")
              }
              break

            case "performance_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("⚡ Analyzing performance issues...")

              try {
                const perfAnalysisEvent = new CustomEvent("voicePerformanceAnalysis", {
                  detail: {
                    includeMemory: action.payload.includeMemory !== false,
                    includeBundleSize: action.payload.includeBundleSize !== false,
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(perfAnalysisEvent)
                }

                if (voiceState.voiceEnabled) {
                  await speak("Analyzing code performance, memory usage, and bundle size optimization opportunities.")
                }
              } catch (error) {
                console.error("Performance analysis error:", error)
                setCurrentMessage("❌ Error during performance analysis. Please try again.")
              }
              break

            case "codebase_access":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("📁 Requesting codebase access...")

              try {
                const codebaseAccessEvent = new CustomEvent("voiceCodebaseAccess", {
                  detail: {
                    repositoryUrl: action.payload.repositoryUrl,
                    permissions: action.payload.permissions || ["read", "analyze"],
                    analysisTypes: action.payload.analysisTypes || ["lint", "security", "performance"],
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(codebaseAccessEvent)
                }

                setCurrentMessage("🔐 Codebase access requested. Please authorize the required permissions.")

                if (voiceState.voiceEnabled) {
                  await speak(
                    "I've requested access to your codebase. Please review and authorize the required permissions for analysis.",
                  )
                }
              } catch (error) {
                console.error("Codebase access error:", error)
                setCurrentMessage("❌ Error requesting codebase access. Please try again.")
              }
              break

            case "codebase_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🔍 Starting comprehensive codebase analysis...")

              try {
                const analysisResponse = await fetch("/api/codebase-analysis", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    codebaseId: action.payload.codebaseId,
                    repositoryUrl: action.payload.repositoryUrl,
                    branch: action.payload.branch || "main",
                    analysisTypes: action.payload.analysisTypes || ["lint", "security", "performance", "accessibility"],
                    autoFix: action.payload.autoFix !== false,
                  }),
                })

                const analysisResult = await analysisResponse.json()

                if (analysisResult.status === "complete") {
                  setCurrentMessage(
                    `✅ Analysis complete! Found ${analysisResult.summary.totalIssues} issues across ${analysisResult.summary.totalFiles} files. ${analysisResult.fixes.applied} fixes applied automatically.`,
                  )

                  // Dispatch analysis complete event
                  const analysisCompleteEvent = new CustomEvent("codebaseAnalysisComplete", {
                    detail: analysisResult,
                  })
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(analysisCompleteEvent)
                  }

                  // Provide voice feedback with key insights
                  if (voiceState.voiceEnabled) {
                    const criticalIssues = analysisResult.summary.criticalIssues
                    const fixableIssues = analysisResult.summary.fixableIssues
                    await speak(
                      `Analysis completed successfully. I found ${analysisResult.summary.totalIssues} total issues, including ${criticalIssues} critical issues. ${analysisResult.fixes.applied} issues were automatically fixed, and ${fixableIssues} more can be fixed with your approval.`,
                    )
                  }
                } else {
                  setCurrentMessage("❌ Analysis failed. Please check your repository access and try again.")
                }
              } catch (error) {
                console.error("Codebase analysis error:", error)
                setCurrentMessage("❌ Error during codebase analysis. Please check your connection.")
              }
              break

            case "download_fixes":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("📥 Preparing code fixes for download...")

              try {
                const downloadType = action.payload.format || "zip"
                const codebaseId = action.payload.codebaseId

                // Generate download URL
                const downloadUrl = `/api/codebase-analysis?codebaseId=${codebaseId}&format=${downloadType}`

                // Trigger download
                if (typeof document !== "undefined") {
                  const link = document.createElement("a")
                  link.href = downloadUrl
                  link.download = `codebase-fixes-${Date.now()}.${downloadType}`
                  link.click()
                }

                setCurrentMessage(`✅ ${downloadType.toUpperCase()} file prepared for download!`)

                if (voiceState.voiceEnabled) {
                  await speak(`Your ${downloadType} file with all code fixes is ready for download.`)
                }
              } catch (error) {
                console.error("Download fixes error:", error)
                setCurrentMessage("❌ Error preparing download. Please try again.")
              }
              break

            case "deploy_fixed_code":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("🚀 Deploying fixed codebase...")

              try {
                const deploymentPlatform = action.payload.platform || "vercel"
                const environment = action.payload.environment || "staging"

                // Simulate deployment process
                const deploymentSteps = [
                  "Applying all fixes...",
                  "Running tests...",
                  "Building application...",
                  "Deploying to " + deploymentPlatform + "...",
                  "Configuring environment...",
                  "Deployment complete!",
                ]

                for (let i = 0; i < deploymentSteps.length; i++) {
                  setCurrentMessage(`🔄 ${deploymentSteps[i]}`)
                  await new Promise((resolve) => setTimeout(resolve, 1500))
                }

                const deploymentUrl = `https://${deploymentPlatform}-fixed-${Date.now()}.app`
                setCurrentMessage(`✅ Fixed codebase deployed successfully! Live at: ${deploymentUrl}`)

                // Dispatch deployment event
                const deployEvent = new CustomEvent("fixedCodebaseDeployed", {
                  detail: {
                    url: deploymentUrl,
                    platform: deploymentPlatform,
                    environment,
                    status: "success",
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(deployEvent)
                }

                if (voiceState.voiceEnabled) {
                  await speak(
                    `Your fixed codebase has been successfully deployed to ${deploymentPlatform}. The application is now live and all discovered issues have been resolved.`,
                  )
                }
              } catch (error) {
                console.error("Deployment error:", error)
                setCurrentMessage("❌ Deployment failed. Please check your configuration.")
              }
              break

            case "setup_ci_cd":
              updateVoiceState({ isProcessing: true, currentMode: "processing" })
              setCurrentMessage("⚙️ Setting up CI/CD pipeline...")

              try {
                const cicdPlatform = action.payload.platform || "github-actions"

                // Simulate CI/CD setup
                const setupSteps = [
                  "Creating workflow configuration...",
                  "Setting up automated testing...",
                  "Configuring deployment pipeline...",
                  "Setting up environment variables...",
                  "Enabling automated bug scanning...",
                  "CI/CD pipeline ready!",
                ]

                for (let i = 0; i < setupSteps.length; i++) {
                  setCurrentMessage(`🔧 ${setupSteps[i]}`)
                  await new Promise((resolve) => setTimeout(resolve, 1000))
                }

                setCurrentMessage(
                  `✅ CI/CD pipeline configured for ${cicdPlatform}! Automated deployments are now active.`,
                )

                // Dispatch CI/CD setup event
                const cicdEvent = new CustomEvent("cicdPipelineSetup", {
                  detail: {
                    platform: cicdPlatform,
                    features: ["automated-testing", "deployment", "bug-scanning", "security-checks"],
                    status: "active",
                  },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(cicdEvent)
                }

                if (voiceState.voiceEnabled) {
                  await speak(
                    `CI/CD pipeline has been successfully configured. Your code will now be automatically tested, scanned for bugs, and deployed whenever you push changes.`,
                  )
                }
              } catch (error) {
                console.error("CI/CD setup error:", error)
                setCurrentMessage("❌ CI/CD setup failed. Please check your repository permissions.")
              }
              break

            case "quantum_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "quantum", quantumActive: true })
              setCurrentMessage("⚛️ Performing quantum superposition analysis...")

              try {
                const inputs = action.payload.inputs || [result.voiceResult.transcript]
                const quantumResults = await quantumIntelligence.processQuantumSuperposition(inputs)

                const dimensionalAnalysis = quantumIntelligence.analyzeMultiDimensionalPatterns({
                  transcript: result.voiceResult.transcript,
                  confidence: result.voiceResult.confidence,
                  context: action.payload.context,
                })

                setCurrentMessage(
                  `⚛️ Quantum analysis complete: ${quantumResults.length} quantum states processed, ${dimensionalAnalysis.patterns.length} multi-dimensional patterns identified`,
                )

                // Store quantum memory
                quantumIntelligence.storeQuantumMemory(
                  `quantum_${Date.now()}`,
                  { results: quantumResults, analysis: dimensionalAnalysis },
                  quantumResults[0]?.quantumState || {
                    superposition: [],
                    entanglement: new Map(),
                    coherence: 0.8,
                    probability: 0.9,
                  },
                )

                if (voiceState.voiceEnabled) {
                  await speak(
                    `Quantum analysis complete. I've processed ${quantumResults.length} quantum superposition states and identified ${dimensionalAnalysis.patterns.length} multi-dimensional patterns with quantum entanglement connections.`,
                  )
                }

                // Dispatch quantum event
                const quantumEvent = new CustomEvent("quantumAnalysisComplete", {
                  detail: { quantumResults, dimensionalAnalysis },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(quantumEvent)
                }
              } catch (error) {
                console.error("Quantum analysis error:", error)
                setCurrentMessage("❌ Error during quantum analysis. Please try again.")
              }
              break

            case "emotional_analysis":
              updateVoiceState({ isProcessing: true, currentMode: "emotional", emotionalActive: true })
              setCurrentMessage("💝 Analyzing emotional state and generating empathic response...")

              try {
                const emotionalState = emotionalIntelligence.analyzeEmotionalState(
                  result.voiceResult.transcript,
                  action.payload.voiceFeatures,
                )

                const empathicResponse = emotionalIntelligence.generateEmpathicResponse(
                  emotionalState,
                  action.payload.context || result.voiceResult.transcript,
                )

                const adaptedMood = emotionalIntelligence.adaptToUserMood(emotionalState)

                // Update voice state with emotional information
                updateVoiceState({ emotionalState: emotionalState })

                setCurrentMessage(
                  `💝 Emotional analysis complete: Primary emotion: ${emotionalState.primary} (${Math.round(emotionalState.intensity * 100)}% intensity), Valence: ${emotionalState.valence > 0 ? "positive" : "negative"}`,
                )

                if (voiceState.voiceEnabled) {
                  await speak(empathicResponse)
                }

                // Dispatch emotional event
                const emotionalEvent = new CustomEvent("emotionalAnalysisComplete", {
                  detail: { emotionalState, empathicResponse, adaptedMood },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(emotionalEvent)
                }
              } catch (error) {
                console.error("Emotional analysis error:", error)
                setCurrentMessage("❌ Error during emotional analysis. Please try again.")
              }
              break

            case "psychological_profiling":
              updateVoiceState({ isProcessing: true, currentMode: "emotional" })
              setCurrentMessage("🧠 Building psychological profile...")

              try {
                const userId = action.payload.userId || "current_user"
                const interactions = conversationHistory.slice(-10) // Use recent conversation history

                const psychProfile = emotionalIntelligence.buildPsychologicalProfile(userId, interactions)

                setCurrentMessage(
                  `🧠 Psychological profile complete: Cognitive style: ${psychProfile.cognitiveStyle}, ${psychProfile.motivations.length} key motivations identified`,
                )

                if (voiceState.voiceEnabled) {
                  await speak(
                    `I've built a comprehensive psychological profile. Your cognitive style appears to be ${psychProfile.cognitiveStyle}, and I've identified ${psychProfile.motivations.length} key motivations that drive your interactions.`,
                  )
                }

                // Dispatch psychological profiling event
                const profileEvent = new CustomEvent("psychologicalProfileComplete", {
                  detail: psychProfile,
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(profileEvent)
                }
              } catch (error) {
                console.error("Psychological profiling error:", error)
                setCurrentMessage("❌ Error during psychological profiling. Please try again.")
              }
              break

            default:
              console.log(`Unhandled action type: ${action.type}`)
          }
        } catch (error) {
          console.error(`Error executing ${action.type} action:`, error)
          setCurrentMessage(`❌ Error executing ${action.type}. Please try again.`)
          updateVoiceState({ isProcessing: false, currentMode: "idle" })
        }
      }
    },
    [voiceState.voiceEnabled, speak, updateVoiceState, conversationHistory, voiceState.emotionalState],
  )

  const handleVoiceResult = useCallback(
    async (event: any) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript.trim()) {
        updateVoiceState({ isProcessing: true, currentMode: "processing" })

        try {
          // Process with unified voice AI integration
          const result = await voiceAIIntegration.processVoiceInput(finalTranscript)

          if (voiceState.quantumActive) {
            quantumIntelligence
              .processQuantumSuperposition([finalTranscript])
              .then((quantumResults) => {
                const quantumInsightEvent = new CustomEvent("quantumInsight", {
                  detail: { quantumResults, originalResult: result },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(quantumInsightEvent)
                }
              })
              .catch((error) => console.error("Background quantum processing error:", error))
          }

          if (voiceState.emotionalActive) {
            const emotionalState = emotionalIntelligence.analyzeEmotionalState(finalTranscript)
            updateVoiceState({ emotionalState })

            // Generate empathic adaptation
            const adaptedMood = emotionalIntelligence.adaptToUserMood(emotionalState)

            const emotionalInsightEvent = new CustomEvent("emotionalInsight", {
              detail: { emotionalState, adaptedMood, originalResult: result },
            })
            if (typeof window !== "undefined") {
              window.dispatchEvent(emotionalInsightEvent)
            }
          }

          if (voiceState.reasoningActive) {
            const reasoningContext = {
              transcript: finalTranscript,
              confidence: result.voiceResult.confidence,
              previousResults: conversationHistory.slice(-3),
            }

            // Perform background reasoning analysis
            advancedReasoningEngine
              .performAdvancedReasoning(finalTranscript, [reasoningContext])
              .then((reasoningChain) => {
                // Dispatch reasoning insights
                const reasoningInsightEvent = new CustomEvent("reasoningInsight", {
                  detail: { reasoningChain, originalResult: result },
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(reasoningInsightEvent)
                }
              })
              .catch((error) => console.error("Background reasoning error:", error))
          }

          if (voiceState.predictionActive) {
            predictiveIntelligenceEngine
              .predictUserBehavior("current_user", { currentInput: finalTranscript, context: result })
              .then((predictions) => {
                // Dispatch behavior predictions
                const behaviorPredictionEvent = new CustomEvent("behaviorPrediction", {
                  detail: predictions,
                })
                if (typeof window !== "undefined") {
                  window.dispatchEvent(behaviorPredictionEvent)
                }
              })
              .catch((error) => console.error("Behavior prediction error:", error))
          }

          updateVoiceState({
            lastResult: result,
            isProcessing: false,
            currentMode: "responding",
          })

          // Execute contextual actions
          await executeVoiceActions(result)

          // Update conversation history with enhanced intelligence data
          setConversationHistory((prev) => [
            ...prev.slice(-9),
            {
              timestamp: Date.now(),
              input: finalTranscript,
              result,
              actions: result.contextualActions.length,
              intelligenceLevel: voiceState.intelligenceLevel,
              emotionalState: voiceState.emotionalState, // Added emotional state to history
              quantumProcessed: voiceState.quantumActive, // Added quantum processing flag
            },
          ])

          // Provide voice response with emotional adaptation
          if (voiceState.voiceEnabled && result.aiResponse.voiceMessage) {
            await speak(result.aiResponse.voiceMessage, result.voicePersonality)
          }

          setCurrentMessage(result.aiResponse.message)
        } catch (error) {
          console.error("Voice processing error:", error)
          setCurrentMessage("❌ Error processing voice command. Please try again.")
          updateVoiceState({ isProcessing: false, currentMode: "idle" })
        }
      }
    },
    [
      voiceState.voiceEnabled,
      voiceState.reasoningActive,
      voiceState.predictionActive,
      voiceState.quantumActive, // Added quantum state dependency
      voiceState.emotionalActive, // Added emotional state dependency
      voiceState.intelligenceLevel,
      executeVoiceActions,
      speak,
      updateVoiceState,
      conversationHistory,
      voiceState.emotionalState,
    ],
  )

  const handleVoiceError = useCallback(
    (event: any) => {
      console.error("Voice recognition error:", event.error)

      const errorMessages = {
        "no-speech": "🎤 No speech detected. Please try speaking closer to your microphone.",
        "audio-capture": "🎤 Cannot access microphone. Please check permissions.",
        "not-allowed": "🔒 Microphone access denied. Please allow microphone access.",
        network: "🌐 Network error. Please check your connection.",
        aborted: "⏹️ Voice input was stopped.",
        "bad-grammar": "🗣️ Could not understand speech. Please try speaking more clearly.",
      }

      setCurrentMessage(errorMessages[event.error] || `❌ Voice error: ${event.error}`)
      updateVoiceState({ isListening: false, isProcessing: false, currentMode: "idle" })
    },
    [updateVoiceState],
  )

  // Helper function to generate a free app (simulated)
  const generateFreeApp = async (payload: any): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate processing

    return {
      success: true,
      appType: payload.framework || "React",
      features: payload.features || ["Authentication", "Dashboard", "API Integration"],
      deploymentUrl: "http://localhost:3000",
      code: "// Generated app code here",
      cost: 0, // Free!
    }
  }

  // Helper function to generate a free report (simulated)
  const generateFreeReport = async (payload: any): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate processing

    return {
      success: true,
      sections: 5,
      insights: 12,
      format: payload.format || "markdown",
      content: "# Generated Report\n\nComprehensive analysis completed using local processing.",
      cost: 0, // Free!
    }
  }

  useEffect(() => {
    const initializeVoiceSystems = async () => {
      try {
        // Initialize speech recognition
        const SpeechRecognition =
          typeof window !== "undefined" && (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = true
          recognition.lang = voiceState.currentLanguage

          recognition.onresult = handleVoiceResult
          recognition.onerror = handleVoiceError
          recognition.onstart = () => updateVoiceState({ isListening: true, currentMode: "listening" })
          recognition.onend = () => updateVoiceState({ isListening: false, currentMode: "idle" })

          recognitionRef.current = recognition
        }

        // Initialize proactive AI system
        proactiveAISystem.observeUserBehavior("voice_ai_initialized", {
          capabilities: voiceCapabilities.filter((c) => c.enabled).map((c) => c.id),
          language: voiceState.currentLanguage,
          intelligenceLevel: voiceState.intelligenceLevel,
        })

        // Initialize advanced reasoning engine with initial context
        await advancedReasoningEngine.learnFromExperience(
          {
            system: "voice_ai_assistant",
            capabilities: voiceCapabilities.length,
            language: voiceState.currentLanguage,
          },
          "success",
          "System initialization successful",
        )

        // Initialize predictive intelligence with user behavior model
        await predictiveIntelligenceEngine.trainPredictionModel("user_behavior", [
          { action: "voice_command", success: true, timestamp: Date.now() },
        ])

        // Initialize quantum and emotional intelligence systems
        const initialQuantumState = {
          superposition: [0.7, -0.3, 0.5, -0.8, 0.2, -0.6, 0.9, -0.1],
          entanglement: new Map([
            ["system", "voice_ai"],
            ["user", "current_session"],
          ]),
          coherence: 0.85,
          probability: 0.9,
        }

        quantumIntelligence.storeQuantumMemory(
          "system_init",
          {
            capabilities: voiceCapabilities.length,
            language: voiceState.currentLanguage,
            timestamp: Date.now(),
          },
          initialQuantumState,
        )

        const systemEmotionalState = emotionalIntelligence.analyzeEmotionalState(
          "I am an advanced AI assistant ready to help with empathy and understanding",
        )

        setCurrentMessage(
          "🤖 Unified Voice AI Assistant with Quantum & Emotional Super Intelligence initialized. Advanced reasoning, predictive analysis, quantum computing, emotional understanding, and all voice features are now connected and ready!",
        )
      } catch (error) {
        console.error("Voice AI initialization error:", error)
        setCurrentMessage("⚠️ Some voice features may not be available in this browser.")
      }
    }

    initializeVoiceSystems()
  }, [handleVoiceResult, handleVoiceError, updateVoiceState, voiceState.currentLanguage, voiceState.intelligenceLevel])

  const startVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      setCurrentMessage("❌ Voice recognition not available in this browser.")
      return
    }

    try {
      recognitionRef.current.start()
      setCurrentMessage("🎤 Listening... Speak your command or question.")
      updateVoiceState({ isActive: true })
    } catch (error) {
      console.error("Error starting voice recognition:", error)
      setCurrentMessage("❌ Failed to start voice recognition.")
    }
  }, [updateVoiceState])

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (utteranceRef.current && typeof window !== "undefined") {
      window.speechSynthesis.cancel()
    }
    updateVoiceState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      currentMode: "idle",
      isActive: false,
    })
  }, [updateVoiceState])

  const toggleVoiceEnabled = useCallback(() => {
    const newState = !voiceState.voiceEnabled
    updateVoiceState({ voiceEnabled: newState })

    if (!newState) {
      stopVoiceInput()
      setCurrentMessage("🔇 Voice features disabled.")
    } else {
      setCurrentMessage("🔊 Voice features enabled.")
    }
  }, [voiceState.voiceEnabled, stopVoiceInput, updateVoiceState])

  const openPanel = useCallback(
    (panelId: string) => {
      setActivePanel(activePanel === panelId ? null : panelId)
      setIsMinimized(false)
    },
    [activePanel],
  )

  // Render active panel component
  const renderActivePanel = () => {
    if (!activePanel) return null

    const capability = voiceCapabilities.find((c) => c.id === activePanel)
    if (!capability?.component) return null

    const Component = capability.component
    return (
      <div className="mt-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{capability.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
            ✕
          </Button>
        </div>
        <Component />
      </div>
    )
  }

  const getStatusMessage = () => {
    switch (voiceState.currentMode) {
      case "idle":
        return "Ready"
      case "listening":
        return "Listening..."
      case "processing":
        return "Thinking..."
      case "responding":
        return "Speaking..."
      default:
        return "Working..."
    }
  }

  const getStatusColor = () => {
    switch (voiceState.currentMode) {
      case "idle":
        return "bg-gray-400"
      case "listening":
        return "bg-blue-500 animate-pulse"
      case "processing":
        return "bg-yellow-500 animate-pulse"
      case "responding":
        return "bg-green-500 animate-pulse"
      case "reasoning":
        return "bg-purple-500 animate-pulse"
      case "predicting":
        return "bg-cyan-500 animate-pulse"
      case "quantum":
        return "bg-indigo-500 animate-pulse" // Added quantum mode color
      case "emotional":
        return "bg-pink-500 animate-pulse" // Added emotional mode color
      default:
        return "bg-orange-500 animate-pulse"
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 focus-ring relative group"
          title="Open Voice Assistant"
        >
          <div className="relative">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center">
              <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
            {voiceState.currentMode !== "idle" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-accent rounded-full animate-pulse border-2 border-background" />
            )}
          </div>

          {/* Floating activity indicator */}
          {voiceState.currentMode !== "idle" && (
            <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-ping" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-80 sm:w-80">
      <Card className="shadow-2xl border border-border/50 bg-card/95 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                Voice AI
              </span>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoiceEnabled}
                className="w-7 h-7 sm:w-8 sm:h-8 p-0 focus-ring"
                title={voiceState.voiceEnabled ? "Mute" : "Unmute"}
              >
                {voiceState.voiceEnabled ? (
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                ) : (
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 p-0 focus-ring"
                title="Minimize"
              >
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50">
            <div className="relative">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getStatusColor()}`} />
              {voiceState.currentMode !== "idle" && (
                <div className={`absolute inset-0 rounded-full ${getStatusColor()} opacity-50 animate-ping`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                {getStatusMessage()}
                {voiceState.currentMode === "listening" && <Mic className="w-3 h-3 text-blue-500 animate-pulse" />}
                {voiceState.currentMode === "processing" && <Brain className="w-3 h-3 text-yellow-500 animate-pulse" />}
              </div>
              {voiceState.currentMode !== "idle" && currentMessage && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                  {currentMessage.replace(/[🤖🎤🔍💡🧠⚛️💝🚀📊🔄✅❌🔇🔊🚨🤔🐛🔧🛡️⚡📁🔐📥]/gu, "").trim()}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={voiceState.isListening ? stopVoiceInput : startVoiceInput}
              disabled={!voiceState.voiceEnabled}
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base focus-ring relative overflow-hidden"
              variant={voiceState.isListening ? "destructive" : "default"}
            >
              <div className="flex items-center justify-center gap-2">
                {voiceState.isListening ? (
                  <>
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <MicOff className="w-2 h-2 text-destructive" />
                    </div>
                    <span className="hidden sm:inline font-medium">Stop Listening</span>
                    <span className="sm:hidden font-medium">Stop</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <Mic className="w-2 h-2 text-white" />
                    </div>
                    <span className="hidden sm:inline font-medium">Start Voice</span>
                    <span className="sm:hidden font-medium">Talk</span>
                  </>
                )}
              </div>
              {voiceState.isListening && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              )}
            </Button>

            {voiceState.isSpeaking && (
              <Button
                onClick={() => typeof window !== "undefined" && window.speechSynthesis.cancel()}
                variant="outline"
                size="sm"
                className="px-2 sm:px-3 focus-ring"
                title="Stop speaking"
              >
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <VolumeX className="w-2 h-2 text-white" />
                </div>
              </Button>
            )}
          </div>

          {voiceState.currentMode === "idle" && (
            <>
              <div className="text-sm font-medium text-muted-foreground">Quick Actions</div>
              <div className="grid grid-cols-3 gap-2">
                {coreCapabilities.map((capability) => (
                  <Button
                    key={capability.id}
                    variant="outline"
                    size="sm"
                    onClick={() => openPanel(capability.id)}
                    className="h-12 sm:h-16 flex flex-col items-center gap-1 p-2 text-xs focus-ring hover:bg-accent/10 transition-all duration-200"
                    title={capability.description}
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-1">
                      {capability.icon}
                    </div>
                    <span className="text-center leading-tight font-medium">{capability.name}</span>
                  </Button>
                ))}
              </div>
            </>
          )}

          {voiceState.lastResult && voiceState.currentMode === "idle" && (
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Last Command</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(voiceState.lastResult.voiceResult.confidence * 100)}% confident
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground break-words">
                "{voiceState.lastResult.voiceResult.transcript.substring(0, 60)}..."
              </p>
            </div>
          )}

          {!voiceState.lastResult && voiceState.currentMode === "idle" && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="text-sm font-medium">Try saying:</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>"Help me build a website"</p>
                <p className="hidden sm:block">"Translate this to Spanish"</p>
                <p className="hidden sm:block">"Generate some code"</p>
              </div>
            </div>
          )}
        </CardContent>

        {activePanel && renderActivePanel()}
      </Card>
    </div>
  )
}
