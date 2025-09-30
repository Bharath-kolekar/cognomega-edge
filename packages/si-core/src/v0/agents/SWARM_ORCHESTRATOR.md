# SwarmIntelligenceOrchestrator

A production-grade orchestrator for emergent swarm intelligence that coordinates multiple agents to solve complex problems collectively.

## Overview

The `SwarmIntelligenceOrchestrator` is a sophisticated multi-agent coordination system that enables:
- **Emergent Intelligence**: Collective intelligence that exceeds individual agent capabilities
- **Task Decomposition**: Intelligent breakdown of complex problems
- **Agent Communication**: Peer-to-peer and broadcast communication
- **Consensus Building**: Weighted consensus from distributed processing
- **Adaptive Learning**: Swarm improves connections through collaboration

## Features

### Core Capabilities

1. **Agent Management**
   - Dynamic agent registration and removal
   - Connection strength calculation based on complementary specializations
   - Automatic synergy detection between agents

2. **Task Decomposition**
   - Complexity assessment
   - Intelligent subtask generation (analysis, synthesis, execution, validation)
   - Dependency management

3. **Distributed Processing**
   - Optimal agent assignment based on capabilities and availability
   - Parallel task execution where possible
   - Cognitive load balancing

4. **Agent Communication**
   - Broadcast messages to all active agents
   - Peer-to-peer connections for high-synergy pairs
   - Communication history tracking

5. **Consensus Building**
   - Weighted consensus based on agent properties
   - Confidence aggregation
   - Emergent insight extraction

6. **Emergent Synthesis**
   - Pattern detection (collective-superintelligence, swarm-cognition, etc.)
   - Emergence level calculation
   - Collective result generation with recommendations

7. **Swarm Evolution**
   - Connection strengthening through successful collaboration
   - Emergence factor improvements
   - Cognitive load management

## Installation

The orchestrator is part of the `@cognomega/si-core` package:

```typescript
import { 
  SwarmIntelligenceOrchestrator,
  createSwarmOrchestrator 
} from '@cognomega/si-core/v0/agents';
```

## Basic Usage

### 1. Create a Swarm Orchestrator

```typescript
import {
  SwarmIntelligenceOrchestrator,
  ProjectPlanningAgent,
  FrontendDevAgent,
  BackendDevAgent,
  TestingAgent,
} from '@cognomega/si-core/v0/agents';

// Create orchestrator
const orchestrator = new SwarmIntelligenceOrchestrator();

// Or use the factory function
const orchestrator = createSwarmOrchestrator();
```

### 2. Register Agents

```typescript
// Create and initialize specialized agents
const planningAgent = new ProjectPlanningAgent();
const frontendAgent = new FrontendDevAgent();
const backendAgent = new BackendDevAgent();
const testingAgent = new TestingAgent();

await Promise.all([
  planningAgent.initialize(),
  frontendAgent.initialize(),
  backendAgent.initialize(),
  testingAgent.initialize(),
]);

// Register with swarm
orchestrator.registerAgent(planningAgent);
orchestrator.registerAgent(frontendAgent);
orchestrator.registerAgent(backendAgent);
orchestrator.registerAgent(testingAgent);
```

### 3. Execute Tasks

```typescript
const task: AgentTask = {
  id: 'task-1',
  type: 'orchestrator',
  payload: {
    requirements: {
      name: 'E-commerce Platform',
      description: 'Build a modern e-commerce platform',
      framework: 'react',
      features: ['authentication', 'product-catalog', 'shopping-cart'],
      techStack: {
        frontend: ['React', 'TypeScript'],
        backend: ['Node.js', 'Express'],
      },
    },
  },
  priority: 10,
  createdAt: Date.now(),
};

const result = await orchestrator.execute(task);
```

### 4. Analyze Results

```typescript
if ('swarmMetrics' in result) {
  const swarmResult = result as SwarmOrchestrationResult;
  
  console.log('Swarm Metrics:');
  console.log('- Emergence Level:', swarmResult.swarmMetrics.emergenceLevel);
  console.log('- Coherence:', swarmResult.swarmMetrics.coherence);
  console.log('- Active Agents:', swarmResult.swarmMetrics.activeAgents);
  
  console.log('\nEmergent Patterns:');
  console.log(swarmResult.synthesis.patterns);
  
  console.log('\nRecommendation:');
  console.log(swarmResult.synthesis.collectiveResult.recommendation);
}
```

## Advanced Usage

### Dynamic Agent Registration

Add agents dynamically as needed:

```typescript
const orchestrator = new SwarmIntelligenceOrchestrator();

// Start with basic agents
orchestrator.registerAgent(new ProjectPlanningAgent());

// Add more agents as workload increases
if (needsFrontendWork) {
  orchestrator.registerAgent(new FrontendDevAgent());
}

if (needsBackendWork) {
  orchestrator.registerAgent(new BackendDevAgent());
}

// Remove agents when no longer needed
orchestrator.unregisterAgent(agentId);
```

### Monitor Swarm Evolution

```typescript
// Get current swarm metrics
const metrics = orchestrator.getSwarmMetrics();

console.log({
  swarmId: metrics.swarmId,
  totalAgents: metrics.totalAgents,
  avgProcessingPower: metrics.avgProcessingPower,
  avgCognitiveLoad: metrics.avgCognitiveLoad,
  avgEmergenceFactor: metrics.avgEmergenceFactor,
  totalCommunications: metrics.totalCommunications,
});
```

### Multiple Specialized Swarms

Create specialized swarms for different purposes:

```typescript
// Frontend-focused swarm
const frontendSwarm = new SwarmIntelligenceOrchestrator();
frontendSwarm.registerAgent(new ProjectPlanningAgent());
frontendSwarm.registerAgent(new UIDesignAgent());
frontendSwarm.registerAgent(new FrontendDevAgent());

// Backend-focused swarm
const backendSwarm = new SwarmIntelligenceOrchestrator();
backendSwarm.registerAgent(new ProjectPlanningAgent());
backendSwarm.registerAgent(new BackendDevAgent());
backendSwarm.registerAgent(new DatabaseAgent());
```

## Architecture

### SwarmAgent Structure

Each agent in the swarm is wrapped with:
- `specialization`: Agent type/role
- `capabilities`: List of capabilities
- `processingPower`: Estimated processing capacity
- `cognitiveLoad`: Current workload (0-100)
- `emergenceFactor`: Contribution to emergent intelligence (0-100)
- `connectionStrengths`: Map of connections to other agents

### Task Decomposition Levels

Based on complexity assessment:

1. **High Complexity (7-10)**: 
   - Analysis → Synthesis → Execution → Validation

2. **Medium Complexity (4-6)**:
   - Analysis → Execution

3. **Low Complexity (1-3)**:
   - Direct Execution

### Emergence Patterns

The orchestrator detects various emergent patterns:
- `collective-superintelligence` (>70% emergence)
- `distributed-consciousness` (>60% emergence)
- `swarm-cognition` (>50% emergence)
- `high-coherence` (>80% consensus strength)
- `synergistic-problem-solving`
- `emergent-creativity`

## API Reference

### SwarmIntelligenceOrchestrator

#### Constructor
```typescript
constructor(agents?: IAgent[])
```

#### Methods

##### `registerAgent(agent: IAgent): void`
Register an agent to join the swarm.

##### `unregisterAgent(agentId: string): boolean`
Remove an agent from the swarm. Returns true if successful.

##### `execute(task: AgentTask): Promise<AgentResult>`
Execute a task using swarm intelligence. Returns `SwarmOrchestrationResult`.

##### `getSwarmMetrics()`
Get current swarm metrics including processing power, cognitive load, emergence factor, etc.

### SwarmOrchestrationResult

Extended `AgentResult` with:
- `swarmMetrics`: Metrics about swarm performance
- `consensus`: Consensus information from distributed results
- `synthesis`: Emergent synthesis with patterns and insights

## Examples

See `swarm-example.ts` for comprehensive examples including:
1. Basic swarm orchestration
2. Dynamic agent registration
3. Multiple specialized swarms
4. Swarm evolution monitoring

Run examples:
```typescript
import { runAllExamples } from '@cognomega/si-core/v0/agents/swarm-example';

await runAllExamples();
```

## Integration with Existing Systems

The orchestrator extends `BaseAgent` and is fully compatible with:
- Cognomega's SuperIntelligence architecture
- Existing multi-agent system
- Smart AI Router
- Task payload system

## Performance Considerations

- **Optimal Swarm Size**: 3-8 agents for most tasks
- **Connection Strength**: Calculated based on capability overlap and complementarity
- **Cognitive Load**: Monitored and balanced across agents
- **Emergence Factor**: Improves through successful collaboration

## Best Practices

1. **Agent Selection**: Choose agents with complementary specializations
2. **Task Complexity**: Let the orchestrator assess and decompose
3. **Monitoring**: Track emergence levels to gauge swarm effectiveness
4. **Evolution**: Allow swarm to strengthen connections over multiple tasks
5. **Scaling**: Add/remove agents dynamically based on workload

## Troubleshooting

### Low Emergence Levels
- Ensure agents have complementary capabilities
- Verify agents are properly initialized
- Check task complexity matches swarm capabilities

### Poor Coherence
- Review agent connection strengths
- Ensure sufficient agents for task complexity
- Check for capability gaps

### High Cognitive Load
- Scale up swarm with additional agents
- Reduce concurrent task complexity
- Allow time for load to decrease between tasks

## License

Part of Cognomega Edge - see repository license.
