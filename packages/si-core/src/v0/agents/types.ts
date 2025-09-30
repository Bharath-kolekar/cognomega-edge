/**
 * Core types and interfaces for the multi-agent AI system
 * Compatible with Cognomega's SuperIntelligence architecture
 */

import { TaskPayload, RoutingResult } from '../smart-ai-router';

// ============================================================================
// Project and Build Types (harmonized with existing systems)
// ============================================================================

export interface ProjectRequirements {
  name: string;
  description: string;
  framework?: string;
  features?: string[];
  constraints?: string[];
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'fullstack';
  techStack?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    devops?: string[];
  };
}

export interface ProjectPlan {
  id: string;
  requirements: ProjectRequirements;
  architecture: {
    frontend?: ArchitectureComponent;
    backend?: ArchitectureComponent;
    database?: DatabaseDesign;
    infrastructure?: InfrastructureConfig;
  };
  timeline: ProjectTimeline;
  tasks: ProjectTask[];
  risks: RiskAssessment[];
  created: number;
  lastModified: number;
}

export interface ArchitectureComponent {
  type: string;
  components: string[];
  dependencies: string[];
  patterns: string[];
  description: string;
}

export interface DatabaseDesign {
  type: string;
  schema: Record<string, SchemaDefinition>;
  relationships: RelationshipDefinition[];
  indexes: string[];
  migrations?: string[];
}

export interface SchemaDefinition {
  table: string;
  columns: ColumnDefinition[];
  constraints?: string[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string | number | boolean;
  primaryKey?: boolean;
  foreignKey?: string;
}

export interface RelationshipDefinition {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
}

export interface InfrastructureConfig {
  platform: string;
  services: string[];
  deployment: DeploymentConfig;
  monitoring?: MonitoringConfig;
  scaling?: ScalingConfig;
}

export interface DeploymentConfig {
  type: 'container' | 'serverless' | 'vm' | 'hybrid';
  environment: 'development' | 'staging' | 'production';
  regions?: string[];
  config: Record<string, unknown>;
}

export interface MonitoringConfig {
  metrics: string[];
  logging: boolean;
  alerting: boolean;
  healthChecks: string[];
}

export interface ScalingConfig {
  auto: boolean;
  minInstances: number;
  maxInstances: number;
  metrics: string[];
}

export interface ProjectTimeline {
  start: number;
  estimatedEnd: number;
  milestones: Milestone[];
  phases: ProjectPhase[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  deadline: number;
  dependencies: string[];
  completed: boolean;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  startDate: number;
  endDate: number;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  dependencies: string[];
  estimatedEffort: number;
  actualEffort?: number;
  created: number;
  completed?: number;
}

export interface RiskAssessment {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation: string;
}

export interface BuildResult {
  success: boolean;
  artifacts?: BuildArtifact[];
  errors?: BuildError[];
  warnings?: BuildWarning[];
  logs?: string[];
  duration?: number;
  timestamp: number;
}

export interface BuildArtifact {
  name: string;
  type: 'component' | 'module' | 'api' | 'service' | 'config' | 'deployment';
  path: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface BuildError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'error' | 'critical';
  code?: string;
}

export interface BuildWarning {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
}

// ============================================================================
// Agent System Types
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  priority: number;
  enabled: boolean;
  maxConcurrentTasks?: number;
}

export type AgentType =
  | 'planning'
  | 'ui-design'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'orchestrator'
  | 'market-adaptive';

export interface AgentTask {
  id: string;
  type: AgentType;
  payload: Record<string, unknown>;
  priority: number;
  context?: AgentContext;
  dependencies?: string[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentContext {
  projectId?: string;
  userId?: string;
  sessionId?: string;
  previousResults?: Record<string, unknown>;
  sharedState?: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: string;
  warnings?: string[];
  metadata?: {
    duration: number;
    tokensUsed?: number;
    confidence?: number;
    suggestions?: string[];
  };
  nextSteps?: string[];
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  payload: unknown;
  timestamp: number;
  correlationId?: string;
}

// ============================================================================
// Agent Interface
// ============================================================================

export interface IAgent {
  config: AgentConfig;
  
  /**
   * Initialize the agent with configuration
   */
  initialize(config?: Partial<AgentConfig>): Promise<void>;
  
  /**
   * Execute a task assigned to this agent
   */
  execute(task: AgentTask): Promise<AgentResult>;
  
  /**
   * Validate if the agent can handle this task
   */
  canHandle(task: AgentTask): boolean;
  
  /**
   * Get agent status and health information
   */
  getStatus(): AgentStatus;
  
  /**
   * Handle inter-agent communication
   */
  receiveMessage(message: AgentMessage): Promise<void>;
}

export interface AgentStatus {
  id: string;
  name: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime?: number;
  lastActivity?: number;
}

// ============================================================================
// Orchestrator Types
// ============================================================================

export interface OrchestrationPlan {
  id: string;
  projectId: string;
  tasks: AgentTask[];
  dependencies: TaskDependency[];
  executionOrder: string[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  created: number;
  started?: number;
  completed?: number;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  type: 'sequential' | 'parallel' | 'conditional';
  condition?: string;
}

export interface OrchestrationResult {
  planId: string;
  success: boolean;
  results: Map<string, AgentResult>;
  errors: Map<string, string>;
  duration: number;
  summary: string;
}

// ============================================================================
// Market Adaptive Agent Types
// ============================================================================

export interface RealTimeMarketData {
  timestamp: number;
  marketTrends: MarketTrend[];
  industryMetrics: IndustryMetrics;
  economicIndicators: EconomicIndicators;
  consumerBehavior: ConsumerBehavior;
}

export interface MarketTrend {
  id: string;
  category: string;
  description: string;
  velocity: 'slow' | 'moderate' | 'fast' | 'rapid';
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source: string;
}

export interface IndustryMetrics {
  growthRate: number;
  marketSize: number;
  competitorCount: number;
  innovationIndex: number;
  regulatoryChanges: string[];
}

export interface EconomicIndicators {
  gdpGrowth: number;
  inflationRate: number;
  consumerConfidence: number;
  investmentTrends: string[];
}

export interface ConsumerBehavior {
  preferenceShifts: string[];
  adoptionRate: number;
  purchasingPower: number;
  demographicTrends: string[];
}

export interface CompetitiveIntelligence {
  timestamp: number;
  competitors: CompetitorProfile[];
  marketPositioning: MarketPosition;
  threats: ThreatAssessment[];
  opportunities: OpportunityInsight[];
}

export interface CompetitorProfile {
  id: string;
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  recentMoves: CompetitorMove[];
  strategy: string;
}

export interface CompetitorMove {
  type: 'product-launch' | 'pricing-change' | 'partnership' | 'acquisition' | 'expansion' | 'pivot';
  description: string;
  timestamp: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  responseRequired: boolean;
}

export interface MarketPosition {
  currentRank: number;
  differentiators: string[];
  vulnerabilities: string[];
  competitiveAdvantages: string[];
}

export interface ThreatAssessment {
  id: string;
  type: 'competitive' | 'technological' | 'regulatory' | 'economic' | 'operational';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  mitigationStrategies: string[];
}

export interface OpportunityInsight {
  id: string;
  type: 'market-gap' | 'emerging-trend' | 'competitor-weakness' | 'technology-shift' | 'regulatory-change';
  description: string;
  potential: 'low' | 'medium' | 'high' | 'transformative';
  confidence: number;
  timeWindow: string;
  requirements: string[];
}

export interface AdaptationStrategy {
  id: string;
  timestamp: number;
  objectives: string[];
  actions: StrategyAction[];
  expectedOutcomes: string[];
  risks: string[];
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: ResourceRequirement[];
}

export interface StrategyAction {
  id: string;
  type: 'defensive' | 'offensive' | 'exploratory' | 'consolidation';
  description: string;
  priority: number;
  dependencies: string[];
  estimatedEffort: string;
  successCriteria: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'financial' | 'technological' | 'operational';
  description: string;
  quantity: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
