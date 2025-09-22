# Cognomega — Production Runbook (OPS)

Status: **SOURCE OF TRUTH**  
Last updated: 2025-09-23 (IST)

**App**: https://app.cognomega.com  
**API**: https://api.cognomega.com

**Health**: `GET /ready` → `{"ok": true, "provider": "...", "model": "..."}`  
**DNS**: `A/AAAA` managed by Cloudflare; **single** Worker route: `api.cognomega.com/*` → `cognomega-api`

> Principle: one owning route, strict CORS, RS256 guest auth with JWKS in KV, GitHub-only prod deploys (no CF preview until production is stable).

---

## Deploy

### Frontend (Pages)
```powershell
cd frontend
npm ci
npm run build
wrangler pages deploy dist
```

### API Worker (Gateway or single service)
```powershell
cd api
npx wrangler deploy
```

### Tail logs
```powershell
cd api
npx wrangler tail --format=pretty
```

> **Deployment policy:** No preview deployments on Cloudflare until production issues are completely resolved. Use **GitHub → main** as the single deployment source of truth.

---

## Environment & Bindings (API Worker)

Configured via `wrangler.toml` or Cloudflare dashboard.

### Required bindings
- `AI` — Workers AI binding
- `KEYS` — KV (stores JWKS under key `jwks`)
- `KV_BILLING` — KV (credits, usage, jobs — current source of truth for these)
- `R2_UPLOADS` — R2 bucket for **direct uploads**
- *(optional legacy/demo)* `R2` — general R2 bucket for job artifacts

### Secrets
- `PRIVATE_KEY_PEM` — **PKCS#8** RS256 (header: `BEGIN PRIVATE KEY`) for guest JWTs
- `ADMIN_API_KEY` — protects `/api/credits/adjust` & admin routes
- `GROQ_API_KEY` — if provider list includes `groq`
- `OPENAI_API_KEY` — if provider list includes `openai`
- *(optional)* `CARTESIA_API_KEY` — TTS endpoints
- *(optional)* `NEON_DATABASE_URL` or `DATABASE_URL` — only for legacy/demo Neon paths in `index.ts`

> **Note:** The consolidated Auth/Billing/Jobs/SI module uses **KV** for credits/usage/jobs. Neon is **not required** for those features today. Some legacy/demo endpoints in `index.ts` use Neon; keep its secret only if used.

### Vars
- `ALLOWED_ORIGINS` — CSV of allowed origins (e.g. `https://app.cognomega.com,https://www.cognomega.com`)
- `ISSUER` — JWT issuer (default `https://api.cognomega.com`)
- `JWT_TTL_SEC` — RS256 guest token TTL (default `3600`)
- `KID` — JWKS key id (e.g. `k1`)
- `PREFERRED_PROVIDER` — ordered LLM list, e.g. `groq,cfai,openai`
- `GROQ_MODEL` — default `llama-3.1-8b-instant`
- `CF_AI_MODEL` — default `@cf/meta/llama-3.1-8b-instruct`
- `OPENAI_MODEL` — default `gpt-4o-mini`
- `OPENAI_BASE` — default `https://api.openai.com/v1`
- `GROQ_BASE` — default `https://api.groq.com/openai/v1`
- `CREDIT_PER_1K` — credits charged per 1k tokens (e.g. `0.05`)
- `MAX_UPLOAD_BYTES` — direct upload cap (bytes), default `10485760` (10 MB)

### Pages vars
- `VITE_API_BASE=https://api.cognomega.com`
- *(optional)* `VITE_TURNSTILE_SITE_KEY=<site key>`

### Infra quick map
- **KV**: `KEYS` (JWKS), `KV_BILLING` (credits / usage / jobs)  
- **R2**: `cognomega-uploads` bound as `R2_UPLOADS` (and optional `cognomega-prod` as `R2`)  
- **AI**: Workers AI binding attached to the API Worker  
- **Neon**: optional for legacy/demo paths; **not** required for Auth/Billing/Jobs/SI

---

## CORS Policy (strict & explicit)

- **Preflight (OPTIONS)** merges browser’s `Access-Control-Request-Headers` with a base allow-list. Custom headers (e.g. `X-Intelligence-Tier`) are accepted when requested by the browser.
- **Normal responses** expose billing/usage headers so the frontend can read them.

**Allowed Methods**: `GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH`  
**Allowed Headers (base)**: `Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token`  
**Plus any requested headers** from preflight (e.g. `X-Intelligence-Tier`)  
**Exposed Headers**: `Content-Type, Content-Disposition, X-Request-Id, X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model`  
**Credentials**: `true` • **Max-Age**: `86400`

> Ensure `ALLOWED_ORIGINS` includes your app origin (e.g., `https://app.cognomega.com`).

---

## Public Endpoints (consolidated)

**Auth**
- `POST /auth/guest` (aliases: `/api/auth/guest`, `/api/v1/auth/guest`) → issue RS256 guest JWT
- `GET /.well-known/jwks.json` → JWKS from KV (`KEYS`)

**Credits & Usage (KV)**
- `GET /api/credits` (aliases: `/credits`, `/api/v1/credits`)
- `POST /api/credits/adjust` — **admin-only**; `{ email, set? , delta? }`
- Usage feed:
  - `GET|POST /api/billing/usage`
  - Aliases: `/api/usage`, `/usage`, `/api/v1/usage`, `/api/v1/billing/usage`

**SI (Skills/Intelligence)**
- `POST /api/si/ask` (alias: `/si/ask`) — orchestrates Groq/Workers AI/OpenAI, emits billing headers, logs usage, debits credits

**Jobs (KV)**
- `GET|POST /api/jobs` — list or create job (`type: "si"` supported)
- `GET|PATCH /api/jobs/:id`
- `POST /api/jobs/run` — synchronous run for `type: "si"`

**Uploads (R2)**
- `POST /api/upload/direct?filename=<name>` — direct binary upload (needs `Content-Length`); enforces `MAX_UPLOAD_BYTES`

**AI / Admin**
- `GET /api/ai/binding` — sanity check Workers AI binding
- `POST /api/ai/test` — quick LLM ping via Workers AI
- `GET /api/admin/ping` — checks admin key
- `POST /api/admin/cleanup` — prune old KV usage/jobs (`dry_run` supported)

**Health**
- `GET /ready` (and `/healthz`, `/api/healthz`, `/api/v1/healthz` aliases via `index.ts`)

---

## Identity resolution

Endpoints accept identity via (first match wins):
1) Query `?email=...`  
2) Header `X-User-Email: ...`  
3) Bearer/cookie JWT claims (`email` | `em` | `sub`) — guest tokens or signed users

> For browser calls, prefer `X-User-Email`.

---

## Billing headers on SI calls

Successful `POST /api/si/ask` includes **exposed** headers:
- `X-Provider`: `groq` | `cfai` | `openai`
- `X-Model`: concrete model used
- `X-Tokens-In`, `X-Tokens-Out`: token counts (estimated if upstream omits)
- `X-Credits-Used`: credits billed
- `X-Credits-Balance`: remaining balance (non-guest)

JSON responses set `Cache-Control: no-store`.

---

## Operator Probes (production)

### 0) CORS Preflight (OPTIONS)
```powershell
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method  = "OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp = $req.GetResponse()
$resp.StatusCode                                 # Expect: NoContent
$resp.Headers["Access-Control-Allow-Origin"]
$resp.Headers["Access-Control-Allow-Headers"]
$resp.Headers["Access-Control-Expose-Headers"]
$resp.Close()
```

### 1) Workers AI binding
```powershell
Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding"
# Expect: @{ ai_bound = True }
```

### 2) JWKS
```powershell
# Paste first 120 chars into proofs (see Audit section)
$r = Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$r.Content.Substring(0, [Math]::Min(120, $r.Content.Length))
```

---

## Additional Ops Tasks

### Seed credits (admin)
```powershell
$hdr = @{ "X-Admin-Key" = "<ADMIN_API_KEY>"; "Content-Type" = "application/json" }
$body = @{ email="vihaan@cognomega.com"; delta=10 } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits/adjust' -Method POST -Headers $hdr -Body $body
```

### Credits & usage
```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/credits' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/billing/usage?limit=5' -Headers @{ 'X-User-Email'='vihaan@cognomega.com' }
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

### Guest token
```powershell
Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
# -> { "token": "...", "exp": ... }
```

### Admin cleanup (KV)
```powershell
Invoke-RestMethod -Uri 'https://api.cognomega.com/api/admin/cleanup' -Method POST `
  -Headers @{ 'X-Admin-Key'='<ADMIN_API_KEY>'; 'Content-Type'='application/json' } `
  -Body (@{ kind='both'; older_than_days=30; limit=500; dry_run=$true } | ConvertTo-Json)
```

---

## Troubleshooting

**CORS blocked**
- `ALLOWED_ORIGINS` must include the app origin.
- Preflight must show your custom headers in `Access-Control-Allow-Headers`.
- Responses expose the `X-*` billing headers; read them client-side via `fetch`.

**402 Payment Required**
- Top up via `/api/credits/adjust` (admin). Check `X-Credits-Balance` on SI responses.

**`ai_bound: false`**
- Attach the **AI binding** to the Worker and redeploy.

**DNS errors**
```powershell
Resolve-DnsName api.cognomega.com
```
Ensure Cloudflare Anycast IPs are returned; check corporate proxies.

**KV/R2**
- Namespaces/buckets must be bound and spelled exactly as in `wrangler.toml`.
- For large uploads: ensure `Content-Length` and `< MAX_UPLOAD_BYTES`.

---

## Security Notes

- RS256 JWTs (PKCS#8 private key). Public JWKS at `/.well-known/jwks.json`.
- Admin endpoints require `X-Admin-Key`/`X-Admin-Token`.
- JSON endpoints use `Cache-Control: no-store`.
- CORS is origin-locked; only whitelisted headers are exposed.
- R2 uploads sanitize filenames; consider AV scan via queue.

---

## Appendix A — Minimal `wrangler.toml` sketch (API)

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

[[r2_buckets]]
binding = "R2_UPLOADS"
bucket_name = "cognomega-uploads"

# optional legacy artifacts
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

> Secrets set via `wrangler secret put ...` or Dashboard.

---

## Appendix B — DNS / Route Quick Check

```powershell
Resolve-DnsName api.cognomega.com

# Preflight smoke
curl.exe -i -X OPTIONS "https://api.cognomega.com/api/si/ask" ^
  -H "Origin: https://app.cognomega.com" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"
```

---

## Routes & Ownership (Zone Audit)

**Goal:** guarantee that **api.cognomega.com/** is routed to the **intended Worker only**, and Pages/other Workers don’t shadow the API. Run this **before/after** any change to wrangler.toml, DNS, or CF routes.

### 1) Confirm intended routing (repo-side)
```powershell
# Repo root
Get-Content -Raw "api\wrangler.toml" | Select-String -Pattern '^\s*routes\s*=|pattern\s*=|zone_name\s*=' -AllMatches
```

### 2) Confirm in Cloudflare Dashboard
- **Workers & Pages → Workers →** select **cognomega-api** → **Domains & Routes**: confirm the single route `api.cognomega.com/*`.
- **Pages →** for each Pages project:
  - Open the project → **Settings → Functions** (or **Build & Deploy → Functions**).
  - Ensure **no** Pages Functions route for `api.cognomega.com/*` and no **Custom Domains** that could shadow the API.

> If the menu item **Functions** is not visible on your account UI, look under “**Settings → Build & Deploy → Functions**” or the project’s **Custom Domains** page. Cloudflare’s UI labels change occasionally—focus on verifying Pages *isn’t* handling the API host/path pattern.

### 3) Capture proofs (commit with change)
Create: `ops/proofs/api-route-audit-YYYYMMDD-HHMMSS.txt` and paste:

```powershell
"== AI binding =="
Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding" | ConvertTo-Json -Compress

"== JWKS (first 120 chars) =="
(Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json").Content.Substring(0,120)

"== Preflight headers =="
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method="OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp=$req.GetResponse()
$resp.StatusCode
$resp.Headers["Access-Control-Allow-Origin"]
$resp.Headers["Access-Control-Allow-Headers"]
$resp.Headers["Access-Control-Expose-Headers"]
$resp.Close()
```

- Commit this file **with** any change to wrangler.toml, DNS, or Cloudflare routes.

### 4) Change checklist (must-do when routes/DNS change)
- [ ] Route verified in wrangler and Dashboard  
- [ ] Pages Functions **not** intercepting api host/path  
- [ ] Preflight 204 output recorded  
- [ ] `ai_bound: true` recorded  
- [ ] JWKS 120-char head recorded  
- [ ] Proofs file committed under `/ops/proofs/`

---

## FAQ

**“Where is Settings → Functions (or Routes)?”**  
- For Workers: **Workers & Pages → Workers →** select your worker → **Domains & Routes**.  
- For Pages: **Pages → [project] → Settings → Functions** (or **Build & Deploy → Functions**), and **Custom Domains**. Ensure no Pages function or custom domain is taking `api.cognomega.com/*`.

**“Which store is the source of truth today?”**  
- Credits, usage, jobs → **KV** (operational). Neon usage/ledger is legacy/future analytics.

**“What headers can my frontend read?”**  
- `X-Provider, X-Model, X-Tokens-In, X-Tokens-Out, X-Credits-Used, X-Credits-Balance, X-Request-Id` (exposed).

---

_End of OPS.md_
