<#
.SYNOPSIS
  Cognomega Paste Printer — generates session-proof text and writes a BOM-less audit file.

.DESCRIPTION
  Prints the exact headers/JSON you must paste at the start of a session and writes a proof file under ops\proofs\.
  Run from the repo root (C:\dev\cognomega-edge) unless you pass -RepoRoot.
  No external dependencies. PowerShell 7+ recommended.

.PARAMETER ApiBase
  API base URL. Default: https://api.cognomega.com

.PARAMETER AppOrigin
  App origin to use for CORS preflight. Default: https://app.cognomega.com

.PARAMETER AdminKey
  Optional X-Admin-Key to query /api/admin/env-snapshot (booleans only are printed).

.PARAMETER RepoRoot
  Repo root path. Default: current directory.

.PARAMETER OutFile
  Optional path for the proof file. Default: ops\proofs\api-route-audit-YYYYMMDD-HHmmss.txt

.PARAMETER Quiet
  Suppress console summary lines (still writes the proof file).

.EXAMPLE
  .\scripts\paste-printer.ps1

.EXAMPLE
  .\scripts\paste-printer.ps1 -AdminKey "XXXXX"

.EXAMPLE
  .\scripts\paste-printer.ps1 -ApiBase "https://api.cognomega.com" -AppOrigin "https://app.cognomega.com"
#>

[CmdletBinding()]
param(
  [string]$ApiBase   = "https://api.cognomega.com",
  [string]$AppOrigin = "https://app.cognomega.com",
  [string]$AdminKey,
  [string]$RepoRoot  = ".",
  [string]$OutFile,
  [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-Base64Url([string]$s) {
  $s = $s.Replace('-', '+').Replace('_', '/')
  switch ($s.Length % 4) { 2 { $s += '==' } 3 { $s += '=' } default { } }
  [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

# Normalize paths
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
Push-Location $RepoRoot
try {
  # Ensure proofs dir exists
  $proofDir = Join-Path $RepoRoot "ops\proofs"
  New-Item -ItemType Directory -Force -Path $proofDir | Out-Null
  if (-not $OutFile) {
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    $OutFile = Join-Path $proofDir ("api-route-audit-{0}.txt" -f $ts)
  } else {
    $OutFile = (Resolve-Path -LiteralPath $OutFile -ErrorAction SilentlyContinue) ?? $OutFile
  }

  # 0) Preflight (CORS) — OPTIONS
  $preUrl = "$ApiBase/api/si/ask"
  $req = [System.Net.HttpWebRequest]::Create($preUrl)
  $req.Method = "OPTIONS"
  $req.Headers.Add("Origin", $AppOrigin)
  $req.Headers.Add("Access-Control-Request-Method", "POST")
  $req.Headers.Add("Access-Control-Request-Headers", "Content-Type, X-User-Email, X-Intelligence-Tier")
  $resp = $req.GetResponse()
  $acao = $resp.Headers["Access-Control-Allow-Origin"]
  $acah = $resp.Headers["Access-Control-Allow-Headers"]
  $aceh = $resp.Headers["Access-Control-Expose-Headers"]
  $resp.Close()

  # 1) JWKS head
  $jwksUrl = "$ApiBase/.well-known/jwks.json"
  $jwks = Invoke-WebRequest -UseBasicParsing $jwksUrl
  $jwksHead = $jwks.Content.Substring(0, [Math]::Min(120, $jwks.Content.Length))

  # 2) Guest token (RS256 + iss)
  $guest = Invoke-RestMethod -Method POST -Uri "$ApiBase/auth/guest"
  $tok = $guest.token
  $h = (ConvertFrom-Base64Url ($tok.Split('.')[0]) | ConvertFrom-Json)
  $p = (ConvertFrom-Base64Url ($tok.Split('.')[1]) | ConvertFrom-Json)

  # 3) AI binding
  $ai = Invoke-RestMethod -Uri "$ApiBase/api/ai/binding"
  $aiJson = ($ai | ConvertTo-Json -Compress)

  # 4) Optional env snapshot (booleans only) — requires AdminKey
  $envSnap = $null
  if ($AdminKey) {
    try {
      $hdr = @{ "X-Admin-Key" = $AdminKey }
      $r = Invoke-RestMethod -Uri "$ApiBase/api/admin/env-snapshot" -Headers $hdr -Method GET
      $envSnap = @{
        ok       = [bool]$r.ok
        vars     = ($r.vars.Keys | Sort-Object)
        secrets  = @{ }
        bindings = @{ }
      }
      foreach ($kv in $r.secrets.GetEnumerator())  { $envSnap.secrets[$kv.Key]  = [bool]$kv.Value }
      foreach ($kv in $r.bindings.GetEnumerator()) { $envSnap.bindings[$kv.Key] = [bool]$kv.Value }
    } catch {
      $envSnap = @{ error = "env_snapshot_failed"; message = $_.Exception.Message }
    }
  }

  # 5) Write proof (BOM-less utf8)
  $content = @"
== Preflight ==
Access-Control-Allow-Origin: $acao
Access-Control-Allow-Headers: $acah
Access-Control-Expose-Headers: $aceh

== AI binding ==
$aiJson

== JWKS (first 120 chars) ==
$jwksHead

== Guest JWT header ==
$(( $h | ConvertTo-Json -Compress ))

== Guest JWT payload ==
$(( $p | ConvertTo-Json -Compress ))
"@

  if ($envSnap) {
    $content += "`r`n== Env snapshot (booleans only) ==`r`n"
    $content += ($envSnap | ConvertTo-Json -Depth 6)
  }

  # Ensure UTF-8 without BOM
  Set-Content -Path $OutFile -Encoding utf8 -NoNewline -Value $content

  if (-not $Quiet) {
    Write-Host "== Paste these lines ==" -ForegroundColor Cyan
    Write-Host "Access-Control-Allow-Origin: $acao"
    Write-Host "Access-Control-Allow-Headers: $acah"
    Write-Host "Access-Control-Expose-Headers: $aceh"
    Write-Host "`nJWKS head (120):" $jwksHead
    Write-Host "`nJWT:" ("alg={0} kid={1}" -f $h.alg, $h.kid)
    Write-Host ("iss={0} exp={1}" -f $p.iss, $p.exp)
    Write-Host "`nAI binding:" $aiJson
    if ($envSnap) { Write-Host "`nEnv snapshot written in proof file (booleans only)." }
    Write-Host ("`nProof written: {0}" -f $OutFile) -ForegroundColor Green
  }
}
finally {
  Pop-Location
}
