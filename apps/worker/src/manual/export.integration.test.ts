/**
 * Integration test for `manual export` (step 1b.8a): finds a published paper in the database and writes its packet.
 * Requires Supabase local: `pnpm db:reset`, then `pnpm test:db`.
 */
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import { extractFull } from "../extract/extract-full.js";
import { publishExtracted, type SavedExtraction } from "../pipeline/extracted.js";
import { sha256 } from "../pdf/text-layer.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { exportPacket, findPaper } from "./export.js";

const paper = SYNTHETIC_PAPERS[0]!;
let db: pg.Client;
let repo: string;
let packets: string;
let pdf: Uint8Array;

beforeAll(async () => {
  db = await connect();
  repo = await mkdtemp(path.join(tmpdir(), "rd-repo-"));
  packets = await mkdtemp(path.join(tmpdir(), "rd-packets-"));
  pdf = await renderPdf(paper.render);
  await mkdir(path.join(repo, "pdf"), { recursive: true });
  await writeFile(path.join(repo, "pdf", "paper.pdf"), pdf);
  const result = await extractFull(pdf, { model: "gemini-4-argon", generate: answerKeyGenerator(paper).generate });
  const saved = { ...result, status: "done", prompt_version: result.promptVersion } as unknown as SavedExtraction;
  await publishExtracted(db, { pdf, pdfPath: "pdf/paper.pdf", saved });
});
afterAll(async () => {
  const hash = sha256(pdf);
  await db.query("delete from papers where file_hash = $1", [hash]);
  await db.query("delete from pipeline_runs where file_hash = $1", [hash]);
  await rm(repo, { recursive: true, force: true });
  await rm(packets, { recursive: true, force: true });
  await db.end();
});

describe("manual export", () => {
  it("finds the paper by the start of its hash and writes a packet that carries the real PDF and hash", async () => {
    const hash = sha256(pdf);
    const found = await findPaper(db, hash.slice(0, 10));
    expect(found.fileHash).toBe(hash);
    const result = await exportPacket(db, { repoRoot: repo, packetsRoot: packets, paper: hash.slice(0, 10), code: "Q-int" });
    expect(result.dir).toBe(path.join(packets, "Q-int"));
    expect(JSON.parse(await readFile(path.join(result.dir, "packet.json"), "utf8"))).toMatchObject({ code: "Q-int", fileHash: hash });
    expect(new Uint8Array(await readFile(path.join(result.dir, "paper.pdf")))).toEqual(pdf);
    expect(await readdir(path.join(result.dir, "out"))).toEqual([]);
  });

  it("uses the first 12 characters of the hash as the packet name when no code is given", async () => {
    const hash = sha256(pdf);
    const result = await exportPacket(db, { repoRoot: repo, packetsRoot: packets, paper: hash.slice(0, 10) });
    expect(result.code).toBe(hash.slice(0, 12));
  });

  it("refuses a paper that matches nothing", async () => {
    await expect(findPaper(db, "no-such-paper-title-zzz")).rejects.toThrow(/matches 0 papers/);
  });
});
