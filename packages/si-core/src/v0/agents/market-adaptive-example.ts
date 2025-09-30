/**
 * Example usage of the MarketAdaptiveAgent
 * Demonstrates how to use the agent for real-time market adaptation
 */

import { MarketAdaptiveAgent } from './market-adaptive-agent';
import {
  AgentTask,
  RealTimeMarketData,
  CompetitiveIntelligence,
  MarketTrend,
  CompetitorProfile,
} from './types';

/**
 * Example 1: Basic usage with simulated data
 */
export async function basicMarketAdaptationExample() {
  // Create the agent
  const agent = new MarketAdaptiveAgent();
  await agent.initialize();

  // Create a task with no payload - agent will use simulated data
  const task: AgentTask = {
    id: 'market-adapt-1',
    type: 'market-adaptive',
    payload: {},
    priority: 8,
    context: {
      projectId: 'saas-platform',
      userId: 'user-123',
      sessionId: 'session-456',
    },
    createdAt: Date.now(),
  };

  console.log('Starting market adaptation analysis...');
  const result = await agent.execute(task);

  if (result.success && result.data) {
    const data = result.data as any;
    console.log('\n=== Market Adaptation Analysis Complete ===');
    console.log('\nAnalysis Summary:', data.analysis);
    console.log('\nThreats Identified:', data.threats.length);
    console.log('\nOpportunities Identified:', data.opportunities.length);
    console.log('\nStrategy Actions:', data.strategy.actions.length);
    console.log('\nNext Steps:', result.nextSteps);
    console.log('\nConfidence Score:', result.metadata?.confidence);
  } else {
    console.error('Market adaptation failed:', result.error);
  }

  return result;
}

/**
 * Example 2: Advanced usage with custom market data
 */
export async function advancedMarketAdaptationExample() {
  const agent = new MarketAdaptiveAgent();
  await agent.initialize();

  // Provide custom market data
  const customMarketData: RealTimeMarketData = {
    timestamp: Date.now(),
    marketTrends: [
      {
        id: 'trend-custom-1',
        category: 'AI/ML Integration',
        description: 'Rapid adoption of AI-powered automation across industries',
        velocity: 'rapid',
        impact: 'critical',
        confidence: 0.92,
        source: 'Industry Research',
      },
      {
        id: 'trend-custom-2',
        category: 'Sustainability',
        description: 'Growing demand for eco-friendly and sustainable solutions',
        velocity: 'fast',
        impact: 'high',
        confidence: 0.85,
        source: 'Consumer Surveys',
      },
      {
        id: 'trend-custom-3',
        category: 'Market Competition',
        description: 'Increased competition leading to pricing pressure',
        velocity: 'moderate',
        impact: 'high',
        confidence: 0.78,
        source: 'Market Analysis',
      },
    ],
    industryMetrics: {
      growthRate: 15.8,
      marketSize: 750000000,
      competitorCount: 42,
      innovationIndex: 8.5,
      regulatoryChanges: ['AI Ethics Guidelines', 'Data Sovereignty Laws'],
    },
    economicIndicators: {
      gdpGrowth: 3.1,
      inflationRate: 4.5,
      consumerConfidence: 68,
      investmentTrends: ['AI/ML', 'Climate Tech', 'Digital Health'],
    },
    consumerBehavior: {
      preferenceShifts: ['AI-powered features', 'Privacy-first solutions', 'Mobile-first'],
      adoptionRate: 0.81,
      purchasingPower: 72,
      demographicTrends: ['Millennial dominance', 'Remote-first culture'],
    },
  };

  // Provide custom competitive intelligence
  const customCompetitiveIntel: CompetitiveIntelligence = {
    timestamp: Date.now(),
    competitors: [
      {
        id: 'comp-alpha',
        name: 'Alpha Corp',
        marketShare: 35,
        strengths: ['Market Leader', 'Brand Trust', 'Enterprise Focus'],
        weaknesses: ['Slow Innovation Cycle', 'High Prices', 'Complex UX'],
        recentMoves: [
          {
            type: 'acquisition',
            description: 'Acquired AI startup for $50M to enhance capabilities',
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
            impact: 'critical',
            responseRequired: true,
          },
          {
            type: 'product-launch',
            description: 'Launched new enterprise tier with AI features',
            timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
            impact: 'high',
            responseRequired: true,
          },
        ],
        strategy: 'Consolidate market leadership through acquisitions and AI integration',
      },
      {
        id: 'comp-beta',
        name: 'Beta Solutions',
        marketShare: 18,
        strengths: ['Innovative Features', 'Modern Stack', 'Developer-Friendly'],
        weaknesses: ['Limited Enterprise Presence', 'Support Gaps', 'Scaling Issues'],
        recentMoves: [
          {
            type: 'partnership',
            description: 'Partnership with major cloud provider announced',
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            impact: 'medium',
            responseRequired: true,
          },
          {
            type: 'pricing-change',
            description: 'Reduced pricing by 20% to gain market share',
            timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
            impact: 'high',
            responseRequired: true,
          },
        ],
        strategy: 'Aggressive growth through competitive pricing and partnerships',
      },
      {
        id: 'comp-gamma',
        name: 'Gamma Technologies',
        marketShare: 12,
        strengths: ['Vertical Specialization', 'Strong ROI', 'Customer Success'],
        weaknesses: ['Narrow Market Focus', 'Limited Features', 'Small Team'],
        recentMoves: [
          {
            type: 'expansion',
            description: 'Expanding to new geographic markets in APAC',
            timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
            impact: 'medium',
            responseRequired: false,
          },
        ],
        strategy: 'Vertical specialization with geographic expansion',
      },
    ],
    marketPositioning: {
      currentRank: 4,
      differentiators: ['AI-First Approach', 'Superior UX', 'Rapid Innovation'],
      vulnerabilities: ['Brand Awareness', 'Enterprise Credibility', 'Limited Budget'],
      competitiveAdvantages: ['Technology Stack', 'Customer Experience', 'Agility'],
    },
    threats: [],
    opportunities: [],
  };

  // Create task with custom data
  const task: AgentTask = {
    id: 'market-adapt-advanced',
    type: 'market-adaptive',
    payload: {
      marketData: customMarketData,
      competitiveIntel: customCompetitiveIntel,
    },
    priority: 10,
    context: {
      projectId: 'enterprise-saas',
      userId: 'admin-001',
      sessionId: 'session-strategic',
    },
    createdAt: Date.now(),
  };

  console.log('\n=== Advanced Market Adaptation Analysis ===');
  console.log('Analyzing custom market data and competitive intelligence...\n');

  const result = await agent.execute(task);

  if (result.success && result.data) {
    const data = result.data as any;
    console.log('\n=== Detailed Results ===');
    
    console.log('\n--- Threats Identified ---');
    data.threats.forEach((threat: any, index: number) => {
      console.log(`\n${index + 1}. ${threat.description}`);
      console.log(`   Type: ${threat.type}`);
      console.log(`   Severity: ${threat.severity}`);
      console.log(`   Probability: ${(threat.probability * 100).toFixed(0)}%`);
      console.log(`   Timeframe: ${threat.timeframe}`);
      console.log(`   Mitigation: ${threat.mitigationStrategies.slice(0, 2).join(', ')}`);
    });

    console.log('\n--- Opportunities Identified ---');
    data.opportunities.forEach((opp: any, index: number) => {
      console.log(`\n${index + 1}. ${opp.description}`);
      console.log(`   Type: ${opp.type}`);
      console.log(`   Potential: ${opp.potential}`);
      console.log(`   Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
      console.log(`   Time Window: ${opp.timeWindow}`);
    });

    console.log('\n--- Adaptation Strategy ---');
    console.log(`Strategy ID: ${data.strategy.id}`);
    console.log(`Priority: ${data.strategy.priority}`);
    console.log(`Timeframe: ${data.strategy.timeframe}`);
    console.log('\nObjectives:');
    data.strategy.objectives.forEach((obj: string) => {
      console.log(`  - ${obj}`);
    });

    console.log('\nTop Priority Actions:');
    data.strategy.actions
      .sort((a: any, b: any) => b.priority - a.priority)
      .slice(0, 5)
      .forEach((action: any, index: number) => {
        console.log(`\n  ${index + 1}. ${action.description}`);
        console.log(`     Type: ${action.type}`);
        console.log(`     Priority: ${action.priority}`);
        console.log(`     Effort: ${action.estimatedEffort}`);
      });

    console.log('\nResource Requirements:');
    data.strategy.resources.forEach((resource: any) => {
      console.log(`  - ${resource.type}: ${resource.description} (${resource.quantity}, urgency: ${resource.urgency})`);
    });

    console.log('\n--- Metadata ---');
    console.log(`Confidence: ${(result.metadata?.confidence! * 100).toFixed(1)}%`);
    console.log(`Analysis Duration: ${result.metadata?.duration}ms`);
    
    if (result.metadata?.suggestions && result.metadata.suggestions.length > 0) {
      console.log('\nSuggestions:');
      result.metadata.suggestions.forEach((suggestion: string) => {
        console.log(`  - ${suggestion}`);
      });
    }

    console.log('\nNext Steps:');
    result.nextSteps?.forEach((step) => {
      console.log(`  - ${step}`);
    });
  } else {
    console.error('Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example 3: Continuous monitoring simulation
 */
export async function continuousMonitoringExample() {
  const agent = new MarketAdaptiveAgent();
  await agent.initialize();

  console.log('\n=== Continuous Market Monitoring Simulation ===');
  console.log('Running 3 cycles of market analysis...\n');

  const results = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`--- Cycle ${i} ---`);
    
    const task: AgentTask = {
      id: `market-monitor-${i}`,
      type: 'market-adaptive',
      payload: {},
      priority: 8,
      createdAt: Date.now(),
    };

    const result = await agent.execute(task);

    if (result.success && result.data) {
      const data = result.data as any;
      console.log(`Threats: ${data.threats.length}`);
      console.log(`Opportunities: ${data.opportunities.length}`);
      console.log(`Strategy Priority: ${data.strategy.priority}`);
      console.log(`Actions Generated: ${data.strategy.actions.length}`);
    }

    results.push(result);

    // Check agent health
    const status = agent.getStatus();
    console.log(`Agent Health: ${status.health}`);
    console.log(`Completed Tasks: ${status.completedTasks}\n`);

    // Simulate time passing
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('=== Monitoring Complete ===');
  console.log(`Total cycles: ${results.length}`);
  console.log(`Successful analyses: ${results.filter((r) => r.success).length}`);

  return results;
}

/**
 * Example 4: Integration with orchestrator pattern
 */
export async function orchestratorIntegrationExample() {
  console.log('\n=== Orchestrator Integration Example ===');
  console.log('Demonstrating how MarketAdaptiveAgent integrates with orchestrator\n');

  const agent = new MarketAdaptiveAgent();
  await agent.initialize();

  // Simulate orchestrator creating task
  const orchestratorTask: AgentTask = {
    id: 'orchestrator-market-1',
    type: 'market-adaptive',
    payload: {
      // Orchestrator might pass context from other agents
      projectContext: 'enterprise-product-launch',
      previousResults: {
        planningPhaseComplete: true,
        marketResearchPhase: 'in-progress',
      },
    },
    priority: 9,
    context: {
      projectId: 'prod-launch-2024',
      userId: 'orchestrator',
      sessionId: 'orch-session-1',
      sharedState: {
        launchTimeline: '3 months',
        targetMarket: 'enterprise-saas',
        budget: 'high',
      },
    },
    createdAt: Date.now(),
  };

  console.log('Orchestrator delegating market analysis task to MarketAdaptiveAgent...');

  const result = await agent.execute(orchestratorTask);

  if (result.success && result.data) {
    const data = result.data as any;
    console.log('\n✓ Task completed successfully');
    console.log('Orchestrator can now use the results for:');
    console.log('  - Informing planning agent about market conditions');
    console.log('  - Guiding UI/UX design based on competitive analysis');
    console.log('  - Adjusting timeline based on threat assessment');
    console.log('  - Prioritizing features based on opportunities');
    
    console.log('\nResult data structure:');
    console.log(`  - marketData: ${data.marketData ? 'Available' : 'N/A'}`);
    console.log(`  - competitiveIntel: ${data.competitiveIntel ? 'Available' : 'N/A'}`);
    console.log(`  - threats: ${data.threats.length} items`);
    console.log(`  - opportunities: ${data.opportunities.length} items`);
    console.log(`  - strategy: ${data.strategy.actions.length} actions`);
    
    console.log('\nOrchestrator next steps:', result.nextSteps);
  }

  return result;
}

// Export all examples
export const examples = {
  basic: basicMarketAdaptationExample,
  advanced: advancedMarketAdaptationExample,
  continuous: continuousMonitoringExample,
  orchestrator: orchestratorIntegrationExample,
};
