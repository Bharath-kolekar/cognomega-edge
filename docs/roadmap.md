# Cognomega — Major Roadmap (Single Source of Truth)

> **Principles**
> - **Microservices, not monoliths** (Cloudflare Workers + KV/R2/Queues + Neon).
> - **GitHub-only deploys** to `main` (no direct CF edits).
> - **One API route owner** for `api.cognomega.com/*` (`cognomega-api` Worker).
> - **KV is the source of truth** for credits/usage/jobs (Neon rollup later).
> - **Voice-first, AI-first** creation & operations.
> - **PowerShell-only ops commands** in docs.
> - **All changes carry proofs** (OPS route audit, CORS/JWKS/AI probes).
> - **Service Bindings for scale** — public **gateway** calls internal workers; internal workers have **no public routes**.

This roadmap maps to `docs/tasks.md` task IDs and defines **milestones**, **acceptance gates**, and **risk controls**. Treat it as the canonical plan document.

---

## 0) Stabilization (Continuous)

**Objective**: Keep production stable and consistent while we build.

- Route ownership: `api.cognomega.com/*` → `cognomega-api` only (no Pages or other Worker collisions).
- JWKS & RS256 guest tokens verified (`/.well-known/jwks.json`, `/auth/guest`).
- CORS headers stable; SI exposed billing headers readable by frontend.
- GitHub-only; any route/DNS change requires proofs in `ops/proofs/`.

**Acceptance gates**
- OPS probes pass: **Preflight**, **JWKS head**, **AI binding**, **`/auth/guest` RS256**.
- `git status` clean; no dev artifacts tracked.
- `api/wrangler.toml` has exactly **one** `routes` entry for the API hostname.
- Proof file committed for each routing/headers change (`ops/proofs/*.txt`).

**Linked tasks**: TSK-P-1, TSK-C-1…C-4.

**SLO guardrails**
- p95 preflight < **100 ms**; p95 `/api/si/ask` < **1.2 s** via Workers AI route.

---

## Phase A — Differentiators (Ship first)

### A1. App Graph + Scaffold (TSK-A-1, P0)
**Outcome**: A structured **App Graph** (pages, components, services, data models, queues, routes) that can generate a **microservices scaffold** with CF Workers + Neon migrations + CI boilerplate.

**Scope**
- `tools/app-graph/schema.json`
- `api/src/services/scaffold/*`
- Templates under `/templates/` (React + shadcn/ui, Hono, Neon, Worker service bindings)

**Acceptance**
- `POST /api/scaffold` returns an artifact (R2) and a **PR to `main`** with generated files.
- Generated `wrangler.toml` per service: **single explicit route**, no collisions.
- OPS probes pass on the generated service (route audit, CORS, JWKS if applicable).

**Risks & controls**
- Route conflicts → CI **route audit** (P‑1).
- Bloat → minimal templates; optional features via flags.

---

### A2. Multi‑Agent PRs (planner/architect/ui/tester) (TSK-A-2, P0)
**Outcome**: AI agents coordinate to propose **PRs only** (no direct deploy), with typed diffs, tests, and acceptance checklist.

**Scope**
- `api/src/agents/*`, `docs/agents.md`
- PR metadata includes prompts/test artifacts + **route audit proof**

**Acceptance**
- `/api/si/ask` with `skill=change_request` yields a PR with: **full-file replacements**, tests, and checklist.
- Merges require CI green: prompt goldens, unit/e2e, route audit.

**Risks & controls**
- Incorrect refactors → contract-first checks and generated tests required.
- Drift → OPS route audit & probes on every PR touching routes/headers.

---

### A3. Voice Runbook (TSK-A-3, P0)
**Outcome**: **Voice-controlled** build/rollout/rollback + narrated probes and health metrics (Cartesia).

**Scope**
- `api/src/voice/runbook.ts`, `frontend/src/features/voice-runbook/*`

**Acceptance**
- Commands like “canary 10%” create PRs with route weight changes and OPS proofs.
- Narration reads pre/post metrics and probe results.

**Risks & controls**
- Voice misfires → *read-only* mode by default, explicit “apply” confirmation creates PR.

---

### A4. Contract‑First APIs & Typed SDKs (TSK-A-4, P1)
**Outcome**: **OpenAPI + TS SDK** per service; **Zod** guards; backward‑compat gates.

**Scope**
- `contracts/<service>.openapi.json`, `sdk/ts/<service>/*`
- Zod validators in handlers

**Acceptance**
- Breaking changes blocked with actionable CI messages and skeleton migration PR.

**Risks & controls**
- Silent breaking changes → CI diff and consumer SDK tests.

---

### A5. Cost/Perf Advisor + Model Router (TSK-A-5, P1)
**Outcome**: Per-route **token/cost/latency** tracking; **policy-based routing** across Groq/CF AI/OpenAI with fallback.

**Scope**
- `api/src/ai/router.ts`, `api/src/ai/advisor.ts`; frontend widget

**Acceptance**
- Advisor hints surface in `/api/si/ask` responses when thresholds exceed policy.
- A/B model flips reflect expected usage deltas in feed.

**Risks & controls**
- Hidden cost spikes → per-tenant budgets & warnings (flags in P‑5).

---

## Phase B — Scale & Autonomy

### B1. Zero‑Downtime Migrations (TSK-B-1, P0)
**Outcome**: Safe **migration planner + verifier (Neon)**, with shadow tables and dual reads.

**Acceptance**
- Verifier green before cutover; audit logged.

---

### B2. Feature Flags & Experiments (TSK-B-2, P1)
**Outcome**: KV-backed flags, audience rules, immediate rollbacks.

**Acceptance**
- Flag flips visible within seconds; audit trail in KV.

---

### B3. Incident Copilot + Autofix PRs (TSK-B-3, P1)
**Outcome**: Detect anomalies → draft fix PR + tests + staged rollout plan.

**Acceptance**
- Seeded error spike triggers an actionable PR; human approval required.

---

### B4. RAG Pipelines w/ Lineage & Tests (TSK-B-4, P1)
**Outcome**: Ingestion → chunking → embedding → index with **golden retrieval tests**.

**Acceptance**
- Baseline retrieval quality met or PR blocked.

---

### B5. Template Marketplace v1 (TSK-B-5, P2)
**Outcome**: Curated template catalog; “remix” into App Graph + PR.

**Acceptance**
- Remix flow yields a working service with passing probes/tests.

---

## Platform Hardening (woven across phases)

- **P‑1 Route audit CI** — block merges on route mismatch or missing proofs.
- **P‑2 Usage rollups** to Neon for reporting (KV remains SoT for billing).
- **P‑3 Uptime & synthetic SLOs** for `/ready`, `/auth/guest`, JWKS, `/api/si/ask`.
- **P‑4 Secrets rotation** with JWKS overlap & PEM rekey playbook.
- **P‑5 Tenant rate limits & budgets** at edge (Durable Objects or KV counters).
- **P‑6 Prompt & test CI** — goldens for model/prompt drift.
- **P‑7 Service Bindings path** — split **SI**, **Billing**, **Jobs**, **Uploads** into internal workers; hold **public route at gateway**.

**Service split gates (each internal worker):**
1. **Parity**: status/body/headers match baseline.
2. **Latency**: p95 degradation < **10%**.
3. **Rollback**: single flag in gateway to revert.
4. **Probes**: OPS checklist for the service green; proof captured.

---

## Milestone Timeline (suggested target windows)

> Use 2‑week sprints; adjust by capacity. Dates are targets — keep history in PRs.

- **Sprint 1–2**: A1 (App Graph + Scaffold), P‑1 (CI route audit), C‑cleanup
- **Sprint 3–4**: A2 (Multi‑agent PRs), P‑6 (Prompt CI), P‑3 (Uptime baseline)
- **Sprint 5–6**: A3 (Voice Runbook), A5 (Advisor + Router)
- **Sprint 7–8**: A4 (Contract‑first APIs/SDKs), P‑5 (Tenant budgets)
- **Sprint 9–10**: B1 (Zero‑downtime migrations), B2 (Flags/Experiments)
- **Sprint 11–12**: B3 (Incident Copilot), B4 (RAG pipelines)
- **Sprint 13+**: B5 (Template Marketplace v1)

---

## Definition of Done (per milestone)

1) **Docs** updated: README (API contract), OPS (probes & route audit), Tasks & this Roadmap.
2) **Proofs** saved under `ops/proofs/` for changed routes/headers.
3) **CI** green: route audit, prompts/tests, uptime checks.
4) **Ops** playbooks updated; rollback steps validated.
5) **No direct CF edits**; all changes come from a merged PR to `main`.

---

## Change Management & Risk

- **Gates**: All route/DNS or CORS/header changes require fresh proofs.
- **Rollback**: Canary route weights → 0%; revert PR; restore prior `wrangler.toml`.
- **Keys**: PEM rekey with JWKS overlap window; rotate admin/API keys per P‑4.
- **Cost**: Advisor alarms on per‑tenant overruns; enforce budgets (P‑5).

---

## Cross‑References

- Tasks: `/docs/tasks.md`
- Ops Runbook: `/OPS.md`
- Worker entrypoint: `/api/src/index.ts`
- Auth/Billing/Jobs module: `/api/src/modules/auth_billing.ts`
- Wrangler config: `/api/wrangler.toml`
- Route proofs: `/ops/proofs/*.txt`

---

_Last updated: aligned with production state (`api.cognomega.com` RS256 + JWKS + strict CORS) and microservices plan via Service Bindings._
