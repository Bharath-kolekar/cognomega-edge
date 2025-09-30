/**
 * Example usage of AutonomousGoalAgent
 * Demonstrates autonomous goal decomposition and achievement
 */

import { AutonomousGoalAgent } from './autonomous-goal-agent';
import { AgentTask } from './types';

/**
 * Example 1: Decompose and execute a high-level goal
 */
export async function autonomousGoalExample() {
  // Create the agent
  const agent = new AutonomousGoalAgent();
  await agent.initialize();

  console.log('=== Autonomous Goal Agent Example ===\n');

  // Step 1: Decompose a high-level goal
  console.log('Step 1: Decomposing goal...');
  const decomposeTask: AgentTask = {
    id: 'task-decompose-1',
    type: 'planning',
    payload: {
      action: 'decompose-goal',
      goalDescription: 'Build a machine learning pipeline for customer analytics',
      priority: 8,
      constraints: [
        'Must be scalable',
        'Must comply with data privacy regulations',
        'Must integrate with existing systems',
      ],
    },
    priority: 10,
    createdAt: Date.now(),
  };

  const decomposeResult = await agent.execute(decomposeTask);
  
  if (!decomposeResult.success) {
    console.error('Goal decomposition failed:', decomposeResult.error);
    return;
  }

  console.log('✓ Goal decomposed successfully!');
  console.log(`  Root Goal ID: ${(decomposeResult.data as any).goalId}`);
  console.log(`  Total subgoals: ${(decomposeResult.data as any).subgoals.length}`);
  console.log(`  Total nodes: ${(decomposeResult.data as any).totalNodes}\n`);

  const goalId = (decomposeResult.data as any).goalId;

  // Step 2: Create execution plan
  console.log('Step 2: Creating execution plan...');
  const planTask: AgentTask = {
    id: 'task-plan-1',
    type: 'planning',
    payload: {
      action: 'create-execution-plan',
      goalId,
    },
    priority: 10,
    createdAt: Date.now(),
  };

  const planResult = await agent.execute(planTask);
  
  if (!planResult.success) {
    console.error('Plan creation failed:', planResult.error);
    return;
  }

  console.log('✓ Execution plan created!');
  console.log(`  Plan ID: ${(planResult.data as any).planId}`);
  console.log(`  Phases: ${(planResult.data as any).plan.phases.length}`);
  console.log(`  Strategy: ${(planResult.data as any).plan.strategy}\n`);

  // Step 3: Execute the goal
  console.log('Step 3: Executing goal...');
  const executeTask: AgentTask = {
    id: 'task-execute-1',
    type: 'planning',
    payload: {
      action: 'execute-goal',
      goalId,
    },
    priority: 10,
    createdAt: Date.now(),
  };

  const executeResult = await agent.execute(executeTask);
  
  if (!executeResult.success) {
    console.error('Goal execution failed:', executeResult.error);
    return;
  }

  console.log('✓ Goals executed!');
  console.log(`  Executed: ${(executeResult.data as any).executedGoals} goal(s)`);
  console.log(`  Overall progress: ${((executeResult.data as any).overallProgress * 100).toFixed(1)}%\n`);

  // Step 4: Monitor progress
  console.log('Step 4: Monitoring progress...');
  const monitorTask: AgentTask = {
    id: 'task-monitor-1',
    type: 'planning',
    payload: {
      action: 'monitor-progress',
      goalId,
    },
    priority: 10,
    createdAt: Date.now(),
  };

  const monitorResult = await agent.execute(monitorTask);
  
  if (!monitorResult.success) {
    console.error('Progress monitoring failed:', monitorResult.error);
    return;
  }

  console.log('✓ Progress monitored!');
  console.log(`  Overall progress: ${((monitorResult.data as any).progress * 100).toFixed(1)}%`);
  console.log(`  Needs replan: ${(monitorResult.data as any).needsReplan}`);
  console.log(`  Risks detected: ${(monitorResult.data as any).risks.length}`);
  console.log(`  Bottlenecks: ${(monitorResult.data as any).bottlenecks.length}\n`);

  // Step 5: Replan if needed
  if ((monitorResult.data as any).needsReplan) {
    console.log('Step 5: Replanning goal execution...');
    const replanTask: AgentTask = {
      id: 'task-replan-1',
      type: 'planning',
      payload: {
        action: 'replan',
        goalId,
        reason: 'Low velocity detected',
      },
      priority: 10,
      createdAt: Date.now(),
    };

    const replanResult = await agent.execute(replanTask);
    
    if (!replanResult.success) {
      console.error('Replanning failed:', replanResult.error);
      return;
    }

    console.log('✓ Replanning completed!');
    console.log(`  Unblocked goals: ${(replanResult.data as any).unblockedGoals}`);
    console.log(`  Current progress: ${((replanResult.data as any).currentProgress * 100).toFixed(1)}%\n`);
  }

  // Get agent status
  const status = agent.getStatus();
  console.log('=== Agent Status ===');
  console.log(`  Health: ${status.health}`);
  console.log(`  Active tasks: ${status.activeTasks}`);
  console.log(`  Completed tasks: ${status.completedTasks}`);
  console.log(`  Failed tasks: ${status.failedTasks}\n`);

  return {
    goalId,
    decomposeResult,
    planResult,
    executeResult,
    monitorResult,
  };
}

/**
 * Example 2: Multiple goals with dependencies
 */
export async function multipleGoalsExample() {
  const agent = new AutonomousGoalAgent();
  await agent.initialize();

  console.log('=== Multiple Goals Example ===\n');

  // Decompose multiple related goals
  const goals = [
    'Design database schema',
    'Implement API endpoints',
    'Create frontend UI',
  ];

  const goalIds: string[] = [];

  for (const goalDesc of goals) {
    console.log(`Decomposing: ${goalDesc}`);
    
    const task: AgentTask = {
      id: `task-${Date.now()}`,
      type: 'planning',
      payload: {
        action: 'decompose-goal',
        goalDescription: goalDesc,
        priority: 7,
      },
      priority: 10,
      createdAt: Date.now(),
    };

    const result = await agent.execute(task);
    
    if (result.success) {
      const goalId = (result.data as any).goalId;
      goalIds.push(goalId);
      console.log(`  ✓ Goal ID: ${goalId}\n`);
    }
  }

  console.log(`Total goals created: ${goalIds.length}`);
  console.log(`Active goals: ${agent.getAllActiveGoals().length}\n`);

  return goalIds;
}

/**
 * Example 3: Access goal tree and monitor directly
 */
export async function advancedGoalTreeExample() {
  const agent = new AutonomousGoalAgent();
  await agent.initialize();

  console.log('=== Advanced Goal Tree Example ===\n');

  // Create a goal
  const task: AgentTask = {
    id: 'task-advanced-1',
    type: 'planning',
    payload: {
      action: 'decompose-goal',
      goalDescription: 'Implement continuous integration pipeline',
      priority: 9,
      constraints: ['Must support multiple branches', 'Must include automated testing'],
    },
    priority: 10,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (!result.success) {
    console.error('Failed to create goal');
    return;
  }

  const goalId = (result.data as any).goalId;
  console.log(`Created goal: ${goalId}\n`);

  // Access the goal tree directly
  const goalTree = agent.getGoalTree(goalId);
  if (goalTree) {
    console.log('=== Goal Tree Analysis ===');
    console.log(`  Root ID: ${goalTree.rootId}`);
    console.log(`  Total nodes: ${goalTree.nodes.size}`);
    
    const rootGoal = goalTree.getGoal(goalTree.rootId);
    if (rootGoal) {
      console.log(`  Root description: ${rootGoal.description}`);
      console.log(`  Root priority: ${rootGoal.priority}`);
      console.log(`  Root complexity: ${rootGoal.complexity.toFixed(2)}`);
      console.log(`  Children count: ${rootGoal.childrenIds.length}`);
      
      // Get children
      const children = goalTree.getChildren(goalTree.rootId);
      console.log('\n  Subgoals:');
      children.forEach((child, index) => {
        console.log(`    ${index + 1}. ${child.description}`);
        console.log(`       Status: ${child.status}, Estimated effort: ${child.estimatedEffort.toFixed(1)}h`);
      });
    }

    // Get critical path
    const criticalPath = goalTree.getCriticalPath();
    console.log(`\n  Critical path (${criticalPath.length} goals):`);
    criticalPath.forEach(nodeId => {
      const node = goalTree.getGoal(nodeId);
      if (node) {
        console.log(`    - ${node.description.substring(0, 60)}...`);
      }
    });
  }

  // Access the progress monitor directly
  const monitor = agent.getProgressMonitor(goalId);
  if (monitor) {
    console.log('\n=== Progress Monitor ===');
    const progress = monitor.getProgress(goalId);
    if (progress) {
      console.log(`  Overall progress: ${(progress.overallProgress * 100).toFixed(1)}%`);
      console.log(`  Velocity: ${progress.velocity.toFixed(2)}`);
      console.log(`  Efficiency: ${progress.efficiency.toFixed(2)}`);
      console.log(`  Risks: ${progress.risks.length}`);
      console.log(`  Blockers: ${progress.blockers.length}`);
    }

    const bottlenecks = monitor.identifyBottlenecks();
    console.log(`  Bottlenecks identified: ${bottlenecks.length}\n`);
  }

  return {
    goalId,
    goalTree,
    monitor,
  };
}

// Export example runner for manual testing
export async function runAllExamples() {
  try {
    await autonomousGoalExample();
    console.log('\n=== All examples completed successfully! ===\n');
  } catch (error) {
    console.error('Example failed:', error);
    throw error;
  }
}
