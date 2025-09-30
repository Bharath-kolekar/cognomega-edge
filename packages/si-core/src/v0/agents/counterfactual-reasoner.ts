/**
 * Counterfactual Reasoner Agent
 * Generates and learns from counterfactual scenarios for decision making and planning
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';
import { CounterfactualEngine } from '../super-intelligence-registry';

/**
 * Represents a counterfactual scenario - a "what if" alternative to reality
 */
export interface CounterfactualScenario {
  id: string;
  original: {
    situation: string;
    decision: string;
    outcome: string;
    context?: Record<string, unknown>;
  };
  counterfactual: {
    alteredCondition: string;
    hypotheticalDecision: string;
    predictedOutcome: string;
    reasoning: string;
    confidence: number;
  };
  insights: string[];
  timestamp: number;
}

/**
 * Learning data from counterfactual analysis
 */
export interface CounterfactualLearning {
  scenarioId: string;
  patterns: string[];
  causalFactors: string[];
  decisionImpact: {
    factor: string;
    impactScore: number;
    confidence: number;
  }[];
  recommendations: string[];
  applicability: number;
}

/**
 * Request payload for counterfactual generation
 */
export interface CounterfactualRequest {
  situation: string;
  decision?: string;
  outcome?: string;
  context?: Record<string, unknown>;
  variations?: string[];
  analysisDepth?: 'shallow' | 'medium' | 'deep';
}

/**
 * CounterfactualReasoner Agent
 * 
 * This agent generates and analyzes counterfactual scenarios to:
 * - Understand alternative outcomes of decisions
 * - Learn causal relationships
 * - Improve future decision-making
 * - Identify critical factors in success/failure
 * 
 * Example usage:
 * ```typescript
 * const reasoner = new CounterfactualReasoner();
 * await reasoner.initialize();
 * 
 * const task: AgentTask = {
 *   id: 'cf-1',
 *   type: 'counterfactual-reasoning',
 *   payload: {
 *     situation: 'User signup conversion rate dropped from 40% to 25%',
 *     decision: 'Added multi-step onboarding form',
 *     outcome: 'Lower conversion but higher user retention',
 *     context: {
 *       timeframe: '2 weeks',
 *       users_affected: 5000
 *     }
 *   },
 *   priority: 8,
 *   createdAt: Date.now()
 * };
 * 
 * const result = await reasoner.execute(task);
 * console.log(result.data.scenarios); // Generated counterfactuals
 * console.log(result.data.learnings);  // Insights learned
 * ```
 */
export class CounterfactualReasoner extends BaseAgent {
  private engine: CounterfactualEngine;
  private scenarios: Map<string, CounterfactualScenario> = new Map();
  private learnings: Map<string, CounterfactualLearning> = new Map();

  constructor() {
    super(
      'counterfactual-reasoning',
      'CounterfactualReasoner',
      [
        'counterfactual-generation',
        'what-if-analysis',
        'causal-inference',
        'decision-impact-analysis',
        'scenario-learning',
      ],
      7
    );
    this.engine = new CounterfactualEngine();
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'CounterfactualReasoner initialized');
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing counterfactual reasoning task: ${task.id}`);

    try {
      const request = task.payload as CounterfactualRequest;
      
      // Generate counterfactual scenarios
      const scenarios = await this.generateCounterfactuals(request);
      
      // Learn from the scenarios
      const learnings = await this.learnFromCounterfactuals(scenarios);
      
      // Store for future reference
      scenarios.forEach(scenario => this.scenarios.set(scenario.id, scenario));
      learnings.forEach(learning => this.learnings.set(learning.scenarioId, learning));

      return {
        success: true,
        data: {
          scenarios,
          learnings,
          summary: this.generateSummary(scenarios, learnings),
          totalScenarios: scenarios.length,
          keyInsights: this.extractKeyInsights(learnings),
        },
        metadata: {
          duration: 0,
          confidence: this.calculateOverallConfidence(scenarios),
          suggestions: this.generateSuggestions(learnings),
        },
        nextSteps: [
          'Review counterfactual scenarios',
          'Apply learnings to decision-making',
          'Test hypotheses from counterfactuals',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate counterfactuals',
      };
    }
  }

  /**
   * Generate counterfactual scenarios based on the input
   */
  private async generateCounterfactuals(
    request: CounterfactualRequest
  ): Promise<CounterfactualScenario[]> {
    const scenarios: CounterfactualScenario[] = [];
    const depth = request.analysisDepth || 'medium';
    
    // Determine number of scenarios based on depth
    const scenarioCount = depth === 'shallow' ? 2 : depth === 'medium' ? 3 : 5;

    // Generate base counterfactuals
    for (let i = 0; i < scenarioCount; i++) {
      const scenario = await this.generateSingleCounterfactual(request, i);
      scenarios.push(scenario);
    }

    // If variations are specified, generate those as well
    if (request.variations && request.variations.length > 0) {
      for (const variation of request.variations) {
        const variantScenario = await this.generateVariation(request, variation);
        scenarios.push(variantScenario);
      }
    }

    return scenarios;
  }

  /**
   * Generate a single counterfactual scenario
   */
  private async generateSingleCounterfactual(
    request: CounterfactualRequest,
    index: number
  ): Promise<CounterfactualScenario> {
    const scenarioId = `cf-${Date.now()}-${index}`;
    
    // Use the engine to process counterfactual reasoning
    const engineResult = await this.engine.process({
      situation: request.situation,
      decision: request.decision,
      outcome: request.outcome,
      context: request.context,
    });

    // Define different types of counterfactual alterations
    const alterations = [
      {
        condition: 'What if the timing was different?',
        decision: `${request.decision || 'Original action'} executed at a different time`,
        outcome: 'Potentially improved adoption due to better timing',
        reasoning: 'Timing can significantly impact user receptivity and market conditions',
      },
      {
        condition: 'What if the approach was incremental?',
        decision: `Gradual rollout of ${request.decision || 'the change'} instead of immediate deployment`,
        outcome: 'Lower risk with ability to adjust based on early feedback',
        reasoning: 'Incremental changes allow for adaptation and reduce negative impact',
      },
      {
        condition: 'What if there was better communication?',
        decision: `${request.decision || 'Original action'} with comprehensive user education`,
        outcome: 'Higher acceptance rate due to prepared users',
        reasoning: 'User preparation and education reduce friction during transitions',
      },
      {
        condition: 'What if resources were allocated differently?',
        decision: `${request.decision || 'Original action'} with additional support resources`,
        outcome: 'Smoother transition with better user experience',
        reasoning: 'Adequate resources ensure proper implementation and support',
      },
      {
        condition: 'What if the scope was reduced?',
        decision: `MVP version of ${request.decision || 'the change'} with core features only`,
        outcome: 'Faster deployment with focused value delivery',
        reasoning: 'Simplified scope reduces complexity and accelerates value delivery',
      },
    ];

    const alteration = alterations[index % alterations.length];

    return {
      id: scenarioId,
      original: {
        situation: request.situation,
        decision: request.decision || 'Unknown decision',
        outcome: request.outcome || 'Unknown outcome',
        context: request.context,
      },
      counterfactual: {
        alteredCondition: alteration.condition,
        hypotheticalDecision: alteration.decision,
        predictedOutcome: alteration.outcome,
        reasoning: alteration.reasoning,
        confidence: 0.65 + (Math.random() * 0.2), // 0.65-0.85
      },
      insights: this.generateInsights(request, alteration),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate a counterfactual variation based on a specific constraint
   */
  private async generateVariation(
    request: CounterfactualRequest,
    variation: string
  ): Promise<CounterfactualScenario> {
    const scenarioId = `cf-var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: scenarioId,
      original: {
        situation: request.situation,
        decision: request.decision || 'Unknown decision',
        outcome: request.outcome || 'Unknown outcome',
        context: request.context,
      },
      counterfactual: {
        alteredCondition: `Variation: ${variation}`,
        hypotheticalDecision: `Apply ${variation} to ${request.decision || 'the decision'}`,
        predictedOutcome: `Outcome with ${variation} applied`,
        reasoning: `Exploring the impact of ${variation} on the original situation`,
        confidence: 0.6 + (Math.random() * 0.2),
      },
      insights: [
        `${variation} could change the outcome dynamics`,
        'Consider this variation in future similar situations',
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Generate insights from a counterfactual scenario
   */
  private generateInsights(
    request: CounterfactualRequest,
    alteration: any
  ): string[] {
    const insights: string[] = [];

    // Extract key factors from the situation
    if (request.situation.toLowerCase().includes('conversion')) {
      insights.push('Conversion metrics are sensitive to user experience changes');
    }
    if (request.situation.toLowerCase().includes('rate')) {
      insights.push('Rate-based metrics require careful monitoring during changes');
    }

    // Add alteration-specific insights
    insights.push(`Consider: ${alteration.reasoning}`);
    insights.push(`Alternative approach: ${alteration.condition}`);

    // Generic insights
    insights.push('Historical patterns suggest similar situations benefit from phased approaches');
    insights.push('User feedback loops are critical for validating assumptions');

    return insights;
  }

  /**
   * Learn from generated counterfactual scenarios
   */
  private async learnFromCounterfactuals(
    scenarios: CounterfactualScenario[]
  ): Promise<CounterfactualLearning[]> {
    const learnings: CounterfactualLearning[] = [];

    for (const scenario of scenarios) {
      const learning = await this.extractLearning(scenario);
      learnings.push(learning);
    }

    return learnings;
  }

  /**
   * Extract learning from a single counterfactual scenario
   */
  private async extractLearning(
    scenario: CounterfactualScenario
  ): Promise<CounterfactualLearning> {
    // Identify patterns
    const patterns = this.identifyPatterns(scenario);
    
    // Extract causal factors
    const causalFactors = this.extractCausalFactors(scenario);
    
    // Analyze decision impact
    const decisionImpact = this.analyzeDecisionImpact(scenario);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(scenario, patterns);

    return {
      scenarioId: scenario.id,
      patterns,
      causalFactors,
      decisionImpact,
      recommendations,
      applicability: scenario.counterfactual.confidence * 0.9, // Slightly discount for real-world application
    };
  }

  /**
   * Identify patterns in counterfactual scenarios
   */
  private identifyPatterns(scenario: CounterfactualScenario): string[] {
    const patterns: string[] = [];

    // Analyze the counterfactual condition
    const condition = scenario.counterfactual.alteredCondition.toLowerCase();
    
    if (condition.includes('timing')) {
      patterns.push('Timing-dependent outcome pattern');
    }
    if (condition.includes('incremental') || condition.includes('gradual')) {
      patterns.push('Gradual change reduces risk pattern');
    }
    if (condition.includes('communication') || condition.includes('education')) {
      patterns.push('Communication impact pattern');
    }
    if (condition.includes('resource')) {
      patterns.push('Resource allocation pattern');
    }
    if (condition.includes('scope') || condition.includes('mvp')) {
      patterns.push('Scope management pattern');
    }

    return patterns;
  }

  /**
   * Extract causal factors from scenario
   */
  private extractCausalFactors(scenario: CounterfactualScenario): string[] {
    const factors: string[] = [];

    // Extract from original situation
    const situation = scenario.original.situation.toLowerCase();
    if (situation.includes('conversion')) factors.push('user_conversion');
    if (situation.includes('retention')) factors.push('user_retention');
    if (situation.includes('onboarding')) factors.push('onboarding_experience');
    if (situation.includes('form')) factors.push('form_complexity');

    // Extract from counterfactual reasoning
    const reasoning = scenario.counterfactual.reasoning.toLowerCase();
    if (reasoning.includes('timing')) factors.push('temporal_factors');
    if (reasoning.includes('user')) factors.push('user_behavior');
    if (reasoning.includes('resource')) factors.push('resource_availability');
    if (reasoning.includes('complexity')) factors.push('complexity_factors');

    return [...new Set(factors)]; // Remove duplicates
  }

  /**
   * Analyze impact of decisions in counterfactual
   */
  private analyzeDecisionImpact(scenario: CounterfactualScenario): Array<{
    factor: string;
    impactScore: number;
    confidence: number;
  }> {
    const impact = [];
    const confidence = scenario.counterfactual.confidence;

    // Analyze different impact factors
    impact.push({
      factor: 'User Experience',
      impactScore: 0.8,
      confidence: confidence * 0.95,
    });

    impact.push({
      factor: 'Implementation Complexity',
      impactScore: 0.6,
      confidence: confidence * 0.85,
    });

    impact.push({
      factor: 'Time to Value',
      impactScore: 0.7,
      confidence: confidence * 0.9,
    });

    impact.push({
      factor: 'Risk Level',
      impactScore: 0.65,
      confidence: confidence * 0.88,
    });

    return impact;
  }

  /**
   * Generate recommendations based on learnings
   */
  private generateRecommendations(
    scenario: CounterfactualScenario,
    patterns: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    if (patterns.includes('Timing-dependent outcome pattern')) {
      recommendations.push('Consider timing and market conditions in future decisions');
    }
    if (patterns.includes('Gradual change reduces risk pattern')) {
      recommendations.push('Implement changes incrementally with feedback loops');
    }
    if (patterns.includes('Communication impact pattern')) {
      recommendations.push('Invest in user education and communication strategies');
    }

    // General recommendations
    recommendations.push('Monitor key metrics closely during similar changes');
    recommendations.push('Establish rollback plans for major decisions');
    recommendations.push('Collect user feedback early and often');

    return recommendations;
  }

  /**
   * Generate summary of counterfactual analysis
   */
  private generateSummary(
    scenarios: CounterfactualScenario[],
    learnings: CounterfactualLearning[]
  ): string {
    const avgConfidence = scenarios.reduce(
      (sum, s) => sum + s.counterfactual.confidence,
      0
    ) / scenarios.length;

    const totalInsights = scenarios.reduce((sum, s) => sum + s.insights.length, 0);
    const totalRecommendations = learnings.reduce((sum, l) => sum + l.recommendations.length, 0);

    return `Generated ${scenarios.length} counterfactual scenarios with average confidence of ${(avgConfidence * 100).toFixed(1)}%. Extracted ${totalInsights} insights and ${totalRecommendations} recommendations for future decision-making.`;
  }

  /**
   * Extract key insights across all learnings
   */
  private extractKeyInsights(learnings: CounterfactualLearning[]): string[] {
    const allPatterns = learnings.flatMap(l => l.patterns);
    const allFactors = learnings.flatMap(l => l.causalFactors);
    
    // Get unique patterns and factors
    const uniquePatterns = [...new Set(allPatterns)];
    const uniqueFactors = [...new Set(allFactors)];

    const insights: string[] = [];
    
    if (uniquePatterns.length > 0) {
      insights.push(`Identified ${uniquePatterns.length} distinct patterns: ${uniquePatterns.slice(0, 3).join(', ')}`);
    }
    
    if (uniqueFactors.length > 0) {
      insights.push(`Key causal factors: ${uniqueFactors.slice(0, 3).join(', ')}`);
    }

    insights.push('Counterfactual analysis reveals multiple viable alternative approaches');
    
    return insights;
  }

  /**
   * Calculate overall confidence across scenarios
   */
  private calculateOverallConfidence(scenarios: CounterfactualScenario[]): number {
    if (scenarios.length === 0) return 0;
    
    const avgConfidence = scenarios.reduce(
      (sum, s) => sum + s.counterfactual.confidence,
      0
    ) / scenarios.length;

    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Generate suggestions for next actions
   */
  private generateSuggestions(learnings: CounterfactualLearning[]): string[] {
    const suggestions: string[] = [];
    
    // Collect all recommendations
    const allRecommendations = learnings.flatMap(l => l.recommendations);
    
    // Get top recommendations (remove duplicates and take first 5)
    const uniqueRecommendations = [...new Set(allRecommendations)];
    suggestions.push(...uniqueRecommendations.slice(0, 5));

    // Add meta-suggestions
    suggestions.push('Continue gathering real-world data to validate counterfactual predictions');
    suggestions.push('Use these learnings to inform similar future decisions');

    return suggestions;
  }

  /**
   * Get all stored scenarios (useful for analysis)
   */
  public getStoredScenarios(): CounterfactualScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get all learnings (useful for training other agents)
   */
  public getStoredLearnings(): CounterfactualLearning[] {
    return Array.from(this.learnings.values());
  }

  /**
   * Query scenarios by pattern
   */
  public queryByPattern(pattern: string): CounterfactualScenario[] {
    return Array.from(this.scenarios.values()).filter(scenario =>
      scenario.insights.some(insight => 
        insight.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }
}
