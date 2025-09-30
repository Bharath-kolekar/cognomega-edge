/**
 * FullStack AI Assistant - Orchestrator
 * Coordinates multiple specialized agents to execute complex full-stack projects
 */

import { BaseAgent } from './base-agent';
import {
  AgentTask,
  AgentResult,
  IAgent,
  OrchestrationPlan,
  OrchestrationResult,
  TaskDependency,
  ProjectRequirements,
} from './types';
import { ProjectPlanningAgent } from './project-planning-agent';
import { UIDesignAgent } from './ui-design-agent';
import { FrontendDevAgent } from './frontend-dev-agent';
import { BackendDevAgent } from './backend-dev-agent';
import { DatabaseAgent } from './database-agent';
import { DevOpsAgent } from './devops-agent';
import { TestingAgent } from './testing-agent';
import { EthicsAlignmentAgent } from './ethics-alignment-agent';

export class FullStackAIAssistant extends BaseAgent {
  private agents: Map<string, IAgent> = new Map();
  private orchestrationHistory: OrchestrationResult[] = [];

  constructor() {
    super(
      'orchestrator',
      'FullStackAIAssistant',
      [
        'orchestration',
        'project-coordination',
        'task-delegation',
        'workflow-management',
        'full-stack-development',
      ],
      10 // Highest priority
    );

    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Register all specialized agents
    this.registerSpecializedAgent(new ProjectPlanningAgent());
    this.registerSpecializedAgent(new UIDesignAgent());
    this.registerSpecializedAgent(new FrontendDevAgent());
    this.registerSpecializedAgent(new BackendDevAgent());
    this.registerSpecializedAgent(new DatabaseAgent());
    this.registerSpecializedAgent(new DevOpsAgent());
    this.registerSpecializedAgent(new TestingAgent());
    this.registerSpecializedAgent(new EthicsAlignmentAgent());
  }

  private registerSpecializedAgent(agent: IAgent): void {
    this.agents.set(agent.config.type, agent);
    this.log('info', `Registered agent: ${agent.config.name}`);
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Orchestrating task: ${task.id}`);

    const requirements = task.payload.requirements as ProjectRequirements;
    if (!requirements) {
      return {
        success: false,
        error: 'Missing project requirements',
      };
    }

    try {
      // Create orchestration plan
      const plan = await this.createOrchestrationPlan(requirements, task);
      
      // Execute the plan
      const result = await this.executePlan(plan);
      
      // Store in history
      this.orchestrationHistory.push(result);

      return {
        success: result.success,
        data: result,
        metadata: {
          duration: result.duration,
          confidence: this.calculateOverallConfidence(result),
          suggestions: this.generateOrchestrationSuggestions(result),
        },
        nextSteps: ['Review artifacts', 'Deploy application', 'Monitor performance'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Orchestration failed',
      };
    }
  }

  private async createOrchestrationPlan(
    requirements: ProjectRequirements,
    task: AgentTask
  ): Promise<OrchestrationPlan> {
    const planId = `orchestration-${Date.now()}`;
    const tasks: AgentTask[] = [];
    const dependencies: TaskDependency[] = [];

    // Phase 1: Planning
    const planningTask: AgentTask = {
      id: `${planId}-planning`,
      type: 'planning',
      payload: { requirements },
      priority: 10,
      context: task.context,
      createdAt: Date.now(),
    };
    tasks.push(planningTask);

    // Phase 2: Design (depends on planning)
    if (requirements.framework || requirements.targetPlatform === 'web') {
      const designTask: AgentTask = {
        id: `${planId}-design`,
        type: 'ui-design',
        payload: { requirements },
        priority: 9,
        context: task.context,
        dependencies: [planningTask.id],
        createdAt: Date.now(),
      };
      tasks.push(designTask);
      dependencies.push({
        taskId: designTask.id,
        dependsOn: [planningTask.id],
        type: 'sequential',
      });
    }

    // Phase 3: Database setup (can be parallel with frontend after planning)
    if (this.requiresDatabase(requirements)) {
      const dbTask: AgentTask = {
        id: `${planId}-database`,
        type: 'database',
        payload: { requirements, databaseType: 'postgresql' },
        priority: 8,
        context: task.context,
        dependencies: [planningTask.id],
        createdAt: Date.now(),
      };
      tasks.push(dbTask);
      dependencies.push({
        taskId: dbTask.id,
        dependsOn: [planningTask.id],
        type: 'parallel',
      });
    }

    // Phase 4: Backend development (depends on database if present)
    if (this.requiresBackend(requirements)) {
      const backendTask: AgentTask = {
        id: `${planId}-backend`,
        type: 'backend',
        payload: { requirements },
        priority: 8,
        context: task.context,
        dependencies: this.requiresDatabase(requirements)
          ? [planningTask.id, `${planId}-database`]
          : [planningTask.id],
        createdAt: Date.now(),
      };
      tasks.push(backendTask);
      dependencies.push({
        taskId: backendTask.id,
        dependsOn: backendTask.dependencies!,
        type: 'sequential',
      });
    }

    // Phase 5: Frontend development (depends on design if present)
    if (requirements.framework) {
      const frontendDeps = tasks.find(t => t.type === 'ui-design')
        ? [planningTask.id, `${planId}-design`]
        : [planningTask.id];

      const frontendTask: AgentTask = {
        id: `${planId}-frontend`,
        type: 'frontend',
        payload: { requirements, framework: requirements.framework },
        priority: 8,
        context: task.context,
        dependencies: frontendDeps,
        createdAt: Date.now(),
      };
      tasks.push(frontendTask);
      dependencies.push({
        taskId: frontendTask.id,
        dependsOn: frontendDeps,
        type: 'sequential',
      });
    }

    // Phase 6: Testing (depends on all development tasks)
    const devTaskTypes = new Set(['frontend', 'backend', 'database']);
    const devTaskIds = tasks
      .filter(t => devTaskTypes.has(t.type))
      .map(t => t.id);
    
    if (devTaskIds.length > 0) {
      const testingTask: AgentTask = {
        id: `${planId}-testing`,
        type: 'testing',
        payload: { requirements },
        priority: 7,
        context: task.context,
        dependencies: devTaskIds,
        createdAt: Date.now(),
      };
      tasks.push(testingTask);
      dependencies.push({
        taskId: testingTask.id,
        dependsOn: devTaskIds,
        type: 'sequential',
      });
    }

    // Phase 7: DevOps (depends on testing)
    const testingTaskId = tasks.find(t => t.type === 'testing')?.id;
    const devopsTask: AgentTask = {
      id: `${planId}-devops`,
      type: 'devops',
      payload: { requirements },
      priority: 6,
      context: task.context,
      dependencies: testingTaskId ? [testingTaskId] : devTaskIds,
      createdAt: Date.now(),
    };
    tasks.push(devopsTask);
    dependencies.push({
      taskId: devopsTask.id,
      dependsOn: devopsTask.dependencies!,
      type: 'sequential',
    });

    // Determine execution order based on dependencies
    const executionOrder = this.topologicalSort(tasks, dependencies);

    return {
      id: planId,
      projectId: task.context?.projectId || 'unknown',
      tasks,
      dependencies,
      executionOrder,
      status: 'pending',
      created: Date.now(),
    };
  }

  private async executePlan(plan: OrchestrationPlan): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results = new Map<string, AgentResult>();
    const errors = new Map<string, string>();

    plan.status = 'executing';
    plan.started = startTime;

    this.log('info', `Executing orchestration plan: ${plan.id}`);
    this.log('info', `Execution order: ${plan.executionOrder.join(' -> ')}`);

    // Execute tasks in order
    for (const taskId of plan.executionOrder) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (!task) continue;

      this.log('info', `Executing task: ${task.id} (${task.type})`);

      const agent = this.agents.get(task.type);
      if (!agent) {
        errors.set(taskId, `No agent found for type: ${task.type}`);
        continue;
      }

      try {
        // Check if dependencies are satisfied
        const depsFailed = task.dependencies?.some(depId => errors.has(depId));
        if (depsFailed) {
          errors.set(taskId, 'Dependencies failed');
          continue;
        }

        // Enrich task payload with previous results
        const enrichedTask = this.enrichTaskWithContext(task, results);

        // Execute the task
        const result = await agent.execute(enrichedTask);
        results.set(taskId, result);

        if (!result.success) {
          errors.set(taskId, result.error || 'Task failed');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.set(taskId, errorMsg);
        this.log('error', `Task ${taskId} failed`, error);
      }
    }

    const duration = Date.now() - startTime;
    plan.status = errors.size === 0 ? 'completed' : 'failed';
    plan.completed = Date.now();

    const summary = this.generateExecutionSummary(plan, results, errors);

    return {
      planId: plan.id,
      success: errors.size === 0,
      results,
      errors,
      duration,
      summary,
    };
  }

  private enrichTaskWithContext(
    task: AgentTask,
    previousResults: Map<string, AgentResult>
  ): AgentTask {
    const contextData: Record<string, unknown> = {};

    // Add results from dependencies
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depResult = previousResults.get(depId);
        if (depResult?.success) {
          const depType = depId.split('-').pop();
          contextData[depType || 'unknown'] = depResult.data;
        }
      }
    }

    return {
      ...task,
      payload: {
        ...task.payload,
        ...contextData,
      },
    };
  }

  private topologicalSort(
    tasks: AgentTask[],
    dependencies: TaskDependency[]
  ): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (taskId: string): void => {
      if (temp.has(taskId)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(taskId)) {
        return;
      }

      temp.add(taskId);

      const deps = dependencies.find(d => d.taskId === taskId);
      if (deps) {
        for (const depId of deps.dependsOn) {
          visit(depId);
        }
      }

      temp.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    }

    return sorted;
  }

  private generateExecutionSummary(
    plan: OrchestrationPlan,
    results: Map<string, AgentResult>,
    errors: Map<string, string>
  ): string {
    const total = plan.tasks.length;
    const successful = results.size - errors.size;
    const failed = errors.size;

    let summary = `Orchestration completed: ${successful}/${total} tasks successful`;
    
    if (failed > 0) {
      summary += `\n${failed} tasks failed:`;
      errors.forEach((error, taskId) => {
        summary += `\n  - ${taskId}: ${error}`;
      });
    }

    return summary;
  }

  private calculateOverallConfidence(result: OrchestrationResult): number {
    let totalConfidence = 0;
    let count = 0;

    result.results.forEach((agentResult) => {
      if (agentResult.success && agentResult.metadata?.confidence) {
        totalConfidence += agentResult.metadata.confidence;
        count++;
      }
    });

    return count > 0 ? totalConfidence / count : 0;
  }

  private generateOrchestrationSuggestions(result: OrchestrationResult): string[] {
    const suggestions: string[] = [];

    if (result.errors.size > 0) {
      suggestions.push(`Review and fix ${result.errors.size} failed tasks`);
    }

    if (result.duration > 300000) { // > 5 minutes
      suggestions.push('Consider optimizing agent execution for better performance');
    }

    const confidence = this.calculateOverallConfidence(result);
    if (confidence < 0.8) {
      suggestions.push('Overall confidence is below 80%, consider manual review');
    }

    return suggestions;
  }

  private requiresBackend(requirements: ProjectRequirements): boolean {
    return requirements.targetPlatform === 'fullstack' ||
      requirements.features?.some(f => 
        f.toLowerCase().includes('api') || 
        f.toLowerCase().includes('backend')
      ) || false;
  }

  private requiresDatabase(requirements: ProjectRequirements): boolean {
    return requirements.features?.some(f => 
      f.toLowerCase().includes('database') ||
      f.toLowerCase().includes('data') ||
      f.toLowerCase().includes('storage')
    ) || false;
  }

  /**
   * Get status of all registered agents
   */
  getAgentStatuses(): Map<string, any> {
    const statuses = new Map();
    this.agents.forEach((agent, type) => {
      statuses.set(type, agent.getStatus());
    });
    return statuses;
  }

  /**
   * Get orchestration history
   */
  getHistory(): OrchestrationResult[] {
    return this.orchestrationHistory;
  }
}
