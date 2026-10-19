/**
 * Integration tests for the full publish (step 1.8) on the synthetic papers.
 * Requires Supabase local with migrations applied: `pnpm db:reset`, then `pnpm test:db`.
 * Tests that call publishFull run inside a transaction that is rolled back; those that go through the
 * pipeline (publishExtracted opens its own transaction) delete the paper they create.
 */
import { CODEBOOK_VERSION, SCHEMA_VERSION } from "@research-data/schema";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS, type SyntheticPaper } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { extractFull } from "../extract/extract-full.js";
import { FULL_PROMPT_VERSION } from "../extract/full-prompt.js";
import { canonicalIndexes, mapExtraction } from "../mapping/extraction.js";
import { publishExtracted, runInputs, type SavedExtraction } from "../pipeline/extracted.js";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { analysePaper } from "../verify/analyse.js";
import type { FullData } from "../verify/verify-full.js";
import { connect } from "./client.js";
import { publishFull, type PublishFullInput } from "./publish-full.js";

const MODEL = "gemini-4-argon";
let db: pg.Client;
const pdfs = new Map<string, Uint8Array>();
const layers = new Map<string, PdfTextLayer>();
const saved = new Map<string, SavedExtraction>();

beforeAll(async () => {
  db = await connect();
  for (const p of SYNTHETIC_PAPERS) {
    pdfs.set(p.id, await renderPdf(p.render));
    layers.set(p.id, await readTextLayer(pdfs.get(p.id)!));
    const result = await extractFull(pdfs.get(p.id)!, { model: MODEL, generate: answerKeyGenerator(p).generate });
    saved.set(p.id, { ...result, status: "done", prompt_version: result.promptVersion } as unknown as SavedExtraction);
  }
});
afterAll(async () => {
  for (const p of SYNTHETIC_PAPERS) await db.query("delete from papers where file_hash = $1", [layers.get(p.id)!.fileHash]);
  await db.query("delete from pipeline_runs where file_hash = any($1)", [SYNTHETIC_PAPERS.map((p) => layers.get(p.id)!.fileHash)]);
  await db.end();
});

async function inRollback(fn: () => Promise<void>): Promise<void> {
  await db.query("begin");
  try {
    await fn();
  } finally {
    await db.query("rollback");
  }
}

/** Inputs for publishFull; `edit` changes the extraction before it is verified (to plant errors). */
function input(paper: SyntheticPaper, edit: (d: FullData) => void = () => {}): PublishFullInput {
  const layer = layers.get(paper.id)!;
  const data = structuredClone(paper.answer);
  edit(data);
  const printed = resolvePrintedPages(layer);
  return {
    layer,
    printedPages: printed.printedPages,
    printedPageMethod: printed.method,
    pdfPath: `raw_papers/${paper.id}.pdf`,
    data,
    analysis: analysePaper(layer, data),
    mapping: mapExtraction(data, canonicalIndexes()),
    model: MODEL,
    promptVersion: FULL_PROMPT_VERSION,
    runs: runInputs(saved.get(paper.id)!),
  };
}

const q = async <T extends object>(sql: string, params: unknown[] = []) => (await db.query<T & pg.QueryResultRow>(sql, params)).rows;
const count = async (table: string, paperId: string) => Number((await q<{ n: string }>(`select count(*) as n from ${table} where paper_id = $1`, [paperId]))[0]!.n);

describe("publishFull", () => {
  const paper = SYNTHETIC_PAPERS[0]!;

  it("stores every kind of row with the values of the answer key", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper));
      expect(s.tables).toMatchObject({ studies: { inserted: 1 }, samples: { inserted: 1 }, measurements: { inserted: 3 }, path_results: { inserted: 3 }, correlation_matrices: { inserted: 1 }, paper_statements: { inserted: 4 }, paper_theories: { inserted: 1 } });

      const study = (await q<Record<string, unknown>>("select * from studies where paper_id = $1", [s.paperId]))[0]!;
      expect(study).toMatchObject({ natural_key: "study_1", study_label: "Study 1", research_design: "survey", analysis_method: ["pls_sem"], software: "SmartPLS 4", cmb_statistical: ["harman"], cmb_weak_only: true, badge: "auto_verified" });
      const sample = (await q<Record<string, unknown>>("select * from samples where paper_id = $1", [s.paperId]))[0]!;
      expect(sample).toMatchObject({ n: 412, country_iso: ["VN"], sample_type: "online_convenience", study_id: study.id });
      const paths = await q<Record<string, unknown>>("select * from path_results where paper_id = $1 order by natural_key", [s.paperId]);
      expect(paths.map((p) => [p.hypothesis_code, Number(p.estimate), Number(p.t_or_z), p.status, p.iv_construct_id, p.dv_construct_id])).toEqual([
        ["H1", 0.48, 8.4, "supported", "influencer_credibility", "brand_trust"],
        ["H2", 0.35, 6.1, "supported", "brand_trust", "purchase_intention"],
        ["H3", 0.08, 1.21, "not_supported", "influencer_credibility", "purchase_intention"],
      ]);
      expect(paths.every((p) => p.badge === "auto_verified" && p.stat_consistency !== undefined)).toBe(true);
      const cells = await q<{ i: number; j: number; r: string }>("select c.i, c.j, c.r from matrix_cells c join correlation_matrices m on m.id = c.matrix_id where m.paper_id = $1 order by 1, 2", [s.paperId]);
      expect(cells.map((c) => [c.i, c.j, Number(c.r)])).toEqual([[1, 0, 0.48], [2, 0, 0.39], [2, 1, 0.52]]);
      const meas = await q<Record<string, unknown>>("select * from measurements where paper_id = $1 and canonical_construct_id = 'brand_trust'", [s.paperId]);
      expect(meas[0]).toMatchObject({ construct_label_original: "Brand Trust", n_items: 4 });
      const tables = await q<{ table_label: string }>("select table_label from paper_tables where paper_id = $1 order by 1", [s.paperId]);
      expect(tables.map((t) => t.table_label)).toEqual(["Table 1", "Table 2", "Table 3"]);
      expect((await q<Record<string, unknown>>("select * from papers where id = $1", [s.paperId]))[0]).toMatchObject({ paper_type: "empirical_quant", completeness_status: "complete", hypothesis_codes: ["H1", "H2", "H3"], page_count: 4 });
      expect(await count("extracted_fields", s.paperId)).toBe(input(paper).analysis.fields.length);
    });
  });

  it("keeps the versions, tokens, cost and raw answer of every call", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper));
      const runs = await q<Record<string, unknown>>("select * from extraction_runs where paper_id = $1 order by pass", [s.paperId]);
      expect(runs).toHaveLength(6);
      expect(runs.every((r) => r.model_name === MODEL && r.prompt_version === FULL_PROMPT_VERSION && r.schema_version === SCHEMA_VERSION && r.codebook_version === CODEBOOK_VERSION && r.status === "done")).toBe(true);
      expect(runs.map((r) => r.pass).sort()).toEqual(["paper_discussion", "paper_structure", "study_design_sample_bias", "study_measurements", "study_paths", "study_tables"]);
      const structure = runs.find((r) => r.pass === "paper_structure")!;
      expect(structure.raw_response).toEqual(JSON.parse(saved.get(paper.id)!.calls[0]!.rawText));
      expect(Number(structure.cost_usd)).toBeGreaterThan(0);
      expect(structure.study_label).toBeNull();
      const paths = await q<{ extraction_run_id: string }>("select extraction_run_id from path_results where paper_id = $1", [s.paperId]);
      expect(new Set(paths.map((p) => p.extraction_run_id))).toEqual(new Set([runs.find((r) => r.pass === "study_paths")!.id]));
    });
  });

  it("records evidence with the printed page and how the quote matched", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper));
      const rows = await q<Record<string, unknown>>("select * from evidence where paper_id = $1", [s.paperId]);
      expect(rows.length).toBeGreaterThan(10);
      expect(rows.every((e) => e.verified === true && e.hidden === false && Number(e.match_score) > 0.9)).toBe(true);
      const n = rows.find((e) => String(e.exact_quote).startsWith("The final sample comprised 412"))!;
      expect(n).toMatchObject({ pdf_page_index: 1, printed_page: "1202", printed_page_method: "header_footer", section: "method", verification_method: "exact" });
      const table = rows.find((e) => e.table_or_figure === "Table 3")!;
      expect(table.pdf_page_index).toBe(2);
    });
  });

  it("can be published again without duplicating anything", async () => {
    await inRollback(async () => {
      const first = await publishFull(db, input(paper));
      const second = await publishFull(db, input(paper));
      expect(second.paperId).toBe(first.paperId);
      expect(second.runs).toEqual({ stored: 0, reused: 6 });
      for (const [table, c] of Object.entries(second.tables)) expect({ table, inserted: c.inserted, removed: c.removed }).toEqual({ table, inserted: 0, removed: 0 });
      expect(second.fields).toMatchObject({ inserted: 0, removed: 0 });
      for (const table of ["extraction_runs", "evidence", "studies", "path_results", "measurements", "extracted_fields", "paper_tables", "paper_statements"]) {
        expect({ table, n: await count(table, second.paperId) }).toEqual({ table, n: await count(table, first.paperId) });
      }
      expect(await count("extracted_fields", second.paperId)).toBe(input(paper).analysis.fields.length);
    });
  });

  it("removes what an earlier extraction left behind", async () => {
    await inRollback(async () => {
      const first = await publishFull(db, input(paper));
      const second = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths = d.studies[0]!.paths.filter((p) => p.hypothesis_code !== "H3"))));
      expect(second.tables.path_results).toMatchObject({ removed: 1 });
      expect(await count("path_results", first.paperId)).toBe(2);
      expect((await q<{ n: string }>("select count(*) as n from extracted_fields where paper_id = $1 and natural_key like 'study_1:h3:%'", [first.paperId]))[0]!.n).toBe("0");
    });
  });
});

describe("what a visitor may see", () => {
  const paper = SYNTHETIC_PAPERS[0]!;

  it("shows a verified row, and hides a row whose key value is not in the PDF", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths[0]!.estimate = 0.47)));
      await db.query("set local role anon");
      const visible = await q<{ hypothesis_code: string }>("select hypothesis_code from path_results where paper_id = $1 order by 1", [s.paperId]);
      expect(visible.map((r) => r.hypothesis_code)).toEqual(["H2", "H3"]);
      const fields = await q<{ natural_key: string }>("select natural_key from extracted_fields where paper_id = $1 and field_name = 'estimate'", [s.paperId]);
      expect(fields).toHaveLength(2);
    });
  });

  it("shows a row without the one value that failed the check", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths[0]!.r2_dv = 0.123)));
      const owner = (await q<Record<string, unknown>>("select r2_dv, estimate, badge from path_results where paper_id = $1 and hypothesis_code = 'H1'", [s.paperId]))[0]!;
      expect(owner).toMatchObject({ r2_dv: null, badge: "auto_verified" });
      expect(Number(owner.estimate)).toBe(0.48);
      // The value is kept for the owner as a hidden field and in the raw answer.
      const hidden = await q<{ value: unknown; badge: string }>("select value, badge from extracted_fields where paper_id = $1 and field_name = 'r2_dv'", [s.paperId]);
      expect(hidden).toEqual([{ value: 0.123, badge: "hidden" }]);
      await db.query("set local role anon");
      expect(await q("select 1 from extracted_fields where paper_id = $1 and field_name = 'r2_dv'", [s.paperId])).toEqual([]);
      expect((await q<{ r2_dv: null }>("select r2_dv from path_results where paper_id = $1 and hypothesis_code = 'H1'", [s.paperId]))[0]!.r2_dv).toBeNull();
    });
  });

  it("cannot read the raw answers that hold hidden values", async () => {
    await inRollback(async () => {
      const s = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths[0]!.r2_dv = 0.123)));
      await db.query("set local role anon");
      for (const table of ["studies", "samples", "measurements", "path_results", "correlation_matrices", "condition_cells", "paper_theories", "paper_statements"]) {
        await db.query("savepoint s");
        await expect(db.query(`select raw_extraction from ${table} where paper_id = $1`, [s.paperId]), table).rejects.toThrow(/permission denied/);
        await db.query("rollback to savepoint s");
        await expect(db.query(`select raw_extraction from ${table}`), `${table} (all rows)`).rejects.toThrow();
        await db.query("rollback to savepoint s").catch(() => {});
      }
    });
  });

  it("can still read every other column of those tables (no column was forgotten)", async () => {
    await inRollback(async () => {
      // Listed as the owner: a visitor does not even see the column he may not read.
      const tables = await q<{ table_name: string }>("select distinct table_name from information_schema.columns where table_schema = 'public' and column_name = 'raw_extraction'");
      expect(tables.length).toBe(8);
      await db.query("set local role anon");
      for (const { table_name } of tables) {
        const cols = await q<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name <> 'raw_extraction'", [table_name]);
        await expect(db.query(`select ${cols.map((c) => c.column_name).join(", ")} from ${table_name} limit 1`), table_name).resolves.toBeDefined();
      }
    });
  });

  it("does not show evidence whose quote is not in the PDF", async () => {
    await inRollback(async () => {
      const s = await publishFull(
        db,
        input(paper, (d) => {
          d.studies[0]!.sample.n_evidence = { ...d.studies[0]!.sample.n_evidence!, quote: "We surveyed 412 managers across Europe in 2023." };
        }),
      );
      const e = (await q<Record<string, unknown>>("select verified, hidden, verification_method from evidence where paper_id = $1 and exact_quote like 'We surveyed%'", [s.paperId]))[0]!;
      expect(e).toMatchObject({ verified: false, hidden: true, verification_method: "not_found" });
      await db.query("set local role anon");
      expect(await q("select 1 from evidence where paper_id = $1 and exact_quote like 'We surveyed%'", [s.paperId])).toEqual([]);
    });
  });
});

describe("hand-edited (locked) data survives a new extraction", () => {
  const paper = SYNTHETIC_PAPERS[0]!;

  it("keeps a locked field in its column and in extracted_fields, and updates the rest", async () => {
    await inRollback(async () => {
      const first = await publishFull(db, input(paper));
      // The owner corrects the H1 estimate by hand: the field is locked and the column follows.
      await db.query("update extracted_fields set value = '0.5', badge = 'human_reviewed', locked = true where paper_id = $1 and natural_key = 'study_1:h1:influencer_credibility->brand_trust:direct:estimate'", [first.paperId]);
      await db.query("update path_results set estimate = 0.5 where paper_id = $1 and hypothesis_code = 'H1'", [first.paperId]);
      // A new extraction reads H1 as 0.48 again and finds a different t.
      const again = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths[0]!.t_or_z = 8.4)));
      expect(again.fields.skippedLocked).toBe(1);
      const field = (await q<{ value: unknown; badge: string; locked: boolean }>("select value, badge, locked from extracted_fields where paper_id = $1 and natural_key like 'study_1:h1:%:estimate'", [first.paperId]))[0]!;
      expect(field).toEqual({ value: 0.5, badge: "human_reviewed", locked: true });
      const row = (await q<Record<string, unknown>>("select estimate, t_or_z from path_results where paper_id = $1 and hypothesis_code = 'H1'", [first.paperId]))[0]!;
      expect(Number(row.estimate)).toBe(0.5); // the locked column stays
      expect(Number(row.t_or_z)).toBe(8.4); // the others follow the new extraction
    });
  });

  it("leaves a locked row exactly as it is", async () => {
    await inRollback(async () => {
      const first = await publishFull(db, input(paper));
      await db.query("update path_results set locked = true, status = 'mixed', badge = 'human_reviewed' where paper_id = $1 and hypothesis_code = 'H2'", [first.paperId]);
      const again = await publishFull(db, input(paper));
      expect(again.tables.path_results).toMatchObject({ skippedLocked: 1, updated: 2 });
      expect((await q<Record<string, unknown>>("select status, badge from path_results where paper_id = $1 and hypothesis_code = 'H2'", [first.paperId]))[0]).toEqual({ status: "mixed", badge: "human_reviewed" });
    });
  });

  it("keeps a locked row or field that the new extraction no longer has, and says so", async () => {
    await inRollback(async () => {
      const first = await publishFull(db, input(paper));
      await db.query("update path_results set locked = true where paper_id = $1 and hypothesis_code = 'H3'", [first.paperId]);
      await db.query("update extracted_fields set locked = true where paper_id = $1 and natural_key like 'study_1:h3:%:estimate'", [first.paperId]);
      const again = await publishFull(db, input(paper, (d) => (d.studies[0]!.paths = d.studies[0]!.paths.filter((p) => p.hypothesis_code !== "H3"))));
      expect(again.tables.path_results).toMatchObject({ removed: 0, orphanedLocked: 1 });
      expect(again.fields.orphanedLocked).toBe(1);
      expect(await count("path_results", first.paperId)).toBe(3);
      // Its unlocked fields went away with the extraction; the locked one stayed.
      expect((await q<{ n: string }>("select count(*) as n from extracted_fields where paper_id = $1 and natural_key like 'study_1:h3:%'", [first.paperId]))[0]!.n).toBe("1");
    });
  });
});

describe("robustness", () => {
  it("publishes values the database would refuse by leaving their columns empty (they were flagged ⚠)", async () => {
    await inRollback(async () => {
      const paper = SYNTHETIC_PAPERS[0]!;
      const s = await publishFull(
        db,
        input(paper, (d) => {
          d.studies[0]!.paths[0]!.p_value = 3;
          d.studies[0]!.paths[0]!.ci_low = 0.52; // both printed on the page, but reversed
          d.studies[0]!.paths[0]!.ci_high = 0.39;
          d.studies[0]!.design.exclusion_rate = 1.5;
        }),
      );
      const h1 = (await q<Record<string, unknown>>("select p_value, ci_low, ci_high from path_results where paper_id = $1 and hypothesis_code = 'H1'", [s.paperId]))[0]!;
      expect(h1).toEqual({ p_value: null, ci_low: null, ci_high: null });
    });
  });

  it("publishes every synthetic paper, with several studies, cells, slopes and an image-only page", async () => {
    await inRollback(async () => {
      for (const p of SYNTHETIC_PAPERS) {
        const s = await publishFull(db, input(p));
        expect(await count("studies", s.paperId)).toBe(p.answer.studies.length);
      }
      const p03 = SYNTHETIC_PAPERS[2]!;
      const paperId = (await q<{ id: string }>("select id from papers where file_hash = $1", [layers.get(p03.id)!.fileHash]))[0]!.id;
      const slopes = (await q<{ simple_slopes: { level: string }[] }>("select simple_slopes from path_results where paper_id = $1 and hypothesis_code = 'H2'", [paperId]))[0]!;
      expect(slopes.simple_slopes.map((s) => s.level)).toEqual(["-1 SD", "+1 SD"]);
      const cells = await q("select 1 from condition_cells cc join papers p on p.id = cc.paper_id where p.file_hash = $1", [layers.get(SYNTHETIC_PAPERS[1]!.id)!.fileHash]);
      expect(cells).toHaveLength(4);
    });
  });
});

describe("pipeline steps S4–S10", () => {
  const paper = SYNTHETIC_PAPERS[1]!;

  it("records each step with the versions, publishes once, and skips the same processing key", async () => {
    const pdf = pdfs.get(paper.id)!;
    const run = () => publishExtracted(db, { pdf, pdfPath: `raw_papers/${paper.id}.pdf`, saved: saved.get(paper.id)! });
    const first = await run();
    expect(first.steps).toEqual({ S4: "done", S5: "done", S6: "done", S7: "done", S8: "done", S10: "done" });
    expect(first.published).not.toBeNull();
    const steps = await q<{ step: string; status: string; details: Record<string, unknown>; paper_id: string }>("select step, status, details, paper_id from pipeline_runs where file_hash = $1 and step in ('S4', 'S5', 'S6', 'S7', 'S8', 'S10') order by length(step), step", [layers.get(paper.id)!.fileHash]);
    expect(steps.map((s) => `${s.step}:${s.status}`)).toEqual(["S4:done", "S5:done", "S6:done", "S7:done", "S8:done", "S10:done"]);
    expect(steps.every((s) => s.paper_id === first.published!.paperId)).toBe(true);
    expect(steps[0]!.details).toMatchObject({ model: MODEL, prompt_version: FULL_PROMPT_VERSION, calls: 6 });
    expect(steps[1]!.details).toMatchObject({ hidden: 0 });

    const second = await run();
    expect(second.steps).toEqual({ S4: "skipped", S5: "skipped", S6: "skipped", S7: "skipped", S8: "skipped", S10: "skipped" });
    expect(second.published).toBeNull();

    const forced = await publishExtracted(db, { pdf, pdfPath: `raw_papers/${paper.id}.pdf`, saved: saved.get(paper.id)!, force: true });
    expect(forced.steps.S10).toBe("done");
    expect(forced.published!.runs).toEqual({ stored: 0, reused: 6 });
    expect(forced.published!.paperId).toBe(first.published!.paperId);
  });

  it("refuses an extraction that did not finish", async () => {
    const pdf = pdfs.get(paper.id)!;
    await expect(publishExtracted(db, { pdf, pdfPath: "x.pdf", saved: { ...saved.get(paper.id)!, status: "failed" } })).rejects.toThrow(/did not finish/);
  });
});
