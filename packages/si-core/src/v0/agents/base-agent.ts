/**
 * Base Agent class - provides common functionality for all specialized agents
 * Integrates with Cognomega's SuperIntelligence architecture
 */

import {
  IAgent,
  AgentConfig,
  AgentTask,
  AgentResult,
  AgentStatus,
  AgentMessage,
  AgentType,
} from './types';
import { TaskPayload } from '../smart-ai-router';

export abstract class BaseAgent implements IAgent {
  public config: AgentConfig;
  protected activeTasks: Map<string, AgentTask> = new Map();
  protected completedTasks: number = 0;
  protected failedTasks: number = 0;
  protected messageQueue: AgentMessage[] = [];
  protected isInitialized: boolean = false;

  constructor(
    type: AgentType,
    name: string,
    capabilities: string[],
    priority: number = 5
  ) {
    this.config = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      capabilities,
      priority,
      enabled: true,
      maxConcurrentTasks: 5,
    };
  }

  async initialize(config?: Partial<AgentConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.isInitialized = true;
    await this.onInitialize();
  }

  /**
   * Hook for subclasses to perform custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Override in subclasses if needed
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.canHandle(task)) {
      return {
        success: false,
        error: `Agent ${this.config.name} cannot handle task of type ${task.type}`,
      };
    }

    if (this.activeTasks.size >= (this.config.maxConcurrentTasks || 5)) {
      return {
        success: false,
        error: `Agent ${this.config.name} is at maximum capacity`,
      };
    }

    const startTime = Date.now();
    this.activeTasks.set(task.id, { ...task, startedAt: startTime });

    try {
      const result = await this.processTask(task);
      const duration = Date.now() - startTime;

      this.activeTasks.delete(task.id);
      this.completedTasks++;

      return {
        ...result,
        metadata: {
          ...result.metadata,
          duration,
        },
      };
    } catch (error) {
      this.activeTasks.delete(task.id);
      this.failedTasks++;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Abstract method that must be implemented by each specialized agent
   */
  protected abstract processTask(task: AgentTask): Promise<AgentResult>;

  canHandle(task: AgentTask): boolean {
    return (
      this.config.enabled &&
      task.type === this.config.type &&
      this.activeTasks.size < (this.config.maxConcurrentTasks || 5)
    );
  }

  getStatus(): AgentStatus {
    const taskTimes: number[] = [];
    this.activeTasks.forEach((task) => {
      if (task.startedAt) {
        taskTimes.push(Date.now() - task.startedAt);
      }
    });

    const averageResponseTime =
      taskTimes.length > 0
        ? taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length
        : undefined;

    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!this.config.enabled) {
      health = 'unhealthy';
    } else if (this.activeTasks.size >= (this.config.maxConcurrentTasks || 5)) {
      health = 'degraded';
    }

    return {
      id: this.config.id,
      name: this.config.name,
      health,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      averageResponseTime,
      lastActivity: this.getLastActivityTime(),
    };
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    await this.handleMessage(message);
  }

  /**
   * Hook for subclasses to handle inter-agent messages
   */
  protected async handleMessage(message: AgentMessage): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Send a message to another agent
   */
  protected async sendMessage(message: AgentMessage): Promise<void> {
    // This would be implemented by the orchestrator
    // For now, we just log it
    console.log(`[${this.config.name}] Sending message:`, message);
  }

  /**
   * Helper to get the last activity timestamp
   */
  private getLastActivityTime(): number | undefined {
    let lastTime: number | undefined;
    this.activeTasks.forEach((task) => {
      if (task.startedAt && (!lastTime || task.startedAt > lastTime)) {
        lastTime = task.startedAt;
      }
    });
    return lastTime;
  }

  /**
   * Convert agent task to TaskPayload for router integration
   */
  protected toTaskPayload(task: AgentTask): TaskPayload {
    return {
      type: 'custom',
      payload: task.payload,
      user: task.context?.userId,
      priority: task.priority,
      context: task.context?.sharedState,
    };
  }

  /**
   * Helper for logging with agent context
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const logMessage = `[${this.config.name}] ${message}`;
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }
}
