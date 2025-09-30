/**
 * Multi-Agent System API Routes
 * Provides HTTP endpoints for interacting with the multi-agent AI system
 */

import { Hono } from 'hono';
import {
  createFullStackAssistant,
  executeFullStackProject,
  getAgentSystemStatus,
  ProjectRequirements,
  AgentTask,
} from '@cognomega/si-core';

const app = new Hono();

/**
 * GET /agents/status
 * Get the status of the multi-agent system
 */
app.get('/status', async (c) => {
  try {
    const status = getAgentSystemStatus();
    return c.json({
      success: true,
      data: status,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agent status',
    }, 500);
  }
});

/**
 * POST /agents/build
 * Execute a full-stack project build using the multi-agent system
 * 
 * Body:
 * {
 *   "requirements": {
 *     "name": "My App",
 *     "description": "...",
 *     "framework": "React",
 *     "features": [...],
 *     ...
 *   }
 * }
 */
app.post('/build', async (c) => {
  try {
    const body = await c.req.json();
    const requirements: ProjectRequirements = body.requirements;

    if (!requirements || !requirements.name || !requirements.description) {
      return c.json({
        success: false,
        error: 'Invalid requirements. Must include name and description.',
      }, 400);
    }

    // Execute the project build
    const result = await executeFullStackProject(requirements);

    return c.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
      nextSteps: result.nextSteps,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build project',
    }, 500);
  }
});

/**
 * POST /agents/execute
 * Execute a specific agent task
 * 
 * Body:
 * {
 *   "agentType": "planning",
 *   "payload": {...}
 * }
 */
app.post('/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { agentType, payload, priority } = body;

    if (!agentType || !payload) {
      return c.json({
        success: false,
        error: 'Invalid request. Must include agentType and payload.',
      }, 400);
    }

    const assistant = createFullStackAssistant();
    await assistant.initialize();

    const task: AgentTask = {
      id: `task-${Date.now()}`,
      type: agentType,
      payload,
      priority: priority || 5,
      createdAt: Date.now(),
    };

    const result = await assistant.execute(task);

    return c.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
      nextSteps: result.nextSteps,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute task',
    }, 500);
  }
});

/**
 * GET /agents/health
 * Get health status of all agents
 */
app.get('/health', async (c) => {
  try {
    const assistant = createFullStackAssistant();
    await assistant.initialize();

    const statuses = assistant.getAgentStatuses();
    const healthData: any[] = [];

    statuses.forEach((status, agentType) => {
      healthData.push({
        agent: agentType,
        health: status.health,
        activeTasks: status.activeTasks,
        completedTasks: status.completedTasks,
        failedTasks: status.failedTasks,
        averageResponseTime: status.averageResponseTime,
      });
    });

    return c.json({
      success: true,
      data: healthData,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status',
    }, 500);
  }
});

/**
 * POST /agents/plan
 * Create a project plan without executing it
 */
app.post('/plan', async (c) => {
  try {
    const body = await c.req.json();
    const requirements: ProjectRequirements = body.requirements;

    if (!requirements) {
      return c.json({
        success: false,
        error: 'Missing requirements',
      }, 400);
    }

    const assistant = createFullStackAssistant();
    await assistant.initialize();

    const task: AgentTask = {
      id: `plan-${Date.now()}`,
      type: 'planning',
      payload: { requirements },
      priority: 10,
      createdAt: Date.now(),
    };

    const result = await assistant.execute(task);

    return c.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create plan',
    }, 500);
  }
});

/**
 * GET /agents/history
 * Get orchestration history
 */
app.get('/history', async (c) => {
  try {
    const assistant = createFullStackAssistant();
    await assistant.initialize();

    const history = assistant.getHistory();

    return c.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    }, 500);
  }
});

export default app;
