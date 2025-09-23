# Cognomega — Production Runbook

**App**: [https://app.cognomega.com](https://app.cognomega.com)  
**API**: [https://api.cognomega.com](https://api.cognomega.com)  
**Health**: `GET /ready` → `{"ok": true, "provider": "...", "model": "..."}`  
**DNS**: `A/AAAA` records managed by Cloudflare; route `api.cognomega.com/*` to Worker

**Deploy (Pages)**

```powershell
cd frontend
npm ci
npm run build
wrangler pages deploy dist
```

**Deploy (API Worker)**

```powershell
cd api
npx wrangler deploy
```

**Tail logs**

```powershell
cd api
npx wrangler tail --format=pretty
```

---

## Environment & Bindings (API Worker)

Set via `wrangler.toml` or the CF dashboard.

### Required KV / R2 / AI bindings

* `AI` — Workers AI binding
* `KEYS` — KV namespace (stores JWKS, key `"jwks"`)
* `KV_BILLING` — KV namespace (credits, usage, jobs)
* `R2_UPLOADS` — R2 bucket for **direct uploads**
* (legacy/demo optional) `R2` — general R2 bucket for job artifacts
* **NEW:** `KV_PREFS` — KV namespace for **user/voice preferences** (presence now verified by admin snapshot)

### Secrets (Worker)

* `PRIVATE_KEY_PEM` — RS256 (PKCS#8, **BEGIN PRIVATE KEY**) for guest JWTs
* `ADMIN_API_KEY` — protects `/api/credits/adjust` & admin routes
* `GROQ_API_KEY` — if provider list includes `groq`
* `OPENAI_API_KEY` — if provider list includes `openai`
* (optional) `CARTESIA_API_KEY` — TTS demo endpoints, if enabled
* (optional) `NEON_DATABASE_URL` or `DATABASE_URL` — if you use Neon-backed parts of `index.ts`

> ⚠️ **Note:** The consolidated Auth/Billing/Jobs/SI module uses **KV** for credits/usage/jobs. A Neon DB is **not required** for those features. Some legacy/demo endpoints in `index.ts` do use Neon; keep that secret only if you need those.

### Vars (Worker)

* `ALLOWED_ORIGINS` — CSV of allowed origins (e.g. `https://app.cognomega.com,https://www.cognomega.com`)
* `ISSUER` — JWT issuer (default `https://api.cognomega.com`)
* `JWT_TTL_SEC` — RS256 guest token TTL (default `3600`)
* `KID` — JWKS key id (e.g. `k1`)
* `PREFERRED_PROVIDER` — order to try LLMs, e.g. `groq,cfai,openai`
* `GROQ_MODEL` — default `llama-3.1-8b-instant`
* `CF_AI_MODEL` — default `@cf/meta/llama-3.1-8b-instruct`
* `OPENAI_MODEL` — default `gpt-4o-mini`
* `OPENAI_BASE` — default `https://api.openai.com/v1`
* `GROQ_BASE` — default `https://api.groq.com/openai/v1`
* `CREDIT_PER_1K` — credits charged per 1k tokens (e.g. `0.05`)
* `MAX_UPLOAD_BYTES` — direct upload cap (bytes), default `10485760` (10 MB)
* (optional) `WARN_CREDITS`, `USAGE_TTL_DAYS`, `JOB_TTL_DAYS`

### Vars (Pages)

* `VITE_API_BASE=https://api.cognomega.com`
* (optional) `VITE_TURNSTILE_SITE_KEY=<site key>` if the app uses Turnstile

### Uptime Monitoring

* `.github/workflows/uptime.yml` (every 5 min) — ensure endpoints respond

### Infra quick map

* **KV**: `KEYS` (JWKS), `KV_BILLING` (credits / usage / jobs), **`KV_PREFS` (user/voice prefs)**
* **R2**: `cognomega-uploads` bound as `R2_UPLOADS` (and optional `cognomega-prod` as `R2`)
* **AI**: Workers AI binding attached to the API Worker
* **Neon**: optional for legacy/demo paths; Auth/Billing/Jobs/SI runs without it

---

## CORS Policy (what to expect)

The API implements **strict, explicit CORS** and **proper preflight**:

* **Preflight (OPTIONS)** merges the browser’s `Access-Control-Request-Headers` with the base allow-list.
  That means custom headers such as `X-Intelligence-Tier` are accepted when requested by the browser.
* **Normal responses** include `Access-Control-Expose-Headers` so frontends can read billing/usage headers.

**Allowed Methods**: `GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH`  
**Allowed Headers (base)**:  
`Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token`  
**Plus any requested headers** from the preflight (e.g. `X-Intelligence-Tier`)  
**Exposed Headers**:  
`Content-Type, Content-Disposition, X-Request-Id, X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model`  
**Credentials**: `true` • **Max-Age**: `86400`

> Ensure `ALLOWED_ORIGINS` includes your app origin (e.g., `https://app.cognomega.com`).

---

## Public Endpoints (consolidated)

* **Auth**

  * `POST /auth/guest` (aliases: `/api/auth/guest`, `/api/v1/auth/guest`) → issue RS256 guest JWT
  * `GET /.well-known/jwks.json` → JWKS from KV (`KEYS`)

* **Credits & Usage (KV)**

  * `GET /api/credits` (aliases: `/credits`, `/api/v1/credits`)
  * `POST /api/credits/adjust` — **admin-only**; `{ email, set? , delta? }`
  * Usage feed:

    * `GET|POST /api/billing/usage`
    * Aliases: `/api/usage`, `/usage`, `/api/v1/usage`, `/api/v1/billing/usage`

* **SI (Skills/Intelligence)**

  * `POST /api/si/ask` (alias: `/si/ask`) — orchestrates Groq/Workers AI/OpenAI, emits billing headers, logs usage, debits credits

* **Jobs (KV)**

  * `GET|POST /api/jobs` — list or create job (`type: "si"` supported)
  * `GET|PATCH /api/jobs/:id`
  * `POST /api/jobs/run` — synchronous run for `type: "si"`

* **Uploads (R2)**

  * `POST /api/upload/direct?filename=<name>` — direct binary upload; validates `Content-Length`; enforces `MAX_UPLOAD_BYTES`

* **AI / Admin**

  * `GET /api/ai/binding` — sanity check Workers AI binding
  * `POST /api/ai/test` — quick LLM ping via Workers AI
  * `GET /api/admin/ping` — checks admin key
  * `POST /api/admin/cleanup` — prune old KV usage/jobs (supports `dry_run`)
  * **`GET /api/admin/env-snapshot` — shows non-secret env summary (now includes `KV_PREFS` presence)**

* **Health**

  * `GET /ready` (and `/healthz`, `/api/healthz`, `/api/v1/healthz` aliases provided in `index.ts`)

---

## Identity resolution

Endpoints accept identity via (first match wins):

1. Query param `?email=...`
2. Header `X-User-Email: ...`
3. Bearer/cookie JWT claims (`email` | `em` | `sub`) — for guest tokens or signed users

For browser calls, prefer sending `X-User-Email`.

---

## Billing headers on SI calls

Successful `POST /api/si/ask` includes **exposed** headers:

* `X-Provider`: `groq` | `cfai` | `openai`
* `X-Model`: concrete model used
* `X-Tokens-In`, `X-Tokens-Out`: tokens for accounting (estimates when upstream doesn’t return)
* `X-Credits-Used`: credits billed for the call
* `X-Credits-Balance`: remaining balance (non-guest)

JSON responses set `Cache-Control: no-store`.

---

# Quick API sanity test (CORS + billing headers)

This verifies:

* DNS + routing to `https://api.cognomega.com`
* Preflight CORS (incl. `X-Intelligence-Tier`)
* SI endpoint billing headers (`X-Provider`, `X-Model`, tokens, credits)
* Credits balance & usage feed

## 0) Preflight: CORS (OPTIONS)

```powershell
# Add Origin explicitly for a realistic preflight
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask" ^
  -H "Origin: https://app.cognomega.com" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"
```

**Expect** `204` and headers:

* `Access-Control-Allow-Origin: https://app.cognomega.com` (or your origin)
* `Access-Control-Allow-Methods: GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH`
* `Access-Control-Allow-Headers: ... X-User-Email, X-Admin-Key, X-Admin-Token, X-Intelligence-Tier ...`
* `Access-Control-Max-Age: 86400`

> Tip: **Preflight** is what must list `X-Intelligence-Tier`; the POST response does not need to echo the allow-list.

## 1) Seed credits (admin)

```powershell
$hdr = @{ "X-Admin-Key" = "<ADMIN_API_KEY>"; "Content-Type" = "application/json" }
$body = @{ email="vihaan@cognomega.com"; delta=10 } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits/adjust' -Method POST -Headers $hdr -Body $body
```

## 2) Browser-equivalent SI call (PowerShell)

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

## 3) Credits & usage

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }

Invoke-RestMethod -Uri 'https://api.cognomega.com/api/billing/usage?limit=5' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
```

## 4) JS fetch (for a quick browser console poke)

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

## Additional Ops Tasks

### JWKS sanity

```powershell
(Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json").Content | ConvertFrom-Json
```

Expect a `keys` array (managed in KV `KEYS` under key `jwks`).

### Guest token

```powershell
Invoke-RestMethod -Method POST "https://api.cognomega.com/auth/guest"
# -> { "token": "...", "exp": ... }
```

### Admin cleanup (KV)

Prune **old** usage and job rows (dry-run first):

```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/admin/cleanup' -Method POST `
  -Headers @{ 'X-Admin-Key'='<ADMIN_API_KEY>'; 'Content-Type'='application/json' } `
  -Body (@{ kind='both'; older_than_days=30; limit=500; dry_run=$true } | ConvertTo-Json)
```

### Direct upload (R2)

```powershell
# 1MB test file
$bytes = new-object byte[] (1024*1024); (new-object Random).NextBytes($bytes); [IO.File]::WriteAllBytes("random.bin", $bytes)
Invoke-RestMethod `
  -Uri "https://api.cognomega.com/api/upload/direct?filename=random.bin" `
  -Method POST `
  -Headers @{ "X-User-Email"="vihaan@cognomega.com"; "Content-Type"="application/octet-stream" } `
  -InFile "random.bin" `
  -ContentType "application/octet-stream"
```

---

## NEW: Env Snapshot Probe (KV_PREFS presence)

Use this after any **wrangler**, **DNS**, or **binding** change to confirm the worker sees all bindings, including the new `KV_PREFS` store for voice/user preferences.

```powershell
$ADMIN = "<ADMIN_API_KEY>"
$env = Invoke-RestMethod -Uri "https://api.cognomega.com/api/admin/env-snapshot" -Headers @{ "X-Admin-Key" = $ADMIN }
$env.bindings | ConvertTo-Json
```

**Expect**:
```json
{
  "AI": true,
  "KEYS": true,
  "KV_BILLING": true,
  "KV_PREFS": true,
  "R2": true,
  "R2_UPLOADS": true
}
```

> Save output under `ops/proofs/env-snapshot-YYYYMMDD-HHMMSS.txt` as part of your change checklist.

---

## Troubleshooting

### CORS blocked

* Ensure `ALLOWED_ORIGINS` includes your app origin (e.g., `https://app.cognomega.com`).
* Verify **preflight** reflects your custom headers. Test with explicit `Origin` and `Access-Control-Request-Headers`.
* Responses set `Access-Control-Expose-Headers` so your JS can read `X-*` billing headers.

### 402 Payment Required

* Top up via `/api/credits/adjust` (admin) or use a `guest:` token (where applicable).
* Check `X-Credits-Balance` in the SI response (exposed header).

### `ai_bound: false`

* `GET /api/ai/binding` returns `ai_bound: false` if Workers AI is not attached. Attach the **AI binding** to the worker and redeploy.

### DNS errors in browser

* Verify DNS resolution:

```powershell
Resolve-DnsName api.cognomega.com
```

* Check corporate proxy or local DNS filters. CF IPs must be reachable.

### KV/R2

* Ensure namespaces/buckets are bound and named correctly in `wrangler.toml`.
* For large uploads, verify `Content-Length` is present and < `MAX_UPLOAD_BYTES`.

---

## Security Notes

* Admin endpoints require `X-Admin-Key` (and/or `X-Admin-Token` for specific routes).
* JWTs are RS256-signed using `PRIVATE_KEY_PEM` (PKCS#8). Public keys are served at `/.well-known/jwks.json`.
* JSON endpoints set `Cache-Control: no-store`.
* CORS is origin-locked via `ALLOWED_ORIGINS` and only exposes specific headers to the browser.

---

## Appendix: Minimal `wrangler.toml` sketch (API)

```toml
name = "cognomega-api"
main = "src/index.ts"
compatibility_date = "2025-09-01"

routes = [
  { pattern = "api.cognomega.com/*", zone_name = "cognomega.com" }
]

[[kv_namespaces]]
binding = "KEYS"
id = "<kv-keys-id>"

[[kv_namespaces]]
binding = "KV_BILLING"
id = "<kv-billing-id>"

[[kv_namespaces]]
binding = "KV_PREFS"
id = "<kv-prefs-id>"

[[r2_buckets]]
binding = "R2_UPLOADS"
bucket_name = "cognomega-uploads"

# optional legacy
[[r2_buckets]]
binding = "R2"
bucket_name = "cognomega-prod"

[ai]
binding = "AI"

[triggers]
crons = ["*/5 * * * *"]

[vars]
ALLOWED_ORIGINS = "https://app.cognomega.com,https://www.cognomega.com"
PREFERRED_PROVIDER = "groq,cfai,openai"
GROQ_MODEL = "llama-3.1-8b-instant"
CF_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct"
OPENAI_MODEL = "gpt-4o-mini"
CREDIT_PER_1K = "0.05"
MAX_UPLOAD_BYTES = "10485760"
ISSUER = "https://api.cognomega.com"
JWT_TTL_SEC = "3600"
KID = "k1"
```

(Secrets are set via `wrangler secret put ...` or the dashboard.)

---

## Appendix: DNS / Route Quick Check

```powershell
Resolve-DnsName api.cognomega.com
# Expect Cloudflare Anycast IPs

# Preflight smoke
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask" ^
  -H "Origin: https://app.cognomega.com" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"
```

---

## Routes & Ownership (Zone Audit)

> Goal: guarantee that **api.cognomega.com/** is routed to the **intended Worker only**, and that Pages/other Workers don’t shadow the API. Use this before/after any route, DNS, or wrangler.toml change.

### 1) Confirm intended routing (repo-side)
```powershell
# From repo root
Get-Content -Raw "api\wrangler.toml" | Select-String -Pattern '^\s*routes\s*=|pattern\s*=|zone_name\s*='
```

### 2) Confirm in Cloudflare UI
* Workers → **cognomega-api** → **Triggers → Routes**: `api.cognomega.com/*`
* Zone → **DNS**: `api.cognomega.com` orange-cloud **proxied**

### 3) Capture proofs (commit under ops/proofs/)
```powershell
# JWKS head (first 120 chars) and AI binding
$jwks = (Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json").Content
$jwksHead = $jwks.Substring(0, [Math]::Min(120, $jwks.Length))
$ai = Invoke-RestMethod "https://api.cognomega.com/api/ai/binding"

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
@"
== AI binding ==
$(( $ai | ConvertTo-Json -Compress ))

== JWKS (first 120 chars) ==
$jwksHead
"@ | Set-Content -Encoding utf8 -NoNewline "ops\proofs\api-route-audit-$ts.txt"
```

> Always refresh these proofs after changes to **wrangler.toml**, **DNS**, or **Worker routes**.
