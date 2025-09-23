Cognomega — CI/CD & Automation Playbook (for Humans & Codex)

Goals

Every change flows through PRs (humans or Codex), never via direct dashboard edits.

Production is reproducible: code → CI checks → gated merge → deploy → probes → proofs.

Sensitive changes (routes/CORS/headers) must attach proofs in ops/proofs/.

Rollback is a git revert + auto-deploy.

This doc is the single source of truth for how we ship.

0) Pipeline at a Glance
Author/Codex → Pull Request (template + labels)
        │
        ├─▶ CI: “ci.yml”
        │     - install, typecheck, build (api + frontend)
        │     - fast feedback (no secrets)
        │
        ├─▶ Auto-labeler: “labeler.yml”
        │     - tag PRs based on changed files (e.g., change:routes)
        │
        ├─▶ Proofs gate: “proofs-gate.yml”
        │     - if change:routes|cors|headers → require files in ops/proofs/**
        │
        ├─▶ Human review (or Codex + maintainer)
        │
        └─▶ Merge to main
              │
              └─▶ Deploy API: “deploy-api.yml”
                    - wrangler deploy (uses CF secrets)
                    - post-deploy probes
                    - upload proofs artifact


Environments

GitHub: CI & deployments

Cloudflare Workers: API worker (cognomega-api)

Cloudflare KV/R2/AI: storage/bindings used by the worker

Neon: optional/legacy SQL paths (KV remains SoT for credits/usage/jobs)

1) Repository Secrets & Config
GitHub → Repository Secrets (Actions)

Make sure the keys match names below exactly.

Name	Used by	Notes
CLOUDFLARE_ACCOUNT_ID	deploy-api.yml	Cloudflare account ID
CLOUDFLARE_API_TOKEN	deploy-api.yml	API token with Workers Scripts:Edit & KV/R2 read (no secrets stored here)

Worker secrets like PRIVATE_KEY_PEM, ADMIN_API_KEY, OPENAI_API_KEY, etc. are managed in Cloudflare (Dashboard or wrangler secret put) and not kept in GitHub.

Labels (create once)

Use gh CLI (recommended):

gh label create "codex:ready"         -c 1f883d -d "Template complete, CI green, ready for review"
gh label create "ops:proofs-attached" -c 8250df -d "Required proofs linked in PR (ops/proofs/*)"
gh label create "change:routes"       -c d93f0b -d "Modifies wrangler routes or CF routing"
gh label create "change:cors"         -c fbca04 -d "Modifies CORS behavior"
gh label create "change:headers"      -c fbca04 -d "Changes response headers contract"
gh label create "docs:runbook"        -c 0e8a16 -d "Updates OPS.md/README"
gh label create "risk:p1"             -c d93f0b -d "Elevated risk; guarded rollout"

2) Workflows (what each does)
ci.yml — Build & Typecheck (fast)

Trigger: any PR or push.

Jobs:

api: install (pnpm/npm), tsc --noEmit, npm run build --if-present.

frontend: same pattern.

Purpose: quick smoke—verify the change compiles and types are sane.

labeler.yml — Auto-label PRs

Trigger: PR events.

Applies labels based on file paths:

ops/proofs/** → ops:proofs-attached

api/wrangler.toml → change:routes

api/src/** → change:cors, change:headers

OPS.md, README.md → docs:runbook

proofs-gate.yml — Require proofs for sensitive changes

Trigger: PR events (open/sync/relabel).

If PR has any of change:routes|change:cors|change:headers, the job fails unless the PR adds/updates at least one file in ops/proofs/**.

This prevents accidental route/CORS/header drifts without evidence.

deploy-api.yml — Deploy to Cloudflare

Trigger: push to main touching api/** or the workflow itself.

Steps:

Check out & set up Node.

Install wrangler.

Install API deps (pnpm/npm).

wrangler deploy with:

CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

Post-deploy probes (JWKS, /auth/guest, CORS preflight, ai/binding).

Upload probes as an artifact.

Note: We deploy only the API Worker via CI. The frontend (Pages) deploy remains a separate job or manual (see OPS.md) and can be automated later.

3) PR Etiquette (Humans & Codex)
Use the default PR template

Fill Summary, Type, Contract & Ops Checklist, Proofs, Testing, and Backwards compatibility.

If the change touches routes/CORS/headers, either:

Switch to the Ops Routing template, or

Keep the defaults but ensure proofs and labels are added.

Required labels

Always add: codex:ready when CI is green and the template is complete.

Add as applicable: ops:proofs-attached, change:routes, change:cors, change:headers.

Proofs (what to attach in ops/proofs/)

JWKS head: /.well-known/jwks.json first ~120 chars.

/auth/guest quick decode: header.alg = RS256, payload.iss = https://api.cognomega.com.

CORS preflight to /api/si/ask with X-Intelligence-Tier.

GET /api/ai/binding → { ai_bound: true }.

If credits/jobs paths changed: an example usage row & headers from /api/si/ask.

We keep these as text files (PowerShell or curl output is fine). CI also runs probes post-deploy and uploads them as artifacts.

4) Deploys, Smoke, and Rollbacks
What auto-deploys?

API Worker whenever main changes under api/**.

All Worker secrets must already exist in Cloudflare and are not pulled from GitHub.

Post-deploy smoke (automated in deploy-api.yml)

GET /api/ai/binding

Head of JWKS

OPTIONS preflight for /api/si/ask with custom headers

Artifacts: Actions → the deploy run → Artifacts → post-deploy-proofs.

Manual smoke (PowerShell)
$base = "https://api.cognomega.com"

# JWKS head (first 120 chars)
(Invoke-WebRequest "$base/.well-known/jwks.json").Content.Substring(0,120)

# Guest token check
$g = Invoke-RestMethod -Method POST "$base/auth/guest"; $t = $g.token
$t.Split('.')[0..1] | ForEach-Object {
  $s = $_.Replace('-','+').Replace('_','/'); switch($s.Length%4){2{$s+='=='};3{$s+='='}}
  [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

# CORS preflight
Invoke-WebRequest -Method OPTIONS "$base/api/si/ask" -Headers @{
  "Origin" = "https://app.cognomega.com"
  "Access-Control-Request-Method"="POST"
  "Access-Control-Request-Headers"="content-type, x-user-email, x-intelligence-tier"
} | Select-Object -ExpandProperty Headers

Rollback

Revert the offending PR locally (or via GitHub UI).

Merge the revert → deploy-api.yml redeploys the previous working worker.

Add a short note & proof of restore to ops/proofs/.

5) Codex Operating Guide

Codex should always:

Open PRs (never push to main).

Use the default PR template and tick the checklist.

If changing routes/CORS/headers, attach proofs in ops/proofs/ and apply labels.

Mention:

Which endpoints touched

Any added headers and exposed headers

If wrangler.toml routes changed, paste the exact snippet.

Wait for CI → apply codex:ready when green.

Codex PRs are blocked unless:

CI passes and

The proofs-gate is satisfied for sensitive changes.

6) What lives where (source of truth)

OPS.md — Runbook (deploy commands, probes, endpoints summary).

README.md — Public API contract (exposed headers list; /auth/guest & JWKS).

docs/roadmap.md — Milestones and acceptance gates.

docs/tasks.md — Trackable tasks (IDs used in PR titles if needed).

docs/architecture.md — Service & data flow overview.

docs/tools-and-tech.md — Approved tech list (Cloudflare, Neon optional, Cartesia, etc.).

ops/proofs/ — Evidence for changes (attached to PRs & CI artifacts).

api/wrangler.toml — Single owner of api.cognomega.com/* route.

7) Adding a New API Endpoint (safe pattern)

Implement handler in api/src/index.ts or module.

Do not add new routes in Cloudflare Dashboard — only in wrangler.toml.

Update README (contract) and OPS (probes if applicable).

Attach updated proofs.

Open PR → wait for green CI → label codex:ready + ops:proofs-attached.

Merge → deploy → review post-deploy probes artifact.

8) Voice Features: CI/Codex Hooks (KV_PREFS)

KV_PREFS is the KV namespace for voice preferences.

Any change touching voice prefs or new /api/voice/* endpoints should:

Validate KV_PREFS binding in wrangler.toml.

Include a small KV sanity proof:

wrangler kv key put --binding=KV_PREFS prefs:probe:<guid> ok:<iso>

wrangler kv key get --binding=KV_PREFS <key>

wrangler kv key delete --binding=KV_PREFS <key>

Attach the console output to ops/proofs/voice-prefs-*.txt.

9) Neon (optional/legacy paths)

KV remains the source of truth for credits/usage/jobs.

If PR touches legacy SQL handlers:

Ensure JWT-based identity chain (query → header → JWT/cookie) is kept.

Add “SQL touched” note in PR, and supply a minimal migration plan only if required.

No automatic migrations are run by current CI; keep Neon changes manual & explicit.

10) Branch Protection (recommended)

Enable on main:

Require status checks to pass:

api (ci)

frontend (ci) (if you keep it)

require-proofs (proofs-gate)

Require PR reviews (at least 1 human for risk:p1 or any of change:* labels).

Dismiss stale reviews on new commits.

11) Common Pitfalls & Fixes

CLOUDFLARE secret name mismatch

Make sure workflow uses secrets.CLOUDFLARE_ACCOUNT_ID and secrets.CLOUDFLARE_API_TOKEN.

Wrangler deploy fails due to missing worker secrets

Set them in CF: wrangler secret put PRIVATE_KEY_PEM, ADMIN_API_KEY, etc.

Proofs-gate fails

Add at least one file under ops/proofs/ for sensitive changes and push.

CORS confusion in browser

It’s the preflight that must list custom headers (X-Intelligence-Tier).

Our responses expose billing headers for JS to read.

12) Quick Reference Commands
Local bundle check (API)
cd api
npx --yes esbuild src/index.ts --bundle --platform=neutral --outfile=out.tmp.js

Deploy from local (rare; prefer CI)
cd api
export CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=...
npx wrangler@3 deploy

Worker secrets (Cloudflare)
cd api
npx wrangler secret put PRIVATE_KEY_PEM
npx wrangler secret put ADMIN_API_KEY
# ... other provider keys as needed

13) Definition of Done (per PR)

✅ CI green (ci.yml)

✅ Labels applied (incl. codex:ready)

✅ Proofs present if sensitive (proofs-gate.yml passes)

✅ README/OPS updated if contracts/ops changed

✅ Post-deploy probes captured (artifact) after merge

Last updated: aligned with current ci.yml, deploy-api.yml, proofs-gate, labeler, and Cloudflare-only API deploys. KV is SoT for credits/usage/jobs; Neon is optional for legacy paths.