import { browserNLP, type TextStats } from "./browser-nlp"
import { semanticNLPEngine, type SemanticAnalysis } from "./semantic-nlp-engine"

// Intent categories for Cognomega
export enum IntentType {
  CODE_GENERATION = "code_generation",
  UI_CREATION = "ui_creation",
  BACKEND_SETUP = "backend_setup",
  DATABASE_OPERATION = "database_operation",
  STYLING_REQUEST = "styling_request",
  FEATURE_REQUEST = "feature_request",
  QUESTION = "question",
  GREETING = "greeting",
  UNKNOWN = "unknown",
  API_DESIGN = "api_design",
  CODE_REFACTOR = "code_refactor",
  TEST_GENERATION = "test_generation",
  APP_PLANNING = "app_planning",
  SQL_ANALYTICS = "sql_analytics",
  DATABASE_DESIGN = "database_design",
  DATA_VISUALIZATION = "data_visualization",
  TRANSLATION = "translation",
  VISION_ANALYSIS = "vision_analysis",
  VISION_DEEP_ANALYSIS = "vision_deep_analysis",
  VISION_CODE_GENERATION = "vision_code_generation",
  REPORT_GENERATION = "report_generation",
  DOCUMENT_SUMMARIZATION = "document_summarization",
}

// Entity types we can extract
export interface ExtractedEntity {
  entity: string
  option: string
  start: number
  end: number
  accuracy: number
}

// Enhanced NLP analysis result
export interface EnhancedNLPAnalysis extends NLPAnalysis {
  textStats: TextStats
  keyPhrases: string[]
  complexity: "simple" | "moderate" | "complex"
  readabilityScore: number
}

// NLP analysis result
export interface NLPAnalysis {
  intent: IntentType
  confidence: number
  entities: ExtractedEntity[]
  sentiment: {
    score: number
    comparative: number
    label: "positive" | "negative" | "neutral"
  }
  processedText: string
  keywords: string[]
}

class CognomegaNLP {
  private static instance: CognomegaNLP

  public static getInstance(): CognomegaNLP {
    if (!CognomegaNLP.instance) {
      CognomegaNLP.instance = new CognomegaNLP()
    }
    return CognomegaNLP.instance
  }

  // Map browser NLP intents to our intent types
  private mapIntent(browserIntent: string): IntentType {
    const intentMap: Record<string, IntentType> = {
      ui_creation: IntentType.UI_CREATION,
      backend_setup: IntentType.BACKEND_SETUP,
      styling: IntentType.STYLING_REQUEST,
      data_management: IntentType.DATABASE_OPERATION,
      enhancement: IntentType.FEATURE_REQUEST,
      general: IntentType.UNKNOWN,
      api_design: IntentType.API_DESIGN,
      code_refactor: IntentType.CODE_REFACTOR,
      test_generation: IntentType.TEST_GENERATION,
      app_planning: IntentType.APP_PLANNING,
      sql_analytics: IntentType.SQL_ANALYTICS,
      database_design: IntentType.DATABASE_DESIGN,
      data_visualization: IntentType.DATA_VISUALIZATION,
      visualization: IntentType.DATA_VISUALIZATION,
      chart: IntentType.DATA_VISUALIZATION,
      graph: IntentType.DATA_VISUALIZATION,
      translation: IntentType.TRANSLATION,
      translate: IntentType.TRANSLATION,
      i18n: IntentType.TRANSLATION,
      localization: IntentType.TRANSLATION,
      vision: IntentType.VISION_ANALYSIS,
      image_analysis: IntentType.VISION_ANALYSIS,
      visual_analysis: IntentType.VISION_ANALYSIS,
      vision_analyze: IntentType.VISION_DEEP_ANALYSIS,
      deep_vision: IntentType.VISION_DEEP_ANALYSIS,
      design_analysis: IntentType.VISION_DEEP_ANALYSIS,
      vision_code: IntentType.VISION_CODE_GENERATION,
      image_to_code: IntentType.VISION_CODE_GENERATION,
      mockup_to_code: IntentType.VISION_CODE_GENERATION,
      report: IntentType.REPORT_GENERATION,
      documentation: IntentType.REPORT_GENERATION,
      generate_report: IntentType.REPORT_GENERATION,
      summary: IntentType.DOCUMENT_SUMMARIZATION,
      summarize: IntentType.DOCUMENT_SUMMARIZATION,
      extract_insights: IntentType.DOCUMENT_SUMMARIZATION,
    }

    return intentMap[browserIntent] || IntentType.UNKNOWN
  }

  // Convert browser NLP entities to our format
  private convertEntities(entities: string[]): ExtractedEntity[] {
    return entities.map((entity, index) => ({
      entity: this.categorizeEntity(entity),
      option: entity,
      start: 0, // Browser NLP doesn't provide positions
      end: entity.length,
      accuracy: 0.8, // Default accuracy
    }))
  }

  private categorizeEntity(entity: string): string {
    const techKeywords = [
      "react",
      "nextjs",
      "typescript",
      "javascript",
      "tailwind",
      "css",
      "html",
      "api",
      "database",
      "auth",
    ]
    const componentKeywords = ["button", "form", "modal", "dashboard", "chart", "table", "card", "layout"]
    const visualizationKeywords = ["chart", "graph", "dashboard", "plot", "diagram", "visualization"]
    const translationKeywords = ["translate", "language", "i18n", "localization", "spanish", "french", "german"]
    const visionKeywords = ["image", "photo", "picture", "visual", "design", "mockup", "screenshot"]
    const reportKeywords = ["report", "document", "summary", "analysis", "documentation"]

    if (techKeywords.some((tech) => entity.includes(tech))) return "technology"
    if (componentKeywords.some((comp) => entity.includes(comp))) return "component"
    if (visualizationKeywords.some((viz) => entity.includes(viz))) return "visualization"
    if (translationKeywords.some((trans) => entity.includes(trans))) return "translation"
    if (visionKeywords.some((vis) => entity.includes(vis))) return "vision"
    if (reportKeywords.some((rep) => entity.includes(rep))) return "report"
    return "other"
  }

  async analyzeText(text: string): Promise<NLPAnalysis> {
    const browserAnalysis = browserNLP.analyzeText(text)

    return {
      intent: this.mapIntent(browserAnalysis.intent),
      confidence: browserAnalysis.confidence,
      entities: this.convertEntities(browserAnalysis.entities),
      sentiment: {
        score: browserAnalysis.sentiment === "positive" ? 1 : browserAnalysis.sentiment === "negative" ? -1 : 0,
        comparative:
          browserAnalysis.sentiment === "positive" ? 0.1 : browserAnalysis.sentiment === "negative" ? -0.1 : 0,
        label: browserAnalysis.sentiment,
      },
      processedText: text.toLowerCase().trim(),
      keywords: browserAnalysis.keywords,
    }
  }

  async analyzeTextEnhanced(text: string): Promise<EnhancedNLPAnalysis> {
    const browserAnalysis = browserNLP.analyzeText(text)
    const textStats = browserNLP.getTextStats(text)

    // Extract key phrases (simple n-gram approach)
    const keyPhrases = this.extractKeyPhrases(text, 2)

    const basicAnalysis = await this.analyzeText(text)

    return {
      ...basicAnalysis,
      textStats,
      keyPhrases,
      complexity:
        browserAnalysis.complexity < 0.3 ? "simple" : browserAnalysis.complexity < 0.7 ? "moderate" : "complex",
      readabilityScore: textStats.readabilityScore,
    }
  }

  private extractKeyPhrases(text: string, n = 2): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
    const phrases: string[] = []

    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ")
      if (phrase.length > 3) phrases.push(phrase)
    }

    // Return unique phrases, limited to top 10
    return [...new Set(phrases)].slice(0, 10)
  }

  // Enhanced prompt generation based on NLP analysis
  generateEnhancedPrompt(originalPrompt: string, analysis: NLPAnalysis): string {
    let enhancedPrompt = originalPrompt

    // Add context based on intent
    switch (analysis.intent) {
      case IntentType.UI_CREATION:
        enhancedPrompt +=
          "\n\nPlease focus on creating a responsive, accessible user interface with modern design principles."
        break
      case IntentType.BACKEND_SETUP:
        enhancedPrompt += "\n\nPlease include proper error handling, type safety, and follow REST API best practices."
        break
      case IntentType.DATABASE_OPERATION:
        enhancedPrompt += "\n\nPlease include proper SQL schema design, indexing considerations, and data validation."
        break
      case IntentType.STYLING_REQUEST:
        enhancedPrompt += "\n\nPlease use Tailwind CSS classes and follow the existing design system."
        break
      case IntentType.API_DESIGN:
        enhancedPrompt +=
          "\n\nPlease create a comprehensive API design with proper endpoints, request/response schemas, authentication, and documentation."
        break
      case IntentType.CODE_REFACTOR:
        enhancedPrompt +=
          "\n\nPlease analyze the code for performance improvements, maintainability, and best practices. Include before/after comparisons."
        break
      case IntentType.TEST_GENERATION:
        enhancedPrompt +=
          "\n\nPlease generate comprehensive test suites including unit tests, integration tests, and edge cases with proper assertions."
        break
      case IntentType.APP_PLANNING:
        enhancedPrompt +=
          "\n\nPlease create a detailed application architecture plan with component breakdown, data flow, and implementation phases."
        break
      case IntentType.SQL_ANALYTICS:
        enhancedPrompt +=
          "\n\nPlease generate optimized SQL queries with proper indexing, performance considerations, and data analysis insights."
        break
      case IntentType.DATABASE_DESIGN:
        enhancedPrompt +=
          "\n\nPlease design a normalized database schema with proper relationships, constraints, and migration scripts."
        break
      case IntentType.DATA_VISUALIZATION:
        enhancedPrompt +=
          "\n\nPlease create interactive, responsive data visualizations using modern charting libraries like Recharts. Include proper data formatting, accessibility features, and multiple chart types."
        break
      case IntentType.TRANSLATION:
        enhancedPrompt +=
          "\n\nPlease provide accurate translations with proper context, cultural considerations, and i18n implementation patterns. Include pluralization rules and locale-specific formatting."
        break
      case IntentType.VISION_ANALYSIS:
        enhancedPrompt +=
          "\n\nPlease analyze the visual content thoroughly, extracting text, identifying objects, describing scenes, and providing actionable insights. Include accessibility considerations like alt text generation."
        break
      case IntentType.VISION_DEEP_ANALYSIS:
        enhancedPrompt +=
          "\n\nPlease perform comprehensive design analysis including color theory, typography assessment, layout evaluation, accessibility compliance, and provide specific improvement recommendations."
        break
      case IntentType.VISION_CODE_GENERATION:
        enhancedPrompt +=
          "\n\nPlease generate pixel-perfect, production-ready code that matches the visual design exactly. Include responsive patterns, semantic HTML, modern CSS, and proper component architecture."
        break
      case IntentType.REPORT_GENERATION:
        enhancedPrompt +=
          "\n\nPlease create comprehensive, well-structured reports with executive summaries, detailed analysis, actionable recommendations, and proper formatting. Include relevant metrics and timelines."
        break
      case IntentType.DOCUMENT_SUMMARIZATION:
        enhancedPrompt +=
          "\n\nPlease provide concise, accurate summaries that capture key insights, main points, and actionable items. Maintain the original context while reducing length by 70-80%."
        break
    }

    // Add technology-specific context based on entities
    const technologies = analysis.entities.filter((e) => e.entity === "technology")
    if (technologies.length > 0) {
      enhancedPrompt += `\n\nTechnologies mentioned: ${technologies.map((t) => t.option).join(", ")}`
    }

    const visualizations = analysis.entities.filter((e) => e.entity === "visualization")
    if (visualizations.length > 0) {
      enhancedPrompt += `\n\nVisualization types mentioned: ${visualizations.map((v) => v.option).join(", ")}`
    }

    const translations = analysis.entities.filter((e) => e.entity === "translation")
    if (translations.length > 0) {
      enhancedPrompt += `\n\nTranslation context: ${translations.map((t) => t.option).join(", ")}`
    }

    const visionElements = analysis.entities.filter((e) => e.entity === "vision")
    if (visionElements.length > 0) {
      enhancedPrompt += `\n\nVisual elements mentioned: ${visionElements.map((v) => v.option).join(", ")}`
    }

    const reportElements = analysis.entities.filter((e) => e.entity === "report")
    if (reportElements.length > 0) {
      enhancedPrompt += `\n\nReport elements mentioned: ${reportElements.map((r) => r.option).join(", ")}`
    }

    return enhancedPrompt
  }

  generateEnhancedPromptWithTextAnalysis(originalPrompt: string, analysis: EnhancedNLPAnalysis): string {
    let enhancedPrompt = this.generateEnhancedPrompt(originalPrompt, analysis)

    // Add complexity-based instructions
    if (analysis.complexity === "complex") {
      enhancedPrompt +=
        "\n\nNote: This is a complex request. Please break it down into manageable components and provide detailed implementation."
    }

    // Add key phrases context
    if (analysis.keyPhrases.length > 0) {
      enhancedPrompt += `\n\nKey phrases detected: ${analysis.keyPhrases.slice(0, 5).join(", ")}`
    }

    return enhancedPrompt
  }

  async analyzeTextWithSemantics(text: string): Promise<SemanticAnalysis> {
    return await semanticNLPEngine.analyzeSemanticText(text)
  }

  generateSemanticEnhancedPrompt(originalPrompt: string, analysis: SemanticAnalysis): string {
    let enhancedPrompt = this.generateEnhancedPromptWithTextAnalysis(originalPrompt, analysis)

    // Add semantic context
    if (analysis.semanticConcepts.length > 0) {
      enhancedPrompt += `\n\nSemantic concepts detected: ${analysis.semanticConcepts.join(", ")}`
    }

    // Add abstract meaning for better understanding
    if (analysis.abstractMeaning) {
      enhancedPrompt += `\n\nUser intent: ${analysis.abstractMeaning}`
    }

    // Handle ambiguity
    if (analysis.contextualAmbiguity > 0.5) {
      enhancedPrompt += `\n\nNote: This request contains some ambiguous elements. Please ask for clarification if needed.`
    }

    // Add domain-specific guidance
    if (analysis.domainSpecificity > 0.7) {
      enhancedPrompt += `\n\nThis is a domain-specific request. Apply specialized knowledge and best practices.`
    }

    return enhancedPrompt
  }
}

// Export singleton instance
export const nlpProcessor = CognomegaNLP.getInstance()

// Utility functions
export async function analyzeUserInput(input: string): Promise<NLPAnalysis> {
  return await nlpProcessor.analyzeText(input)
}

export async function analyzeUserInputEnhanced(input: string): Promise<EnhancedNLPAnalysis> {
  return await nlpProcessor.analyzeTextEnhanced(input)
}

export function enhancePromptWithNLP(prompt: string, analysis: NLPAnalysis): string {
  return nlpProcessor.generateEnhancedPrompt(prompt, analysis)
}

export function enhancePromptWithAdvancedNLP(prompt: string, analysis: EnhancedNLPAnalysis): string {
  return nlpProcessor.generateEnhancedPromptWithTextAnalysis(prompt, analysis)
}

export async function analyzeUserInputWithSemantics(input: string): Promise<SemanticAnalysis> {
  return await nlpProcessor.analyzeTextWithSemantics(input)
}

export function enhancePromptWithSemantics(prompt: string, analysis: SemanticAnalysis): string {
  return nlpProcessor.generateSemanticEnhancedPrompt(prompt, analysis)
}
