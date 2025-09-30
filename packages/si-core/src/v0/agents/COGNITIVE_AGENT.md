# CognitiveAgent

An advanced AI agent with human-like cognitive architecture featuring working memory, long-term memory, and attention mechanisms.

## Overview

The `CognitiveAgent` class simulates human-like reasoning and learning capabilities through:

- **Working Memory**: Limited capacity (7±2 items) for active reasoning
- **Long-Term Memory**: Vector-based persistent knowledge storage
- **Attention Network**: Focus mechanism for relevant information
- **Multi-Step Reflection**: Self-learning from experiences
- **Metacognition**: Awareness and improvement of reasoning quality

## Architecture

### Memory Systems

#### Working Memory
Simulates human working memory limitations with:
- Capacity of 7±2 items (configurable)
- Activation decay over time
- Automatic pruning based on importance and activation
- Relational tracking between memory items

```typescript
interface WorkingMemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'goal' | 'hypothesis' | 'observation' | 'conclusion';
  importance: number; // 0-1
  timestamp: number;
  activationLevel: number; // 0-1, decays over time
  relatedTo: string[]; // IDs of related items
}
```

#### Long-Term Memory (Vector Memory)
Persistent storage with semantic search:
- Vector embeddings for similarity-based retrieval
- Metadata tagging and importance weighting
- Access count and recency tracking
- Confidence scoring

```typescript
interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    type: string;
    tags: string[];
    importance: number;
    confidence: number;
    context?: Record<string, unknown>;
  };
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}
```

### Attention Mechanism

The attention network focuses cognitive resources on relevant information:
- Goal-based attention boosting
- Historical relevance weighting
- Learned attention patterns
- Dynamic score calculation

```typescript
interface AttentionContext {
  currentGoal?: string;
  recentHistory: string[];
  taskType: string;
  importance: number;
}
```

### Reflection and Learning

Multi-step reflection process:
1. **Execution**: Process task with memory and attention
2. **Reflection**: Analyze reasoning quality and outcomes
3. **Learning**: Update attention weights and patterns
4. **Consolidation**: Store valuable insights in long-term memory

```typescript
interface ReflectionEntry {
  id: string;
  taskId: string;
  timestamp: number;
  outcome: 'success' | 'failure' | 'partial';
  confidence: number;
  insights: string[];
  adjustments: string[];
}
```

## Usage

### Basic Usage

```typescript
import { CognitiveAgent } from '@cognomega/si-core';

// Create a cognitive agent
const agent = new CognitiveAgent({
  name: 'MyCognitiveAgent',
  workingMemoryCapacity: 7,
  enableLearning: true,
});

// Initialize
await agent.initialize();

// Execute a task
const task = {
  id: 'task-1',
  type: 'orchestrator',
  payload: {
    action: 'analyze',
    data: 'Analyze this problem...',
  },
  priority: 8,
  createdAt: Date.now(),
};

const result = await agent.execute(task);
console.log('Result:', result);
```

### Memory Inspection

```typescript
// View working memory
const workingMemory = agent.getWorkingMemorySnapshot();
console.log('Working Memory Items:', workingMemory.length);

// Get long-term memory stats
const memoryStats = agent.getLongTermMemoryStats();
console.log('Total Memories:', memoryStats.totalEntries);

// Review reflection history
const reflections = agent.getReflectionHistory();
console.log('Learning Reflections:', reflections.length);

// Check learning metrics
const metrics = agent.getLearningMetrics();
console.log('Success Rate:', metrics.successfulTasks / (metrics.successfulTasks + metrics.failedTasks));
```

### Custom Configuration

```typescript
const agent = new CognitiveAgent({
  name: 'CustomAgent',
  workingMemoryCapacity: 9, // Larger capacity for complex tasks
  capabilities: [
    'reasoning',
    'learning',
    'memory-management',
    'attention-control',
    'self-reflection',
  ],
  priority: 10,
  maxConcurrentTasks: 5,
});
```

## Integration with SuperIntelligenceEngine

The CognitiveAgent extends `BaseAgent` and is fully compatible with the SuperIntelligenceEngine orchestrator:

```typescript
import { SuperIntelligenceEngine, CognitiveAgent } from '@cognomega/si-core';

const engine = new SuperIntelligenceEngine();
const cognitiveAgent = new CognitiveAgent();

// Register with the engine
engine.registerAgent('cognitive-agent', async (task) => {
  const agentTask = convertToAgentTask(task);
  return await cognitiveAgent.execute(agentTask);
});
```

## Key Features

### 1. Human-Like Memory Constraints
- Working memory limited to 7±2 items (Miller's Law)
- Automatic activation decay
- Importance-based retention
- Memory consolidation to long-term storage

### 2. Semantic Memory Retrieval
- Vector-based similarity search
- Context-aware recall
- Access frequency tracking
- Importance weighting

### 3. Attention Management
- Goal-directed attention
- Historical relevance boosting
- Learned attention patterns
- Dynamic focus adjustment

### 4. Self-Learning
- Reflection after each task
- Success and failure analysis
- Attention weight adjustment
- Performance metrics tracking

### 5. Multi-Step Reasoning
- Analysis phase
- Knowledge retrieval
- Solution synthesis
- Validation step

## API Reference

### Constructor

```typescript
constructor(config?: Partial<AgentConfig & {
  workingMemoryCapacity?: number;
  enableLearning?: boolean;
}>)
```

### Public Methods

#### `initialize(config?: Partial<AgentConfig>): Promise<void>`
Initialize the agent with optional configuration.

#### `execute(task: AgentTask): Promise<AgentResult>`
Execute a task with full cognitive processing.

#### `getWorkingMemorySnapshot(): WorkingMemoryItem[]`
Get current working memory contents.

#### `getLongTermMemoryStats(): MemoryStats`
Get statistics about long-term memory.

#### `getReflectionHistory(): ReflectionEntry[]`
Get history of all reflections.

#### `getLearningMetrics(): LearningMetrics`
Get current learning performance metrics.

#### `clearWorkingMemory(): void`
Clear working memory (useful for context switching).

#### `canHandle(task: AgentTask): boolean`
Check if agent can handle a specific task.

#### `getStatus(): AgentStatus`
Get current agent status and health.

## Learning Metrics

The agent tracks its learning progress:

```typescript
interface LearningMetrics {
  totalReflections: number;
  successfulTasks: number;
  failedTasks: number;
  averageConfidence: number;
  improvementRate: number; // Rate of improvement over time
}
```

## Best Practices

### 1. Memory Management
- Clear working memory between unrelated task sessions
- Monitor memory stats to understand agent behavior
- Allow consolidation time for important insights

### 2. Learning
- Provide varied tasks for better learning
- Review reflection history to understand agent decisions
- Monitor learning metrics for performance trends

### 3. Attention
- Use appropriate priority levels for tasks
- Provide context in task payloads
- Monitor attention patterns through working memory

### 4. Integration
- Use with SuperIntelligenceEngine for orchestration
- Leverage agent status for health monitoring
- Handle errors gracefully for learning opportunities

## Examples

See `cognitive-agent-example.ts` for comprehensive examples including:

1. **Basic Task Execution** - Simple task processing
2. **Multi-Step Reasoning** - Complex reasoning chains
3. **Memory Consolidation** - Learning and recall
4. **Attention Mechanism** - Handling information overload
5. **Learning from Failures** - Adaptive improvement
6. **Orchestrator Integration** - System-wide coordination

## Performance Considerations

### Memory Usage
- Working memory: ~5-10 KB per item
- Long-term memory: Scales with stored entries
- Reflection history: Grows with task count

### Optimization Tips
- Use appropriate working memory capacity
- Periodically clear unused long-term memories
- Implement memory persistence for production
- Use batch operations for multiple tasks

## Future Enhancements

Potential improvements for production use:

1. **Persistent Storage**
   - Database integration for long-term memory
   - Session recovery and continuity
   - Cross-agent memory sharing

2. **Advanced Vector Search**
   - Real vector database (Pinecone, Weaviate)
   - Actual embedding generation (OpenAI, HuggingFace)
   - Semantic clustering

3. **Enhanced Attention**
   - Transformer-based attention
   - Multi-head attention patterns
   - Learned attention policies

4. **Metacognition**
   - Self-monitoring of reasoning quality
   - Strategy selection based on task type
   - Automatic parameter tuning

## References

- Miller's Law: Working memory capacity of 7±2 items
- Attention mechanisms in cognitive psychology
- Metacognition and self-regulated learning
- Vector embeddings for semantic memory

## License

Part of the Cognomega project. See project LICENSE file.
