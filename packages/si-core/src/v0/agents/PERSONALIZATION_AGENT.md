# PersonalizationAgent

The PersonalizationAgent is a specialized agent in Cognomega's multi-agent AI system that provides intelligent personalization, user modeling, and adaptive recommendations.

## Overview

The PersonalizationAgent continuously learns from user interactions and adapts recommendations, solutions, and communication styles to individual users. It tracks user goals, expertise levels, preferences, and behavior patterns to provide a tailored experience.

## Features

### 1. **User Modeling**
- Tracks user goals and objectives
- Monitors expertise levels (beginner, intermediate, advanced, expert)
- Records preferences for communication style, learning approach, and tools
- Maintains comprehensive user profiles

### 2. **Adaptive Recommendations**
- Generates personalized recommendations based on:
  - User profile and goals
  - Historical behavior patterns
  - Current context and tasks
  - Expertise level
- Prioritizes and ranks recommendations by confidence and relevance

### 3. **Behavior Learning**
- Analyzes user interactions to identify patterns
- Tracks task completion patterns
- Monitors tool usage preferences
- Studies error recovery approaches
- Learns from interaction frequency and timing

### 4. **Need Anticipation**
- Predicts user needs based on context
- Suggests next actions based on behavior patterns
- Aligns suggestions with stated goals
- Provides contextual recommendations

### 5. **Multimodal Learning**
- Learns from explicit feedback (ratings, comments)
- Extracts insights from implicit behavior signals
- Adjusts recommendations based on positive/negative feedback
- Continuously refines user model

### 6. **Response Adaptation**
- Adjusts communication style (concise, detailed, technical, casual)
- Matches technicality level to user expertise
- Provides appropriate examples and resources
- Suggests contextual next steps

## Task Types

The PersonalizationAgent supports the following task types:

### `get-profile`
Retrieves the current user profile.

**Payload:**
```typescript
{
  taskType: 'get-profile'
}
```

### `update-profile`
Updates user profile with new information.

**Payload:**
```typescript
{
  taskType: 'update-profile',
  updates: {
    goals?: string[],
    expertise?: ExpertiseLevel,
    preferences?: Partial<UserPreferences>
  }
}
```

### `record-interaction`
Records a user interaction for learning.

**Payload:**
```typescript
{
  taskType: 'record-interaction',
  interaction: {
    taskType: string,
    input: string,
    output?: string,
    feedback?: UserFeedback,
    success: boolean,
    duration: number,
    context?: Record<string, unknown>
  }
}
```

### `analyze-behavior`
Analyzes user behavior to identify patterns.

**Payload:**
```typescript
{
  taskType: 'analyze-behavior'
}
```

### `get-recommendations`
Generates personalized recommendations.

**Payload:**
```typescript
{
  taskType: 'get-recommendations',
  context?: Record<string, unknown>
}
```

### `anticipate-needs`
Anticipates user needs based on context.

**Payload:**
```typescript
{
  taskType: 'anticipate-needs',
  context: Record<string, unknown>
}
```

### `adapt-response`
Adapts response style to user preferences.

**Payload:**
```typescript
{
  taskType: 'adapt-response',
  content: string
}
```

### `learn-from-feedback`
Learns from explicit user feedback.

**Payload:**
```typescript
{
  taskType: 'learn-from-feedback',
  feedback: {
    type: 'positive' | 'negative' | 'neutral',
    rating?: number,
    comment?: string,
    aspects?: string[],
    timestamp: number
  },
  interactionId?: string
}
```

## Usage Example

```typescript
import { PersonalizationAgent, AgentTask } from '@cognomega/si-core';

// Initialize the agent
const agent = new PersonalizationAgent();
await agent.initialize();

// Update user profile
const updateTask: AgentTask = {
  id: 'update-1',
  type: 'personalization',
  payload: {
    taskType: 'update-profile',
    updates: {
      goals: ['Learn TypeScript', 'Build full-stack apps'],
      expertise: 'intermediate',
      preferences: {
        communicationStyle: 'technical',
        learningStyle: 'hands-on',
        frameworkPreferences: ['React', 'Node.js']
      }
    }
  },
  priority: 7,
  context: { userId: 'user-123' },
  createdAt: Date.now()
};

const result = await agent.execute(updateTask);
console.log('Profile updated:', result.success);

// Get recommendations
const recommendTask: AgentTask = {
  id: 'recommend-1',
  type: 'personalization',
  payload: {
    taskType: 'get-recommendations',
    context: {
      currentTask: 'building-react-app'
    }
  },
  priority: 8,
  context: { userId: 'user-123' },
  createdAt: Date.now()
};

const recommendations = await agent.execute(recommendTask);
console.log('Recommendations:', recommendations.data);
```

## Integration with Orchestrator

The PersonalizationAgent is automatically registered with the FullStackAIAssistant orchestrator:

```typescript
import { createFullStackAssistant } from '@cognomega/si-core';

const assistant = createFullStackAssistant();
await assistant.initialize();

// PersonalizationAgent is now available alongside other agents
const statuses = assistant.getAgentStatuses();
console.log('Personalization Agent:', statuses.get('personalization'));
```

## Data Structures

### UserProfile
```typescript
interface UserProfile {
  id: string;
  goals: string[];
  expertise: ExpertiseLevel;
  preferences: UserPreferences;
  behaviorPatterns: BehaviorPattern[];
  interactionHistory: InteractionRecord[];
  lastUpdated: number;
  created: number;
}
```

### UserPreferences
```typescript
interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'technical' | 'casual';
  preferredLanguage?: string;
  codeStyle?: 'functional' | 'oop' | 'declarative' | 'mixed';
  frameworkPreferences?: string[];
  toolPreferences?: string[];
  interactionMode?: 'guided' | 'autonomous' | 'collaborative';
  feedbackFrequency?: 'frequent' | 'moderate' | 'minimal';
  learningStyle?: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
  custom?: Record<string, unknown>;
}
```

### PersonalizationRecommendation
```typescript
interface PersonalizationRecommendation {
  id: string;
  type: 'action' | 'tool' | 'feature' | 'workflow' | 'content';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  suggestedTiming?: string;
  contextual: boolean;
  priority: number;
}
```

## Testing

The PersonalizationAgent includes comprehensive tests covering all functionality:

```bash
# Run PersonalizationAgent tests
npx tsx packages/si-core/src/v0/agents/test-personalization.ts
```

Test coverage includes:
- ✅ Agent initialization
- ✅ Status checks
- ✅ Profile management (get/update)
- ✅ Interaction recording
- ✅ Behavior analysis
- ✅ Recommendation generation
- ✅ Need anticipation
- ✅ Response adaptation
- ✅ Feedback learning

## Architecture

The PersonalizationAgent:
- Extends `BaseAgent` for core functionality
- Implements the `IAgent` interface
- Maintains in-memory user profiles and learning insights
- Integrates seamlessly with the multi-agent orchestration system
- Follows established patterns from other specialized agents

## Best Practices

1. **User Context**: Always provide `userId` in the task context for proper profile tracking
2. **Regular Updates**: Update user profiles as goals and preferences evolve
3. **Feedback Loop**: Record interactions and feedback to improve personalization
4. **Privacy**: User profiles are stored in-memory; implement persistent storage as needed
5. **Scalability**: Consider profile size limits for long-running sessions

## Future Enhancements

Potential areas for expansion:
- Persistent storage for user profiles
- Advanced pattern recognition with ML models
- Cross-user collaborative filtering
- Real-time adaptation during conversations
- Integration with external user data sources
- A/B testing for recommendation strategies

## Contributing

When extending the PersonalizationAgent:
1. Follow the existing task pattern structure
2. Add appropriate types and interfaces
3. Update tests to cover new functionality
4. Document new task types in this README
5. Ensure backward compatibility with existing profiles

## License

Part of the Cognomega Edge project.
