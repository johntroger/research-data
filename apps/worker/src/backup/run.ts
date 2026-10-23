/**
 * `pnpm worker backup-files [--yes] [--keep N]` (step 2.4b): archives the saved extractions of `extracted_data/` and puts the archive
 * in the private R2 backups bucket with the backup token (the only token that can reach that bucket). Preview unless --yes. After the
 * upload the archive is downloaded again and compared by SHA-256 with the local one; then only the newest N (default 12) are kept.
 */
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnv, REPO_ROOT } from "../config.js";
import { ARCHIVE_PREFIX, archiveKey, archivesToDelete, selectBackupFiles, skippedFolders } from "./files.js";

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function client(): { s3: S3Client; bucket: string } | null {
  loadEnv();
  const { R2_ACCOUNT_ID: account, R2_BACKUP_BUCKET: bucket, R2_BACKUP_ACCESS_KEY_ID: id, R2_BACKUP_SECRET_ACCESS_KEY: secret } = process.env;
  if (!account || !bucket || !id || !secret) return null;
  return {
    bucket,
    s3: new S3Client({
      region: "auto",
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: id, secretAccessKey: secret },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
}

export async function backupFiles(args: string[]): Promise<number> {
  const yes = args.includes("--yes");
  const keepArg = args[args.indexOf("--keep") + 1];
  const keep = args.includes("--keep") ? Number(keepArg) : 12;
  const dir = path.join(REPO_ROOT, "extracted_data");
  const entries = (await readdir(dir, { withFileTypes: true })).map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
  const files = selectBackupFiles(entries);
  const sizes = await Promise.all(files.map(async (f) => (await stat(path.join(dir, f))).size));
  const total = sizes.reduce((a, b) => a + b, 0);
  console.log(`${files.length} files, ${(total / 1048576).toFixed(1)} MB before compression. Left out (folders): ${skippedFolders(entries).join(", ") || "none"}.`);
  const r2 = client();
  if (!r2) {
    console.error("The backup token is not set: R2_ACCOUNT_ID, R2_BACKUP_BUCKET, R2_BACKUP_ACCESS_KEY_ID and R2_BACKUP_SECRET_ACCESS_KEY are needed in .env.");
    return 1;
  }
  if (!yes) {
    console.log(`Would upload ${archiveKey(new Date())} to ${r2.bucket} and keep the newest ${keep}. Nothing written. Add --yes to do it.`);
    return 0;
  }
  archivesToDelete([], keep); // fails early on a bad --keep

  const work = await mkdtemp(path.join(tmpdir(), "extracted-backup-"));
  try {
    // Run tar inside the temp folder with a relative output name: GNU tar reads "C:" in an output path as a remote host.
    const made = spawnSync("tar", ["-czf", "archive.tar.gz", "-C", dir, ...files], { cwd: work, encoding: "utf8" });
    if (made.status !== 0) throw new Error(`tar failed: ${made.stderr}`);
    const bytes = new Uint8Array(await readFile(path.join(work, "archive.tar.gz")));
    const hash = sha256(bytes);
    const key = archiveKey(new Date());
    console.log(`Archive: ${(bytes.length / 1048576).toFixed(2)} MB, sha256 ${hash.slice(0, 16)}…`);

    await r2.s3.send(new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: bytes, ContentType: "application/gzip", Metadata: { sha256: hash } }));
    const back = new Uint8Array(await (await r2.s3.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }))).Body!.transformToByteArray());
    if (sha256(back) !== hash) throw new Error("The archive downloaded from R2 differs from the one uploaded; it was NOT trusted and nothing was deleted");
    console.log(`Uploaded ${key} and checked it by downloading it again (identical).`);

    const listed = await r2.s3.send(new ListObjectsV2Command({ Bucket: r2.bucket, Prefix: ARCHIVE_PREFIX }));
    const old = archivesToDelete((listed.Contents ?? []).map((o) => o.Key ?? ""), keep);
    for (const k of old) {
      await r2.s3.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: k }));
      console.log(`Deleted old ${k}`);
    }
    console.log(`Archives in the bucket: ${(listed.Contents?.length ?? 0) - old.length} (keeping ${keep}).`);
    return 0;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
