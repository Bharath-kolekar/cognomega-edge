# Microservices, AI Engines, and Agents

## Overview

Cognomega Edge implements a sophisticated multi-layered AI architecture consisting of:

1. **Super Intelligence Engine** - Core reasoning and AI capabilities
2. **Multi-Agent System** - Specialized agents for different tasks
3. **API Services** - REST endpoints and service layer
4. **Infrastructure Services** - Auth, billing, storage, etc.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Cognomega Edge Platform                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Super Intelligence Engine (SI Core)                  │ │
│  │  • Advanced Reasoning                                        │ │
│  │  • Contextual Memory                                         │ │
│  │  • Semantic NLP                                              │ │
│  │  • Smart AI Router                                           │ │
│  └────────────────────┬─────────────────────────────────────────┘ │
│                       │                                            │
│                       ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Multi-Agent System                              │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │   FullStackAIAssistant (Orchestrator)                  │ │ │
│  │  │   • Task coordination                                  │ │ │
│  │  │   • Agent dispatch                                     │ │ │
│  │  │   • Dependency management                              │ │ │
│  │  └─────────────┬──────────────────────────────────────────┘ │ │
│  │                │                                            │ │
│  │                ▼                                            │ │
│  │     ┌──────────────────────────────────────────────┐       │ │
│  │     │        Specialized Agents                    │       │ │
│  │     │  • ProjectPlanning  • UIDesign              │       │ │
│  │     │  • FrontendDev      • BackendDev            │       │ │
│  │     │  • Database         • DevOps                │       │ │
│  │     │  • Testing                                  │       │ │
│  │     └──────────────────────────────────────────────┘       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   API Services Layer                         │ │
│  │  /api/si/ask       - Super Intelligence chat                │ │
│  │  /api/agents/*     - Multi-agent endpoints                  │ │
│  │  /api/billing/*    - Credits and usage                      │ │
│  │  /api/upload/*     - File upload (R2)                       │ │
│  │  /api/voice/*      - Voice preferences                      │ │
│  │  /auth/*           - Authentication                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 1. Super Intelligence Engine

The Super Intelligence (SI) Engine is the core reasoning system built into `packages/si-core/`.

### 8 Layers of Super Intelligence

1. **Layer 1: Natural Language Understanding**
   - Intent recognition
   - Entity extraction
   - Context analysis

2. **Layer 2: Semantic Processing**
   - Meaning interpretation
   - Relationship mapping
   - Knowledge graph construction

3. **Layer 3: Reasoning Engine**
   - Logical inference
   - Decision making
   - Problem decomposition

4. **Layer 4: Memory & Context**
   - Conversation history
   - User preferences
   - Project context

5. **Layer 5: Code Intelligence**
   - Syntax understanding
   - Pattern recognition
   - Best practices application

6. **Layer 6: Architecture Design**
   - System design
   - Component selection
   - Scalability planning

7. **Layer 7: Quality Assurance**
   - Code review
   - Testing strategies
   - Security analysis

8. **Layer 8: Learning & Adaptation**
   - User feedback integration
   - Performance optimization
   - Model fine-tuning

### Omni Intelligence

Advanced multi-modal capabilities:
- **Text**: Natural language processing
- **Code**: Multi-language understanding
- **Voice**: Speech recognition and synthesis
- **Visual**: UI/UX design interpretation

### API Endpoints

**Primary Endpoint**: `POST /api/si/ask`

Request:
```json
{
  "input": "Create a React dashboard with authentication",
  "context": {
    "projectType": "web",
    "framework": "React",
    "features": ["auth", "dashboard"]
  },
  "intelligenceTier": "advanced"
}
```

Response:
```json
{
  "response": "I'll help you create a React dashboard...",
  "suggestions": [...],
  "code": {...},
  "nextSteps": [...]
}
```

## 2. Multi-Agent System

Located in `packages/si-core/src/v0/agents/`, the multi-agent system provides specialized expertise for different aspects of application development.

### Orchestrator: FullStackAIAssistant

**File**: `fullstack-ai-assistant.ts`

**Role**: Central coordinator that manages all specialized agents

**Capabilities**:
- Task analysis and breakdown
- Agent selection and dispatch
- Dependency resolution
- Parallel execution coordination
- Error recovery

**Key Methods**:
```typescript
class FullStackAIAssistant {
  async initialize(): Promise<void>
  async execute(task: Task): Promise<TaskResult>
  async plan(requirements: ProjectRequirements): Promise<OrchestrationPlan>
  getAgentStatus(): AgentStatus[]
}
```

**API Endpoints**:
- `POST /api/agents/build` - Full application build
- `POST /api/agents/execute` - Execute specific task
- `GET /api/agents/status` - Get agent status
- `POST /api/agents/plan` - Create project plan

### Specialized Agents

#### ProjectPlanningAgent

**File**: `project-planning-agent.ts`

**Purpose**: Analyzes requirements and creates comprehensive project plans

**Capabilities**:
- Requirements analysis
- Architecture design
- Technology stack selection
- Risk assessment
- Timeline estimation
- Resource planning

**Output**:
```typescript
interface ProjectPlan {
  architecture: ArchitectureDesign;
  technologies: TechStack;
  phases: ProjectPhase[];
  risks: Risk[];
  timeline: Timeline;
}
```

#### UIDesignAgent

**File**: `ui-design-agent.ts`

**Purpose**: Creates UI/UX designs and component specifications

**Capabilities**:
- Design system creation
- Component design
- Layout planning
- Theme configuration
- Accessibility specifications
- Responsive design

**Output**:
```typescript
interface UIDesign {
  theme: UITheme;
  components: UIComponent[];
  layouts: Layout[];
  styles: StyleGuide;
  accessibility: AccessibilitySpec;
}
```

#### FrontendDevAgent

**File**: `frontend-dev-agent.ts`

**Purpose**: Generates frontend code and components

**Capabilities**:
- React component generation
- Next.js application setup
- State management implementation
- API integration
- Styling (Tailwind, CSS-in-JS)
- Form handling

**Supported Frameworks**:
- React
- Next.js
- Vue
- Svelte
- Angular

#### BackendDevAgent

**File**: `backend-dev-agent.ts`

**Purpose**: Generates backend APIs and business logic

**Capabilities**:
- REST API creation
- GraphQL schema generation
- Authentication/Authorization
- Business logic implementation
- Middleware setup
- Error handling

**Supported Frameworks**:
- Node.js (Express, Hono, Fastify)
- Python (FastAPI, Flask)
- Go
- Rust

#### DatabaseAgent

**File**: `database-agent.ts`

**Purpose**: Designs database schemas and handles data layer

**Capabilities**:
- Schema design
- Migration generation
- Query optimization
- Index strategy
- Data modeling
- ORM configuration

**Supported Databases**:
- PostgreSQL
- MySQL
- MongoDB
- SQLite
- Redis
- Prisma ORM

#### DevOpsAgent

**File**: `devops-agent.ts`

**Purpose**: Handles deployment and infrastructure

**Capabilities**:
- Dockerfile generation
- Docker Compose setup
- Kubernetes manifests
- CI/CD pipeline creation
- Infrastructure as Code
- Monitoring setup

**Supported Platforms**:
- Docker
- Kubernetes
- Cloudflare Workers
- AWS
- Vercel
- Railway

#### TestingAgent

**File**: `testing-agent.ts`

**Purpose**: Creates comprehensive test suites

**Capabilities**:
- Unit test generation
- Integration test creation
- E2E test scenarios
- Test data generation
- Mocking strategies
- Code coverage analysis

**Supported Frameworks**:
- Jest
- Vitest
- Playwright
- Cypress
- React Testing Library

### Agent Communication Flow

```
User Request
     │
     ▼
FullStackAIAssistant
     │
     ├──> ProjectPlanningAgent ──> Creates plan
     │
     ├──> UIDesignAgent ──────────> Designs UI
     │
     ├──> FrontendDevAgent ───────> Generates frontend
     │
     ├──> BackendDevAgent ────────> Generates backend
     │
     ├──> DatabaseAgent ───────────> Designs schema
     │
     ├──> DevOpsAgent ─────────────> Sets up infrastructure
     │
     └──> TestingAgent ────────────> Creates tests
          │
          ▼
     Compiled Result
```

## 3. API Services

### Authentication & Authorization

**Module**: `packages/api/src/modules/auth_billing.ts`

**Endpoints**:
- `POST /auth/guest` - Create guest JWT (RS256)
- `GET /.well-known/jwks.json` - JWKS public keys

**Features**:
- JWT-based authentication (RS256)
- Guest user support
- JWKS key distribution
- Token validation middleware

### Billing & Credits

**Module**: `packages/api/src/modules/auth_billing.ts`

**Endpoints**:
- `GET /api/billing/balance` - Get user credit balance
- `GET /api/billing/usage` - Get usage history
- `POST /api/credits/adjust` - Adjust credits (admin only)

**Features**:
- Credit-based billing
- Token usage tracking
- Usage metering headers (`X-Tokens-In`, `X-Tokens-Out`, `X-Credits-Used`)
- Per-request credit deduction

### Voice & Preferences

**Endpoints**:
- `GET /api/voice/prefs` - Get voice preferences
- `PUT /api/voice/prefs` - Update voice preferences

**Storage**: KV namespace `KV_PREFS`

### File Upload

**Endpoints**:
- `POST /api/upload/direct` - Direct R2 upload

**Features**:
- Direct browser-to-R2 upload
- Size limits (10MB default)
- Authentication required
- Usage metering

### Jobs System

**Module**: `packages/api/src/modules/auth_billing.ts`

**Endpoints**:
- `POST /admin/process-one` - Process job (admin only)

**Features**:
- Background job queue
- KV-based storage
- TTL-based expiration
- Admin processing endpoint

### RAG (Retrieval-Augmented Generation)

**Module**: `packages/api/src/rag/`

**Endpoints**:
- `POST /api/admin/rag-rank` - Local embeddings ranking (admin only)

**Features**:
- Local embeddings generation
- Semantic search
- Reranking capabilities
- Cost optimization

## 4. Provider Services

### AI Provider Routing

**Module**: `packages/api/src/qualityRouter.ts`

**Supported Providers**:
1. **Groq** - Fast inference (llama-3.1-8b-instant)
2. **Cloudflare AI** - Workers AI (@cf/meta/llama-3.1-8b-instruct)
3. **OpenAI** - GPT models (gpt-4o-mini)

**Provider Guard**: `packages/api/src/providerGuard.ts`
- Enforces allow-list
- Environment-driven configuration
- Prevents unauthorized provider usage

### Local LLM Support

**Module**: `packages/api/src/providers/localLLM.ts`

**Purpose**: OpenAI-compatible local LLM integration

**Supported**:
- vLLM
- llama.cpp server
- LocalAI
- Ollama

## 5. Infrastructure Services

### Cloudflare Workers Bindings

- **AI**: Workers AI for inference
- **KEYS**: KV namespace for JWKS
- **KV_BILLING**: Credits, usage, jobs
- **KV_PREFS**: User preferences
- **R2_UPLOADS**: File storage

### CORS & Headers

**Implementation**: Global CORS middleware

**Features**:
- Environment-driven origins (`ALLOWED_ORIGINS`)
- Proper preflight handling
- Header exposure for billing/usage
- Request-ID propagation (`X-Request-Id`)

### Observability

**Headers**:
- `X-Request-Id` - Request tracking
- `X-Provider` - AI provider used
- `X-Model` - Model identifier
- `X-Tokens-In` - Input tokens
- `X-Tokens-Out` - Output tokens
- `X-Credits-Used` - Credits deducted
- `X-Credits-Balance` - Remaining credits

## 6. Builder Service

The Builder is a real-time application generation interface integrated with the multi-agent system.

**Component**: `packages/frontend/src/components/LaunchInBuilder.tsx`

**Features**:
- Real-time app generation
- Voice input support
- Skill selection (Codegen+, tests, security, etc.)
- Direct integration with agents
- Live preview

**Skills Available**:
- Codegen+
- Unit test generation
- E2E test generation
- Security scanning
- Refactor suggestions
- Typed API clients
- i18n scaffolding
- Analytics wiring
- Performance budgets
- Documentation generation
- Error boundaries
- Playwright specs
- RAG scaffolding

**Deployment**: Cloudflare Pages at `builder.cognomega.com`

## Service Communication

### Internal Communication

```
Frontend ──HTTP──> API (Workers)
              │
              ├──> SI Engine (in-process)
              │
              ├──> Multi-Agent System (in-process)
              │
              ├──> KV Namespaces
              │
              └──> R2 Storage
```

### External Communication

```
API ──HTTP──> Groq API
    ──HTTP──> OpenAI API
    ──HTTP──> Local LLM (optional)
    ──HTTP──> Inference Service (optional)
```

## Deployment Architecture

```
GitHub
  │
  ├──> Actions (CI/CD)
  │
  ├──> Cloudflare Workers (API)
  │     ├── Workers AI
  │     ├── KV Namespaces
  │     └── R2 Buckets
  │
  └──> Cloudflare Pages (Frontend/Builder)
```

## Security Considerations

1. **Provider Guard**: Only allowed providers can be used
2. **Admin Endpoints**: Header-based authentication
3. **Rate Limiting**: Per-user credit system
4. **CORS**: Strict origin validation
5. **JWT**: RS256 signatures, short TTL
6. **Input Validation**: All endpoints validate input

## Performance Characteristics

- **API Response Time**: < 500ms (excluding LLM inference)
- **LLM Inference**: 1-5s (provider dependent)
- **Multi-Agent Build**: 10-60s (complexity dependent)
- **Frontend Load**: < 2s (Cloudflare CDN)

## Monitoring & Health

**Health Endpoint**: `GET /ready`

Returns:
```json
{
  "ok": true,
  "provider": "groq",
  "model": "llama-3.1-8b-instant"
}
```

**Uptime Monitoring**: GitHub Actions workflow (5-minute intervals)

---

*See also*:
- [Builder Service](./builder.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Best Practices](./best-practices.md)
- [MULTI_AGENT_ARCHITECTURE.md](../../MULTI_AGENT_ARCHITECTURE.md)
