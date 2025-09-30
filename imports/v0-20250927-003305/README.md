---

# Cognomega Edge — Monorepo

Monorepo for Cognomega edge services (API, frontend, tools).
Production domains:

* **API**: `https://api.cognomega.com`
* **App**: `https://app.cognomega.com`

The **Auth/Billing/Jobs/SI** functionality formerly in `cognomega-auth` has been consolidated into the **API worker**.

---

## Repo layout (high level)

```
.
├─ api/          # Cloudflare Worker (Hono) — API, CORS, Auth/Billing/Jobs/SI, uploads
├─ frontend/     # Web app (Vite/React, served via Pages)
├─ openapi/      # API definitions (optional)
├─ proxy/        # (optional) gateway or example reverse proxies
├─ tools/        # scripts/utilities
├─ workers/      # (decommissioned: auth) — keep empty/for future workers
└─ _ops/         # ops snapshots, CI bits
```

---

## Deploy & dev

### Deploy API

```bash
cd api
npx wrangler deploy
```

Wrangler will show bound resources and push `cognomega-api` with:

* Route: `api.cognomega.com/*`
* Cron: `*/5 * * * *` (queue kick)

### Tail logs

```bash
cd api
npx wrangler tail --format=pretty
```

### Local dev (API)

```bash
cd api
npx wrangler dev
```

> Some bindings (e.g., Workers AI, R2) require cloud mode or proper local stubs. For pure CORS/JSON flows `dev` is fine.

---

## Environment variables & bindings (API)

Set via `wrangler.toml` or dashboard:

**Vars**

* `ALLOWED_ORIGINS` — CSV of allowed origins (e.g. `https://app.cognomega.com,https://www.cognomega.com`)
* `ISSUER` — JWT issuer (default `https://api.cognomega.com`)
* `JWT_TTL_SEC` — JWT lifetime (default `3600`)
* `KID` — JWKS key id (`k1`, etc.)
* `PREFERRED_PROVIDER` — `groq,cfai,openai` (order of preference)
* `GROQ_MODEL` — default `llama-3.1-8b-instant`
* `CF_AI_MODEL` — default `@cf/meta/llama-3.1-8b-instruct`
* `OPENAI_MODEL` — default `gpt-4o-mini`
* `OPENAI_BASE` — default `https://api.openai.com/v1`
* `GROQ_BASE` — default `https://api.groq.com/openai/v1`
* `CREDIT_PER_1K` — billing rate per 1k tokens (e.g. `0.05`)
* `MAX_UPLOAD_BYTES` — per-request direct upload cap (default `10485760` = 10MB)

**Secrets**

* `PRIVATE_KEY_PEM` — RS256 (PKCS#8) private key for JWT
* `ADMIN_API_KEY` — admin endpoints
* `OPENAI_API_KEY` — if using OpenAI
* `GROQ_API_KEY` — if using Groq

**Bindings**

* `AI` — Workers AI binding
* `KEYS` — KV namespace for JWKS (key: `jwks`)
* `KV_BILLING` — KV namespace (credits + usage + jobs)
* `R2_UPLOADS` — R2 bucket for direct uploads
* (optional) `R2` — general R2 bucket for job artifacts (legacy/demo)

---

## CORS: what’s allowed

We operate **strict, explicit CORS** and respond to **preflight** properly.

* **Preflight (OPTIONS)** reflects `Access-Control-Request-Headers` from the browser and merges with our base allow list.
  That means **custom headers** such as `X-Intelligence-Tier` are allowed when the browser requests them.
* **Normal responses** include `Access-Control-Expose-Headers` so browsers can read usage/billing headers.

**Allowed Methods**: `GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH`
**Allowed Headers (base)**: `Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token`
**Plus any requested headers**, e.g. `X-Intelligence-Tier`.
**Exposed Headers** (readable from JS):
`Content-Type, Content-Disposition, X-Request-Id, X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model`
**Max-Age**: `86400` seconds

Ensure `ALLOWED_ORIGINS` includes your app origin (e.g., `https://app.cognomega.com`).

---

## Public endpoints (consolidated)

* **Auth**

  * `POST /auth/guest` (aliases: `/api/auth/guest`, `/api/v1/auth/guest`) → issue guest JWT (RS256)
  * `GET /.well-known/jwks.json` → public JWKS (from KV `KEYS`)

* **Credits / Usage (KV-based)**

  * `GET /api/credits` (aliases: `/credits`, `/api/v1/credits`) — returns `{email,balance_credits,updated_at,...}`
  * `POST /api/credits/adjust` — admin-only; body: `{ email, set? , delta? }`
  * Usage feed (aliases):
    `GET|POST /api/billing/usage`
    aliases: `/api/usage`, `/usage`, `/api/v1/usage`, `/api/v1/billing/usage`

* **SI (Skills/Intelligence)**

  * `POST /api/si/ask` (alias: `/si/ask`) — orchestrates Groq/Workers AI/OpenAI with usage & credits

* **Jobs (KV-based)**

  * `GET|POST /api/jobs` — list or create job (`type: "si"` supported)
  * `GET|PATCH /api/jobs/:id`
  * `POST /api/jobs/run` — synchronous run for `type: "si"`

* **Uploads (R2)**

  * `POST /api/upload/direct?filename=<name>` — direct binary upload, requires `Content-Length`, enforces `MAX_UPLOAD_BYTES`

* **AI / Admin**

  * `GET /api/ai/binding` — sanity check Workers AI binding
  * `POST /api/ai/test` — quick AI round-trip via Workers AI binding
  * `GET /api/admin/ping` — admin key echo: `{"ok": true/false}`
  * `POST /api/admin/cleanup` — prune old usage/jobs in KV (dry-run supported)

> Health: `/healthz`, `/api/healthz`, `/api/v1/healthz` are reserved by the outer router. The consolidated module purposely **does not** claim `/ready`.

---

## Billing & usage headers

On successful SI calls you’ll see these response headers (and they’re **exposed** to the browser):

* `X-Provider`: `groq` | `cfai` | `openai`
* `X-Model`: model used (e.g., `llama-3.1-8b-instant`)
* `X-Tokens-In` / `X-Tokens-Out`: token estimates or upstream counts
* `X-Credits-Used`: credits for this call
* `X-Credits-Balance`: remaining credits (for non-guest)

---

## Quick API sanity test (CORS + billing headers)

This verifies:

* DNS + routing to `https://api.cognomega.com`
* Preflight CORS (incl. `X-Intelligence-Tier`)
* SI endpoint billing headers (`X-Provider`, `X-Model`, tokens, credits)
* Credits balance & usage feed

### 0) Preflight: CORS (OPTIONS)

```powershell
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask"
```

**Expect** `204` and headers:

* `Access-Control-Allow-Origin: https://app.cognomega.com` (or your origin)
* `Access-Control-Allow-Methods: GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH`
* `Access-Control-Allow-Headers: ... X-User-Email, X-Admin-Key, X-Admin-Token, X-Intelligence-Tier ...`
* `Access-Control-Max-Age: 86400`

> Preflight is what must list `X-Intelligence-Tier`; the POST response doesn’t need to echo the allow-list.

### 1) Seed credits (admin)

```powershell
$hdr = @{ "X-Admin-Key" = "<ADMIN_API_KEY>"; "Content-Type" = "application/json" }
$body = @{ email="vihaan@cognomega.com"; delta=10 } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits/adjust' -Method POST -Headers $hdr -Body $body
```

### 2) Browser-equivalent SI call (PowerShell)

```powershell
$headers = @{
  "Origin"              = "https://app.cognomega.com"
  "Content-Type"        = "application/json"
  "X-User-Email"        = "vihaan@cognomega.com"
  "X-Intelligence-Tier" = "pro"
}
$body = @{ skill="summarize"; input="hello from cors" } | ConvertTo-Json -Compress
$r = Invoke-RestMethod -Uri "https://api.cognomega.com/api/si/ask" -Method POST -Headers $headers -Body $body -ResponseHeadersVariable rh
$r
$rh # inspect headers
```

**Expect** `200` with body like:

```json
{"result":{"content":"Hello, how can I assist you today?"}}
```

and **exposed** headers:

* `X-Provider: groq`
* `X-Model: llama-3.1-8b-instant`
* `X-Tokens-In: <n>`
* `X-Tokens-Out: <n>`
* `X-Credits-Used: 0.00x`
* `X-Credits-Balance: <remaining>`

### 3) Credits & usage

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }

Invoke-RestMethod -Uri 'https://api.cognomega.com/api/billing/usage?limit=5' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
```

### 4) JS fetch (for a quick browser console poke)

```js
fetch("https://api.cognomega.com/api/si/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-Email": "vihaan@cognomega.com",
    "X-Intelligence-Tier": "pro"
  },
  body: JSON.stringify({ skill: "summarize", input: "hello from cors" }),
}).then(async r => {
  console.log("status", r.status);
  console.log("provider", r.headers.get("x-provider"));
  console.log("model", r.headers.get("x-model"));
  console.log("tokens", r.headers.get("x-tokens-in"), r.headers.get("x-tokens-out"));
  console.log("credits used", r.headers.get("x-credits-used"));
  console.log("balance", r.headers.get("x-credits-balance"));
  return r.json();
});
```

---

## Direct upload (R2) test

```powershell
# Example: 1MB random file
$bytes = new-object byte[] (1024*1024); (new-object Random).NextBytes($bytes); [IO.File]::WriteAllBytes("random.bin", $bytes)

Invoke-RestMethod `
  -Uri "https://api.cognomega.com/api/upload/direct?filename=random.bin" `
  -Method POST `
  -Headers @{ "X-User-Email"="vihaan@cognomega.com"; "Content-Type"="application/octet-stream" } `
  -InFile "random.bin" `
  -ContentType "application/octet-stream"
```

**Expect** `200` with `{ ok, key, size, etag?, version?, content_type }`.
If `413 payload_too_large`, adjust `MAX_UPLOAD_BYTES`.

---

## Troubleshooting

* **CORS blocked**

  * Ensure `ALLOWED_ORIGINS` includes your app origin (`https://app.cognomega.com`).
  * Confirm preflight (`OPTIONS`) lists any **custom headers** your app sends (e.g., `X-Intelligence-Tier`). We reflect browser-requested headers and merge with our base allow-list.

* **402 Payment Required on `/api/si/ask`**

  * Top up via `/api/credits/adjust` (admin). Example:

    ```powershell
    Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits/adjust' -Method POST `
      -Headers @{ 'X-Admin-Key'='<ADMIN_API_KEY>'; 'Content-Type'='application/json' } `
      -Body (@{ email='vihaan@cognomega.com'; delta=10 } | ConvertTo-Json)
    ```
  * Guests (`sub` like `guest:<uuid>`) can use free tier if configured.

* **`ai_bound: false`** on `/api/ai/binding`

  * Check Workers AI binding is attached to the worker.

* **DNS errors in browser**

  * Verify resolution:

    ```powershell
    Resolve-DnsName api.cognomega.com
    ```
  * If corporate DNS/proxy is in play, try a different network or ensure Cloudflare IPs aren’t blocked.

* **Uploads failing**

  * Ensure `Content-Length` is sent (curl/Invoke-RestMethod with `-InFile` sets it).
  * Check `MAX_UPLOAD_BYTES`.

---

## Decommission note (auth worker)

`workers/auth` has been removed. All routes previously served by **cognomega-auth** are now in the **API worker**:

* Guest auth & JWKS
* Credits & usage
* SI/Jobs
* Admin & cleanup
* Direct uploads

Search guardrails and CI/CD have been cleaned to remove old deploy jobs for the auth worker.

---

## Security

* Admin routes require `X-Admin-Key` (and/or `X-Admin-Token` where applicable).
* JWTs are signed with RS256; public keys are served at `/.well-known/jwks.json`.
* CORS is strict and origin-locked via `ALLOWED_ORIGINS`.

---

## Appendix: Handy curls (PowerShell-safe)

Preflight:

```powershell
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask"
```

SI ask:

```powershell
curl.exe -i -X POST "https://api.cognomega.com/api/si/ask" `
  -H "Origin: https://app.cognomega.com" `
  -H "Content-Type: application/json" `
  -H "X-User-Email: vihaan@cognomega.com" `
  -H "X-Intelligence-Tier: pro" `
  --data "{\"skill\":\"summarize\",\"input\":\"hello from cors\"}"
```

Credits:

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
```

Usage:

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/billing/usage?limit=5' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
```

Admin ping:

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/admin/ping' -Headers @{ 'X-Admin-Key'='<ADMIN_API_KEY>' }
```

Cleanup (dry-run):

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/admin/cleanup' -Method POST `
  -Headers @{ 'X-Admin-Key'='<ADMIN_API_KEY>'; 'Content-Type'='application/json' } `
  -Body (@{ kind='both'; older_than_days=30; limit=500; dry_run=$true } | ConvertTo-Json)
```

---
---

# API Contract & Operator Probes (Production)

This project exposes **one** authentication endpoint and **one** JWKS endpoint in production:

- **`POST /auth/guest`** — issues **RS256** guest JWTs (signed using `PRIVATE_KEY_PEM`, **PKCS#8**).  
- **`GET /.well-known/jwks.json`** — JWKS used to verify tokens issued by `/auth/guest`.

### CORS & Exposed Headers (stable)

Frontend clients can rely on the following response headers being **exposed** (readable via `fetch`):

- `Content-Type`
- `Content-Disposition`
- `X-Request-Id`
- `X-Credits-Used`
- `X-Credits-Balance`
- `X-Tokens-In`
- `X-Tokens-Out`
- `X-Provider`
- `X-Model`

**Preflight** (`OPTIONS`) merges the browser’s `Access-Control-Request-Headers` with the base allow-list. Ensure `ALLOWED_ORIGINS` contains your app origin(s).

### Billing/Usage Source of Truth (today)

- **KV** is the canonical storage for **credits**, **usage**, and **jobs**:
  - `KEYS` KV: serves JWKS at `/.well-known/jwks.json` (key: `jwks`).
  - `KV_BILLING` KV: `balance:*`, `usage:*`, and `jobs:*` keys.
- A future **Neon** migration is tracked for analytics/reporting only; production billing remains in **KV** until the cutover plan is approved.

### Operator Probes (summary)

> Full details and acceptance checklist live in `OPS.md`. Use these quick probes for smoke checks.

**Preflight (CORS)**

```powershell
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask" ^
  -H "Origin: https://app.cognomega.com" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"
```

**JWKS (first 120 chars)**

```powershell
$jwks = Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$jwks.Content.Substring(0, [Math]::Min(120, $jwks.Content.Length))
```

**AI binding**

```powershell
Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding"
# -> { "ai_bound": true }
```

**Guest token (RS256)**

```powershell
$g = Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
$tok = $g.token
```

### Route Ownership (guardrail)

- Cloudflare Worker: **`cognomega-api`** is the **only** worker with a route matching `api.cognomega.com/*`.
- `api/wrangler.toml` declares exactly one zone route:
  ```toml
  routes = [
    { pattern = "api.cognomega.com/*", zone_name = "cognomega.com" }
  ]
  ```

### Change Management (GitHub-only)

- All doc/code changes (including `OPS.md` and `wrangler.toml`) land via **PR to `main`**.
- No direct CF changes without a corresponding Git commit. If routes/DNS change, attach a fresh **route audit** proof to `ops/proofs/`.

---

## Documentation

- **Product & UI/UX**: [docs/README.md](docs/README.md)  
- **Operations**: [docs/OPS.md](docs/OPS.md)  
- **CI/CD**: [docs/ci-cd.md](docs/ci-cd.md)

