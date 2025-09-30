import { analyzeUserInputEnhanced, enhancePromptWithAdvancedNLP, type IntentType } from "@/lib/nlp-utils"
import { processVoiceWithContext } from "@/lib/voice-processor"
import { generateSmartResponse } from "@/lib/response-generator"

const codeTemplates = {
  landing_page: {
    frontendCode: `export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to Your App
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build amazing experiences with our powerful platform
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}`,
    backendFiles: [],
  },
  dashboard: {
    frontendCode: `export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-600">View your performance metrics</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <p className="text-gray-600">Manage user accounts</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600">Configure your application</p>
          </div>
        </div>
      </div>
    </div>
  )
}`,
    backendFiles: [],
  },
  form: {
    frontendCode: `'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Thank you for your message!')
  }
  
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  )
}`,
    backendFiles: [],
  },
  button: {
    frontendCode: `'use client'
import { useState } from 'react'

export default function ModernButton() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleClick = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </div>
        ) : (
          'Click Me!'
        )}
      </button>
    </div>
  )
}`,
    backendFiles: [],
  },
  card: {
    frontendCode: `export default function ProductCard() {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Title</h2>
        <p className="text-gray-600 mb-4">
          This is a beautiful product card with modern design and smooth animations.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">$99</span>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}`,
    backendFiles: [],
  },
  navbar: {
    frontendCode: `'use client'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-xl font-bold text-gray-800">Brand</div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Services</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600 hover:text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {isOpen && (
          <div className="md:hidden pb-4">
            <a href="#" className="block py-2 text-gray-600 hover:text-blue-600">Home</a>
            <a href="#" className="block py-2 text-gray-600 hover:text-blue-600">About</a>
            <a href="#" className="block py-2 text-gray-600 hover:text-blue-600">Services</a>
            <a href="#" className="block py-2 text-gray-600 hover:text-blue-600">Contact</a>
          </div>
        )}
      </div>
    </nav>
  )
}`,
    backendFiles: [],
  },
  hero: {
    frontendCode: `export default function HeroSection() {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 min-h-screen flex items-center">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Build Something
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
            Amazing
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          Transform your ideas into reality with our cutting-edge platform designed for modern developers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            Get Started
          </button>
          <button className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`,
    backendFiles: [],
  },
}

function getTemplateFromIntent(intent: IntentType, prompt: string): any {
  const lowerPrompt = prompt.toLowerCase()

  // More specific matching patterns
  if (lowerPrompt.includes("button") || lowerPrompt.includes("btn")) {
    return codeTemplates.button
  }

  if (lowerPrompt.includes("card") || lowerPrompt.includes("product") || lowerPrompt.includes("item")) {
    return codeTemplates.card
  }

  if (
    lowerPrompt.includes("navbar") ||
    lowerPrompt.includes("navigation") ||
    lowerPrompt.includes("menu") ||
    lowerPrompt.includes("header")
  ) {
    return codeTemplates.navbar
  }

  if (lowerPrompt.includes("hero") || lowerPrompt.includes("banner") || lowerPrompt.includes("jumbotron")) {
    return codeTemplates.hero
  }

  if (lowerPrompt.includes("landing") || lowerPrompt.includes("homepage") || lowerPrompt.includes("home page")) {
    return codeTemplates.landing_page
  }

  if (lowerPrompt.includes("dashboard") || lowerPrompt.includes("admin") || lowerPrompt.includes("panel")) {
    return codeTemplates.dashboard
  }

  if (
    lowerPrompt.includes("form") ||
    lowerPrompt.includes("contact") ||
    lowerPrompt.includes("input") ||
    lowerPrompt.includes("signup") ||
    lowerPrompt.includes("login")
  ) {
    return codeTemplates.form
  }

  // Default to button for simple requests
  return codeTemplates.button
}

export async function POST(req: Request) {
  try {
    const { prompt, voiceGenerated, framework, designSystem } = await req.json()

    console.log("[v0] Processing request with enhanced local processing...")

    // Enhanced NLP analysis with text preprocessing (FREE)
    const nlpAnalysis = await analyzeUserInputEnhanced(prompt)
    console.log("[v0] Enhanced NLP Analysis:", {
      intent: nlpAnalysis.intent,
      confidence: nlpAnalysis.confidence,
      complexity: nlpAnalysis.complexity,
      readabilityScore: nlpAnalysis.readabilityScore,
      keyPhrases: nlpAnalysis.keyPhrases.slice(0, 3),
    })

    // Voice processing for additional context (FREE)
    const voiceResult = await processVoiceWithContext(prompt)
    console.log("[v0] Voice processing completed in", voiceResult.processingTime, "ms")

    // Enhanced prompt generation (FREE)
    const enhancedPrompt = enhancePromptWithAdvancedNLP(prompt, nlpAnalysis)
    console.log("[v0] Enhanced prompt generated with advanced NLP insights")

    const template = getTemplateFromIntent(nlpAnalysis.intent, prompt)

    // Apply design system if provided
    let frontendCode = template.frontendCode
    if (designSystem) {
      // Simple color replacement for demonstration
      frontendCode = frontendCode
        .replace(/blue-600/g, designSystem.colors?.primary?.replace("#", "") || "blue-600")
        .replace(/blue-500/g, designSystem.colors?.primary?.replace("#", "") || "blue-500")
    }

    const generatedCode = {
      frontendCode,
      backendFiles: template.backendFiles,
      spokenMessage: voiceGenerated
        ? `I've generated a ${nlpAnalysis.intent.replace("_", " ")} component for you using voice commands and free local processing.`
        : `I've generated a ${nlpAnalysis.intent.replace("_", " ")} component for you using free local processing.`,
      nlpInsights: `Based on your request, I detected a ${nlpAnalysis.intent.replace("_", " ")} intent with ${Math.round(nlpAnalysis.confidence * 100)}% confidence and generated appropriate code using enhanced local templates.`,
    }

    // Generate smart response with personalization (FREE)
    const smartResponse = await generateSmartResponse(
      nlpAnalysis,
      voiceResult,
      generatedCode,
      "default", // Could be user session ID in real app
    )

    console.log("[v0] Smart response generated:", {
      responseType: smartResponse.responseType,
      confidence: smartResponse.confidence,
      personalizationLevel: smartResponse.metadata.personalizedLevel,
    })

    return new Response(
      JSON.stringify({
        frontendCode: generatedCode.frontendCode,
        backendFiles: generatedCode.backendFiles || [],
        spokenMessage: smartResponse.spokenMessage,
        displayMessage: smartResponse.displayMessage,
        actionSuggestions: smartResponse.actionSuggestions,
        followUpQuestions: smartResponse.followUpQuestions,
        nlpAnalysis: {
          intent: nlpAnalysis.intent,
          confidence: nlpAnalysis.confidence,
          sentiment: nlpAnalysis.sentiment.label,
          keywords: nlpAnalysis.keywords,
          complexity: nlpAnalysis.complexity,
          readabilityScore: nlpAnalysis.readabilityScore,
          keyPhrases: nlpAnalysis.keyPhrases.slice(0, 3),
        },
        voiceAnalysis: {
          commands: voiceResult.commands.length,
          processingTime: voiceResult.processingTime,
          suggestions: voiceResult.suggestions,
        },
        smartResponse: {
          responseType: smartResponse.responseType,
          confidence: smartResponse.confidence,
          metadata: smartResponse.metadata,
        },
        nlpInsights:
          generatedCode.nlpInsights ||
          "Advanced NLP analysis applied for optimal code generation using enhanced local processing.",
        metadata: {
          templateUsed: Object.keys(codeTemplates).find((key) => codeTemplates[key] === template),
          processingTime: Date.now(),
          voiceGenerated: !!voiceGenerated,
          framework: framework || "react",
          designSystemApplied: !!designSystem,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("[v0] Error in generate-frontend API:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to generate full-stack code.",
        spokenMessage:
          "I encountered an error while processing your request. Please try rephrasing or simplifying your request.",
        displayMessage: "❌ Generation failed",
        actionSuggestions: ["Try a simpler request", "Check your internet connection", "Rephrase your request"],
        followUpQuestions: ["Would you like to try a different approach?"],
        responseType: "error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
}
