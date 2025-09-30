/**
 * Super Intelligence Engine (Resource-Optimized)
 * Adaptive, feedback-driven, modular, memory-capped, edge/cloud fallback.
 */
import { AdvancedReasoningEngine, ReasoningContext } from './advanced-reasoning-engine';
import { ContextualMemory } from './contextual-memory';
import { analyzeSemantics, SemanticAnalysis } from './semantic-nlp-engine';
import { TaskPayload, RoutingResult, routeToEngine, registerEngine, getRegisteredEngines } from './smart-ai-router';

export interface SuperIntelligenceRequest {
  text: string;
  user?: string;
  context?: Record<string, any>;
  parallel?: boolean;
  agents?: string[];
  modality?: EngineType;
  feedback?: string;
  agentSwarm?: string[];
}

export interface SuperIntelligenceResponse {
  semantics: SemanticAnalysis;
  memory: any;
  reasoning: any;
  routed: RoutingResult[] | RoutingResult;
  observability?: Record<string, any>;
  registeredAgents?: string[];
}

export class SuperIntelligenceEngine {
  reasoning: AdvancedReasoningEngine;
  memory: ContextualMemory;
  agentRegistry: Record<string, Function> = {};

  constructor(memoryLimit: number = 32) {
    this.memory = new ContextualMemory(memoryLimit);
    this.reasoning = new AdvancedReasoningEngine({
      facts: [],
      goals: [],
      quantumState: "initialized",
    });
  }

  process(request: SuperIntelligenceRequest): SuperIntelligenceResponse {
    this.memory.set('last', request.text, request.user, undefined, undefined, undefined, "initialized");

    const semantics = analyzeSemantics(request.text);
    if (semantics.intent !== 'unknown') {
      this.reasoning.addGoal({ description: semantics.intent });
    }
    const reasoningSteps = this.reasoning.solve(1); // Only process one goal per call for resource savings

    let routed: RoutingResult[] | RoutingResult;
    if (request.agents?.length) {
      routed = request.agents.map(agent =>
        routeToEngine({ type: 'custom', payload: { engineName: agent, request }, user: request.user, feedback: request.feedback })
      );
    } else {
      routed = [
        routeToEngine({ type: request.modality ?? 'reasoning', payload: { semantics, request }, user: request.user }),
        routeToEngine({ type: 'semantic', payload: { semantics, request }, user: request.user }),
        routeToEngine({ type: 'memory', payload: { semantics, request }, user: request.user }),
      ];
    }

    const observability: Record<string, any> = {
      agentsDispatched: request.agents?.length ?? 3,
      memoryUsage: this.memory.getRecent().length,
      user: request.user,
      registeredAgents: getRegisteredEngines(),
    };

    return {
      semantics,
      memory: this.memory.get('last'),
      reasoning: reasoningSteps,
      routed,
      observability,
      registeredAgents: getRegisteredEngines(),
    };
  }

  registerAgent(agentName: string, handler: Function): void {
    this.agentRegistry[agentName] = handler;
    registerEngine(agentName, handler);
  }

  getAgents(): string[] {
    return Object.keys(this.agentRegistry);
  }
}