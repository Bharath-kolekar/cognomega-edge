/**
 * Explainability Agent
 * Provides transparency and explainability for AI decisions and actions
 * Generates human-readable rationales, explains reasoning, and handles why/what-if queries
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';

/**
 * Explanation types that the agent can generate
 */
export type ExplanationType =
  | 'rationale'
  | 'reasoning'
  | 'counterfactual'
  | 'causal'
  | 'decision-tree'
  | 'why-query'
  | 'what-if-query';

/**
 * Represents a step in a reasoning chain
 */
export interface ReasoningStep {
  step: number;
  description: string;
  rationale: string;
  confidence: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

/**
 * Represents a causal link between two entities or decisions
 */
export interface CausalLink {
  from: string;
  to: string;
  strength: number; // 0-1
  description: string;
  evidence?: string[];
}

/**
 * Represents a counterfactual scenario
 */
export interface CounterfactualScenario {
  condition: string;
  originalOutcome: string;
  alternativeOutcome: string;
  probability: number;
  explanation: string;
}

/**
 * Represents a decision node in a decision tree
 */
export interface DecisionNode {
  id: string;
  label: string;
  type: 'decision' | 'outcome' | 'condition';
  value?: unknown;
  children?: DecisionNode[];
  probability?: number;
  explanation?: string;
}

/**
 * Complete explanation result
 */
export interface ExplanationResult {
  type: ExplanationType;
  summary: string;
  details: string;
  reasoning?: ReasoningStep[];
  causalLinks?: CausalLink[];
  counterfactuals?: CounterfactualScenario[];
  decisionTree?: DecisionNode;
  visualizations?: VisualizationData[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Visualization data for decision trees and graphs
 */
export interface VisualizationData {
  type: 'tree' | 'graph' | 'flowchart' | 'timeline';
  format: 'mermaid' | 'dot' | 'json';
  data: string;
  description: string;
}

export class ExplainabilityAgent extends BaseAgent {
  constructor() {
    super(
      'explainability',
      'ExplainabilityAgent',
      [
        'rationale-generation',
        'reasoning-explanation',
        'counterfactual-analysis',
        'causal-analysis',
        'decision-visualization',
        'why-queries',
        'what-if-queries',
        'transparency',
        'interpretability',
      ],
      8 // High priority for explainability
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing explainability task: ${task.id}`);

    const { type, target, query, context } = task.payload;

    if (!type) {
      return {
        success: false,
        error: 'Missing explanation type',
      };
    }

    try {
      const explanation = await this.generateExplanation(
        type as ExplanationType,
        target,
        query as string,
        context as Record<string, unknown>
      );

      return {
        success: true,
        data: explanation,
        metadata: {
          duration: 0, // Will be set by base class
          confidence: explanation.confidence,
          suggestions: this.generateSuggestions(explanation),
        },
        nextSteps: this.generateNextSteps(explanation),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate explanation',
      };
    }
  }

  /**
   * Main explanation generation method
   */
  private async generateExplanation(
    type: ExplanationType,
    target: unknown,
    query: string,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    switch (type) {
      case 'rationale':
        return this.generateRationale(target, context);
      case 'reasoning':
        return this.explainReasoning(target, context);
      case 'counterfactual':
        return this.generateCounterfactuals(target, context);
      case 'causal':
        return this.analyzeCausalLinks(target, context);
      case 'decision-tree':
        return this.visualizeDecisionTree(target, context);
      case 'why-query':
        return this.handleWhyQuery(query, target, context);
      case 'what-if-query':
        return this.handleWhatIfQuery(query, target, context);
      default:
        throw new Error(`Unknown explanation type: ${type}`);
    }
  }

  /**
   * Generate human-readable rationale for actions/outputs
   */
  private async generateRationale(
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const targetData = target as Record<string, unknown>;
    const action = targetData?.action || 'unknown action';
    const inputs = targetData?.inputs as Record<string, unknown> || {};
    const outputs = targetData?.outputs as Record<string, unknown> || {};

    const rationale = this.buildRationale(action, inputs, outputs, context);

    return {
      type: 'rationale',
      summary: `Rationale for ${action}`,
      details: rationale.detailed,
      reasoning: rationale.steps,
      confidence: 0.85,
      metadata: {
        action,
        inputCount: Object.keys(inputs).length,
        outputCount: Object.keys(outputs).length,
      },
    };
  }

  /**
   * Explain reasoning process step-by-step
   */
  private async explainReasoning(
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const steps = this.extractReasoningSteps(target, context);
    const summary = this.summarizeReasoning(steps);

    return {
      type: 'reasoning',
      summary: `Reasoning process (${steps.length} steps)`,
      details: summary,
      reasoning: steps,
      confidence: this.calculateReasoningConfidence(steps),
      visualizations: [this.createReasoningFlowchart(steps)],
    };
  }

  /**
   * Generate counterfactual scenarios (what could have happened)
   */
  private async generateCounterfactuals(
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const targetData = target as Record<string, unknown>;
    const currentOutcome = targetData?.outcome || 'unknown outcome';
    
    const counterfactuals = this.buildCounterfactuals(targetData, context);
    const summary = `Generated ${counterfactuals.length} alternative scenarios`;

    return {
      type: 'counterfactual',
      summary,
      details: this.formatCounterfactuals(counterfactuals),
      counterfactuals,
      confidence: 0.75,
      metadata: {
        currentOutcome,
        alternativeCount: counterfactuals.length,
      },
    };
  }

  /**
   * Analyze and explain causal links
   */
  private async analyzeCausalLinks(
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const causalLinks = this.identifyCausalLinks(target, context);
    const summary = `Identified ${causalLinks.length} causal relationships`;

    return {
      type: 'causal',
      summary,
      details: this.formatCausalLinks(causalLinks),
      causalLinks,
      confidence: 0.82,
      visualizations: [this.createCausalGraph(causalLinks)],
    };
  }

  /**
   * Visualize decision tree
   */
  private async visualizeDecisionTree(
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const decisionTree = this.buildDecisionTree(target, context);
    const summary = `Decision tree with ${this.countNodes(decisionTree)} nodes`;

    return {
      type: 'decision-tree',
      summary,
      details: this.formatDecisionTree(decisionTree),
      decisionTree,
      confidence: 0.88,
      visualizations: [
        this.createTreeVisualization(decisionTree),
        this.createMermaidDiagram(decisionTree),
      ],
    };
  }

  /**
   * Handle "why" queries
   */
  private async handleWhyQuery(
    query: string,
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const analysis = this.analyzeWhyQuery(query, target, context);
    const reasoning = this.generateWhyReasoning(analysis);

    return {
      type: 'why-query',
      summary: `Answer to: "${query}"`,
      details: analysis.answer,
      reasoning,
      causalLinks: analysis.causalLinks,
      confidence: analysis.confidence,
    };
  }

  /**
   * Handle "what-if" queries
   */
  private async handleWhatIfQuery(
    query: string,
    target: unknown,
    context: Record<string, unknown>
  ): Promise<ExplanationResult> {
    const scenario = this.parseWhatIfScenario(query);
    const counterfactuals = this.simulateWhatIf(scenario, target, context);
    
    return {
      type: 'what-if-query',
      summary: `Analysis of: "${query}"`,
      details: this.formatWhatIfAnalysis(counterfactuals),
      counterfactuals,
      confidence: 0.78,
      metadata: {
        originalQuery: query,
        scenarioCondition: scenario.condition,
      },
    };
  }

  // ========================================================================
  // Helper Methods for Building Rationales
  // ========================================================================

  private buildRationale(
    action: unknown,
    inputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    context: Record<string, unknown>
  ): { detailed: string; steps: ReasoningStep[] } {
    const steps: ReasoningStep[] = [];

    // Step 1: Input analysis
    steps.push({
      step: 1,
      description: 'Input Analysis',
      rationale: `Analyzed ${Object.keys(inputs).length} input parameters to understand the context and requirements`,
      confidence: 0.9,
      inputs,
    });

    // Step 2: Context evaluation
    if (context && Object.keys(context).length > 0) {
      steps.push({
        step: 2,
        description: 'Context Evaluation',
        rationale: 'Evaluated contextual information including project requirements, constraints, and previous decisions',
        confidence: 0.85,
      });
    }

    // Step 3: Action selection
    steps.push({
      step: 3,
      description: 'Action Selection',
      rationale: `Selected "${action}" as the most appropriate action based on inputs and context`,
      confidence: 0.88,
      outputs,
    });

    const detailed = `The action "${action}" was chosen through a ${steps.length}-step process. ` +
      `First, we analyzed the input parameters to understand requirements. ` +
      `Then, we evaluated the context and constraints. ` +
      `Finally, we selected the optimal action that best addresses the requirements while respecting constraints.`;

    return { detailed, steps };
  }

  // ========================================================================
  // Helper Methods for Reasoning Explanation
  // ========================================================================

  private extractReasoningSteps(
    target: unknown,
    context: Record<string, unknown>
  ): ReasoningStep[] {
    const targetData = target as Record<string, unknown>;
    const steps: ReasoningStep[] = [];

    // Extract any existing reasoning steps from target
    if (targetData?.reasoning && Array.isArray(targetData.reasoning)) {
      return targetData.reasoning as ReasoningStep[];
    }

    // Generate generic reasoning steps
    steps.push({
      step: 1,
      description: 'Problem Understanding',
      rationale: 'Analyzed the problem space and identified key requirements',
      confidence: 0.9,
    });

    steps.push({
      step: 2,
      description: 'Solution Design',
      rationale: 'Designed solution approach based on best practices and constraints',
      confidence: 0.85,
    });

    steps.push({
      step: 3,
      description: 'Implementation Planning',
      rationale: 'Created detailed implementation plan with milestones',
      confidence: 0.88,
    });

    steps.push({
      step: 4,
      description: 'Validation',
      rationale: 'Validated solution against requirements and constraints',
      confidence: 0.92,
    });

    return steps;
  }

  private summarizeReasoning(steps: ReasoningStep[]): string {
    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
    return `The reasoning process consisted of ${steps.length} steps with an average confidence of ${(avgConfidence * 100).toFixed(1)}%. ` +
      steps.map((s, i) => `Step ${i + 1}: ${s.description} - ${s.rationale}`).join('. ');
  }

  private calculateReasoningConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0.5;
    return steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
  }

  private createReasoningFlowchart(steps: ReasoningStep[]): VisualizationData {
    const mermaidDiagram = 'flowchart TD\n' +
      '  Start([Start Reasoning]) --> ' +
      steps.map((s, i) => {
        const nextStep = i < steps.length - 1 ? `Step${i + 1}` : 'End';
        return `Step${i}["${s.description}<br/>${(s.confidence * 100).toFixed(0)}% confidence"]`;
      }).join(' --> ') +
      (steps.length > 0 ? ' --> End([Complete])' : '');

    return {
      type: 'flowchart',
      format: 'mermaid',
      data: mermaidDiagram,
      description: 'Reasoning process flowchart',
    };
  }

  // ========================================================================
  // Helper Methods for Counterfactuals
  // ========================================================================

  private buildCounterfactuals(
    targetData: Record<string, unknown>,
    context: Record<string, unknown>
  ): CounterfactualScenario[] {
    const scenarios: CounterfactualScenario[] = [];
    const currentOutcome = String(targetData?.outcome || 'unknown');

    // Scenario 1: Different technology choice
    scenarios.push({
      condition: 'If a different technology stack was chosen',
      originalOutcome: currentOutcome,
      alternativeOutcome: 'Potentially faster development but higher learning curve',
      probability: 0.6,
      explanation: 'Alternative technologies might offer different trade-offs in development speed, maintainability, and performance',
    });

    // Scenario 2: More resources
    scenarios.push({
      condition: 'If more resources (time/budget) were available',
      originalOutcome: currentOutcome,
      alternativeOutcome: 'More comprehensive features and better optimization',
      probability: 0.8,
      explanation: 'Additional resources would enable more thorough implementation and testing',
    });

    // Scenario 3: Simpler approach
    scenarios.push({
      condition: 'If a simpler approach was taken',
      originalOutcome: currentOutcome,
      alternativeOutcome: 'Faster initial delivery but potentially limited scalability',
      probability: 0.7,
      explanation: 'Simplified architecture might reduce complexity but could impact long-term flexibility',
    });

    return scenarios;
  }

  private formatCounterfactuals(scenarios: CounterfactualScenario[]): string {
    return scenarios.map((s, i) =>
      `${i + 1}. ${s.condition}:\n` +
      `   Original: ${s.originalOutcome}\n` +
      `   Alternative: ${s.alternativeOutcome}\n` +
      `   Probability: ${(s.probability * 100).toFixed(0)}%\n` +
      `   Explanation: ${s.explanation}`
    ).join('\n\n');
  }

  // ========================================================================
  // Helper Methods for Causal Links
  // ========================================================================

  private identifyCausalLinks(
    target: unknown,
    context: Record<string, unknown>
  ): CausalLink[] {
    const links: CausalLink[] = [];
    const targetData = target as Record<string, unknown>;

    // Identify key factors and their relationships
    if (targetData?.requirements) {
      links.push({
        from: 'Requirements Analysis',
        to: 'Architecture Design',
        strength: 0.95,
        description: 'Requirements directly influence architecture decisions',
        evidence: ['Requirement specifications', 'Design patterns', 'Technology constraints'],
      });
    }

    if (targetData?.architecture || context?.architecture) {
      links.push({
        from: 'Architecture Design',
        to: 'Implementation Approach',
        strength: 0.9,
        description: 'Architecture determines implementation strategy and patterns',
        evidence: ['Design documents', 'Component diagrams', 'Technology stack'],
      });
    }

    links.push({
      from: 'Implementation Approach',
      to: 'Final Outcome',
      strength: 0.85,
      description: 'Implementation choices directly impact the final result',
      evidence: ['Code structure', 'Design patterns', 'Best practices'],
    });

    if (context?.constraints) {
      links.push({
        from: 'Project Constraints',
        to: 'Final Outcome',
        strength: 0.8,
        description: 'Constraints shape the scope and nature of deliverables',
        evidence: ['Budget limits', 'Time constraints', 'Resource availability'],
      });
    }

    return links;
  }

  private formatCausalLinks(links: CausalLink[]): string {
    return links.map((link, i) =>
      `${i + 1}. ${link.from} → ${link.to}\n` +
      `   Strength: ${(link.strength * 100).toFixed(0)}%\n` +
      `   Description: ${link.description}\n` +
      `   Evidence: ${link.evidence?.join(', ') || 'N/A'}`
    ).join('\n\n');
  }

  private createCausalGraph(links: CausalLink[]): VisualizationData {
    const mermaidGraph = 'graph LR\n' +
      links.map((link, i) => {
        const fromId = link.from.replace(/\s+/g, '');
        const toId = link.to.replace(/\s+/g, '');
        const strength = (link.strength * 100).toFixed(0);
        return `  ${fromId}["${link.from}"] -->|${strength}%| ${toId}["${link.to}"]`;
      }).join('\n');

    return {
      type: 'graph',
      format: 'mermaid',
      data: mermaidGraph,
      description: 'Causal relationship graph',
    };
  }

  // ========================================================================
  // Helper Methods for Decision Trees
  // ========================================================================

  private buildDecisionTree(
    target: unknown,
    context: Record<string, unknown>
  ): DecisionNode {
    const targetData = target as Record<string, unknown>;

    // Root decision node
    const root: DecisionNode = {
      id: 'root',
      label: 'Project Analysis',
      type: 'decision',
      explanation: 'Analyze project requirements and constraints',
      children: [],
    };

    // Level 1: Complexity assessment
    const complexityNode: DecisionNode = {
      id: 'complexity',
      label: 'Assess Complexity',
      type: 'condition',
      children: [
        {
          id: 'simple',
          label: 'Simple Project',
          type: 'outcome',
          probability: 0.3,
          explanation: 'Use lightweight frameworks and simple architecture',
        },
        {
          id: 'moderate',
          label: 'Moderate Project',
          type: 'outcome',
          probability: 0.5,
          explanation: 'Balance between simplicity and scalability',
        },
        {
          id: 'complex',
          label: 'Complex Project',
          type: 'outcome',
          probability: 0.2,
          explanation: 'Use robust architecture with microservices',
        },
      ],
    };

    root.children = [complexityNode];

    // Level 2: Technology selection
    const techNode: DecisionNode = {
      id: 'tech',
      label: 'Select Technology',
      type: 'decision',
      explanation: 'Choose appropriate technology stack',
      children: [
        {
          id: 'frontend',
          label: 'Frontend Framework',
          type: 'condition',
          explanation: 'React, Vue, or Angular based on requirements',
        },
        {
          id: 'backend',
          label: 'Backend Technology',
          type: 'condition',
          explanation: 'Node.js, Python, or Go based on performance needs',
        },
      ],
    };

    complexityNode.children?.forEach(child => {
      child.children = [techNode];
    });

    return root;
  }

  private countNodes(node: DecisionNode): number {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  private formatDecisionTree(node: DecisionNode, indent: string = ''): string {
    let result = `${indent}${node.label} (${node.type})`;
    if (node.explanation) {
      result += `\n${indent}  → ${node.explanation}`;
    }
    if (node.probability) {
      result += `\n${indent}  → Probability: ${(node.probability * 100).toFixed(0)}%`;
    }
    if (node.children) {
      result += '\n' + node.children.map(child =>
        this.formatDecisionTree(child, indent + '  ')
      ).join('\n');
    }
    return result;
  }

  private createTreeVisualization(root: DecisionNode): VisualizationData {
    const jsonTree = JSON.stringify(root, null, 2);
    return {
      type: 'tree',
      format: 'json',
      data: jsonTree,
      description: 'Decision tree in JSON format',
    };
  }

  private createMermaidDiagram(node: DecisionNode): VisualizationData {
    const generateMermaidNode = (n: DecisionNode, parentId?: string): string[] => {
      const lines: string[] = [];
      const nodeShape = n.type === 'decision' ? '{}' : n.type === 'condition' ? '[]' : '()';
      const [open, close] = nodeShape.split('');
      
      lines.push(`  ${n.id}${open}"${n.label}"${close}`);
      
      if (parentId) {
        lines.push(`  ${parentId} --> ${n.id}`);
      }
      
      if (n.children) {
        n.children.forEach(child => {
          lines.push(...generateMermaidNode(child, n.id));
        });
      }
      
      return lines;
    };

    const diagram = 'graph TD\n' + generateMermaidNode(node).join('\n');
    
    return {
      type: 'tree',
      format: 'mermaid',
      data: diagram,
      description: 'Decision tree diagram',
    };
  }

  // ========================================================================
  // Helper Methods for Why Queries
  // ========================================================================

  private analyzeWhyQuery(
    query: string,
    target: unknown,
    context: Record<string, unknown>
  ): {
    answer: string;
    causalLinks: CausalLink[];
    confidence: number;
  } {
    const targetData = target as Record<string, unknown>;
    
    // Extract the subject of the why query
    const subject = this.extractQuerySubject(query);
    
    // Identify relevant causal links
    const causalLinks = this.identifyCausalLinks(target, context)
      .filter(link => 
        link.from.toLowerCase().includes(subject.toLowerCase()) ||
        link.to.toLowerCase().includes(subject.toLowerCase())
      );

    // Generate answer based on causal links and context
    const answer = this.generateWhyAnswer(subject, causalLinks, targetData, context);

    return {
      answer,
      causalLinks,
      confidence: causalLinks.length > 0 ? 0.85 : 0.65,
    };
  }

  private extractQuerySubject(query: string): string {
    // Simple extraction: remove "why" and common words
    const cleaned = query.toLowerCase()
      .replace(/^why\s+/i, '')
      .replace(/\?$/g, '')
      .trim();
    return cleaned || 'this decision';
  }

  private generateWhyAnswer(
    subject: string,
    causalLinks: CausalLink[],
    targetData: Record<string, unknown>,
    context: Record<string, unknown>
  ): string {
    if (causalLinks.length === 0) {
      return `The decision regarding "${subject}" was made based on the overall project requirements and constraints. ` +
        `It represents the optimal choice given the available information and resources.`;
    }

    const primaryLink = causalLinks[0];
    return `The decision regarding "${subject}" stems from ${primaryLink.from.toLowerCase()}. ` +
      `${primaryLink.description}. ` +
      `This relationship has a strength of ${(primaryLink.strength * 100).toFixed(0)}%, ` +
      `indicating a strong causal connection. ` +
      (primaryLink.evidence ? `Evidence includes: ${primaryLink.evidence.join(', ')}.` : '');
  }

  private generateWhyReasoning(analysis: {
    answer: string;
    causalLinks: CausalLink[];
    confidence: number;
  }): ReasoningStep[] {
    const steps: ReasoningStep[] = [];

    steps.push({
      step: 1,
      description: 'Query Analysis',
      rationale: 'Analyzed the why query to identify the subject and context',
      confidence: 0.9,
    });

    if (analysis.causalLinks.length > 0) {
      steps.push({
        step: 2,
        description: 'Causal Link Identification',
        rationale: `Identified ${analysis.causalLinks.length} relevant causal relationships`,
        confidence: 0.88,
      });
    }

    steps.push({
      step: 3,
      description: 'Answer Generation',
      rationale: 'Generated comprehensive answer based on causal analysis',
      confidence: analysis.confidence,
    });

    return steps;
  }

  // ========================================================================
  // Helper Methods for What-If Queries
  // ========================================================================

  private parseWhatIfScenario(query: string): { condition: string } {
    // Extract the condition from the what-if query
    const condition = query
      .toLowerCase()
      .replace(/^what\s+if\s+/i, '')
      .replace(/\?$/g, '')
      .trim();

    return {
      condition: condition || 'alternative scenario',
    };
  }

  private simulateWhatIf(
    scenario: { condition: string },
    target: unknown,
    context: Record<string, unknown>
  ): CounterfactualScenario[] {
    const targetData = target as Record<string, unknown>;
    const currentOutcome = String(targetData?.outcome || 'current outcome');

    // Generate counterfactual scenarios based on the what-if condition
    const scenarios: CounterfactualScenario[] = [];

    scenarios.push({
      condition: scenario.condition,
      originalOutcome: currentOutcome,
      alternativeOutcome: `Modified outcome based on: ${scenario.condition}`,
      probability: 0.7,
      explanation: `If ${scenario.condition}, the project would likely take a different path, ` +
        `potentially affecting timeline, resource allocation, and final deliverables.`,
    });

    // Add related scenarios
    scenarios.push({
      condition: `${scenario.condition} (optimistic case)`,
      originalOutcome: currentOutcome,
      alternativeOutcome: 'Best-case scenario with favorable conditions',
      probability: 0.5,
      explanation: 'Under ideal circumstances, this change could lead to improved outcomes',
    });

    scenarios.push({
      condition: `${scenario.condition} (conservative case)`,
      originalOutcome: currentOutcome,
      alternativeOutcome: 'Conservative approach with minimal risk',
      probability: 0.8,
      explanation: 'Taking a cautious approach would reduce risk but might limit potential gains',
    });

    return scenarios;
  }

  private formatWhatIfAnalysis(scenarios: CounterfactualScenario[]): string {
    return 'What-If Analysis Results:\n\n' +
      scenarios.map((s, i) =>
        `Scenario ${i + 1}: ${s.condition}\n` +
        `  Original: ${s.originalOutcome}\n` +
        `  If changed: ${s.alternativeOutcome}\n` +
        `  Probability: ${(s.probability * 100).toFixed(0)}%\n` +
        `  ${s.explanation}`
      ).join('\n\n');
  }

  // ========================================================================
  // General Helper Methods
  // ========================================================================

  private generateSuggestions(explanation: ExplanationResult): string[] {
    const suggestions: string[] = [];

    if (explanation.confidence < 0.7) {
      suggestions.push('Consider gathering more context for higher confidence');
    }

    if (explanation.type === 'decision-tree') {
      suggestions.push('Review decision paths for optimization opportunities');
      suggestions.push('Validate assumptions at each decision node');
    }

    if (explanation.type === 'counterfactual') {
      suggestions.push('Evaluate alternative scenarios for risk mitigation');
      suggestions.push('Consider hybrid approaches that combine best aspects');
    }

    if (explanation.type === 'causal') {
      suggestions.push('Strengthen weak causal links through additional evidence');
      suggestions.push('Document causal relationships for future reference');
    }

    if (explanation.reasoning && explanation.reasoning.length > 0) {
      const avgConfidence = explanation.reasoning.reduce((s, r) => s + r.confidence, 0) / 
        explanation.reasoning.length;
      if (avgConfidence < 0.8) {
        suggestions.push('Review low-confidence reasoning steps for improvement');
      }
    }

    return suggestions;
  }

  private generateNextSteps(explanation: ExplanationResult): string[] {
    const steps: string[] = [];

    switch (explanation.type) {
      case 'rationale':
        steps.push('Review rationale with stakeholders');
        steps.push('Document decision for future reference');
        break;
      case 'reasoning':
        steps.push('Validate reasoning steps against requirements');
        steps.push('Share reasoning chain with team');
        break;
      case 'counterfactual':
        steps.push('Evaluate feasibility of alternative scenarios');
        steps.push('Consider risk mitigation strategies');
        break;
      case 'causal':
        steps.push('Strengthen causal links with additional evidence');
        steps.push('Update causal model as new information emerges');
        break;
      case 'decision-tree':
        steps.push('Review decision paths with domain experts');
        steps.push('Update probabilities based on feedback');
        break;
      case 'why-query':
      case 'what-if-query':
        steps.push('Validate answer against domain knowledge');
        steps.push('Refine query for more specific insights');
        break;
    }

    steps.push('Document explanation for audit trail');
    steps.push('Use insights to improve future decisions');

    return steps;
  }
}
