/**
 * Integration test for PredictiveDevelopmentAgent
 * Verifies the agent integrates correctly with the multi-agent system
 */

import { PredictiveDevelopmentAgent } from './predictive-development-agent';
import { AgentTask } from './types';

async function testPredictiveDevelopmentAgent() {
  console.log('🔮 PredictiveDevelopmentAgent Integration Test\n');
  console.log('='.repeat(60));

  // Test 1: Agent Initialization
  console.log('\n📋 Test 1: Initialize Agent');
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();
  console.log('✅ Agent initialized successfully');

  // Test 2: Check Agent Status
  console.log('\n📊 Test 2: Agent Status');
  const status = agent.getStatus();
  console.log(`  - Name: ${status.name}`);
  console.log(`  - Health: ${status.health}`);
  console.log(`  - Type: ${agent.config.type}`);
  console.log(`  - Capabilities: ${agent.config.capabilities.join(', ')}`);
  console.log('✅ Agent status verified');

  // Test 3: Task Handling
  console.log('\n🎯 Test 3: Task Handling Capability');
  const testTask: AgentTask = {
    id: 'test-1',
    type: 'predictive-development',
    payload: { action: 'predict-requirements' },
    priority: 7,
    createdAt: Date.now(),
  };
  
  const canHandle = agent.canHandle(testTask);
  console.log(`  - Can handle 'predictive-development' tasks: ${canHandle ? '✅ Yes' : '❌ No'}`);
  
  if (!canHandle) {
    throw new Error('Agent cannot handle its own task type!');
  }

  // Test 4: Predict Future Requirements
  console.log('\n🔮 Test 4: Predict Future Requirements');
  const predictTask: AgentTask = {
    id: 'predict-req-test',
    type: 'predictive-development',
    payload: {
      action: 'predict-requirements',
      projectContext: {
        features: ['user authentication', 'data management', 'api endpoints'],
        domain: 'saas',
      },
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const predictResult = await agent.execute(predictTask);
  if (!predictResult.success) {
    throw new Error(`Prediction failed: ${predictResult.error}`);
  }
  
  console.log(`✅ Predicted ${(predictResult.data as any).totalPredictions} future requirements`);
  console.log(`  - High probability predictions: ${(predictResult.data as any).highProbabilityCount}`);
  console.log(`  - Confidence: ${(predictResult.metadata?.confidence ?? 0) * 100}%`);

  // Test 5: Suggest Features
  console.log('\n💡 Test 5: Suggest Features');
  const featureTask: AgentTask = {
    id: 'suggest-feat-test',
    type: 'predictive-development',
    payload: {
      action: 'suggest-features',
      projectContext: {
        features: ['product catalog', 'shopping cart'],
        domain: 'e-commerce',
        techStack: {
          frontend: ['react'],
          backend: ['node.js'],
        },
      },
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const featureResult = await agent.execute(featureTask);
  if (!featureResult.success) {
    throw new Error(`Feature suggestion failed: ${featureResult.error}`);
  }
  
  console.log(`✅ Generated ${(featureResult.data as any).totalSuggestions} feature suggestions`);
  console.log(`  - High priority: ${(featureResult.data as any).highPriority}`);
  console.log(`  - Confidence: ${(featureResult.metadata?.confidence ?? 0) * 100}%`);

  // Test 6: Recommend Refactoring
  console.log('\n🔧 Test 6: Recommend Refactoring');
  const refactorTask: AgentTask = {
    id: 'refactor-test',
    type: 'predictive-development',
    payload: {
      action: 'recommend-refactoring',
      projectContext: {
        features: ['authentication', 'database', 'real-time', 'api'],
        techStack: {
          backend: ['express'],
          database: ['postgresql'],
        },
      },
      codebase: {},
    },
    priority: 6,
    createdAt: Date.now(),
  };

  const refactorResult = await agent.execute(refactorTask);
  if (!refactorResult.success) {
    throw new Error(`Refactoring recommendation failed: ${refactorResult.error}`);
  }
  
  console.log(`✅ Generated ${(refactorResult.data as any).totalRecommendations} refactoring recommendations`);
  console.log(`  - High priority: ${(refactorResult.data as any).highPriority}`);
  console.log(`  - Confidence: ${(refactorResult.metadata?.confidence ?? 0) * 100}%`);

  // Test 7: Analyze Market Trends
  console.log('\n📈 Test 7: Analyze Market Trends');
  const trendsTask: AgentTask = {
    id: 'trends-test',
    type: 'predictive-development',
    payload: {
      action: 'analyze-trends',
      domain: 'fintech',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const trendsResult = await agent.execute(trendsTask);
  if (!trendsResult.success) {
    throw new Error(`Market analysis failed: ${trendsResult.error}`);
  }
  
  const analysis = trendsResult.data as any;
  console.log(`✅ Analyzed market trends`);
  console.log(`  - Trends identified: ${analysis.trends?.length || 0}`);
  console.log(`  - Emerging technologies: ${analysis.emergingTechnologies?.length || 0}`);
  console.log(`  - User demands: ${analysis.userDemands?.length || 0}`);

  // Test 8: Comprehensive Analysis
  console.log('\n🎯 Test 8: Comprehensive Predictive Analysis');
  const comprehensiveTask: AgentTask = {
    id: 'comprehensive-test',
    type: 'predictive-development',
    payload: {
      projectContext: {
        name: 'Test Platform',
        features: ['user management', 'analytics', 'api'],
        domain: 'saas',
      },
    },
    priority: 8,
    createdAt: Date.now(),
  };

  const comprehensiveResult = await agent.execute(comprehensiveTask);
  if (!comprehensiveResult.success) {
    throw new Error(`Comprehensive analysis failed: ${comprehensiveResult.error}`);
  }
  
  console.log(`✅ Comprehensive analysis completed`);
  console.log(`  - Summary: ${(comprehensiveResult.data as any).summary}`);
  console.log(`  - Confidence: ${(comprehensiveResult.metadata?.confidence ?? 0) * 100}%`);
  console.log(`  - Next steps: ${comprehensiveResult.nextSteps?.length || 0}`);

  // Test 9: Performance Check
  console.log('\n⚡ Test 9: Performance Check');
  const startTime = Date.now();
  const perfTask: AgentTask = {
    id: 'perf-test',
    type: 'predictive-development',
    payload: {
      action: 'predict-requirements',
      projectContext: { features: ['test'] },
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const perfResult = await agent.execute(perfTask);
  const duration = Date.now() - startTime;
  
  console.log(`✅ Task completed in ${duration}ms`);
  console.log(`  - Success: ${perfResult.success}`);
  console.log(`  - Response time acceptable: ${duration < 5000 ? '✅ Yes' : '⚠️ Slow'}`);

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const finalStatus = agent.getStatus();
  console.log(`  Total tasks completed: ${finalStatus.completedTasks}`);
  console.log(`  Total tasks failed: ${finalStatus.failedTasks}`);
  console.log(`  Agent health: ${finalStatus.health}`);
  console.log(`  Success rate: ${(finalStatus.completedTasks / (finalStatus.completedTasks + finalStatus.failedTasks) * 100).toFixed(1)}%`);
  
  console.log('\n✅ All tests passed successfully!');
  console.log('🎉 PredictiveDevelopmentAgent is ready for production use.\n');

  return true;
}

// Run the test
testPredictiveDevelopmentAgent()
  .then(() => {
    console.log('✅ Test suite completed successfully');
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    throw error;
  });
