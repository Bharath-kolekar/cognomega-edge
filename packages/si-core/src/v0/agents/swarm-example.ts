/**
 * Example usage of SwarmIntelligenceOrchestrator
 * 
 * This example demonstrates how to:
 * 1. Create a swarm orchestrator
 * 2. Register specialized agents
 * 3. Execute complex tasks using emergent swarm intelligence
 * 4. Monitor swarm metrics and performance
 */

import {
  SwarmIntelligenceOrchestrator,
  ProjectPlanningAgent,
  FrontendDevAgent,
  BackendDevAgent,
  TestingAgent,
  AgentTask,
  ProjectRequirements,
} from './index';
import { SwarmOrchestrationResult } from './swarm-intelligence-orchestrator';

/**
 * Example 1: Basic Swarm Orchestration
 */
export async function basicSwarmExample() {
  console.log('=== Basic Swarm Intelligence Example ===\n');

  // Create orchestrator
  const orchestrator = new SwarmIntelligenceOrchestrator();

  // Register specialized agents
  const planningAgent = new ProjectPlanningAgent();
  const frontendAgent = new FrontendDevAgent();
  const backendAgent = new BackendDevAgent();
  const testingAgent = new TestingAgent();

  // Initialize agents
  await planningAgent.initialize();
  await frontendAgent.initialize();
  await backendAgent.initialize();
  await testingAgent.initialize();

  // Register with swarm
  orchestrator.registerAgent(planningAgent);
  orchestrator.registerAgent(frontendAgent);
  orchestrator.registerAgent(backendAgent);
  orchestrator.registerAgent(testingAgent);

  console.log('Registered agents to swarm\n');
  console.log('Swarm Metrics:', orchestrator.getSwarmMetrics(), '\n');

  // Create a complex task
  const requirements: ProjectRequirements = {
    name: 'E-commerce Platform',
    description: 'Build a modern e-commerce platform with React and Node.js',
    framework: 'react',
    targetPlatform: 'web',
    features: [
      'User authentication',
      'Product catalog',
      'Shopping cart',
      'Payment integration',
      'Order management',
    ],
    constraints: [
      'Mobile responsive',
      'High performance',
      'Secure payments',
    ],
    techStack: {
      frontend: ['React', 'TypeScript', 'TailwindCSS'],
      backend: ['Node.js', 'Express', 'PostgreSQL'],
    },
  };

  const task: AgentTask = {
    id: 'task-ecommerce-1',
    type: 'orchestrator',
    payload: { requirements },
    priority: 10,
    context: {
      projectId: 'ecommerce-project',
      userId: 'user-123',
    },
    createdAt: Date.now(),
  };

  // Execute task using swarm intelligence
  console.log('Executing task with swarm intelligence...\n');
  const result = await orchestrator.execute(task);

  console.log('\n=== Swarm Results ===');
  console.log('Success:', result.success);
  
  if ('swarmMetrics' in result) {
    const swarmResult = result as SwarmOrchestrationResult;
    
    console.log('\nSwarm Metrics:');
    console.log('- Total Agents:', swarmResult.swarmMetrics.totalAgents);
    console.log('- Active Agents:', swarmResult.swarmMetrics.activeAgents);
    console.log('- Emergence Level:', swarmResult.swarmMetrics.emergenceLevel.toFixed(2) + '%');
    console.log('- Coherence:', swarmResult.swarmMetrics.coherence.toFixed(2) + '%');
    console.log('- Distributed Efficiency:', swarmResult.swarmMetrics.distributedEfficiency.toFixed(2));

    console.log('\nConsensus:');
    console.log('- Consensus Strength:', swarmResult.consensus.consensusStrength.toFixed(2) + '%');
    console.log('- Confidence:', swarmResult.consensus.confidence.toFixed(2));
    console.log('- Participating Agents:', swarmResult.consensus.participatingAgents.length);

    console.log('\nEmergent Synthesis:');
    console.log('- Emergence Level:', swarmResult.synthesis.emergenceLevel.toFixed(2) + '%');
    console.log('- Patterns:', swarmResult.synthesis.patterns.join(', '));
    console.log('- Confidence:', swarmResult.synthesis.confidence.toFixed(2));
  }

  if (result.metadata?.suggestions) {
    console.log('\nSuggestions:');
    result.metadata.suggestions.forEach((suggestion) => {
      console.log('  -', suggestion);
    });
  }

  console.log('\nFinal Swarm Metrics:', orchestrator.getSwarmMetrics());
}

/**
 * Example 2: Dynamic Agent Registration
 */
export async function dynamicRegistrationExample() {
  console.log('\n\n=== Dynamic Agent Registration Example ===\n');

  // Start with empty swarm
  const orchestrator = new SwarmIntelligenceOrchestrator();

  console.log('Initial swarm metrics:', orchestrator.getSwarmMetrics(), '\n');

  // Dynamically add agents as needed
  console.log('Adding planning agent...');
  const planningAgent = new ProjectPlanningAgent();
  await planningAgent.initialize();
  orchestrator.registerAgent(planningAgent);

  console.log('Adding frontend agent...');
  const frontendAgent = new FrontendDevAgent();
  await frontendAgent.initialize();
  orchestrator.registerAgent(frontendAgent);

  console.log('Current swarm size:', orchestrator.getSwarmMetrics().totalAgents, '\n');

  // Add more agents
  console.log('Scaling up swarm...');
  const backendAgent = new BackendDevAgent();
  await backendAgent.initialize();
  orchestrator.registerAgent(backendAgent);

  const testingAgent = new TestingAgent();
  await testingAgent.initialize();
  orchestrator.registerAgent(testingAgent);

  console.log('Final swarm size:', orchestrator.getSwarmMetrics().totalAgents);
  console.log('Final metrics:', orchestrator.getSwarmMetrics());
}

/**
 * Example 3: Multiple Swarm Orchestrators
 */
export async function multipleSwarmExample() {
  console.log('\n\n=== Multiple Swarm Orchestrators Example ===\n');

  // Create specialized swarms for different purposes

  // Swarm 1: Frontend-focused
  console.log('Creating frontend-focused swarm...');
  const frontendSwarm = new SwarmIntelligenceOrchestrator();
  const planningAgent1 = new ProjectPlanningAgent();
  const frontendAgent1 = new FrontendDevAgent();
  const testingAgent1 = new TestingAgent();

  await Promise.all([
    planningAgent1.initialize(),
    frontendAgent1.initialize(),
    testingAgent1.initialize(),
  ]);

  frontendSwarm.registerAgent(planningAgent1);
  frontendSwarm.registerAgent(frontendAgent1);
  frontendSwarm.registerAgent(testingAgent1);

  console.log('Frontend swarm metrics:', frontendSwarm.getSwarmMetrics());

  // Swarm 2: Backend-focused
  console.log('\nCreating backend-focused swarm...');
  const backendSwarm = new SwarmIntelligenceOrchestrator();
  const planningAgent2 = new ProjectPlanningAgent();
  const backendAgent2 = new BackendDevAgent();
  const testingAgent2 = new TestingAgent();

  await Promise.all([
    planningAgent2.initialize(),
    backendAgent2.initialize(),
    testingAgent2.initialize(),
  ]);

  backendSwarm.registerAgent(planningAgent2);
  backendSwarm.registerAgent(backendAgent2);
  backendSwarm.registerAgent(testingAgent2);

  console.log('Backend swarm metrics:', backendSwarm.getSwarmMetrics());

  console.log('\nBoth swarms are operating independently!');
}

/**
 * Example 4: Monitoring Swarm Evolution
 */
export async function swarmEvolutionExample() {
  console.log('\n\n=== Swarm Evolution Example ===\n');

  const orchestrator = new SwarmIntelligenceOrchestrator();

  // Register agents
  const agents = [
    new ProjectPlanningAgent(),
    new FrontendDevAgent(),
    new BackendDevAgent(),
    new TestingAgent(),
  ];

  await Promise.all(agents.map((agent) => agent.initialize()));
  agents.forEach((agent) => orchestrator.registerAgent(agent));

  console.log('Initial state:', orchestrator.getSwarmMetrics(), '\n');

  // Execute multiple tasks to see swarm evolution
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Task ${i} ---`);
    
    const requirements: ProjectRequirements = {
      name: `Project ${i}`,
      description: `Test project ${i}`,
      framework: 'react',
      features: ['feature-1', 'feature-2'],
    };

    const task: AgentTask = {
      id: `task-${i}`,
      type: 'orchestrator',
      payload: { requirements },
      priority: 10 - i,
      createdAt: Date.now(),
    };

    const result = await orchestrator.execute(task);
    
    if ('swarmMetrics' in result) {
      const swarmResult = result as SwarmOrchestrationResult;
      console.log('Emergence Level:', swarmResult.swarmMetrics.emergenceLevel.toFixed(2) + '%');
      console.log('Coherence:', swarmResult.swarmMetrics.coherence.toFixed(2) + '%');
    }

    const metrics = orchestrator.getSwarmMetrics();
    console.log('Avg Emergence Factor:', metrics.avgEmergenceFactor.toFixed(2));
    console.log('Avg Cognitive Load:', metrics.avgCognitiveLoad.toFixed(2));
    console.log('Total Communications:', metrics.totalCommunications);
  }

  console.log('\n\nFinal evolved state:', orchestrator.getSwarmMetrics());
  console.log('\nNotice how emergence factor and communication patterns evolve!');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await basicSwarmExample();
    await dynamicRegistrationExample();
    await multipleSwarmExample();
    await swarmEvolutionExample();
    
    console.log('\n\n=== All Examples Completed Successfully ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
