/**
 * Integration test for the quality report (step 1b.1): the SQL that reads published fields with their
 * study design and failed checks. Requires Supabase local: `pnpm db:reset`, then `pnpm test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import { extractFull } from "../extract/extract-full.js";
import { publishExtracted, type SavedExtraction } from "../pipeline/extracted.js";
import { readTextLayer } from "../pdf/text-layer.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { analysePaper } from "../verify/analyse.js";
import { loadQualityFields, summariseQuality } from "./quality.js";

const paper = SYNTHETIC_PAPERS[0]!;
let db: pg.Client;
let fileHash: string;
let paperId: string;
let hiddenInAnalysis = 0;
let fieldsInAnalysis = 0;

beforeAll(async () => {
  db = await connect();
  const pdf = await renderPdf(paper.render);
  const result = await extractFull(pdf, { model: "gemini-4-argon", generate: answerKeyGenerator(paper).generate });
  const saved = { ...result, status: "done", prompt_version: result.promptVersion } as unknown as SavedExtraction;
  const analysis = analysePaper(await readTextLayer(pdf), saved);
  fieldsInAnalysis = analysis.fields.length;
  hiddenInAnalysis = analysis.fields.filter((f) => f.badge === "hidden").length;
  const published = await publishExtracted(db, { pdf, pdfPath: `raw_papers/${paper.id}.pdf`, saved });
  paperId = published.published!.paperId;
  fileHash = (await readTextLayer(pdf)).fileHash;
});
afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [fileHash]);
  await db.query("delete from pipeline_runs where file_hash = $1", [fileHash]);
  await db.end();
});

describe("loadQualityFields", () => {
  it("returns every published field of a paper, with the design of its study and paper-level fields apart", async () => {
    const fields = (await loadQualityFields(db)).filter((f) => f.paperId === paperId);
    expect(fields).toHaveLength(fieldsInAnalysis);
    const designs = new Set(fields.map((f) => f.design));
    expect(designs.has("survey")).toBe(true); // the fields of Study 1
    expect(designs.has(null)).toBe(true); // discussion, theories…
    const study = (await db.query<{ research_design: string }>("select research_design from studies where paper_id = $1 and natural_key = 'study_1'", [paperId])).rows[0]!;
    const estimate = fields.find((f) => f.fieldName === "estimate")!;
    expect(estimate.design).toBe(study.research_design);
  });

  it("agrees with the analysis on how many fields are hidden, and sums up without loss", async () => {
    const fields = (await loadQualityFields(db)).filter((f) => f.paperId === paperId);
    const s = summariseQuality(fields);
    expect(s.total.hidden).toBe(hiddenInAnalysis);
    expect(s.total.verified + s.total.attention + s.total.interpreted + s.total.hidden).toBe(fieldsInAnalysis);
    expect(s.byDesign.reduce((n, r) => n + r.verified + r.attention + r.interpreted + r.hidden, 0)).toBe(fieldsInAnalysis);
  });
});
