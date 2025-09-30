/**
 * Example usage of EthicsAlignmentAgent
 * Demonstrates how to use the agent for ethical evaluation
 */

import { EthicsAlignmentAgent } from './ethics-alignment-agent';
import { AgentTask } from './types';

/**
 * Example: Evaluate a user request for ethical compliance
 */
async function evaluateUserRequest() {
  console.log('=== Ethics Alignment Agent Example ===\n');

  const agent = new EthicsAlignmentAgent();
  await agent.initialize();

  // Example 1: Ethically sound request
  console.log('Example 1: Evaluating an ethically sound request...');
  const goodTask: AgentTask = {
    id: 'task-001',
    type: 'ethics',
    payload: {
      action: 'Create a user dashboard',
      description: 'Build a transparent dashboard that helps users understand their data usage with clear privacy controls and consent mechanisms',
      context: 'User-facing feature development',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const goodResult = await agent.execute(goodTask);
  console.log('Result:', JSON.stringify(goodResult, null, 2));
  console.log('\n---\n');

  // Example 2: Request with potential ethical concerns
  console.log('Example 2: Evaluating a request with ethical concerns...');
  const concerningTask: AgentTask = {
    id: 'task-002',
    type: 'ethics',
    payload: {
      action: 'Implement user tracking',
      description: 'Track user behavior without explicit consent and sell data to third parties',
      context: 'Analytics feature',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const concerningResult = await agent.execute(concerningTask);
  console.log('Result:', JSON.stringify(concerningResult, null, 2));
  console.log('\n---\n');

  // Example 3: Request with bias concerns
  console.log('Example 3: Evaluating a request with potential bias...');
  const biasedTask: AgentTask = {
    id: 'task-003',
    type: 'ethics',
    payload: {
      action: 'Create hiring algorithm',
      description: 'Develop algorithm that excludes certain demographics and cherry-picks candidates from specific universities only',
      context: 'HR automation',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const biasedResult = await agent.execute(biasedTask);
  console.log('Result:', JSON.stringify(biasedResult, null, 2));
  console.log('\n---\n');

  // Example 4: Harmful request that should be blocked
  console.log('Example 4: Evaluating a harmful request...');
  const harmfulTask: AgentTask = {
    id: 'task-004',
    type: 'ethics',
    payload: {
      action: 'Bypass security',
      description: 'Create functionality to bypass security measures and access private user data without authorization for malicious purposes',
      context: 'Security testing',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const harmfulResult = await agent.execute(harmfulTask);
  console.log('Result:', JSON.stringify(harmfulResult, null, 2));
  console.log('\n---\n');

  // Display agent status
  console.log('Agent Status:');
  const status = agent.getStatus();
  console.log(JSON.stringify(status, null, 2));
}

/**
 * Example: Update agent with feedback
 */
async function demonstrateFeedbackLearning() {
  console.log('\n=== Feedback Learning Example ===\n');

  const agent = new EthicsAlignmentAgent();
  await agent.initialize();

  // Evaluate a task
  const task: AgentTask = {
    id: 'task-feedback-001',
    type: 'ethics',
    payload: {
      action: 'Implement feature',
      description: 'Add new analytics feature with user consent',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  console.log('Initial assessment:', result.success ? 'Approved' : 'Rejected');

  // Provide feedback
  await agent.updateFromFeedback(
    'task-feedback-001',
    'Feature was successfully implemented with positive user feedback',
    'Users appreciated the clear consent mechanism'
  );

  console.log('Feedback recorded and patterns updated');
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  try {
    await evaluateUserRequest();
    await demonstrateFeedbackLearning();
    console.log('\n=== Examples completed successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
    throw error;
  }
}

export { evaluateUserRequest, demonstrateFeedbackLearning };
