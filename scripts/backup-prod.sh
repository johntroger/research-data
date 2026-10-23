#!/usr/bin/env bash
# Nightly backup of the Supabase prod database to Cloudflare R2 (step 2.4, docs/architecture.md Mục 9.3).
# Dumps schema public (custom format, restorable with pg_restore), uploads it to the private backups bucket as
# backups/db-<UTC time>.dump, checks the upload, then keeps only the newest BACKUP_KEEP (default 30) backups.
# Needs: docker (the postgres:17 image supplies a pg_dump that matches Supabase), the aws CLI (preinstalled on GitHub runners)
# and these variables (GitHub Actions secrets, or .env when run by hand): SUPABASE_PROD_REF, SUPABASE_PROD_DB_PASSWORD,
# SUPABASE_PROD_POOLER_HOST, R2_ACCOUNT_ID, R2_BACKUP_BUCKET, R2_BACKUP_ACCESS_KEY_ID, R2_BACKUP_SECRET_ACCESS_KEY.
set -euo pipefail

for v in SUPABASE_PROD_REF SUPABASE_PROD_DB_PASSWORD SUPABASE_PROD_POOLER_HOST R2_ACCOUNT_ID R2_BACKUP_BUCKET R2_BACKUP_ACCESS_KEY_ID R2_BACKUP_SECRET_ACCESS_KEY; do
  if [ -z "${!v:-}" ]; then echo "Missing $v" >&2; exit 1; fi
done
KEEP="${BACKUP_KEEP:-30}"
case "$KEEP" in '' | *[!0-9]*) echo "BACKUP_KEEP must be a number" >&2; exit 1 ;; esac
if [ "$KEEP" -lt 2 ]; then echo "BACKUP_KEEP must be at least 2" >&2; exit 1; fi

stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
file="db-${stamp}.dump"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

echo "Dumping prod (schema public) ..."
docker run --rm -e PGPASSWORD="$SUPABASE_PROD_DB_PASSWORD" -v "$workdir:/out" postgres:17 \
  pg_dump -h "$SUPABASE_PROD_POOLER_HOST" -p 5432 -U "postgres.${SUPABASE_PROD_REF}" -d postgres \
  --schema=public --no-owner --no-privileges -Fc -f "/out/$file"
size="$(wc -c < "$workdir/$file")"
echo "Dump is $size bytes"
if [ "$size" -lt 10000 ]; then echo "The dump is suspiciously small; not uploading it" >&2; exit 1; fi

export AWS_ACCESS_KEY_ID="$R2_BACKUP_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_BACKUP_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION=auto
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
key="backups/$file"

aws s3 cp "$workdir/$file" "s3://${R2_BACKUP_BUCKET}/$key" --endpoint-url "$endpoint" --only-show-errors
remote_size="$(aws s3api head-object --bucket "$R2_BACKUP_BUCKET" --key "$key" --endpoint-url "$endpoint" --query ContentLength --output text)"
if [ "$remote_size" != "$size" ]; then echo "Uploaded size $remote_size differs from $size" >&2; exit 1; fi
echo "Uploaded $key ($remote_size bytes)"

# Keep the newest $KEEP: names carry the UTC time, so sorting the names sorts by age. Only names of this script's own files are touched.
mapfile -t keys < <(aws s3api list-objects-v2 --bucket "$R2_BACKUP_BUCKET" --prefix backups/ --endpoint-url "$endpoint" --query 'Contents[].Key' --output text | tr '\t' '\n' | grep -E '^backups/db-.*\.dump$' | sort)
total="${#keys[@]}"
echo "Backups in the bucket: $total (keeping $KEEP)"
if [ "$total" -gt "$KEEP" ]; then
  for old in "${keys[@]:0:$((total - KEEP))}"; do
    echo "Deleting $old"
    aws s3api delete-object --bucket "$R2_BACKUP_BUCKET" --key "$old" --endpoint-url "$endpoint" > /dev/null
  done
fi
echo "Done."
