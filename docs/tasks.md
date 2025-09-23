# Cognomega — Task Backlog (Executable, Single Source of Truth)

**Conventions**
- **ID format**: `TSK-<Area>-<Number>[-<Sub>]` (e.g., `TSK-A-1`, `TSK-H-4b`).
- **Priority**: `P0` (must now), `P1` (next), `P2` (later).
- **Status**: `queued` | `in-progress` | `blocked` | `done` (update via PR only).
- **Proofs**: Any route/DNS/CORS/JWKS change must produce a text proof under `ops/proofs/*.txt`.
- **Ops**: **PowerShell-only** snippets. No direct Cloudflare dashboard edits; **GitHub-only deploys**.

Linked plan: [`docs/roadmap.md`](./roadmap.md) • Runbook: [`/OPS.md`](../OPS.md)

---

## Overview Table

| ID | Title | Area | Priority | Owner | Status | Depends On |
|---|---|---|---|---|---|---|
| TSK-P-1 | Route Ownership Audit (continuous) | Prod | P0 | Ops | queued | — |
| TSK-P-2 | CORS/Headers Contract Probe | Prod | P0 | Ops | queued | — |
| TSK-P-3 | JWKS/JWT RS256 Verify & PEM Rotation Playbook | Security | P0 | Ops | queued | — |
| TSK-P-4 | GitHub-only Guardrails (branch protections + required checks) | Prod | P0 | Ops | queued | — |
| TSK-P-5 | Env Snapshot Sanity (`/api/admin/env-snapshot`) | Prod | P1 | Ops | queued | — |
| TSK-P-6 | Uptime Workflow (Actions) | Reliability | P1 | Ops | queued | P-2 |
| TSK-C-1 | Credits Adjust (admin) probe | Billing | P0 | Ops | queued | — |
| TSK-C-2 | Usage Feed GET/POST parity | Billing | P0 | Ops | queued | — |
| TSK-C-3 | Admin Cleanup (KV) dry-run | Billing | P1 | Ops | queued | — |
| TSK-C-4 | SI Exposed Billing Headers check | Billing | P0 | Ops | queued | — |
| TSK-A-1 | App Graph + Scaffolder (endpoint + templates) | Differentiators | P0 | Eng | queued | P-1,P-2 |
| TSK-A-1a | Minimal Templates Set (React+shadcn/ui, Hono, Worker SB) | Differentiators | P0 | Eng | queued | A-1 |
| TSK-A-1b | R2 Artifact + Auto PR to `main` | Differentiators | P0 | Eng | queued | A-1 |
| TSK-A-2 | Multi-Agent PR flow (planner/architect/ui/tester) | Differentiators | P0 | Eng | queued | A-1 |
| TSK-A-3 | Voice Runbook (Cartesia) — read-only | Voice | P0 | Eng | queued | P-2 |
| TSK-A-4 | Contract-First APIs & TS SDKs | Platform | P1 | Eng | queued | A-1 |
| TSK-A-5 | Cost/Perf Advisor + Model Router | Platform | P1 | Eng | queued | — |
| TSK-B-1 | Zero-Downtime Migrations (Neon) | Scale | P0 | Eng | queued | — |
| TSK-B-2 | Feature Flags (KV) + Experiments | Platform | P1 | Eng | queued | — |
| TSK-B-3 | Incident Copilot + Autofix PRs | Reliability | P1 | Eng | queued | P-6 |
| TSK-B-4 | RAG Pipeline v1 (with retrieval tests) | AI | P1 | Eng | queued | A-4 |
| TSK-B-5 | Template Marketplace v1 | Product | P2 | Eng | queued | A-1 |
| TSK-H-1 | CI Gate: Route Audit & Proofs | Hardening | P0 | Eng | queued | P-1 |
| TSK-H-2 | Prompt Golden Tests (CI) | Hardening | P0 | Eng | queued | A-2 |
| TSK-H-3 | Tenant Budgets & Rate Limits | Hardening | P1 | Eng | queued | C-* |
| TSK-H-4a | Service Binding split: SI internal worker | Hardening | P1 | Eng | queued | P-* |
| TSK-H-4b | Service Binding split: Billing internal worker | Hardening | P1 | Eng | queued | P-* |
| TSK-H-4c | Service Binding split: Jobs internal worker | Hardening | P1 | Eng | queued | P-* |
| TSK-H-4d | Service Binding split: Uploads internal worker | Hardening | P1 | Eng | queued | P-* |

> Update owners/status in PRs only.

---

## Detailed Tasks

### TSK-P-1 — Route Ownership Audit (continuous) — **P0**
**Goal**: Guarantee `api.cognomega.com/*` is owned by **one** worker (`cognomega-api`), no Pages/other worker conflicts.

**Inputs**: `api/wrangler.toml` (routes), CF DNS state (A/AAAA proxied).  
**Outputs**: Proof file `ops/proofs/api-route-audit-YYYYMMDD-HHMMSS.txt`.

**Steps (PowerShell, from repo root)**
```powershell
# 1) Show wrangler routes block
Get-Content -Raw "api\wrangler.toml" | Select-String -Pattern '^\s*routes\s*=|pattern\s*=|zone_name\s*='

# 2) Probe preflight (CORS) to ensure the route is active
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method = "OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp = $req.GetResponse(); $resp.StatusCode; $resp.Close()

# 3) JWKS + guest token checks
$jwks = Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$guest = Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"

# 4) ai_bound
$ai = Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding"

# 5) Save proof (no BOM)
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$head = $jwks.Content.Substring(0, [Math]::Min(120, $jwks.Content.Length))
@"
== AI binding ==
$(( $ai | ConvertTo-Json -Compress ))

== JWKS (first 120 chars) ==
$head

== Guest token (truncated) ==
$($guest.token.Substring(0,40))...
"@ | Set-Content -Path ("ops\proofs\api-route-audit-$ts.txt") -Encoding utf8 -NoNewline
```

**Acceptance**
- Proof text added to `ops/proofs/`; PR linked when routes/wrangler.toml/DNS changed.

**Rollback**
- Revert last routes change (`git revert`), redeploy worker via GitHub Actions.

---

### TSK-P-2 — CORS/Headers Contract Probe — **P0**
**Goal**: Validate **preflight** and **exposed headers** contract.  
**Outputs**: Screenshot or console of headers; optional proof file.

**Steps**
```powershell
# Preflight
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method = "OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp = $req.GetResponse()
$resp.Headers["Access-Control-Allow-Origin"]
$resp.Headers["Access-Control-Expose-Headers"]
$resp.Close()

# SI ask (inspect exposed X-* headers)
$r = Invoke-RestMethod -Uri "https://api.cognomega.com/api/si/ask" -Method POST `
  -Headers @{ "Origin"="https://app.cognomega.com"; "Content-Type"="application/json"; "X-User-Email"="ops@cognomega.com" } `
  -Body (@{ skill="summarize"; input="hello" } | ConvertTo-Json -Compress) -ResponseHeadersVariable rh
$rh["X-Provider"]; $rh["X-Model"]; $rh["X-Credits-Used"]; $rh["X-Credits-Balance"]
```

**Acceptance**
- Preflight: `204` with allow/expose headers; POST has exposed billing headers.

---

### TSK-P-3 — JWKS/JWT RS256 Verify & PEM Rotation Playbook — **P0**
**Goal**: Ensure RS256 and issuer; write a playbook to rotate `PRIVATE_KEY_PEM` with **JWKS overlap**.

**Steps**
```powershell
# Decode header/payload to confirm alg RS256 & iss
function ConvertFrom-Base64Url([string]$s) { $s=$s.Replace('-','+').Replace('_','/'); switch ($s.Length % 4) {2{$s+='=='} 3{$s+='='} default{} }; [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s)) }
$guest = Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
$h = ConvertFrom-Base64Url($guest.token.Split('.')[0]) | ConvertFrom-Json
$p = ConvertFrom-Base64Url($guest.token.Split('.')[1]) | ConvertFrom-Json
"alg=$($h.alg) kid=$($h.kid) iss=$($p.iss)"
```

**Acceptance**
- `alg=RS256` and issuer matches `https://api.cognomega.com`.
- Rotation doc added to `/OPS.md` (JWKS publish old+new for overlap window).

---

### TSK-P-4 — GitHub-only Guardrails — **P0**
**Goal**: Protect `main` branch; require route-audit, tests, and proofs.

**Acceptance**
- Branch protection enabled with required checks: `route-audit`, `ci`, `uptime-smoke`.
- No direct pushes; PRs only.

---

### TSK-P-5 — Env Snapshot Sanity (`/api/admin/env-snapshot`) — **P1**
**Goal**: Confirm env flags and bindings present; no secret values printed.

**Acceptance**
- Endpoint returns `{ ok: true, vars, secrets(bool), bindings(bool) }` and is protected by `X-Admin-Key`.

---

### TSK-P-6 — Uptime Workflow (Actions) — **P1**
**Goal**: Hourly probes for Preflight, JWKS, AI binding; alert on failure.

**Acceptance**
- Action logs show success; GitHub notification on failures.

---

### TSK-C-1 — Credits Adjust (admin) probe — **P0**
**Goal**: Confirm admin path works and is auth‑gated.

**Steps**
```powershell
$hdr = @{ "X-Admin-Key"="<ADMIN_API_KEY>"; "Content-Type"="application/json" }
$body = @{ email="ops@cognomega.com"; delta=5 } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits/adjust' -Method POST -Headers $hdr -Body $body
```

**Acceptance**
- Returns new balance; 401 on wrong key.

---

### TSK-C-2 — Usage Feed GET/POST parity — **P0**
**Goal**: Write & read usage for a user; cursor works.

**Acceptance**
- `POST /api/billing/usage` then `GET /api/billing/usage?limit=5` shows the event.

---

### TSK-C-3 — Admin Cleanup (KV) dry-run — **P1**

**Acceptance**
- Dry-run deletes < hard limit; shows scanned/deleted/kept stats; respects `older_than_days`.

---

### TSK-C-4 — SI Exposed Billing Headers — **P0**

**Acceptance**
- SI response exposes `X-Provider`, `X-Model`, `X-Tokens-In`, `X-Tokens-Out`, `X-Credits-Used`, `X-Credits-Balance` (non-guest).

---

### TSK-A-1 — App Graph + Scaffolder — **P0**
**Goal**: Generate microservice scaffold + PR.

**Acceptance**
- `POST /api/scaffold` → R2 artifact + PR to `main`; generated `wrangler.toml` has **one** route; OPS probes pass on preview.

---

### TSK-A-1a — Minimal Templates Set — **P0**
**Acceptance**
- React+shadcn/ui (frontend), Hono worker (gateway), internal worker template (service binding), Neon migration stub.

---

### TSK-A-1b — R2 Artifact + Auto PR — **P0**
**Acceptance**
- Artifact uploaded; PR contains **full-file** additions; no diffs-only snippets.

---

### TSK-A-2 — Multi-Agent PR flow — **P0**
**Acceptance**
- `/api/si/ask?skill=change_request` yields a PR with tests + checklist + proofs if routes touched.

---

### TSK-A-3 — Voice Runbook (read-only) — **P0**
**Acceptance**
- Voice commands narrate **probe outputs**; any “apply” requires explicit confirmation → creates PR (no direct deploy).

---

### TSK-A-4 — Contract-First APIs & TS SDKs — **P1**
**Acceptance**
- OpenAPI docs; generated TS SDK; CI blocks breaking changes with actionable message.

---

### TSK-A-5 — Cost/Perf Advisor + Model Router — **P1**
**Acceptance**
- Advisor hints appear when thresholds exceeded; tokens/cost deltas reflect in usage feed.

---

### TSK-B-1 — Zero-Downtime Migrations (Neon) — **P0**
**Acceptance**
- Shadow tables + dual reads pass verifier before cutover; audit logged in PR.

---

### TSK-B-2 — Feature Flags (KV) + Experiments — **P1**
**Acceptance**
- Flag change visible within seconds across PoPs; KV audit trail written.

---

### TSK-B-3 — Incident Copilot + Autofix PRs — **P1**
**Acceptance**
- Synthetic error spike generates a PR with fix + tests + staged rollout doc.

---

### TSK-B-4 — RAG Pipeline v1 — **P1**
**Acceptance**
- Golden retrieval tests pass minimum NDCG; PR blocked otherwise.

---

### TSK-B-5 — Template Marketplace v1 — **P2**
**Acceptance**
- Browse → Remix → PR flow works; probes/tests pass on remixed service.

---

### TSK-H-1 — CI Gate: Route Audit & Proofs — **P0**
**Acceptance**
- Any PR touching `wrangler.toml`, DNS docs, or route code fails without new proof file and passing probes.

---

### TSK-H-2 — Prompt Golden Tests (CI) — **P0**
**Acceptance**
- Stable prompt set; CI asserts acceptable drift envelopes.

---

### TSK-H-3 — Tenant Budgets & Rate Limits — **P1**
**Acceptance**
- Per-tenant caps; gateway 429 with `Retry-After` when exceeded; usage reflects throttling.

---

### TSK-H-4a — Service Binding split: **SI** internal worker — **P1**
**Goal**: Move `/api/si/ask` + `/api/ai/*` to internal worker (no public routes).

**Acceptance**
- **Parity** on status/body/headers; p95 latency degradation < 10%; gateway flag can revert; OPS proofs captured.

---

### TSK-H-4b — Service Binding split: **Billing** internal worker — **P1**

**Acceptance**
- `/auth/guest`, JWKS, credits/usage/admin via internal worker; same gates as H-4a.

---

### TSK-H-4c — Service Binding split: **Jobs** internal worker — **P1**

**Acceptance**
- `/api/jobs*` parity; gates as H-4a.

---

### TSK-H-4d — Service Binding split: **Uploads** internal worker — **P1**

**Acceptance**
- `/api/upload/direct` parity; size limits preserved; gates as H-4a.

---

## How to Use This Backlog

- Pick the **next P0/P1** task, create a PR titled `TASK: <ID> <Title>`.
- Include: updated docs (README/OPS), proofs (if routes/headers), and automated probes.
- No direct deployments. **Merge to `main`** triggers GitHub Action deploy to CF.
- Update **Status** here as part of your PR.

---

_Last aligned with production contract for `api.cognomega.com` (RS256 guest auth, JWKS, strict CORS)._
