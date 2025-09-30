/**
 * Example usage of the Multi-Agent AI System
 * Demonstrates how to use the FullStackAIAssistant to build a complete application
 */

import { createFullStackAssistant } from './index';
import { ProjectRequirements, AgentTask } from './types';

/**
 * Example: Build a simple e-commerce application
 */
export async function buildEcommerceApp() {
  // Create the AI assistant
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  // Define project requirements
  const requirements: ProjectRequirements = {
    name: 'E-Commerce Platform',
    description: 'A modern e-commerce platform with product catalog, shopping cart, and checkout',
    framework: 'Next.js',
    targetPlatform: 'fullstack',
    features: [
      'Product catalog with search and filters',
      'Shopping cart management',
      'User authentication and profiles',
      'Order management',
      'Payment integration',
      'Admin dashboard',
    ],
    constraints: [
      'Mobile-responsive design',
      'SEO optimized',
      'Fast page load times',
    ],
    techStack: {
      frontend: ['next.js', 'react', 'tailwindcss'],
      backend: ['node.js', 'express', 'rest-api'],
      database: ['postgresql'],
      devops: ['docker', 'github-actions'],
    },
  };

  // Create orchestration task
  const task: AgentTask = {
    id: 'ecommerce-build-1',
    type: 'orchestrator',
    payload: { requirements },
    priority: 10,
    context: {
      projectId: 'ecommerce-platform',
      userId: 'user-123',
      sessionId: 'session-456',
    },
    createdAt: Date.now(),
  };

  // Execute the task
  console.log('Starting project build...');
  const result = await assistant.execute(task);

  if (result.success) {
    console.log('Project build successful!');
    console.log('Orchestration result:', result.data);
    
    // Get agent statuses
    const agentStatuses = assistant.getAgentStatuses();
    console.log('\nAgent Statuses:');
    agentStatuses.forEach((status, agentType) => {
      console.log(`  ${agentType}: ${status.health} - ${status.completedTasks} tasks completed`);
    });
  } else {
    console.error('Project build failed:', result.error);
  }

  return result;
}

/**
 * Example: Build a simple dashboard application
 */
export async function buildDashboardApp() {
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  const requirements: ProjectRequirements = {
    name: 'Analytics Dashboard',
    description: 'A real-time analytics dashboard with data visualization',
    framework: 'React',
    targetPlatform: 'web',
    features: [
      'Real-time data visualization',
      'Multiple chart types',
      'Data filtering and export',
      'User authentication',
      'Dashboard customization',
    ],
    techStack: {
      frontend: ['react', 'recharts', 'tailwindcss'],
      backend: ['node.js', 'express'],
      database: ['postgresql'],
    },
  };

  const task: AgentTask = {
    id: 'dashboard-build-1',
    type: 'orchestrator',
    payload: { requirements },
    priority: 10,
    createdAt: Date.now(),
  };

  const result = await assistant.execute(task);
  return result;
}

/**
 * Example: Use individual agents directly
 */
export async function useIndividualAgents() {
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  // Example: Use just the planning agent
  const requirements: ProjectRequirements = {
    name: 'Simple Blog',
    description: 'A personal blog with markdown support',
    framework: 'Next.js',
    targetPlatform: 'web',
    features: ['Blog posts', 'Markdown editor', 'Comments'],
  };

  const planningTask: AgentTask = {
    id: 'planning-1',
    type: 'planning',
    payload: { requirements },
    priority: 10,
    createdAt: Date.now(),
  };

  // Execute planning task only
  const planningResult = await assistant.execute(planningTask);
  
  if (planningResult.success) {
    console.log('Project plan created:', planningResult.data);
  }

  return planningResult;
}

// Export for testing
export { createFullStackAssistant };
