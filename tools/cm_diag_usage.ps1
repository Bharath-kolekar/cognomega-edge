param(
  [string]$Base   = "https://api.cognomega.com",
  [string]$Origin = "https://app.cognomega.com"
)

if ($PSVersionTable.PSVersion.Major -lt 7) {
  Write-Error "Requires PowerShell 7+. Run with: pwsh -NoProfile -File tools\\cm_diag_usage.ps1"
  exit 3
}

$targets = @(
  "/api/billing/usage",
  "/billing/usage",
  "/api/usage",
  "/usage",
  "/api/v1/usage",
  "/api/credits",
  "/credits",
  "/api/v1/credits"
)

function Probe {
  param([string]$Method, [string]$Url, [string]$Body = $null, [string]$CT = $null)
  try {
    $args = @{
      Uri = $Url
      Method = $Method
      Headers = @{ Origin = $Origin }
      UseBasicParsing = $true
      SkipHttpErrorCheck = $true   # PS7 only
    }
    if ($Body -ne $null) {
      $args.ContentType = $CT
      $args.Body = $Body
    }
    $r = Invoke-WebRequest @args
    $code = if ($null -ne $r.StatusCode) { [int]$r.StatusCode } else { "ERR" }
    $acor = ""
    if ($r.Headers -and $r.Headers.ContainsKey('Access-Control-Allow-Origin')) {
      $acor = $r.Headers['Access-Control-Allow-Origin']
    }
    $text = if ($null -ne $r.Content) { [string]$r.Content } else { "" }
    $len  = $text.Length
    $max  = [Math]::Min(200, $len)
    $snip = if ($len -gt 0) { $text.Substring(0, $max).Replace("`r","").Replace("`n"," ") } else { "" }
    [pscustomobject]@{ Code=$code; ACOR=$acor; Len=$len; Snip=$snip }
  } catch {
    $msg = $_.Exception.Message
    $msg = ($msg -replace '\s+',' ')
    $max = [Math]::Min(200, $msg.Length)
    [pscustomobject]@{ Code="ERR"; ACOR=""; Len=0; Snip=$msg.Substring(0,$max) }
  }
}

$rows = foreach ($p in $targets) {
  $g   = Probe -Method GET  -Url ($Base+$p)
  $p0  = Probe -Method POST -Url ($Base+$p) -Body "{}" -CT "application/json"
  [pscustomobject]@{
    Path=$p
    GET_Code=$g.Code;  GET_ACOR=$g.ACOR;  GET_Len=$g.Len;  GET_Snip=$g.Snip
    POST_Code=$p0.Code; POST_ACOR=$p0.ACOR; POST_Len=$p0.Len; POST_Snip=$p0.Snip
  }
}

$rows | Format-Table -AutoSize

# Save CSV in tools\
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$dir = Join-Path (Get-Location) "tools"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$out = Join-Path $dir ("cm_diag_usage_{0}.csv" -f $ts)
$rows | Export-Csv -NoTypeInformation -Encoding utf8 $out
"Saved: $out"