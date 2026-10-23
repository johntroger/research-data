# Copies the values the nightly backup needs from .env into this repository's GitHub Actions secrets, through the GitHub CLI
# (gh must be logged in with `gh auth login`). Values go from the file to GitHub without being printed.
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1
param([string]$Repo = "johntroger/research-data")

$root = Split-Path -Parent $PSScriptRoot
$names = @("SUPABASE_PROD_REF", "SUPABASE_PROD_DB_PASSWORD", "SUPABASE_PROD_POOLER_HOST", "R2_ACCOUNT_ID", "R2_BACKUP_BUCKET", "R2_BACKUP_ACCESS_KEY_ID", "R2_BACKUP_SECRET_ACCESS_KEY")
$env = @{}
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^([A-Z0-9_]+)=(.*)$') { $env[$Matches[1]] = $Matches[2].Trim() }
}
$missing = $names | Where-Object { -not $env[$_] }
if ($missing) { Write-Host "Missing in .env: $($missing -join ', '). Nothing was sent."; exit 1 }
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "gh is not logged in. Run: gh auth login"; exit 1 }
foreach ($n in $names) {
  $env[$n] | gh secret set $n --repo $Repo
  if ($LASTEXITCODE -ne 0) { Write-Host "Could not set $n"; exit 1 }
}
Write-Host ""
gh secret list --repo $Repo
