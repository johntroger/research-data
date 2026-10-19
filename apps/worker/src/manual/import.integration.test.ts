/**
 * Integration tests for `manual import` (step 1b.8c): the answers of an external extractor replace the paper's data.
 * An agent is simulated by the answer key of a synthetic paper. Requires Supabase local: `pnpm db:reset`, then `pnpm test:db`.
 * The tests run in order: each one builds on what the one before left in the database.
 */
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connect } from "../db/client.js";
import { extractFull } from "../extract/extract-full.js";
import { FULL_PROMPT_VERSION } from "../extract/full-prompt.js";
import { publishExtracted, type SavedExtraction } from "../pipeline/extracted.js";
import { resultFile } from "../pipeline/queue.js";
import { sha256 } from "../pdf/text-layer.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { writePacket } from "./export.js";
import { IMPORTED_MARKER, importPacket, manualModelName, manualVersions } from "./import.js";
import { buildPacket } from "./packet.js";

const paper = SYNTHETIC_PAPERS[0]!;
const other = SYNTHETIC_PAPERS[1]!;
const WHO = { tool: "codex", model: "gpt-6.1-sol-medium" };
let db: pg.Client;
let repo: string;
let extracted: string;
let packets: string;
let pdf: Uint8Array;
let hash: string;
let dir: string;
const backup = vi.fn(async () => {});

const deps = () => ({ repoRoot: repo, extractedDir: extracted, backup });
const q = async <T extends object>(sql: string, params: unknown[] = []) => (await db.query<T & pg.QueryResultRow>(sql, params)).rows;

/** What an agent would write into the packet's out/: the answer key of the synthetic paper. */
async function writeAnswers(into: string, p: typeof paper, pdfBytes: Uint8Array) {
  const result = await extractFull(pdfBytes, { model: "m", generate: answerKeyGenerator(p).generate });
  const labels = p.answer.structure.studies.map((s) => s.study_label);
  for (const c of result.calls) {
    const file = c.studyLabel === null ? `${c.pass}.json` : `study_${labels.indexOf(c.studyLabel) + 1}_${c.pass}.json`;
    await writeFile(path.join(into, "out", file), c.rawText);
  }
  return result;
}

beforeAll(async () => {
  db = await connect();
  repo = await mkdtemp(path.join(tmpdir(), "rd-imp-repo-"));
  extracted = await mkdtemp(path.join(tmpdir(), "rd-imp-extracted-"));
  packets = await mkdtemp(path.join(tmpdir(), "rd-imp-packets-"));
  pdf = await renderPdf(paper.render);
  hash = sha256(pdf);
  await mkdir(path.join(repo, "pdf"), { recursive: true });
  await writeFile(path.join(repo, "pdf", "paper.pdf"), pdf);

  // The paper is already published from a (fake) Gemini extraction, whose saved file is on disk too.
  const gemini = await extractFull(pdf, { model: "gemini-4-argon", generate: answerKeyGenerator(paper).generate });
  const saved = { ...gemini, status: "done", prompt_version: gemini.promptVersion } as unknown as SavedExtraction;
  await publishExtracted(db, { pdf, pdfPath: "pdf/paper.pdf", saved });
  await writeFile(resultFile(extracted, hash), JSON.stringify(saved));

  dir = await writePacket(packets, "Q1", buildPacket({ code: "Q1", fileHash: hash, title: "T", pdf }));
  await writeAnswers(dir, paper, pdf);
});
afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [hash]);
  await db.query("delete from pipeline_runs where file_hash = $1", [hash]);
  await db.query("delete from api_spend where file_hash = $1", [hash]);
  for (const d of [repo, extracted, packets]) await rm(d, { recursive: true, force: true });
  await db.end();
});

describe("naming", () => {
  it("records the source as manual:<tool>:<model> and refuses names that are not plain words", () => {
    expect(manualModelName(WHO)).toBe("manual:codex:gpt-6.1-sol-medium");
    expect(() => manualModelName({ tool: "co dex", model: "x" })).toThrow(/Invalid --tool/);
    expect(() => manualModelName({ tool: "codex", model: "a/b" })).toThrow(/Invalid --model/);
  });

  it("gives the manual source its own processing key, so a Gemini publish of the same paper never skips it", () => {
    expect(manualVersions().prompt).toBe(`${FULL_PROMPT_VERSION}-manual`);
  });
});

describe("manual import", () => {
  it("previews without writing anything: no backup, no marker, the Gemini data untouched", async () => {
    const before = await q<{ n: string }>("select count(*) as n from extraction_runs where paper_id = (select id from papers where file_hash = $1)", [hash]);
    const outcome = await importPacket(db, deps(), dir, WHO);
    expect(outcome.status).toBe("preview");
    if (outcome.status !== "preview") return;
    expect(outcome.summary).toMatchObject({ studies: 1, completeness: "complete" });
    expect(outcome.summary.replaces).toMatchObject({ models: ["gemini-4-argon"] });
    expect(outcome.summary.replaces.paths).toBeGreaterThan(0);
    expect(backup).not.toHaveBeenCalled();
    expect(existsSync(path.join(dir, IMPORTED_MARKER))).toBe(false);
    const after = await q<{ n: string }>("select count(*) as n from extraction_runs where paper_id = (select id from papers where file_hash = $1)", [hash]);
    expect(after[0]!.n).toBe(before[0]!.n);
  });

  it("imports: backs up first, keeps the Gemini file, replaces the data, records the source at zero cost", async () => {
    const studiesBefore = await q<{ n: string }>("select count(*) as n from studies where paper_id = (select id from papers where file_hash = $1)", [hash]);
    const spendBefore = await q<{ n: string }>("select count(*) as n from api_spend where file_hash = $1", [hash]);
    const outcome = await importPacket(db, deps(), dir, WHO, { yes: true });
    expect(outcome.status).toBe("imported");
    expect(backup).toHaveBeenCalledTimes(1);

    // The saved extraction is now the manual one; the Gemini one is kept next to it.
    const savedNow = JSON.parse(await readFile(resultFile(extracted, hash), "utf8")) as { model: string; prompt_version: string; costUsd: number; manual: { tool: string; packet: string } };
    expect(savedNow).toMatchObject({ model: "manual:codex:gpt-6.1-sol-medium", prompt_version: `${FULL_PROMPT_VERSION}-manual`, costUsd: 0, manual: { tool: "codex", packet: "Q1" } });
    const gemini = JSON.parse(await readFile(path.join(extracted, `${hash.slice(0, 16)}.gemini.json`), "utf8")) as { model: string };
    expect(gemini.model).toBe("gemini-4-argon");

    // The database: same paper, same business rows (replaced), the runs carry the manual source, no money spent.
    const studiesAfter = await q<{ n: string }>("select count(*) as n from studies where paper_id = (select id from papers where file_hash = $1)", [hash]);
    expect(studiesAfter[0]!.n).toBe(studiesBefore[0]!.n);
    const runs = await q<{ model_name: string; prompt_version: string; cost_usd: string | null }>("select model_name, prompt_version, cost_usd from extraction_runs where paper_id = (select id from papers where file_hash = $1) and model_name like 'manual:%'", [hash]);
    expect(runs).toHaveLength(6);
    expect(runs.every((r) => r.model_name === "manual:codex:gpt-6.1-sol-medium" && Number(r.cost_usd ?? 0) === 0)).toBe(true);
    const spendAfter = await q<{ n: string }>("select count(*) as n from api_spend where file_hash = $1", [hash]);
    expect(spendAfter[0]!.n).toBe(spendBefore[0]!.n);
    const keys = await q<{ processing_key: string }>("select processing_key from pipeline_runs where file_hash = $1 and step = 'S10'", [hash]);
    expect(keys.some((k) => k.processing_key.includes(`prompt@${FULL_PROMPT_VERSION}-manual`))).toBe(true);
    expect(existsSync(path.join(dir, IMPORTED_MARKER))).toBe(true);
  });

  it("recognises the same answers and does nothing, not even a backup", async () => {
    backup.mockClear();
    expect((await importPacket(db, deps(), dir, WHO, { yes: true })).status).toBe("already_imported");
    expect(backup).not.toHaveBeenCalled();
  });

  it("imports again when an answer changed, and keeps a field edited by hand", async () => {
    await db.query("update studies set locked = true, software = 'EDITED BY HAND' where paper_id = (select id from papers where file_hash = $1) and natural_key = 'study_1'", [hash]);
    const file = path.join(dir, "out", "paper_discussion.json");
    const discussion = JSON.parse(await readFile(file, "utf8")) as { contribution_type: { originality: string } };
    discussion.contribution_type.originality = discussion.contribution_type.originality === "incremental" ? "revelatory" : "incremental";
    await writeFile(file, JSON.stringify(discussion));
    backup.mockClear();
    const outcome = await importPacket(db, deps(), dir, WHO, { yes: true });
    expect(outcome.status).toBe("imported");
    expect(backup).toHaveBeenCalledTimes(1);
    const study = await q<{ software: string }>("select software from studies where paper_id = (select id from papers where file_hash = $1) and natural_key = 'study_1'", [hash]);
    expect(study[0]!.software).toBe("EDITED BY HAND");
    // The step details are those of this import, not of the first one.
    const s4 = await q<{ details: { model: string } }>("select details from pipeline_runs where file_hash = $1 and step = 'S4' and processing_key like '%-manual'", [hash]);
    expect(s4[0]!.details.model).toBe("manual:codex:gpt-6.1-sol-medium");
  });

  it("refuses a packet that is not valid, naming the problem, and writes and backs up nothing", async () => {
    const bad = await writePacket(packets, "Bad", buildPacket({ code: "Bad", fileHash: hash, title: "T", pdf }));
    await writeAnswers(bad, paper, pdf);
    await rm(path.join(bad, "out", "study_1_study_paths.json"));
    backup.mockClear();
    const outcome = await importPacket(db, deps(), bad, WHO, { yes: true });
    expect(outcome).toMatchObject({ status: "invalid", errors: [{ file: "out/study_1_study_paths.json", message: "file is missing" }] });
    expect(backup).not.toHaveBeenCalled();
    expect(existsSync(path.join(bad, IMPORTED_MARKER))).toBe(false);
    expect(await readdir(bad)).not.toContain("FEEDBACK.md"); // import never writes into the packet except its marker
  });

  it("refuses a packet for a paper that is not in the database", async () => {
    const otherPdf = await renderPdf(other.render);
    const dirOther = await writePacket(packets, "Other", buildPacket({ code: "Other", fileHash: sha256(otherPdf), title: "O", pdf: otherPdf }));
    await writeAnswers(dirOther, other, otherPdf);
    const outcome = await importPacket(db, deps(), dirOther, WHO, { yes: true });
    expect(outcome).toEqual({ status: "unknown_paper", fileHash: sha256(otherPdf) });
  });

  it("keeps a copy of a Gemini file only once: the second source never overwrites the first backup", async () => {
    const backupFile = path.join(extracted, `${hash.slice(0, 16)}.gemini.json`);
    const first = await readFile(backupFile, "utf8");
    // Two imports have already run over a manual file by now: neither turned it into the "Gemini" backup.
    expect(await readFile(backupFile, "utf8")).toBe(first);
    expect(JSON.parse(first).model).toBe("gemini-4-argon");
  });
});
