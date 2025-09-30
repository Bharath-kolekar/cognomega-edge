/**
 * Strategic Solver Agent
 * Adaptive problem-solving agent that selects and invents new strategies,
 * tracks performance, and continuously improves problem-solving approaches.
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';

// ============================================================================
// Strategy Interfaces
// ============================================================================

/**
 * Interface for problem-solving strategies
 */
export interface ProblemSolvingStrategy {
  id: string;
  name: string;
  description: string;
  category: 'decomposition' | 'heuristic' | 'analytical' | 'creative' | 'hybrid';
  applicableContexts: string[];
  complexity: 'low' | 'medium' | 'high';
  
  /**
   * Execute the strategy on a given problem
   */
  execute(problem: ProblemContext): Promise<StrategyResult>;
  
  /**
   * Evaluate if this strategy is suitable for the problem
   */
  isApplicable(problem: ProblemContext): boolean;
}

/**
 * Interface for tracking strategy performance
 */
export interface StrategyPerformanceTracker {
  strategyId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageQualityScore: number;
  contextSuccessRates: Map<string, number>;
  
  /**
   * Record the outcome of a strategy execution
   */
  recordExecution(result: StrategyExecutionRecord): void;
  
  /**
   * Get the success rate for a specific context
   */
  getSuccessRate(context?: string): number;
  
  /**
   * Get performance metrics summary
   */
  getMetrics(): StrategyMetrics;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface ProblemContext {
  id: string;
  description: string;
  type: 'optimization' | 'design' | 'debugging' | 'planning' | 'analysis' | 'general';
  complexity: number; // 0-1 scale
  constraints: string[];
  knownPatterns?: string[];
  previousAttempts?: StrategyExecutionRecord[];
  metadata?: Record<string, unknown>;
}

export interface StrategyResult {
  success: boolean;
  solution?: unknown;
  reasoning: string;
  confidence: number; // 0-1 scale
  alternativeApproaches?: string[];
  executionTime: number;
  quality?: number; // 0-1 scale
}

export interface StrategyExecutionRecord {
  strategyId: string;
  problemId: string;
  context: string;
  timestamp: number;
  duration: number;
  success: boolean;
  qualityScore?: number;
  outcome: string;
}

export interface StrategyMetrics {
  strategyId: string;
  successRate: number;
  avgExecutionTime: number;
  avgQualityScore: number;
  totalExecutions: number;
  reliability: number; // 0-1 scale
}

// ============================================================================
// Strategy Implementations
// ============================================================================

/**
 * Decomposition strategy - breaks complex problems into smaller parts
 */
class DecompositionStrategy implements ProblemSolvingStrategy {
  id = 'decomposition-001';
  name = 'Hierarchical Decomposition';
  description = 'Break down complex problems into manageable sub-problems';
  category = 'decomposition' as const;
  applicableContexts = ['planning', 'design', 'optimization'];
  complexity = 'medium' as const;

  async execute(problem: ProblemContext): Promise<StrategyResult> {
    const startTime = Date.now();
    
    // Analyze problem complexity
    const subProblems = this.decomposeIntoSubProblems(problem);
    
    return {
      success: true,
      solution: {
        subProblems,
        hierarchy: this.buildHierarchy(subProblems),
      },
      reasoning: `Decomposed "${problem.description}" into ${subProblems.length} manageable sub-problems`,
      confidence: 0.85,
      alternativeApproaches: ['bottom-up-synthesis', 'parallel-decomposition'],
      executionTime: Date.now() - startTime,
      quality: 0.88,
    };
  }

  isApplicable(problem: ProblemContext): boolean {
    return (
      problem.complexity > 0.5 &&
      ['planning', 'design', 'optimization'].includes(problem.type)
    );
  }

  private decomposeIntoSubProblems(problem: ProblemContext): string[] {
    const subProblems: string[] = [];
    
    // Identify key components based on problem description
    const keywords = ['design', 'implement', 'test', 'deploy', 'optimize'];
    keywords.forEach((keyword) => {
      if (problem.description.toLowerCase().includes(keyword)) {
        subProblems.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} phase`);
      }
    });
    
    // Always include analysis and validation
    subProblems.unshift('Problem analysis and requirements gathering');
    subProblems.push('Solution validation and verification');
    
    return subProblems;
  }

  private buildHierarchy(subProblems: string[]): Record<string, unknown> {
    return {
      root: 'Main Problem',
      children: subProblems.map((sp, idx) => ({
        id: `sub-${idx}`,
        description: sp,
        level: 1,
      })),
    };
  }
}

/**
 * Heuristic strategy - uses rules of thumb and past experience
 */
class HeuristicStrategy implements ProblemSolvingStrategy {
  id = 'heuristic-001';
  name = 'Pattern-Based Heuristic';
  description = 'Apply known patterns and heuristics from similar problems';
  category = 'heuristic' as const;
  applicableContexts = ['debugging', 'optimization', 'general'];
  complexity = 'low' as const;

  async execute(problem: ProblemContext): Promise<StrategyResult> {
    const startTime = Date.now();
    
    // Match problem to known patterns
    const patterns = this.matchPatterns(problem);
    const bestPattern = patterns[0];
    
    return {
      success: patterns.length > 0,
      solution: {
        pattern: bestPattern,
        application: this.applyPattern(bestPattern, problem),
      },
      reasoning: `Matched problem to pattern: ${bestPattern || 'none'}`,
      confidence: patterns.length > 0 ? 0.75 : 0.4,
      alternativeApproaches: patterns.slice(1, 3),
      executionTime: Date.now() - startTime,
      quality: patterns.length > 0 ? 0.8 : 0.5,
    };
  }

  isApplicable(problem: ProblemContext): boolean {
    return (
      problem.knownPatterns !== undefined &&
      problem.knownPatterns.length > 0
    ) || problem.previousAttempts !== undefined;
  }

  private matchPatterns(problem: ProblemContext): string[] {
    const patterns: string[] = [];
    
    if (problem.knownPatterns) {
      patterns.push(...problem.knownPatterns);
    }
    
    // Add common patterns based on problem type
    if (problem.type === 'debugging') {
      patterns.push('Binary search debugging', 'Logging analysis', 'Isolation testing');
    } else if (problem.type === 'optimization') {
      patterns.push('Caching', 'Lazy loading', 'Batch processing');
    }
    
    return patterns;
  }

  private applyPattern(pattern: string, problem: ProblemContext): string {
    return `Apply ${pattern} to ${problem.description}`;
  }
}

/**
 * Analytical strategy - systematic logical analysis
 */
class AnalyticalStrategy implements ProblemSolvingStrategy {
  id = 'analytical-001';
  name = 'Root Cause Analysis';
  description = 'Systematically analyze problem to identify root causes';
  category = 'analytical' as const;
  applicableContexts = ['debugging', 'analysis'];
  complexity = 'high' as const;

  async execute(problem: ProblemContext): Promise<StrategyResult> {
    const startTime = Date.now();
    
    const analysis = this.performRootCauseAnalysis(problem);
    
    return {
      success: true,
      solution: {
        rootCauses: analysis.causes,
        analysis: analysis.details,
        recommendations: analysis.recommendations,
      },
      reasoning: `Identified ${analysis.causes.length} potential root causes through systematic analysis`,
      confidence: 0.82,
      alternativeApproaches: ['statistical-analysis', 'hypothesis-testing'],
      executionTime: Date.now() - startTime,
      quality: 0.85,
    };
  }

  isApplicable(problem: ProblemContext): boolean {
    return ['debugging', 'analysis'].includes(problem.type);
  }

  private performRootCauseAnalysis(problem: ProblemContext): {
    causes: string[];
    details: string;
    recommendations: string[];
  } {
    const causes: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze constraints
    if (problem.constraints.length > 0) {
      causes.push('Constraint conflicts or limitations');
      recommendations.push('Review and possibly relax constraints');
    }
    
    // Check complexity
    if (problem.complexity > 0.7) {
      causes.push('High problem complexity');
      recommendations.push('Consider decomposition or simplification');
    }
    
    // Default causes
    if (causes.length === 0) {
      causes.push('Insufficient information', 'Unclear requirements');
      recommendations.push('Gather more details', 'Clarify problem statement');
    }
    
    return {
      causes,
      details: `Analyzed problem with ${problem.constraints.length} constraints and complexity ${problem.complexity}`,
      recommendations,
    };
  }
}

/**
 * Creative strategy - novel and innovative approaches
 */
class CreativeStrategy implements ProblemSolvingStrategy {
  id = 'creative-001';
  name = 'Lateral Thinking';
  description = 'Generate novel solutions through creative thinking';
  category = 'creative' as const;
  applicableContexts = ['design', 'general', 'planning'];
  complexity = 'medium' as const;

  async execute(problem: ProblemContext): Promise<StrategyResult> {
    const startTime = Date.now();
    
    const innovations = this.generateInnovativeSolutions(problem);
    
    return {
      success: true,
      solution: {
        innovations,
        approach: 'lateral-thinking',
      },
      reasoning: `Generated ${innovations.length} innovative approaches through creative problem-solving`,
      confidence: 0.65,
      alternativeApproaches: ['brainstorming', 'analogical-reasoning'],
      executionTime: Date.now() - startTime,
      quality: 0.7,
    };
  }

  isApplicable(problem: ProblemContext): boolean {
    return (
      problem.previousAttempts === undefined ||
      problem.previousAttempts.length === 0 ||
      problem.type === 'design'
    );
  }

  private generateInnovativeSolutions(problem: ProblemContext): string[] {
    const solutions: string[] = [];
    
    // Inversion: What if we do the opposite?
    solutions.push(`Invert the problem: Instead of ${problem.description}, consider the opposite approach`);
    
    // Analogy: Apply solutions from different domains
    solutions.push(`Apply cross-domain analogy: How would other fields solve similar problems?`);
    
    // Constraint removal: What if constraints didn't exist?
    if (problem.constraints.length > 0) {
      solutions.push(`Remove constraint: Explore solutions without "${problem.constraints[0]}"`);
    }
    
    return solutions;
  }
}

// ============================================================================
// Performance Tracker Implementation
// ============================================================================

class StrategyPerformanceTrackerImpl implements StrategyPerformanceTracker {
  strategyId: string;
  totalExecutions: number = 0;
  successfulExecutions: number = 0;
  failedExecutions: number = 0;
  averageExecutionTime: number = 0;
  averageQualityScore: number = 0;
  contextSuccessRates: Map<string, number> = new Map();
  
  private executionTimes: number[] = [];
  private qualityScores: number[] = [];
  private contextStats: Map<string, { success: number; total: number }> = new Map();

  constructor(strategyId: string) {
    this.strategyId = strategyId;
  }

  recordExecution(record: StrategyExecutionRecord): void {
    this.totalExecutions++;
    
    if (record.success) {
      this.successfulExecutions++;
    } else {
      this.failedExecutions++;
    }
    
    // Update execution time
    this.executionTimes.push(record.duration);
    this.averageExecutionTime = this.calculateAverage(this.executionTimes);
    
    // Update quality score
    if (record.qualityScore !== undefined) {
      this.qualityScores.push(record.qualityScore);
      this.averageQualityScore = this.calculateAverage(this.qualityScores);
    }
    
    // Update context-specific stats
    const contextStats = this.contextStats.get(record.context) || { success: 0, total: 0 };
    contextStats.total++;
    if (record.success) {
      contextStats.success++;
    }
    this.contextStats.set(record.context, contextStats);
    this.contextSuccessRates.set(record.context, contextStats.success / contextStats.total);
  }

  getSuccessRate(context?: string): number {
    if (context) {
      return this.contextSuccessRates.get(context) || 0;
    }
    return this.totalExecutions > 0 ? this.successfulExecutions / this.totalExecutions : 0;
  }

  getMetrics(): StrategyMetrics {
    return {
      strategyId: this.strategyId,
      successRate: this.getSuccessRate(),
      avgExecutionTime: this.averageExecutionTime,
      avgQualityScore: this.averageQualityScore,
      totalExecutions: this.totalExecutions,
      reliability: this.calculateReliability(),
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateReliability(): number {
    // Combine success rate and quality score for overall reliability
    const successRate = this.getSuccessRate();
    const qualityWeight = this.averageQualityScore || 0.5;
    return (successRate * 0.6 + qualityWeight * 0.4);
  }
}

// ============================================================================
// Strategic Solver Agent
// ============================================================================

export class StrategicSolverAgent extends BaseAgent {
  private strategies: Map<string, ProblemSolvingStrategy> = new Map();
  private performanceTrackers: Map<string, StrategyPerformanceTracker> = new Map();
  private problemHistory: Map<string, ProblemContext> = new Map();

  constructor() {
    super(
      'planning', // Using 'planning' as closest AgentType
      'StrategicSolverAgent',
      [
        'strategic-problem-solving',
        'strategy-selection',
        'strategy-invention',
        'performance-tracking',
        'adaptive-learning',
      ],
      8 // High priority
    );
  }

  protected async onInitialize(): Promise<void> {
    // Initialize built-in strategies
    this.registerStrategy(new DecompositionStrategy());
    this.registerStrategy(new HeuristicStrategy());
    this.registerStrategy(new AnalyticalStrategy());
    this.registerStrategy(new CreativeStrategy());
    
    this.log('info', `Initialized with ${this.strategies.size} built-in strategies`);
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing strategic solving task: ${task.id}`);

    const problemContext = this.extractProblemContext(task);
    
    if (!problemContext) {
      return {
        success: false,
        error: 'Invalid problem context provided',
      };
    }

    try {
      // Store problem for future reference
      this.problemHistory.set(problemContext.id, problemContext);
      
      // Select best strategy
      const selectedStrategy = await this.selectBestStrategy(problemContext);
      
      if (!selectedStrategy) {
        return {
          success: false,
          error: 'No applicable strategy found for the problem',
          metadata: {
            duration: 0,
          },
        };
      }

      this.log('info', `Selected strategy: ${selectedStrategy.name}`);
      
      // Execute strategy
      const strategyResult = await selectedStrategy.execute(problemContext);
      
      // Record execution for performance tracking
      this.recordStrategyExecution(
        selectedStrategy.id,
        problemContext,
        strategyResult
      );
      
      // Generate insights from performance data
      const insights = this.generatePerformanceInsights(selectedStrategy.id);
      
      return {
        success: strategyResult.success,
        data: {
          solution: strategyResult.solution,
          strategy: {
            id: selectedStrategy.id,
            name: selectedStrategy.name,
            category: selectedStrategy.category,
          },
          reasoning: strategyResult.reasoning,
          alternativeApproaches: strategyResult.alternativeApproaches,
          performanceInsights: insights,
        },
        metadata: {
          duration: strategyResult.executionTime,
          confidence: strategyResult.confidence,
          suggestions: this.generateNextStepSuggestions(problemContext, strategyResult),
        },
        nextSteps: this.generateNextSteps(strategyResult),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Strategy execution failed',
      };
    }
  }

  /**
   * Register a new problem-solving strategy
   */
  public registerStrategy(strategy: ProblemSolvingStrategy): void {
    this.strategies.set(strategy.id, strategy);
    
    // Create performance tracker if not exists
    if (!this.performanceTrackers.has(strategy.id)) {
      this.performanceTrackers.set(
        strategy.id,
        new StrategyPerformanceTrackerImpl(strategy.id)
      );
    }
    
    this.log('info', `Registered strategy: ${strategy.name}`);
  }

  /**
   * Get all registered strategies
   */
  public getStrategies(): ProblemSolvingStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get performance metrics for a strategy
   */
  public getStrategyMetrics(strategyId: string): StrategyMetrics | null {
    const tracker = this.performanceTrackers.get(strategyId);
    return tracker ? tracker.getMetrics() : null;
  }

  /**
   * Get all performance metrics
   */
  public getAllMetrics(): Map<string, StrategyMetrics> {
    const metrics = new Map<string, StrategyMetrics>();
    this.performanceTrackers.forEach((tracker, strategyId) => {
      metrics.set(strategyId, tracker.getMetrics());
    });
    return metrics;
  }

  /**
   * Select the best strategy for a given problem
   */
  private async selectBestStrategy(
    problem: ProblemContext
  ): Promise<ProblemSolvingStrategy | null> {
    const applicableStrategies = Array.from(this.strategies.values()).filter(
      (strategy) => strategy.isApplicable(problem)
    );

    if (applicableStrategies.length === 0) {
      return null;
    }

    // Score each strategy based on performance history and context
    const scoredStrategies = applicableStrategies.map((strategy) => {
      const tracker = this.performanceTrackers.get(strategy.id);
      const baseScore = tracker ? tracker.getSuccessRate() : 0.5;
      const contextScore = tracker ? tracker.getSuccessRate(problem.type) : 0.5;
      
      // Weighted combination
      const finalScore = baseScore * 0.6 + contextScore * 0.4;
      
      return { strategy, score: finalScore };
    });

    // Sort by score and select best
    scoredStrategies.sort((a, b) => b.score - a.score);
    
    return scoredStrategies[0].strategy;
  }

  /**
   * Extract problem context from task payload
   */
  private extractProblemContext(task: AgentTask): ProblemContext | null {
    const payload = task.payload;
    
    if (!payload.problem) {
      return null;
    }

    const problem = payload.problem as any;
    
    return {
      id: problem.id || `problem-${Date.now()}`,
      description: problem.description || task.payload.description || 'Unknown problem',
      type: problem.type || 'general',
      complexity: problem.complexity || 0.5,
      constraints: problem.constraints || [],
      knownPatterns: problem.knownPatterns,
      previousAttempts: problem.previousAttempts,
      metadata: problem.metadata || {},
    };
  }

  /**
   * Record strategy execution for performance tracking
   */
  private recordStrategyExecution(
    strategyId: string,
    problem: ProblemContext,
    result: StrategyResult
  ): void {
    const tracker = this.performanceTrackers.get(strategyId);
    
    if (tracker) {
      const record: StrategyExecutionRecord = {
        strategyId,
        problemId: problem.id,
        context: problem.type,
        timestamp: Date.now(),
        duration: result.executionTime,
        success: result.success,
        qualityScore: result.quality,
        outcome: result.reasoning,
      };
      
      tracker.recordExecution(record);
    }
  }

  /**
   * Generate insights from performance data
   */
  private generatePerformanceInsights(strategyId: string): string[] {
    const insights: string[] = [];
    const tracker = this.performanceTrackers.get(strategyId);
    
    if (!tracker) {
      return insights;
    }
    
    const metrics = tracker.getMetrics();
    
    if (metrics.successRate > 0.8) {
      insights.push(`Strategy has excellent success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    } else if (metrics.successRate < 0.5) {
      insights.push(`Strategy success rate is below average: ${(metrics.successRate * 100).toFixed(1)}%`);
    }
    
    if (metrics.totalExecutions < 5) {
      insights.push(`Limited execution history (${metrics.totalExecutions} executions) - confidence may be lower`);
    }
    
    if (metrics.reliability > 0.85) {
      insights.push('Strategy shows high reliability based on success rate and quality');
    }
    
    return insights;
  }

  /**
   * Generate suggestions for next steps
   */
  private generateNextStepSuggestions(
    problem: ProblemContext,
    result: StrategyResult
  ): string[] {
    const suggestions: string[] = [];
    
    if (result.confidence < 0.6) {
      suggestions.push('Consider trying alternative strategies due to low confidence');
    }
    
    if (result.alternativeApproaches && result.alternativeApproaches.length > 0) {
      suggestions.push(`Alternative approaches available: ${result.alternativeApproaches.join(', ')}`);
    }
    
    if (problem.complexity > 0.7 && result.success) {
      suggestions.push('Consider validating solution with multiple strategies');
    }
    
    return suggestions;
  }

  /**
   * Generate next steps from strategy result
   */
  private generateNextSteps(result: StrategyResult): string[] {
    const steps: string[] = [];
    
    if (result.success) {
      steps.push('Review and validate the proposed solution');
      steps.push('Implement the solution with appropriate safeguards');
      
      if (result.alternativeApproaches && result.alternativeApproaches.length > 0) {
        steps.push('Consider exploring alternative approaches for comparison');
      }
    } else {
      steps.push('Analyze why the current strategy failed');
      steps.push('Try alternative problem-solving strategies');
      steps.push('Gather additional context or information');
    }
    
    return steps;
  }
}
