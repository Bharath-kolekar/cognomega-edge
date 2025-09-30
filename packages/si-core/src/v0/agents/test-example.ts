/**
 * Simple test/demo script to verify the multi-agent system works
 * Run with: npx tsx packages/si-core/src/v0/agents/test-example.ts
 */

import { 
  createFullStackAssistant,
  ProjectRequirements,
  AgentTask,
} from './index';

async function testMultiAgentSystem() {
  console.log('🤖 Multi-Agent System Test\n');
  console.log('='.repeat(50));

  // Test 1: Create assistant and check status
  console.log('\n📋 Test 1: Initialize Assistant');
  const assistant = createFullStackAssistant();
  await assistant.initialize();
  console.log('✅ Assistant initialized successfully');

  // Test 2: Get agent statuses
  console.log('\n📊 Test 2: Agent Statuses');
  const statuses = assistant.getAgentStatuses();
  statuses.forEach((status, agentType) => {
    console.log(`  - ${agentType}: ${status.health}`);
  });
  console.log(`✅ ${statuses.size} agents registered`);

  // Test 3: Execute a planning task
  console.log('\n📝 Test 3: Execute Planning Task');
  const requirements: ProjectRequirements = {
    name: 'Test Blog Platform',
    description: 'A simple blog platform for testing',
    framework: 'React',
    targetPlatform: 'web',
    features: ['Blog posts', 'Comments', 'User auth'],
  };

  const planningTask: AgentTask = {
    id: 'test-planning-1',
    type: 'planning',
    payload: { requirements },
    priority: 10,
    createdAt: Date.now(),
  };

  console.log('  Executing planning task...');
  const planningResult = await assistant.execute(planningTask);
  
  if (planningResult.success) {
    console.log('✅ Planning task completed successfully');
    const plan = planningResult.data as any;
    if (plan?.tasks) {
      console.log(`  - Generated ${plan.tasks.length} tasks`);
    }
    if (plan?.risks) {
      console.log(`  - Identified ${plan.risks.length} risks`);
    }
  } else {
    console.log('❌ Planning task failed:', planningResult.error);
  }

  // Test 4: Check agent health after execution
  console.log('\n💊 Test 4: Agent Health Check');
  const healthStatuses = assistant.getAgentStatuses();
  const planningAgent = healthStatuses.get('planning');
  if (planningAgent) {
    console.log(`  Planning Agent:`);
    console.log(`    - Health: ${planningAgent.health}`);
    console.log(`    - Completed: ${planningAgent.completedTasks}`);
    console.log(`    - Failed: ${planningAgent.failedTasks}`);
    console.log(`    - Active: ${planningAgent.activeTasks}`);
  }
  console.log('✅ Health check complete');

  // Test 5: Test individual agent directly
  console.log('\n🎨 Test 5: Test UI Design Agent');
  const designTask: AgentTask = {
    id: 'test-design-1',
    type: 'ui-design',
    payload: { requirements },
    priority: 8,
    createdAt: Date.now(),
  };

  console.log('  Executing UI design task...');
  const designResult = await assistant.execute(designTask);
  
  if (designResult.success) {
    console.log('✅ UI design task completed successfully');
    const design = designResult.data as any;
    if (design?.components) {
      console.log(`  - Generated ${design.components.length} components`);
    }
    if (design?.theme) {
      console.log(`  - Created theme: ${design.theme.name}`);
    }
  } else {
    console.log('❌ UI design task failed:', designResult.error);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const finalStatuses = assistant.getAgentStatuses();
  let totalCompleted = 0;
  let totalFailed = 0;
  
  finalStatuses.forEach((status) => {
    totalCompleted += status.completedTasks;
    totalFailed += status.failedTasks;
  });

  console.log(`Total Agents: ${finalStatuses.size}`);
  console.log(`Total Completed Tasks: ${totalCompleted}`);
  console.log(`Total Failed Tasks: ${totalFailed}`);
  console.log(`Success Rate: ${totalCompleted > 0 ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(1) : 0}%`);

  if (totalFailed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed');
  }

  return {
    totalCompleted,
    totalFailed,
    success: totalFailed === 0,
  };
}

// Run if executed directly
if (require.main === module) {
  testMultiAgentSystem()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    });
}

export { testMultiAgentSystem };
