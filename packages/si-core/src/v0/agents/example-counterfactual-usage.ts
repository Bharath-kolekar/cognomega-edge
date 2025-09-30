/**
 * Example usage of the CounterfactualReasoner Agent
 * Demonstrates various counterfactual reasoning scenarios
 */

import { CounterfactualReasoner } from './counterfactual-reasoner';
import { AgentTask } from './types';

/**
 * Example 1: Analyzing a product decision
 */
export async function analyzeProductDecision() {
  const reasoner = new CounterfactualReasoner();
  await reasoner.initialize();

  const task: AgentTask = {
    id: 'cf-product-1',
    type: 'counterfactual-reasoning',
    payload: {
      situation: 'Launched new premium tier pricing at $99/month',
      decision: 'Introduced premium features behind paywall',
      outcome: 'Only 5% of users upgraded, below 15% target',
      context: {
        totalUsers: 10000,
        expectedRevenue: 150000,
        actualRevenue: 49500,
        timeframe: '3 months',
      },
      analysisDepth: 'deep',
    },
    priority: 9,
    createdAt: Date.now(),
  };

  const result = await reasoner.execute(task);
  
  if (result.success && result.data) {
    console.log('\n=== Product Decision Counterfactual Analysis ===');
    console.log(result.data.summary);
    console.log('\nKey Insights:');
    result.data.keyInsights.forEach((insight: string) => {
      console.log(`  - ${insight}`);
    });
  }

  return result;
}

/**
 * Example 2: Analyzing a marketing campaign
 */
export async function analyzeMarketingCampaign() {
  const reasoner = new CounterfactualReasoner();
  await reasoner.initialize();

  const task: AgentTask = {
    id: 'cf-marketing-1',
    type: 'counterfactual-reasoning',
    payload: {
      situation: 'Email marketing campaign sent to entire user base',
      decision: 'Sent promotional email with 50% discount offer',
      outcome: 'High unsubscribe rate (8%) but decent conversion (12%)',
      context: {
        emailsSent: 50000,
        unsubscribes: 4000,
        conversions: 6000,
        revenue: 180000,
      },
      variations: [
        'Segmented email campaign',
        'A/B tested subject lines',
        'Smaller discount with urgency',
      ],
      analysisDepth: 'medium',
    },
    priority: 7,
    createdAt: Date.now(),
  };

  const result = await reasoner.execute(task);
  
  if (result.success && result.data) {
    console.log('\n=== Marketing Campaign Counterfactual Analysis ===');
    console.log(result.data.summary);
    console.log(`\nAnalyzed ${result.data.totalScenarios} counterfactual scenarios`);
    console.log('\nSuggestions for future campaigns:');
    result.metadata?.suggestions?.forEach((suggestion: string) => {
      console.log(`  - ${suggestion}`);
    });
  }

  return result;
}

/**
 * Example 3: Analyzing a technical architecture decision
 */
export async function analyzeArchitectureDecision() {
  const reasoner = new CounterfactualReasoner();
  await reasoner.initialize();

  const task: AgentTask = {
    id: 'cf-tech-1',
    type: 'counterfactual-reasoning',
    payload: {
      situation: 'Migrated monolithic application to microservices',
      decision: 'Complete migration in one phase over 6 weeks',
      outcome: 'Extended downtime, customer complaints, but improved scalability',
      context: {
        teamSize: 8,
        duration: '6 weeks',
        incidentCount: 23,
        customerSatisfaction: 'decreased from 4.5 to 3.8',
        systemPerformance: 'improved by 40%',
      },
      variations: [
        'Phased migration with strangler pattern',
        'Hybrid architecture during transition',
      ],
      analysisDepth: 'deep',
    },
    priority: 8,
    createdAt: Date.now(),
  };

  const result = await reasoner.execute(task);
  
  if (result.success && result.data) {
    console.log('\n=== Architecture Decision Counterfactual Analysis ===');
    console.log(result.data.summary);
    
    if (result.data.scenarios) {
      console.log('\nCounterfactual Scenarios Generated:');
      result.data.scenarios.forEach((scenario: any, index: number) => {
        console.log(`\n${index + 1}. ${scenario.counterfactual.alteredCondition}`);
        console.log(`   Decision: ${scenario.counterfactual.hypotheticalDecision}`);
        console.log(`   Predicted Outcome: ${scenario.counterfactual.predictedOutcome}`);
        console.log(`   Confidence: ${(scenario.counterfactual.confidence * 100).toFixed(1)}%`);
      });
    }
  }

  return result;
}

/**
 * Example 4: Analyzing user onboarding changes
 */
export async function analyzeOnboardingChange() {
  const reasoner = new CounterfactualReasoner();
  await reasoner.initialize();

  const task: AgentTask = {
    id: 'cf-onboarding-1',
    type: 'counterfactual-reasoning',
    payload: {
      situation: 'User signup conversion rate dropped from 40% to 25%',
      decision: 'Added multi-step onboarding form with profile completion',
      outcome: 'Lower conversion but 30% higher user retention after 30 days',
      context: {
        timeframe: '2 weeks',
        users_affected: 5000,
        completionRate: 0.25,
        retentionImprovement: 0.30,
      },
      analysisDepth: 'medium',
    },
    priority: 8,
    createdAt: Date.now(),
  };

  const result = await reasoner.execute(task);
  
  if (result.success && result.data) {
    console.log('\n=== Onboarding Change Counterfactual Analysis ===');
    console.log(result.data.summary);
    
    if (result.data.learnings) {
      console.log('\nLearnings from Analysis:');
      result.data.learnings.forEach((learning: any) => {
        console.log(`\nScenario ${learning.scenarioId}:`);
        console.log(`  Patterns: ${learning.patterns.join(', ')}`);
        console.log(`  Causal Factors: ${learning.causalFactors.join(', ')}`);
        console.log(`  Applicability: ${(learning.applicability * 100).toFixed(1)}%`);
      });
    }
  }

  return result;
}

/**
 * Example 5: Querying stored scenarios
 */
export async function demonstrateScenarioQuerying() {
  const reasoner = new CounterfactualReasoner();
  await reasoner.initialize();

  // Generate some scenarios first
  await analyzeProductDecision();
  await analyzeMarketingCampaign();

  // Query by pattern
  console.log('\n=== Querying Stored Scenarios ===');
  const timingScenarios = reasoner.queryByPattern('timing');
  console.log(`Found ${timingScenarios.length} scenarios related to timing`);

  const communicationScenarios = reasoner.queryByPattern('communication');
  console.log(`Found ${communicationScenarios.length} scenarios related to communication`);

  // Get all learnings
  const allLearnings = reasoner.getStoredLearnings();
  console.log(`\nTotal learnings stored: ${allLearnings.length}`);

  // Extract patterns across all learnings
  const allPatterns = new Set(
    allLearnings.flatMap(learning => learning.patterns)
  );
  console.log(`\nUnique patterns identified: ${Array.from(allPatterns).join(', ')}`);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('Counterfactual Reasoner Agent - Example Usage');
  console.log('='.repeat(60));

  try {
    await analyzeProductDecision();
    await analyzeMarketingCampaign();
    await analyzeArchitectureDecision();
    await analyzeOnboardingChange();
    await demonstrateScenarioQuerying();

    console.log('\n' + '='.repeat(60));
    console.log('All examples completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export { CounterfactualReasoner } from './counterfactual-reasoner';
