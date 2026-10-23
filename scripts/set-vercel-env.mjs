#!/usr/bin/env node
/**
 * Puts the web's production settings into the Vercel project from the local .env files (step 4.3), without printing a value.
 *   node scripts/set-vercel-env.mjs [--dry-run]
 * A FIXED list, never "everything in .env": the web gets the public Supabase address and key, the owner's email, the read-only R2 token,
 * the proxy and rate-limit settings. It never gets the database password, the Supabase service key, the backup or read/write R2 tokens,
 * or any of the extraction keys; those stay on this machine and in GitHub Actions secrets. Existing values are overwritten (--force).
 * Needs the Vercel CLI logged in and the project linked (`vercel link`).
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const SCOPE = "vne-conomics";
const ENVIRONMENTS = "production,preview";

const read = (file) =>
  Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^[A-Za-z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
const rootEnv = read(`${root}/.env`);
const webEnv = read(`${root}/apps/web/.env.local`);

/** name, where the value comes from, and whether Vercel should hide it after it is set. */
const PLAN = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", value: rootEnv.SUPABASE_PROD_URL, hidden: false, why: "public address of the prod Supabase project" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: rootEnv.SUPABASE_PROD_ANON_KEY, hidden: false, why: "public (anon) key: what any visitor's browser could use anyway" },
  { name: "ADMIN_EMAILS", value: webEnv.ADMIN_EMAILS, hidden: false, why: "the owner's email (who may sign in as owner)" },
  { name: "R2_ACCOUNT_ID", value: webEnv.R2_ACCOUNT_ID, hidden: false, why: "Cloudflare account id" },
  { name: "R2_BUCKET", value: webEnv.R2_BUCKET, hidden: false, why: "PDF bucket name" },
  { name: "R2_ACCESS_KEY_ID", value: webEnv.R2_ACCESS_KEY_ID, hidden: true, why: "READ-ONLY R2 token, PDF bucket only" },
  { name: "R2_SECRET_ACCESS_KEY", value: webEnv.R2_SECRET_ACCESS_KEY, hidden: true, why: "READ-ONLY R2 token, PDF bucket only" },
  { name: "TRUST_PROXY", value: "1", hidden: false, why: "Vercel overwrites x-forwarded-for, so the visitor's address can be believed" },
  { name: "RATE_LIMIT_SALT", value: randomBytes(32).toString("hex"), hidden: true, why: "salt for hashing visitor addresses; the same in every function instance" },
];

const FORBIDDEN = /^(SUPABASE_PROD_DB_PASSWORD|SUPABASE_DB_URL|SUPABASE_SERVICE|R2_BACKUP_|R2_WRITE_|GEMINI|ZOTERO|UNPAYWALL|UPSTASH_REDIS_REST_TOKEN)/;
for (const p of PLAN) {
  if (FORBIDDEN.test(p.name)) throw new Error(`${p.name} must never be sent to Vercel`);
  if (!p.value) throw new Error(`${p.name}: no value found in .env / apps/web/.env.local`);
}

for (const p of PLAN) {
  if (dryRun) {
    console.log(`would set ${p.name.padEnd(32)} ${ENVIRONMENTS}  ${p.hidden ? "hidden" : "readable"}  (${p.value.length} characters)  ${p.why}`);
    continue;
  }
  const r = spawnSync("npx", ["vercel", "env", "add", p.name, "-e", ENVIRONMENTS, p.hidden ? "--sensitive" : "--no-sensitive", "--force", "--scope", SCOPE, "-y"], {
    cwd: root,
    input: p.value,
    encoding: "utf8",
    shell: true,
  });
  const out = `${r.stdout}${r.stderr}`;
  const ok = r.status === 0 && !/error/i.test(out.replace(/Error:\s*$/gm, ""));
  console.log(`${ok ? "set    " : "FAILED "} ${p.name.padEnd(32)} ${ENVIRONMENTS}  ${p.hidden ? "hidden" : "readable"}${ok ? "" : "  " + out.replaceAll(p.value, "<value>").trim().split("\n").slice(-3).join(" | ")}`);
  if (!ok) process.exitCode = 1;
}
