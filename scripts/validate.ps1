# /scripts/validate.ps1
param(
  [string]$Repo = "C:\dev\cognomega-edge",
  [string]$WranglerDir = "packages\api"
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

Write-Host "== Cognomega Local Validation ==" -ForegroundColor Cyan
$fail = 0
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; $script:fail++ }
function Ok($m){ Write-Host "[OK]  $m" -ForegroundColor Green }

# 0) Basic tool sanity
try {
  $pnpmV = pnpm -v
  $nodeV = node -v
  Ok "Tools OK: pnpm=$pnpmV node=$nodeV"
} catch {
  Fail "pnpm/node not available"
}

# 1) Package install state
try {
  pnpm install | Out-Null
  Ok "pnpm install completed"
} catch {
  Fail "pnpm install failed"
}

# 2) Verify pipeline (lint/typecheck/build/test if present)
try {
  pnpm run verify
  Ok "verify passed"
} catch {
  Fail "verify failed"
}

# 3) Wrangler config checks
$wranglerPath = Join-Path $Repo $WranglerDir | Join-Path -ChildPath "wrangler.toml"
if (!(Test-Path $wranglerPath)) {
  Fail "wrangler.toml missing at $wranglerPath"
} else {
  $txt = Get-Content $wranglerPath -Raw
  if ($txt -match 'compatibility_date\s*=\s*"\s*2025-09-03\s*"') {
    Ok "compatibility_date pinned to 2025-09-03"
  } else {
    Fail "compatibility_date not pinned to 2025-09-03"
  }
  if ($txt -match '^\[vars\]' -and $txt -match 'ALLOW_PROVIDERS\s*=\s*"local"' -and $txt -match 'PREFERRED_PROVIDER\s*=\s*"local"') {
    Ok "[vars] local-only policy present"
  } else {
    Fail "local-only vars missing in wrangler.toml ([vars] ALLOW_PROVIDERS/PREFERRED_PROVIDER)"
  }
}

# 4) .dev.vars checks
$devVars = Join-Path $Repo $WranglerDir | Join-Path -ChildPath ".dev.vars"
if (Test-Path $devVars) {
  $dv = Get-Content $devVars -Raw
  if ($dv -match 'ALLOW_PROVIDERS\s*=\s*local' -and $dv -match 'PREFERRED_PROVIDER\s*=\s*local') {
    Ok ".dev.vars has local-only policy"
  } else {
    Fail ".dev.vars missing local-only policy (ALLOW_PROVIDERS/PREFERRED_PROVIDER)"
  }
  if ($dv -match 'ADMIN_API_KEY\s*=') {
    Ok ".dev.vars has ADMIN_API_KEY"
  } else {
    Fail "ADMIN_API_KEY missing in .dev.vars (local admin testing)"
  }
} else {
  Fail ".dev.vars not found at $devVars (local dev)"
}

# 5) Provider guard present
$pg = Get-ChildItem -Recurse -File -Path (Join-Path $Repo "packages\api\src") -Filter "providerGuard.ts" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pg) { Ok "providerGuard.ts present" } else { Fail "providerGuard.ts missing" }

# 6) Drift pattern scan (code + package.json)
$codeFiles = Get-ChildItem -Path $Repo -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue
$pkgJsonFiles = Get-ChildItem -Path $Repo -Recurse -File -Filter package.json -ErrorAction SilentlyContinue
$bad = @()

if ($codeFiles -and $codeFiles.Count -gt 0) {
  $bad += Select-String -Path ($codeFiles.FullName) -Pattern 'X-Requested-With' -SimpleMatch -ErrorAction SilentlyContinue
  $bad += Select-String -Path ($codeFiles.FullName) -Pattern 'gen-jwt|genJwt' -ErrorAction SilentlyContinue
  $bad += Select-String -Path ($codeFiles.FullName) -Pattern 'https?://[^" )]+/api' -ErrorAction SilentlyContinue
}

if ($pkgJsonFiles -and $pkgJsonFiles.Count -gt 0) {
  $bad += Select-String -Path ($pkgJsonFiles.FullName) -Pattern '"--if-?present"' -ErrorAction SilentlyContinue
}

if ($bad -and $bad.Count -gt 0) {
  $lines = $bad | ForEach-Object { "  $($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
  Fail ("Drift patterns found:`n{0}" -f ($lines -join "`n"))
} else {
  Ok "No drift patterns (X-Requested-With, gen-jwt, --if-present misuse, absolute API URLs)"
}

# 7) Extra wrangler configs outside packages/api
$wrs = Get-ChildItem -Recurse -File -Path $Repo -Filter "wrangler.toml" -ErrorAction SilentlyContinue
$extra = $wrs | Where-Object { $_.FullName -ne $wranglerPath }
if ($extra -and $extra.Count -gt 0) {
  $list = $extra.FullName -join "`n  "
  Fail ("Extra wrangler.toml files:`n  {0}" -f $list)
} else {
  Ok "No extra wrangler.toml files"
}

# 8) BOM scan on code/docs
$withBom = @()
$scanForBom = Get-ChildItem -Recurse -File -Path $Repo -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.toml,*.md -ErrorAction SilentlyContinue
foreach ($f in $scanForBom) {
  try {
    $bytes = Get-Content $f.FullName -Encoding Byte -TotalCount 3
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
      $withBom += $f.FullName
    }
  } catch { }
}
if ($withBom -and $withBom.Count -gt 0) {
  Fail ("Files with UTF-8 BOM:`n  {0}" -f ($withBom -join "`n  "))
} else {
  Ok "No BOM detected"
}

# 9) Committed build artifacts/backups/caches
$tracked = & git ls-files 2>$null
$suspicious = @()
if ($tracked) {
  foreach ($p in $tracked) {
    if ($p -match '(^|/)(dist|build|\.wrangler|bundle-meta\.json|.*\.bak|.*\.old|.*~)$') {
      $suspicious += $p
    }
  }
}
if ($suspicious -and $suspicious.Count -gt 0) {
  Fail ("Suspicious tracked artifacts:`n  {0}" -f ($suspicious -join "`n  "))
} else {
  Ok "No suspicious tracked artifacts"
}

# 10) Ready
if ($fail -gt 0) {
  Write-Host "FAILED with $fail issue(s)" -ForegroundColor Red
  exit 1
} else {
  Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
  exit 0
}
