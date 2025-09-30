/**
 * Monitoring & Feedback Agent
 * Provides continuous monitoring and feedback loops for deployed agents
 * - Observes deployed agent behavior and collects real-world feedback
 * - Detects drift, concept change, or failures
 * - Triggers retraining, interventions, or updates
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, AgentStatus } from './types';

/**
 * Represents a monitoring observation
 */
export interface MonitoringObservation {
  agentId: string;
  agentType: string;
  timestamp: number;
  metrics: {
    responseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    cpuUsage?: number;
    memoryUsage?: number;
  };
  health: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Represents feedback from real-world usage
 */
export interface UserFeedback {
  id: string;
  agentId: string;
  taskId: string;
  timestamp: number;
  rating?: number; // 1-5
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'bug' | 'suggestion' | 'praise' | 'question' | 'performance';
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Represents detected drift or anomaly
 */
export interface DriftDetection {
  id: string;
  agentId: string;
  type: 'concept_drift' | 'data_drift' | 'performance_degradation' | 'error_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  detectedAt: number;
  metrics: {
    baseline: Record<string, number>;
    current: Record<string, number>;
    deviation: number;
  };
  recommendations: string[];
}

/**
 * Represents an intervention action
 */
export interface InterventionAction {
  id: string;
  agentId: string;
  type: 'retrain' | 'update_config' | 'scale' | 'alert' | 'rollback';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  triggeredBy: string; // drift ID or feedback ID
  triggeredAt: number;
  completedAt?: number;
  result?: string;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  thresholds: {
    errorRate: number;
    responseTime: number;
    successRate: number;
  };
  driftDetection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    windowSize: number; // number of observations
  };
  autoIntervention: {
    enabled: boolean;
    requiresApproval: boolean;
  };
}

export class MonitoringFeedbackAgent extends BaseAgent {
  private observations: Map<string, MonitoringObservation[]> = new Map();
  private feedbackHistory: UserFeedback[] = [];
  private driftDetections: DriftDetection[] = [];
  private interventions: InterventionAction[] = [];
  private monitoringConfig: MonitoringConfig;
  private monitoringIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    super(
      'orchestrator', // Using orchestrator type as it monitors other agents
      'MonitoringFeedbackAgent',
      [
        'monitoring',
        'feedback-collection',
        'drift-detection',
        'anomaly-detection',
        'intervention-triggering',
        'performance-tracking',
        'health-checks',
        'alerting',
      ],
      8 // High priority
    );

    this.monitoringConfig = {
      enabled: true,
      checkInterval: 60000, // 1 minute
      thresholds: {
        errorRate: 0.05, // 5%
        responseTime: 5000, // 5 seconds
        successRate: 0.95, // 95%
      },
      driftDetection: {
        enabled: true,
        sensitivity: 'medium',
        windowSize: 100, // last 100 observations
      },
      autoIntervention: {
        enabled: true,
        requiresApproval: false,
      },
    };
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Initializing MonitoringFeedbackAgent');
    // Start background monitoring if enabled
    if (this.monitoringConfig.enabled) {
      this.log('info', 'Starting continuous monitoring');
    }
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing monitoring task: ${task.id}`);

    const action = task.payload.action as string;

    try {
      switch (action) {
        case 'observe':
          return await this.observeAgent(task.payload);
        case 'collect_feedback':
          return await this.collectFeedback(task.payload);
        case 'detect_drift':
          return await this.detectDrift(task.payload);
        case 'trigger_intervention':
          return await this.triggerIntervention(task.payload);
        case 'get_report':
          return await this.generateMonitoringReport(task.payload);
        case 'configure':
          return await this.updateConfiguration(task.payload);
        default:
          return {
            success: false,
            error: `Unknown monitoring action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process monitoring task',
      };
    }
  }

  /**
   * Observe an agent's behavior and performance
   */
  private async observeAgent(payload: Record<string, unknown>): Promise<AgentResult> {
    const agentStatus = payload.agentStatus as AgentStatus;
    
    if (!agentStatus) {
      return {
        success: false,
        error: 'Missing agent status for observation',
      };
    }

    const observation: MonitoringObservation = {
      agentId: agentStatus.id,
      agentType: agentStatus.name,
      timestamp: Date.now(),
      metrics: {
        responseTime: agentStatus.averageResponseTime || 0,
        successRate: this.calculateSuccessRate(agentStatus),
        errorRate: this.calculateErrorRate(agentStatus),
        throughput: agentStatus.activeTasks,
      },
      health: agentStatus.health,
    };

    // Store observation
    const agentObservations = this.observations.get(agentStatus.id) || [];
    agentObservations.push(observation);
    
    // Keep only recent observations based on window size
    const windowSize = this.monitoringConfig.driftDetection.windowSize;
    if (agentObservations.length > windowSize) {
      agentObservations.shift();
    }
    
    this.observations.set(agentStatus.id, agentObservations);

    // Check for anomalies
    const anomalies = this.checkForAnomalies(observation);

    return {
      success: true,
      data: {
        observation,
        anomalies,
        totalObservations: agentObservations.length,
      },
      metadata: {
        duration: 0,
        confidence: 0.9,
      },
      nextSteps: anomalies.length > 0 ? ['Review anomalies', 'Consider intervention'] : [],
    };
  }

  /**
   * Collect and process user feedback
   */
  private async collectFeedback(payload: Record<string, unknown>): Promise<AgentResult> {
    const feedback = payload.feedback as Partial<UserFeedback>;

    if (!feedback || !feedback.agentId || !feedback.content) {
      return {
        success: false,
        error: 'Invalid feedback data',
      };
    }

    const processedFeedback: UserFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: feedback.agentId,
      taskId: feedback.taskId || 'unknown',
      timestamp: Date.now(),
      rating: feedback.rating,
      sentiment: feedback.sentiment || this.analyzeSentiment(feedback.content),
      category: feedback.category || this.categorizeFeedback(feedback.content),
      content: feedback.content,
      metadata: feedback.metadata,
    };

    this.feedbackHistory.push(processedFeedback);

    // Analyze feedback for patterns
    const analysis = this.analyzeFeedbackPatterns(processedFeedback.agentId);

    // Check if intervention needed based on feedback
    if (this.shouldInterveneByConcatenatedFeedback(analysis)) {
      await this.triggerIntervention({
        agentId: processedFeedback.agentId,
        type: 'update_config',
        reason: 'negative_feedback_pattern',
        feedbackId: processedFeedback.id,
      });
    }

    return {
      success: true,
      data: {
        feedback: processedFeedback,
        analysis,
      },
      metadata: {
        duration: 0,
        confidence: 0.85,
      },
      nextSteps: ['Monitor feedback trends', 'Update agent based on insights'],
    };
  }

  /**
   * Detect drift in agent behavior
   */
  private async detectDrift(payload: Record<string, unknown>): Promise<AgentResult> {
    const agentId = payload.agentId as string;

    if (!agentId) {
      return {
        success: false,
        error: 'Missing agentId for drift detection',
      };
    }

    const observations = this.observations.get(agentId);
    
    if (!observations || observations.length < 10) {
      return {
        success: true,
        data: {
          drift: null,
          message: 'Insufficient data for drift detection',
        },
      };
    }

    const drift = this.performDriftDetection(agentId, observations);

    if (drift) {
      this.driftDetections.push(drift);
      
      // Auto-trigger intervention if severity is high
      if (drift.severity === 'high' || drift.severity === 'critical') {
        if (this.monitoringConfig.autoIntervention.enabled) {
          await this.triggerIntervention({
            agentId,
            type: 'alert',
            reason: 'drift_detected',
            driftId: drift.id,
            severity: drift.severity,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        drift,
        status: drift ? 'drift_detected' : 'no_drift',
      },
      metadata: {
        duration: 0,
        confidence: drift?.confidence || 0.8,
      },
      nextSteps: drift ? drift.recommendations : ['Continue monitoring'],
    };
  }

  /**
   * Trigger an intervention action
   */
  private async triggerIntervention(payload: Record<string, unknown>): Promise<AgentResult> {
    const agentId = payload.agentId as string;
    const type = payload.type as InterventionAction['type'];
    const reason = payload.reason as string;

    if (!agentId || !type) {
      return {
        success: false,
        error: 'Missing required intervention parameters',
      };
    }

    const intervention: InterventionAction = {
      id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      type,
      priority: this.determinePriority(payload),
      status: 'pending',
      triggeredBy: (payload.driftId || payload.feedbackId || 'manual') as string,
      triggeredAt: Date.now(),
    };

    this.interventions.push(intervention);

    // Execute intervention
    const result = await this.executeIntervention(intervention);

    // Update intervention status
    intervention.status = result.success ? 'completed' : 'failed';
    intervention.completedAt = Date.now();
    intervention.result = result.message;

    return {
      success: result.success,
      data: {
        intervention,
        result: result.message,
      },
      metadata: {
        duration: intervention.completedAt - intervention.triggeredAt,
      },
      nextSteps: result.success ? ['Monitor post-intervention behavior'] : ['Review failure', 'Manual intervention may be required'],
    };
  }

  /**
   * Generate comprehensive monitoring report
   */
  private async generateMonitoringReport(payload: Record<string, unknown>): Promise<AgentResult> {
    const agentId = payload.agentId as string | undefined;
    const timeRange = (payload.timeRange as number) || 3600000; // Default 1 hour

    const now = Date.now();
    const startTime = now - timeRange;

    const report = {
      generatedAt: now,
      timeRange: {
        start: startTime,
        end: now,
        duration: timeRange,
      },
      agents: this.generateAgentReports(agentId, startTime),
      feedback: this.generateFeedbackSummary(agentId, startTime),
      driftDetections: this.getDriftDetections(agentId, startTime),
      interventions: this.getInterventions(agentId, startTime),
      recommendations: this.generateRecommendations(agentId),
    };

    return {
      success: true,
      data: report,
      metadata: {
        duration: 0,
        confidence: 0.95,
      },
    };
  }

  /**
   * Update monitoring configuration
   */
  private async updateConfiguration(payload: Record<string, unknown>): Promise<AgentResult> {
    const newConfig = payload.config as Partial<MonitoringConfig>;

    if (!newConfig) {
      return {
        success: false,
        error: 'Missing configuration',
      };
    }

    // Merge with existing config
    this.monitoringConfig = {
      ...this.monitoringConfig,
      ...newConfig,
      thresholds: {
        ...this.monitoringConfig.thresholds,
        ...newConfig.thresholds,
      },
      driftDetection: {
        ...this.monitoringConfig.driftDetection,
        ...newConfig.driftDetection,
      },
      autoIntervention: {
        ...this.monitoringConfig.autoIntervention,
        ...newConfig.autoIntervention,
      },
    };

    return {
      success: true,
      data: {
        config: this.monitoringConfig,
      },
      metadata: {
        duration: 0,
      },
      nextSteps: ['Configuration updated successfully'],
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateSuccessRate(status: AgentStatus): number {
    const total = status.completedTasks + status.failedTasks;
    return total > 0 ? status.completedTasks / total : 1;
  }

  private calculateErrorRate(status: AgentStatus): number {
    const total = status.completedTasks + status.failedTasks;
    return total > 0 ? status.failedTasks / total : 0;
  }

  private checkForAnomalies(observation: MonitoringObservation): string[] {
    const anomalies: string[] = [];

    if (observation.metrics.errorRate > this.monitoringConfig.thresholds.errorRate) {
      anomalies.push(`High error rate: ${(observation.metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (observation.metrics.responseTime > this.monitoringConfig.thresholds.responseTime) {
      anomalies.push(`Slow response time: ${observation.metrics.responseTime}ms`);
    }

    if (observation.metrics.successRate < this.monitoringConfig.thresholds.successRate) {
      anomalies.push(`Low success rate: ${(observation.metrics.successRate * 100).toFixed(2)}%`);
    }

    if (observation.health === 'unhealthy') {
      anomalies.push('Agent health is unhealthy');
    }

    return anomalies;
  }

  private analyzeSentiment(content: string): UserFeedback['sentiment'] {
    const lowerContent = content.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love', 'best'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'worst', 'hate', 'broken'];

    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private categorizeFeedback(content: string): UserFeedback['category'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('bug') || lowerContent.includes('error') || lowerContent.includes('broken')) {
      return 'bug';
    }
    if (lowerContent.includes('suggest') || lowerContent.includes('feature') || lowerContent.includes('add')) {
      return 'suggestion';
    }
    if (lowerContent.includes('slow') || lowerContent.includes('fast') || lowerContent.includes('performance')) {
      return 'performance';
    }
    if (lowerContent.includes('?') || lowerContent.includes('how')) {
      return 'question';
    }
    
    return 'praise';
  }

  private analyzeFeedbackPatterns(agentId: string): Record<string, unknown> {
    const agentFeedback = this.feedbackHistory.filter(f => f.agentId === agentId);
    
    const totalFeedback = agentFeedback.length;
    if (totalFeedback === 0) {
      return { totalFeedback: 0 };
    }

    const sentimentCounts = {
      positive: agentFeedback.filter(f => f.sentiment === 'positive').length,
      negative: agentFeedback.filter(f => f.sentiment === 'negative').length,
      neutral: agentFeedback.filter(f => f.sentiment === 'neutral').length,
    };

    const categoryCounts = {
      bug: agentFeedback.filter(f => f.category === 'bug').length,
      suggestion: agentFeedback.filter(f => f.category === 'suggestion').length,
      praise: agentFeedback.filter(f => f.category === 'praise').length,
      question: agentFeedback.filter(f => f.category === 'question').length,
      performance: agentFeedback.filter(f => f.category === 'performance').length,
    };

    const averageRating = agentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback;

    return {
      totalFeedback,
      sentimentCounts,
      categoryCounts,
      averageRating,
      recentTrend: this.calculateFeedbackTrend(agentFeedback),
    };
  }

  private calculateFeedbackTrend(feedback: UserFeedback[]): string {
    if (feedback.length < 5) return 'insufficient_data';

    const recent = feedback.slice(-5);
    const older = feedback.slice(-10, -5);

    const recentPositive = recent.filter(f => f.sentiment === 'positive').length;
    const olderPositive = older.filter(f => f.sentiment === 'positive').length;

    if (recentPositive > olderPositive) return 'improving';
    if (recentPositive < olderPositive) return 'declining';
    return 'stable';
  }

  private shouldInterveneByConcatenatedFeedback(analysis: Record<string, unknown>): boolean {
    const sentimentCounts = analysis.sentimentCounts as { negative: number; positive: number };
    const categoryCounts = analysis.categoryCounts as { bug: number };
    
    if (!sentimentCounts || !categoryCounts) return false;

    // Intervene if negative feedback exceeds 50% or bug reports are high
    const totalSentiment = sentimentCounts.negative + sentimentCounts.positive;
    const negativeRatio = totalSentiment > 0 ? sentimentCounts.negative / totalSentiment : 0;

    return negativeRatio > 0.5 || categoryCounts.bug > 3;
  }

  private performDriftDetection(
    agentId: string,
    observations: MonitoringObservation[]
  ): DriftDetection | null {
    const recentWindow = observations.slice(-20);
    const baselineWindow = observations.slice(0, 20);

    if (recentWindow.length < 10 || baselineWindow.length < 10) {
      return null;
    }

    // Calculate baseline and current metrics
    const baseline = this.calculateAverageMetrics(baselineWindow);
    const current = this.calculateAverageMetrics(recentWindow);

    // Calculate deviations
    const errorRateDeviation = Math.abs(current.errorRate - baseline.errorRate);
    const responseTimeDeviation = Math.abs(current.responseTime - baseline.responseTime);
    const successRateDeviation = Math.abs(current.successRate - baseline.successRate);

    // Determine if drift is significant based on sensitivity
    const sensitivityThresholds = {
      low: 0.3,
      medium: 0.2,
      high: 0.1,
    };

    const threshold = sensitivityThresholds[this.monitoringConfig.driftDetection.sensitivity];
    const maxDeviation = Math.max(errorRateDeviation, responseTimeDeviation / 1000, successRateDeviation);

    if (maxDeviation > threshold) {
      // Determine drift type and severity
      let type: DriftDetection['type'] = 'performance_degradation';
      let severity: DriftDetection['severity'] = 'medium';

      if (errorRateDeviation > threshold) {
        type = 'error_spike';
        severity = errorRateDeviation > threshold * 2 ? 'critical' : 'high';
      } else if (responseTimeDeviation / 1000 > threshold) {
        type = 'performance_degradation';
        severity = responseTimeDeviation / 1000 > threshold * 2 ? 'high' : 'medium';
      } else if (successRateDeviation > threshold) {
        type = 'concept_drift';
        severity = successRateDeviation > threshold * 2 ? 'high' : 'medium';
      }

      const drift: DriftDetection = {
        id: `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        type,
        severity,
        confidence: Math.min(maxDeviation / threshold, 1),
        description: `Detected ${type} with ${severity} severity`,
        detectedAt: Date.now(),
        metrics: {
          baseline: {
            errorRate: baseline.errorRate,
            responseTime: baseline.responseTime,
            successRate: baseline.successRate,
          },
          current: {
            errorRate: current.errorRate,
            responseTime: current.responseTime,
            successRate: current.successRate,
          },
          deviation: maxDeviation,
        },
        recommendations: this.generateDriftRecommendations(type, severity),
      };

      return drift;
    }

    return null;
  }

  private calculateAverageMetrics(observations: MonitoringObservation[]): {
    errorRate: number;
    responseTime: number;
    successRate: number;
  } {
    const sum = observations.reduce(
      (acc, obs) => ({
        errorRate: acc.errorRate + obs.metrics.errorRate,
        responseTime: acc.responseTime + obs.metrics.responseTime,
        successRate: acc.successRate + obs.metrics.successRate,
      }),
      { errorRate: 0, responseTime: 0, successRate: 0 }
    );

    return {
      errorRate: sum.errorRate / observations.length,
      responseTime: sum.responseTime / observations.length,
      successRate: sum.successRate / observations.length,
    };
  }

  private generateDriftRecommendations(
    type: DriftDetection['type'],
    severity: DriftDetection['severity']
  ): string[] {
    const recommendations: string[] = [];

    switch (type) {
      case 'error_spike':
        recommendations.push('Review recent error logs');
        recommendations.push('Check for changes in input data');
        if (severity === 'critical' || severity === 'high') {
          recommendations.push('Consider immediate rollback');
          recommendations.push('Alert on-call team');
        }
        break;
      case 'performance_degradation':
        recommendations.push('Profile agent execution');
        recommendations.push('Check resource utilization');
        recommendations.push('Consider scaling resources');
        break;
      case 'concept_drift':
        recommendations.push('Retrain model with recent data');
        recommendations.push('Review feature distributions');
        recommendations.push('Update validation dataset');
        break;
      case 'data_drift':
        recommendations.push('Analyze input data changes');
        recommendations.push('Update data preprocessing pipeline');
        recommendations.push('Retrain with representative data');
        break;
    }

    return recommendations;
  }

  private determinePriority(payload: Record<string, unknown>): InterventionAction['priority'] {
    const severity = payload.severity as string;
    
    if (severity === 'critical') return 'critical';
    if (severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  private async executeIntervention(intervention: InterventionAction): Promise<{
    success: boolean;
    message: string;
  }> {
    this.log('info', `Executing intervention: ${intervention.type} for agent ${intervention.agentId}`);

    // Simulate intervention execution
    switch (intervention.type) {
      case 'alert':
        return {
          success: true,
          message: `Alert sent for agent ${intervention.agentId}`,
        };
      case 'retrain':
        return {
          success: true,
          message: `Retraining initiated for agent ${intervention.agentId}`,
        };
      case 'update_config':
        return {
          success: true,
          message: `Configuration updated for agent ${intervention.agentId}`,
        };
      case 'scale':
        return {
          success: true,
          message: `Scaling initiated for agent ${intervention.agentId}`,
        };
      case 'rollback':
        return {
          success: true,
          message: `Rollback initiated for agent ${intervention.agentId}`,
        };
      default:
        return {
          success: false,
          message: `Unknown intervention type: ${intervention.type}`,
        };
    }
  }

  private generateAgentReports(
    agentId: string | undefined,
    startTime: number
  ): Record<string, unknown>[] {
    const reports: Record<string, unknown>[] = [];

    this.observations.forEach((observations, id) => {
      if (agentId && id !== agentId) return;

      const filtered = observations.filter(obs => obs.timestamp >= startTime);
      if (filtered.length === 0) return;

      const metrics = this.calculateAverageMetrics(filtered);
      
      reports.push({
        agentId: id,
        observationCount: filtered.length,
        averageMetrics: metrics,
        health: filtered[filtered.length - 1].health,
      });
    });

    return reports;
  }

  private generateFeedbackSummary(
    agentId: string | undefined,
    startTime: number
  ): Record<string, unknown> {
    let feedback = this.feedbackHistory.filter(f => f.timestamp >= startTime);
    
    if (agentId) {
      feedback = feedback.filter(f => f.agentId === agentId);
    }

    const sentimentCounts = {
      positive: feedback.filter(f => f.sentiment === 'positive').length,
      negative: feedback.filter(f => f.sentiment === 'negative').length,
      neutral: feedback.filter(f => f.sentiment === 'neutral').length,
    };

    const categoryCounts = {
      bug: feedback.filter(f => f.category === 'bug').length,
      suggestion: feedback.filter(f => f.category === 'suggestion').length,
      praise: feedback.filter(f => f.category === 'praise').length,
      question: feedback.filter(f => f.category === 'question').length,
      performance: feedback.filter(f => f.category === 'performance').length,
    };

    return {
      total: feedback.length,
      sentimentCounts,
      categoryCounts,
      recentFeedback: feedback.slice(-5),
    };
  }

  private getDriftDetections(
    agentId: string | undefined,
    startTime: number
  ): DriftDetection[] {
    let detections = this.driftDetections.filter(d => d.detectedAt >= startTime);
    
    if (agentId) {
      detections = detections.filter(d => d.agentId === agentId);
    }

    return detections;
  }

  private getInterventions(
    agentId: string | undefined,
    startTime: number
  ): InterventionAction[] {
    let interventions = this.interventions.filter(i => i.triggeredAt >= startTime);
    
    if (agentId) {
      interventions = interventions.filter(i => i.agentId === agentId);
    }

    return interventions;
  }

  private generateRecommendations(agentId: string | undefined): string[] {
    const recommendations: string[] = [];

    // Check for recent drift
    const recentDrift = this.driftDetections
      .filter(d => !agentId || d.agentId === agentId)
      .filter(d => Date.now() - d.detectedAt < 3600000); // Last hour

    if (recentDrift.length > 0) {
      recommendations.push(`${recentDrift.length} drift detection(s) in the last hour`);
      recommendations.push('Review drift patterns and consider intervention');
    }

    // Check for negative feedback
    const recentNegativeFeedback = this.feedbackHistory
      .filter(f => !agentId || f.agentId === agentId)
      .filter(f => f.sentiment === 'negative')
      .filter(f => Date.now() - f.timestamp < 3600000);

    if (recentNegativeFeedback.length > 3) {
      recommendations.push('High volume of negative feedback detected');
      recommendations.push('Review user feedback and address common issues');
    }

    // Check for pending interventions
    const pendingInterventions = this.interventions
      .filter(i => !agentId || i.agentId === agentId)
      .filter(i => i.status === 'pending' || i.status === 'in_progress');

    if (pendingInterventions.length > 0) {
      recommendations.push(`${pendingInterventions.length} intervention(s) in progress`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally');
      recommendations.push('Continue monitoring for anomalies');
    }

    return recommendations;
  }

  /**
   * Start continuous monitoring for a specific agent
   */
  public startMonitoring(agentId: string, agent: { getStatus: () => AgentStatus }): void {
    if (this.monitoringIntervals.has(agentId)) {
      this.log('warn', `Monitoring already active for agent ${agentId}`);
      return;
    }

    this.log('info', `Starting monitoring for agent ${agentId}`);

    const interval = setInterval(async () => {
      const status = agent.getStatus();
      await this.observeAgent({ agentStatus: status });
    }, this.monitoringConfig.checkInterval);

    this.monitoringIntervals.set(agentId, interval);
  }

  /**
   * Stop monitoring for a specific agent
   */
  public stopMonitoring(agentId: string): void {
    const interval = this.monitoringIntervals.get(agentId);
    
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(agentId);
      this.log('info', `Stopped monitoring for agent ${agentId}`);
    }
  }

  /**
   * Get current monitoring configuration
   */
  public getConfiguration(): MonitoringConfig {
    return { ...this.monitoringConfig };
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): Record<string, unknown> {
    return {
      totalObservations: Array.from(this.observations.values()).reduce((sum, obs) => sum + obs.length, 0),
      totalFeedback: this.feedbackHistory.length,
      totalDriftDetections: this.driftDetections.length,
      totalInterventions: this.interventions.length,
      activeMonitoring: this.monitoringIntervals.size,
      config: this.monitoringConfig,
    };
  }
}
