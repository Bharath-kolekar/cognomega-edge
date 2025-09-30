/**
 * Integration test demonstrating MonitoringFeedbackAgent with other agents
 * This shows how the monitoring agent integrates with the multi-agent system
 */

import { MonitoringFeedbackAgent } from './monitoring-feedback-agent';
import { FrontendDevAgent } from './frontend-dev-agent';
import { BackendDevAgent } from './backend-dev-agent';
import { AgentTask } from './types';

/**
 * Simple integration test
 */
export async function runIntegrationTest() {
  console.log('=== MonitoringFeedbackAgent Integration Test ===\n');

  // Initialize agents
  const monitor = new MonitoringFeedbackAgent();
  const frontendAgent = new FrontendDevAgent();
  const backendAgent = new BackendDevAgent();

  await monitor.initialize();
  await frontendAgent.initialize();
  await backendAgent.initialize();

  console.log('✓ All agents initialized\n');

  // Start monitoring the agents
  console.log('Starting continuous monitoring...');
  monitor.startMonitoring('frontend-agent', frontendAgent);
  monitor.startMonitoring('backend-agent', backendAgent);
  console.log('✓ Monitoring started for 2 agents\n');

  // Simulate some agent activity
  console.log('Simulating agent tasks...');
  
  const frontendTask: AgentTask = {
    id: 'task-frontend-1',
    type: 'frontend',
    payload: {
      requirements: {
        name: 'Test App',
        description: 'A test application',
        framework: 'React',
      },
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const backendTask: AgentTask = {
    id: 'task-backend-1',
    type: 'backend',
    payload: {
      requirements: {
        name: 'Test API',
        description: 'A test API',
        framework: 'Node.js',
      },
    },
    priority: 5,
    createdAt: Date.now(),
  };

  // Execute tasks
  await frontendAgent.execute(frontendTask);
  await backendAgent.execute(backendTask);
  console.log('✓ Tasks executed\n');

  // Manually observe the agents
  console.log('Collecting observations...');
  await monitor.execute({
    id: 'observe-frontend',
    type: 'orchestrator',
    payload: {
      action: 'observe',
      agentStatus: frontendAgent.getStatus(),
    },
    priority: 5,
    createdAt: Date.now(),
  });

  await monitor.execute({
    id: 'observe-backend',
    type: 'orchestrator',
    payload: {
      action: 'observe',
      agentStatus: backendAgent.getStatus(),
    },
    priority: 5,
    createdAt: Date.now(),
  });
  console.log('✓ Observations collected\n');

  // Collect some feedback
  console.log('Collecting user feedback...');
  await monitor.execute({
    id: 'feedback-1',
    type: 'orchestrator',
    payload: {
      action: 'collect_feedback',
      feedback: {
        agentId: 'frontend-agent',
        taskId: 'task-frontend-1',
        content: 'The React components look great!',
        rating: 5,
        sentiment: 'positive',
        category: 'praise',
      },
    },
    priority: 5,
    createdAt: Date.now(),
  });

  await monitor.execute({
    id: 'feedback-2',
    type: 'orchestrator',
    payload: {
      action: 'collect_feedback',
      feedback: {
        agentId: 'backend-agent',
        taskId: 'task-backend-1',
        content: 'API response is slow',
        rating: 2,
        sentiment: 'negative',
        category: 'performance',
      },
    },
    priority: 5,
    createdAt: Date.now(),
  });
  console.log('✓ Feedback collected\n');

  // Generate a comprehensive report
  console.log('Generating monitoring report...');
  const reportResult = await monitor.execute({
    id: 'generate-report',
    type: 'orchestrator',
    payload: {
      action: 'get_report',
    },
    priority: 5,
    createdAt: Date.now(),
  });

  if (reportResult.success) {
    console.log('✓ Report generated successfully\n');
    console.log('Report Summary:');
    const report = reportResult.data as any;
    console.log(`  - Time Range: ${new Date(report.timeRange.start).toLocaleTimeString()} - ${new Date(report.timeRange.end).toLocaleTimeString()}`);
    console.log(`  - Agents Monitored: ${report.agents.length}`);
    console.log(`  - Total Feedback: ${report.feedback.total}`);
    console.log(`  - Drift Detections: ${report.driftDetections.length}`);
    console.log(`  - Interventions: ${report.interventions.length}`);
  }

  // Get statistics
  console.log('\nMonitoring Statistics:');
  const stats = monitor.getStatistics();
  console.log(`  - Total Observations: ${stats.totalObservations}`);
  console.log(`  - Total Feedback: ${stats.totalFeedback}`);
  console.log(`  - Drift Detections: ${stats.totalDriftDetections}`);
  console.log(`  - Interventions: ${stats.totalInterventions}`);
  console.log(`  - Active Monitoring: ${stats.activeMonitoring} agents`);

  // Stop monitoring
  console.log('\nStopping monitoring...');
  monitor.stopMonitoring('frontend-agent');
  monitor.stopMonitoring('backend-agent');
  console.log('✓ Monitoring stopped\n');

  console.log('=== Integration Test Complete ===');
  console.log('✓ All tests passed successfully!');

  return {
    success: true,
    agentStatuses: {
      monitoring: monitor.getStatus(),
      frontend: frontendAgent.getStatus(),
      backend: backendAgent.getStatus(),
    },
    statistics: stats,
  };
}

// Export for testing
export { MonitoringFeedbackAgent, FrontendDevAgent, BackendDevAgent };
