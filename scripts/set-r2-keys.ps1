# Stores an R2 credential in the right .env file without showing it on screen or in the chat.
#   .\scripts\set-r2-keys.ps1 -Role read  -FromToken   -> apps\web\.env.local  (read-only token for the web)
#   .\scripts\set-r2-keys.ps1 -Role write -FromToken   -> .env                  (read/write token for the worker)
#   .\scripts\set-r2-keys.ps1 -Role backup  -> .env  (token limited to the backups bucket: R2_BACKUP_ACCESS_KEY_ID, R2_BACKUP_SECRET_ACCESS_KEY)
# -FromToken: paste the single token value that Cloudflare shows once after "Create Token" (an Account API token with the
#   "Workers R2 Storage Bucket Item" permission). The S3 credentials are derived as Cloudflare documents: Access Key ID is the
#   token's id (asked from Cloudflare with the token itself), Secret Access Key is the SHA-256 of the token value.
# Without -FromToken: paste the Access Key ID and the Secret Access Key from the R2 token page (two values).
param(
  [Parameter(Mandatory = $true)][ValidateSet("read", "write", "backup")][string]$Role,
  [switch]$FromToken
)

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
if ($Role -eq "read") {
  $file = Join-Path $root "apps\web\.env.local"; $idName = "R2_ACCESS_KEY_ID"; $secretName = "R2_SECRET_ACCESS_KEY"
} elseif ($Role -eq "backup") {
  # A token limited to the backups bucket; it never touches the PDFs.
  $file = $envFile; $idName = "R2_BACKUP_ACCESS_KEY_ID"; $secretName = "R2_BACKUP_SECRET_ACCESS_KEY"
} else {
  $file = $envFile; $idName = "R2_WRITE_ACCESS_KEY_ID"; $secretName = "R2_WRITE_SECRET_ACCESS_KEY"
}
if (Test-Path $file) {
  if ((Get-Content $file -Raw) -match "(?m)^$idName=") { Write-Host "$idName is already in $file; remove those lines first if you want to replace the token."; exit 1 }
}
$accountId = ((Get-Content $envFile) | Where-Object { $_ -match "^R2_ACCOUNT_ID=" }) -replace "^R2_ACCOUNT_ID=", ""
$bucket = ((Get-Content $envFile) | Where-Object { $_ -match "^R2_BUCKET=" }) -replace "^R2_BUCKET=", ""
if (-not $accountId -or -not $bucket) { Write-Host "R2_ACCOUNT_ID and R2_BUCKET must be in .env first."; exit 1 }

function Plain($secure) { $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure); try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) } }

if ($FromToken) {
  $value = (Plain (Read-Host "Token value ($Role token)" -AsSecureString)).Trim()
  if ($value.Length -lt 30) { Write-Host "That value looks too short; nothing was saved."; exit 1 }
  try {
    $verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/tokens/verify" -Headers @{ Authorization = "Bearer $value" }
  } catch { Write-Host "Cloudflare did not accept this token (check that you pasted the whole value); nothing was saved."; exit 1 }
  if (-not $verify.success -or $verify.result.status -ne "active") { Write-Host "The token is not active; nothing was saved."; exit 1 }
  $id = $verify.result.id
  $sha = [Security.Cryptography.SHA256]::Create()
  $secret = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($value)) | ForEach-Object { $_.ToString("x2") })
} else {
  $id = Plain (Read-Host "Access Key ID ($Role token)" -AsSecureString)
  $secret = Plain (Read-Host "Secret Access Key ($Role token)" -AsSecureString)
  if ($id.Length -lt 16 -or $secret.Length -lt 32) { Write-Host "Those values look too short; nothing was saved."; exit 1 }
}
$lines = @("", "# Cloudflare R2 token ($Role), added $(Get-Date -Format yyyy-MM-dd)", "$idName=$id", "$secretName=$secret")
if ($Role -eq "read") { $lines += @("R2_ACCOUNT_ID=$accountId", "R2_BUCKET=$bucket") }
Add-Content -Path $file -Value $lines -Encoding utf8
Write-Host "Saved to $file (the values were not printed)."
