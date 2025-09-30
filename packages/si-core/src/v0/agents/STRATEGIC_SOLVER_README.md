# StrategicSolverAgent

An adaptive problem-solving agent that intelligently selects and applies different strategies to solve complex problems, tracks performance, and continuously improves.

## Overview

The StrategicSolverAgent is part of Cognomega's multi-agent AI system. It provides:

- **Adaptive Strategy Selection**: Automatically chooses the best problem-solving approach
- **Performance Tracking**: Monitors strategy effectiveness over time
- **Multiple Built-in Strategies**: Decomposition, Heuristic, Analytical, and Creative approaches
- **Custom Strategy Support**: Register your own problem-solving strategies
- **Context-Aware**: Learns which strategies work best for different problem types

## Quick Start

```typescript
import { createStrategicSolver } from '@cognomega/si-core';

// Create and initialize the agent
const solver = createStrategicSolver();
await solver.initialize();

// Define a problem
const problem = {
  id: 'opt-001',
  description: 'Optimize API response time',
  type: 'optimization',
  complexity: 0.7,
  constraints: ['Must maintain backward compatibility'],
  knownPatterns: ['caching', 'indexing'],
};

// Create a task
const task = {
  id: 'task-001',
  type: 'planning',
  payload: { problem },
  priority: 8,
  createdAt: Date.now(),
};

// Execute and get solution
const result = await solver.execute(task);

if (result.success) {
  console.log('Strategy:', result.data.strategy.name);
  console.log('Solution:', result.data.solution);
  console.log('Confidence:', result.metadata.confidence);
}
```

## Built-in Strategies

### 1. Decomposition Strategy
**Best for**: Complex problems, planning, design, optimization

Breaks down complex problems into manageable sub-problems using hierarchical decomposition.

```typescript
{
  type: 'planning',
  complexity: 0.8, // High complexity triggers decomposition
}
```

### 2. Heuristic Strategy
**Best for**: Debugging, optimization, problems with known patterns

Applies known patterns and heuristics from similar past problems.

```typescript
{
  type: 'optimization',
  knownPatterns: ['caching', 'lazy-loading', 'batch-processing'],
}
```

### 3. Analytical Strategy
**Best for**: Debugging, root cause analysis

Performs systematic logical analysis to identify root causes.

```typescript
{
  type: 'debugging',
  constraints: ['Cannot restart production system'],
}
```

### 4. Creative Strategy
**Best for**: Design, novel solutions, innovation

Generates innovative solutions through creative thinking techniques like lateral thinking and analogy.

```typescript
{
  type: 'design',
  constraints: ['Must be different from competitors'],
}
```

## Problem Context

Define problems using the `ProblemContext` interface:

```typescript
interface ProblemContext {
  id: string;
  description: string;
  type: 'optimization' | 'design' | 'debugging' | 'planning' | 'analysis' | 'general';
  complexity: number; // 0-1 scale
  constraints: string[];
  knownPatterns?: string[];
  previousAttempts?: StrategyExecutionRecord[];
  metadata?: Record<string, unknown>;
}
```

## Performance Tracking

The agent tracks strategy performance automatically:

```typescript
// Get metrics for a specific strategy
const metrics = solver.getStrategyMetrics('decomposition-001');
console.log(`Success rate: ${metrics.successRate * 100}%`);
console.log(`Average quality: ${metrics.avgQualityScore * 100}%`);
console.log(`Reliability: ${metrics.reliability * 100}%`);

// Get all metrics
const allMetrics = solver.getAllMetrics();
allMetrics.forEach((metrics, strategyId) => {
  console.log(`${strategyId}: ${metrics.successRate * 100}% success`);
});
```

## Custom Strategies

Register your own problem-solving strategies:

```typescript
import { ProblemSolvingStrategy, ProblemContext, StrategyResult } from '@cognomega/si-core';

class MyCustomStrategy implements ProblemSolvingStrategy {
  id = 'custom-001';
  name = 'My Custom Strategy';
  description = 'Description of what this strategy does';
  category = 'analytical';
  applicableContexts = ['optimization', 'analysis'];
  complexity = 'medium';

  async execute(problem: ProblemContext): Promise<StrategyResult> {
    // Your strategy logic here
    return {
      success: true,
      solution: { /* your solution */ },
      reasoning: 'Why this solution works',
      confidence: 0.85,
      alternativeApproaches: ['other-approach'],
      executionTime: 100,
      quality: 0.9,
    };
  }

  isApplicable(problem: ProblemContext): boolean {
    // Logic to determine if strategy applies
    return problem.complexity > 0.5;
  }
}

// Register the strategy
const customStrategy = new MyCustomStrategy();
solver.registerStrategy(customStrategy);
```

## Integration with Multi-Agent System

The StrategicSolverAgent is automatically registered with the SuperIntelligenceEngine:

```typescript
import { registerMultiAgentSystem, SuperIntelligenceEngine } from '@cognomega/si-core';

const engine = new SuperIntelligenceEngine();
registerMultiAgentSystem(engine); // Includes StrategicSolverAgent

// Or use directly
import { createStrategicSolver } from '@cognomega/si-core';
const solver = createStrategicSolver();
```

## Example Use Cases

### 1. System Optimization
```typescript
const problem = {
  id: 'sys-opt-001',
  description: 'Optimize database query performance for high-traffic endpoints',
  type: 'optimization',
  complexity: 0.75,
  constraints: ['Zero downtime', 'Budget limit: $500/month'],
  knownPatterns: ['indexing', 'caching', 'query-optimization'],
};
```

### 2. Bug Debugging
```typescript
const problem = {
  id: 'debug-001',
  description: 'Memory leak in Node.js application under high load',
  type: 'debugging',
  complexity: 0.85,
  constraints: ['Production system', 'Cannot restart'],
  previousAttempts: [/* previous debugging attempts */],
};
```

### 3. Feature Design
```typescript
const problem = {
  id: 'design-001',
  description: 'Design innovative onboarding flow to increase user conversion',
  type: 'design',
  complexity: 0.6,
  constraints: ['Mobile-first', 'Under 3 minutes', 'GDPR compliant'],
};
```

### 4. Complex Planning
```typescript
const problem = {
  id: 'plan-001',
  description: 'Plan migration from monolith to microservices architecture',
  type: 'planning',
  complexity: 0.9,
  constraints: ['Zero downtime', 'Gradual migration', '6-month timeline'],
};
```

## API Reference

### StrategicSolverAgent

**Methods:**

- `registerStrategy(strategy: ProblemSolvingStrategy): void` - Register a new strategy
- `getStrategies(): ProblemSolvingStrategy[]` - Get all registered strategies
- `getStrategyMetrics(strategyId: string): StrategyMetrics | null` - Get metrics for a strategy
- `getAllMetrics(): Map<string, StrategyMetrics>` - Get all performance metrics

**Inherited from BaseAgent:**

- `initialize(config?: Partial<AgentConfig>): Promise<void>` - Initialize the agent
- `execute(task: AgentTask): Promise<AgentResult>` - Execute a task
- `canHandle(task: AgentTask): boolean` - Check if agent can handle task
- `getStatus(): AgentStatus` - Get agent health and status

### Interfaces

#### ProblemSolvingStrategy
```typescript
interface ProblemSolvingStrategy {
  id: string;
  name: string;
  description: string;
  category: 'decomposition' | 'heuristic' | 'analytical' | 'creative' | 'hybrid';
  applicableContexts: string[];
  complexity: 'low' | 'medium' | 'high';
  execute(problem: ProblemContext): Promise<StrategyResult>;
  isApplicable(problem: ProblemContext): boolean;
}
```

#### StrategyPerformanceTracker
```typescript
interface StrategyPerformanceTracker {
  strategyId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageQualityScore: number;
  contextSuccessRates: Map<string, number>;
  recordExecution(record: StrategyExecutionRecord): void;
  getSuccessRate(context?: string): number;
  getMetrics(): StrategyMetrics;
}
```

## Best Practices

1. **Be Specific**: Provide detailed problem descriptions for better strategy selection
2. **Set Appropriate Complexity**: Use 0-1 scale accurately (0.5+ typically needs decomposition)
3. **Include Constraints**: Help strategies make realistic recommendations
4. **Track Performance**: Review metrics regularly to understand strategy effectiveness
5. **Provide Context**: Include `knownPatterns` and `previousAttempts` when available
6. **Custom Strategies**: Create domain-specific strategies for specialized problems

## Testing

See `strategic-solver-example.ts` for comprehensive examples demonstrating:
- System optimization
- Bug debugging
- Creative feature design
- Performance tracking
- Custom strategy registration

## Compatibility

- ✅ Fully compatible with BaseAgent architecture
- ✅ Integrates with FullStackAIAssistant orchestrator
- ✅ Works with SuperIntelligenceEngine
- ✅ No breaking changes to existing agent system

## Future Enhancements

Potential improvements (not yet implemented):
- Machine learning for strategy selection optimization
- Strategy combination/hybrid approaches
- Real-time strategy adaptation
- Collaborative strategies across multiple agents
- Strategy explanation and visualization

## Support

For issues or questions:
1. Review examples in `strategic-solver-example.ts`
2. Check the main agents README
3. File an issue on the repository

---

**Part of Cognomega Multi-Agent AI System**  
Version: 0.1.0  
License: See repository LICENSE
