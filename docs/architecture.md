# Cognomega — Final Cost-Effective Architecture (Microservices on Cloudflare)

Status: SOURCE OF TRUTH

## Public Surface
- **Gateway Worker** at `api.cognomega.com/*` (only route owner).  
- Routes unchanged; Gateway forwards to internal Workers via **Service Bindings**.

## Internal Services (Workers)
1. **auth-svc** — RS256 `/auth/guest`; `/.well-known/jwks.json` (JWKS in KV: `KEYS`).
2. **billing-svc** — `/credits`, `/credits/adjust` admin; **KV** cache + **Neon** ledger; idempotent writes.
3. **usage-svc** — `/usage` ingress → **Queue** → `usage-writer` → **Neon**; GET via KV cache.
4. **orchestrator-svc** — provider routing (`groq,cfai,openai`), token accounting, emits usage, triggers billing.
5. **jobs-svc** — enqueue/process jobs (`sketch_to_app` etc.); Queue per job type; status in Neon; artifacts in **R2**.
6. **files-svc** — `POST /upload/direct` to **R2_UPLOADS**; size/content-type validation; optional AV queue.
7. **voice-svc** — TTS via **Cartesia**; pluggable STT; **Durable Object** for realtime sessions.
8. **admin-svc** — `/admin/cleanup`, `/admin/env-snapshot`, `/admin/rebuild-balance-cache`.

## Data Stores
- **KV**: hot paths (balances, small usage windows, config flags), low-latency global reads.
- **Queues**: usage ingestion, settlements, job processing, AV, ETL to analytics.
- **R2**: uploads + job artifacts; lifecycle rules for cost control.
- **Neon (Postgres)**: authoritative ledger, users/orgs, usage_event, jobs, skill registry; **pgvector** for embeddings.

## Scale Patterns
- Workers auto-scale; no cold-starts to tune.
- Write amplification controlled by Queues + idempotency keys.
- Rate limiter DO per tenant/email prevents runaway cost.
- Regionality: everything runs at the edge; Neon is remote—keep Neon off the hot path where possible.

## Security & Compliance
- RS256 JWTs (PKCS#8 private key; JWKS public).
- Admin endpoints gated by `X-Admin-Key`/`X-Admin-Token`.
- CORS strict allow-list; billing headers exposed; `Cache-Control: no-store`.
- Signed R2 keys; sanitized filenames; AV option via queue.
- Audit proofs committed under `/ops/proofs/`.

## Observability
- Request IDs on all responses; trace provider/model/tokens/credits.
- Logpush; error budgets tracked per service.
- Queue depth metrics + drain latencies in dashboards.

## SLOs (Edge)
- Gateway p90 < 60ms; SI p90 1.2–2.2s depending on provider path.
- `/credits` p90 < 150ms (KV hit); < 500ms (Neon fallback).

## Cost Levers
- Model order: prefer Workers AI for cheap path; fall back to Groq/OpenAI as needed.
- Token caps per tier; audio length caps; denylist for heavy intents for guests.
- R2 lifecycle (30/60/90-day tiers); compress text artifacts.
- KV TTLs tuned; cache stampede avoided with SWR.

## Interfaces (Stable)
- `/auth/guest` returns RS256 JWT; `/ .well-known/jwks.json` publishes keys.
- `/api/si/ask` exposes: `X-Provider`, `X-Model`, `X-Tokens-In`, `X-Tokens-Out`, `X-Credits-Used`, `X-Credits-Balance`, `X-Request-Id`.

