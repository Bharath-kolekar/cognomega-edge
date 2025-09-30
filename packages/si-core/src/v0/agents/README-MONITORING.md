# MonitoringFeedbackAgent

The `MonitoringFeedbackAgent` provides continuous monitoring and feedback loops for deployed agents in the Cognomega multi-agent system. It enables observability, drift detection, and automated interventions to maintain system health and performance.

## Features

### 1. Real-time Monitoring
- Observes deployed agent behavior and performance metrics
- Tracks success rates, error rates, response times, and throughput
- Maintains historical observations for trend analysis
- Configurable monitoring intervals and thresholds

### 2. Feedback Collection
- Collects and processes user feedback from real-world usage
- Automatically analyzes sentiment (positive, negative, neutral)
- Categorizes feedback (bug, suggestion, praise, question, performance)
- Identifies patterns and trends in user feedback

### 3. Drift Detection
- Detects concept drift, data drift, and performance degradation
- Compares baseline metrics with current performance
- Configurable sensitivity levels (low, medium, high)
- Provides confidence scores and detailed recommendations

### 4. Automated Interventions
- Triggers alerts, retraining, configuration updates, or rollbacks
- Prioritizes interventions based on severity
- Optional approval workflow for critical interventions
- Tracks intervention history and outcomes

### 5. Comprehensive Reporting
- Generates detailed monitoring reports
- Aggregates metrics across multiple agents
- Provides actionable recommendations
- Supports time-range filtering

## Installation

The `MonitoringFeedbackAgent` is part of the `@cognomega/si-core` package:

```typescript
import { MonitoringFeedbackAgent } from '@cognomega/si-core';
```

## Basic Usage

### Initialize the Agent

```typescript
const monitoringAgent = new MonitoringFeedbackAgent();
await monitoringAgent.initialize();
```

### Start Monitoring an Agent

```typescript
// Assume you have an agent instance
const frontendAgent = new FrontendDevAgent();

// Start continuous monitoring
monitoringAgent.startMonitoring('frontend-agent-1', frontendAgent);
```

### Observe Agent Behavior

```typescript
const result = await monitoringAgent.execute({
  id: 'observe-1',
  type: 'orchestrator',
  payload: {
    action: 'observe',
    agentStatus: {
      id: 'backend-agent-1',
      name: 'BackendDevAgent',
      health: 'healthy',
      activeTasks: 3,
      completedTasks: 100,
      failedTasks: 5,
      averageResponseTime: 250,
    },
  },
  priority: 5,
  createdAt: Date.now(),
});
```

### Collect User Feedback

```typescript
const result = await monitoringAgent.execute({
  id: 'feedback-1',
  type: 'orchestrator',
  payload: {
    action: 'collect_feedback',
    feedback: {
      agentId: 'ui-design-agent-1',
      taskId: 'task-123',
      content: 'The UI design is excellent!',
      rating: 5,
    },
  },
  priority: 5,
  createdAt: Date.now(),
});
```

### Detect Drift

```typescript
const result = await monitoringAgent.execute({
  id: 'drift-1',
  type: 'orchestrator',
  payload: {
    action: 'detect_drift',
    agentId: 'database-agent-1',
  },
  priority: 5,
  createdAt: Date.now(),
});
```

### Trigger Intervention

```typescript
const result = await monitoringAgent.execute({
  id: 'intervention-1',
  type: 'orchestrator',
  payload: {
    action: 'trigger_intervention',
    agentId: 'devops-agent-1',
    type: 'alert',
    reason: 'high_error_rate',
    severity: 'high',
  },
  priority: 8,
  createdAt: Date.now(),
});
```

### Generate Report

```typescript
const result = await monitoringAgent.execute({
  id: 'report-1',
  type: 'orchestrator',
  payload: {
    action: 'get_report',
    agentId: 'frontend-agent-1', // Optional: specific agent
    timeRange: 3600000, // Last hour in milliseconds
  },
  priority: 5,
  createdAt: Date.now(),
});
```

## Configuration

### Default Configuration

```typescript
{
  enabled: true,
  checkInterval: 60000, // 1 minute
  thresholds: {
    errorRate: 0.05,      // 5%
    responseTime: 5000,   // 5 seconds
    successRate: 0.95,    // 95%
  },
  driftDetection: {
    enabled: true,
    sensitivity: 'medium',
    windowSize: 100,      // observations
  },
  autoIntervention: {
    enabled: true,
    requiresApproval: false,
  },
}
```

### Update Configuration

```typescript
const result = await monitoringAgent.execute({
  id: 'config-1',
  type: 'orchestrator',
  payload: {
    action: 'configure',
    config: {
      thresholds: {
        errorRate: 0.03,    // 3%
        responseTime: 3000, // 3 seconds
        successRate: 0.97,  // 97%
      },
      driftDetection: {
        sensitivity: 'high',
        windowSize: 50,
      },
    },
  },
  priority: 5,
  createdAt: Date.now(),
});
```

## Types

### MonitoringObservation

```typescript
interface MonitoringObservation {
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
```

### UserFeedback

```typescript
interface UserFeedback {
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
```

### DriftDetection

```typescript
interface DriftDetection {
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
```

### InterventionAction

```typescript
interface InterventionAction {
  id: string;
  agentId: string;
  type: 'retrain' | 'update_config' | 'scale' | 'alert' | 'rollback';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  triggeredBy: string;
  triggeredAt: number;
  completedAt?: number;
  result?: string;
}
```

## Supported Actions

The agent supports the following task actions:

1. **`observe`** - Observe and record agent behavior
2. **`collect_feedback`** - Collect and analyze user feedback
3. **`detect_drift`** - Detect drift in agent performance
4. **`trigger_intervention`** - Trigger automated or manual intervention
5. **`get_report`** - Generate comprehensive monitoring report
6. **`configure`** - Update monitoring configuration

## Integration with Orchestrator

The `MonitoringFeedbackAgent` is designed to work seamlessly with the `FullStackAIAssistant` orchestrator:

```typescript
import { FullStackAIAssistant, MonitoringFeedbackAgent } from '@cognomega/si-core';

const orchestrator = new FullStackAIAssistant();
const monitor = new MonitoringFeedbackAgent();

await orchestrator.initialize();
await monitor.initialize();

// Get all agent statuses from orchestrator
const agentStatuses = orchestrator.getAgentStatuses();

// Monitor each agent
for (const [agentType, status] of agentStatuses.entries()) {
  await monitor.execute({
    id: `observe-${agentType}`,
    type: 'orchestrator',
    payload: {
      action: 'observe',
      agentStatus: status,
    },
    priority: 5,
    createdAt: Date.now(),
  });
}
```

## Advanced Features

### Continuous Monitoring

```typescript
// Start monitoring with automatic observations
monitoringAgent.startMonitoring('agent-id', agent);

// Stop monitoring when done
monitoringAgent.stopMonitoring('agent-id');
```

### Statistics and Insights

```typescript
const stats = monitoringAgent.getStatistics();
console.log('Total Observations:', stats.totalObservations);
console.log('Total Feedback:', stats.totalFeedback);
console.log('Drift Detections:', stats.totalDriftDetections);
console.log('Interventions:', stats.totalInterventions);
```

### Custom Thresholds

```typescript
// Configure agent-specific thresholds
await monitoringAgent.execute({
  id: 'config-custom',
  type: 'orchestrator',
  payload: {
    action: 'configure',
    config: {
      thresholds: {
        errorRate: 0.01,    // 1% for critical services
        responseTime: 1000, // 1 second SLA
        successRate: 0.99,  // 99% uptime
      },
    },
  },
  priority: 5,
  createdAt: Date.now(),
});
```

## Best Practices

1. **Regular Monitoring**: Set up continuous monitoring for all production agents
2. **Appropriate Thresholds**: Adjust thresholds based on your service requirements
3. **Feedback Analysis**: Regularly review user feedback for improvement opportunities
4. **Drift Detection**: Enable drift detection with appropriate sensitivity
5. **Intervention Approval**: Use approval workflow for critical interventions
6. **Report Review**: Generate and review monitoring reports regularly
7. **Historical Data**: Maintain sufficient observation history for accurate drift detection

## Examples

See `monitoring-feedback-agent-example.ts` for comprehensive usage examples including:
- Basic monitoring setup
- Feedback collection workflows
- Drift detection scenarios
- Intervention triggering
- Report generation
- Complete monitoring workflow
- Orchestrator integration

## Architecture

The `MonitoringFeedbackAgent` is:
- **Modular**: Can be used independently or integrated with other agents
- **Extensible**: Easy to add new monitoring capabilities or intervention types
- **Orchestrator-compatible**: Designed to work with the FullStackAIAssistant
- **Scalable**: Efficient data structures for high-volume monitoring
- **Configurable**: Flexible configuration for different deployment scenarios

## Performance Considerations

- **Memory Usage**: Observations are limited by `windowSize` configuration
- **Check Interval**: Balance between monitoring frequency and performance impact
- **Drift Detection**: Window size affects accuracy and computational cost
- **Storage**: Consider persisting historical data for long-term analysis

## Future Enhancements

Potential future additions:
- Machine learning-based anomaly detection
- Predictive failure analysis
- Integration with external monitoring tools (Prometheus, Grafana)
- Advanced visualization dashboards
- Multi-agent correlation analysis
- Automated A/B testing for interventions
