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

/**
 * Example: Use CausalReasoningAgent for marketing optimization
 */
export async function optimizeMarketingCampaign() {
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  console.log('\n=== Causal Reasoning Example: Marketing Optimization ===\n');

  // Step 1: Build a causal model
  console.log('Step 1: Building causal model for marketing domain...');
  const buildModelTask: AgentTask = {
    id: 'causal-build-1',
    type: 'planning', // CausalReasoningAgent uses 'planning' type
    payload: {
      action: 'build-model',
      payload: {
        graphId: 'marketing-model',
        domain: 'marketing',
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const modelResult = await assistant.execute(buildModelTask);
  if (modelResult.success) {
    console.log('✓ Causal model built successfully');
    console.log('  Insights:', (modelResult.data as any)?.insights);
  }

  // Step 2: Predict intervention effects
  console.log('\nStep 2: Predicting effect of increasing ad spend...');
  const predictTask: AgentTask = {
    id: 'causal-predict-1',
    type: 'planning',
    payload: {
      action: 'predict-intervention',
      payload: {
        graphId: 'marketing-model',
        intervention: {
          targetNode: 'ad_spend',
          value: 1000,
          type: 'do',
          description: 'Increase ad spend by $1000',
        },
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const predictResult = await assistant.execute(predictTask);
  if (predictResult.success) {
    const result = predictResult.data as any;
    console.log('✓ Intervention predicted');
    console.log(`  Expected outcome: ${result.expectedOutcome?.toFixed(2)}`);
    console.log(`  Confidence: ${(result.confidence * 100)?.toFixed(1)}%`);
    console.log(`  Affects ${result.affectedNodes?.size || 0} nodes`);
  }

  // Step 3: Select optimal intervention
  console.log('\nStep 3: Comparing multiple interventions...');
  const selectTask: AgentTask = {
    id: 'causal-select-1',
    type: 'planning',
    payload: {
      action: 'select-optimal',
      payload: {
        graphId: 'marketing-model',
        targetNode: 'revenue',
        interventions: [
          {
            targetNode: 'ad_spend',
            value: 500,
            type: 'do',
            description: 'Moderate ad spend increase',
          },
          {
            targetNode: 'ad_spend',
            value: 1500,
            type: 'do',
            description: 'High ad spend increase',
          },
          {
            targetNode: 'impressions',
            value: 10000,
            type: 'do',
            description: 'Direct impression boost',
          },
        ],
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const selectResult = await assistant.execute(selectTask);
  if (selectResult.success) {
    const result = selectResult.data as any;
    console.log('✓ Optimal intervention selected');
    console.log('\nReasoning:');
    console.log(result.reasoning);
  }

  return selectResult;
}

/**
 * Example: Use CausalReasoningAgent for healthcare decision support
 */
export async function analyzeHealthcareTreatment() {
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  console.log('\n=== Causal Reasoning Example: Healthcare Treatment ===\n');

  // Build healthcare causal model
  const buildTask: AgentTask = {
    id: 'causal-healthcare-1',
    type: 'planning',
    payload: {
      action: 'build-model',
      payload: {
        graphId: 'healthcare-model',
        domain: 'healthcare',
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const buildResult = await assistant.execute(buildTask);
  if (buildResult.success) {
    console.log('✓ Healthcare causal model built');
    console.log('  Model insights:', (buildResult.data as any)?.insights);
  }

  // Analyze counterfactual: What if we had used a different dosage?
  const counterfactualTask: AgentTask = {
    id: 'causal-counterfactual-1',
    type: 'planning',
    payload: {
      action: 'counterfactual',
      payload: {
        graphId: 'healthcare-model',
        intervention: {
          targetNode: 'dosage',
          value: 200,
          type: 'counterfactual',
          description: 'Alternative dosage level',
        },
        observedData: {
          recovery: 0.7,
          side_effects: 0.3,
        },
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const counterfactualResult = await assistant.execute(counterfactualTask);
  if (counterfactualResult.success) {
    console.log('\n✓ Counterfactual analysis complete');
    const result = counterfactualResult.data as any;
    console.log(`  Expected outcome: ${result.expectedOutcome?.toFixed(2)}`);
    if (result.warnings) {
      console.log('  Warnings:', result.warnings);
    }
  }

  return counterfactualResult;
}

// Export for testing
export { createFullStackAssistant };
