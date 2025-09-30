"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Volume2, ChevronRight, CheckCircle, Circle, Play, Pause } from "lucide-react"
import { advancedVoiceEngine } from "@/lib/advanced-voice-engine"

interface OnboardingStep {
  id: string
  title: string
  description: string
  voicePrompt: string
  expectedCommands: string[]
  completed: boolean
  optional?: boolean
}

export function VoiceOnboardingGuide() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [userResponse, setUserResponse] = useState("")
  const [feedback, setFeedback] = useState("")

  const [onboardingSteps] = useState<OnboardingStep[]>([
    {
      id: "welcome",
      title: "Welcome to Voice Control",
      description: "Learn how to use voice commands to navigate and create apps",
      voicePrompt: 'Welcome to Cognomega! I\'m your AI assistant. Say "hello" or "hi" to get started.',
      expectedCommands: ["hello", "hi", "hey", "start"],
      completed: false,
    },
    {
      id: "basic-navigation",
      title: "Basic Navigation",
      description: "Learn to navigate using voice commands",
      voicePrompt: 'Great! Now try saying "show me features" to see what I can do.',
      expectedCommands: ["show me features", "features", "what can you do"],
      completed: false,
    },
    {
      id: "app-creation",
      title: "Creating Apps",
      description: "Learn how to describe and create applications",
      voicePrompt:
        'Perfect! Now let\'s try creating something. Say "create a landing page" or describe any app you want to build.',
      expectedCommands: ["create", "build", "make", "generate"],
      completed: false,
    },
    {
      id: "voice-settings",
      title: "Voice Preferences",
      description: "Customize your voice assistant experience",
      voicePrompt: 'Excellent! You can customize my voice and behavior. Say "voice settings" to see your options.',
      expectedCommands: ["voice settings", "settings", "preferences", "customize"],
      completed: false,
      optional: true,
    },
    {
      id: "advanced-features",
      title: "Advanced Features",
      description: "Discover multi-modal interface and advanced AI capabilities",
      voicePrompt:
        'Finally, try saying "show advanced interface" to see my full capabilities including visual and gesture input.',
      expectedCommands: ["advanced interface", "multi-modal", "advanced features"],
      completed: false,
      optional: true,
    },
  ])

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(true)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
      setIsListening(true)
      setUserResponse("")
      setFeedback("")

      const result = await advancedVoiceEngine.startListening({
        continuous: false,
        interimResults: true,
      })

      setUserResponse(result.transcript)
      await handleUserResponse(result.transcript)
    } catch (error) {
      setFeedback("Voice recognition error. Please try again.")
      console.error("Voice recognition error:", error)
    } finally {
      setIsListening(false)
    }
  }, [currentStep])

  const handleUserResponse = async (transcript: string) => {
    const currentStepData = onboardingSteps[currentStep]
    const normalizedTranscript = transcript.toLowerCase().trim()

    // Check if response matches expected commands
    const isValidResponse = currentStepData.expectedCommands.some((command) =>
      normalizedTranscript.includes(command.toLowerCase()),
    )

    if (isValidResponse) {
      // Mark step as completed
      onboardingSteps[currentStep].completed = true
      setFeedback("Perfect! Well done.")

      // Move to next step after delay
      setTimeout(() => {
        if (currentStep < onboardingSteps.length - 1) {
          setCurrentStep(currentStep + 1)
          setProgress(((currentStep + 1) / onboardingSteps.length) * 100)
        } else {
          // Onboarding complete
          setProgress(100)
          speak("Congratulations! You've completed the voice onboarding. You're now ready to use all voice features.")
        }
      }, 2000)
    } else {
      setFeedback(`Try saying one of these: ${currentStepData.expectedCommands.join(", ")}`)
    }
  }

  const skipStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setProgress(((currentStep + 1) / onboardingSteps.length) * 100)
    }
  }

  const startOnboarding = () => {
    setIsActive(true)
    setCurrentStep(0)
    setProgress(0)
    speak(onboardingSteps[0].voicePrompt)
  }

  const stopOnboarding = () => {
    setIsActive(false)
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsListening(false)
  }

  // Auto-speak current step prompt
  useEffect(() => {
    if (isActive && currentStep < onboardingSteps.length) {
      const timer = setTimeout(() => {
        speak(onboardingSteps[currentStep].voicePrompt)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isActive, speak])

  if (!isActive) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Learn how to use voice commands to navigate and create apps with AI assistance.
          </p>
          <Button onClick={startOnboarding} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Voice Tutorial
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentStepData = onboardingSteps[currentStep]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Onboarding
            <Badge variant="outline">
              Step {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={stopOnboarding}>
            <Pause className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Step */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {currentStepData.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            {currentStepData.optional && <Badge variant="secondary">Optional</Badge>}
          </div>

          <p className="text-muted-foreground">{currentStepData.description}</p>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">AI Assistant says:</span>
            </div>
            <p className="text-sm italic">"{currentStepData.voicePrompt}"</p>
          </div>
        </div>

        {/* Voice Input Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={startListening}
              disabled={isListening || isSpeaking}
              className={`flex-1 ${isListening ? "animate-pulse" : ""}`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Click to Speak
                </>
              )}
            </Button>

            {currentStepData.optional && (
              <Button variant="outline" onClick={skipStep}>
                Skip Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Expected Commands */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              {currentStepData.expectedCommands.map((command, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  "{command}"
                </Badge>
              ))}
            </div>
          </div>

          {/* User Response */}
          {userResponse && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">You said:</span> "{userResponse}"
              </p>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-lg ${
                feedback.includes("Perfect") || feedback.includes("Well done")
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}
            >
              <p className="text-sm">{feedback}</p>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Progress Overview:</p>
          <div className="grid grid-cols-1 gap-2">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  index === currentStep
                    ? "bg-primary/10 border border-primary/20"
                    : step.completed
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-muted/30"
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : index === currentStep ? (
                  <Circle className="w-4 h-4 text-primary fill-primary/20" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={step.completed ? "line-through" : ""}>{step.title}</span>
                {step.optional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
