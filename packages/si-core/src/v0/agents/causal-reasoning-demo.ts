/**
 * Demonstration script for CausalReasoningAgent
 * Shows basic usage and capabilities
 */

import { CausalReasoningAgent } from './causal-reasoning-agent';
import { AgentTask } from './types';

/**
 * Demo 1: Build and explore a marketing causal model
 */
async function demoMarketingModel() {
  console.log('\n=== Demo 1: Marketing Causal Model ===\n');
  
  const agent = new CausalReasoningAgent();
  await agent.initialize();

  // Build model
  const buildTask: AgentTask = {
    id: 'demo-build-1',
    type: 'planning',
    payload: {
      action: 'build-model',
      payload: {
        graphId: 'demo-marketing',
        domain: 'marketing',
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const buildResult = await agent.execute(buildTask);
  
  if (buildResult.success) {
    console.log('✓ Marketing model created successfully');
    console.log('Model details:');
    const data = buildResult.data as any;
    console.log(`  - Nodes: ${data.nodes?.length || 0}`);
    console.log(`  - Edges: ${data.edges?.length || 0}`);
    console.log('\nInsights:');
    data.insights?.forEach((insight: string) => console.log(`  • ${insight}`));
  } else {
    console.error('✗ Failed to build model:', buildResult.error);
  }

  return buildResult;
}

/**
 * Demo 2: Predict intervention effect
 */
async function demoPredictIntervention() {
  console.log('\n=== Demo 2: Predict Intervention Effect ===\n');
  
  const agent = new CausalReasoningAgent();
  await agent.initialize();

  // Build model first
  await agent.execute({
    id: 'demo-build-2',
    type: 'planning',
    payload: {
      action: 'build-model',
      payload: { graphId: 'demo-predict', domain: 'marketing' },
    },
    priority: 9,
    createdAt: Date.now(),
  });

  // Predict intervention
  const predictTask: AgentTask = {
    id: 'demo-predict-1',
    type: 'planning',
    payload: {
      action: 'predict-intervention',
      payload: {
        graphId: 'demo-predict',
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

  const result = await agent.execute(predictTask);
  
  if (result.success) {
    console.log('✓ Intervention effect predicted');
    const data = result.data as any;
    console.log('\nResults:');
    console.log(`  • Expected outcome: ${data.expectedOutcome?.toFixed(2) || 'N/A'}`);
    console.log(`  • Confidence: ${((data.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`  • Affected nodes: ${data.affectedNodes?.size || 0}`);
    console.log(`  • Causal pathways: ${data.causalPathways?.length || 0}`);
    
    if (data.warnings && data.warnings.length > 0) {
      console.log('\nWarnings:');
      data.warnings.forEach((warning: string) => console.log(`  ⚠ ${warning}`));
    }
  } else {
    console.error('✗ Failed to predict intervention:', result.error);
  }

  return result;
}

/**
 * Demo 3: Select optimal intervention
 */
async function demoOptimalSelection() {
  console.log('\n=== Demo 3: Select Optimal Intervention ===\n');
  
  const agent = new CausalReasoningAgent();
  await agent.initialize();

  // Build model
  await agent.execute({
    id: 'demo-build-3',
    type: 'planning',
    payload: {
      action: 'build-model',
      payload: { graphId: 'demo-optimal', domain: 'software' },
    },
    priority: 9,
    createdAt: Date.now(),
  });

  // Compare interventions
  const selectTask: AgentTask = {
    id: 'demo-select-1',
    type: 'planning',
    payload: {
      action: 'select-optimal',
      payload: {
        graphId: 'demo-optimal',
        targetNode: 'bugs',
        interventions: [
          {
            targetNode: 'code_review',
            value: 1,
            type: 'do',
            description: 'Implement code review',
          },
          {
            targetNode: 'testing',
            value: 0.8,
            type: 'do',
            description: 'Increase test coverage to 80%',
          },
          {
            targetNode: 'testing',
            value: 0.95,
            type: 'do',
            description: 'Increase test coverage to 95%',
          },
        ],
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const result = await agent.execute(selectTask);
  
  if (result.success) {
    console.log('✓ Optimal intervention selected');
    const data = result.data as any;
    console.log('\nOptimal Intervention:');
    console.log(`  • ${data.optimal?.intervention?.description || 'N/A'}`);
    console.log(`  • Expected outcome: ${data.optimal?.expectedOutcome?.toFixed(2) || 'N/A'}`);
    console.log(`  • Confidence: ${((data.optimal?.confidence || 0) * 100).toFixed(1)}%`);
    
    console.log('\nReasoning:');
    const reasoning = data.reasoning || 'No reasoning provided';
    reasoning.split('\n').forEach((line: string) => console.log(`  ${line}`));
    
    console.log('\nAll Options Ranked:');
    data.allResults?.forEach((r: any, i: number) => {
      console.log(`  ${i + 1}. ${r.intervention.description} (outcome: ${r.expectedOutcome.toFixed(2)})`);
    });
  } else {
    console.error('✗ Failed to select optimal intervention:', result.error);
  }

  return result;
}

/**
 * Demo 4: Custom causal model
 */
async function demoCustomModel() {
  console.log('\n=== Demo 4: Custom Causal Model ===\n');
  
  const agent = new CausalReasoningAgent();
  await agent.initialize();

  // Build custom model
  const buildTask: AgentTask = {
    id: 'demo-custom-1',
    type: 'planning',
    payload: {
      action: 'build-model',
      payload: {
        graphId: 'demo-custom',
        nodes: [
          { id: 'training', name: 'Employee Training', type: 'intervention' },
          { id: 'skills', name: 'Skill Level', type: 'observable' },
          { id: 'productivity', name: 'Productivity', type: 'observable' },
          { id: 'quality', name: 'Work Quality', type: 'observable' },
        ],
        edges: [
          { from: 'training', to: 'skills', strength: 0.8, type: 'direct', confidence: 0.9 },
          { from: 'skills', to: 'productivity', strength: 0.7, type: 'direct', confidence: 0.85 },
          { from: 'skills', to: 'quality', strength: 0.75, type: 'direct', confidence: 0.87 },
        ],
      },
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const result = await agent.execute(buildTask);
  
  if (result.success) {
    console.log('✓ Custom model created successfully');
    const data = result.data as any;
    console.log('\nModel structure:');
    console.log(`  • Nodes: ${data.nodes?.length || 0}`);
    data.nodes?.forEach((node: any) => {
      console.log(`    - ${node.name} (${node.type})`);
    });
    console.log(`  • Edges: ${data.edges?.length || 0}`);
    data.edges?.forEach((edge: any) => {
      const fromNode = data.nodes?.find((n: any) => n.id === edge.from);
      const toNode = data.nodes?.find((n: any) => n.id === edge.to);
      console.log(`    - ${fromNode?.name} → ${toNode?.name} (strength: ${edge.strength})`);
    });
  } else {
    console.error('✗ Failed to build custom model:', result.error);
  }

  return result;
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         CausalReasoningAgent Demonstration               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await demoMarketingModel();
    await demoPredictIntervention();
    await demoOptimalSelection();
    await demoCustomModel();
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         All Demos Completed Successfully!                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n✗ Demo failed with error:', error);
  }
}

// Export individual demos for selective testing
export {
  demoMarketingModel,
  demoPredictIntervention,
  demoOptimalSelection,
  demoCustomModel,
};

// Run demos if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllDemos().catch(console.error);
}
