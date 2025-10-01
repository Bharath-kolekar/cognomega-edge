# @cognomega/si-core

Cognomega Super Intelligence Core - Shared TypeScript library providing AI intelligence, multi-agent systems, and cognitive skills for all Cognomega microservices.

## Overview

This core library provides:
- **Super Intelligence Engine**: Advanced reasoning and contextual memory
- **Multi-Agent System**: Orchestrated AI agents for full-stack development
- **Smart AI Router**: Intelligent model selection and routing
- **Skill System**: Reusable AI capabilities and tools
- **Type Definitions**: Shared types for the entire platform

## Technology Stack

- **Language**: TypeScript with strict mode
- **Module System**: ES2020 modules
- **Dependencies**: React, utility libraries
- **Build Output**: Declaration files for type sharing

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.17.1

### Install Dependencies

From the monorepo root:
```powershell
pnpm install
```

### Build

Generate TypeScript declarations:
```powershell
pnpm -C packages/si-core build
```

### Type Checking

```powershell
pnpm -C packages/si-core typecheck
```

## Architecture

This library is designed as a shared dependency:

- **Type-Only**: Primarily provides types and interfaces
- **Zero Runtime**: Minimal runtime dependencies
- **Composable**: Used by API, frontend, and builder services
- **Versioned**: Follows semantic versioning for compatibility

## Module Structure

### Core Modules

```typescript
import {
  SuperIntelligenceEngine,
  SmartAIRouter,
  TaskPayload,
  RoutingResult
} from '@cognomega/si-core';
```

### Multi-Agent System

```typescript
import {
  registerMultiAgentSystem,
  createFullStackAssistant,
  FullStackAIAssistant,
  ProjectPlanningAgent,
  UIDesignAgent,
  FrontendDevAgent,
  BackendDevAgent,
  DatabaseAgent,
  DevOpsAgent,
  TestingAgent
} from '@cognomega/si-core';
```

### Types

```typescript
import type {
  ProjectRequirements,
  ProjectPlan,
  BuildResult,
  BuildArtifact,
  AgentTask,
  AgentResult,
  OrchestrationPlan
} from '@cognomega/si-core';
```

## Project Structure

```
packages/si-core/
├── src/
│   ├── v0/
│   │   ├── agents/              # Multi-agent system
│   │   │   ├── types.ts         # Agent type definitions
│   │   │   ├── base-agent.ts    # Base agent class
│   │   │   ├── fullstack-ai-assistant.ts  # Orchestrator
│   │   │   ├── project-planning-agent.ts
│   │   │   ├── ui-design-agent.ts
│   │   │   ├── frontend-dev-agent.ts
│   │   │   ├── backend-dev-agent.ts
│   │   │   ├── database-agent.ts
│   │   │   ├── devops-agent.ts
│   │   │   ├── testing-agent.ts
│   │   │   └── integration.ts   # Engine integration
│   │   ├── super-intelligence-engine.ts
│   │   ├── smart-ai-router.ts
│   │   └── skills/              # AI skills and capabilities
│   ├── index.ts                 # Main exports
│   └── types/                   # Shared type definitions
├── dist/                        # Build output (declarations)
├── package.json
├── tsconfig.json
└── README.md                    # This file
```

## Usage Examples

### Initialize Super Intelligence Engine

```typescript
import { SuperIntelligenceEngine } from '@cognomega/si-core';

const engine = new SuperIntelligenceEngine();

const result = await engine.process({
  text: 'Create a React dashboard with charts',
  context: { user: 'developer' }
});
```

### Use Multi-Agent System

```typescript
import {
  SuperIntelligenceEngine,
  registerMultiAgentSystem
} from '@cognomega/si-core';

const engine = new SuperIntelligenceEngine();
registerMultiAgentSystem(engine);

const result = await engine.process({
  text: 'Build a full-stack e-commerce application',
  agents: ['fullstack-assistant']
});
```

### Create Full-Stack Application

```typescript
import {
  createFullStackAssistant,
  ProjectRequirements
} from '@cognomega/si-core';

const assistant = createFullStackAssistant();
await assistant.initialize();

const requirements: ProjectRequirements = {
  name: 'My App',
  description: 'A modern web application',
  framework: 'Next.js',
  targetPlatform: 'fullstack',
  features: ['Authentication', 'Dashboard', 'API']
};

const task = {
  id: 'build-1',
  type: 'orchestrator',
  payload: { requirements },
  priority: 10,
  createdAt: Date.now()
};

const result = await assistant.execute(task);
```

## Integration Points

### Used By

- **API Service**: Core intelligence and agent orchestration
- **Frontend Service**: Shared types and utilities
- **Builder Service**: Code generation and intelligence

### Integration Pattern

Other packages import si-core using workspace protocol:

```json
{
  "dependencies": {
    "@cognomega/si-core": "workspace:*"
  }
}
```

TypeScript project references ensure type checking across packages.

## Key Features

### 8 Layers of Super Intelligence

1. **Advanced Reasoning**: Complex problem decomposition
2. **Contextual Memory**: Session and long-term memory
3. **Semantic NLP**: Natural language understanding
4. **Pattern Recognition**: Code and architecture patterns
5. **Adaptive Learning**: Continuous improvement
6. **Multi-Modal Processing**: Text, code, voice, images
7. **Collaborative Intelligence**: Multi-agent coordination
8. **Meta-Cognitive Awareness**: Self-monitoring and optimization

### Agent Capabilities

- **Project Planning**: Requirements analysis, architecture design
- **UI Design**: Component specs, themes, accessibility
- **Frontend Development**: React, Next.js, Vue components
- **Backend Development**: REST APIs, business logic, auth
- **Database Design**: Schema, migrations, optimization
- **DevOps**: Docker, Kubernetes, CI/CD, infrastructure
- **Testing**: Unit, integration, E2E tests

## Contributing

When making changes to this library:

1. **Types First**: Update type definitions before implementation
2. **Backward Compatibility**: Never break existing exports
3. **Documentation**: Update examples for new features
4. **Build Check**: Ensure `pnpm build` succeeds
5. **Type Check**: Run `pnpm typecheck` before committing
6. **Version**: Update version following semver

## Versioning

This library follows semantic versioning:

- **Major**: Breaking changes to public API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no API changes

When updating, coordinate with consuming packages.

## Notes

- This package uses `composite: true` in tsconfig.json for project references
- Exports both types and runtime code
- Designed for tree-shaking and minimal bundle impact
- All AI agents are stateless and independently testable
- Documentation for agents: `src/v0/agents/README.md`
