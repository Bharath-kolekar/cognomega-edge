/**
 * Example usage of MonitoringFeedbackAgent
 * Demonstrates the monitoring and feedback loop capabilities
 */

import { MonitoringFeedbackAgent } from './monitoring-feedback-agent';
import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, AgentStatus } from './types';

/**
 * Example: Basic monitoring setup
 */
export async function exampleBasicMonitoring() {
  // Create monitoring agent
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  // Get initial configuration
  const config = monitoringAgent.getConfiguration();
  console.log('Monitoring Configuration:', config);

  // Mock agent to monitor
  const mockAgent = {
    getStatus: (): AgentStatus => ({
      id: 'frontend-agent-1',
      name: 'FrontendDevAgent',
      health: 'healthy',
      activeTasks: 3,
      completedTasks: 50,
      failedTasks: 2,
      averageResponseTime: 250,
    }),
  };

  // Start monitoring
  monitoringAgent.startMonitoring('frontend-agent-1', mockAgent);

  console.log('Monitoring started for frontend-agent-1');
}

/**
 * Example: Observe agent behavior
 */
export async function exampleObserveAgent() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  const agentStatus: AgentStatus = {
    id: 'backend-agent-1',
    name: 'BackendDevAgent',
    health: 'degraded',
    activeTasks: 5,
    completedTasks: 100,
    failedTasks: 10,
    averageResponseTime: 3500, // Slow!
  };

  const result = await monitoringAgent.execute({
    id: 'observe-task-1',
    type: 'orchestrator',
    payload: {
      action: 'observe',
      agentStatus,
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Observation Result:', result);
}

/**
 * Example: Collect user feedback
 */
export async function exampleCollectFeedback() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  const result = await monitoringAgent.execute({
    id: 'feedback-task-1',
    type: 'orchestrator',
    payload: {
      action: 'collect_feedback',
      feedback: {
        agentId: 'ui-design-agent-1',
        taskId: 'task-design-123',
        content: 'The generated UI is not responsive on mobile devices',
        rating: 2,
        sentiment: 'negative',
        category: 'bug',
      },
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Feedback Collection Result:', result);
}

/**
 * Example: Detect drift
 */
export async function exampleDetectDrift() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  // Simulate multiple observations to build baseline
  const agentId = 'database-agent-1';
  
  // Add baseline observations (good performance)
  for (let i = 0; i < 25; i++) {
    await monitoringAgent.execute({
      id: `observe-baseline-${i}`,
      type: 'orchestrator',
      payload: {
        action: 'observe',
        agentStatus: {
          id: agentId,
          name: 'DatabaseAgent',
          health: 'healthy',
          activeTasks: 2,
          completedTasks: 50 + i,
          failedTasks: 1,
          averageResponseTime: 150 + Math.random() * 50,
        },
      },
      priority: 5,
      createdAt: Date.now(),
    });
  }

  // Add recent observations (degraded performance)
  for (let i = 0; i < 25; i++) {
    await monitoringAgent.execute({
      id: `observe-recent-${i}`,
      type: 'orchestrator',
      payload: {
        action: 'observe',
        agentStatus: {
          id: agentId,
          name: 'DatabaseAgent',
          health: 'degraded',
          activeTasks: 4,
          completedTasks: 75 + i,
          failedTasks: 8 + Math.floor(i / 3),
          averageResponseTime: 800 + Math.random() * 200,
        },
      },
      priority: 5,
      createdAt: Date.now(),
    });
  }

  // Detect drift
  const result = await monitoringAgent.execute({
    id: 'drift-task-1',
    type: 'orchestrator',
    payload: {
      action: 'detect_drift',
      agentId,
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Drift Detection Result:', result);
}

/**
 * Example: Trigger intervention
 */
export async function exampleTriggerIntervention() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  const result = await monitoringAgent.execute({
    id: 'intervention-task-1',
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

  console.log('Intervention Result:', result);
}

/**
 * Example: Generate monitoring report
 */
export async function exampleGenerateReport() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  // Simulate some activity first
  await exampleObserveAgent();
  await exampleCollectFeedback();

  const result = await monitoringAgent.execute({
    id: 'report-task-1',
    type: 'orchestrator',
    payload: {
      action: 'get_report',
      timeRange: 3600000, // Last hour
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Monitoring Report:', JSON.stringify(result.data, null, 2));
}

/**
 * Example: Update monitoring configuration
 */
export async function exampleUpdateConfiguration() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  const result = await monitoringAgent.execute({
    id: 'config-task-1',
    type: 'orchestrator',
    payload: {
      action: 'configure',
      config: {
        enabled: true,
        checkInterval: 30000, // 30 seconds
        thresholds: {
          errorRate: 0.03, // 3%
          responseTime: 3000, // 3 seconds
          successRate: 0.97, // 97%
        },
        driftDetection: {
          enabled: true,
          sensitivity: 'high',
          windowSize: 50,
        },
        autoIntervention: {
          enabled: true,
          requiresApproval: true,
        },
      },
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Configuration Update Result:', result);
}

/**
 * Example: Complete monitoring workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('=== Complete Monitoring Workflow ===\n');

  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  // 1. Configure monitoring
  console.log('1. Configuring monitoring...');
  await exampleUpdateConfiguration();

  // 2. Start monitoring multiple agents
  console.log('\n2. Starting monitoring for multiple agents...');
  const agents = ['frontend-agent', 'backend-agent', 'database-agent'].map(id => ({
    id,
    getStatus: (): AgentStatus => ({
      id,
      name: id,
      health: 'healthy',
      activeTasks: Math.floor(Math.random() * 5),
      completedTasks: Math.floor(Math.random() * 100),
      failedTasks: Math.floor(Math.random() * 5),
      averageResponseTime: 100 + Math.random() * 200,
    }),
  }));

  agents.forEach(agent => {
    monitoringAgent.startMonitoring(agent.id, agent);
  });

  // 3. Collect feedback
  console.log('\n3. Collecting user feedback...');
  await exampleCollectFeedback();

  // 4. Detect drift
  console.log('\n4. Running drift detection...');
  await exampleDetectDrift();

  // 5. Generate report
  console.log('\n5. Generating monitoring report...');
  await exampleGenerateReport();

  // 6. Get statistics
  console.log('\n6. Getting monitoring statistics...');
  const stats = monitoringAgent.getStatistics();
  console.log('Statistics:', JSON.stringify(stats, null, 2));

  // Cleanup
  agents.forEach(agent => {
    monitoringAgent.stopMonitoring(agent.id);
  });

  console.log('\n=== Workflow Complete ===');
}

/**
 * Example: Integration with FullStackAIAssistant
 */
export async function exampleOrchestrationIntegration() {
  const monitoringAgent = new MonitoringFeedbackAgent();
  await monitoringAgent.initialize();

  // In a real scenario, this would be integrated with the orchestrator
  // The orchestrator would periodically call the monitoring agent
  
  // Simulate orchestrator providing agent statuses
  const agentStatuses: AgentStatus[] = [
    {
      id: 'planning-agent-1',
      name: 'ProjectPlanningAgent',
      health: 'healthy',
      activeTasks: 1,
      completedTasks: 25,
      failedTasks: 0,
      averageResponseTime: 180,
    },
    {
      id: 'frontend-agent-1',
      name: 'FrontendDevAgent',
      health: 'healthy',
      activeTasks: 2,
      completedTasks: 40,
      failedTasks: 1,
      averageResponseTime: 220,
    },
    {
      id: 'backend-agent-1',
      name: 'BackendDevAgent',
      health: 'degraded',
      activeTasks: 5,
      completedTasks: 35,
      failedTasks: 5,
      averageResponseTime: 450,
    },
  ];

  // Monitor each agent
  for (const status of agentStatuses) {
    await monitoringAgent.execute({
      id: `observe-${status.id}`,
      type: 'orchestrator',
      payload: {
        action: 'observe',
        agentStatus: status,
      },
      priority: 5,
      createdAt: Date.now(),
    });
  }

  // Generate comprehensive report for orchestrator
  const report = await monitoringAgent.execute({
    id: 'orchestrator-report',
    type: 'orchestrator',
    payload: {
      action: 'get_report',
    },
    priority: 5,
    createdAt: Date.now(),
  });

  console.log('Orchestrator Report:', JSON.stringify(report.data, null, 2));
}

// Run examples
if (typeof import.meta !== 'undefined') {
  // Can be run directly if needed
  console.log('MonitoringFeedbackAgent examples are available');
  console.log('Import and call the example functions to see them in action');
}
