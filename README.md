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

## 🧭 Monorepo Layout

```

cognomega-edge/
├─ packages/
│  ├─ api/          # Cloudflare Worker (Hono) — API, auth/billing, jobs, SI routes
│  ├─ frontend/     # Vite + React app (Cognomega Builder UI)
│  └─ si-core/      # Shared TypeScript library (skills/intelligence core)
├─ scripts/         # Windows PowerShell utilities (validation, listing, etc.)
├─ .github/         # CI/CD workflows (see ci-cd.md)
└─ README.md, OPS.md, architecture.md, ci-cd.md, tasks.md, roadmap.md

````

**Key API additions (kept and expanded):**
- Global CORS + Request-Id, unified headers exposure
- **Auth/Billing/Usage** module mounted (`modules/auth_billing`)
- **/api/si/ask** chat/skills entry point (delegates to `routes/siAsk` where applicable)
- **/api/admin/rag-rank** (admin-only) — local embeddings/reranker ranking for RAG quality parity
- **Voice prefs** KV APIs: `GET/PUT /api/voice/prefs`
- **Jobs** queue + **/admin/process-one** (secured by header key)
- **JWKS** served from KV at `/.well-known/jwks.json`
- Local provider **allowlist guard** (env-driven) — enforces `local` only when desired

Everything above is implemented without deleting your existing behavior.

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