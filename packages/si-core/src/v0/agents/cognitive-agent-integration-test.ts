/**
 * Integration Test for CognitiveAgent
 * 
 * Verifies that CognitiveAgent integrates properly with:
 * - BaseAgent functionality
 * - SuperIntelligenceEngine orchestrator
 * - Existing agent system patterns
 */

import { CognitiveAgent } from './cognitive-agent';
import { AgentTask } from './types';

// ============================================================================
// Test Utilities
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

async function testBasicInitialization(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'TestAgent',
  });

  assert(agent.config.name === 'TestAgent', 'Agent name should match');
  assert(agent.config.type === 'orchestrator', 'Agent type should be orchestrator');
  assert(agent.config.enabled === true, 'Agent should be enabled by default');

  await agent.initialize();
  
  const status = agent.getStatus();
  assert(status.health === 'healthy', 'Agent should be healthy after initialization');
  assert(status.activeTasks === 0, 'No active tasks initially');
}

async function testWorkingMemoryCapacity(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'MemoryTest',
    workingMemoryCapacity: 5,
  });

  await agent.initialize();

  const task: AgentTask = {
    id: 'test-1',
    type: 'orchestrator',
    payload: { test: 'data' },
    priority: 5,
    createdAt: Date.now(),
  };

  await agent.execute(task);

  const workingMemory = agent.getWorkingMemorySnapshot();
  assert(workingMemory.length <= 5, `Working memory should not exceed capacity (got ${workingMemory.length})`);
}

async function testTaskExecution(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'ExecutionTest',
  });

  await agent.initialize();

  const task: AgentTask = {
    id: 'exec-test-1',
    type: 'orchestrator',
    payload: {
      action: 'test',
      data: 'execution test data',
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);

  assert(result.success === true, 'Task should execute successfully');
  assert(result.metadata !== undefined, 'Result should have metadata');
  assert(result.metadata?.duration !== undefined, 'Metadata should include duration');
  assert(result.metadata?.confidence !== undefined, 'Metadata should include confidence');
}

async function testCanHandleMethod(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'HandleTest',
  });

  await agent.initialize();

  const validTask: AgentTask = {
    id: 'valid-1',
    type: 'orchestrator',
    payload: {},
    priority: 5,
    createdAt: Date.now(),
  };

  assert(agent.canHandle(validTask), 'Agent should handle orchestrator tasks');

  // Test with wrong type
  const invalidTask: AgentTask = {
    id: 'invalid-1',
    type: 'frontend' as any, // Different type
    payload: {},
    priority: 5,
    createdAt: Date.now(),
  };

  assert(!agent.canHandle(invalidTask), 'Agent should not handle non-orchestrator tasks');
}

async function testMemoryConsolidation(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'ConsolidationTest',
  });

  await agent.initialize();

  const initialStats = agent.getLongTermMemoryStats();
  const initialEntries = initialStats.totalEntries;

  // Execute a task that should consolidate to long-term memory
  const task: AgentTask = {
    id: 'consolidate-1',
    type: 'orchestrator',
    payload: {
      action: 'important-action',
      data: 'important data to remember',
    },
    priority: 9,
    createdAt: Date.now(),
  };

  await agent.execute(task);

  const finalStats = agent.getLongTermMemoryStats();
  assert(
    finalStats.totalEntries > initialEntries,
    'Long-term memory should increase after task execution'
  );
}

async function testLearningFromSuccess(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'LearningTest',
  });

  await agent.initialize();

  const initialMetrics = agent.getLearningMetrics();

  const task: AgentTask = {
    id: 'learn-success-1',
    type: 'orchestrator',
    payload: { test: 'learning' },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  assert(result.success === true, 'Task should succeed');

  const finalMetrics = agent.getLearningMetrics();
  assert(
    finalMetrics.successfulTasks > initialMetrics.successfulTasks,
    'Successful tasks counter should increase'
  );
  assert(
    finalMetrics.totalReflections > initialMetrics.totalReflections,
    'Reflections counter should increase'
  );
}

async function testReflectionHistory(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'ReflectionTest',
  });

  await agent.initialize();

  const initialReflections = agent.getReflectionHistory();
  const initialCount = initialReflections.length;

  const task: AgentTask = {
    id: 'reflect-1',
    type: 'orchestrator',
    payload: {},
    priority: 5,
    createdAt: Date.now(),
  };

  await agent.execute(task);

  const finalReflections = agent.getReflectionHistory();
  assert(
    finalReflections.length > initialCount,
    'Reflection history should grow after task execution'
  );

  const lastReflection = finalReflections[finalReflections.length - 1];
  assert(lastReflection.taskId === task.id, 'Reflection should reference correct task');
  assert(lastReflection.outcome !== undefined, 'Reflection should have outcome');
  assert(lastReflection.confidence !== undefined, 'Reflection should have confidence');
}

async function testAgentStatus(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'StatusTest',
  });

  await agent.initialize();

  const status = agent.getStatus();

  assert(status.name === 'StatusTest', 'Status should include correct name');
  assert(status.health !== undefined, 'Status should include health');
  assert(status.activeTasks !== undefined, 'Status should include active tasks count');
  assert(status.completedTasks !== undefined, 'Status should include completed tasks count');
  assert(status.failedTasks !== undefined, 'Status should include failed tasks count');

  // Execute a task
  const task: AgentTask = {
    id: 'status-1',
    type: 'orchestrator',
    payload: {},
    priority: 5,
    createdAt: Date.now(),
  };

  await agent.execute(task);

  const statusAfter = agent.getStatus();
  assert(
    statusAfter.completedTasks > status.completedTasks,
    'Completed tasks should increase after execution'
  );
}

async function testMultipleTaskSequence(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'SequenceTest',
    workingMemoryCapacity: 7,
  });

  await agent.initialize();

  const tasks: AgentTask[] = [];
  for (let i = 0; i < 5; i++) {
    tasks.push({
      id: `seq-${i}`,
      type: 'orchestrator',
      payload: { sequence: i },
      priority: 5 + i,
      createdAt: Date.now() + i * 100,
    });
  }

  let successCount = 0;
  for (const task of tasks) {
    const result = await agent.execute(task);
    if (result.success) successCount++;
  }

  assert(successCount === tasks.length, 'All tasks in sequence should succeed');

  const metrics = agent.getLearningMetrics();
  assert(
    metrics.successfulTasks === tasks.length,
    'Learning metrics should reflect all successful tasks'
  );
}

async function testAttentionMechanism(): Promise<void> {
  const agent = new CognitiveAgent({
    name: 'AttentionTest',
    workingMemoryCapacity: 3, // Very small to force attention mechanism
  });

  await agent.initialize();

  const task: AgentTask = {
    id: 'attention-1',
    type: 'orchestrator',
    payload: {
      // Provide lots of information
      data1: 'First piece of data',
      data2: 'Second piece of data',
      data3: 'Third piece of data',
      data4: 'Fourth piece of data',
      data5: 'Fifth piece of data',
    },
    priority: 8,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  assert(result.success === true, 'Task with attention should succeed');

  const workingMemory = agent.getWorkingMemorySnapshot();
  assert(
    workingMemory.length <= 3,
    'Working memory should respect capacity limit through attention'
  );
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      CognitiveAgent Integration Tests                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const tests = [
    { name: 'Basic Initialization', fn: testBasicInitialization },
    { name: 'Working Memory Capacity', fn: testWorkingMemoryCapacity },
    { name: 'Task Execution', fn: testTaskExecution },
    { name: 'Can Handle Method', fn: testCanHandleMethod },
    { name: 'Memory Consolidation', fn: testMemoryConsolidation },
    { name: 'Learning from Success', fn: testLearningFromSuccess },
    { name: 'Reflection History', fn: testReflectionHistory },
    { name: 'Agent Status', fn: testAgentStatus },
    { name: 'Multiple Task Sequence', fn: testMultipleTaskSequence },
    { name: 'Attention Mechanism', fn: testAttentionMechanism },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    // Use console.log for compatibility
    console.log(`Running: ${test.name}... `);
    const result = await runTest(test.name, test.fn);
    results.push(result);

    if (result.passed) {
      console.log(`✓ PASSED (${result.duration}ms)`);
    } else {
      console.log(`✗ FAILED`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   Test Summary                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed!');
    throw new Error('Integration tests failed');
  } else {
    console.log('\n✅ All integration tests passed!');
  }
}

// Export for use in other files
export { runAllTests };

// Note: Execution is environment-specific
// Uncomment the following to run tests directly:
// runAllTests().catch(error => {
//   console.error('\n❌ Test execution failed:', error);
// });
