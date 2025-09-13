# PS7 — Cognomega Readiness Probe (read-only)
param(
  [Parameter(Mandatory=$true)]
  [string]$Root  # e.g. C:\dev\cognomega-edge  (exact path to your current monorepo)
)

$ErrorActionPreference = "Stop"
function Row($k,$v,$d) { [pscustomobject]@{ Check=$k; Status=$v; Detail=$d } }

$rows = @()

# 0) Tools (versions) — read-only
function Ver($cmd) {
  try { & $cmd | Out-String -Width 200 | Select-Object -First 1 } catch { "NOT FOUND" }
}
$rows += Row "PS7"            $PSVersionTable.PSVersion.ToString() "PowerShell version"
$rows += Row "git"            (Ver "git --version")                "git"
$rows += Row "node"           (Ver "node -v")                      "Node"
$rows += Row "pnpm"           (Ver "pnpm -v")                      "pnpm"
$rows += Row "python"         (Ver "python --version")             "Python"
$rows += Row "wrangler"       (Ver "wrangler --version")           "Cloudflare Wrangler"
$rows += Row "wrangler whoami" (try { (wrangler whoami 2>$null) } catch { "NOT LOGGED IN" }) "CF login status"

# 1) Repo layout
if (!(Test-Path $Root)) { $rows += Row "Root" "MISSING" $Root; $rows | Format-Table -AutoSize; throw "Root not found" }
$rows += Row "Root" "OK" $Root

$ApiDir      = Join-Path $Root "api"
$FrontDir    = Join-Path $Root "frontend"
$BackDir     = Join-Path $Root "backend"
$WranglerToml= Join-Path $ApiDir "wrangler.toml"
$IndexTs     = Join-Path $ApiDir "src\index.ts"

$rows += Row "Dir: api"      ($(if(Test-Path $ApiDir){"OK"}else{"MISSING"}))      $ApiDir
$rows += Row "Dir: frontend" ($(if(Test-Path $FrontDir){"OK"}else{"MISSING"}))    $FrontDir
$rows += Row "Dir: backend"  ($(if(Test-Path $BackDir){"OK"}else{"MISSING"}))     $BackDir
$rows += Row "api/src/index.ts" ($(if(Test-Path $IndexTs){"OK"}else{"MISSING"}))  $IndexTs

# 2) wrangler.toml sanity (no edits)
if (Test-Path $WranglerToml) {
  $toml = Get-Content $WranglerToml -Raw

  $name     = if ($toml -match '^\s*name\s*=\s*"([^"]+)"') { $matches[1] } else { "" }
  $hasRoute = ($toml -match '^\s*route\s*=' -or $toml -match '^\s*routes\s*=')
  $kvBill   = [bool]([regex]::IsMatch($toml, 'KV_BILLING'))
  $r2Up     = [bool]([regex]::IsMatch($toml, 'R2_UPLOADS'))
  $varsSec  = [bool]([regex]::IsMatch($toml, '^\s*\[vars\]\s*', 'IgnoreCase,Multiline'))
  $hasProv  = [bool]([regex]::IsMatch($toml, 'PREFERRED_PROVIDER\s*='))
  $hasCors  = [bool]([regex]::IsMatch($toml, 'CORS_ALLOWLIST\s*='))
  $hasRate  = [bool]([regex]::IsMatch($toml, 'CREDITS_RATE_PER_1K\s*='))
  $envProd  = [bool]([regex]::IsMatch($toml, '^\s*\[env\.production\]\s*', 'IgnoreCase,Multiline'))

  $rows += Row "wrangler.toml" "OK" $WranglerToml
  $rows += Row "Worker name"   ($(if($name){"$name"}else{"MISSING"})) "name = ..."
  $rows += Row "Route(s)"      ($(if($hasRoute){"OK"}else{"MISSING"})) "route / routes"
  $rows += Row "KV_BILLING"    ($(if($kvBill){"BOUND"}else{"MISSING"})) "kv_namespaces"
  $rows += Row "R2_UPLOADS"    ($(if($r2Up){"BOUND"}else{"MISSING"}))   "r2_buckets"
  $rows += Row "[vars]"        ($(if($varsSec){"OK"}else{"MISSING"}))   "vars section"
  $rows += Row "PREFERRED_PROVIDER" ($(if($hasProv){"OK"}else{"MISSING"})) "groq,cfai,openai"
  $rows += Row "CORS_ALLOWLIST"     ($(if($hasCors){"OK"}else{"MISSING"})) "Origin allowlist"
  $rows += Row "CREDITS_RATE_PER_1K"($(if($hasRate){"OK"}else{"MISSING"})) "credit rate"
  $rows += Row "[env.production]"   ($(if($envProd){"OK"}else{"MISSING"})) "prod env section"
} else {
  $rows += Row "wrangler.toml" "MISSING" $WranglerToml
}

# 3) Frontend markers (read-only)
$frontPkg = Join-Path $FrontDir "package.json"
$frontVite= Join-Path $FrontDir "vite.config.ts"
$rows += Row "frontend/package.json" ($(if(Test-Path $frontPkg){"OK"}else{"MISSING"})) $frontPkg
$rows += Row "frontend/vite.config.ts"($(if(Test-Path $frontVite){"OK"}else{"MISSING"})) $frontVite

# 4) Backend markers (read-only)
$backReq = Join-Path $BackDir "requirements.txt"
$backMain= Join-Path $BackDir "app\main.py"
$rows += Row "backend/requirements.txt" ($(if(Test-Path $backReq){"OK"}else{"MISSING"})) $backReq
$rows += Row "backend/app/main.py"      ($(if(Test-Path $backMain){"OK"}else{"MISSING"})) $backMain

# 5) Git cleanliness (read-only)
$dirty = (git -C $Root status --porcelain)
$rows += Row "git status" ($(if([string]::IsNullOrWhiteSpace($dirty)){"CLEAN"}else{"DIRTY"})) ($(if($dirty){ ($dirty -split "`n")[0] }else{ "" }))

$rows | Format-Table -AutoSize
