/**
 * `pnpm worker manual check <packet>` (step 1b.8b): validates the answers an external extractor wrote into a
 * packet's `out/` folder. Needs no database and no key, so the agent can run it itself and fix what it reports.
 * Errors stop an import; warnings are only shown. FEEDBACK.md lists the errors for the agent and is removed
 * when the packet is valid.
 */
import { existsSync } from "node:fs";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { CODEBOOK_VERSION, type ExtractionSchemaName, SCHEMA_VERSION } from "@research-data/schema";
import { FULL_PROMPT_VERSION, STUDY_PART_NAMES } from "../extract/full-prompt.js";
import { parseAnswer } from "../extract/parse.js";
import { sha256 } from "../pdf/text-layer.js";
import { PACKET_FILES, type PacketMeta, paperFileName, studyFileName } from "./packet.js";

export interface Issue {
  /** The file the issue is about, relative to the packet folder (e.g. "out/paper_structure.json"). */
  file: string;
  message: string;
}

export interface CheckResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  /** Answer files that passed validation. */
  validFiles: number;
  studies: number;
}

const MAX_QUOTE_WORDS = 50;
const MAX_LISTED = 5;

/** Objects shaped like evidence: a page and a quote (the schema already requires both to be non-empty). */
function evidenceObjects(value: unknown, at = "", out: { at: string; page: unknown; quote: string }[] = []): { at: string; page: unknown; quote: string }[] {
  if (Array.isArray(value)) value.forEach((v, i) => evidenceObjects(v, `${at}.${i}`, out));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.quote === "string" && "pdf_page" in o) out.push({ at: at.replace(/^\./, ""), page: o.pdf_page, quote: o.quote });
    for (const [k, v] of Object.entries(o)) evidenceObjects(v, `${at}.${k}`, out);
  }
  return out;
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function checkPacket(dir: string, options: { writeFeedback?: boolean } = {}): Promise<CheckResult> {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const outDir = path.join(dir, PACKET_FILES.out);
  const rel = (file: string) => `${PACKET_FILES.out}/${file}`;
  let validFiles = 0;
  let studies = 0;

  const finish = async (): Promise<CheckResult> => {
    const feedback = path.join(dir, PACKET_FILES.feedback);
    if (options.writeFeedback !== false) {
      if (errors.length) {
        const lines = errors.map((e) => `* ${e.file}: ${e.message}`);
        await writeFile(feedback, `# Validation feedback\n\nThese problems stop the import. Fix ONLY the files named here (see ${PACKET_FILES.instructions}), write them again, then stop.\n\n${lines.join("\n")}\n`);
      } else {
        await rm(feedback, { force: true });
      }
    }
    return { ok: errors.length === 0, errors, warnings, validFiles, studies };
  };

  // 1. The packet itself.
  const metaFile = path.join(dir, PACKET_FILES.meta);
  if (!existsSync(metaFile)) {
    errors.push({ file: PACKET_FILES.meta, message: "not found: this folder is not a packet (run `manual export`)" });
    return finish();
  }
  let meta: PacketMeta;
  try {
    meta = JSON.parse(await readFile(metaFile, "utf8")) as PacketMeta;
  } catch {
    errors.push({ file: PACKET_FILES.meta, message: "is not valid JSON; export the packet again" });
    return finish();
  }
  const current = { promptVersion: FULL_PROMPT_VERSION, schemaVersion: SCHEMA_VERSION, codebookVersion: CODEBOOK_VERSION };
  for (const key of ["promptVersion", "schemaVersion", "codebookVersion"] as const) {
    if (meta[key] !== current[key]) errors.push({ file: PACKET_FILES.meta, message: `${key} is ${meta[key]}, the current one is ${current[key]}: export the packet again` });
  }
  const pdfFile = path.join(dir, PACKET_FILES.pdf);
  if (!existsSync(pdfFile)) errors.push({ file: PACKET_FILES.pdf, message: "not found" });
  else if (sha256(new Uint8Array(await readFile(pdfFile))) !== meta.fileHash) errors.push({ file: PACKET_FILES.pdf, message: "is not the paper this packet was made for (hash differs)" });
  if (errors.length) return finish();

  // 2. The answer files.
  const present = new Set(await readdir(outDir).catch(() => [] as string[]));
  const expected = new Set<string>();
  const read = async <S extends ExtractionSchemaName>(file: string, pass: S) => {
    expected.add(file);
    if (!present.has(file)) {
      const hint = pass.startsWith("study_") ? [...present].find((p) => p === file.replace(/^(study_\d+_)study_/, "$1")) : undefined;
      errors.push({ file: rel(file), message: hint ? `file is missing; it was written as ${rel(hint)}: use the exact name ${rel(file)}` : "file is missing" });
      return null;
    }
    const text = await readFile(path.join(outDir, file), "utf8");
    const parsed = parseAnswer(pass, text);
    if (!parsed.ok) {
      errors.push({ file: rel(file), message: parsed.error.replace(/^[a-z_]+: /, "").replace("Gemini did not return valid JSON", "the file is not valid JSON (one JSON object, no text or code fences around it)") });
      return null;
    }
    validFiles++;
    const evidence = evidenceObjects(JSON.parse(text));
    const long = evidence.filter((e) => words(e.quote) > MAX_QUOTE_WORDS);
    if (long.length) warnings.push({ file: rel(file), message: `${long.length} quote(s) longer than ${MAX_QUOTE_WORDS} words (rule 3), for example at ${long.slice(0, MAX_LISTED).map((e) => e.at).join(", ")}` });
    return parsed;
  };

  const structure = await read(paperFileName("paper_structure"), "paper_structure");
  await read(paperFileName("paper_discussion"), "paper_discussion");
  if (structure) {
    studies = structure.data.studies.length;
    for (const [i] of structure.data.studies.entries()) for (const part of STUDY_PART_NAMES) await read(studyFileName(i + 1, part), part);
  } else {
    warnings.push({ file: rel(paperFileName("paper_structure")), message: "the study files cannot be checked until paper_structure.json is valid" });
  }

  // 3. Files nobody asked for.
  for (const file of [...present].sort()) if (!expected.has(file)) warnings.push({ file: rel(file), message: "is not an expected answer file and will be ignored" });

  return finish();
}

export function formatCheck(result: CheckResult): string {
  const lines: string[] = [];
  lines.push(result.ok ? `VALID: ${result.validFiles} answer file(s), ${result.studies} stud${result.studies === 1 ? "y" : "ies"}` : `NOT VALID: ${result.errors.length} problem(s) to fix`);
  for (const e of result.errors) lines.push(`  ✗ ${e.file}: ${e.message.slice(0, 400)}`);
  for (const w of result.warnings) lines.push(`  ! ${w.file}: ${w.message.slice(0, 300)}`);
  return lines.join("\n");
}
