/**
 * Collaboration Agent
 * Facilitates teamwork between AIs and humans with social intelligence
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, AgentMessage } from './types';

/**
 * User/Team preference model for adapting communication and collaboration
 */
export interface CollaborationPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'concise';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  notificationPreference: 'all' | 'important' | 'minimal';
  escalationThreshold: 'low' | 'medium' | 'high';
  preferredLanguage?: string;
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  responseExpectation: 'immediate' | 'normal' | 'asynchronous';
}

/**
 * Collaboration context for tracking team interactions
 */
export interface CollaborationContext {
  participants: string[];
  agentIds: string[];
  taskComplexity: number;
  consensusRequired: boolean;
  humanInputRequired: boolean;
  escalationReason?: string;
  communicationHistory: CollaborationMessage[];
}

/**
 * Message structure for collaboration communications
 */
export interface CollaborationMessage {
  id: string;
  from: string;
  to: string[];
  type: 'request' | 'response' | 'escalation' | 'notification' | 'coordination';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  requiresResponse: boolean;
  context?: Record<string, unknown>;
}

/**
 * Decision coordination result
 */
export interface CoordinationResult {
  decision: string;
  confidence: number;
  agentsInAgreement: string[];
  agentsInDisagreement: string[];
  humanReviewRequired: boolean;
  reasoning: string;
}

/**
 * CollaborationAgent: Manages teamwork between AIs and humans
 */
export class CollaborationAgent extends BaseAgent {
  private userPreferences: Map<string, CollaborationPreferences> = new Map();
  private activeCollaborations: Map<string, CollaborationContext> = new Map();
  private escalationThresholds = {
    complexityThreshold: 0.7,
    uncertaintyThreshold: 0.6,
    consensusThreshold: 0.8,
  };

  constructor() {
    super(
      'collaboration',
      'CollaborationAgent',
      [
        'team-coordination',
        'human-ai-collaboration',
        'preference-modeling',
        'escalation-detection',
        'communication-adaptation',
        'consensus-building',
        'social-intelligence',
      ],
      7
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing collaboration task: ${task.id}`);

    try {
      const action = task.payload.action as string;

      switch (action) {
        case 'coordinate':
          return await this.coordinateAgents(task);
        case 'escalate':
          return await this.escalateToHuman(task);
        case 'adapt-communication':
          return await this.adaptCommunicationStyle(task);
        case 'model-preferences':
          return await this.modelUserPreferences(task);
        case 'build-consensus':
          return await this.buildConsensus(task);
        default:
          return await this.facilitateCollaboration(task);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Collaboration task failed',
        metadata: {
          duration: 0,
        },
      };
    }
  }

  /**
   * Main collaboration facilitation logic
   */
  private async facilitateCollaboration(task: AgentTask): Promise<AgentResult> {
    const collaborationId = `collab-${Date.now()}`;
    const context: CollaborationContext = {
      participants: (task.payload.participants as string[]) || [],
      agentIds: (task.payload.agentIds as string[]) || [],
      taskComplexity: this.assessTaskComplexity(task),
      consensusRequired: (task.payload.consensusRequired as boolean) || false,
      humanInputRequired: false,
      communicationHistory: [],
    };

    this.activeCollaborations.set(collaborationId, context);

    // Detect if human escalation is needed
    const shouldEscalate = this.shouldEscalateToHuman(task, context);
    if (shouldEscalate.escalate) {
      context.humanInputRequired = true;
      context.escalationReason = shouldEscalate.reason;
    }

    return {
      success: true,
      data: {
        collaborationId,
        context,
        requiresHumanInput: shouldEscalate.escalate,
        escalationReason: shouldEscalate.reason,
        suggestedActions: this.suggestCollaborationActions(context),
      },
      metadata: {
        duration: 0,
        confidence: shouldEscalate.confidence,
        suggestions: [
          'Monitor collaboration progress',
          'Facilitate communication between parties',
          'Be ready to escalate if needed',
        ],
      },
      nextSteps: shouldEscalate.escalate
        ? ['Request human input', 'Pause dependent tasks', 'Provide context to human']
        : ['Proceed with agent coordination', 'Monitor progress', 'Build consensus'],
    };
  }

  /**
   * Coordinate multiple agents on a shared task
   */
  private async coordinateAgents(task: AgentTask): Promise<AgentResult> {
    const agentIds = (task.payload.agentIds as string[]) || [];
    const coordinationTask = task.payload.coordinationTask as string;

    const messages: CollaborationMessage[] = [];
    for (const agentId of agentIds) {
      messages.push({
        id: `msg-${Date.now()}-${agentId}`,
        from: this.config.id,
        to: [agentId],
        type: 'coordination',
        content: `Coordination request: ${coordinationTask}`,
        priority: 'medium',
        timestamp: Date.now(),
        requiresResponse: true,
        context: { task: coordinationTask },
      });
    }

    return {
      success: true,
      data: {
        coordinationMessages: messages,
        agentCount: agentIds.length,
        coordinationStrategy: 'parallel-execution',
      },
      metadata: {
        duration: 0,
        confidence: 0.85,
      },
      nextSteps: ['Await agent responses', 'Synthesize results', 'Build consensus'],
    };
  }

  /**
   * Escalate to human when necessary
   */
  private async escalateToHuman(task: AgentTask): Promise<AgentResult> {
    const reason = task.payload.reason as string || 'Manual review required';
    const priority = task.payload.priority as 'low' | 'medium' | 'high' | 'critical' || 'medium';
    const userId = task.context?.userId;

    const userPrefs = userId ? this.userPreferences.get(userId) : undefined;

    const escalationMessage: CollaborationMessage = {
      id: `escalation-${Date.now()}`,
      from: this.config.id,
      to: userId ? [userId] : [],
      type: 'escalation',
      content: `Human input needed: ${reason}`,
      priority,
      timestamp: Date.now(),
      requiresResponse: true,
      context: {
        taskId: task.id,
        reason,
        urgency: priority,
      },
    };

    const adaptedMessage = userPrefs
      ? this.adaptMessageToPreferences(escalationMessage, userPrefs)
      : escalationMessage;

    this.log('info', `Escalating to human: ${reason}`);

    return {
      success: true,
      data: {
        escalation: adaptedMessage,
        estimatedResponseTime: this.estimateResponseTime(userPrefs),
        blockedTasks: task.payload.blockedTasks || [],
      },
      metadata: {
        duration: 0,
        confidence: 0.9,
        suggestions: [
          'Provide clear context for human',
          'Highlight specific decision points',
          'Suggest alternatives if available',
        ],
      },
      nextSteps: ['Wait for human response', 'Resume blocked tasks after approval'],
    };
  }

  /**
   * Adapt communication style based on user/team preferences
   */
  private async adaptCommunicationStyle(task: AgentTask): Promise<AgentResult> {
    const userId = task.context?.userId || (task.payload.userId as string);
    const message = task.payload.message as string;

    if (!userId) {
      return {
        success: false,
        error: 'User ID required for communication adaptation',
      };
    }

    const preferences = this.userPreferences.get(userId) || this.getDefaultPreferences();
    const adaptedMessage = this.adaptMessageStyle(message, preferences);

    return {
      success: true,
      data: {
        originalMessage: message,
        adaptedMessage,
        communicationStyle: preferences.communicationStyle,
        expertiseLevel: preferences.expertiseLevel,
      },
      metadata: {
        duration: 0,
        confidence: 0.88,
      },
    };
  }

  /**
   * Model and learn user/team preferences
   */
  private async modelUserPreferences(task: AgentTask): Promise<AgentResult> {
    const userId = task.context?.userId || (task.payload.userId as string);
    const interactionData = task.payload.interactionData as Record<string, unknown>;

    if (!userId) {
      return {
        success: false,
        error: 'User ID required for preference modeling',
      };
    }

    // Extract preferences from interaction patterns
    const preferences = this.extractPreferencesFromInteraction(interactionData);
    
    // Update or create user preferences
    const existingPrefs = this.userPreferences.get(userId) || this.getDefaultPreferences();
    const updatedPrefs = { ...existingPrefs, ...preferences };
    this.userPreferences.set(userId, updatedPrefs);

    this.log('info', `Updated preferences for user: ${userId}`);

    return {
      success: true,
      data: {
        userId,
        preferences: updatedPrefs,
        learningConfidence: 0.75,
      },
      metadata: {
        duration: 0,
        confidence: 0.75,
        suggestions: ['Continue monitoring interactions', 'Refine preference model over time'],
      },
    };
  }

  /**
   * Build consensus among multiple agents or stakeholders
   */
  private async buildConsensus(task: AgentTask): Promise<AgentResult> {
    const proposals = (task.payload.proposals as string[]) || [];
    const agentIds = (task.payload.agentIds as string[]) || [];
    const votes = (task.payload.votes as Record<string, string>) || {};

    if (proposals.length === 0) {
      return {
        success: false,
        error: 'No proposals provided for consensus building',
      };
    }

    const coordinationResult = this.analyzeConsensus(proposals, votes, agentIds);

    return {
      success: true,
      data: coordinationResult,
      metadata: {
        duration: 0,
        confidence: coordinationResult.confidence,
        suggestions: coordinationResult.humanReviewRequired
          ? ['Request human review', 'Present all perspectives', 'Highlight key disagreements']
          : ['Proceed with consensus decision', 'Document reasoning'],
      },
      nextSteps: coordinationResult.humanReviewRequired
        ? ['Escalate to human', 'Provide full context']
        : ['Implement consensus decision', 'Notify all participants'],
    };
  }

  /**
   * Detect when to escalate to human input
   */
  private shouldEscalateToHuman(
    task: AgentTask,
    context: CollaborationContext
  ): { escalate: boolean; reason?: string; confidence: number } {
    // High complexity tasks need human oversight
    if (context.taskComplexity > this.escalationThresholds.complexityThreshold) {
      return {
        escalate: true,
        reason: 'Task complexity exceeds automated handling threshold',
        confidence: 0.9,
      };
    }

    // Consensus required but not achievable among agents
    if (context.consensusRequired && context.agentIds.length > 2) {
      return {
        escalate: true,
        reason: 'Multiple agents involved, human coordination recommended',
        confidence: 0.85,
      };
    }

    // Explicit human input requested
    if (task.payload.requiresHumanApproval) {
      return {
        escalate: true,
        reason: 'Human approval explicitly required',
        confidence: 1.0,
      };
    }

    return { escalate: false, confidence: 0.8 };
  }

  /**
   * Assess task complexity for collaboration planning
   */
  private assessTaskComplexity(task: AgentTask): number {
    let complexity = 0.3; // Base complexity

    // Multiple dependencies increase complexity
    if (task.dependencies && task.dependencies.length > 2) {
      complexity += 0.2;
    }

    // High priority tasks are often complex
    if (task.priority >= 8) {
      complexity += 0.15;
    }

    // Multiple participants increase coordination complexity
    const participantCount = (task.payload.participants as string[])?.length || 0;
    if (participantCount > 3) {
      complexity += 0.2;
    }

    return Math.min(complexity, 1.0);
  }

  /**
   * Analyze consensus from votes and proposals
   */
  private analyzeConsensus(
    proposals: string[],
    votes: Record<string, string>,
    agentIds: string[]
  ): CoordinationResult {
    const voteCounts: Record<string, number> = {};
    const supportingAgents: Record<string, string[]> = {};

    // Count votes for each proposal
    for (const [agentId, vote] of Object.entries(votes)) {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      if (!supportingAgents[vote]) {
        supportingAgents[vote] = [];
      }
      supportingAgents[vote].push(agentId);
    }

    // Find the proposal with most votes
    let topProposal = proposals[0];
    let maxVotes = 0;
    for (const proposal of proposals) {
      const count = voteCounts[proposal] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        topProposal = proposal;
      }
    }

    const totalVotes = Object.keys(votes).length;
    const consensusRatio = totalVotes > 0 ? maxVotes / totalVotes : 0;
    const humanReviewRequired = consensusRatio < this.escalationThresholds.consensusThreshold;

    const agentsInAgreement = supportingAgents[topProposal] || [];
    const agentsInDisagreement = agentIds.filter((id) => !agentsInAgreement.includes(id));

    return {
      decision: topProposal,
      confidence: consensusRatio,
      agentsInAgreement,
      agentsInDisagreement,
      humanReviewRequired,
      reasoning: `Consensus ratio: ${(consensusRatio * 100).toFixed(1)}%. ${
        humanReviewRequired
          ? 'Below threshold, human review recommended.'
          : 'Sufficient agreement reached.'
      }`,
    };
  }

  /**
   * Suggest collaboration actions based on context
   */
  private suggestCollaborationActions(context: CollaborationContext): string[] {
    const actions: string[] = [];

    if (context.humanInputRequired) {
      actions.push('Prepare escalation summary for human review');
    }

    if (context.agentIds.length > 3) {
      actions.push('Establish coordination protocol for multiple agents');
    }

    if (context.taskComplexity > 0.7) {
      actions.push('Break down complex task into smaller subtasks');
    }

    if (context.consensusRequired) {
      actions.push('Initiate consensus-building process');
    }

    return actions;
  }

  /**
   * Adapt message to user preferences
   */
  private adaptMessageToPreferences(
    message: CollaborationMessage,
    preferences: CollaborationPreferences
  ): CollaborationMessage {
    const adapted = { ...message };

    // Adjust priority based on notification preference
    if (preferences.notificationPreference === 'minimal' && message.priority === 'low') {
      adapted.requiresResponse = false;
    }

    // Add context for expertise level
    if (preferences.expertiseLevel === 'beginner') {
      adapted.content = `[Simplified] ${adapted.content}`;
    } else if (preferences.expertiseLevel === 'expert') {
      adapted.content = `[Technical] ${adapted.content}`;
    }

    return adapted;
  }

  /**
   * Adapt message style based on preferences
   */
  private adaptMessageStyle(message: string, preferences: CollaborationPreferences): string {
    let adapted = message;

    switch (preferences.communicationStyle) {
      case 'formal':
        adapted = `Dear User, ${adapted}. Best regards.`;
        break;
      case 'casual':
        adapted = `Hey! ${adapted} 😊`;
        break;
      case 'technical':
        adapted = `[TECH] ${adapted}`;
        break;
      case 'concise':
        // Truncate if too long
        if (adapted.length > 100) {
          adapted = adapted.substring(0, 97) + '...';
        }
        break;
    }

    return adapted;
  }

  /**
   * Extract preferences from user interaction data
   */
  private extractPreferencesFromInteraction(
    interactionData: Record<string, unknown>
  ): Partial<CollaborationPreferences> {
    const preferences: Partial<CollaborationPreferences> = {};

    // Analyze response patterns
    if (interactionData.averageResponseTime) {
      const responseTime = interactionData.averageResponseTime as number;
      preferences.responseExpectation =
        responseTime < 60000 ? 'immediate' : responseTime < 300000 ? 'normal' : 'asynchronous';
    }

    // Analyze message length preferences
    if (interactionData.averageMessageLength) {
      const length = interactionData.averageMessageLength as number;
      preferences.communicationStyle = length < 50 ? 'concise' : 'technical';
    }

    // Analyze expertise indicators
    if (interactionData.technicalTermUsage) {
      const usage = interactionData.technicalTermUsage as number;
      preferences.expertiseLevel =
        usage > 0.7 ? 'expert' : usage > 0.4 ? 'advanced' : 'intermediate';
    }

    return preferences;
  }

  /**
   * Get default preferences for new users
   */
  private getDefaultPreferences(): CollaborationPreferences {
    return {
      communicationStyle: 'technical',
      expertiseLevel: 'intermediate',
      notificationPreference: 'important',
      escalationThreshold: 'medium',
      responseExpectation: 'normal',
    };
  }

  /**
   * Estimate response time based on user preferences
   */
  private estimateResponseTime(preferences?: CollaborationPreferences): string {
    if (!preferences) {
      return '1-2 hours';
    }

    switch (preferences.responseExpectation) {
      case 'immediate':
        return '5-15 minutes';
      case 'normal':
        return '1-2 hours';
      case 'asynchronous':
        return '4-24 hours';
      default:
        return '1-2 hours';
    }
  }

  /**
   * Handle inter-agent messages for collaboration
   */
  protected async handleMessage(message: AgentMessage): Promise<void> {
    this.log('info', `Received message from ${message.from}`);

    // Track collaboration messages
    const activeCollab = Array.from(this.activeCollaborations.values()).find(
      (collab) => collab.agentIds.includes(message.from) || collab.agentIds.includes(message.to)
    );

    if (activeCollab) {
      activeCollab.communicationHistory.push({
        id: `msg-${Date.now()}`,
        from: message.from,
        to: [message.to],
        type: message.type === 'request' ? 'request' : 'response',
        content: JSON.stringify(message.payload),
        priority: 'medium',
        timestamp: message.timestamp,
        requiresResponse: message.type === 'request',
      });
    }
  }
}
