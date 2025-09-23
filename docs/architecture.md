# Cognomega — Architecture (Cost‑Effective, Microservices, CF‑Native)

> **Single Source of Truth.** Mirrors production today and the planned microservices evolution.  
> **Public owner:** `cognomega-api` is the **only** Worker routed to `api.cognomega.com/*`.  
> **Data SoT:** KV (`KV_BILLING` + `KEYS`) is the source of truth for credits/usage/jobs + JWKS.  
> **Deploys:** GitHub → `main` only (no direct CF edits). Proofs go to `ops/proofs/`.

---

## 1) Goals & Non‑Goals

**Goals**
- AI‑first, voice‑first app maker; microservices; auto‑scale; low cost per user.
- Keep Cloudflare (Workers, KV, R2, AI), Neon (Postgres), Cartesia (TTS).
- One public API route owner to prevent shadow routes and CORS drift.
- Strict CORS and visible billing headers for frontend.
- PR‑first changes with automated route/CORS/JWKS proofs.

**Non‑Goals (for now)**
- Replacing Cloudflare/Neon/Cartesia.
- Monolith that mixes UI+API+state in one deploy unit.
- “Direct to prod” changes from dashboard.

---

## 2) Current Production Topology (as of now)

- **Public:** `api.cognomega.com/*` → **Worker:** `cognomega-api`
- **Entrypoint:** `api/src/index.ts`
- **Auth/Billing/Jobs/SI module:** `api/src/modules/auth_billing.ts` (canonical for `/auth/guest`, JWKS, credits/usage/jobs, SI orchestration, uploads)
- **Bindings:**
  - **KV:** `KEYS` (JWKS), `KV_BILLING` (credits, usage, jobs)
  - **R2:** `R2_UPLOADS` (direct upload), `R2` (legacy artifacts)
  - **AI:** Workers AI binding
  - **(Optional)** Neon URL for legacy/demo endpoints
- **Docs:** `OPS.md` (runbook), `README.md` (API expectations)

All CORS/JWKS/AI binding probes are green (see proofs in `ops/proofs/*`).

---

## 3) Target Architecture (Microservices via Service Bindings)

We retain a **single public gateway** worker while carving internal services as **separate Workers** called through **Service Bindings**. Internal workers have **no public routes**; the gateway owns the zone route.

```mermaid
flowchart LR
  U[Browser / Client] -->|HTTPS| GW[API Gateway<br/>cognomega-api]
  subgraph Internal Workers (no public routes)
    SI[si-worker<br/>skills + model router]
    JB[jobs-worker<br/>KV jobs API]
    BL[billing-worker<br/>credits/usage ledger]
    UP[uploads-worker<br/>direct R2 handling]
    VC[voice-worker<br/>Cartesia orchestration]
    SC[scaffold-worker<br/>App Graph generator]
    AD[advisor-worker<br/>cost/perf hints]
    FG[flags-worker<br/>feature flags]
    RG[rag-worker<br/>ingest + retrieval]
  end
  GW -->|service binding| SI
  GW -->|service binding| JB
  GW -->|service binding| BL
  GW -->|service binding| UP
  GW -->|service binding| VC
  GW -->|service binding| SC
  GW -->|service binding| AD
  GW -->|service binding| FG
  GW -->|service binding| RG

  SI --> KV[(KV_BILLING)]
  JB --> KV
  BL --> KV
  UP --> R2[(R2_UPLOADS / R2)]
  SI --> AI[Workers AI]
  VC --> CART[Cartesia TTS]
  BL --> NEON[(Neon rollup)]
```

**Why this shape?**
- **One public route owner** → no route conflicts, easier CORS, simpler certs.
- **Service isolation** → independent deploys & guarded contracts via bindings.
- **Edge‑native scale** → every worker scales with Cloudflare Anycast.

> **Note:** We will gradually extract services from the module into internal workers. Until then, the module stays canonical to avoid regressions.

---

## 4) Public Routing & Contracts

**Public base:** `https://api.cognomega.com` (owned by `cognomega-api`)

| Public Endpoint | Canonical Owner today | Future Owner (via service binding) |
|---|---|---|
| `POST /auth/guest` | module | **billing-worker** (token service) |
| `GET /.well-known/jwks.json` | module | **billing-worker** |
| `GET /api/credits`, `POST /api/credits/adjust` | module | **billing-worker** |
| `GET|POST /api/billing/usage` (+aliases) | module | **billing-worker** |
| `POST /api/si/ask` | module | **si-worker** (model router) |
| `GET|POST /api/jobs`, `GET|PATCH /api/jobs/:id`, `POST /api/jobs/run` | module | **jobs-worker** |
| `POST /api/upload/direct` | module | **uploads-worker** |
| `GET /api/ai/binding`, `POST /api/ai/test` | module | **si-worker** |
| Admin: `/api/admin/ping`, `/api/admin/cleanup` | module | **admin in billing-worker** |

**CORS (gateway enforced)**
- Allowed methods: `GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH`
- Base allowed headers: `Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token` + any requested headers in preflight
- Exposed headers: `Content-Type, Content-Disposition, X-Request-Id, X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model`
- `ALLOWED_ORIGINS` env var controls which Origins are permitted.

**Identity resolution (gateway)**
1) `?email=...` → 2) `X-User-Email` → 3) RS256 JWT (email/em/sub)

---

## 5) Data & Storage

- **KV_BILLING (SoT):** balances, credit transactions (append‑style), usage events (token counts, models, headers), jobs (rows + index keys).  
- **KEYS (JWKS):** JSON at key `jwks`; `/auth/guest` issues RS256 using `PRIVATE_KEY_PEM` (PKCS#8) + `KID`.  
- **R2_UPLOADS:** direct upload path with `Content-Length` checks and metadata.  
- **R2 (legacy):** optional artifacts bucket for generated outputs.  
- **Neon (reporting/rollups):** hourly rollup of KV usage → analytics; optional legacy/demo endpoints.  
- **AI providers:** Workers AI (default), Groq, OpenAI — orchestrated by model router with cost/perf advisor.

**TTL & cleanup**
- Usage/events TTL managed by periodic cleanup endpoint (`/api/admin/cleanup`) and/or time‑bucketed keys.  
- Jobs TTL configurable; stale rows pruned by admin endpoint.

---

## 6) Scaling, Multi‑Tenancy & Budgets

- **Stateless Workers** scale per request; no VM warmup required.
- **Per‑tenant budgets** (future): KV counters + headers (`X-Limit-*`) and 429 backpressure. Durable Objects optional if stronger consistency is needed.
- **Queue workloads**: Jobs remain KV‑indexed; background processing is triggered by internal admin route and scheduled cron (guarded by secrets).

**Performance knobs**
- Model router chooses Groq/CF AI/OpenAI by latency & price; hints returned in SI responses.  
- Batching & compression for usage rollups to Neon.  
- Edge caching is **not** used for SI routes; JSON responses use `Cache-Control: no-store`.

---

## 7) Security

- **JWT**: RS256 signed guest tokens; JWKS published from KV. Overlap KIDs when rotating keys.  
- **Admin**: `X-Admin-Key` / `X-Admin-Token` for protected routes; rotate quarterly.  
- **CORS**: explicit allow‑list; exposed headers for billing.  
- **Secrets**: stored via CF Secret envs; never logged.  
- **Uploads**: sanitize filenames; enforce size limits; set `content-type`; R2 metadata records uploader & route.  
- **CI gates**: route ownership audit, prompts/testing, uptime smoke.

---

## 8) Observability

- **Proofs**: write probe outputs to `ops/proofs/*.txt` on route/CORS/JWKS changes.  
- **Headers**: `X-Request-Id` everywhere; usage events include `request_id` for correlation.  
- **Dashboards** (later): usage rollups in Neon for cost/tenant analytics.  
- **Uptime**: GitHub Actions synthetic checks (`/ready`, `/auth/guest`, JWKS head, `/api/si/ask`).

---

## 9) Migration Plan (Module → Service Bindings)

1. **Keep stable**: module remains canonical; prove no route conflicts (OPS).  
2. **Extract “si-worker”**: move `/api/si/ask` + `/api/ai/*` behind a service binding; gateway proxies.  
3. **Extract “billing-worker”**: move `/auth/guest`, JWKS, credits/usage/admin; gateway proxies.  
4. **Extract “jobs-worker”, “uploads-worker”** similarly.  
5. **Introduce advisor/flags/voice/scaffold/rag workers** as new capabilities.

For each extraction:
- Add binding in gateway’s `wrangler.toml` (docs‑only first).  
- Deploy internal worker (no route).  
- Flip gateway to call binding; keep signature stable.  
- Run OPS probes; attach proofs; merge to `main`.

---

## 10) Cost Model (Rules of Thumb)

- **KV**: hot paths (credits/usage/jobs) — very low cost at scale.  
- **R2**: pay per GB stored + operations; keep uploads small and expirable.  
- **Workers AI**: default for lower‑cost inference; route to Groq/OpenAI if QoS/latency demands.  
- **Neon**: used for rollups & analytics; keep write volume bounded (hourly jobs).  
- **Cartesia**: TTS per request; cache voice manifests if applicable (not audio).

**Advisor** surfaces cheaper model options on SI responses when thresholds exceeded.

---

## 11) CI/CD & Governance

- **GitHub‑only deploy**; branch protection; required checks: route audit, prompts/tests, uptime smoke.  
- **No direct dashboard edits** to routes/vars; all config changes via PR.  
- **Every PR touching routes/DNS/CORS** must update `OPS.md` (if needed) and add a new proof file in `ops/proofs/` generated by PowerShell probes.

---

## 12) File Map (authoritative locations)

- Gateway: `/api/src/index.ts`  
- Canonical module (today): `/api/src/modules/auth_billing.ts`  
- Wrangler (gateway): `/api/wrangler.toml`  
- Runbook: `/OPS.md`  
- Roadmap: `/docs/roadmap.md`  
- Tasks: `/docs/tasks.md`  
- Architecture (this): `/docs/architecture.md`  
- Proofs: `/ops/proofs/*.txt`

---

## 13) Future Appendix: Service Binding Cheatsheet (docs‑only)

> **Do not change production files without a PR.** Example snippets for later extractions:

**Gateway `wrangler.toml` (add bindings):**
```toml
# [vars] etc…
[[services]]
binding = "SI_WORKER"
service = "cognomega-si"   # deployed internal worker (no route)

[[services]]
binding = "BILLING_WORKER"
service = "cognomega-billing"
```

**Gateway code (TypeScript, Hono):**
```ts
// ctx.env.SI_WORKER.fetch(...) to call internal worker
const r = await (c.env as any).SI_WORKER.fetch(
  new Request("http://internal/si/ask", { method: "POST", body })
);
return r; // preserve headers; gateway still sets CORS/expose
```

Keep all public contracts unchanged while we migrate behind the gateway.
