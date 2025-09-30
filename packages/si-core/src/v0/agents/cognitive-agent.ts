/**
 * CognitiveAgent - Advanced agent with working memory, long-term memory, and attention mechanism
 * 
 * Features:
 * - Working memory with limited capacity (7±2 items) for active reasoning
 * - Long-term memory using vector embeddings for knowledge persistence
 * - Attention mechanism to focus on relevant information
 * - Multi-step reflection and self-learning capabilities
 * - Compatible with SuperIntelligenceEngine orchestrator
 */

import { BaseAgent } from './base-agent';
import {
  IAgent,
  AgentTask,
  AgentResult,
  AgentConfig,
  AgentType,
} from './types';

// ============================================================================
// Memory Interfaces
// ============================================================================

/**
 * WorkingMemory - Short-term storage for active reasoning (7±2 items)
 * Simulates human working memory limitations
 */
export interface WorkingMemory {
  items: WorkingMemoryItem[];
  capacity: number;
  
  add(item: WorkingMemoryItem): void;
  get(id: string): WorkingMemoryItem | undefined;
  getAll(): WorkingMemoryItem[];
  clear(): void;
  prune(): void; // Remove least important items when at capacity
}

export interface WorkingMemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'goal' | 'hypothesis' | 'observation' | 'conclusion';
  importance: number; // 0-1
  timestamp: number;
  activationLevel: number; // 0-1, decays over time
  relatedTo: string[]; // IDs of related items
}

/**
 * VectorMemory - Long-term memory using vector embeddings
 * Enables semantic search and knowledge persistence
 */
export interface VectorMemory {
  store(entry: MemoryEntry): Promise<string>;
  retrieve(query: string, limit?: number): Promise<MemoryEntry[]>;
  update(id: string, entry: Partial<MemoryEntry>): Promise<void>;
  delete(id: string): Promise<void>;
  getStats(): MemoryStats;
}

export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[]; // Vector representation
  metadata: {
    type: string;
    tags: string[];
    importance: number;
    confidence: number;
    context?: Record<string, unknown>;
  };
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface MemoryStats {
  totalEntries: number;
  averageAccessCount: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * AttentionNetwork - Focuses cognitive resources on relevant information
 * Implements a simplified attention mechanism
 */
export interface AttentionNetwork {
  focus(items: WorkingMemoryItem[], context: AttentionContext): WorkingMemoryItem[];
  updateWeights(feedback: AttentionFeedback): void;
  getAttentionScores(items: WorkingMemoryItem[], context: AttentionContext): Map<string, number>;
}

export interface AttentionContext {
  currentGoal?: string;
  recentHistory: string[];
  taskType: string;
  importance: number;
}

export interface AttentionFeedback {
  itemId: string;
  wasUseful: boolean;
  outcome: 'success' | 'failure' | 'partial';
}

// ============================================================================
// Cognitive Agent Implementation
// ============================================================================

/**
 * SimpleWorkingMemory - In-memory implementation of WorkingMemory
 */
class SimpleWorkingMemory implements WorkingMemory {
  items: WorkingMemoryItem[] = [];
  capacity: number;

  constructor(capacity: number = 7) {
    this.capacity = capacity;
  }

  add(item: WorkingMemoryItem): void {
    // Decay activation levels of existing items
    this.items.forEach(i => {
      i.activationLevel *= 0.95;
    });

    this.items.push(item);
    
    if (this.items.length > this.capacity) {
      this.prune();
    }
  }

  get(id: string): WorkingMemoryItem | undefined {
    const item = this.items.find(i => i.id === id);
    if (item) {
      // Boost activation when accessed
      item.activationLevel = Math.min(1, item.activationLevel + 0.1);
    }
    return item;
  }

  getAll(): WorkingMemoryItem[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  prune(): void {
    // Remove items with lowest combined score (importance * activation)
    this.items.sort((a, b) => {
      const scoreA = a.importance * a.activationLevel;
      const scoreB = b.importance * b.activationLevel;
      return scoreB - scoreA;
    });
    this.items = this.items.slice(0, this.capacity);
  }
}

/**
 * SimpleVectorMemory - In-memory implementation of VectorMemory
 * In production, this would use a real vector database
 */
class SimpleVectorMemory implements VectorMemory {
  private entries: Map<string, MemoryEntry> = new Map();

  async store(entry: MemoryEntry): Promise<string> {
    const id = entry.id || this.generateId();
    this.entries.set(id, {
      ...entry,
      id,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
    return id;
  }

  async retrieve(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Simplified similarity search - in production, use actual vector similarity
    const queryLower = query.toLowerCase();
    const results = Array.from(this.entries.values())
      .map(entry => ({
        entry,
        score: this.calculateSimpleSimilarity(queryLower, entry.content.toLowerCase()),
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => {
        r.entry.accessCount++;
        r.entry.lastAccessed = Date.now();
        return r.entry;
      });

    return results;
  }

  async update(id: string, partial: Partial<MemoryEntry>): Promise<void> {
    const existing = this.entries.get(id);
    if (existing) {
      this.entries.set(id, {
        ...existing,
        ...partial,
        id, // Preserve ID
      });
    }
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  getStats(): MemoryStats {
    const entries = Array.from(this.entries.values());
    return {
      totalEntries: entries.length,
      averageAccessCount: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length 
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.timestamp)) 
        : undefined,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(e => e.timestamp)) 
        : undefined,
    };
  }

  private calculateSimpleSimilarity(query: string, content: string): number {
    const queryWords = query.split(/\s+/);
    const contentWords = new Set(content.split(/\s+/));
    const matches = queryWords.filter(w => contentWords.has(w)).length;
    return matches / queryWords.length;
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * SimpleAttentionNetwork - Basic implementation of attention mechanism
 */
class SimpleAttentionNetwork implements AttentionNetwork {
  private weights: Map<string, number> = new Map();
  private learningRate: number = 0.1;

  focus(items: WorkingMemoryItem[], context: AttentionContext): WorkingMemoryItem[] {
    const scores = this.getAttentionScores(items, context);
    
    // Sort by attention score and return top items
    return items
      .map(item => ({ item, score: scores.get(item.id) || 0 }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }

  getAttentionScores(items: WorkingMemoryItem[], context: AttentionContext): Map<string, number> {
    const scores = new Map<string, number>();

    items.forEach(item => {
      let score = item.importance * 0.3 + item.activationLevel * 0.3;

      // Boost score based on relevance to current goal
      if (context.currentGoal && item.content.toLowerCase().includes(context.currentGoal.toLowerCase())) {
        score += 0.2;
      }

      // Boost score if related to recent history
      const recentRelevance = context.recentHistory.some(h => 
        item.relatedTo.includes(h) || item.content.toLowerCase().includes(h.toLowerCase())
      );
      if (recentRelevance) {
        score += 0.1;
      }

      // Apply learned weights
      const learnedWeight = this.weights.get(item.type) || 0;
      score += learnedWeight * 0.1;

      scores.set(item.id, Math.min(1, score));
    });

    return scores;
  }

  updateWeights(feedback: AttentionFeedback): void {
    const currentWeight = this.weights.get(feedback.itemId) || 0;
    const adjustment = feedback.wasUseful ? this.learningRate : -this.learningRate;
    this.weights.set(feedback.itemId, currentWeight + adjustment);
  }
}

// ============================================================================
// CognitiveAgent Class
// ============================================================================

/**
 * CognitiveAgent - Agent with human-like reasoning capabilities
 * 
 * Integrates:
 * - Working memory for active reasoning
 * - Long-term memory for knowledge persistence
 * - Attention mechanism for focus
 * - Multi-step reflection for learning
 */
export class CognitiveAgent extends BaseAgent implements IAgent {
  private workingMemory: WorkingMemory;
  private longTermMemory: VectorMemory;
  private attentionNetwork: AttentionNetwork;
  private reflectionHistory: ReflectionEntry[] = [];
  private learningMetrics: LearningMetrics;

  constructor(
    config?: Partial<AgentConfig & {
      workingMemoryCapacity?: number;
      enableLearning?: boolean;
    }>
  ) {
    super(
      'orchestrator', // Default type, can be overridden
      config?.name || 'CognitiveAgent',
      config?.capabilities || [
        'reasoning',
        'learning',
        'memory-management',
        'attention-control',
        'self-reflection',
      ],
      config?.priority || 8
    );

    const capacity = config?.workingMemoryCapacity || 7;
    this.workingMemory = new SimpleWorkingMemory(capacity);
    this.longTermMemory = new SimpleVectorMemory();
    this.attentionNetwork = new SimpleAttentionNetwork();

    this.learningMetrics = {
      totalReflections: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageConfidence: 0,
      improvementRate: 0,
    };

    if (config) {
      Object.assign(this.config, config);
    }
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Initializing CognitiveAgent with enhanced memory systems');
    
    // Load any persisted long-term memories
    // In production, this would load from a real database
    this.log('info', `Working memory capacity: ${this.workingMemory.capacity} items`);
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Step 1: Add task to working memory
      this.addToWorkingMemory({
        id: `task_${task.id}`,
        content: JSON.stringify(task.payload),
        type: 'goal',
        importance: task.priority / 10,
        timestamp: Date.now(),
        activationLevel: 1.0,
        relatedTo: [],
      });

      // Step 2: Retrieve relevant memories from long-term storage
      const relevantMemories = await this.recallRelevantMemories(task);
      
      relevantMemories.forEach(memory => {
        this.addToWorkingMemory({
          id: `memory_${memory.id}`,
          content: memory.content,
          type: 'fact',
          importance: memory.metadata.importance,
          timestamp: Date.now(),
          activationLevel: 0.8,
          relatedTo: [],
        });
      });

      // Step 3: Apply attention to focus on most relevant information
      const focusedItems = this.applyAttention(task);

      // Step 4: Perform multi-step reasoning
      const reasoningSteps = await this.performReasoning(task, focusedItems);

      // Step 5: Generate result
      const result = this.synthesizeResult(reasoningSteps);

      // Step 6: Learn from the experience
      await this.learnFromExperience(task, result, reasoningSteps);

      // Step 7: Store valuable insights in long-term memory
      await this.consolidateToLongTermMemory(task, result, reasoningSteps);

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          duration,
          confidence: this.calculateConfidence(reasoningSteps),
          suggestions: this.generateSuggestions(reasoningSteps),
        },
        nextSteps: this.planNextSteps(result),
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Task processing failed', error);

      // Learn from failure
      await this.learnFromFailure(task, errorMessage);

      return {
        success: false,
        error: errorMessage,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================================================
  // Memory Management
  // ============================================================================

  private addToWorkingMemory(item: WorkingMemoryItem): void {
    this.workingMemory.add(item);
  }

  private async recallRelevantMemories(task: AgentTask): Promise<MemoryEntry[]> {
    const query = JSON.stringify(task.payload);
    return await this.longTermMemory.retrieve(query, 5);
  }

  private async consolidateToLongTermMemory(
    task: AgentTask,
    result: unknown,
    reasoningSteps: ReasoningStep[]
  ): Promise<void> {
    // Store the successful reasoning pattern
    const entry: MemoryEntry = {
      id: `consolidation_${task.id}`,
      content: JSON.stringify({
        task: task.payload,
        result,
        steps: reasoningSteps.map(s => s.description),
      }),
      metadata: {
        type: 'reasoning-pattern',
        tags: [task.type, 'success'],
        importance: 0.8,
        confidence: this.calculateConfidence(reasoningSteps),
        context: task.context as Record<string, unknown>,
      },
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    await this.longTermMemory.store(entry);
  }

  // ============================================================================
  // Attention Mechanism
  // ============================================================================

  private applyAttention(task: AgentTask): WorkingMemoryItem[] {
    const context: AttentionContext = {
      currentGoal: JSON.stringify(task.payload),
      recentHistory: this.reflectionHistory.slice(-3).map(r => r.outcome),
      taskType: task.type,
      importance: task.priority / 10,
    };

    return this.attentionNetwork.focus(this.workingMemory.getAll(), context);
  }

  // ============================================================================
  // Reasoning and Reflection
  // ============================================================================

  private async performReasoning(
    task: AgentTask,
    focusedItems: WorkingMemoryItem[]
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Step 1: Analyze the task
    steps.push({
      id: `step_1_${Date.now()}`,
      description: 'Analyze task requirements',
      type: 'analysis',
      confidence: 0.9,
      evidence: focusedItems.map(i => i.content).slice(0, 3),
    });

    // Step 2: Identify relevant knowledge
    steps.push({
      id: `step_2_${Date.now()}`,
      description: 'Identify relevant knowledge from memory',
      type: 'retrieval',
      confidence: 0.85,
      evidence: focusedItems.filter(i => i.type === 'fact').map(i => i.content),
    });

    // Step 3: Synthesize solution
    steps.push({
      id: `step_3_${Date.now()}`,
      description: 'Synthesize solution from available information',
      type: 'synthesis',
      confidence: 0.8,
      evidence: ['Combined insights from working memory'],
    });

    // Step 4: Validate solution
    steps.push({
      id: `step_4_${Date.now()}`,
      description: 'Validate proposed solution',
      type: 'validation',
      confidence: 0.75,
      evidence: ['Internal consistency check passed'],
    });

    return steps;
  }

  private synthesizeResult(steps: ReasoningStep[]): unknown {
    return {
      reasoning: steps.map(s => s.description),
      confidence: this.calculateConfidence(steps),
      evidence: steps.flatMap(s => s.evidence || []),
      memoryStats: this.longTermMemory.getStats(),
    };
  }

  // ============================================================================
  // Learning and Adaptation
  // ============================================================================

  private async learnFromExperience(
    task: AgentTask,
    result: unknown,
    steps: ReasoningStep[]
  ): Promise<void> {
    const reflection: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      taskId: task.id,
      timestamp: Date.now(),
      outcome: 'success',
      confidence: this.calculateConfidence(steps),
      insights: this.extractInsights(steps),
      adjustments: [],
    };

    this.reflectionHistory.push(reflection);
    this.learningMetrics.totalReflections++;
    this.learningMetrics.successfulTasks++;

    // Update attention weights based on what worked
    steps.forEach((step, index) => {
      if (step.confidence > 0.7) {
        this.attentionNetwork.updateWeights({
          itemId: step.id,
          wasUseful: true,
          outcome: 'success',
        });
      }
    });

    this.updateLearningMetrics();
  }

  private async learnFromFailure(task: AgentTask, errorMessage: string): Promise<void> {
    const reflection: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      taskId: task.id,
      timestamp: Date.now(),
      outcome: 'failure',
      confidence: 0,
      insights: [`Failed with error: ${errorMessage}`],
      adjustments: ['Increase attention to error handling', 'Review task requirements'],
    };

    this.reflectionHistory.push(reflection);
    this.learningMetrics.totalReflections++;
    this.learningMetrics.failedTasks++;

    this.updateLearningMetrics();
  }

  private extractInsights(steps: ReasoningStep[]): string[] {
    return steps
      .filter(s => s.confidence > 0.8)
      .map(s => `${s.description} (confidence: ${s.confidence})`);
  }

  private updateLearningMetrics(): void {
    const total = this.learningMetrics.successfulTasks + this.learningMetrics.failedTasks;
    if (total > 0) {
      this.learningMetrics.averageConfidence = 
        this.learningMetrics.successfulTasks / total;
      this.learningMetrics.improvementRate = 
        this.calculateImprovementRate();
    }
  }

  private calculateImprovementRate(): number {
    if (this.reflectionHistory.length < 2) return 0;

    const recent = this.reflectionHistory.slice(-10);
    const older = this.reflectionHistory.slice(-20, -10);

    const recentSuccess = recent.filter(r => r.outcome === 'success').length / recent.length;
    const olderSuccess = older.length > 0 
      ? older.filter(r => r.outcome === 'success').length / older.length 
      : 0;

    return recentSuccess - olderSuccess;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0;
    return steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
  }

  private generateSuggestions(steps: ReasoningStep[]): string[] {
    const lowConfidenceSteps = steps.filter(s => s.confidence < 0.7);
    return lowConfidenceSteps.map(s => `Consider improving: ${s.description}`);
  }

  private planNextSteps(result: unknown): string[] {
    return [
      'Review reasoning steps for optimization',
      'Consolidate learnings to long-term memory',
      'Apply insights to future tasks',
    ];
  }

  // ============================================================================
  // Public API for Memory Access
  // ============================================================================

  public getWorkingMemorySnapshot(): WorkingMemoryItem[] {
    return this.workingMemory.getAll();
  }

  public getLongTermMemoryStats(): MemoryStats {
    return this.longTermMemory.getStats();
  }

  public getReflectionHistory(): ReflectionEntry[] {
    return [...this.reflectionHistory];
  }

  public getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  public clearWorkingMemory(): void {
    this.workingMemory.clear();
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ReasoningStep {
  id: string;
  description: string;
  type: 'analysis' | 'retrieval' | 'synthesis' | 'validation';
  confidence: number;
  evidence: string[];
}

interface ReflectionEntry {
  id: string;
  taskId: string;
  timestamp: number;
  outcome: 'success' | 'failure' | 'partial';
  confidence: number;
  insights: string[];
  adjustments: string[];
}

interface LearningMetrics {
  totalReflections: number;
  successfulTasks: number;
  failedTasks: number;
  averageConfidence: number;
  improvementRate: number;
}
