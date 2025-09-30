/**
 * Example usage of the PredictiveDevelopmentAgent
 * Demonstrates how to use the agent for anticipatory development
 */

import { PredictiveDevelopmentAgent } from './predictive-development-agent';
import { AgentTask } from './types';

/**
 * Example 1: Predict future requirements for a growing application
 */
export async function examplePredictFutureRequirements() {
  console.log('=== Example 1: Predict Future Requirements ===');
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  const task: AgentTask = {
    id: 'predict-req-1',
    type: 'predictive-development',
    payload: {
      action: 'predict-requirements',
      projectContext: {
        features: [
          'user authentication',
          'data management',
          'user profiles',
          'admin dashboard',
        ],
        domain: 'e-commerce',
      },
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (result.success) {
    console.log('✅ Successfully predicted future requirements');
    console.log('Requirements:', result.data);
    console.log('Next Steps:', result.nextSteps);
  } else {
    console.error('❌ Prediction failed:', result.error);
  }

  return result;
}

/**
 * Example 2: Get feature suggestions based on market trends
 */
export async function exampleSuggestFeatures() {
  console.log('\n=== Example 2: Suggest Features Based on Market Trends ===');
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  const task: AgentTask = {
    id: 'suggest-feat-1',
    type: 'predictive-development',
    payload: {
      action: 'suggest-features',
      projectContext: {
        features: ['product catalog', 'shopping cart'],
        domain: 'e-commerce',
        techStack: {
          frontend: ['react', 'nextjs'],
          backend: ['node.js', 'express'],
          database: ['postgresql'],
        },
      },
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (result.success) {
    console.log('✅ Successfully generated feature suggestions');
    console.log('Suggestions:', result.data);
    console.log('Confidence:', result.metadata?.confidence);
  } else {
    console.error('❌ Feature suggestion failed:', result.error);
  }

  return result;
}

/**
 * Example 3: Get refactoring recommendations based on predicted patterns
 */
export async function exampleRecommendRefactoring() {
  console.log('\n=== Example 3: Recommend Refactoring ===');
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  const task: AgentTask = {
    id: 'refactor-rec-1',
    type: 'predictive-development',
    payload: {
      action: 'recommend-refactoring',
      projectContext: {
        features: [
          'user authentication',
          'database operations',
          'real-time notifications',
          'api endpoints',
        ],
        techStack: {
          frontend: ['react'],
          backend: ['express', 'node.js'],
          database: ['postgresql'],
        },
      },
      codebase: {
        // In production, this would contain actual codebase analysis
        files: 50,
        complexity: 'medium',
      },
    },
    priority: 6,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (result.success) {
    console.log('✅ Successfully generated refactoring recommendations');
    console.log('Refactorings:', result.data);
  } else {
    console.error('❌ Refactoring recommendation failed:', result.error);
  }

  return result;
}

/**
 * Example 4: Analyze market trends
 */
export async function exampleAnalyzeMarketTrends() {
  console.log('\n=== Example 4: Analyze Market Trends ===');
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  const task: AgentTask = {
    id: 'trends-1',
    type: 'predictive-development',
    payload: {
      action: 'analyze-trends',
      domain: 'fintech',
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (result.success) {
    console.log('✅ Successfully analyzed market trends');
    console.log('Trends:', result.data);
  } else {
    console.error('❌ Market analysis failed:', result.error);
  }

  return result;
}

/**
 * Example 5: Comprehensive predictive analysis
 */
export async function exampleComprehensiveAnalysis() {
  console.log('\n=== Example 5: Comprehensive Predictive Analysis ===');
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  const task: AgentTask = {
    id: 'comprehensive-1',
    type: 'predictive-development',
    payload: {
      projectContext: {
        name: 'SaaS Platform',
        features: [
          'user management',
          'subscription billing',
          'analytics dashboard',
          'API integration',
        ],
        domain: 'saas',
        techStack: {
          frontend: ['react', 'typescript'],
          backend: ['node.js', 'express'],
          database: ['postgresql'],
        },
      },
      domain: 'saas',
    },
    priority: 8,
    createdAt: Date.now(),
  };

  const result = await agent.execute(task);
  
  if (result.success) {
    console.log('✅ Successfully performed comprehensive analysis');
    console.log('Summary:', result.data);
    console.log('Confidence:', result.metadata?.confidence);
    console.log('Next Steps:', result.nextSteps);
  } else {
    console.error('❌ Comprehensive analysis failed:', result.error);
  }

  return result;
}

/**
 * Example 6: Integration with FullStackAIAssistant orchestrator
 */
export async function exampleIntegrationWithOrchestrator() {
  console.log('\n=== Example 6: Integration with Orchestrator ===');
  
  // This demonstrates how the PredictiveDevelopmentAgent
  // can be used as part of the full multi-agent system
  
  const agent = new PredictiveDevelopmentAgent();
  await agent.initialize();

  // Check agent status
  const status = agent.getStatus();
  console.log('Agent Status:', {
    name: status.name,
    health: status.health,
    capabilities: agent.config.capabilities,
  });

  // Verify the agent can handle tasks
  const testTask: AgentTask = {
    id: 'test-1',
    type: 'predictive-development',
    payload: {
      action: 'predict-requirements',
      projectContext: { features: ['auth', 'api'] },
    },
    priority: 5,
    createdAt: Date.now(),
  };

  const canHandle = agent.canHandle(testTask);
  console.log('Can handle predictive-development tasks:', canHandle);

  // Execute task
  if (canHandle) {
    const result = await agent.execute(testTask);
    console.log('Execution result:', result.success ? '✅ Success' : '❌ Failed');
  }

  return status;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  PredictiveDevelopmentAgent Usage Examples            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    await examplePredictFutureRequirements();
    await exampleSuggestFeatures();
    await exampleRecommendRefactoring();
    await exampleAnalyzeMarketTrends();
    await exampleComprehensiveAnalysis();
    await exampleIntegrationWithOrchestrator();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// Export for use in other modules
export {
  PredictiveDevelopmentAgent,
  MarketTrendAnalyzer,
  PatternPredictor,
} from './predictive-development-agent';
