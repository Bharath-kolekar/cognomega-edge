/**
 * Integration module - Connects multi-agent system with SuperIntelligenceEngine
 * Registers agents as engine handlers and provides utilities for seamless interop
 */

import { SuperIntelligenceEngine } from '../super-intelligence-engine';
import { TaskPayload, RoutingResult } from '../smart-ai-router';
import { FullStackAIAssistant } from './fullstack-ai-assistant';
import { ProjectPlanningAgent } from './project-planning-agent';
import { UIDesignAgent } from './ui-design-agent';
import { FrontendDevAgent } from './frontend-dev-agent';
import { BackendDevAgent } from './backend-dev-agent';
import { DatabaseAgent } from './database-agent';
import { DevOpsAgent } from './devops-agent';
import { TestingAgent } from './testing-agent';
import { IAgent, AgentTask, AgentResult } from './types';

/**
 * Register all multi-agent system agents with the SuperIntelligenceEngine
 */
export function registerMultiAgentSystem(engine: SuperIntelligenceEngine): void {
  const assistant = new FullStackAIAssistant();
  
  // Register the orchestrator
  engine.registerAgent('fullstack-assistant', async (task: TaskPayload) => {
    const agentTask = convertTaskPayloadToAgentTask(task, 'orchestrator');
    const result = await assistant.execute(agentTask);
    return convertAgentResultToEngineOutput(result);
  });

  // Register individual agents
  const agents: IAgent[] = [
    new ProjectPlanningAgent(),
    new UIDesignAgent(),
    new FrontendDevAgent(),
    new BackendDevAgent(),
    new DatabaseAgent(),
    new DevOpsAgent(),
    new TestingAgent(),
  ];

  agents.forEach(agent => {
    engine.registerAgent(agent.config.name, async (task: TaskPayload) => {
      const agentTask = convertTaskPayloadToAgentTask(task, agent.config.type);
      const result = await agent.execute(agentTask);
      return convertAgentResultToEngineOutput(result);
    });
  });

  console.log('[Multi-Agent] Registered all agents with SuperIntelligenceEngine');
}

/**
 * Convert TaskPayload from router to AgentTask
 */
function convertTaskPayloadToAgentTask(
  task: TaskPayload,
  agentType: string
): AgentTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: agentType as any,
    payload: task.payload,
    priority: task.priority || 5,
    context: {
      userId: task.user,
      sharedState: task.context,
    },
    createdAt: Date.now(),
  };
}

/**
 * Convert AgentResult to engine output format
 */
function convertAgentResultToEngineOutput(result: AgentResult): RoutingResult {
  return {
    engine: 'multi-agent-system',
    status: result.success ? 'executed' : 'failed',
    output: result.data,
    agentFeedback: result.error || result.metadata?.suggestions?.join(', '),
  };
}

/**
 * Helper to create a SuperIntelligenceEngine with multi-agent system integrated
 */
export function createEnhancedSuperIntelligence(memoryLimit?: number): SuperIntelligenceEngine {
  const engine = new SuperIntelligenceEngine(memoryLimit);
  registerMultiAgentSystem(engine);
  return engine;
}

/**
 * Standalone function to execute a full-stack project
 * Can be used independently or through the SuperIntelligenceEngine
 */
export async function executeFullStackProject(requirements: any): Promise<AgentResult> {
  const assistant = new FullStackAIAssistant();
  await assistant.initialize();

  const task: AgentTask = {
    id: `project-${Date.now()}`,
    type: 'orchestrator',
    payload: { requirements },
    priority: 10,
    createdAt: Date.now(),
  };

  return await assistant.execute(task);
}

/**
 * Get agent system health and status
 */
export function getAgentSystemStatus(): {
  registered: string[];
  orchestrator: string;
  specializedAgents: string[];
} {
  return {
    registered: [
      'fullstack-assistant',
      'ProjectPlanningAgent',
      'UIDesignAgent',
      'FrontendDevAgent',
      'BackendDevAgent',
      'DatabaseAgent',
      'DevOpsAgent',
      'TestingAgent',
    ],
    orchestrator: 'FullStackAIAssistant',
    specializedAgents: [
      'ProjectPlanningAgent',
      'UIDesignAgent',
      'FrontendDevAgent',
      'BackendDevAgent',
      'DatabaseAgent',
      'DevOpsAgent',
      'TestingAgent',
    ],
  };
}
