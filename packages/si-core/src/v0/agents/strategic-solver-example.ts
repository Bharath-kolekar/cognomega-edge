/**
 * Example usage of StrategicSolverAgent
 * Demonstrates adaptive problem-solving with strategy selection and tracking
 */

import { createStrategicSolver } from './index';
import { AgentTask, AgentResult } from './types';
import { 
  ProblemContext, 
  ProblemSolvingStrategy, 
  StrategyResult 
} from './strategic-solver-agent';

/**
 * Example 1: Optimize a complex system
 */
export async function optimizeSystemExample(): Promise<AgentResult> {
  // Create the strategic solver agent
  const solver = createStrategicSolver();
  await solver.initialize();

  console.log('=== Example 1: System Optimization ===\n');

  // Define a complex optimization problem
  const problemContext: ProblemContext = {
    id: 'opt-001',
    description: 'Optimize the API response time for a high-traffic e-commerce platform',
    type: 'optimization',
    complexity: 0.75,
    constraints: [
      'Must maintain backward compatibility',
      'Cannot add more than 20% to infrastructure cost',
      'Must implement within 2 weeks',
    ],
    knownPatterns: ['caching', 'lazy-loading', 'database-indexing'],
  };

  // Create task for the agent
  const task: AgentTask = {
    id: 'task-opt-001',
    type: 'planning',
    payload: { problem: problemContext },
    priority: 9,
    context: {
      projectId: 'ecommerce-platform',
      userId: 'user-123',
    },
    createdAt: Date.now(),
  };

  // Execute the task
  const result = await solver.execute(task);

  if (result.success) {
    console.log('✅ Solution found!');
    const data = result.data as any;
    console.log('Strategy used:', data.strategy?.name);
    console.log('Reasoning:', data.reasoning);
    console.log('Alternative approaches:', data.alternativeApproaches);
    console.log('Performance insights:', data.performanceInsights);
    console.log('\nNext steps:', result.nextSteps);
  } else {
    console.error('❌ Failed:', result.error);
  }

  // View agent status
  const status = solver.getStatus();
  console.log('\nAgent Status:');
  console.log(`  Health: ${status.health}`);
  console.log(`  Completed tasks: ${status.completedTasks}`);
  console.log(`  Failed tasks: ${status.failedTasks}`);

  return result;
}

/**
 * Example 2: Debug a complex issue
 */
export async function debugComplexIssueExample(): Promise<AgentResult> {
  const solver = createStrategicSolver();
  await solver.initialize();

  console.log('\n=== Example 2: Complex Bug Debugging ===\n');

  const problemContext: ProblemContext = {
    id: 'debug-001',
    description: 'Intermittent database connection failures under high load',
    type: 'debugging',
    complexity: 0.85,
    constraints: [
      'Production system - cannot take offline',
      'Must identify root cause quickly',
      'Limited access to production logs',
    ],
    previousAttempts: [
      {
        strategyId: 'heuristic-001',
        problemId: 'debug-001',
        context: 'debugging',
        timestamp: Date.now() - 3600000, // 1 hour ago
        duration: 1800,
        success: false,
        outcome: 'Connection pool exhaustion suspected but not confirmed',
      },
    ],
  };

  const task: AgentTask = {
    id: 'task-debug-001',
    type: 'planning',
    payload: { problem: problemContext },
    priority: 10, // Critical
    createdAt: Date.now(),
  };

  const result = await solver.execute(task);

  if (result.success) {
    console.log('✅ Analysis complete!');
    const data = result.data as any;
    console.log('Strategy:', data.strategy?.name);
    console.log('Solution:', JSON.stringify(data.solution, null, 2));
    console.log('\nConfidence:', result.metadata?.confidence);
  } else {
    console.error('❌ Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example 3: Design a new feature with creative approach
 */
export async function designFeatureExample(): Promise<AgentResult> {
  const solver = createStrategicSolver();
  await solver.initialize();

  console.log('\n=== Example 3: Creative Feature Design ===\n');

  const problemContext: ProblemContext = {
    id: 'design-001',
    description: 'Design an innovative user onboarding experience that increases conversion by 30%',
    type: 'design',
    complexity: 0.6,
    constraints: [
      'Must work on mobile and desktop',
      'Should complete in under 3 minutes',
      'Cannot require additional user information',
    ],
  };

  const task: AgentTask = {
    id: 'task-design-001',
    type: 'planning',
    payload: { problem: problemContext },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await solver.execute(task);

  if (result.success) {
    console.log('✅ Design proposal generated!');
    const data = result.data as any;
    console.log('Strategy:', data.strategy?.name);
    console.log('Category:', data.strategy?.category);
    console.log('\nInnovations:', JSON.stringify(data.solution, null, 2));
    console.log('\nRecommendations:', result.metadata?.suggestions);
  }

  return result;
}

/**
 * Example 4: Track strategy performance over multiple problems
 */
export async function trackPerformanceExample(): Promise<void> {
  const solver = createStrategicSolver();
  await solver.initialize();

  console.log('\n=== Example 4: Strategy Performance Tracking ===\n');

  // Solve multiple problems to build performance history
  const problems: ProblemContext[] = [
    {
      id: 'prob-1',
      description: 'Optimize database query performance',
      type: 'optimization',
      complexity: 0.6,
      constraints: [],
    },
    {
      id: 'prob-2',
      description: 'Debug memory leak in Node.js application',
      type: 'debugging',
      complexity: 0.8,
      constraints: ['Must not restart the application'],
    },
    {
      id: 'prob-3',
      description: 'Plan migration from monolith to microservices',
      type: 'planning',
      complexity: 0.9,
      constraints: ['Zero downtime', 'Gradual migration'],
    },
  ];

  // Execute each problem
  for (const problem of problems) {
    const task: AgentTask = {
      id: `task-${problem.id}`,
      type: 'planning',
      payload: { problem },
      priority: 5,
      createdAt: Date.now(),
    };

    const result = await solver.execute(task);
    const data = result.data as any;
    console.log(`Problem ${problem.id}: ${result.success ? '✅' : '❌'} (${data?.strategy?.name || 'none'})`);
  }

  // View performance metrics for all strategies
  console.log('\n📊 Performance Metrics:\n');
  const allMetrics = solver.getAllMetrics();
  
  allMetrics.forEach((metrics, strategyId) => {
    console.log(`Strategy: ${strategyId}`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg Execution Time: ${metrics.avgExecutionTime.toFixed(0)}ms`);
    console.log(`  Avg Quality Score: ${(metrics.avgQualityScore * 100).toFixed(1)}%`);
    console.log(`  Total Executions: ${metrics.totalExecutions}`);
    console.log(`  Reliability: ${(metrics.reliability * 100).toFixed(1)}%`);
    console.log('');
  });
}

/**
 * Example 5: Register and use a custom strategy
 */
export async function customStrategyExample(): Promise<void> {
  const solver = createStrategicSolver();
  await solver.initialize();

  console.log('\n=== Example 5: Custom Strategy Registration ===\n');

  // Define a custom strategy (example - you would implement this properly)
  class CustomDataDrivenStrategy implements ProblemSolvingStrategy {
    id = 'custom-data-driven-001';
    name = 'Data-Driven Decision Making';
    description = 'Use statistical analysis and data patterns to solve problems';
    category = 'analytical' as const;
    applicableContexts = ['optimization', 'analysis'];
    complexity = 'high' as const;

    async execute(problem: ProblemContext): Promise<StrategyResult> {
      return {
        success: true,
        solution: {
          approach: 'statistical-analysis',
          dataPoints: 'Collected metrics and patterns',
          insights: 'Data-driven recommendations',
        },
        reasoning: 'Applied statistical methods to identify optimal solution',
        confidence: 0.88,
        alternativeApproaches: ['machine-learning', 'a-b-testing'],
        executionTime: 150,
        quality: 0.9,
      };
    }

    isApplicable(problem: ProblemContext): boolean {
      return ['optimization', 'analysis'].includes(problem.type);
    }
  }

  // Register the custom strategy
  const customStrategy = new CustomDataDrivenStrategy();
  solver.registerStrategy(customStrategy);

  console.log('✅ Registered custom strategy:', customStrategy.name);
  console.log('Total strategies available:', solver.getStrategies().length);

  // Use the agent with the new strategy available
  const problem: ProblemContext = {
    id: 'custom-001',
    description: 'Analyze user behavior patterns to improve conversion',
    type: 'analysis',
    complexity: 0.7,
    constraints: [],
  };

  const task: AgentTask = {
    id: 'task-custom-001',
    type: 'planning',
    payload: { problem },
    priority: 6,
    createdAt: Date.now(),
  };

  const result = await solver.execute(task);
  const data = result.data as any;
  console.log(`\nResult: ${result.success ? '✅' : '❌'}`);
  console.log('Strategy used:', data?.strategy?.name);
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 StrategicSolverAgent Examples\n');
  console.log('='.repeat(60));

  try {
    await optimizeSystemExample();
    await debugComplexIssueExample();
    await designFeatureExample();
    await trackPerformanceExample();
    await customStrategyExample();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
