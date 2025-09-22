# Cognomega — Major Roadmap (Microservices, Cost-Efficient, Global Scale)

Status: SOURCE OF TRUTH  
Last updated: 2025-09-23 (IST)

## Principles
- Cloudflare-first edge architecture (Workers, Service Bindings, KV, Queues, R2, DOs).
- Keep **Neon** as authoritative ledger/analytics; keep **Cartesia** for TTS.
- Single public hostname `https://api.cognomega.com` with **one** owning Worker route.
- No monolith; each capability promotes to a Worker microservice.
- Async writes via Queues; **KV** for hot reads; **Neon** for source-of-truth.
- Production guardrails: **CORS single layer**, RS256 guest auth, JWKS in KV, headers exposed.
- GitHub-only deploys to prod; no CF preview until issues are closed.

## Phase 0 — Stabilize & Prove (Now → 2 weeks)
**Goals**
- Single route owner verified (`cognomega-api` only).
- CORS/headers consistent (preflight 204; exposed headers stable).
- Auth: RS256 `/auth/guest`; JWKS served from KV.
- Documentation baseline (OPS updated, Route Audit capture routine).

**Deliverables**
- ✅ `OPS.md` updated with Route Ownership Audit & capture steps.
- ✅ `wrangler.toml` with single route; no shadow functions.
- ✅ Preflight proof and `ai_bound: true` proof captured.
- ✅ README segment (to be merged) clarifies **one** `/auth/guest` and JWKS.

**Acceptance**
- Preflight returns 204 with allow/expose headers.
- `GET /api/ai/binding` → `{ "ai_bound": true }`.
- `.well-known/jwks.json` returns `keys[]`.
- Only one Worker owns `api.cognomega.com/*`.

## Phase 1 — Split Hot Paths (2–4 weeks)
**Goals**
- Introduce **usage-svc** (ingress API → Queue → writer) and **billing-svc** (KV cache + Neon ledger).
- Gateway (public API Worker) forwards to services via **Service Bindings**.
- Keep public URLs unchanged.

**Deliverables**
- Workers: `usage-svc`, `usage-writer`, `billing-svc`.
- KV keys: `balance:{email}`, `usage:{email}:{revTs}:{id}` (compat).
- Admin: `/admin/env-snapshot` and cleanup retained.

**Acceptance**
- `/api/si/ask` end-to-end latency stable under load (usage write async).
- `/api/credits` served from KV, consistent with Neon after write.
- Back-pressure via Queues validated.

## Phase 2 — Functional Extraction (3–6 weeks)
**Goals**
- Extract `auth-svc`, `files-svc` (R2), `orchestrator-svc` (LLM routing), `admin-svc`.
- Introduce **per-user rate limiter** via Durable Object at the Gateway.

**Deliverables**
- Workers: `auth-svc`, `files-svc`, `orchestrator-svc`, `admin-svc`, `rate-limiter-do`.
- Service map documented; bindings wired in Gateway.

**Acceptance**
- All public routes continue to work with stable headers.
- Rate-limits enforce tenant budgets without false positives.

## Phase 3 — Jobs & Voice (4–8 weeks)
**Goals**
- Extract `jobs-svc` (Queues; Neon job status; R2 artifacts).
- Stand up `voice-svc` (Cartesia TTS; selected STT; DO for realtime rooms).

**Deliverables**
- Workers: `jobs-svc`, queue consumers; `voice-svc` with DO.
- R2 lifecycle policy for artifacts.

**Acceptance**
- `POST /api/jobs` scales with spikes (Queue depth monitored).
- Voice round-trip fits SLO (see SLOs below).

## Phase 4 — Evolving Intelligence (ongoing)
**Goals**
- Enable **pgvector** on Neon; store embeddings, feedback, reward signals.
- Nightly bandit A/B for prompt variants; versioned skills registry.

**Deliverables**
- Tables: `skill`, `skill_version`, `feedback`, `prompt_eval`.
- Operator tools to promote/demote versions.

**Acceptance**
- Positive movement in task success rate and cost per successful outcome.

## Global SLO/SLI Targets
- P90 latency:  
  - `/api/si/ask` ≤ 1200ms (Workers AI path), ≤ 2200ms (Groq/OpenAI path).  
  - `/api/credits` ≤ 150ms (KV hit), ≤ 500ms (Neon fallback).  
- Uptime ≥ 99.9%; Queue drain < 2 min lag for p95 spikes.
- Data consistency: KV↔Neon drift reconciled within 60s for balances.

## Risk & Mitigation
- **Route shadowing** → Route Audit before/after any change.  
- **Provider outages** → Ordered fallbacks + circuit breakers.  
- **Cost spikes** → Per-user DO rate limiter; tiered models; max tokens/audio caps.  
- **State divergence** → Idempotency keys; queue writers are idempotent; periodic reconciler.
