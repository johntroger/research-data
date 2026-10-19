/**
 * `pnpm worker manual import` (step 1b.8c): turns the answers an external extractor (Codex…) wrote into a packet
 * into a saved extraction, runs the same checks and publishes it like any other extraction. Claude Code runs this,
 * never the agent: it needs the database. The extraction replaces what is published for the paper (a Gemini version
 * included), rows locked by hand are kept (Mục 6.7), and the database is backed up before the first write.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assembleStudy, type ExtractionSchemaName } from "@research-data/schema";
import type pg from "pg";
import type { PublishFullSummary } from "../db/publish-full.js";
import type { CallRecord } from "../extract/extract-full.js";
import { FULL_PROMPT_VERSION, STUDY_PART_NAMES } from "../extract/full-prompt.js";
import { parseAnswer } from "../extract/parse.js";
import { publishExtracted, type SavedExtraction } from "../pipeline/extracted.js";
import { resultFile } from "../pipeline/queue.js";
import { CURRENT_VERSIONS, type Versions } from "../pipeline/runs.js";
import { readTextLayer, sha256 } from "../pdf/text-layer.js";
import { analysePaper } from "../verify/analyse.js";
import { checkPacket, type Issue } from "./check.js";
import { PACKET_FILES, type PacketMeta, paperFileName, studyFileName } from "./packet.js";

/** Who wrote the answers: the tool (codex, antigravity…) and its model. */
export interface Provenance {
  tool: string;
  model: string;
}

const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const MANUAL_PROMPT_SUFFIX = "-manual";
export const IMPORTED_MARKER = "IMPORTED.json";

/** `manual:<tool>:<model>`, recorded as the model of every extraction run of this import. */
export function manualModelName(p: Provenance): string {
  if (!NAME.test(p.tool)) throw new Error(`Invalid --tool "${p.tool}": use letters, digits, ".", "_" or "-" (for example codex)`);
  if (!NAME.test(p.model)) throw new Error(`Invalid --model "${p.model}": use letters, digits, ".", "_" or "-" (for example gpt-6.1-sol-medium)`);
  return `manual:${p.tool}:${p.model}`;
}

/** The processing key of a manual import differs from a Gemini one, so neither skips the other. */
export const manualVersions = (): Versions => ({ ...CURRENT_VERSIONS, prompt: `${FULL_PROMPT_VERSION}${MANUAL_PROMPT_SUFFIX}` });

export interface ImportSummary {
  studies: number;
  fields: number;
  badges: { verified: number; attention: number; interpreted: number; hidden: number };
  completeness: string;
  /** What is published for the paper now and would be replaced. */
  replaces: { studies: number; paths: number; measurements: number; models: string[] };
}

export type ImportOutcome =
  | { status: "invalid"; errors: Issue[] }
  | { status: "unknown_paper"; fileHash: string }
  | { status: "already_imported" }
  | { status: "preview"; summary: ImportSummary }
  | { status: "imported"; summary: ImportSummary; published: PublishFullSummary | null };

export interface ImportDeps {
  repoRoot: string;
  /** Where the saved extractions (`<hash>.full.json`) and database backups live. */
  extractedDir: string;
  /** Called once before the first write; throws to stop the import. */
  backup?: () => Promise<void>;
  log?: (line: string) => void;
}

interface Loaded {
  saved: SavedExtraction;
  /** Hash of the answer files and the provenance: the same packet imported twice is recognised. */
  answersHash: string;
}

/** Reads the (already validated) answer files into a saved extraction, with zero cost. */
async function loadAnswers(dir: string, meta: PacketMeta, who: Provenance, pdfPath: string): Promise<Loaded> {
  const hash = createHash("sha256");
  const calls: CallRecord[] = [];
  const read = async <S extends ExtractionSchemaName>(file: string, pass: S, studyLabel: string | null) => {
    const text = await readFile(path.join(dir, PACKET_FILES.out, file), "utf8");
    const parsed = parseAnswer(pass, text);
    if (!parsed.ok) throw new Error(`${file}: ${parsed.error}`); // cannot happen after a successful check
    hash.update(`${file}\0${text}\0`);
    calls.push({ pass, studyLabel, usage: { inputTokens: 0, outputTokens: 0 }, costUsd: 0, rawText: text, durationMs: 0, ...(parsed.shortened.length ? { shortenedQuotes: parsed.shortened } : {}) });
    return parsed.data;
  };
  const structure = await read(paperFileName("paper_structure"), "paper_structure", null);
  const discussion = await read(paperFileName("paper_discussion"), "paper_discussion", null);
  const studies = [];
  for (const [i, s] of structure.studies.entries()) {
    const part = async <P extends (typeof STUDY_PART_NAMES)[number]>(name: P) => read(studyFileName(i + 1, name), name, s.study_label);
    studies.push(
      assembleStudy(s.study_label, {
        designSampleBias: await part("study_design_sample_bias"),
        measurements: await part("study_measurements"),
        paths: await part("study_paths"),
        tables: await part("study_tables"),
      }),
    );
  }
  hash.update(manualModelName(who));
  const model = manualModelName(who);
  const saved = {
    file: path.basename(pdfPath),
    file_hash: meta.fileHash,
    model,
    prompt_version: `${FULL_PROMPT_VERSION}${MANUAL_PROMPT_SUFFIX}`,
    status: "done",
    batch: false,
    structure,
    discussion,
    studies,
    calls,
    usage: { inputTokens: 0, outputTokens: 0 },
    costUsd: 0,
    manual: { tool: who.tool, model: who.model, packet: meta.code },
  } as unknown as SavedExtraction;
  return { saved, answersHash: hash.digest("hex") };
}

async function existingRows(db: pg.Client, paperId: string): Promise<ImportSummary["replaces"]> {
  const n = async (table: string) => Number((await db.query<{ n: string }>(`select count(*) as n from ${table} where paper_id = $1`, [paperId])).rows[0]!.n);
  const models = await db.query<{ model_name: string }>("select distinct model_name from extraction_runs where paper_id = $1 order by model_name", [paperId]);
  return { studies: await n("studies"), paths: await n("path_results"), measurements: await n("measurements"), models: models.rows.map((r) => r.model_name) };
}

/** One packet: check, summarise, and (with `yes`) back up, save and publish. */
export async function importPacket(db: pg.Client, deps: ImportDeps, dir: string, who: Provenance, options: { yes?: boolean } = {}): Promise<ImportOutcome> {
  manualModelName(who); // fails early on a bad name
  const checked = await checkPacket(dir, { writeFeedback: false });
  if (!checked.ok) return { status: "invalid", errors: checked.errors };
  const meta = JSON.parse(await readFile(path.join(dir, PACKET_FILES.meta), "utf8")) as PacketMeta;

  const row = (await db.query<{ id: string; pdf_path: string }>("select id, pdf_path from papers where file_hash = $1", [meta.fileHash])).rows[0];
  if (!row) return { status: "unknown_paper", fileHash: meta.fileHash };

  const { saved, answersHash } = await loadAnswers(dir, meta, who, row.pdf_path);
  const marker = path.join(dir, IMPORTED_MARKER);
  if (existsSync(marker) && (JSON.parse(await readFile(marker, "utf8")) as { answersHash?: string }).answersHash === answersHash) return { status: "already_imported" };

  const pdf = new Uint8Array(await readFile(path.join(deps.repoRoot, row.pdf_path)));
  if (sha256(pdf) !== meta.fileHash) throw new Error(`${row.pdf_path} is not the PDF this packet was made for (hash differs)`);
  const analysis = analysePaper(await readTextLayer(pdf), saved);
  const count = (b: string) => analysis.fields.filter((f) => f.badge === b).length;
  const summary: ImportSummary = {
    studies: saved.studies.length,
    fields: analysis.fields.length,
    badges: { verified: count("auto_verified"), attention: count("needs_attention"), interpreted: count("ai_interpreted"), hidden: count("hidden") },
    completeness: analysis.completeness,
    replaces: await existingRows(db, row.id),
  };
  if (!options.yes) return { status: "preview", summary };

  await deps.backup?.();
  // Keep the saved extraction of another source (Gemini) next to the new one, once.
  const saveTo = resultFile(deps.extractedDir, meta.fileHash);
  await mkdir(deps.extractedDir, { recursive: true });
  if (existsSync(saveTo)) {
    const old = JSON.parse(await readFile(saveTo, "utf8")) as { model?: string };
    const backupFile = path.join(deps.extractedDir, `${meta.fileHash.slice(0, 16)}.gemini.json`);
    if (!String(old.model ?? "").startsWith("manual:") && !existsSync(backupFile)) await copyFile(saveTo, backupFile);
  }
  await writeFile(saveTo, JSON.stringify(saved, null, 2));
  const result = await publishExtracted(db, { pdf, pdfPath: row.pdf_path, saved, force: true, versions: manualVersions() });
  await writeFile(marker, `${JSON.stringify({ importedAt: new Date().toISOString(), answersHash, model: saved.model, paperId: row.id }, null, 2)}\n`);
  return { status: "imported", summary, published: result.published };
}

/** pg_dump of the local database through the Supabase container, into a file. */
export async function pgDumpViaDocker(container: string, file: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(file);
    const child = spawn("docker", ["exec", container, "pg_dump", "-U", "postgres", "--clean", "--if-exists", "postgres"], { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.stdout.pipe(out);
    child.on("error", (e) => reject(new Error(`cannot run docker: ${e.message}`)));
    child.on("close", (code) => out.close(() => (code === 0 ? resolve() : reject(new Error(`pg_dump failed (exit ${code}): ${err.slice(0, 300)}`)))));
  });
}

/** Runs `fn` the first time it is called and remembers the outcome (one backup per run, however many packets). */
export function once(fn: () => Promise<void>): () => Promise<void> {
  let started: Promise<void> | null = null;
  return () => (started ??= fn());
}

export function backupFile(extractedDir: string, now = new Date()): string {
  return path.join(extractedDir, "backups", `db-${now.toISOString().replace(/[:.]/g, "-")}.sql`);
}
