# CausalReasoningAgent

## Overview

The `CausalReasoningAgent` is a specialized agent for causal inference and intervention planning. It builds causal models, predicts intervention effects, and selects optimal interventions using structural causal modeling and do-calculus principles.

## Capabilities

- **Causal modeling**: Build causal graphs from data or domain knowledge
- **Causal inference**: Identify causal relationships and confounders
- **Intervention simulation**: Predict the effects of interventions on the system
- **Intervention comparison**: Compare multiple interventions to find the optimal one
- **Counterfactual reasoning**: Predict what would have happened under different conditions
- **Optimal intervention selection**: Recommend the best intervention for a given goal

## Key Concepts

### Causal Graph

A causal graph represents causal relationships between variables:
- **Nodes**: Variables in the system (observable, latent, or intervention points)
- **Edges**: Causal relationships with strength (0-1) and type (direct, confounded, mediated)

### Interventions

Interventions represent actions that change the system:
- **do-intervention**: Force a variable to a specific value
- **conditional**: Observe a variable at a value
- **counterfactual**: What would have happened if...

### Intervention Results

Results include:
- Expected outcome on target variables
- Affected nodes and causal pathways
- Confidence scores
- Warnings about potential confounding

## Usage Examples

### Example 1: Marketing Campaign Optimization

```typescript
import { CausalReasoningAgent } from '@cognomega/si-core';

const agent = new CausalReasoningAgent();
await agent.initialize();

// Step 1: Build a marketing causal model
const buildTask = {
  id: 'build-1',
  type: 'planning',
  payload: {
    action: 'build-model',
    payload: {
      graphId: 'marketing-model',
      domain: 'marketing',
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

const modelResult = await agent.execute(buildTask);
console.log('Model insights:', modelResult.data.insights);

// Step 2: Predict intervention effect
const predictTask = {
  id: 'predict-1',
  type: 'planning',
  payload: {
    action: 'predict-intervention',
    payload: {
      graphId: 'marketing-model',
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
console.log('Expected outcome:', result.data.expectedOutcome);
console.log('Confidence:', result.data.confidence);
```

### Example 2: Healthcare Treatment Analysis

```typescript
// Build healthcare model
const healthcareTask = {
  id: 'healthcare-1',
  type: 'planning',
  payload: {
    action: 'build-model',
    payload: {
      graphId: 'healthcare-model',
      domain: 'healthcare',
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

await agent.execute(healthcareTask);

// Analyze counterfactual: What if we had used different dosage?
const counterfactualTask = {
  id: 'counterfactual-1',
  type: 'planning',
  payload: {
    action: 'counterfactual',
    payload: {
      graphId: 'healthcare-model',
      intervention: {
        targetNode: 'dosage',
        value: 200,
        type: 'counterfactual',
        description: 'Alternative dosage level',
      },
      observedData: {
        recovery: 0.7,
        side_effects: 0.3,
      },
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

const result = await agent.execute(counterfactualTask);
console.log('Counterfactual outcome:', result.data);
```

### Example 3: Custom Causal Model

```typescript
// Build custom model with explicit nodes and edges
const customTask = {
  id: 'custom-1',
  type: 'planning',
  payload: {
    action: 'build-model',
    payload: {
      graphId: 'custom-model',
      nodes: [
        { id: 'x', name: 'Input X', type: 'intervention' },
        { id: 'y', name: 'Output Y', type: 'observable' },
        { id: 'z', name: 'Mediator Z', type: 'observable' },
      ],
      edges: [
        { from: 'x', to: 'z', strength: 0.7, type: 'direct', confidence: 0.85 },
        { from: 'z', to: 'y', strength: 0.8, type: 'direct', confidence: 0.9 },
      ],
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

await agent.execute(customTask);
```

### Example 4: Selecting Optimal Intervention

```typescript
// Compare multiple interventions
const selectTask = {
  id: 'select-1',
  type: 'planning',
  payload: {
    action: 'select-optimal',
    payload: {
      graphId: 'marketing-model',
      targetNode: 'revenue',
      interventions: [
        {
          targetNode: 'ad_spend',
          value: 500,
          type: 'do',
          description: 'Moderate ad spend increase',
        },
        {
          targetNode: 'ad_spend',
          value: 1500,
          type: 'do',
          description: 'High ad spend increase',
        },
        {
          targetNode: 'impressions',
          value: 10000,
          type: 'do',
          description: 'Direct impression boost',
        },
      ],
    },
  },
  priority: 9,
  createdAt: Date.now(),
};

const result = await agent.execute(selectTask);
console.log('Optimal intervention:', result.data.optimal);
console.log('Reasoning:', result.data.reasoning);
```

## Built-in Domain Models

The agent includes pre-built causal models for common domains:

### Marketing Domain
- Nodes: ad_spend, impressions, clicks, conversions, revenue, brand_awareness
- Causal relationships: ad_spend → impressions → clicks → conversions → revenue

### Healthcare Domain
- Nodes: treatment, dosage, symptoms, recovery, side_effects, patient_age
- Causal relationships: treatment/dosage → symptoms → recovery, with age as confounder

### Software Engineering Domain
- Nodes: code_review, testing, code_quality, bugs, deployment_freq, team_experience
- Causal relationships: code_review/testing → code_quality → bugs → deployment_freq

### Generic Domain
- Simple model with input, mediator, output, and confounder nodes

## Integration with Orchestrator

The `CausalReasoningAgent` is automatically registered with the `FullStackAIAssistant` orchestrator and can be used alongside other specialized agents for comprehensive project analysis.

```typescript
import { createFullStackAssistant } from '@cognomega/si-core';

const assistant = createFullStackAssistant();
await assistant.initialize();

// The CausalReasoningAgent is available as part of the orchestrator
const result = await assistant.execute({
  id: 'project-1',
  type: 'planning',
  payload: {
    action: 'build-model',
    payload: { domain: 'marketing' },
  },
  priority: 9,
  createdAt: Date.now(),
});
```

## API Reference

### Task Payload Structure

```typescript
{
  action: 'build-model' | 'predict-intervention' | 'select-optimal' | 'counterfactual',
  payload: {
    // Action-specific parameters
  }
}
```

### Actions

#### build-model
Build a causal model from domain knowledge or custom nodes/edges.

**Payload:**
- `graphId`: Unique identifier for the graph
- `domain`: Pre-built domain ('marketing', 'healthcare', 'software', 'generic')
- OR `nodes`: Array of CausalNode objects
- AND `edges`: Array of CausalEdge objects

**Returns:**
- `graphId`: ID of created graph
- `nodes`: Array of nodes
- `edges`: Array of edges
- `insights`: Array of structural insights

#### predict-intervention
Simulate the effect of a specific intervention.

**Payload:**
- `graphId`: ID of existing causal graph
- `intervention`: Intervention object with targetNode, value, type, description

**Returns:**
- `intervention`: The applied intervention
- `affectedNodes`: Map of affected nodes and their values
- `expectedOutcome`: Overall expected outcome
- `confidence`: Confidence score (0-1)
- `causalPathways`: Array of causal paths
- `warnings`: Potential issues (if any)

#### select-optimal
Compare multiple interventions and select the best one.

**Payload:**
- `graphId`: ID of existing causal graph
- `targetNode`: Target variable to optimize
- `interventions`: Array of intervention objects

**Returns:**
- `optimal`: Best intervention result
- `allResults`: All intervention results sorted by effectiveness
- `reasoning`: Explanation of why this intervention was selected

#### counterfactual
Analyze what would have happened under different conditions.

**Payload:**
- `graphId`: ID of existing causal graph
- `intervention`: Counterfactual intervention
- `observedData`: Observed values for comparison

**Returns:**
- InterventionResult with counterfactual predictions
- Warnings comparing predicted vs observed values

## Best Practices

1. **Start with domain models**: Use built-in domain models as starting points
2. **Validate relationships**: Review causal relationships with domain experts
3. **Check for confounders**: Pay attention to warnings about confounding
4. **Iterate and refine**: Update models based on observed outcomes
5. **Monitor confidence**: Lower confidence suggests more validation needed
6. **Compare alternatives**: Always compare multiple interventions

## Advanced Topics

### Custom Implementations

You can extend the agent with custom causal graph and simulator implementations:

```typescript
import { CausalGraph, InterventionSimulator } from '@cognomega/si-core';

class CustomCausalGraph implements CausalGraph {
  // Implement custom graph logic
}

class CustomInterventionSimulator implements InterventionSimulator {
  // Implement custom simulation logic
}
```

### Integration with Machine Learning

The causal models can be learned from data using causal discovery algorithms, then imported as custom nodes/edges.

### Real-world Validation

Always validate causal models against:
- Domain expert knowledge
- Historical data and A/B test results
- Randomized controlled trials (when available)

## References

- Pearl, J. (2009). Causality: Models, Reasoning, and Inference
- Peters, J., Janzing, D., & Schölkopf, B. (2017). Elements of Causal Inference
- Hernán, M. A., & Robins, J. M. (2020). Causal Inference: What If

## Support

For questions or issues with the CausalReasoningAgent, please refer to:
- Main agents documentation: `/packages/si-core/src/v0/agents/README.md`
- Example usage: `/packages/si-core/src/v0/agents/example-usage.ts`
- Integration guide: `/packages/si-core/src/v0/agents/integration.ts`
