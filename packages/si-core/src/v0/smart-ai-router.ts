/**
 * Smart AI Router (Resource-Optimized)
 * Modular plugin registry, minimal persistent state, sparse swarm routing.
 */
export type EngineType =
  | 'reasoning'
  | 'nlp'
  | 'semantic'
  | 'memory'
  | 'super'
  | 'voice'
  | 'vision'
  | 'quantum'
  | 'custom';

export interface TaskPayload {
  type: EngineType;
  payload: any;
  user?: string;
  priority?: number;
  context?: Record<string, any>;
  feedback?: string;
  agentSwarm?: string[];
}

export interface RoutingResult {
  engine: string;
  status: 'queued' | 'executed' | 'failed' | 'swarmed';
  output?: any;
  agentFeedback?: string;
  swarmAgents?: string[];
}

const engineRegistry: Record<string, Function> = {};

export function registerEngine(name: string, handler: Function): void {
  engineRegistry[name] = handler;
}

export function routeToEngine(task: TaskPayload): RoutingResult {
  let engine = 'unknown-engine';
  switch (task.type) {
    case 'reasoning': engine = 'advanced-reasoning-engine'; break;
    case 'nlp': engine = 'nlp-utils'; break;
    case 'semantic': engine = 'semantic-nlp-engine'; break;
    case 'memory': engine = 'contextual-memory'; break;
    case 'super': engine = 'super-intelligence-engine'; break;
    case 'voice': engine = 'voice-engine'; break;
    case 'vision': engine = 'vision-engine'; break;
    case 'quantum': engine = 'quantum-engine'; break;
    case 'custom': engine = task.payload?.engineName ?? 'custom'; break;
  }
  if (engineRegistry[engine]) {
    try {
      const output = engineRegistry[engine](task);
      return { engine, status: 'executed', output, agentFeedback: 'Execution succeeded.' };
    } catch (e) {
      return { engine, status: 'failed', output: e, agentFeedback: 'Execution failed.' };
    }
  }
  return { engine, status: 'queued', output: null, agentFeedback: 'Engine not registered.' };
}

export function getRegisteredEngines(): string[] {
  return Object.keys(engineRegistry);
}