/**
 * Example Usage of CognitiveAgent
 * 
 * Demonstrates how to use the CognitiveAgent with its working memory,
 * long-term memory, and attention mechanism features.
 */

import { CognitiveAgent } from './cognitive-agent';
import { AgentTask } from './types';

// ============================================================================
// Example 1: Basic Task Execution
// ============================================================================

async function basicExample() {
  console.log('\n=== Example 1: Basic Task Execution ===\n');

  // Create a cognitive agent with default settings
  const agent = new CognitiveAgent({
    name: 'BasicCognitiveAgent',
    workingMemoryCapacity: 7,
    enableLearning: true,
  });

  // Initialize the agent
  await agent.initialize();

  // Create a simple task
  const task: AgentTask = {
    id: 'task-1',
    type: 'orchestrator',
    payload: {
      action: 'analyze',
      data: 'What are the key components of a web application?',
    },
    priority: 8,
    createdAt: Date.now(),
  };

  // Execute the task
  const result = await agent.execute(task);

  console.log('Task Result:', JSON.stringify(result, null, 2));
  console.log('\nWorking Memory Items:', agent.getWorkingMemorySnapshot().length);
  console.log('Learning Metrics:', agent.getLearningMetrics());
}

// ============================================================================
// Example 2: Multi-Step Reasoning with Memory
// ============================================================================

async function multiStepReasoningExample() {
  console.log('\n=== Example 2: Multi-Step Reasoning with Memory ===\n');

  const agent = new CognitiveAgent({
    name: 'ReasoningAgent',
    workingMemoryCapacity: 9, // Slightly larger for complex tasks
  });

  await agent.initialize();

  // Execute multiple related tasks
  const tasks: AgentTask[] = [
    {
      id: 'task-1',
      type: 'orchestrator',
      payload: { action: 'define', topic: 'microservices architecture' },
      priority: 7,
      createdAt: Date.now(),
    },
    {
      id: 'task-2',
      type: 'orchestrator',
      payload: { action: 'compare', topics: ['microservices', 'monolith'] },
      priority: 8,
      createdAt: Date.now() + 1000,
    },
    {
      id: 'task-3',
      type: 'orchestrator',
      payload: { action: 'recommend', scenario: 'startup with 5 developers' },
      priority: 9,
      createdAt: Date.now() + 2000,
    },
  ];

  // Execute tasks sequentially to build up memory
  for (const task of tasks) {
    console.log(`\nExecuting Task: ${task.id}`);
    const result = await agent.execute(task);
    
    console.log(`Success: ${result.success}`);
    console.log(`Confidence: ${result.metadata?.confidence}`);
    console.log(`Working Memory: ${agent.getWorkingMemorySnapshot().length} items`);
  }

  // Check learning progress
  const metrics = agent.getLearningMetrics();
  console.log('\n=== Final Learning Metrics ===');
  console.log(`Total Reflections: ${metrics.totalReflections}`);
  console.log(`Success Rate: ${(metrics.successfulTasks / (metrics.successfulTasks + metrics.failedTasks) * 100).toFixed(1)}%`);
  console.log(`Average Confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`);
  console.log(`Improvement Rate: ${(metrics.improvementRate * 100).toFixed(1)}%`);
}

// ============================================================================
// Example 3: Memory Consolidation and Recall
// ============================================================================

async function memoryConsolidationExample() {
  console.log('\n=== Example 3: Memory Consolidation and Recall ===\n');

  const agent = new CognitiveAgent({
    name: 'MemoryAgent',
  });

  await agent.initialize();

  // First, store some knowledge by executing learning tasks
  const learningTasks: AgentTask[] = [
    {
      id: 'learn-1',
      type: 'orchestrator',
      payload: { 
        action: 'learn', 
        fact: 'React is a JavaScript library for building user interfaces',
      },
      priority: 7,
      createdAt: Date.now(),
    },
    {
      id: 'learn-2',
      type: 'orchestrator',
      payload: { 
        action: 'learn', 
        fact: 'React uses a virtual DOM for efficient updates',
      },
      priority: 7,
      createdAt: Date.now() + 500,
    },
    {
      id: 'learn-3',
      type: 'orchestrator',
      payload: { 
        action: 'learn', 
        fact: 'React components can be functional or class-based',
      },
      priority: 7,
      createdAt: Date.now() + 1000,
    },
  ];

  // Store knowledge
  console.log('Storing knowledge...');
  for (const task of learningTasks) {
    await agent.execute(task);
  }

  // Now query the knowledge
  const queryTask: AgentTask = {
    id: 'query-1',
    type: 'orchestrator',
    payload: {
      action: 'recall',
      query: 'What do you know about React?',
    },
    priority: 8,
    createdAt: Date.now() + 2000,
  };

  console.log('\nQuerying stored knowledge...');
  const result = await agent.execute(queryTask);
  
  console.log('\nRecall Result:', JSON.stringify(result, null, 2));
  
  // Check memory stats
  const memoryStats = agent.getLongTermMemoryStats();
  console.log('\n=== Long-Term Memory Stats ===');
  console.log(`Total Entries: ${memoryStats.totalEntries}`);
  console.log(`Average Access Count: ${memoryStats.averageAccessCount.toFixed(1)}`);
}

// ============================================================================
// Example 4: Attention Mechanism in Action
// ============================================================================

async function attentionMechanismExample() {
  console.log('\n=== Example 4: Attention Mechanism ===\n');

  const agent = new CognitiveAgent({
    name: 'AttentionAgent',
    workingMemoryCapacity: 5, // Smaller capacity to force attention mechanism
  });

  await agent.initialize();

  // Add many pieces of information (more than capacity)
  const complexTask: AgentTask = {
    id: 'complex-1',
    type: 'orchestrator',
    payload: {
      action: 'plan',
      requirements: {
        frontend: ['React', 'TypeScript', 'Tailwind'],
        backend: ['Node.js', 'Express', 'PostgreSQL'],
        devops: ['Docker', 'GitHub Actions', 'AWS'],
        testing: ['Jest', 'Cypress', 'Testing Library'],
      },
      priorities: ['Security', 'Performance', 'Scalability'],
      constraints: ['Budget: $5000/month', 'Timeline: 3 months', 'Team: 3 developers'],
    },
    priority: 10,
    createdAt: Date.now(),
  };

  console.log('Processing complex task with many details...');
  const result = await agent.execute(complexTask);

  console.log(`\nTask Success: ${result.success}`);
  console.log(`Confidence: ${result.metadata?.confidence}`);
  
  // Show which items made it into working memory
  const workingMemory = agent.getWorkingMemorySnapshot();
  console.log(`\nWorking Memory (${workingMemory.length}/${5} capacity):`);
  workingMemory.forEach((item, index) => {
    console.log(`${index + 1}. ${item.type} - Importance: ${item.importance.toFixed(2)}, Activation: ${item.activationLevel.toFixed(2)}`);
  });

  console.log('\nNote: The attention mechanism selected the most important items!');
}

// ============================================================================
// Example 5: Learning from Failures
// ============================================================================

async function learningFromFailuresExample() {
  console.log('\n=== Example 5: Learning from Failures ===\n');

  const agent = new CognitiveAgent({
    name: 'LearningAgent',
  });

  await agent.initialize();

  // Execute some tasks that might fail
  const riskyTasks: AgentTask[] = [
    {
      id: 'risky-1',
      type: 'orchestrator',
      payload: { action: 'invalid-action', data: 'This might fail' },
      priority: 5,
      createdAt: Date.now(),
    },
    {
      id: 'risky-2',
      type: 'orchestrator',
      payload: { action: 'process', data: 'Valid task' },
      priority: 7,
      createdAt: Date.now() + 1000,
    },
  ];

  console.log('Executing tasks (some may fail)...');
  for (const task of riskyTasks) {
    const result = await agent.execute(task);
    console.log(`\nTask ${task.id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (!result.success) {
      console.log(`Error: ${result.error}`);
    }
  }

  // Check reflection history
  const reflections = agent.getReflectionHistory();
  console.log('\n=== Reflection History ===');
  reflections.forEach((reflection, index) => {
    console.log(`\nReflection ${index + 1}:`);
    console.log(`  Outcome: ${reflection.outcome}`);
    console.log(`  Confidence: ${reflection.confidence.toFixed(2)}`);
    console.log(`  Insights: ${reflection.insights.join(', ')}`);
    if (reflection.adjustments.length > 0) {
      console.log(`  Adjustments: ${reflection.adjustments.join(', ')}`);
    }
  });

  // Show learning metrics
  const metrics = agent.getLearningMetrics();
  console.log('\n=== Learning Metrics ===');
  console.log(`Total Tasks: ${metrics.successfulTasks + metrics.failedTasks}`);
  console.log(`Success Rate: ${(metrics.successfulTasks / (metrics.successfulTasks + metrics.failedTasks) * 100).toFixed(1)}%`);
  console.log(`Agent is learning from both successes and failures!`);
}

// ============================================================================
// Example 6: Integration with SuperIntelligenceEngine
// ============================================================================

async function integrationExample() {
  console.log('\n=== Example 6: Integration with SuperIntelligenceEngine ===\n');

  const agent = new CognitiveAgent({
    name: 'IntegratedCognitiveAgent',
    capabilities: [
      'reasoning',
      'learning',
      'memory-management',
      'attention-control',
      'self-reflection',
      'orchestration',
    ],
    priority: 10,
  });

  await agent.initialize();

  // Demonstrate orchestrator compatibility
  const orchestratorTask: AgentTask = {
    id: 'orch-1',
    type: 'orchestrator',
    payload: {
      projectType: 'fullstack',
      requirements: 'Build a task management app',
      context: {
        user: 'user-123',
        session: 'session-456',
      },
    },
    priority: 9,
    context: {
      userId: 'user-123',
      sessionId: 'session-456',
      previousResults: {
        planning: { completed: true },
      },
    },
    createdAt: Date.now(),
  };

  console.log('Executing orchestrator task...');
  const result = await agent.execute(orchestratorTask);

  console.log('\nOrchestrator Task Result:');
  console.log(`Success: ${result.success}`);
  console.log(`Confidence: ${result.metadata?.confidence}`);
  console.log(`Duration: ${result.metadata?.duration}ms`);
  
  if (result.nextSteps) {
    console.log('\nNext Steps:');
    result.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
  }

  // Show agent status (compatible with IAgent interface)
  const status = agent.getStatus();
  console.log('\n=== Agent Status ===');
  console.log(`Name: ${status.name}`);
  console.log(`Health: ${status.health}`);
  console.log(`Active Tasks: ${status.activeTasks}`);
  console.log(`Completed Tasks: ${status.completedTasks}`);
  console.log(`Failed Tasks: ${status.failedTasks}`);
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         CognitiveAgent - Example Usage                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await basicExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await multiStepReasoningExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await memoryConsolidationExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await attentionMechanismExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await learningFromFailuresExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await integrationExample();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         All Examples Completed Successfully!             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// Export for use in other files
export {
  basicExample,
  multiStepReasoningExample,
  memoryConsolidationExample,
  attentionMechanismExample,
  learningFromFailuresExample,
  integrationExample,
  runAllExamples,
};

// Run examples if this file is executed directly
// Note: This check is environment-specific and may need adjustment
// Uncomment the following line to run examples:
// runAllExamples().catch(console.error);
