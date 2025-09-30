/**
 * Market Adaptive Agent
 * Monitors real-time market and competitor moves, assesses threats,
 * identifies opportunities, and generates adaptation strategies
 */

import { BaseAgent } from './base-agent';
import {
  AgentTask,
  AgentResult,
  RealTimeMarketData,
  CompetitiveIntelligence,
  AdaptationStrategy,
  ThreatAssessment,
  OpportunityInsight,
  MarketTrend,
  CompetitorProfile,
  CompetitorMove,
  StrategyAction,
  ResourceRequirement,
} from './types';

export class MarketAdaptiveAgent extends BaseAgent {
  private marketDataHistory: RealTimeMarketData[] = [];
  private competitiveIntelHistory: CompetitiveIntelligence[] = [];
  private adaptationHistory: AdaptationStrategy[] = [];
  private readonly maxHistorySize = 100;

  constructor() {
    super(
      'market-adaptive',
      'MarketAdaptiveAgent',
      [
        'market-monitoring',
        'competitive-analysis',
        'threat-assessment',
        'opportunity-identification',
        'strategy-generation',
        'real-time-adaptation',
      ],
      8 // High priority for strategic decision-making
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing market adaptation task: ${task.id}`);

    try {
      // Get or simulate market data
      const marketData = await this.getMarketData(task.payload);
      
      // Get or simulate competitive intelligence
      const competitiveIntel = await this.getCompetitiveIntelligence(task.payload);
      
      // Store in history
      this.updateHistory(marketData, competitiveIntel);
      
      // Perform comprehensive analysis
      const threats = await this.assessThreats(marketData, competitiveIntel);
      const opportunities = await this.identifyOpportunities(marketData, competitiveIntel);
      
      // Generate adaptation strategy
      const strategy = await this.generateAdaptationStrategy(
        marketData,
        competitiveIntel,
        threats,
        opportunities
      );
      
      // Store strategy in history
      this.adaptationHistory.push(strategy);
      if (this.adaptationHistory.length > this.maxHistorySize) {
        this.adaptationHistory.shift();
      }

      return {
        success: true,
        data: {
          marketData,
          competitiveIntel,
          threats,
          opportunities,
          strategy,
          analysis: this.generateAnalysisSummary(threats, opportunities, strategy),
        },
        metadata: {
          duration: 0, // Will be set by base class
          confidence: this.calculateConfidence(threats, opportunities),
          suggestions: this.generateActionSuggestions(strategy),
        },
        nextSteps: [
          'Review and validate strategy actions',
          'Allocate resources for high-priority actions',
          'Monitor competitor responses',
          'Track strategy execution metrics',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate market adaptation strategy',
      };
    }
  }

  /**
   * Get or simulate real-time market data
   */
  private async getMarketData(payload: Record<string, unknown>): Promise<RealTimeMarketData> {
    // In production, this would fetch from real market data APIs
    // For now, we return structured stub data or use provided data
    
    if (payload.marketData) {
      return payload.marketData as RealTimeMarketData;
    }

    return this.simulateMarketData();
  }

  /**
   * Get or simulate competitive intelligence
   */
  private async getCompetitiveIntelligence(payload: Record<string, unknown>): Promise<CompetitiveIntelligence> {
    // In production, this would fetch from competitive intelligence sources
    // For now, we return structured stub data or use provided data
    
    if (payload.competitiveIntel) {
      return payload.competitiveIntel as CompetitiveIntelligence;
    }

    return this.simulateCompetitiveIntelligence();
  }

  /**
   * Assess threats from market data and competitive intelligence
   */
  private async assessThreats(
    marketData: RealTimeMarketData,
    competitiveIntel: CompetitiveIntelligence
  ): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];

    // Analyze high-impact competitor moves
    competitiveIntel.competitors.forEach((competitor) => {
      competitor.recentMoves
        .filter((move) => move.responseRequired && move.impact !== 'low')
        .forEach((move) => {
          threats.push({
            id: `threat-${competitor.id}-${move.type}-${Date.now()}`,
            type: 'competitive',
            description: `${competitor.name}: ${move.description}`,
            severity: move.impact === 'critical' ? 'critical' : move.impact === 'high' ? 'high' : 'medium',
            probability: 0.7 + (move.impact === 'critical' ? 0.2 : 0),
            timeframe: 'immediate',
            mitigationStrategies: this.generateMitigationStrategies(move, competitor),
          });
        });
    });

    // Analyze market trends for threats
    marketData.marketTrends
      .filter((trend) => trend.velocity === 'rapid' || trend.impact === 'critical')
      .forEach((trend) => {
        if (this.isThreat(trend)) {
          threats.push({
            id: `threat-trend-${trend.id}`,
            type: 'technological',
            description: `Disruptive trend: ${trend.description}`,
            severity: trend.impact,
            probability: trend.confidence,
            timeframe: trend.velocity === 'rapid' ? 'immediate' : 'short-term',
            mitigationStrategies: [
              'Accelerate innovation pipeline',
              'Form strategic partnerships',
              'Invest in R&D',
            ],
          });
        }
      });

    // Analyze economic indicators for threats
    if (marketData.economicIndicators.inflationRate > 5) {
      threats.push({
        id: `threat-economic-inflation`,
        type: 'economic',
        description: 'High inflation impacting costs and consumer spending',
        severity: 'medium',
        probability: 0.8,
        timeframe: 'short-term',
        mitigationStrategies: [
          'Optimize cost structure',
          'Review pricing strategy',
          'Diversify supplier base',
        ],
      });
    }

    return threats.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Identify opportunities from market data and competitive intelligence
   */
  private async identifyOpportunities(
    marketData: RealTimeMarketData,
    competitiveIntel: CompetitiveIntelligence
  ): Promise<OpportunityInsight[]> {
    const opportunities: OpportunityInsight[] = [];

    // Analyze market trends for opportunities
    marketData.marketTrends
      .filter((trend) => trend.impact !== 'low')
      .forEach((trend) => {
        if (!this.isThreat(trend)) {
          opportunities.push({
            id: `opp-trend-${trend.id}`,
            type: 'emerging-trend',
            description: `Capitalize on: ${trend.description}`,
            potential: trend.impact === 'critical' ? 'transformative' : trend.impact === 'high' ? 'high' : 'medium',
            confidence: trend.confidence,
            timeWindow: this.calculateTimeWindow(trend.velocity),
            requirements: [
              'Market research validation',
              'Product development capacity',
              'Go-to-market strategy',
            ],
          });
        }
      });

    // Analyze competitor weaknesses
    competitiveIntel.competitors.forEach((competitor) => {
      if (competitor.weaknesses.length > 0) {
        opportunities.push({
          id: `opp-competitor-${competitor.id}`,
          type: 'competitor-weakness',
          description: `Exploit ${competitor.name} weaknesses: ${competitor.weaknesses.join(', ')}`,
          potential: competitor.marketShare > 20 ? 'high' : 'medium',
          confidence: 0.75,
          timeWindow: '3-6 months',
          requirements: [
            'Competitive positioning strategy',
            'Marketing campaign',
            'Product differentiation',
          ],
        });
      }
    });

    // Analyze market gaps
    if (competitiveIntel.marketPositioning.vulnerabilities.length > 0) {
      opportunities.push({
        id: `opp-market-gap`,
        type: 'market-gap',
        description: 'Fill gaps in current market positioning',
        potential: 'medium',
        confidence: 0.7,
        timeWindow: '6-12 months',
        requirements: [
          'Gap analysis validation',
          'Strategic repositioning',
          'Resource allocation',
        ],
      });
    }

    // Analyze consumer behavior shifts
    if (marketData.consumerBehavior.adoptionRate > 0.6) {
      opportunities.push({
        id: `opp-consumer-adoption`,
        type: 'emerging-trend',
        description: 'High consumer adoption rate indicates market readiness',
        potential: 'high',
        confidence: marketData.consumerBehavior.adoptionRate,
        timeWindow: 'Immediate',
        requirements: [
          'Scale infrastructure',
          'Customer acquisition strategy',
          'Support capacity expansion',
        ],
      });
    }

    return opportunities.sort((a, b) => {
      const potentialOrder = { transformative: 4, high: 3, medium: 2, low: 1 };
      return potentialOrder[b.potential] - potentialOrder[a.potential];
    });
  }

  /**
   * Generate comprehensive adaptation strategy
   */
  private async generateAdaptationStrategy(
    marketData: RealTimeMarketData,
    competitiveIntel: CompetitiveIntelligence,
    threats: ThreatAssessment[],
    opportunities: OpportunityInsight[]
  ): Promise<AdaptationStrategy> {
    const actions: StrategyAction[] = [];
    const resources: ResourceRequirement[] = [];

    // Generate defensive actions for critical threats
    const criticalThreats = threats.filter((t) => t.severity === 'critical' || t.severity === 'high');
    criticalThreats.forEach((threat, index) => {
      actions.push({
        id: `action-defensive-${threat.id}`,
        type: 'defensive',
        description: `Mitigate ${threat.type} threat: ${threat.description}`,
        priority: 10 - index,
        dependencies: [],
        estimatedEffort: threat.severity === 'critical' ? '2-4 weeks' : '4-8 weeks',
        successCriteria: threat.mitigationStrategies.slice(0, 2),
      });

      resources.push({
        type: 'operational',
        description: `Resources for threat mitigation: ${threat.type}`,
        quantity: threat.severity === 'critical' ? 'High' : 'Medium',
        urgency: threat.timeframe === 'immediate' ? 'critical' : 'high',
      });
    });

    // Generate offensive actions for high-potential opportunities
    const topOpportunities = opportunities.filter((o) => o.potential === 'transformative' || o.potential === 'high');
    topOpportunities.forEach((opp, index) => {
      actions.push({
        id: `action-offensive-${opp.id}`,
        type: 'offensive',
        description: `Pursue opportunity: ${opp.description}`,
        priority: 7 - index,
        dependencies: [],
        estimatedEffort: opp.timeWindow,
        successCriteria: opp.requirements.slice(0, 2),
      });

      resources.push({
        type: 'human',
        description: `Team for opportunity execution: ${opp.type}`,
        quantity: opp.potential === 'transformative' ? 'High' : 'Medium',
        urgency: 'medium',
      });
    });

    // Generate exploratory actions for emerging trends
    const emergingTrends = marketData.marketTrends.filter(
      (t) => t.velocity === 'fast' || t.velocity === 'rapid'
    );
    if (emergingTrends.length > 0) {
      actions.push({
        id: 'action-exploratory-trends',
        type: 'exploratory',
        description: `Research and validate emerging trends: ${emergingTrends.map((t) => t.category).join(', ')}`,
        priority: 5,
        dependencies: [],
        estimatedEffort: '4-6 weeks',
        successCriteria: ['Trend validation report', 'Feasibility assessment', 'Pilot project proposal'],
      });

      resources.push({
        type: 'financial',
        description: 'R&D budget for trend exploration',
        quantity: 'Medium',
        urgency: 'medium',
      });
    }

    // Generate consolidation actions if needed
    if (competitiveIntel.marketPositioning.vulnerabilities.length > 2) {
      actions.push({
        id: 'action-consolidation',
        type: 'consolidation',
        description: 'Strengthen core competencies and reduce vulnerabilities',
        priority: 6,
        dependencies: [],
        estimatedEffort: '8-12 weeks',
        successCriteria: [
          'Vulnerability reduction by 50%',
          'Core product improvements',
          'Customer satisfaction increase',
        ],
      });
    }

    const strategyPriority = criticalThreats.length > 0 ? 'critical' : topOpportunities.length > 0 ? 'high' : 'medium';

    return {
      id: `strategy-${Date.now()}`,
      timestamp: Date.now(),
      objectives: [
        `Mitigate ${criticalThreats.length} critical threats`,
        `Capitalize on ${topOpportunities.length} high-value opportunities`,
        'Maintain competitive advantage',
        'Adapt to market dynamics',
      ],
      actions,
      expectedOutcomes: [
        'Reduced threat exposure',
        'Improved market positioning',
        'Revenue growth from new opportunities',
        'Enhanced competitive resilience',
      ],
      risks: [
        'Resource constraints may delay execution',
        'Market conditions may change faster than adaptation',
        'Competitor counter-moves may neutralize advantages',
      ],
      timeframe: '3-6 months',
      priority: strategyPriority,
      resources,
    };
  }

  /**
   * Update history with latest data
   */
  private updateHistory(marketData: RealTimeMarketData, competitiveIntel: CompetitiveIntelligence): void {
    this.marketDataHistory.push(marketData);
    this.competitiveIntelHistory.push(competitiveIntel);

    // Keep history size manageable
    if (this.marketDataHistory.length > this.maxHistorySize) {
      this.marketDataHistory.shift();
    }
    if (this.competitiveIntelHistory.length > this.maxHistorySize) {
      this.competitiveIntelHistory.shift();
    }
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(
    threats: ThreatAssessment[],
    opportunities: OpportunityInsight[],
    strategy: AdaptationStrategy
  ): string {
    const criticalThreats = threats.filter((t) => t.severity === 'critical').length;
    const highOpportunities = opportunities.filter((o) => o.potential === 'high' || o.potential === 'transformative').length;
    
    return `Market Analysis: Identified ${threats.length} threats (${criticalThreats} critical) and ${opportunities.length} opportunities (${highOpportunities} high-value). Generated ${strategy.actions.length} strategic actions with ${strategy.priority} priority.`;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(threats: ThreatAssessment[], opportunities: OpportunityInsight[]): number {
    const threatConfidence = threats.length > 0 
      ? threats.reduce((sum, t) => sum + t.probability, 0) / threats.length 
      : 0.5;
    
    const oppConfidence = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length
      : 0.5;
    
    return (threatConfidence + oppConfidence) / 2;
  }

  /**
   * Generate action suggestions
   */
  private generateActionSuggestions(strategy: AdaptationStrategy): string[] {
    const suggestions: string[] = [];
    
    const defensiveActions = strategy.actions.filter((a) => a.type === 'defensive').length;
    const offensiveActions = strategy.actions.filter((a) => a.type === 'offensive').length;
    
    if (defensiveActions > offensiveActions) {
      suggestions.push('Consider balancing defensive actions with more offensive opportunities');
    }
    
    if (strategy.actions.length > 10) {
      suggestions.push('Strategy has many actions - consider prioritizing top 5 for immediate execution');
    }
    
    const highPriorityActions = strategy.actions.filter((a) => a.priority >= 7).length;
    if (highPriorityActions > 0) {
      suggestions.push(`Focus resources on ${highPriorityActions} high-priority actions first`);
    }
    
    return suggestions;
  }

  /**
   * Determine if a trend is a threat
   */
  private isThreat(trend: MarketTrend): boolean {
    // Simple heuristic: trends in certain categories may be threats
    const threatKeywords = ['disruption', 'decline', 'challenge', 'risk', 'threat', 'competition'];
    const description = trend.description.toLowerCase();
    return threatKeywords.some((keyword) => description.includes(keyword));
  }

  /**
   * Calculate time window based on velocity
   */
  private calculateTimeWindow(velocity: string): string {
    switch (velocity) {
      case 'rapid':
        return 'Immediate - 1 month';
      case 'fast':
        return '1-3 months';
      case 'moderate':
        return '3-6 months';
      case 'slow':
        return '6-12 months';
      default:
        return '3-6 months';
    }
  }

  /**
   * Generate mitigation strategies for competitor moves
   */
  private generateMitigationStrategies(move: CompetitorMove, competitor: CompetitorProfile): string[] {
    const strategies: string[] = [];
    
    switch (move.type) {
      case 'product-launch':
        strategies.push('Accelerate competing product development');
        strategies.push('Highlight our differentiators in marketing');
        strategies.push('Consider strategic pricing adjustments');
        break;
      case 'pricing-change':
        strategies.push('Analyze value proposition vs. price');
        strategies.push('Consider matching or differentiation strategy');
        strategies.push('Enhance customer retention programs');
        break;
      case 'partnership':
        strategies.push('Explore similar or complementary partnerships');
        strategies.push('Strengthen existing partnerships');
        strategies.push('Build direct capabilities to reduce dependency');
        break;
      case 'acquisition':
        strategies.push('Assess impact on competitive landscape');
        strategies.push('Consider strategic M&A opportunities');
        strategies.push('Reinforce customer relationships');
        break;
      case 'expansion':
        strategies.push('Evaluate geographic expansion opportunities');
        strategies.push('Strengthen presence in key markets');
        strategies.push('Form local partnerships');
        break;
      case 'pivot':
        strategies.push('Monitor new direction closely');
        strategies.push('Reassess competitive positioning');
        strategies.push('Identify new differentiation opportunities');
        break;
    }
    
    return strategies;
  }

  /**
   * Simulate market data (stub implementation for demo/testing)
   */
  private simulateMarketData(): RealTimeMarketData {
    return {
      timestamp: Date.now(),
      marketTrends: [
        {
          id: 'trend-1',
          category: 'AI Adoption',
          description: 'Rapid AI integration in enterprise workflows',
          velocity: 'rapid',
          impact: 'high',
          confidence: 0.85,
          source: 'Market Research',
        },
        {
          id: 'trend-2',
          category: 'Cloud Migration',
          description: 'Increased cloud-native application development',
          velocity: 'fast',
          impact: 'medium',
          confidence: 0.78,
          source: 'Industry Report',
        },
      ],
      industryMetrics: {
        growthRate: 12.5,
        marketSize: 500000000,
        competitorCount: 25,
        innovationIndex: 7.8,
        regulatoryChanges: ['Data Privacy Updates', 'AI Governance Framework'],
      },
      economicIndicators: {
        gdpGrowth: 2.5,
        inflationRate: 3.2,
        consumerConfidence: 65,
        investmentTrends: ['Green Tech', 'Digital Transformation'],
      },
      consumerBehavior: {
        preferenceShifts: ['Sustainability', 'Personalization', 'Self-Service'],
        adoptionRate: 0.72,
        purchasingPower: 75,
        demographicTrends: ['Gen-Z Growth', 'Remote Work Normalization'],
      },
    };
  }

  /**
   * Simulate competitive intelligence (stub implementation for demo/testing)
   */
  private simulateCompetitiveIntelligence(): CompetitiveIntelligence {
    return {
      timestamp: Date.now(),
      competitors: [
        {
          id: 'comp-1',
          name: 'TechRival Corp',
          marketShare: 28,
          strengths: ['Brand Recognition', 'Large Customer Base', 'R&D Budget'],
          weaknesses: ['Legacy Systems', 'Slow Innovation', 'Customer Support'],
          recentMoves: [
            {
              type: 'product-launch',
              description: 'New AI-powered analytics platform',
              timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
              impact: 'high',
              responseRequired: true,
            },
          ],
          strategy: 'Market leader focusing on enterprise customers',
        },
        {
          id: 'comp-2',
          name: 'InnovateTech',
          marketShare: 15,
          strengths: ['Innovative Features', 'Agile Development', 'Modern UI/UX'],
          weaknesses: ['Limited Market Reach', 'Smaller Budget', 'Scaling Challenges'],
          recentMoves: [
            {
              type: 'pricing-change',
              description: 'Aggressive pricing to gain market share',
              timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
              impact: 'medium',
              responseRequired: true,
            },
          ],
          strategy: 'Fast-follower with focus on SMB market',
        },
      ],
      marketPositioning: {
        currentRank: 3,
        differentiators: ['Superior Performance', 'Customer-Centric Design', 'Flexible Pricing'],
        vulnerabilities: ['Market Awareness', 'Sales Network', 'Enterprise Credibility'],
        competitiveAdvantages: ['Technical Innovation', 'Fast Time-to-Market', 'Customer Satisfaction'],
      },
      threats: [],
      opportunities: [],
    };
  }
}
