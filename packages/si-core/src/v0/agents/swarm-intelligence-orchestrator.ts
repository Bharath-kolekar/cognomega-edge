/**
 * SwarmIntelligenceOrchestrator - Emergent Swarm Intelligence Coordination
 * 
 * Coordinates multiple agents to solve complex problems collectively through:
 * - Agent communication and collaboration
 * - Task decomposition and distribution
 * - Emergent synthesis from collective intelligence
 * 
 * Compatible with Cognomega's multi-agent platform architecture
 */

import { BaseAgent } from './base-agent';
import {
  IAgent,
  AgentTask,
  AgentResult,
  AgentMessage,
  AgentType,
} from './types';

// ============================================================================
// Swarm-specific Types
// ============================================================================

export interface SwarmAgent {
  agent: IAgent;
  specialization: string;
  capabilities: string[];
  processingPower: number;
  cognitiveLoad: number;
  emergenceFactor: number;
  connectionStrengths: Map<string, number>;
}

export interface SwarmTask {
  id: string;
  description: string;
  type: 'analysis' | 'synthesis' | 'execution' | 'validation';
  complexity: number;
  priority: number;
  requiredCapabilities: string[];
  dependencies: string[];
  assignedAgents: string[];
}

export interface SwarmCommunication {
  from: string;
  to: string[];
  content: unknown;
  type: 'broadcast' | 'directed' | 'feedback';
  timestamp: number;
  correlationId: string;
}

export interface SwarmConsensus {
  taskId: string;
  participatingAgents: string[];
  results: Map<string, AgentResult>;
  consensusStrength: number;
  confidence: number;
  emergentInsights: string[];
}

export interface EmergentSynthesis {
  swarmId: string;
  taskId: string;
  collectiveResult: unknown;
  emergenceLevel: number;
  patterns: string[];
  confidence: number;
  contributingAgents: Map<string, number>; // agent ID -> contribution weight
}

export interface SwarmOrchestrationResult extends AgentResult {
  swarmMetrics: {
    totalAgents: number;
    activeAgents: number;
    emergenceLevel: number;
    coherence: number;
    distributedEfficiency: number;
  };
  consensus: SwarmConsensus;
  synthesis: EmergentSynthesis;
}

// ============================================================================
// SwarmIntelligenceOrchestrator Implementation
// ============================================================================

export class SwarmIntelligenceOrchestrator extends BaseAgent {
  private swarmAgents: Map<string, SwarmAgent> = new Map();
  private communicationHistory: SwarmCommunication[] = [];
  private consensusCache: Map<string, SwarmConsensus> = new Map();
  private emergentKnowledge: Map<string, unknown> = new Map();
  private swarmId: string;

  constructor(agents?: IAgent[]) {
    super(
      'orchestrator',
      'SwarmIntelligenceOrchestrator',
      [
        'swarm-coordination',
        'emergent-intelligence',
        'collective-problem-solving',
        'distributed-processing',
        'consensus-building',
      ],
      10 // Highest priority
    );

    this.swarmId = `swarm-${Date.now()}`;

    // Initialize with provided agents
    if (agents) {
      agents.forEach((agent) => this.registerAgent(agent));
    }
  }

  /**
   * Register an agent to join the swarm
   */
  public registerAgent(agent: IAgent): void {
    const swarmAgent: SwarmAgent = {
      agent,
      specialization: agent.config.type,
      capabilities: agent.config.capabilities,
      processingPower: this.calculateProcessingPower(agent),
      cognitiveLoad: 0,
      emergenceFactor: 50 + Math.random() * 50, // Initial 50-100%
      connectionStrengths: new Map(),
    };

    this.swarmAgents.set(agent.config.id, swarmAgent);
    this.establishConnections(swarmAgent);
    
    this.log('info', `Registered agent to swarm: ${agent.config.name}`);
  }

  /**
   * Remove an agent from the swarm
   */
  public unregisterAgent(agentId: string): boolean {
    const removed = this.swarmAgents.delete(agentId);
    if (removed) {
      this.log('info', `Removed agent from swarm: ${agentId}`);
    }
    return removed;
  }

  /**
   * Process a task using swarm intelligence
   */
  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing task with swarm intelligence: ${task.id}`);

    try {
      // Step 1: Decompose task into subtasks
      const swarmTasks = await this.decomposeProblem(task);
      
      // Step 2: Activate and assign relevant agents
      const activeAgents = await this.activateAgents(swarmTasks);
      
      // Step 3: Distribute tasks across swarm
      const distributedResults = await this.distributeTasks(swarmTasks, activeAgents);
      
      // Step 4: Facilitate agent communication
      await this.facilitateCommunication(swarmTasks, activeAgents);
      
      // Step 5: Build consensus from distributed results
      const consensus = await this.buildConsensus(task.id, distributedResults, activeAgents);
      
      // Step 6: Synthesize emergent insights
      const synthesis = await this.synthesizeEmergence(task.id, consensus, activeAgents);
      
      // Step 7: Update swarm state
      await this.updateSwarmState(synthesis, activeAgents);

      const result: SwarmOrchestrationResult = {
        success: true,
        data: synthesis.collectiveResult,
        metadata: {
          duration: Date.now() - task.createdAt,
          confidence: synthesis.confidence,
          suggestions: this.generateSwarmSuggestions(synthesis),
        },
        swarmMetrics: {
          totalAgents: this.swarmAgents.size,
          activeAgents: activeAgents.length,
          emergenceLevel: synthesis.emergenceLevel,
          coherence: consensus.consensusStrength,
          distributedEfficiency: this.calculateDistributedEfficiency(activeAgents),
        },
        consensus,
        synthesis,
      };

      this.log('info', `Swarm task completed: ${task.id}`);
      return result;

    } catch (error) {
      this.log('error', `Swarm task failed: ${task.id}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Swarm orchestration failed',
        metadata: {
          duration: Date.now() - task.createdAt,
        },
      };
    }
  }

  // ============================================================================
  // Task Decomposition
  // ============================================================================

  private async decomposeProblem(task: AgentTask): Promise<SwarmTask[]> {
    const swarmTasks: SwarmTask[] = [];

    // Analyze task complexity
    const complexity = this.assessComplexity(task);

    // Decompose based on task type and complexity
    if (complexity > 7) {
      // High complexity: break into analysis, synthesis, execution, validation
      swarmTasks.push(
        {
          id: `${task.id}-analysis`,
          description: 'Analyze problem and gather information',
          type: 'analysis',
          complexity: 5,
          priority: task.priority + 2,
          requiredCapabilities: ['analysis', 'research', 'data-processing'],
          dependencies: [],
          assignedAgents: [],
        },
        {
          id: `${task.id}-synthesis`,
          description: 'Synthesize solutions and approaches',
          type: 'synthesis',
          complexity: 6,
          priority: task.priority + 1,
          requiredCapabilities: ['creative-problem-solving', 'reasoning'],
          dependencies: [`${task.id}-analysis`],
          assignedAgents: [],
        },
        {
          id: `${task.id}-execution`,
          description: 'Execute the solution',
          type: 'execution',
          complexity: 7,
          priority: task.priority,
          requiredCapabilities: ['implementation', 'execution'],
          dependencies: [`${task.id}-synthesis`],
          assignedAgents: [],
        },
        {
          id: `${task.id}-validation`,
          description: 'Validate results and quality',
          type: 'validation',
          complexity: 4,
          priority: task.priority - 1,
          requiredCapabilities: ['testing', 'validation', 'quality-assurance'],
          dependencies: [`${task.id}-execution`],
          assignedAgents: [],
        }
      );
    } else if (complexity > 4) {
      // Medium complexity: analysis and execution
      swarmTasks.push(
        {
          id: `${task.id}-analysis`,
          description: 'Analyze and plan approach',
          type: 'analysis',
          complexity: 4,
          priority: task.priority + 1,
          requiredCapabilities: ['analysis', 'planning'],
          dependencies: [],
          assignedAgents: [],
        },
        {
          id: `${task.id}-execution`,
          description: 'Execute the task',
          type: 'execution',
          complexity: 5,
          priority: task.priority,
          requiredCapabilities: ['implementation'],
          dependencies: [`${task.id}-analysis`],
          assignedAgents: [],
        }
      );
    } else {
      // Low complexity: direct execution
      swarmTasks.push({
        id: `${task.id}-execution`,
        description: 'Execute task directly',
        type: 'execution',
        complexity: complexity,
        priority: task.priority,
        requiredCapabilities: ['general-execution'],
        dependencies: [],
        assignedAgents: [],
      });
    }

    this.log('info', `Decomposed task into ${swarmTasks.length} subtasks`);
    return swarmTasks;
  }

  private assessComplexity(task: AgentTask): number {
    let complexity = 5; // Base complexity

    const payload = task.payload as Record<string, unknown>;
    
    // Increase complexity based on requirements
    if (payload.requirements) {
      const req = payload.requirements as Record<string, unknown>;
      if (req.features && Array.isArray(req.features)) {
        complexity += Math.min(3, req.features.length / 3);
      }
      if (req.constraints && Array.isArray(req.constraints)) {
        complexity += Math.min(2, req.constraints.length / 2);
      }
    }

    // Consider dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      complexity += Math.min(2, task.dependencies.length);
    }

    return Math.min(10, Math.max(1, Math.round(complexity)));
  }

  // ============================================================================
  // Agent Activation and Assignment
  // ============================================================================

  private async activateAgents(tasks: SwarmTask[]): Promise<SwarmAgent[]> {
    const requiredCapabilities = new Set<string>();
    tasks.forEach((task) => {
      task.requiredCapabilities.forEach((cap) => requiredCapabilities.add(cap));
    });

    const activeAgents: SwarmAgent[] = [];
    const agentScores = new Map<string, number>();

    // Score each agent based on capability match and availability
    this.swarmAgents.forEach((swarmAgent, id) => {
      let score = 0;

      // Capability matching
      const matchingCapabilities = swarmAgent.capabilities.filter((cap) =>
        requiredCapabilities.has(cap) || 
        Array.from(requiredCapabilities).some(req => cap.includes(req) || req.includes(cap))
      );
      score += matchingCapabilities.length * 3;

      // Processing power
      score += swarmAgent.processingPower / 10;

      // Cognitive load (prefer less loaded agents)
      score += (100 - swarmAgent.cognitiveLoad) / 10;

      // Emergence factor
      score += swarmAgent.emergenceFactor / 10;

      agentScores.set(id, score);
    });

    // Select top agents
    const sortedAgents = Array.from(agentScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, Math.max(3, Math.min(this.swarmAgents.size, tasks.length * 2)));

    sortedAgents.forEach(([id]) => {
      const agent = this.swarmAgents.get(id);
      if (agent) {
        activeAgents.push(agent);
      }
    });

    this.log('info', `Activated ${activeAgents.length} agents for swarm tasks`);
    return activeAgents;
  }

  // ============================================================================
  // Task Distribution
  // ============================================================================

  private async distributeTasks(
    tasks: SwarmTask[],
    agents: SwarmAgent[]
  ): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();

    // Execute tasks respecting dependencies
    const completed = new Set<string>();
    const pending = [...tasks];

    while (pending.length > 0) {
      // Find tasks that can be executed (dependencies met)
      const ready = pending.filter((task) =>
        task.dependencies.every((dep) => completed.has(dep))
      );

      if (ready.length === 0 && pending.length > 0) {
        // Circular dependency or missing dependency
        this.log('warn', 'Circular dependency detected in swarm tasks');
        break;
      }

      // Execute ready tasks in parallel
      await Promise.all(
        ready.map(async (swarmTask) => {
          const assignedAgents = this.assignAgentsToTask(swarmTask, agents);
          
          // Execute with multiple agents (using the best match)
          const bestAgent = assignedAgents[0];
          if (!bestAgent) {
            this.log('warn', `No agent available for task: ${swarmTask.id}`);
            return;
          }

          const agentTask: AgentTask = {
            id: swarmTask.id,
            type: bestAgent.specialization as AgentType,
            payload: {
              description: swarmTask.description,
              type: swarmTask.type,
              complexity: swarmTask.complexity,
            },
            priority: swarmTask.priority,
            dependencies: swarmTask.dependencies,
            createdAt: Date.now(),
          };

          try {
            const result = await bestAgent.agent.execute(agentTask);
            results.set(swarmTask.id, result);
            completed.add(swarmTask.id);
            
            // Update cognitive load
            bestAgent.cognitiveLoad = Math.min(100, bestAgent.cognitiveLoad + swarmTask.complexity * 5);
            
            this.log('info', `Task completed by ${bestAgent.agent.config.name}: ${swarmTask.id}`);
          } catch (error) {
            this.log('error', `Task failed: ${swarmTask.id}`, error);
            results.set(swarmTask.id, {
              success: false,
              error: error instanceof Error ? error.message : 'Task execution failed',
            });
          }
        })
      );

      // Remove completed tasks from pending
      pending.splice(0, pending.length, ...pending.filter((t) => !completed.has(t.id)));
    }

    return results;
  }

  private assignAgentsToTask(task: SwarmTask, agents: SwarmAgent[]): SwarmAgent[] {
    // Score agents for this specific task
    const scores = agents.map((agent) => {
      let score = 0;

      // Capability match
      const matches = agent.capabilities.filter((cap) =>
        task.requiredCapabilities.some(req => cap.includes(req) || req.includes(cap))
      );
      score += matches.length * 5;

      // Availability
      score += (100 - agent.cognitiveLoad) / 5;

      // Specialization match
      if (task.requiredCapabilities.includes(agent.specialization)) {
        score += 10;
      }

      return { agent, score };
    });

    // Sort by score and return top agents
    return scores
      .sort((a, b) => b.score - a.score)
      .map((s) => s.agent)
      .slice(0, 3); // Up to 3 agents per task
  }

  // ============================================================================
  // Agent Communication
  // ============================================================================

  private async facilitateCommunication(
    tasks: SwarmTask[],
    agents: SwarmAgent[]
  ): Promise<void> {
    // Enable agents to share insights and coordinate
    const communications: SwarmCommunication[] = [];

    // Broadcast task context to all active agents
    agents.forEach((agent) => {
      const broadcast: SwarmCommunication = {
        from: this.config.id,
        to: [agent.agent.config.id],
        content: {
          tasks: tasks.map((t) => ({ id: t.id, type: t.type, complexity: t.complexity })),
          swarmContext: {
            totalAgents: agents.length,
            swarmId: this.swarmId,
          },
        },
        type: 'broadcast',
        timestamp: Date.now(),
        correlationId: `comm-${Date.now()}`,
      };
      communications.push(broadcast);
    });

    // Store communication history
    this.communicationHistory.push(...communications);

    // Facilitate peer-to-peer connections for high-synergy agents
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent1 = agents[i];
        const agent2 = agents[j];
        
        const connectionStrength = agent1.connectionStrengths.get(agent2.agent.config.id) || 0;
        
        if (connectionStrength > 0.5) {
          // High synergy - facilitate direct communication
          const message: AgentMessage = {
            from: agent1.agent.config.id,
            to: agent2.agent.config.id,
            type: 'notification',
            payload: {
              message: 'Collaboration opportunity detected',
              connectionStrength,
            },
            timestamp: Date.now(),
          };
          
          await agent2.agent.receiveMessage(message);
        }
      }
    }

    this.log('info', `Facilitated ${communications.length} swarm communications`);
  }

  // ============================================================================
  // Consensus Building
  // ============================================================================

  private async buildConsensus(
    _taskId: string,
    results: Map<string, AgentResult>,
    agents: SwarmAgent[]
  ): Promise<SwarmConsensus> {
    const participatingAgents = agents.map((a) => a.agent.config.id);
    const weights = new Map<string, number>();

    // Calculate weights based on agent properties
    agents.forEach((agent) => {
      let weight = 0;

      // Processing power contribution
      weight += agent.processingPower / 100 * 0.3;

      // Emergence factor
      weight += agent.emergenceFactor / 100 * 0.3;

      // Success rate (from results)
      const agentResults = Array.from(results.values()).filter((r) => r.success);
      const successRate = agentResults.length / Math.max(1, results.size);
      weight += successRate * 0.4;

      weights.set(agent.agent.config.id, weight);
    });

    // Normalize weights
    const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
    weights.forEach((weight, id) => weights.set(id, weight / totalWeight));

    // Calculate consensus strength
    const successfulResults = Array.from(results.values()).filter((r) => r.success);
    const consensusStrength = (successfulResults.length / Math.max(1, results.size)) * 100;

    // Calculate overall confidence
    const confidenceValues = successfulResults
      .map((r) => r.metadata?.confidence || 0.5)
      .filter((c) => c > 0);
    const avgConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : 0.5;

    // Extract emergent insights
    const emergentInsights: string[] = [];
    results.forEach((result) => {
      if (result.success && result.metadata?.suggestions) {
        emergentInsights.push(...result.metadata.suggestions);
      }
    });

    const consensus: SwarmConsensus = {
      taskId: _taskId,
      participatingAgents,
      results,
      consensusStrength,
      confidence: avgConfidence,
      emergentInsights: [...new Set(emergentInsights)], // Remove duplicates
    };

    this.consensusCache.set(_taskId, consensus);
    this.log('info', `Built consensus with ${consensusStrength.toFixed(1)}% strength`);

    return consensus;
  }

  // ============================================================================
  // Emergent Synthesis
  // ============================================================================

  private async synthesizeEmergence(
    taskId: string,
    consensus: SwarmConsensus,
    agents: SwarmAgent[]
  ): Promise<EmergentSynthesis> {
    // Calculate emergence level
    const avgEmergence = agents.reduce((sum, a) => sum + a.emergenceFactor, 0) / agents.length;
    const emergenceLevel = (avgEmergence / 100) * (consensus.consensusStrength / 100) * 100;

    // Detect emergent patterns
    const patterns: string[] = [];
    if (emergenceLevel > 70) {
      patterns.push('collective-superintelligence');
      patterns.push('synergistic-problem-solving');
    }
    if (emergenceLevel > 60) {
      patterns.push('distributed-consciousness');
      patterns.push('emergent-creativity');
    }
    if (emergenceLevel > 50) {
      patterns.push('swarm-cognition');
      patterns.push('collective-intelligence');
    }
    if (consensus.consensusStrength > 80) {
      patterns.push('high-coherence');
    }

    // Calculate contribution weights
    const contributingAgents = new Map<string, number>();
    agents.forEach((agent) => {
      const contribution = (agent.processingPower / 100) * (agent.emergenceFactor / 100);
      contributingAgents.set(agent.agent.config.id, contribution);
    });

    // Synthesize collective result
    const successfulResults = Array.from(consensus.results.values())
      .filter((r) => r.success)
      .map((r) => r.data);

    const collectiveResult = {
      synthesis: 'Emergent solution from swarm intelligence',
      individualResults: successfulResults,
      emergentInsights: consensus.emergentInsights,
      patterns,
      recommendation: this.generateCollectiveRecommendation(consensus, emergenceLevel),
    };

    const synthesis: EmergentSynthesis = {
      swarmId: this.swarmId,
      taskId,
      collectiveResult,
      emergenceLevel,
      patterns,
      confidence: consensus.confidence,
      contributingAgents,
    };

    // Store emergent knowledge
    this.emergentKnowledge.set(taskId, synthesis);

    this.log('info', `Synthesized emergence at ${emergenceLevel.toFixed(1)}% level`);
    return synthesis;
  }

  private generateCollectiveRecommendation(
    consensus: SwarmConsensus,
    emergenceLevel: number
  ): string {
    if (emergenceLevel > 70 && consensus.consensusStrength > 80) {
      return 'Exceptional swarm performance - collective superintelligence achieved. Leverage for most complex challenges.';
    } else if (emergenceLevel > 60) {
      return 'Strong emergent intelligence detected - swarm is operating at high efficiency.';
    } else if (emergenceLevel > 50) {
      return 'Swarm cognition emerging - collective intelligence forming effectively.';
    } else {
      return 'Basic swarm coordination achieved - consider optimizing agent connections.';
    }
  }

  // ============================================================================
  // Swarm State Management
  // ============================================================================

  private async updateSwarmState(
    synthesis: EmergentSynthesis,
    agents: SwarmAgent[]
  ): Promise<void> {
    // Update agent emergence factors
    agents.forEach((agent) => {
      if (synthesis.emergenceLevel > 60) {
        // Positive reinforcement
        agent.emergenceFactor = Math.min(100, agent.emergenceFactor + 5);
      }
      
      // Reduce cognitive load
      agent.cognitiveLoad = Math.max(0, agent.cognitiveLoad - 10);
    });

    // Strengthen connections between collaborating agents
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent1 = agents[i];
        const agent2 = agents[j];
        
        const currentStrength1 = agent1.connectionStrengths.get(agent2.agent.config.id) || 0;
        const currentStrength2 = agent2.connectionStrengths.get(agent1.agent.config.id) || 0;
        
        const enhancement = synthesis.emergenceLevel / 1000;
        
        agent1.connectionStrengths.set(agent2.agent.config.id, Math.min(1, currentStrength1 + enhancement));
        agent2.connectionStrengths.set(agent1.agent.config.id, Math.min(1, currentStrength2 + enhancement));
      }
    }

    this.log('info', 'Updated swarm state based on emergence synthesis');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private establishConnections(newAgent: SwarmAgent): void {
    // Establish connections with existing agents
    this.swarmAgents.forEach((existingAgent) => {
      if (existingAgent.agent.config.id !== newAgent.agent.config.id) {
        const strength = this.calculateConnectionStrength(newAgent, existingAgent);
        newAgent.connectionStrengths.set(existingAgent.agent.config.id, strength);
        existingAgent.connectionStrengths.set(newAgent.agent.config.id, strength);
      }
    });
  }

  private calculateConnectionStrength(agent1: SwarmAgent, agent2: SwarmAgent): number {
    // Calculate based on capability overlap and complementarity
    const capabilityOverlap = agent1.capabilities.filter((cap) =>
      agent2.capabilities.includes(cap)
    ).length;

    const complementaryFactor = this.getComplementaryFactor(
      agent1.specialization,
      agent2.specialization
    );

    return Math.min(
      1,
      (capabilityOverlap * 0.3 + complementaryFactor * 0.7) * (Math.random() * 0.4 + 0.6)
    );
  }

  private getComplementaryFactor(spec1: string, spec2: string): number {
    // Define complementary specializations
    const complementaryPairs: Record<string, string[]> = {
      'planning': ['frontend', 'backend', 'database'],
      'frontend': ['ui-design', 'backend'],
      'backend': ['frontend', 'database', 'devops'],
      'database': ['backend', 'devops'],
      'ui-design': ['frontend', 'planning'],
      'testing': ['frontend', 'backend', 'devops'],
      'devops': ['backend', 'database', 'testing'],
    };

    return complementaryPairs[spec1]?.includes(spec2) ? 1.0 : 0.3;
  }

  private calculateProcessingPower(agent: IAgent): number {
    // Estimate processing power based on capabilities and priority
    const capabilityScore = agent.config.capabilities.length * 10;
    const priorityScore = agent.config.priority * 5;
    return Math.min(100, capabilityScore + priorityScore + Math.random() * 20);
  }

  private calculateDistributedEfficiency(agents: SwarmAgent[]): number {
    if (agents.length === 0) return 0;

    const totalProcessing = agents.reduce((sum, a) => sum + a.processingPower, 0);
    const avgLoad = agents.reduce((sum, a) => sum + a.cognitiveLoad, 0) / agents.length;
    const avgEmergence = agents.reduce((sum, a) => sum + a.emergenceFactor, 0) / agents.length;

    return ((totalProcessing / agents.length) * (100 - avgLoad) / 100 * (avgEmergence / 100)) / 50;
  }

  private generateSwarmSuggestions(synthesis: EmergentSynthesis): string[] {
    const suggestions: string[] = [];

    if (synthesis.emergenceLevel > 70) {
      suggestions.push('Swarm operating at peak performance - consider tackling more complex problems');
    }

    if (synthesis.confidence > 0.8) {
      suggestions.push('High confidence in collective solution - safe to proceed with implementation');
    }

    if (synthesis.patterns.includes('collective-superintelligence')) {
      suggestions.push('Collective superintelligence achieved - optimal for strategic decision-making');
    }

    suggestions.push(`Emergence level: ${synthesis.emergenceLevel.toFixed(1)}% - ${this.getEmergenceQuality(synthesis.emergenceLevel)}`);

    return suggestions;
  }

  private getEmergenceQuality(level: number): string {
    if (level > 80) return 'exceptional';
    if (level > 70) return 'excellent';
    if (level > 60) return 'very good';
    if (level > 50) return 'good';
    return 'developing';
  }

  /**
   * Get current swarm metrics
   */
  public getSwarmMetrics() {
    const agents = Array.from(this.swarmAgents.values());
    return {
      swarmId: this.swarmId,
      totalAgents: this.swarmAgents.size,
      avgProcessingPower: agents.reduce((sum, a) => sum + a.processingPower, 0) / agents.length || 0,
      avgCognitiveLoad: agents.reduce((sum, a) => sum + a.cognitiveLoad, 0) / agents.length || 0,
      avgEmergenceFactor: agents.reduce((sum, a) => sum + a.emergenceFactor, 0) / agents.length || 0,
      totalCommunications: this.communicationHistory.length,
      consensusCount: this.consensusCache.size,
      emergentKnowledgeItems: this.emergentKnowledge.size,
    };
  }
}
