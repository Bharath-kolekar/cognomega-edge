/**
 * Test script for PersonalizationAgent
 * Run with: npx tsx packages/si-core/src/v0/agents/test-personalization.ts
 */

import { PersonalizationAgent } from './personalization-agent';
import { AgentTask } from './types';

async function testPersonalizationAgent() {
  console.log('🤖 PersonalizationAgent Test\n');
  console.log('='.repeat(60));

  // Initialize the agent
  console.log('\n📋 Test 1: Initialize PersonalizationAgent');
  const agent = new PersonalizationAgent();
  await agent.initialize();
  console.log('✅ Agent initialized successfully');

  // Check status
  console.log('\n📊 Test 2: Check Agent Status');
  const status = agent.getStatus();
  console.log(`  - Name: ${status.name}`);
  console.log(`  - Health: ${status.health}`);
  console.log(`  - Capabilities: ${agent.config.capabilities.join(', ')}`);
  console.log('✅ Status check complete');

  const testUserId = 'test-user-001';

  // Test 3: Get initial user profile
  console.log('\n👤 Test 3: Get User Profile');
  const getProfileTask: AgentTask = {
    id: 'test-profile-1',
    type: 'personalization',
    payload: {
      taskType: 'get-profile',
    },
    priority: 5,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const profileResult = await agent.execute(getProfileTask);
  if (profileResult.success) {
    console.log('✅ Retrieved user profile');
    const profile = (profileResult.data as any).profile;
    console.log(`  - User ID: ${profile.id}`);
    console.log(`  - Expertise: ${profile.expertise}`);
    console.log(`  - Goals: ${profile.goals.length}`);
  } else {
    console.log('❌ Failed to get profile:', profileResult.error);
  }

  // Test 4: Update user profile
  console.log('\n✏️  Test 4: Update User Profile');
  const updateTask: AgentTask = {
    id: 'test-update-1',
    type: 'personalization',
    payload: {
      taskType: 'update-profile',
      updates: {
        goals: ['Learn TypeScript', 'Build full-stack apps', 'Master AI integration'],
        expertise: 'intermediate',
        preferences: {
          communicationStyle: 'technical',
          learningStyle: 'hands-on',
          frameworkPreferences: ['React', 'Node.js'],
        },
      },
    },
    priority: 7,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const updateResult = await agent.execute(updateTask);
  if (updateResult.success) {
    console.log('✅ Profile updated successfully');
    const updatedProfile = (updateResult.data as any).profile;
    console.log(`  - Goals: ${updatedProfile.goals.join(', ')}`);
    console.log(`  - Expertise: ${updatedProfile.expertise}`);
    console.log(`  - Style: ${updatedProfile.preferences.communicationStyle}`);
  } else {
    console.log('❌ Failed to update profile:', updateResult.error);
  }

  // Test 5: Record interactions
  console.log('\n📝 Test 5: Record User Interactions');
  for (let i = 0; i < 3; i++) {
    const recordTask: AgentTask = {
      id: `test-record-${i}`,
      type: 'personalization',
      payload: {
        taskType: 'record-interaction',
        interaction: {
          taskType: 'code-generation',
          input: `Generate a React component ${i}`,
          output: 'Component code...',
          success: true,
          duration: 1000 + i * 500,
        },
      },
      priority: 5,
      context: { userId: testUserId },
      createdAt: Date.now(),
    };

    await agent.execute(recordTask);
  }
  console.log('✅ Recorded 3 user interactions');

  // Test 6: Get recommendations
  console.log('\n💡 Test 6: Generate Recommendations');
  const recommendTask: AgentTask = {
    id: 'test-recommend-1',
    type: 'personalization',
    payload: {
      taskType: 'get-recommendations',
      context: {
        currentTask: 'building-react-app',
      },
    },
    priority: 8,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const recommendResult = await agent.execute(recommendTask);
  if (recommendResult.success) {
    console.log('✅ Generated recommendations');
    const recommendations = (recommendResult.data as any).recommendations;
    console.log(`  - Total recommendations: ${recommendations.length}`);
    recommendations.slice(0, 3).forEach((rec: any, idx: number) => {
      console.log(`  ${idx + 1}. ${rec.title} (confidence: ${rec.confidence.toFixed(2)})`);
    });
  } else {
    console.log('❌ Failed to generate recommendations:', recommendResult.error);
  }

  // Test 7: Analyze behavior
  console.log('\n🔍 Test 7: Analyze User Behavior');
  const analyzeTask: AgentTask = {
    id: 'test-analyze-1',
    type: 'personalization',
    payload: {
      taskType: 'analyze-behavior',
    },
    priority: 6,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const analyzeResult = await agent.execute(analyzeTask);
  if (analyzeResult.success) {
    console.log('✅ Behavior analysis complete');
    const patterns = (analyzeResult.data as any).patterns;
    console.log(`  - Identified patterns: ${patterns.length}`);
    patterns.forEach((pattern: any) => {
      console.log(`    • ${pattern.type}: ${pattern.pattern} (${pattern.frequency}x)`);
    });
  } else {
    console.log('❌ Failed to analyze behavior:', analyzeResult.error);
  }

  // Test 8: Anticipate needs
  console.log('\n🔮 Test 8: Anticipate User Needs');
  const anticipateTask: AgentTask = {
    id: 'test-anticipate-1',
    type: 'personalization',
    payload: {
      taskType: 'anticipate-needs',
      context: {
        currentTask: 'code-generation',
      },
    },
    priority: 7,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const anticipateResult = await agent.execute(anticipateTask);
  if (anticipateResult.success) {
    console.log('✅ Needs anticipated');
    const needs = (anticipateResult.data as any).anticipatedNeeds;
    console.log(`  - Anticipated needs: ${needs.length}`);
    needs.slice(0, 3).forEach((need: any, idx: number) => {
      console.log(`  ${idx + 1}. ${need.title}`);
    });
  } else {
    console.log('❌ Failed to anticipate needs:', anticipateResult.error);
  }

  // Test 9: Adapt response
  console.log('\n🎨 Test 9: Adapt Response Style');
  const adaptTask: AgentTask = {
    id: 'test-adapt-1',
    type: 'personalization',
    payload: {
      taskType: 'adapt-response',
      content: 'Here is a detailed explanation of how to create a React component. First, you need to import React...',
    },
    priority: 6,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const adaptResult = await agent.execute(adaptTask);
  if (adaptResult.success) {
    console.log('✅ Response adapted');
    const response = (adaptResult.data as any).response;
    console.log(`  - Style: ${response.style}`);
    console.log(`  - Technicality: ${response.technicality.toFixed(2)}`);
    console.log(`  - Examples: ${response.examples.length}`);
  } else {
    console.log('❌ Failed to adapt response:', adaptResult.error);
  }

  // Test 10: Learn from feedback
  console.log('\n📚 Test 10: Learn from Feedback');
  const feedbackTask: AgentTask = {
    id: 'test-feedback-1',
    type: 'personalization',
    payload: {
      taskType: 'learn-from-feedback',
      feedback: {
        type: 'positive',
        rating: 5,
        comment: 'Great technical explanation!',
        aspects: ['clarity', 'technical-depth'],
        timestamp: Date.now(),
      },
    },
    priority: 5,
    context: { userId: testUserId },
    createdAt: Date.now(),
  };

  const feedbackResult = await agent.execute(feedbackTask);
  if (feedbackResult.success) {
    console.log('✅ Learning applied from feedback');
    const insight = (feedbackResult.data as any).insight;
    console.log(`  - Insight: ${insight.insight}`);
    console.log(`  - Confidence: ${insight.confidence.toFixed(2)}`);
  } else {
    console.log('❌ Failed to learn from feedback:', feedbackResult.error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const finalStatus = agent.getStatus();
  console.log(`Total Tests Run: 10`);
  console.log(`Completed Tasks: ${finalStatus.completedTasks}`);
  console.log(`Failed Tasks: ${finalStatus.failedTasks}`);
  console.log(`Success Rate: ${((finalStatus.completedTasks / (finalStatus.completedTasks + finalStatus.failedTasks)) * 100).toFixed(1)}%`);

  if (finalStatus.failedTasks === 0) {
    console.log('\n✅ All tests passed!');
    return { success: true };
  } else {
    console.log('\n⚠️  Some tests failed');
    return { success: false };
  }
}

// Run if executed directly
if (import.meta.main) {
  testPersonalizationAgent()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    });
}

export { testPersonalizationAgent };
