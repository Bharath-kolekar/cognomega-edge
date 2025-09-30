/**
 * Causal Reasoning Agent
 * Builds causal models, predicts intervention effects, and selects optimal interventions
 * Uses causal inference and structural causal modeling for decision-making
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult } from './types';

// ============================================================================
// Causal Graph Interface
// ============================================================================

/**
 * Represents a node in the causal graph
 */
export interface CausalNode {
  id: string;
  name: string;
  type: 'observable' | 'latent' | 'intervention';
  value?: number | string;
  metadata?: Record<string, unknown>;
}

/**
 * Represents an edge (causal relationship) in the causal graph
 */
export interface CausalEdge {
  from: string;
  to: string;
  strength: number; // 0-1, strength of causal relationship
  type: 'direct' | 'confounded' | 'mediated';
  confidence?: number; // 0-1, confidence in this relationship
}

/**
 * CausalGraph interface for representing and manipulating causal structures
 */
export interface CausalGraph {
  nodes: Map<string, CausalNode>;
  edges: CausalEdge[];
  
  /**
   * Add a node to the causal graph
   */
  addNode(node: CausalNode): void;
  
  /**
   * Add a causal edge between nodes
   */
  addEdge(edge: CausalEdge): void;
  
  /**
   * Get all nodes that causally influence a given node
   */
  getParents(nodeId: string): CausalNode[];
  
  /**
   * Get all nodes that are causally influenced by a given node
   */
  getChildren(nodeId: string): CausalNode[];
  
  /**
   * Check if there's a causal path from source to target
   */
  hasCausalPath(fromId: string, toId: string): boolean;
  
  /**
   * Find all confounding variables affecting a relationship
   */
  findConfounders(fromId: string, toId: string): CausalNode[];
  
  /**
   * Compute the total causal effect from one node to another
   */
  computeCausalEffect(fromId: string, toId: string): number;
}

/**
 * Basic implementation of CausalGraph
 */
export class SimpleCausalGraph implements CausalGraph {
  public nodes: Map<string, CausalNode>;
  public edges: CausalEdge[];

  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(node: CausalNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: CausalEdge): void {
    // Validate that both nodes exist
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      throw new Error(`Cannot add edge: nodes ${edge.from} or ${edge.to} do not exist`);
    }
    this.edges.push(edge);
  }

  getParents(nodeId: string): CausalNode[] {
    return this.edges
      .filter(edge => edge.to === nodeId)
      .map(edge => this.nodes.get(edge.from))
      .filter((node): node is CausalNode => node !== undefined);
  }

  getChildren(nodeId: string): CausalNode[] {
    return this.edges
      .filter(edge => edge.from === nodeId)
      .map(edge => this.nodes.get(edge.to))
      .filter((node): node is CausalNode => node !== undefined);
  }

  hasCausalPath(fromId: string, toId: string): boolean {
    if (fromId === toId) return true;
    
    const visited = new Set<string>();
    const queue = [fromId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === toId) return true;
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      const children = this.getChildren(current);
      queue.push(...children.map(c => c.id));
    }
    
    return false;
  }

  findConfounders(fromId: string, toId: string): CausalNode[] {
    const confounders: CausalNode[] = [];
    
    // A confounder is a node that causally affects both fromId and toId
    for (const [nodeId, node] of this.nodes) {
      if (nodeId !== fromId && nodeId !== toId) {
        if (this.hasCausalPath(nodeId, fromId) && this.hasCausalPath(nodeId, toId)) {
          confounders.push(node);
        }
      }
    }
    
    return confounders;
  }

  computeCausalEffect(fromId: string, toId: string): number {
    // Find direct edge
    const directEdge = this.edges.find(e => e.from === fromId && e.to === toId);
    if (directEdge) {
      return directEdge.strength;
    }
    
    // Compute indirect effects through mediators
    const children = this.getChildren(fromId);
    let totalEffect = 0;
    
    for (const child of children) {
      if (this.hasCausalPath(child.id, toId)) {
        const edgeStrength = this.edges.find(e => e.from === fromId && e.to === child.id)?.strength || 0;
        const childEffect = this.computeCausalEffect(child.id, toId);
        totalEffect += edgeStrength * childEffect;
      }
    }
    
    return Math.min(totalEffect, 1.0);
  }
}

// ============================================================================
// Intervention Simulator Interface
// ============================================================================

/**
 * Represents an intervention on a causal system
 */
export interface Intervention {
  targetNode: string;
  value: number | string;
  type: 'do' | 'condition' | 'counterfactual';
  description?: string;
}

/**
 * Result of simulating an intervention
 */
export interface InterventionResult {
  intervention: Intervention;
  affectedNodes: Map<string, number | string>;
  expectedOutcome: number;
  confidence: number;
  causalPathways: string[][];
  warnings?: string[];
}

/**
 * InterventionSimulator interface for predicting effects of interventions
 */
export interface InterventionSimulator {
  /**
   * Simulate the effect of an intervention on the causal graph
   */
  simulate(graph: CausalGraph, intervention: Intervention): Promise<InterventionResult>;
  
  /**
   * Compare multiple interventions to find the optimal one
   */
  compareInterventions(
    graph: CausalGraph,
    interventions: Intervention[],
    targetNode: string
  ): Promise<InterventionResult[]>;
  
  /**
   * Predict counterfactual outcomes
   */
  predictCounterfactual(
    graph: CausalGraph,
    intervention: Intervention,
    observedData: Record<string, unknown>
  ): Promise<InterventionResult>;
}

/**
 * Basic implementation of InterventionSimulator
 */
export class SimpleInterventionSimulator implements InterventionSimulator {
  async simulate(graph: CausalGraph, intervention: Intervention): Promise<InterventionResult> {
    const affectedNodes = new Map<string, number | string>();
    const causalPathways: string[][] = [];
    const warnings: string[] = [];
    
    // Set the intervention value
    const targetNode = graph.nodes.get(intervention.targetNode);
    if (!targetNode) {
      throw new Error(`Target node ${intervention.targetNode} not found`);
    }
    
    affectedNodes.set(intervention.targetNode, intervention.value);
    
    // Propagate effects through the causal graph
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: intervention.targetNode, path: [intervention.targetNode] }
    ];
    
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const children = graph.getChildren(nodeId);
      
      for (const child of children) {
        const effect = graph.computeCausalEffect(nodeId, child.id);
        
        // Simulate the propagated effect
        if (typeof intervention.value === 'number') {
          const currentValue = affectedNodes.get(child.id) as number || 0;
          affectedNodes.set(child.id, currentValue + intervention.value * effect);
        }
        
        const newPath = [...path, child.id];
        causalPathways.push(newPath);
        queue.push({ nodeId: child.id, path: newPath });
        
        // Check for potential confounding
        const confounders = graph.findConfounders(intervention.targetNode, child.id);
        if (confounders.length > 0) {
          warnings.push(
            `Potential confounding in path to ${child.id} by: ${confounders.map(c => c.name).join(', ')}`
          );
        }
      }
    }
    
    // Calculate expected outcome (average of all affected nodes)
    const values = Array.from(affectedNodes.values())
      .filter((v): v is number => typeof v === 'number');
    const expectedOutcome = values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0;
    
    // Calculate confidence based on pathway strength and confounding
    const confidence = Math.max(0.5, 1.0 - (warnings.length * 0.1));
    
    return {
      intervention,
      affectedNodes,
      expectedOutcome,
      confidence,
      causalPathways,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async compareInterventions(
    graph: CausalGraph,
    interventions: Intervention[],
    targetNode: string
  ): Promise<InterventionResult[]> {
    const results: InterventionResult[] = [];
    
    for (const intervention of interventions) {
      const result = await this.simulate(graph, intervention);
      
      // Calculate effectiveness for the target node
      const targetEffect = result.affectedNodes.get(targetNode);
      if (typeof targetEffect === 'number') {
        result.expectedOutcome = targetEffect;
      }
      
      results.push(result);
    }
    
    // Sort by expected outcome (descending)
    return results.sort((a, b) => b.expectedOutcome - a.expectedOutcome);
  }

  async predictCounterfactual(
    graph: CausalGraph,
    intervention: Intervention,
    observedData: Record<string, unknown>
  ): Promise<InterventionResult> {
    // For counterfactuals, we simulate what would have happened differently
    const result = await this.simulate(graph, intervention);
    
    // Adjust based on observed data
    for (const [nodeId, observedValue] of Object.entries(observedData)) {
      if (result.affectedNodes.has(nodeId)) {
        const predictedValue = result.affectedNodes.get(nodeId);
        result.warnings = result.warnings || [];
        result.warnings.push(
          `Counterfactual for ${nodeId}: predicted=${predictedValue}, observed=${observedValue}`
        );
      }
    }
    
    return result;
  }
}

// ============================================================================
// Causal Reasoning Agent
// ============================================================================

/**
 * CausalReasoningAgent - Specialized agent for causal inference and intervention planning
 * 
 * This agent builds causal models, predicts intervention effects, and selects optimal interventions
 * using structural causal modeling and do-calculus principles.
 * 
 * Capabilities:
 * - Build causal graphs from data or domain knowledge
 * - Identify causal relationships and confounders
 * - Simulate intervention effects
 * - Compare multiple interventions
 * - Predict counterfactual outcomes
 * - Recommend optimal interventions
 */
export class CausalReasoningAgent extends BaseAgent {
  private causalGraphs: Map<string, CausalGraph>;
  private interventionSimulator: InterventionSimulator;

  constructor() {
    super(
      'planning', // Reusing 'planning' type as it's closest to reasoning
      'CausalReasoningAgent',
      [
        'causal-modeling',
        'causal-inference',
        'intervention-planning',
        'counterfactual-reasoning',
        'effect-prediction',
        'optimal-intervention-selection',
      ],
      9 // High priority
    );
    
    this.causalGraphs = new Map();
    this.interventionSimulator = new SimpleInterventionSimulator();
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing causal reasoning task: ${task.id}`);

    try {
      const { action, payload } = task.payload as {
        action: 'build-model' | 'predict-intervention' | 'select-optimal' | 'counterfactual';
        payload: Record<string, unknown>;
      };

      let result: unknown;

      switch (action) {
        case 'build-model':
          result = await this.buildCausalModel(payload);
          break;
        case 'predict-intervention':
          result = await this.predictIntervention(payload);
          break;
        case 'select-optimal':
          result = await this.selectOptimalIntervention(payload);
          break;
        case 'counterfactual':
          result = await this.analyzeCounterfactual(payload);
          break;
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }

      return {
        success: true,
        data: result,
        metadata: {
          duration: 0, // Will be set by base class
          confidence: this.calculateConfidence(result),
          suggestions: this.generateSuggestions(result),
        },
        nextSteps: this.generateNextSteps(action),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process causal reasoning task',
      };
    }
  }

  /**
   * Build a causal model from provided data or domain knowledge
   */
  private async buildCausalModel(payload: Record<string, unknown>): Promise<{
    graphId: string;
    graph: CausalGraph;
    nodes: CausalNode[];
    edges: CausalEdge[];
    insights: string[];
  }> {
    const { graphId, nodes, edges, domain } = payload as {
      graphId?: string;
      nodes?: CausalNode[];
      edges?: CausalEdge[];
      domain?: string;
    };

    const id = graphId || `graph-${Date.now()}`;
    const graph = new SimpleCausalGraph();

    // If nodes and edges provided, use them
    if (nodes && edges) {
      nodes.forEach(node => graph.addNode(node));
      edges.forEach(edge => graph.addEdge(edge));
    } else if (domain) {
      // Build example model based on domain
      this.buildDomainModel(graph, domain);
    } else {
      throw new Error('Either nodes/edges or domain must be provided');
    }

    // Store the graph
    this.causalGraphs.set(id, graph);

    // Generate insights
    const insights = this.analyzeGraphStructure(graph);

    return {
      graphId: id,
      graph,
      nodes: Array.from(graph.nodes.values()),
      edges: graph.edges,
      insights,
    };
  }

  /**
   * Predict the effect of a specific intervention
   */
  private async predictIntervention(payload: Record<string, unknown>): Promise<InterventionResult> {
    const { graphId, intervention } = payload as {
      graphId: string;
      intervention: Intervention;
    };

    const graph = this.causalGraphs.get(graphId);
    if (!graph) {
      throw new Error(`Causal graph ${graphId} not found. Please build a model first.`);
    }

    return await this.interventionSimulator.simulate(graph, intervention);
  }

  /**
   * Select the optimal intervention from multiple candidates
   */
  private async selectOptimalIntervention(payload: Record<string, unknown>): Promise<{
    optimal: InterventionResult;
    allResults: InterventionResult[];
    reasoning: string;
  }> {
    const { graphId, interventions, targetNode } = payload as {
      graphId: string;
      interventions: Intervention[];
      targetNode: string;
    };

    const graph = this.causalGraphs.get(graphId);
    if (!graph) {
      throw new Error(`Causal graph ${graphId} not found. Please build a model first.`);
    }

    const results = await this.interventionSimulator.compareInterventions(
      graph,
      interventions,
      targetNode
    );

    const optimal = results[0];
    const reasoning = this.generateInterventionReasoning(optimal, results);

    return {
      optimal,
      allResults: results,
      reasoning,
    };
  }

  /**
   * Analyze counterfactual scenarios
   */
  private async analyzeCounterfactual(payload: Record<string, unknown>): Promise<InterventionResult> {
    const { graphId, intervention, observedData } = payload as {
      graphId: string;
      intervention: Intervention;
      observedData: Record<string, unknown>;
    };

    const graph = this.causalGraphs.get(graphId);
    if (!graph) {
      throw new Error(`Causal graph ${graphId} not found. Please build a model first.`);
    }

    return await this.interventionSimulator.predictCounterfactual(
      graph,
      intervention,
      observedData
    );
  }

  /**
   * Build a domain-specific causal model
   */
  private buildDomainModel(graph: CausalGraph, domain: string): void {
    // Example models for different domains
    switch (domain.toLowerCase()) {
      case 'marketing':
        this.buildMarketingModel(graph);
        break;
      case 'healthcare':
        this.buildHealthcareModel(graph);
        break;
      case 'software':
        this.buildSoftwareModel(graph);
        break;
      default:
        // Build a generic model
        this.buildGenericModel(graph);
    }
  }

  /**
   * Build a marketing causal model
   */
  private buildMarketingModel(graph: CausalGraph): void {
    // Nodes
    graph.addNode({ id: 'ad_spend', name: 'Ad Spend', type: 'intervention' });
    graph.addNode({ id: 'impressions', name: 'Impressions', type: 'observable' });
    graph.addNode({ id: 'clicks', name: 'Clicks', type: 'observable' });
    graph.addNode({ id: 'conversions', name: 'Conversions', type: 'observable' });
    graph.addNode({ id: 'revenue', name: 'Revenue', type: 'observable' });
    graph.addNode({ id: 'brand_awareness', name: 'Brand Awareness', type: 'latent' });

    // Edges (causal relationships)
    graph.addEdge({ from: 'ad_spend', to: 'impressions', strength: 0.8, type: 'direct', confidence: 0.9 });
    graph.addEdge({ from: 'impressions', to: 'clicks', strength: 0.3, type: 'direct', confidence: 0.85 });
    graph.addEdge({ from: 'clicks', to: 'conversions', strength: 0.5, type: 'direct', confidence: 0.8 });
    graph.addEdge({ from: 'conversions', to: 'revenue', strength: 0.9, type: 'direct', confidence: 0.95 });
    graph.addEdge({ from: 'impressions', to: 'brand_awareness', strength: 0.4, type: 'mediated', confidence: 0.7 });
    graph.addEdge({ from: 'brand_awareness', to: 'conversions', strength: 0.3, type: 'mediated', confidence: 0.6 });
  }

  /**
   * Build a healthcare causal model
   */
  private buildHealthcareModel(graph: CausalGraph): void {
    // Nodes
    graph.addNode({ id: 'treatment', name: 'Treatment', type: 'intervention' });
    graph.addNode({ id: 'dosage', name: 'Dosage', type: 'intervention' });
    graph.addNode({ id: 'symptoms', name: 'Symptoms', type: 'observable' });
    graph.addNode({ id: 'recovery', name: 'Recovery Rate', type: 'observable' });
    graph.addNode({ id: 'side_effects', name: 'Side Effects', type: 'observable' });
    graph.addNode({ id: 'patient_age', name: 'Patient Age', type: 'observable' });

    // Edges
    graph.addEdge({ from: 'treatment', to: 'symptoms', strength: 0.7, type: 'direct', confidence: 0.85 });
    graph.addEdge({ from: 'dosage', to: 'symptoms', strength: 0.6, type: 'direct', confidence: 0.8 });
    graph.addEdge({ from: 'dosage', to: 'side_effects', strength: 0.5, type: 'direct', confidence: 0.75 });
    graph.addEdge({ from: 'symptoms', to: 'recovery', strength: 0.8, type: 'direct', confidence: 0.9 });
    graph.addEdge({ from: 'patient_age', to: 'recovery', strength: 0.4, type: 'confounded', confidence: 0.7 });
    graph.addEdge({ from: 'patient_age', to: 'side_effects', strength: 0.3, type: 'confounded', confidence: 0.65 });
  }

  /**
   * Build a software engineering causal model
   */
  private buildSoftwareModel(graph: CausalGraph): void {
    // Nodes
    graph.addNode({ id: 'code_review', name: 'Code Review', type: 'intervention' });
    graph.addNode({ id: 'testing', name: 'Testing Coverage', type: 'intervention' });
    graph.addNode({ id: 'code_quality', name: 'Code Quality', type: 'observable' });
    graph.addNode({ id: 'bugs', name: 'Bug Count', type: 'observable' });
    graph.addNode({ id: 'deployment_freq', name: 'Deployment Frequency', type: 'observable' });
    graph.addNode({ id: 'team_experience', name: 'Team Experience', type: 'observable' });

    // Edges
    graph.addEdge({ from: 'code_review', to: 'code_quality', strength: 0.7, type: 'direct', confidence: 0.85 });
    graph.addEdge({ from: 'testing', to: 'bugs', strength: 0.6, type: 'direct', confidence: 0.8 });
    graph.addEdge({ from: 'code_quality', to: 'bugs', strength: 0.5, type: 'direct', confidence: 0.75 });
    graph.addEdge({ from: 'bugs', to: 'deployment_freq', strength: 0.4, type: 'direct', confidence: 0.7 });
    graph.addEdge({ from: 'team_experience', to: 'code_quality', strength: 0.5, type: 'confounded', confidence: 0.7 });
    graph.addEdge({ from: 'team_experience', to: 'bugs', strength: 0.3, type: 'confounded', confidence: 0.65 });
  }

  /**
   * Build a generic causal model
   */
  private buildGenericModel(graph: CausalGraph): void {
    // Simple generic model
    graph.addNode({ id: 'input', name: 'Input Variable', type: 'intervention' });
    graph.addNode({ id: 'mediator', name: 'Mediator', type: 'observable' });
    graph.addNode({ id: 'output', name: 'Output Variable', type: 'observable' });
    graph.addNode({ id: 'confounder', name: 'Confounder', type: 'latent' });

    graph.addEdge({ from: 'input', to: 'mediator', strength: 0.6, type: 'direct', confidence: 0.8 });
    graph.addEdge({ from: 'mediator', to: 'output', strength: 0.7, type: 'direct', confidence: 0.85 });
    graph.addEdge({ from: 'confounder', to: 'input', strength: 0.3, type: 'confounded', confidence: 0.6 });
    graph.addEdge({ from: 'confounder', to: 'output', strength: 0.4, type: 'confounded', confidence: 0.65 });
  }

  /**
   * Analyze causal graph structure
   */
  private analyzeGraphStructure(graph: CausalGraph): string[] {
    const insights: string[] = [];
    
    const nodeCount = graph.nodes.size;
    const edgeCount = graph.edges.length;
    
    insights.push(`Causal model has ${nodeCount} nodes and ${edgeCount} causal relationships`);
    
    // Count intervention nodes
    const interventionNodes = Array.from(graph.nodes.values()).filter(n => n.type === 'intervention');
    insights.push(`${interventionNodes.length} intervention points identified`);
    
    // Count confounded relationships
    const confoundedEdges = graph.edges.filter(e => e.type === 'confounded');
    if (confoundedEdges.length > 0) {
      insights.push(`Warning: ${confoundedEdges.length} confounded relationships detected`);
    }
    
    // Identify strongly connected nodes
    const strongEdges = graph.edges.filter(e => e.strength > 0.7);
    if (strongEdges.length > 0) {
      insights.push(`${strongEdges.length} strong causal relationships (strength > 0.7)`);
    }
    
    return insights;
  }

  /**
   * Generate reasoning for intervention selection
   */
  private generateInterventionReasoning(optimal: InterventionResult, all: InterventionResult[]): string {
    const reasoning: string[] = [];
    
    reasoning.push(`Selected intervention: ${optimal.intervention.description || optimal.intervention.targetNode}`);
    reasoning.push(`Expected outcome: ${optimal.expectedOutcome.toFixed(2)} (confidence: ${(optimal.confidence * 100).toFixed(1)}%)`);
    reasoning.push(`Affects ${optimal.affectedNodes.size} nodes through ${optimal.causalPathways.length} causal pathways`);
    
    if (all.length > 1) {
      const secondBest = all[1];
      const improvement = ((optimal.expectedOutcome - secondBest.expectedOutcome) / secondBest.expectedOutcome * 100);
      reasoning.push(`This is ${improvement.toFixed(1)}% better than the next best option`);
    }
    
    if (optimal.warnings && optimal.warnings.length > 0) {
      reasoning.push(`Note: ${optimal.warnings.length} potential confounding factors identified`);
    }
    
    return reasoning.join('\n');
  }

  /**
   * Calculate confidence score for result
   */
  private calculateConfidence(result: unknown): number {
    if (!result || typeof result !== 'object') return 0.7;
    
    if ('confidence' in result && typeof result.confidence === 'number') {
      return result.confidence;
    }
    
    if ('optimal' in result && typeof result.optimal === 'object' && result.optimal) {
      const optimal = result.optimal as InterventionResult;
      return optimal.confidence || 0.8;
    }
    
    return 0.75;
  }

  /**
   * Generate suggestions based on result
   */
  private generateSuggestions(result: unknown): string[] {
    const suggestions: string[] = [];
    
    if (result && typeof result === 'object') {
      if ('warnings' in result && Array.isArray(result.warnings) && result.warnings.length > 0) {
        suggestions.push('Review identified confounders before implementing intervention');
      }
      
      if ('insights' in result && Array.isArray(result.insights)) {
        const insights = result.insights as string[];
        if (insights.some(i => i.includes('confounded'))) {
          suggestions.push('Consider using instrumental variables to address confounding');
        }
      }
      
      if ('causalPathways' in result && Array.isArray(result.causalPathways)) {
        const pathways = result.causalPathways as string[][];
        if (pathways.length > 5) {
          suggestions.push('Multiple causal pathways detected - monitor indirect effects');
        }
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Model looks good - proceed with caution and monitor outcomes');
    }
    
    return suggestions;
  }

  /**
   * Generate next steps based on action
   */
  private generateNextSteps(action: string): string[] {
    switch (action) {
      case 'build-model':
        return [
          'Validate causal relationships with domain experts',
          'Test interventions to predict effects',
          'Refine model based on observed data',
        ];
      case 'predict-intervention':
        return [
          'Review affected nodes and causal pathways',
          'Check for confounding factors',
          'Compare with alternative interventions',
        ];
      case 'select-optimal':
        return [
          'Implement selected intervention',
          'Monitor outcomes and collect data',
          'Update causal model based on results',
        ];
      case 'counterfactual':
        return [
          'Compare predicted vs observed outcomes',
          'Identify discrepancies in causal model',
          'Refine model to improve predictions',
        ];
      default:
        return ['Continue causal analysis'];
    }
  }
}
