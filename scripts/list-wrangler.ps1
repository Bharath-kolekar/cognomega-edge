param(
  [string]$Root = "C:\dev\cognomega-edge",
  [string]$OutCsv = ""
)

Write-Host "Scanning for wrangler files under: $Root`n"

# Search for both correct and common-typo filenames
$patterns = @('wrangler.toml', 'wrngler.toml')

$items = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $patterns -contains $_.Name } |
  Sort-Object FullName -Unique

if (-not $items -or $items.Count -eq 0) {
  Write-Warning "No wrangler files found."
  return
}

$rows = $items | Select-Object `
  @{n='Name';      e={$_.Name}},
  @{n='Directory'; e={$_.DirectoryName}},
  @{n='FullPath';  e={$_.FullName}}

$rows | Format-Table -AutoSize

if ($OutCsv) {
  $rows | Export-Csv -NoTypeInformation -Encoding UTF8 $OutCsv
  Write-Host "`nSaved report to: $OutCsv"
}
