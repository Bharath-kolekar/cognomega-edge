# Codex PR SOP (Single Source of Truth)

**Purpose**  
Standardize how Codex (and humans) propose, validate, and ship changes to the Cognomega repos—safely, reproducibly, and with proofs.

**Scope**  
- Repos: `cognomega-edge` (frontend + API worker).  
- Environments: Cloudflare Workers (API), Pages (frontend), KV/R2/AI bindings, Neon (future/optional).  
- Applies to: code, docs, configs (e.g., `wrangler.toml`, DNS/route notes).

---

## 1) Branching & Labels

**Branch naming (Codex & humans):**
- `codex/feat-<slug>` — features
- `codex/fix-<slug>` — bugfixes
- `codex/docs-<slug>` — docs-only

**Required PR labels:**
- `codex:ready` — Codex believes the PR is ready for review
- `ops:proofs-attached` — proofs added to `ops/proofs/` and/or CI artifacts
- `risk:api-route` — routes/CORS/JWKS/headers changed (adds stricter checks)
- `docs-only` — documentation-only change
- `needs:review` — explicitly asking for human review
- `ci:green` — (bot-applied) all CI checks passed
- `codex:changes-requested` — (reviewer) revisions requested
- `codex:blocked` — cannot proceed (missing secret/binding/route ownership)

---

## 2) PR Template (paste into `.github/pull_request_template.md`)

```markdown
# Summary
<!-- What & why in 1–3 sentences -->

## What changed
- [ ] Code
- [ ] Docs (README / OPS)
- [ ] Config (wrangler.toml / routes / DNS)
- [ ] CI/CD

## Acceptance & Proofs
- [ ] Typecheck/build passes locally
- [ ] OPS probes (attach below)  
  - [ ] **AI binding**: `/api/ai/binding` ⇒ `{ "ai_bound": true }`
  - [ ] **JWKS head (120 chars)**: `/.well-known/jwks.json`
  - [ ] **Preflight**: `OPTIONS /api/si/ask` w/ custom headers
- [ ] If billing touched:  
  - [ ] `/api/credits/adjust` (admin) ⇒ balance updates  
  - [ ] `/api/si/ask` headers (`x-provider`, `x-model`, tokens, credits)
  - [ ] `/api/billing/usage` shows last event
- [ ] If uploads touched:  
  - [ ] `POST /api/upload/direct` (1MB ok)  
  - [ ] Oversize ⇒ `413 payload_too_large`
- [ ] If jobs touched:  
  - [ ] `/api/jobs` create + waitUntil completes; usage row exists
- [ ] Docs reflect any new routes/headers

## Route Ownership
- [ ] `api/wrangler.toml` has **exactly one** `routes` entry for `api.cognomega.com/*`
- [ ] No Pages/other Workers shadow the API

## Artifacts
- Attach proofs under `ops/proofs/<YYYYmmdd-HHMMSS>-<slug>.txt`
- Or include CI artifact `post-deploy-proofs`

## Rollback plan
- Revert PR, redeploy; route weights back to previous; see OPS.md.
```

---

## 3) Pre‑PR Checklist (Codex must run before opening PR)

1) **Typecheck & Build**
```bash
# API
cd api
npm ci || pnpm i --no-frozen-lockfile
npx -y tsc --noEmit || true
npm run -s build --if-present || true

# Frontend
cd ../frontend
npm ci || pnpm i --no-frozen-lockfile
npx -y tsc --noEmit || true
npm run -s build --if-present || true
```

2) **Route audit**
- Ensure `api/wrangler.toml` has one route:  
  `routes = [{ pattern = "api.cognomega.com/*", zone_name = "cognomega.com" }]`

3) **OPS Probes (bash)**
```bash
base="https://api.cognomega.com"

echo "== ai/binding =="
curl -sS "$base/api/ai/binding"

echo "== jwks (head 120) =="
curl -sS "$base/.well-known/jwks.json" | head -c 120

echo "== preflight si =="
curl -sSI -X OPTIONS "$base/api/si/ask" \
  -H "Origin: https://app.cognomega.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"
```

4) **Billing proofs (if applicable)**  
- Adjust credits (admin) then `/api/si/ask`, inspect headers, and verify usage feed shows it.

5) **Uploads proof (if applicable)**  
- `POST /api/upload/direct` 1MB ⇒ 200; oversize ⇒ 413.

6) **Jobs proof (if applicable)**
- Create a job, confirm completion & usage row linked via `job_id`.

7) **Docs**
- README & OPS.md updated if routes/headers/flow changed.

8) **Proof pack**
- Save command outputs to `ops/proofs/<timestamp>-<slug>.txt` (no secrets).

---

## 4) CI Gates (what must pass)

- **Build/Typecheck** for `api/` and `frontend/` (existing `ci.yml` OK).  
- **Deploy API** on `main` pushes (`deploy-api.yml`).  
- Optional nice‑to‑have:
  - Route audit job to grep `wrangler.toml` and fail on multiple routes.  
  - Upload `post-deploy-proofs` artifact from `deploy-api.yml`.

---

## 5) Merge Policy

- Do not merge if:
  - `risk:api-route` is set **and** `ops:proofs-attached` is missing.
  - CI not green.
  - PR body missing “Acceptance & Proofs” section.

- Merge when:
  - Labels `codex:ready`, `needs:review`, `ops:proofs-attached`, `ci:green` are present.
  - Reviewers have approved or requested minor changes addressed.

---

## 6) Rollback & Safety Nets

- Revert PR, re‑deploy worker (`wrangler deploy`).  
- CORS/Credentials regression: restore prior `ALLOWED_ORIGINS`, verify preflight.  
- JWT/JWKS: keep overlapping JWKS during key rotation; avoid breaking clients.  
- Billing outages: enforce minimum guest path; rate limit via KV counters.

---

## 7) Never Do

- Edit Cloudflare dashboard routes by hand (source of truth is `wrangler.toml`).  
- Push straight to `main` without PR + proofs.  
- Commit secrets or tokens to Git.  
- Change CORS headers without updating OPS.md and probe proofs.

---

_Last updated: keep this file referenced from README & OPS._
