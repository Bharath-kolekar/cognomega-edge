# MultiModalReasoningAgent

A production-grade agent for integrating and reasoning across multiple modalities including text, code, vision, audio, sensor data, and gestures. Part of Cognomega's Super Intelligence architecture.

## Overview

The `MultiModalReasoningAgent` enables AI systems to:
- **Integrate** data from multiple input modalities
- **Reason** across different types of information
- **Fuse** insights from various sources
- **Generate** outputs in the user's preferred format
- **Detect** and resolve contradictions between modalities

## Supported Modalities

### Input Modalities
- **Text**: Natural language content with sentiment and entity extraction
- **Code**: Programming code with quality metrics and AST analysis
- **Vision**: Images/video with object detection, scene recognition, OCR
- **Audio**: Speech with transcription, emotion, and speaker identification
- **Sensor**: IoT/device sensors (accelerometer, temperature, location, biometrics)
- **Gesture**: User gestures (swipe, tap, pinch, rotate, etc.)

### Output Modalities
- **Text**: Human-readable explanations and summaries
- **Code**: Structured code-like output
- **Vision**: Visualization specifications (diagrams, charts)
- **Audio**: Speech synthesis specifications

## Key Features

### 1. Modality Fusion Strategies
- **Consensus**: Equal weight to all modalities
- **Weighted**: Confidence-based weighting by relevance
- **Hierarchical**: Primary modality with supporting evidence

### 2. Contradiction Detection
Automatically detects and resolves conflicts between modalities (e.g., positive text sentiment vs. sad audio emotion).

### 3. Cross-Modal Reasoning
Synthesizes information from multiple sources to draw comprehensive conclusions with step-by-step explanations.

### 4. Confidence Scoring
Provides confidence metrics for:
- Individual modality analysis
- Fused insights
- Final conclusions
- Alternative interpretations

### 5. Context Awareness
Incorporates environmental and user context:
- Device capabilities and orientation
- Environmental conditions (lighting, noise, temperature)
- User preferences (output format, verbosity)
- Temporal context

## Usage

### Basic Example

```typescript
import { MultiModalReasoningAgent, MultiModalInput } from '@cognomega/si-core';

// Create and initialize agent
const agent = new MultiModalReasoningAgent();
await agent.initialize();

// Prepare multi-modal input
const input: MultiModalInput = {
  text: {
    content: 'This is amazing!',
    sentiment: 'positive',
    confidence: 0.95,
  },
  audio: {
    transcript: 'This is amazing!',
    emotion: 'excited',
    confidence: 0.92,
  },
  context: {
    timestamp: Date.now(),
    user: {
      preferences: {
        outputModality: 'text',
        verbosity: 'detailed',
      },
    },
  },
};

// Create task
const task = {
  id: 'analysis-1',
  type: 'multi-modal-reasoning',
  payload: {
    input,
    outputModality: 'text',
    options: {
      fusionStrategy: 'weighted',
      includeAlternatives: true,
    },
  },
  priority: 8,
  createdAt: Date.now(),
};

// Execute
const result = await agent.execute(task);

if (result.success) {
  console.log('Conclusion:', result.data.reasoning.conclusion);
  console.log('Confidence:', result.data.reasoning.confidence);
  console.log('Output:', result.data.output.content);
}
```

### Advanced: Code Review with Visual Context

```typescript
const input: MultiModalInput = {
  code: {
    content: 'function calc(x) { return x * 2; }',
    language: 'javascript',
    quality: { complexity: 1, maintainability: 9, testability: 8 },
    confidence: 0.88,
  },
  vision: {
    objects: [
      { name: 'code-editor', confidence: 0.95, bbox: [0, 0, 800, 600] },
    ],
    text: ['calc', 'function'],
    confidence: 0.85,
  },
  text: {
    content: 'Review this code for issues',
    confidence: 0.9,
  },
};

const task = {
  id: 'code-review-1',
  type: 'multi-modal-reasoning',
  payload: {
    input,
    outputModality: 'code',
    options: {
      fusionStrategy: 'hierarchical',
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

const result = await agent.execute(task);
```

### Gesture Control with Sensors

```typescript
const input: MultiModalInput = {
  gesture: {
    type: 'swipe',
    direction: 'right',
    intensity: 0.85,
    duration: 250,
    confidence: 0.92,
  },
  sensor: {
    type: 'accelerometer',
    value: [0.5, 0.2, -0.1],
    confidence: 0.88,
  },
  context: {
    device: {
      type: 'mobile',
      orientation: 'portrait',
    },
  },
};

const task = {
  id: 'gesture-1',
  type: 'multi-modal-reasoning',
  payload: {
    input,
    options: {
      fusionStrategy: 'consensus',
      minConfidence: 0.8,
    },
  },
  priority: 7,
  createdAt: Date.now(),
};

const result = await agent.execute(task);
```

## Integration with SuperIntelligenceEngine

The agent integrates seamlessly with Cognomega's orchestrator:

```typescript
import { createFullStackAssistant } from '@cognomega/si-core';

const assistant = createFullStackAssistant();
await assistant.initialize();

// Execute via orchestrator
const result = await assistant.execute({
  id: 'multi-modal-task-1',
  type: 'multi-modal-reasoning',
  payload: { input: multiModalInput },
  priority: 8,
  createdAt: Date.now(),
});
```

## Configuration Options

### Fusion Strategy
- `consensus`: Average confidence across all modalities
- `weighted`: Weighted by relevance scores
- `hierarchical`: Primary modality with supporting boost

### Output Options
- `includeAlternatives`: Generate alternative outputs in different modalities
- `minConfidence`: Minimum confidence threshold for processing
- `verbosity`: 'concise' | 'moderate' | 'detailed'

## Response Structure

```typescript
{
  success: boolean;
  data: {
    fusion: {
      primary: ModalityType;
      supporting: ModalityType[];
      confidence: number;
      insights: ModalityInsight[];
      contradictions?: Contradiction[];
      consensus: string;
    };
    reasoning: {
      conclusion: string;
      reasoning: string[];
      confidence: number;
      supportingModalities: ModalityType[];
      alternativeInterpretations?: Array<{
        interpretation: string;
        confidence: number;
        modalities: ModalityType[];
      }>;
    };
    output: {
      modality: ModalityType;
      content: string | unknown;
      metadata?: Record<string, unknown>;
      alternatives?: Array<{
        modality: ModalityType;
        content: string | unknown;
      }>;
    };
    modalitiesAnalyzed: number;
    overallConfidence: number;
  };
  metadata: {
    duration: number;
    confidence: number;
    suggestions: string[];
  };
  nextSteps: string[];
}
```

## Examples

See `multi-modal-reasoning-example.ts` for complete examples:
1. Sentiment Analysis (text + audio)
2. Code Review with Visual Context
3. Gesture Control with Sensor Fusion
4. Comprehensive Scene Understanding (all modalities)

## Best Practices

1. **Provide Context**: Always include relevant context for better reasoning
2. **Set Confidence Thresholds**: Use `minConfidence` to filter low-quality inputs
3. **Choose Appropriate Strategy**: Select fusion strategy based on use case
4. **Handle Contradictions**: Review contradiction warnings before taking action
5. **Use Alternatives**: Enable `includeAlternatives` for critical decisions
6. **Monitor Confidence**: Check overall confidence before acting on conclusions

## Performance Considerations

- Individual modality analysis runs in parallel
- Fusion is optimized for large numbers of modalities
- Output generation is lazy (only requested modality is generated)
- Alternatives are optional to reduce processing time

## Architecture

The agent follows the BaseAgent pattern:
- Extends `BaseAgent` for orchestrator compatibility
- Implements `processTask` for multi-modal reasoning
- Modular internal methods for each processing stage
- Type-safe interfaces for all inputs/outputs
- Production-ready error handling and logging

## Future Enhancements

- Temporal reasoning across time-series modalities
- Real-time streaming modality processing
- Multi-agent collaboration for complex reasoning
- Learning from user feedback to improve fusion
- Custom modality plugins

## Contributing

When extending the agent:
1. Add new modality types to `ModalityType`
2. Create corresponding input interface
3. Implement analysis method
4. Update fusion logic if needed
5. Add comprehensive examples

## License

Part of Cognomega's Super Intelligence Core (@cognomega/si-core)
