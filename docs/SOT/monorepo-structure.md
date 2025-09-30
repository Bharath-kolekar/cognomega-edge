# Monorepo Structure

## Overview

Cognomega Edge is organized as a monorepo using **pnpm workspaces**. This structure enables code sharing, consistent tooling, and simplified dependency management across all packages.

## Directory Layout

```
cognomega-edge/
├── .github/                    # GitHub Actions workflows and templates
│   ├── workflows/             # CI/CD pipeline definitions
│   │   ├── ci.yml            # Continuous integration
│   │   ├── deploy.yml        # API deployment to Cloudflare Workers
│   │   ├── deploy-api.yml    # Dedicated API deployment
│   │   ├── deploy-frontend.yml  # Frontend deployment to Pages
│   │   └── deploy-builder.yml   # Builder deployment
│   ├── copilot-instructions.md  # GitHub Copilot configuration
│   └── pull_request_template.md # PR template
│
├── packages/                  # Main workspace packages
│   ├── api/                  # Cloudflare Worker API (Hono framework)
│   ├── frontend/             # Vite + React main application
│   ├── si-core/              # Shared TypeScript library (AI/Intelligence)
│   └── inference/            # Python-based inference service
│
├── docs/                      # Documentation
│   └── SOT/                  # Source of Truth documentation suite
│       ├── README.md
│       ├── 00-RULES.md       # Non-negotiable rules
│       ├── monorepo-structure.md
│       ├── microservices.md
│       ├── builder.md
│       ├── development-workflow.md
│       ├── ci-cd.md
│       ├── best-practices.md
│       ├── contribution-guide.md
│       └── migration-history.md
│
├── scripts/                   # PowerShell utilities (Windows-first)
├── imports/                   # Legacy v0 imports (preserved)
├── _reports/                  # Build and validation reports
├── _ops/                      # Operations snapshots and proofs
│
├── README.md                  # Main documentation (SOT 1/6)
├── OPS.md                     # Operations runbook (SOT 2/6)
├── architecture.md            # System architecture (planned)
├── ci-cd.md                   # CI/CD documentation (planned)
├── tasks.md                   # Task tracking (planned)
├── roadmap.md                 # Product roadmap (planned)
│
├── package.json               # Root package configuration
├── pnpm-workspace.yaml        # Workspace configuration
├── pnpm-lock.yaml            # Dependency lock file
├── tsconfig.json             # TypeScript configuration
└── eslint.config.js          # ESLint configuration

```

## Package Details

### 1. `packages/api/` - Cloudflare Worker API

**Purpose**: Production API running on Cloudflare Workers using Hono framework

**Key Files**:
```
api/
├── src/
│   ├── index.ts              # Main worker entry point
│   ├── modules/
│   │   └── auth_billing.ts   # Auth & billing module
│   ├── routes/
│   │   ├── siAsk.ts          # Super Intelligence endpoints
│   │   └── agents.ts         # Multi-agent system endpoints
│   ├── rag/
│   │   ├── local.ts          # Local embeddings/reranker
│   │   └── pipeline.ts       # RAG pipeline
│   ├── providers/
│   │   └── localLLM.ts       # Local LLM provider
│   ├── codegen.ts            # Code generation logic
│   ├── qualityRouter.ts      # Quality routing
│   └── providerGuard.ts      # Provider allow-list enforcement
├── wrangler.toml             # Cloudflare Worker configuration
├── package.json
└── tsconfig.json
```

**Tech Stack**:
- Runtime: Cloudflare Workers
- Framework: Hono
- Language: TypeScript
- Bindings: Workers AI, KV, R2

**Environment Requirements**:
- `AI` - Workers AI binding
- `KEYS` - KV namespace (JWKS storage)
- `KV_BILLING` - KV namespace (credits, usage, jobs)
- `KV_PREFS` - KV namespace (user preferences)
- `R2_UPLOADS` - R2 bucket (file uploads)

### 2. `packages/frontend/` - Vite + React Application

**Purpose**: Main user-facing application (Cognomega Builder UI)

**Key Files**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── LaunchInBuilder.tsx  # Builder launch interface
│   │   └── ...
│   ├── pages/
│   ├── hooks/
│   └── utils/
├── functions/              # Cloudflare Pages Functions
│   └── auth/
│       └── guest.ts        # Guest authentication
├── public/                 # Static assets
├── index.html             # Entry HTML
├── vite.config.ts         # Vite configuration
├── package.json
└── tsconfig.json
```

**Tech Stack**:
- Build Tool: Vite 5.x
- Framework: React 18.x
- Router: React Router 7.x
- Styling: Tailwind CSS 4.x
- Deployment: Cloudflare Pages

**Key Features**:
- Real-time app builder interface
- Voice assistant integration
- Multi-agent AI interaction
- Direct R2 upload capabilities

### 3. `packages/si-core/` - Super Intelligence Core Library

**Purpose**: Shared TypeScript library containing AI agents and intelligence layers

**Key Files**:
```
si-core/
├── src/
│   └── v0/
│       └── agents/
│           ├── fullstack-ai-assistant.ts  # Main orchestrator
│           ├── project-planning-agent.ts  # Planning agent
│           ├── ui-design-agent.ts         # UI design agent
│           ├── frontend-dev-agent.ts      # Frontend agent
│           ├── backend-dev-agent.ts       # Backend agent
│           ├── database-agent.ts          # Database agent
│           ├── devops-agent.ts            # DevOps agent
│           ├── testing-agent.ts           # Testing agent
│           ├── base-agent.ts              # Base agent class
│           ├── types.ts                   # Shared types
│           ├── integration.ts             # Integration layer
│           ├── example-usage.ts           # Usage examples
│           └── README.md                  # Agent documentation
├── package.json
└── tsconfig.json
```

**Tech Stack**:
- Language: TypeScript
- Export Type: ESM
- Shared by: API and Frontend

**Key Capabilities**:
- 8 layers of super intelligence
- Multi-agent orchestration
- Project planning and architecture
- UI/UX design generation
- Full-stack code generation

### 4. `packages/inference/` - Python Inference Service

**Purpose**: Optional Python-based inference service for local AI models

**Key Files**:
```
inference/
├── app/                    # FastAPI application
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Service orchestration
├── requirements.txt       # Python dependencies
└── ...
```

**Tech Stack**:
- Language: Python
- Framework: FastAPI (likely)
- Deployment: Docker

**Use Cases**:
- Local embedding generation
- Local reranking
- Cost optimization for high-volume operations

## Workspace Configuration

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
```

This configuration enables:
- Shared dependencies across packages
- Workspace protocol for internal package references
- Unified version management
- Single lock file for entire monorepo

### Root `package.json`

```json
{
  "name": "cognomega-edge",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@10.15.1",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:api": "pnpm --filter api dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "build:api": "pnpm --filter api build",
    "build:frontend": "pnpm --filter frontend build"
  }
}
```

## Shared Configuration Files

### TypeScript (`tsconfig.json`)

Root-level TypeScript configuration inherited by all packages:
- Strict mode enabled
- ESM module resolution
- Path aliases configured
- Composite project support

### ESLint (`eslint.config.js`)

Shared linting rules across all TypeScript/JavaScript code:
- TypeScript ESLint parser
- React plugin for frontend
- Consistent code style
- Custom rules for project

### Tailwind CSS

Shared styling configuration:
- Design tokens
- Custom utilities
- Component classes
- Responsive breakpoints

## Import/Export Strategy

### Internal Package References

Packages reference each other using workspace protocol:

```json
{
  "dependencies": {
    "@cognomega/si-core": "workspace:*"
  }
}
```

### External Dependencies

Managed at package level with shared versions where possible:
- React ecosystem: Consistent versions
- Build tools: Latest stable
- Testing: Jest/Vitest uniformly

## Legacy Structure (`imports/v0-*`)

The `imports/` directory contains preserved code from v0:
- **Purpose**: Historical reference and feature preservation
- **Status**: Read-only, not actively developed
- **Value**: Contains original implementation of all features
- **Policy**: Never delete (per 00-RULES.md)

## Scripts Directory

PowerShell utilities for Windows development:
- Validation scripts
- Build helpers
- Deployment utilities
- Testing automation

**Important**: All scripts are PowerShell (not bash) per operating rules.

## Reports and Operations

### `_reports/`
Build and validation output:
- Import statistics
- Test results
- Build logs

### `_ops/`
Operational snapshots:
- Deployment proofs
- Health check results
- Configuration backups

## File Organization Principles

1. **Separation of Concerns**: Each package has a single, clear responsibility
2. **Colocation**: Related code lives together
3. **Convention over Configuration**: Predictable structure
4. **Documentation**: README.md at every significant level
5. **No Build Artifacts**: All output excluded from git

## Adding New Packages

To add a new package:

1. Create directory under `packages/`
2. Add `package.json` with appropriate name
3. Create `tsconfig.json` extending root config
4. Add to workspace (automatic with pnpm-workspace.yaml)
5. Update relevant documentation
6. Add CI/CD workflow if needed

See [development-workflow.md](./development-workflow.md) for details.

## Cross-Package Dependencies

```
┌──────────┐
│   API    │──────┐
└──────────┘      │
      │           ├──> si-core (shared intelligence)
      │           │
┌──────────┐      │
│ Frontend │──────┘
└──────────┘

┌──────────┐
│Inference │ (optional, external service)
└──────────┘
```

- **API** uses `si-core` for AI agents
- **Frontend** uses `si-core` for client-side intelligence
- **Inference** is standalone, called via HTTP

## Build Output

Each package manages its own build output:

- **API**: No build step (TypeScript run directly by Wrangler)
- **Frontend**: `dist/` directory (Vite output)
- **si-core**: `dist/` directory (compiled TypeScript)

All build outputs are gitignored.

---

*See also*:
- [Development Workflow](./development-workflow.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Best Practices](./best-practices.md)
