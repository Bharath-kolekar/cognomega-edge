```markdown
# Cognomega — Full-Stack AI App Maker (Source of Truth 1/6)

> Mission: ship a **production-grade**, **cost-efficient**, **super-intelligent** full-stack application maker with deep AI integration (chat/voice/omni), end-to-end automation, and strict GitHub-only releases — **without dropping any v0 features**.

This README is one of **six** canonical documents. It links to the other five and gives a precise, reproducible path to run, validate, and ship Cognomega from Windows (PowerShell).

- Source of Truth Docs (exactly 6):
  1. **README.md** (this file) — quickstart, rules, commands, links
  2. **OPS.md** — operating rules, support/SLA, incident, runbooks, SLOs
  3. **architecture.md** — everything about platform & module design
  4. **ci-cd.md** — branch policy, pipelines, environments, release
  5. **tasks.md** — decisions log, tasks, status, ownership
  6. **roadmap.md** — milestones & scope (delivery targets only)

> All other docs/scripts are referenced through these six. No drift.

---

## 🔒 Non-Negotiable Operating Rules (Locked)

- **Never drop features** or logic from any existing file without explicit confirmation.
- **No hacks, no shims, no temp fixes** — always root-cause and **permanent** solutions.
- **One step of one task at a time**; verify output before next step.
- **No assumptions**; verify first, change later.
- **100% consistency**: detect and remove drifts, loopholes, pitfalls.
- **GitHub-only deploys** (no direct deploys). All prod code flows via PR → main → release.
- **PowerShell on Windows** only for scripts/commands in docs (no bash).
- **No BOM** in committed text files.
- **No `gen-jwt`/`genJwt`** helpers or similar shortcuts.
- **Maximum of 6 source-of-truth docs** until v1 prod is live.
- **Keep everything from v0 import** (UI/UX, voice assistant + integrations, 8 super-intelligence layers, omni intelligence, etc.). Improve, don’t remove.

See **OPS.md** for the detailed contract.

---

## 🧭 Microservices Monorepo Architecture

Cognomega is structured as a monorepo supporting multiple independent microservices, each deployable separately:

```
cognomega-edge/
├─ packages/
│  ├─ api/          # @cognomega/api - Cloudflare Worker API microservice
│  ├─ frontend/     # @cognomega/frontend - Main UI application
│  ├─ builder/      # @cognomega/builder - Realtime app builder UI
│  ├─ si-core/      # @cognomega/si-core - Shared intelligence library
│  └─ inference/    # Python-based AI inference service (Docker)
├─ scripts/         # Windows PowerShell utilities (validation, listing)
├─ .github/         # CI/CD workflows (see ci-cd.md)
└─ README.md, OPS.md, architecture.md, ci-cd.md, tasks.md, roadmap.md
```

### 📦 Microservices Overview

#### **@cognomega/api** (Cloudflare Worker)
- **Port**: 8787 (dev)
- **Runtime**: Cloudflare Workers Edge
- **Purpose**: Core API, auth, billing, AI orchestration
- **Tech**: Hono framework, TypeScript
- **Deploy**: Cloudflare Workers (GitHub Actions)
- **README**: [packages/api/README.md](./packages/api/README.md)

#### **@cognomega/frontend** (Main UI)
- **Port**: 5174 (dev)
- **Deploy**: Cloudflare Pages / Static hosting
- **Purpose**: Primary application interface
- **Tech**: React 18, Vite, TypeScript
- **Features**: Full-featured builder, AI assistant, voice interface
- **README**: [packages/frontend/README.md](./packages/frontend/README.md)

#### **@cognomega/builder** (Realtime Builder)
- **Port**: 5175 (dev)
- **Deploy**: Cloudflare Pages / Static hosting
- **Purpose**: Interactive app builder with live preview
- **Tech**: React 18, Vite, Monaco Editor
- **Features**: Real-time code generation, live preview
- **README**: [packages/builder/README.md](./packages/builder/README.md)

#### **@cognomega/si-core** (Shared Library)
- **Type**: TypeScript library (workspace dependency)
- **Purpose**: Super intelligence core, multi-agent system, shared types
- **Tech**: TypeScript, ES2020 modules
- **Features**: 8 layers of AI intelligence, agent orchestration
- **README**: [packages/si-core/README.md](./packages/si-core/README.md)

#### **inference** (AI Inference Service)
- **Port**: 8080 (configurable)
- **Deploy**: Docker / Kubernetes
- **Purpose**: Python-based AI model serving
- **Tech**: Python, FastAPI, Docker
- **Features**: Custom model inference, embeddings
- **README**: [packages/inference/README.md](./packages/inference/README.md)

### 🔗 TypeScript Project References

All packages use TypeScript project references for:
- Fast incremental builds
- Cross-package type checking
- Proper dependency ordering
- IDE intelligence across packages

Each package has `composite: true` and references dependencies via `workspace:*` protocol.

### 🛠️ Workspace Commands

**Build all packages:**
```powershell
pnpm run build
```

**Type check all packages:**
```powershell
pnpm run typecheck
```

**Develop specific microservice:**
```powershell
pnpm dev:api        # Start API service (port 8787)
pnpm dev:frontend   # Start frontend UI (port 5174)
pnpm dev:builder    # Start builder UI (port 5175)
```

**Build individual package:**
```powershell
pnpm -C packages/api build
pnpm -C packages/frontend build
pnpm -C packages/builder build
pnpm -C packages/si-core build
```

**Verify entire monorepo:**
```powershell
pnpm run verify     # Typecheck + lint + build all
```

### 🎯 Independent Development

Each microservice can be developed independently:

1. **Navigate to package**:
   ```powershell
   cd packages/frontend
   ```

2. **Install dependencies** (if needed):
   ```powershell
   pnpm install
   ```

3. **Run development server**:
   ```powershell
   pnpm dev
   ```

4. **Build for production**:
   ```powershell
   pnpm build
   ```

### 🚀 Independent Deployment

Each microservice deploys independently:

- **API**: Deploys to Cloudflare Workers via GitHub Actions
- **Frontend**: Deploys to Cloudflare Pages or static hosting
- **Builder**: Deploys to Cloudflare Pages or static hosting  
- **SI-Core**: Published as workspace dependency (no separate deploy)
- **Inference**: Deploys as Docker container to Kubernetes/Docker Compose

All production deploys **must** go through GitHub (see ci-cd.md).

### 📚 Contributing to Microservices

When working on a specific microservice:

1. **Read the package README**: Each package has comprehensive documentation
2. **Check type safety**: Run `pnpm typecheck` before committing
3. **Update shared types**: If changing si-core, rebuild dependent packages
4. **Test locally**: Run the dev server and verify functionality
5. **Follow conventions**: Match existing patterns in each package

### 🔐 Microservices Integration

Microservices communicate via:
- **HTTP/REST**: Frontend/Builder → API
- **Workspace imports**: All packages → si-core types
- **Environment variables**: Configuration per service
- **CORS**: API configured for frontend/builder origins

### 🏗️ Adding New Microservices

To add a new microservice package:

1. Create directory: `packages/new-service/`
2. Add `package.json` with scoped name: `@cognomega/new-service`
3. Add `tsconfig.json` with `composite: true`
4. Add to root `tsconfig.json` references
5. Update `pnpm-workspace.yaml` (usually auto-detected)
6. Create comprehensive README.md
7. Document integration points

---

## 🧩 Prerequisites (Windows)

- **Node.js 22.x** (LTS compatible)  
- **pnpm 10.x**  
- **Cloudflare Wrangler 4.40+**  
- **PowerShell 7.x** (recommended)  
- Optional for local LLM/RAG quality parity (see *Local AI* below):
  - Docker Desktop (for qdrant/open-source rerank/embedding servers)
  - Or a local “OpenAI-compatible” HTTP gateway (e.g., vLLM, llama.cpp server, text-embedding server)

---

## 🚦 First-Time Setup (Windows, PowerShell)

> **GitHub-only deploy:** clone from GitHub; do not patch prod via local deploys.

```powershell
# 1) Clone & install
Set-Location C:\dev
git clone https://github.com/<YOUR_ORG_OR_USER>/cognomega-edge.git
Set-Location C:\dev\cognomega-edge
pnpm install

# 2) Create .dev.vars for the API worker (secrets stay local)
$vars = @'
# ===== Core CORS & JWT =====
ALLOWED_ORIGINS=https://app.cognomega.com,https://www.cognomega.com,https://cognomega.com,https://cognomega-frontend.pages.dev,http://localhost:5173,http://127.0.0.1:5173
ISSUER=https://api.cognomega.com
JWT_TTL_SEC=3600
KID=k1

# ===== Billing & uploads =====
CREDIT_PER_1K=0.05
WARN_CREDITS=5
MAX_UPLOAD_BYTES=10485760

# ===== Local-only guard (dev) =====
ALLOW_PROVIDERS=local
PREFERRED_PROVIDER=local
# Local chat completion gateway (example; used by local routes only)
LOCAL_LLM_URL=http://127.0.0.1:8000/v1/chat/completions

# ===== Local embeddings/reranker (optional but recommended) =====
LOCAL_EMBED_URL=http://127.0.0.1:8000/v1/embeddings
LOCAL_EMBED_MODEL=nomic-embed-text-v1.5
# LOCAL_RERANK_URL=http://127.0.0.1:8000/v1/rerank
# LOCAL_API_KEY=your_local_token_if_required

# ===== Admin keys (development only) =====
# For /api/admin/* secured calls:
ADMIN_API_KEY=dev-admin-please-override
ADMIN_TASK_SECRET=dev-task-trigger-key

# ===== Optional external providers (omit if local-only) =====
# OPENAI_API_KEY=...
# GROQ_API_KEY=...
'@
Set-Content -Encoding UTF8 -NoNewline -LiteralPath C:\dev\cognomega-edge\packages\api\.dev.vars -Value $vars
````

> `.dev.vars` is auto-loaded by Wrangler/Miniflare and becomes `env.*` at runtime **only in local dev**.

---

## ▶️ Run Locally

**API (Wrangler dev on port 8787):**

```powershell
Set-Location C:\dev\cognomega-edge\packages\api
npx wrangler dev --port 8787
```

**Frontend (Vite dev on 5173):**

```powershell
Set-Location C:\dev\cognomega-edge\packages\frontend
pnpm run dev
# open http://localhost:5173
```

---

## 🧪 Validate, Typecheck, Build, Test

**Single-package checks:**

```powershell
# API
pnpm -C packages/api run build          # dry-run bundle via wrangler
# Frontend
pnpm -C packages/frontend run typecheck
pnpm -C packages/frontend run build
# SI core
pnpm -C packages/si-core run typecheck
pnpm -C packages/si-core run build
```

**Workspace verify:**

```powershell
Set-Location C:\dev\cognomega-edge
pnpm run verify
```

**Validator (drift/consistency checks) + capture log:**

```powershell
Set-Location C:\dev\cognomega-edge
$ts  = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = "C:\dev\validate-$ts.txt"
.\scripts\validate.ps1 2>&1 | Tee-Object -FilePath $log | Out-Null
Write-Host "`nSaved: $log"
```

---

## 🧠 Local AI (Embeddings/Reranker, High-Quality RAG)

You can keep development entirely **local** while preserving search/RAG quality:

* **Embeddings:** point `LOCAL_EMBED_URL` to an OpenAI-compatible `/v1/embeddings` endpoint (e.g., vLLM, llama.cpp embedding server, or a slim embeddings microservice).
* **Reranker:** if `LOCAL_RERANK_URL` is unavailable, the API automatically falls back to **embedding-based cosine similarity** (works offline). For **best quality**, run a local rerank server and set `LOCAL_RERANK_URL`.

> The public endpoints are **unchanged**. Local ranking is accessed through **admin-only** helper routes or internal code paths — safe for production posture while enabling high-fidelity development.

**Admin-only test (RAG rank):**

```powershell
# Terminal 1 (API): npx wrangler dev --port 8787  (see above)
# Terminal 2 (client):
$ADMIN_API_KEY = Read-Host 'Enter ADMIN_API_KEY'
$uri = 'http://127.0.0.1:8787/api/admin/rag-rank'

$docs = @(
  @{ id="a"; text="This document explains account password reset steps." }
  @{ id="b"; text="Unrelated: shipping timelines and returns." }
  @{ id="c"; text="Support guide: to reset your password, click Forgot Password." }
)
$body = @{ query="how to reset a password"; docs=$docs; topK=2 } | ConvertTo-Json -Depth 6

$response = Invoke-RestMethod -Uri $uri -Method POST `
  -ContentType 'application/json' `
  -Headers @{ 'x-admin-key' = $ADMIN_API_KEY } `
  -Body $body

$response | ConvertTo-Json -Depth 10
```

---

## 🌐 CORS, Request-Id, and Headers

* **CORS allowlist** driven by `ALLOWED_ORIGINS` (exact matches), Pages preview, and local dev.
* **Request-Id** is added to **every** response (`X-Request-Id`); exposed headers include:

  * `X-Credits-Used`, `X-Credits-Balance`, `X-Tokens-In`, `X-Tokens-Out`, `X-Provider`, `X-Model`
* Preflight handled at the **top** of the Hono app; unified layer avoids duplication.

---

## 🤖 Multi-Agent AI System

**New in this release:** A comprehensive multi-agent AI system that coordinates specialized agents to build complete full-stack applications.

### Architecture

The system consists of 8 specialized agents:

1. **FullStackAIAssistant (Orchestrator)** - Coordinates all specialized agents and manages workflow
2. **ProjectPlanningAgent** - Analyzes requirements, creates project plans, assesses risks
3. **UIDesignAgent** - Creates UI/UX designs, component specifications, themes
4. **FrontendDevAgent** - Implements frontend components (React/Next.js/Vue)
5. **BackendDevAgent** - Develops backend APIs and business logic
6. **DatabaseAgent** - Designs schemas, migrations, and data access layers
7. **DevOpsAgent** - Handles deployment, CI/CD, containerization
8. **TestingAgent** - Generates unit, integration, and E2E tests

### API Endpoints

```powershell
# Get agent system status
Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/agents/status'

# Build a full-stack project
$requirements = @{
  name = "E-Commerce Platform"
  description = "Modern e-commerce with cart and checkout"
  framework = "Next.js"
  targetPlatform = "fullstack"
  features = @("Product catalog", "Shopping cart", "User auth", "Admin dashboard")
  techStack = @{
    frontend = @("next.js", "react", "tailwindcss")
    backend = @("node.js", "express")
    database = @("postgresql")
  }
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/agents/build' `
  -Method POST -ContentType 'application/json' -Body $requirements

# Get agent health status
Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/agents/health'

# Create a project plan only
$planReq = @{
  requirements = @{
    name = "Blog Platform"
    description = "Personal blog with markdown support"
    framework = "Next.js"
    features = @("Blog posts", "Comments", "Search")
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/agents/plan' `
  -Method POST -ContentType 'application/json' -Body $planReq
```

### Using from Code

```typescript
import { 
  createFullStackAssistant, 
  ProjectRequirements 
} from '@cognomega/si-core';

async function buildApp() {
  const assistant = createFullStackAssistant();
  await assistant.initialize();

  const requirements: ProjectRequirements = {
    name: 'My App',
    description: 'A modern web application',
    framework: 'Next.js',
    targetPlatform: 'fullstack',
    features: ['Authentication', 'Dashboard', 'API'],
  };

  const task = {
    id: 'build-1',
    type: 'orchestrator',
    payload: { requirements },
    priority: 10,
    createdAt: Date.now(),
  };

  const result = await assistant.execute(task);
  console.log('Build result:', result);
}
```

### Integration with SuperIntelligenceEngine

The multi-agent system is fully integrated with the existing SuperIntelligenceEngine:

```typescript
import { 
  SuperIntelligenceEngine,
  registerMultiAgentSystem 
} from '@cognomega/si-core';

// Create engine and register agents
const engine = new SuperIntelligenceEngine();
registerMultiAgentSystem(engine);

// Use through the engine
const response = engine.process({
  text: 'Build a React e-commerce application',
  agents: ['fullstack-assistant'],
});
```

### Documentation

Comprehensive documentation is available:

* **Multi-Agent System Guide**: [`packages/si-core/src/v0/agents/README.md`](./packages/si-core/src/v0/agents/README.md)
* **Example Usage**: [`packages/si-core/src/v0/agents/example-usage.ts`](./packages/si-core/src/v0/agents/example-usage.ts)
* **API Routes**: [`packages/api/src/routes/agents.ts`](./packages/api/src/routes/agents.ts)

### Key Features

* **Intelligent Orchestration**: Automatically determines optimal task execution order
* **Dependency Management**: Handles complex task dependencies
* **Type Safety**: Full TypeScript support with comprehensive type definitions
* **Error Handling**: Graceful degradation and detailed error reporting
* **Monitoring**: Real-time agent health and status tracking
* **Extensible**: Easy to add custom agents
* **Compatible**: Seamless integration with existing Cognomega architecture

---

## 🧾 Billing/Usage & Credits

* `/api/billing/balance`, `/api/billing/usage`, and legacy aliases (e.g., `/api/credits`) are present and kept.
* Credits are charged per tokens in/out (default `CREDIT_PER_1K=0.05` credits per 1k tokens).
* Low balance guard: returns `402` with `insufficient_credits` error.

See **architecture.md** for the pricing/costing model and **OPS.md** for SLAs.

---

## 🔐 Admin & Jobs

* `POST /admin/process-one` — internal job processor (requires `x-admin-key` or `x-admin-task`).
* Cron trigger runs every 5 minutes (max 5 jobs/tick).
* R2 upload/download helpers included; jobs table in Neon/Postgres maintained with indexes.

---

## 🧬 SI Entry Point (Chat & Skills)

* `POST /api/si/ask`:

  * **Queueable** skill `sketch_to_app`: enqueues a job, triggers internal processor immediately, 202 Accepted with `X-Job-Id`.
  * **Non-queued** skills (e.g., `summarize`, `translate`, `rag_lite`) go through the multi-provider LLM router.
  * **Chat-style** payloads are delegated to `routes/siAsk` for richer orchestration (kept and mounted).
* Usage and credit debits are recorded uniformly.

---

## 🧱 Provider Allow-List (Local-Only Lock)

To lock dev to **local only**, set:

```
ALLOW_PROVIDERS=local
PREFERRED_PROVIDER=local
```

The runtime guard enforces this and blocks remote providers in dev. Public API shape is unchanged.

---

## 🔁 GitHub-Only Release Flow (Short)

* Create/change via branch → PR → CI checks → merge to main → GitHub Action deploys staging/prod.
* No direct production deploys from developer machines.
* See **ci-cd.md** for full pipeline, environments, and rollback steps.

---

## 🧩 v0 Import — Preservation Guarantee

All v0 content (UI/UX, voice assistant/integrations, 8 layers of super-intelligence, omni intelligence, and the full **239** imported files) is preserved. Enhancements are additive. If something must change, we will call it out **explicitly** and obtain confirmation before proceeding.

---

## 🧰 Useful PowerShell Helpers

List wrangler configs:

```powershell
Set-Location C:\dev\cognomega-edge
.\scripts\list-wrangler.ps1
# Or:
.\scripts\list-wrangler.ps1 -Root "C:\dev" -OutCsv "C:\dev\wrangler-report.csv"
```

Re-run validator and collect FAIL lines:

```powershell
Set-Location C:\dev\cognomega-edge
$ts  = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = "C:\dev\validate-$ts.txt"
.\scripts\validate.ps1 2>&1 | Tee-Object -FilePath $log | Out-Null
Select-String -Path $log -Pattern '^\[FAIL\]' | ForEach-Object { $_.Line }
```

---

## 📚 Deep Dives

* [OPS.md](./OPS.md) — Operating contract, SLAs/SLOs, incident, runbooks.
* [architecture.md](./architecture.md) — Modules, data flows, models, RAG, security.
* [ci-cd.md](./ci-cd.md) — Branch strategy, checks, environments, releases.
* [tasks.md](./tasks.md) — Decisions, tasks, statuses, owners (single source of tasks).
* [roadmap.md](./roadmap.md) — Milestones, scope, when/what and acceptance.

---

## 🆘 Support

For any inconsistency or suspected drift, open a GitHub issue labeled **type:drift** with:

* Repro steps
* Expected vs actual
* Logs (`validate-*.txt`, Wrangler console excerpts)
* File paths and commit SHA

We will triage within the SLA windows defined in **OPS.md**.

---

```