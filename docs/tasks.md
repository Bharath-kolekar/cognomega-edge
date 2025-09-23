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

Here’s a complete **replacement** for `docs/tasks.md`, expanded and assigned for **Codex** where appropriate. Paste this over your file.

---

# Cognomega — Task Backlog (Executable, Single Source of Truth)

**Purpose**
This is the canonical, PR-updated task list for Cognomega. It merges production hardening, CI/CD, Codex automation, voice/AI capabilities, and product differentiators. Use it as the **single source of truth** for scope, ownership, and acceptance.

**Conventions**

* **ID**: `TSK-<Area>-<Number>[.<Sub>]` (e.g., `TSK-VOX-4.2`).
* **Priority**: `P0` (now), `P1` (next), `P2` (later).
* **Owner**: `Codex` (ChatGPT Codex), `Eng` (core engineers), `Ops` (operations), `You` (product/PM).
* **Status**: `queued` | `in-progress` | `blocked` | `done`.
  Update **only via PRs** that implement or restructure work.
* **Proofs**: Any route/CORS/header/JWKS change must add a text proof under `ops/proofs/*.txt`.
* **Rules**: **GitHub-only deploys** → Cloudflare; **PowerShell-only** ops snippets; **no direct CF edits**.

Linked plan: [`docs/roadmap.md`](./roadmap.md) • Runbook: [`/OPS.md`](../OPS.md)

---

## A. Snapshot — in progress & recently done

| Area         | What                                                                                             | Owner | Status             |
| ------------ | ------------------------------------------------------------------------------------------------ | ----- | ------------------ |
| Billing/Auth | **JWT/cookie email resolution** parity for SQL handlers                                          | Codex | **done**           |
| Billing/Auth | **Balance payload** normalization + helper reuse                                                 | Codex | **done**           |
| Billing/Auth | SI response **exposes billing headers** (`X-*`)                                                  | Eng   | **done**           |
| Voice        | **KV\_PREFS** binding + **GET/PUT /api/voice/prefs**                                             | Eng   | **done**           |
| CI/CD        | PR **template**, **labels**, **labeler**, **proofs-gate**, **codex-pr-gate**, **codex-commands** | Codex | **done**           |
| CI/CD        | Path-gated `ci.yml` (docs-only PRs skip api/frontend)                                            | Codex | **in-progress**    |
| CD           | Remove legacy `deploy-api.yml` to avoid double deploy                                            | Codex | **done**           |
| Ops          | Proofs in `ops/proofs/*`: auth, usage, jobs, uploads, cleanup dry-run, env snapshot              | Ops   | **done (rolling)** |

---

## B. Overview Table (top items Codex can pick up now)

> Sort by **Priority**, then pull top **P0/P1** into PRs titled `TASK: <ID> <Title>`.

| ID         | Title                                                           | Area            | Priority | Owner | Status      | Depends On     |
| ---------- | --------------------------------------------------------------- | --------------- | -------- | ----- | ----------- | -------------- |
| TSK-P-1    | Route Ownership Audit (continuous)                              | Prod            | P0       | Ops   | queued      | —              |
| TSK-P-2    | CORS/Headers Contract Probe (preflight + exposed)               | Prod            | P0       | Ops   | queued      | —              |
| TSK-P-3    | JWKS/JWT RS256 Verify + PEM Rotation Playbook                   | Security        | P0       | Ops   | queued      | —              |
| TSK-P-4    | GitHub-only Guardrails (required checks)                        | Prod            | P0       | Codex | in-progress | P-1            |
| TSK-P-6    | Uptime workflow (hourly probes)                                 | Reliability     | P1       | Codex | queued      | P-2            |
| TSK-DEV-1  | **Path-aware CI**: finalize & land (`ci.yml`)                   | CI/CD           | P0       | Codex | in-progress | —              |
| TSK-DEV-2  | **Nightly probes** job & artifacts                              | CI/CD           | P1       | Codex | queued      | P-2            |
| TSK-DEV-3  | **Neon migrations** workflow scaffold                           | CI/CD           | P1       | Codex | queued      | —              |
| TSK-A-1    | App Graph + Scaffolder endpoint + templates                     | Differentiators | P0       | Eng   | queued      | P-1,P-2        |
| TSK-A-2    | Multi-Agent PRs (planner/architect/ui/tester)                   | Differentiators | P0       | Codex | queued      | A-1            |
| TSK-A-4    | Contract-first APIs + TS SDKs + Zod                             | Platform        | P1       | Eng   | queued      | A-1            |
| TSK-A-5    | Cost/Perf Advisor + Model Router                                | Platform        | P1       | Eng   | queued      | —              |
| TSK-B-1    | Zero-downtime migrations (Neon)                                 | Scale           | P0       | Eng   | queued      | —              |
| TSK-B-2    | KV Feature Flags + Experiments                                  | Platform        | P1       | Eng   | queued      | —              |
| TSK-B-3    | Incident Copilot + Autofix PRs                                  | Reliability     | P1       | Codex | queued      | P-6            |
| TSK-B-4    | RAG pipeline v1 + golden retrieval tests                        | AI              | P1       | Eng   | queued      | A-4            |
| TSK-B-5    | Template Marketplace v1                                         | Product         | P2       | Eng   | queued      | A-1            |
| TSK-H-3    | Tenant budgets & rate-limits at edge                            | Hardening       | P1       | Eng   | queued      | Billing stable |
| TSK-VOX-1  | **Voice platform foundation** (realtime I/O, CORS, device caps) | Voice           | P0       | Eng   | queued      | KV\_PREFS      |
| TSK-VOX-2  | **Wake-word & continuous listening (privacy toggle)**           | Voice           | P0       | Eng   | queued      | VOX-1          |
| TSK-VOX-3  | **Multilingual + accent detection**                             | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-4  | **Emotion & sentiment sensing** → tone modulation               | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-5  | **Offline fallback** (DeepSpeech)                               | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-6  | **Voice command router** (context/mood/time)                    | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-7  | **Voice auth + personalized behavior**                          | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-8  | **Voice onboarding + accessibility**                            | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-9  | **Voice transcript export** (txt/md/docx)                       | Voice           | P1       | Codex | queued      | VOX-1          |
| TSK-VOX-10 | **Assistant personality switcher**                              | Voice           | P1       | Eng   | queued      | VOX-1          |
| TSK-VOX-11 | **Gamified XP/quests via voice triggers**                       | Voice           | P2       | Eng   | queued      | VOX-6          |
| TSK-VOX-12 | **Voice alerts** (credits, reminders, jobs)                     | Voice           | P1       | Eng   | queued      | VOX-6          |
| TSK-VOX-13 | **Hands-free app creation & publish**                           | Voice           | P1       | Eng   | queued      | A-1, VOX-6     |
| TSK-VOX-14 | **Collaborative voice mode** (multi-user sync)                  | Voice           | P2       | Eng   | queued      | VOX-6          |
| TSK-VOX-15 | **Detect confusion/hesitation → hints**                         | Voice           | P1       | Eng   | queued      | VOX-4          |
| TSK-VOX-16 | **Mood prediction for engagement**                              | Voice           | P2       | Eng   | queued      | VOX-4          |
| TSK-VOX-17 | **Live voice FAQ agent** (builder/devops)                       | Voice           | P2       | Codex | queued      | B-*, A-*       |
| TSK-GEN-1  | One-shot **App from spec** (code+DB+CI)                         | GenAI           | P0       | Codex | queued      | A-1,A-2        |
| TSK-GEN-2  | **Explain code / tests / APIs** (voice+text)                    | GenAI           | P1       | Codex | queued      | —              |
| TSK-GEN-3  | **Code-gen safety rails** (tests, lint, typecheck in PR)        | GenAI           | P1       | Codex | queued      | DEV-1          |
| TSK-GEN-4  | **Auto-prompt evals** (goldens; drift guard)                    | GenAI           | P0       | Codex | queued      | H-2            |
| TSK-GEN-5  | **Model A/B** + policy limits per tenant                        | GenAI           | P1       | Eng   | queued      | H-3            |

> Already **done** but kept for traceability: SQL identity chain; balance payload helper; SI `X-*` billing headers; KV\_PREFS + `/api/voice/prefs`; CI foundations; legacy deploy removal.

---

## C. Detailed tasks & acceptance (delta from earlier plan)

### TSK-DEV-1 — Path-aware CI (`ci.yml`) — **P0** — Owner: **Codex**

**Goal**: Skip `api`/`frontend` jobs for docs-only PRs; keep gates for changed areas.
**Acceptance**

* PR with only `docs/**` triggers labeler & proofs-gate but **skips** api/frontend builds.
* PR with `api/**` runs api job; with `frontend/**` runs frontend job; both on `push`/`pull_request`.
* No loss of previous behavior (typecheck/build if present).

### TSK-P-4 — Guardrails (required checks) — **P0** — Owner: **Codex**

**Goal**: Main branch protected; **required** checks include: `ci`, `proofs-gate`, and (when enabled) `uptime`.
**Acceptance**

* Branch protection screenshot in PR comment.
* Merging blocked if proofs missing when routes/CORS touched.

### TSK-VOX-\* — Voice feature track (high level)

* **VOX-1 Foundation**: WebAudio/WebSpeech (or alternative), streaming WS, TTS/TTV bridge, privacy toggles, KV-backed `voice_prefs` per user.
  *Acceptance*: E2E demo: press-to-talk & continuous-listen variants; preference round-trip via `/api/voice/prefs`.
* **VOX-2 Wake-word**: user-defined hotwords; CPU budget caps; on-device model.
  *Acceptance*: false-positive rate baseline, opt-in only.
* **VOX-3 Multilingual/accent**: language auto-detect; accent hints.
  *Acceptance*: 95%+ correct language detect in seed set; user voice command to switch language.
* **VOX-4 Emotion/sentiment**: capture valence/arousal; tone shaping on TTS.
  *Acceptance*: TTS style/speed/pitch change via voice command & sentiment classifier label.
* **VOX-5 Offline fallback (DeepSpeech)**: local path for low-connectivity; upload queued transcripts when back online.
* **VOX-6 Command router**: context (scene/mood/time) → dispatch to builders/scaffolders/toggles.
  *Acceptance*: 20 canonical voice intents mapped with tests.
* **VOX-7 Voice auth & personalization**: optional; do not block core flows.
  *Acceptance*: enrollment UX; per-user voiceprints; legal/privacy gates.
* **VOX-8 Accessibility + onboarding**: screen-reader parity; voice tour; hints.
  *Acceptance*: WCAG-aligned checks.
* Remaining VOX tasks (9–17) add transcripts/export, notifications, XP/quests, personality, team mode, confusion/hesitation aid, mood tracking, and the **voice FAQ** agent.

### TSK-GEN-\* — GenAI feature track

* **GEN-1 App from spec**: “build app” flow that outputs microservices + CI + PR; uses App Graph.
* **GEN-2 Explainers**: `/explain code|test|api` skills; voice variants.
* **GEN-3 Safety rails**: codemods + tests mandatory in PRs.
* **GEN-4 Prompt evals**: golden answers & envelopes; fail CI on drift.
* **GEN-5 Model router**: cost caps per tenant; A/B.

### Platform/Hardening deltas

* **B-1/B-2**: migrations & flags; **H-3** budgets; **H-1/H-2** proofs & prompt tests—unchanged in spirit, wired to new CI.

---

## D. Codex Work Queue (next 10 to start)

1. **DEV-1** Finalize & merge path-aware `ci.yml`.
2. **P-6** Add `nightly-probes.yml` (JWKS, preflight, AI binding) with artifact upload.
3. **P-4** Branch protection recipe PR (docs + screenshot) & enable.
4. **DEV-2** Convert existing probe scripts into re-usable composite action.
5. **GEN-4** Add minimal prompt goldens + CI step.
6. **VOX-9** Transcript export utility + `/download` endpoint (txt/md/docx).
7. **VOX-6** Voice command router skeleton + tests (mock intent table).
8. **VOX-1** Expand `/api/voice/prefs` schema (ttsStyle, speed, pitch, wakeWord, language).
9. **DEV-3** Neon migration workflow skeleton (dry-run only).
10. **B-3** Incident Copilot stub: capture error spike → open tracking issue with logs.

> Each PR must: update **status** here, add/keep docs, and attach **proofs** when routes/headers change.

---

## E. Definition of Done (per PR)

1. **Docs updated** (README/OPS & any contract notes).
2. **Proofs** saved under `ops/proofs/` if routes/headers/JWKS changed.
3. **CI green** (`ci`, `proofs-gate`, and any required guards).
4. **No direct CF edits**; **Deploy** happens from `main` only.
5. **Rollback** steps documented in the PR description.

---

## F. Task index (full)

> Use this index to track status; move items between `queued` → `in-progress` → `done`. Owners default to **Codex** unless noted.

* **Production/OPS**: TSK-P-1…P-6
* **CI/CD**: TSK-DEV-1…DEV-3
* **Differentiators**: TSK-A-1…A-5
* **Scale/Platform**: TSK-B-1…B-5
* **Hardening**: TSK-H-1…H-3
* **Voice**: TSK-VOX-1…VOX-17
* **GenAI**: TSK-GEN-1…GEN-5

---

*Last aligned with current production contract for `api.cognomega.com` (RS256 guest auth, JWKS, strict CORS; KV the source for billing).*

