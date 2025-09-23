# Cognomega — Start-of-Session Handoff Checklist (Single Source of Truth)

**Purpose**  
Use this *one* page at the **start of every new chat** to share the current production state and avoid drift. It standardizes what you paste and where proofs live.

**Golden rules**
- **GitHub-only deploys** to `main`. No direct CF dashboard edits.  
- **One API owner** for `api.cognomega.com/*` (`cognomega-api` Worker).  
- **KV is SoT** for credits/usage/jobs (Neon rollups later).  
- **PowerShell-only** commands in this doc.  
- Every route/CORS/JWKS change must produce **text proofs** under `ops/proofs/*.txt` (BOM-less).

---

## What to Paste at the Start of a New Chat (verbatim)

1. **Route & CORS preflight**: final 3 lines
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Expose-Headers`

2. **JWKS head**: first **120 chars** of `/.well-known/jwks.json`

3. **Guest token sanity** from `POST /auth/guest`  
   - `alg` (must be **RS256**) and `kid`  
   - `iss` (must be **https://api.cognomega.com**) and `exp`

4. **Workers AI binding** from `GET /api/ai/binding` (JSON)

5. **Env snapshot** from `GET /api/admin/env-snapshot` (omit values; confirm `ok: true`)  
   > Must include `X-Admin-Key` header; paste only the top-level keys (`vars`, `secrets`, `bindings`) with booleans.

6. **Git status** (from repo root)
   - `git status -sb`
   - `git log --oneline -n 3`
   - CI status badge / last run result (link ok)

7. **Changed files list** (if any since last chat)  
   - `git diff --name-status origin/main...HEAD`

8. **Pointer to proofs** (if changed): newest file under `ops/proofs/`

> Tip: keep each paste compact but exact. No screenshots for headers—text only.

---

## One-Shot PowerShell to Gather the Proofs (BOM-less)

> Run from `C:\dev\cognomega-edge`.
>
> Updates/creates a timestamped proof at `ops\proofs\api-route-audit-YYYYMMDD-HHMMSS.txt` and prints a short recap to console.

```powershell
# Helpers
function ConvertFrom-Base64Url([string]$s) {
  $s=$s.Replace('-','+').Replace('_','/'); switch ($s.Length % 4) {2{$s+='=='} 3{$s+='='} default{} }
  [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

# 0) Preflight (CORS)
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method = "OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp = $req.GetResponse()
$acao = $resp.Headers["Access-Control-Allow-Origin"]
$acah = $resp.Headers["Access-Control-Allow-Headers"]
$aceh = $resp.Headers["Access-Control-Expose-Headers"]
$resp.Close()

# 1) JWKS (head)
$jwks = Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$jwksHead = $jwks.Content.Substring(0,[Math]::Min(120,$jwks.Content.Length))

# 2) Guest token header/payload
$guest = Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
$tok = $guest.token
$h = (ConvertFrom-Base64Url ($tok.Split('.')[0]) | ConvertFrom-Json)
$p = (ConvertFrom-Base64Url ($tok.Split('.')[1]) | ConvertFrom-Json)

# 3) AI binding
$ai = Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding"

# 4) Write proof file (no BOM)
New-Item -ItemType Directory -Force "ops\proofs" | Out-Null
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$proof = "ops\proofs\api-route-audit-$ts.txt"
@"
== Preflight ==
Access-Control-Allow-Origin: $acao
Access-Control-Allow-Headers: $acah
Access-Control-Expose-Headers: $aceh

== AI binding ==
$(( $ai | ConvertTo-Json -Compress ))

== JWKS (first 120 chars) ==
$jwksHead

== Guest JWT header ==
$(( $h | ConvertTo-Json -Compress ))

== Guest JWT payload ==
$(( $p | ConvertTo-Json -Compress ))
"@ | Set-Content -Path $proof -Encoding utf8 -NoNewline

Write-Host "Proof written: $proof"
Write-Host "Paste the 3 preflight lines, JWKS head(120), alg/kid + iss/exp, and ai_bound JSON in chat."
```

---

## Files you must keep current (and mention if changed)

- `/OPS.md` — Production runbook (routes/CORS/JWKS/headers, operator probes)
- `/api/wrangler.toml` — **Single route** for API worker; bindings/vars
- `/api/src/index.ts` — Gateway (health, legacy/demo endpoints, CORS layer, admin)
- `/api/src/modules/auth_billing.ts` — Auth + billing + usage + jobs + uploads + SI
- `/docs/roadmap.md` — Milestones, acceptance gates, SLOs
- `/docs/tasks.md` — Atomic tasks (IDs, status)
- `/docs/architecture.md` — Target microservices & service-binding split
- `/docs/tools-and-tech.md` — Approved toolchain (cost tier and purpose)
- `/ops/proofs/*.txt` — Route/CORS/JWKS proofs (timestamped)

> Any edit to routes/CORS/JWKS requires a **new** proof file included in the PR.

---

## Session Acceptance (what “good” looks like)

- You pasted all 8 items from **What to Paste** above.  
- If routes/CORS/JWKS changed: a fresh proof file path is provided.  
- `git status -sb` shows no local drift unless you are actively working on a PR.  
- CI green for required checks (route audit / tests / uptime smoke).

---

## Notes

- Keep pastes **textual** (headers/JSON). Screenshots only for CF dashboards.  
- Pinned origins live in `ALLOWED_ORIGINS`. Update via PR if a new app domain is added.  
- JWKS lives in KV (`KEYS` → `"jwks"`). Rotate PEM with JWKS overlap (see `/OPS.md`).

_Last updated: aligned with current production contract for `api.cognomega.com`._

---

## Step‑by‑Step: Generate Each Paste Item (PowerShell)

> Run from **`C:\dev\cognomega-edge`** unless noted. Copy the **console outputs** (not screenshots).

### 0) CORS Preflight (3 header lines)

```powershell
$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method = "OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp = $req.GetResponse()
"`nAccess-Control-Allow-Origin: "  + $resp.Headers["Access-Control-Allow-Origin"]
"Access-Control-Allow-Headers: "   + $resp.Headers["Access-Control-Allow-Headers"]
"Access-Control-Expose-Headers: "  + $resp.Headers["Access-Control-Expose-Headers"]
$resp.Close()
```

### 1) JWKS Head (first 120 chars)

```powershell
$jwks = Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$jwks.Content.Substring(0,[Math]::Min(120,$jwks.Content.Length))
```

### 2) Guest Token (RS256 + issuer)

```powershell
function ConvertFrom-Base64Url([string]$s){$s=$s.Replace('-','+').Replace('_','/');switch($s.Length%4){2{$s+='=='}3{$s+='='}default{}};[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))}
$guest = Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
$tok   = $guest.token
$hJson = ConvertFrom-Base64Url ($tok.Split('.')[0])
$pJson = ConvertFrom-Base64Url ($tok.Split('.')[1])
$h = $hJson | ConvertFrom-Json
$p = $pJson | ConvertFrom-Json
"alg=$($h.alg) kid=$($h.kid)"
"iss=$($p.iss) exp=$($p.exp)"
```

### 3) AI Binding (Workers AI)

```powershell
Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding" | ConvertTo-Json -Compress
```

### 4) Env Snapshot (bools only; requires admin key)

```powershell
$hdr = @{ "X-Admin-Key" = "<ADMIN_API_KEY>" }
$r = Invoke-RestMethod -Uri "https://api.cognomega.com/api/admin/env-snapshot" -Headers $hdr -Method GET
@{
  ok = $r.ok
  vars = $r.vars.Keys | Sort-Object
  secrets = $r.secrets.GetEnumerator() | ForEach-Object { @{ $_.Key = [bool]$_.Value } }
  bindings = $r.bindings.GetEnumerator() | ForEach-Object { @{ $_.Key = [bool]$_.Value } }
} | ConvertTo-Json -Depth 4
```

### 5) Git State (repo root)

```powershell
git status -sb
git log --oneline -n 3
```

### 6) Changed Files vs Remote (optional)

```powershell
git fetch --prune origin
git diff --name-status origin/main...HEAD
```

### 7) Newest Proof File Pointer

```powershell
Get-ChildItem ops\proofs\api-route-audit-*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { $_.FullName }
```

---

## Minimal “Paste Printer” (grab everything fast)

> This prints exactly the items you need to paste. It also creates/updates a BOM‑less proof file in `ops\proofs\`.

```powershell
function ConvertFrom-Base64Url([string]$s){$s=$s.Replace('-','+').Replace('_','/');switch($s.Length%4){2{$s+='=='}3{$s+='='}default{}};[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))}

# Preflight
$req=[System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask");$req.Method="OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp=$req.GetResponse()
$acao=$resp.Headers["Access-Control-Allow-Origin"];$acah=$resp.Headers["Access-Control-Allow-Headers"];$aceh=$resp.Headers["Access-Control-Expose-Headers"];$resp.Close()

# JWKS head
$jwks=Invoke-WebRequest -UseBasicParsing "https://api.cognomega.com/.well-known/jwks.json"
$jwksHead=$jwks.Content.Substring(0,[Math]::Min(120,$jwks.Content.Length))

# Guest JWT
$guest=Invoke-RestMethod -Method POST -Uri "https://api.cognomega.com/auth/guest"
$tok=$guest.token;$h=ConvertFrom-Base64Url($tok.Split('.')[0])|ConvertFrom-Json;$p=ConvertFrom-Base64Url($tok.Split('.')[1])|ConvertFrom-Json

# AI binding
$ai=Invoke-RestMethod -Uri "https://api.cognomega.com/api/ai/binding" | ConvertTo-Json -Compress

# Print minimal paste
"`n== Preflight =="
"Access-Control-Allow-Origin: $acao"
"Access-Control-Allow-Headers: $acah"
"Access-Control-Expose-Headers: $aceh"
"`n== AI binding =="
$ai
"`n== JWKS (first 120 chars) =="
$jwksHead
"`n== Guest JWT header =="
("{0}" -f (($h | ConvertTo-Json -Compress)))
"`n== Guest JWT payload =="
("{0}" -f (($p | ConvertTo-Json -Compress)))

# Write proof file (BOM-less)
New-Item -ItemType Directory -Force "ops\proofs" | Out-Null
$ts=Get-Date -Format "yyyyMMdd-HHmmss"
$proof="ops\proofs\api-route-audit-$ts.txt"
@"
== Preflight ==
Access-Control-Allow-Origin: $acao
Access-Control-Allow-Headers: $acah
Access-Control-Expose-Headers: $aceh

== AI binding ==
$ai

== JWKS (first 120 chars) ==
$jwksHead

== Guest JWT header ==
$(( $h | ConvertTo-Json -Compress ))

== Guest JWT payload ==
$(( $p | ConvertTo-Json -Compress ))
"@ | Set-Content -Path $proof -Encoding utf8 -NoNewline
"Proof written: $proof"
```

---

## Where to put outputs in PRs

Add a **“Route & Contract Proofs”** section to any PR that changes `wrangler.toml`, DNS, CORS, auth, or exposed headers:

```markdown
### Route & Contract Proofs
- Preflight (3 lines): *(paste)*
- JWKS head (120): *(paste)*
- Guest JWT: `alg=RS256` `kid=k1`, `iss=https://api.cognomega.com` `exp=<ts>`
- AI binding: `{ "ai_bound": true }`
- Proof file: `ops/proofs/api-route-audit-YYYYMMDD-HHMMSS.txt`
```
