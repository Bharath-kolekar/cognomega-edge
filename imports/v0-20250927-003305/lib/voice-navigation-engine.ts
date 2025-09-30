export interface NavigationCommand {
  command: string
  route: string
  description: string
  aliases: string[]
  requiresConfirmation?: boolean
}

export interface VoiceNavigationResult {
  success: boolean
  route?: string
  message: string
  suggestions?: string[]
}

class VoiceNavigationEngine {
  private static instance: VoiceNavigationEngine
  private navigationCommands: NavigationCommand[] = []
  private currentRoute = "/"
  private navigationHistory: string[] = []

  private constructor() {
    this.initializeNavigationCommands()
    this.setupVoiceListeners()
  }

  static getInstance(): VoiceNavigationEngine {
    if (!VoiceNavigationEngine.instance) {
      VoiceNavigationEngine.instance = new VoiceNavigationEngine()
    }
    return VoiceNavigationEngine.instance
  }

  private initializeNavigationCommands() {
    this.navigationCommands = [
      {
        command: "go home",
        route: "/",
        description: "Navigate to the home page",
        aliases: ["home", "main page", "homepage", "start page"],
      },
      {
        command: "open features",
        route: "#features",
        description: "Scroll to features section",
        aliases: ["show features", "features section", "what can you do"],
      },
      {
        command: "start creating",
        route: "#create",
        description: "Go to app creation section",
        aliases: ["create app", "build app", "make something", "generate code"],
      },
      {
        command: "voice settings",
        route: "#voice-settings",
        description: "Open voice assistant settings",
        aliases: ["settings", "preferences", "configure voice", "voice options"],
      },
      {
        command: "help",
        route: "#help",
        description: "Show help and tutorials",
        aliases: ["tutorial", "guide", "how to use", "instructions"],
      },
      {
        command: "go back",
        route: "back",
        description: "Navigate to previous page",
        aliases: ["back", "previous", "return", "go previous"],
      },
      {
        command: "scroll up",
        route: "scroll-up",
        description: "Scroll to top of page",
        aliases: ["top", "scroll to top", "beginning"],
      },
      {
        command: "scroll down",
        route: "scroll-down",
        description: "Scroll down the page",
        aliases: ["down", "scroll down", "bottom"],
      },
    ]
  }

  private setupVoiceListeners() {
    if (typeof window !== "undefined") {
      window.addEventListener("voiceNavigationCommand", (event: any) => {
        this.handleVoiceNavigation(event.detail.transcript)
      })
    }
  }

  async handleVoiceNavigation(transcript: string): Promise<VoiceNavigationResult> {
    const normalizedTranscript = transcript.toLowerCase().trim()

    // Find matching navigation command
    const matchedCommand = this.findNavigationCommand(normalizedTranscript)

    if (matchedCommand) {
      return await this.executeNavigation(matchedCommand)
    }

    // Check for general navigation patterns
    const generalNavigation = this.parseGeneralNavigation(normalizedTranscript)
    if (generalNavigation) {
      return generalNavigation
    }

    return {
      success: false,
      message: "I didn't understand that navigation command. Try saying 'go home', 'show features', or 'help'.",
      suggestions: [
        'Say "go home" to return to the main page',
        'Say "show features" to see what I can do',
        'Say "help" for more navigation options',
      ],
    }
  }

  private findNavigationCommand(transcript: string): NavigationCommand | null {
    for (const command of this.navigationCommands) {
      // Check exact command match
      if (transcript.includes(command.command)) {
        return command
      }

      // Check aliases
      for (const alias of command.aliases) {
        if (transcript.includes(alias)) {
          return command
        }
      }
    }
    return null
  }

  private async executeNavigation(command: NavigationCommand): Promise<VoiceNavigationResult> {
    try {
      // Handle special navigation commands
      if (command.route === "back") {
        return this.navigateBack()
      }

      if (command.route === "scroll-up") {
        return this.scrollToTop()
      }

      if (command.route === "scroll-down") {
        return this.scrollDown()
      }

      // Handle regular navigation
      if (command.route.startsWith("#")) {
        return this.scrollToSection(command.route.substring(1))
      }

      // Handle route navigation
      this.addToHistory(this.currentRoute)
      this.currentRoute = command.route

      // Trigger navigation event
      window.dispatchEvent(
        new CustomEvent("voiceNavigationExecute", {
          detail: { route: command.route, command: command.command },
        }),
      )

      return {
        success: true,
        route: command.route,
        message: `Navigating to ${command.description.toLowerCase()}`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Navigation failed: ${error.message}`,
      }
    }
  }

  private navigateBack(): VoiceNavigationResult {
    if (this.navigationHistory.length > 0) {
      const previousRoute = this.navigationHistory.pop()!
      this.currentRoute = previousRoute

      window.dispatchEvent(
        new CustomEvent("voiceNavigationExecute", {
          detail: { route: previousRoute, command: "go back" },
        }),
      )

      return {
        success: true,
        route: previousRoute,
        message: "Going back to previous page",
      }
    }

    return {
      success: false,
      message: "No previous page to go back to",
    }
  }

  private scrollToTop(): VoiceNavigationResult {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return {
        success: true,
        message: "Scrolling to top of page",
      }
    }
    return { success: false, message: "Unable to scroll" }
  }

  private scrollDown(): VoiceNavigationResult {
    if (typeof window !== "undefined") {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })
      return {
        success: true,
        message: "Scrolling down",
      }
    }
    return { success: false, message: "Unable to scroll" }
  }

  private scrollToSection(sectionId: string): VoiceNavigationResult {
    if (typeof window !== "undefined") {
      const element = document.getElementById(sectionId) || document.querySelector(`[data-section="${sectionId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
        return {
          success: true,
          message: `Scrolling to ${sectionId} section`,
        }
      }
    }

    return {
      success: false,
      message: `Could not find ${sectionId} section`,
    }
  }

  private parseGeneralNavigation(transcript: string): VoiceNavigationResult | null {
    // Handle "show me" or "take me to" patterns
    const showMePattern = /(?:show me|take me to|go to|open|display)\s+(.+)/i
    const match = transcript.match(showMePattern)

    if (match) {
      const target = match[1].toLowerCase()

      // Map common targets to sections
      const targetMap: Record<string, string> = {
        features: "features",
        examples: "features",
        demo: "create",
        generator: "create",
        settings: "voice-settings",
        help: "help",
        tutorial: "help",
      }

      if (targetMap[target]) {
        return {
          success: true,
          message: `Showing ${target}`,
          route: `#${targetMap[target]}`,
        }
      }
    }

    return null
  }

  private addToHistory(route: string) {
    this.navigationHistory.push(route)
    // Keep only last 10 entries
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(-10)
    }
  }

  getAvailableCommands(): NavigationCommand[] {
    return [...this.navigationCommands]
  }

  getCurrentRoute(): string {
    return this.currentRoute
  }

  getNavigationHistory(): string[] {
    return [...this.navigationHistory]
  }
}

export const voiceNavigationEngine = VoiceNavigationEngine.getInstance()
