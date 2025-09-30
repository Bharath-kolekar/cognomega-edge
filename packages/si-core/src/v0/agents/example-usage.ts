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
 * Example: Use the SelfImprovingAgent for meta-cognition and self-improvement
 */
export async function useSelfImprovingAgent() {
  // Import the SelfImprovingAgent
  const { SelfImprovingAgent } = await import('./self-improving-agent');
  
  // Create and initialize the agent
  const selfImprovingAgent = new SelfImprovingAgent();
  await selfImprovingAgent.initialize();
  
  console.log('SelfImprovingAgent initialized');
  console.log('Capabilities:', selfImprovingAgent.config.capabilities);
  
  // Example 1: Analyze current performance
  const analysisTask: AgentTask = {
    id: 'analysis-1',
    type: 'self-improving',
    payload: { action: 'analyze' },
    priority: 8,
    createdAt: Date.now(),
  };
  
  const analysisResult = await selfImprovingAgent.execute(analysisTask);
  console.log('\nPerformance Analysis:', analysisResult.data);
  
  // Example 2: Generate improvement plans
  const improvementTask: AgentTask = {
    id: 'improve-1',
    type: 'self-improving',
    payload: { action: 'improve' },
    priority: 8,
    createdAt: Date.now(),
  };
  
  const improvementResult = await selfImprovingAgent.execute(improvementTask);
  console.log('\nImprovement Plans:', improvementResult.data);
  
  // Example 3: Perform meta-cognition (introspection)
  const introspectionTask: AgentTask = {
    id: 'introspect-1',
    type: 'self-improving',
    payload: { action: 'introspect' },
    priority: 8,
    createdAt: Date.now(),
  };
  
  const introspectionResult = await selfImprovingAgent.execute(introspectionTask);
  console.log('\nMeta-Cognitive Analysis:', introspectionResult.data);
  
  // Access metrics directly
  const metrics = selfImprovingAgent.getMetrics();
  console.log('\nCurrent Metrics:', {
    successRate: `${(metrics.successRate * 100).toFixed(1)}%`,
    totalTasks: metrics.totalTasksProcessed,
    performanceTrend: metrics.performanceTrend,
  });
  
  // Get improvement plans
  const plans = selfImprovingAgent.getImprovementPlans();
  console.log(`\nTotal Improvement Plans: ${plans.length}`);
  
  return {
    analysisResult,
    improvementResult,
    introspectionResult,
    metrics,
    plans,
  };
}

/**
 * Example: Use SelfImprovingAgent with custom modules
 */
export async function useSelfImprovingAgentWithModules() {
  const { SelfImprovingAgent } = await import('./self-improving-agent');
  
  // Import types separately
  type IMetaCognitionModule = import('./self-improving-agent').IMetaCognitionModule;
  type IVectorDatabase = import('./self-improving-agent').IVectorDatabase;
  type ISelfModificationEngine = import('./self-improving-agent').ISelfModificationEngine;
  
  // Example stub implementations (in production, these would be real integrations)
  
  // Stub meta-cognition module
  const metaCognitionModule: IMetaCognitionModule = {
    analyzeReasoning: async (_task, _result) => ({
      qualityScore: 0.85,
      strengths: ['Clear logic', 'Efficient processing'],
      weaknesses: ['Could improve error handling'],
      suggestions: ['Add validation layer', 'Implement retry logic'],
    }),
    evaluateDecision: async (_decision, _outcome) => 0.88,
    identifyBiases: async (_history) => ['Confirmation bias', 'Availability heuristic'],
  };
  
  // Stub vector database
  const vectorDatabase: IVectorDatabase = {
    store: async (key, _vector, metadata) => {
      console.log(`Storing in vector DB: ${key}`, metadata);
    },
    retrieve: async (_vector, topK) => {
      return Array.from({ length: Math.min(topK, 3) }, (_, i) => ({
        key: `pattern-${i}`,
        similarity: 0.9 - i * 0.1,
        metadata: { type: 'learning_pattern', timestamp: Date.now() },
      }));
    },
    update: async (key, metadata) => {
      console.log(`Updating vector DB: ${key}`, metadata);
    },
  };
  
  // Stub self-modification engine
  const selfModificationEngine: ISelfModificationEngine = {
    proposeModifications: async (metrics) => {
      if (metrics.successRate < 0.9) {
        return [{
          id: `mod-${Date.now()}`,
          name: 'Enhance Error Handling',
          description: 'Improve error handling and recovery',
          priority: 'high' as const,
          targetMetrics: ['successRate'],
          expectedImpact: 0.12,
          steps: [
            {
              name: 'Add try-catch blocks',
              description: 'Wrap critical sections in error handlers',
              action: 'refactor' as const,
              completed: false,
            },
          ],
          status: 'proposed' as const,
          created: Date.now(),
        }];
      }
      return [];
    },
    applyModification: async (plan) => ({
      success: true,
      modificationId: `applied-${plan.id}`,
      changes: [`Applied ${plan.steps.length} improvements`],
    }),
    rollback: async (modificationId) => {
      console.log(`Rolling back modification: ${modificationId}`);
    },
  };
  
  // Create agent with custom modules
  const agent = new SelfImprovingAgent(
    metaCognitionModule,
    vectorDatabase,
    selfModificationEngine
  );
  
  await agent.initialize();
  
  console.log('SelfImprovingAgent with custom modules initialized');
  
  // Use the agent with enhanced capabilities
  const task: AgentTask = {
    id: 'enhanced-analysis-1',
    type: 'self-improving',
    payload: { action: 'improve' },
    priority: 9,
    createdAt: Date.now(),
  };
  
  const result = await agent.execute(task);
  console.log('Enhanced improvement result:', result.data);
  
  return result;
}

// Export for testing
export { createFullStackAssistant };
