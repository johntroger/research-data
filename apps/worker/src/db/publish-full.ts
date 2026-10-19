/**
 * Writes a verified full extraction to the database (step 1.8, S10). The caller owns the transaction
 * (see `withTransaction`).
 *
 * What is stored, per paper:
 *   extraction_runs  one row per AI call: model, prompt / schema / codebook version, tokens, cost, RAW response
 *   evidence         every quote, with the page it was really found on, the printed page and the match
 *   business rows    studies, samples, constructs, tested paths, matrices, experimental cells, theories,
 *                    statements (plan-full.ts), each with its badge and the raw answer it came from
 *   extracted_fields every verified field with the result of every check ("Vì sao ✓")
 *
 * Re-publishing is safe:
 *   - the same raw answer reuses its run, so costs are not counted twice;
 *   - anything the owner locked (a whole row, or a single field's column) is never overwritten;
 *   - rows and fields of an earlier extraction that no longer exist are removed, unless locked
 *     (a locked leftover is reported, never lost silently).
 */
import { CODEBOOK_VERSION, SCHEMA_VERSION } from "@research-data/schema";
import type pg from "pg";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import type { PaperAnalysis } from "../verify/analyse.js";
import type { FieldVerification } from "../verify/checks.js";
import { verifyQuote } from "../verify/quote.js";
import type { FullData } from "../verify/verify-full.js";
import { buildPlan, type EvidenceLike, type PlannedRow, type RowTable } from "./plan-full.js";
import { upsertFields } from "./publish.js";
import type { ExtractionMapping } from "../mapping/extraction.js";

export interface RunInput {
  pass: string;
  studyLabel: string | null;
  usage: { inputTokens: number; outputTokens: number };
  costUsd: number | null;
  rawText: string;
  batch?: boolean;
}

export interface PublishFullInput {
  layer: PdfTextLayer;
  /** Printed page for each PDF page (resolvePrintedPages). */
  printedPages: string[];
  printedPageMethod: string;
  /** Where the PDF lives, relative to the repository. */
  pdfPath: string;
  data: FullData;
  analysis: PaperAnalysis;
  mapping: ExtractionMapping;
  model: string;
  promptVersion: string;
  runs: RunInput[];
}

export interface TableCounts {
  inserted: number;
  updated: number;
  /** Rows left as they were because the owner locked them. */
  skippedLocked: number;
  removed: number;
  /** Locked rows whose key is not in the new extraction: kept, and listed for the owner. */
  orphanedLocked: number;
}

export interface PublishFullSummary {
  paperId: string;
  runs: { stored: number; reused: number };
  evidence: number;
  tables: Record<string, TableCounts>;
  fields: TableCounts;
}

const JSONB_COLUMNS = new Set(["variables", "internal_check", "simple_slopes", "factors", "raw_extraction"]);
/** Tables whose rows belong to a Study. */
const WITH_STUDY = new Set<RowTable>(["samples", "measurements", "path_results", "correlation_matrices", "condition_cells"]);
/** Delete order for stale rows: children before parents. */
const CLEANUP_ORDER: RowTable[] = ["condition_cells", "correlation_matrices", "path_results", "measurements", "samples", "studies", "paper_statements", "paper_theories"];

const empty = (): TableCounts => ({ inserted: 0, updated: 0, skippedLocked: 0, removed: 0, orphanedLocked: 0 });

function parseRaw(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { unparsed: text };
  }
}

export async function publishFull(db: pg.Client, input: PublishFullInput): Promise<PublishFullSummary> {
  const { layer } = input;

  // ── Paper row ──────────────────────────────────────────────────────────────
  const paper = await db.query<{ id: string }>(
    `insert into papers (file_hash, pdf_path, page_count) values ($1, $2, $3)
     on conflict (file_hash) do update set pdf_path = excluded.pdf_path, page_count = excluded.page_count, updated_at = now()
     returning id`,
    [layer.fileHash, input.pdfPath, layer.pageCount],
  );
  const paperId = paper.rows[0]!.id;

  // ── Extraction runs: every call, with its raw answer and the versions it ran under ──
  const runIds = new Map<string, string>();
  const runSummary = { stored: 0, reused: 0 };
  for (const run of input.runs) {
    const raw = JSON.stringify(parseRaw(run.rawText));
    const existing = await db.query<{ id: string }>(
      `select id from extraction_runs
       where paper_id = $1 and pass = $2 and coalesce(study_label, '') = $3 and model_name = $4 and prompt_version = $5 and raw_response = $6::jsonb
       limit 1`,
      [paperId, run.pass, run.studyLabel ?? "", input.model, input.promptVersion, raw],
    );
    let id = existing.rows[0]?.id;
    if (id) runSummary.reused++;
    else {
      const inserted = await db.query<{ id: string }>(
        `insert into extraction_runs
           (paper_id, model_name, prompt_version, schema_version, codebook_version, pass, study_label,
            input_tokens, output_tokens, cost_usd, raw_response, batch, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'done') returning id`,
        [paperId, input.model, input.promptVersion, SCHEMA_VERSION, CODEBOOK_VERSION, run.pass, run.studyLabel, run.usage.inputTokens, run.usage.outputTokens, run.costUsd, raw, run.batch ?? false],
      );
      id = inserted.rows[0]!.id;
      runSummary.stored++;
    }
    const key = `${run.pass}|${run.studyLabel ?? ""}`;
    if (!runIds.has(key)) runIds.set(key, id);
  }
  const runIdOf = (source: PlannedRow["source"]) => runIds.get(`${source.pass}|${source.studyLabel ?? ""}`) ?? null;

  // ── Evidence: the page the quote really is on, the printed page, how well it matched ──
  const evidenceIds = new Map<string, string>();
  async function evidenceId(ev: EvidenceLike | null | undefined): Promise<string | null> {
    if (!ev || !ev.quote) return null;
    const cacheKey = `${ev.pdf_page}|${ev.quote}`;
    const known = evidenceIds.get(cacheKey);
    if (known) return known;
    const check = verifyQuote(layer, ev.quote, ev.pdf_page);
    const page = check.foundOnPage ?? ev.pdf_page;
    const pageIndex = Math.max(0, page - 1);
    const hasText = layer.pages[pageIndex]?.hasTextLayer ?? true;
    const res = await db.query<{ id: string }>(
      `insert into evidence (paper_id, exact_quote, pdf_page_index, printed_page, printed_page_method, section, table_or_figure, table_cell,
                             verified, verification_method, match_score, hidden)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (paper_id, pdf_page_index, md5(exact_quote)) do update set
         printed_page = excluded.printed_page, printed_page_method = excluded.printed_page_method, section = excluded.section,
         table_or_figure = excluded.table_or_figure, table_cell = excluded.table_cell, verified = excluded.verified,
         verification_method = excluded.verification_method, match_score = excluded.match_score, hidden = excluded.hidden
       returning id`,
      [
        paperId,
        ev.quote,
        pageIndex,
        input.printedPages[pageIndex] ?? null,
        input.printedPageMethod,
        ev.section ?? null,
        ev.table_or_figure ?? null,
        ev.table_cell ? JSON.stringify(ev.table_cell) : null,
        check.match !== "not_found" ? true : hasText ? false : null,
        check.match,
        check.score,
        // A quote not found on a page that has text is not shown to visitors; on an image-only page it cannot be checked.
        check.match === "not_found" && hasText,
      ],
    );
    evidenceIds.set(cacheKey, res.rows[0]!.id);
    return res.rows[0]!.id;
  }

  const plan = buildPlan({ data: input.data, analysis: input.analysis, mapping: input.mapping });

  // ── Paper-level columns ────────────────────────────────────────────────────
  await db.query(
    `update papers set paper_type = $2, hypothesis_codes = $3, contribution_originality = $4, contribution_utility = $5, gap_type = $6,
       problematization_hint = $7, completeness_status = $8, missing_items = $9,
       paper_type_evidence_id = $10, gap_evidence_id = $11, updated_at = now()
     where id = $1`,
    [
      paperId,
      plan.paper.paper_type,
      plan.paper.hypothesis_codes,
      plan.paper.contribution_originality,
      plan.paper.contribution_utility,
      plan.paper.gap_type,
      plan.paper.problematization_hint,
      plan.paper.completeness_status,
      plan.paper.missing_items,
      await evidenceId(plan.paperEvidence.paper_type_evidence_id),
      await evidenceId(plan.paperEvidence.gap_evidence_id),
    ],
  );

  for (const t of plan.tables) {
    await db.query(
      `insert into paper_tables (paper_id, table_label, pdf_page_index, kind, study_label) values ($1, $2, $3, $4, $5)
       on conflict (paper_id, table_label) do update set pdf_page_index = excluded.pdf_page_index, kind = excluded.kind, study_label = excluded.study_label`,
      [paperId, t.table_label, t.pdf_page_index, t.kind, t.study_label],
    );
  }
  await db.query("delete from paper_tables where paper_id = $1 and table_label <> all($2)", [paperId, plan.tables.map((t) => t.table_label)]);

  // ── Business rows ──────────────────────────────────────────────────────────
  const lockedFieldKeys = new Set(
    (await db.query<{ natural_key: string }>("select natural_key from extracted_fields where paper_id = $1 and locked", [paperId])).rows.map((r) => r.natural_key),
  );
  const counts: Record<string, TableCounts> = {};
  const studyIds = new Map<string, string>();
  const matrixIds: { id: string; row: PlannedRow }[] = [];
  const order: RowTable[] = ["studies", "paper_theories", "paper_statements", "samples", "measurements", "path_results", "correlation_matrices", "condition_cells"];

  for (const table of order) {
    const tableCounts = (counts[table] = empty());
    for (const row of plan.rows.filter((r) => r.table === table)) {
      const evidenceColumns: Record<string, string | null> = {};
      for (const [column, ev] of Object.entries(row.evidence)) evidenceColumns[column] = await evidenceId(ev);
      if (table === "paper_statements" && !evidenceColumns.evidence_id) continue; // a statement is its evidence

      const values: Record<string, unknown> = {
        paper_id: paperId,
        natural_key: row.naturalKey,
        badge: row.badge,
        extraction_run_id: runIdOf(row.source),
        raw_extraction: row.raw,
        ...row.columns,
        ...evidenceColumns,
      };
      if (WITH_STUDY.has(table)) {
        const studyId = row.studyKey ? studyIds.get(row.studyKey) : undefined;
        if (!studyId) continue;
        values.study_id = studyId;
      }
      // Columns whose field the owner locked keep their value.
      const keep = new Set(Object.entries(row.fieldColumns).filter(([, key]) => lockedFieldKeys.has(key)).map(([column]) => column));

      const columns = Object.keys(values);
      const placeholders = columns.map((c, i) => (JSONB_COLUMNS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`));
      const params = columns.map((c) => (JSONB_COLUMNS.has(c) ? JSON.stringify(values[c] ?? null) : values[c]));
      const updatable = columns.filter((c) => !["paper_id", "natural_key", "study_id"].includes(c) && !keep.has(c));
      const result = await db.query<{ id: string; inserted: boolean }>(
        `insert into ${table} (${columns.join(", ")}) values (${placeholders.join(", ")})
         on conflict (paper_id, natural_key) do update set ${updatable.map((c) => `${c} = excluded.${c}`).join(", ")}, updated_at = now()
         where ${table}.locked = false
         returning id, (xmax = 0) as inserted`,
        params,
      );
      let id = result.rows[0]?.id;
      if (!id) {
        tableCounts.skippedLocked++;
        id = (await db.query<{ id: string }>(`select id from ${table} where paper_id = $1 and natural_key = $2`, [paperId, row.naturalKey])).rows[0]!.id;
      } else if (result.rows[0]!.inserted) tableCounts.inserted++;
      else tableCounts.updated++;

      if (table === "studies") studyIds.set(row.naturalKey, id);
      if (table === "correlation_matrices" && result.rows[0]) matrixIds.push({ id, row });
    }
  }

  // Cells and statistics are rewritten with their matrix (a locked matrix keeps its own).
  for (const { id, row } of matrixIds) {
    await db.query("delete from matrix_cells where matrix_id = $1", [id]);
    await db.query("delete from matrix_descriptives where matrix_id = $1", [id]);
    for (const c of row.cells ?? []) await db.query("insert into matrix_cells (matrix_id, i, j, r) values ($1, $2, $3, $4)", [id, c.i, c.j, c.r]);
    for (const d of row.descriptives ?? []) {
      await db.query(
        "insert into matrix_descriptives (matrix_id, variable_index, variable, mean, sd, alpha, cr, ave) values ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, d.variable_index, d.variable, d.mean, d.sd, d.alpha, d.cr, d.ave],
      );
    }
  }

  // ── Verified fields ("Vì sao ✓") ───────────────────────────────────────────
  const rowKeys = plan.rows.map((r) => ({ key: r.naturalKey, source: r.source }));
  const runForField = (field: FieldVerification): string | null => {
    const owner = rowKeys.filter((r) => field.naturalKey === r.key || field.naturalKey.startsWith(`${r.key}:`)).sort((a, b) => b.key.length - a.key.length)[0];
    if (owner) return runIdOf(owner.source);
    const discussion = /^(theoretical_contribution|practical_implication|limitation|future_direction|contribution_type|gap_type)/.test(field.naturalKey);
    return runIdOf({ pass: discussion ? "paper_discussion" : "paper_structure", studyLabel: null });
  };
  const fieldCounts = { ...empty(), ...(await upsertFields(db, paperId, input.analysis.fields, input.printedPages, runForField)) };

  // ── Remove what an earlier extraction left behind, unless locked ───────────
  for (const table of CLEANUP_ORDER) {
    const keys = plan.rows.filter((r) => r.table === table).map((r) => r.naturalKey);
    const removed = await db.query(`delete from ${table} where paper_id = $1 and natural_key <> all($2) and locked = false`, [paperId, keys]);
    const orphaned = await db.query(`select 1 from ${table} where paper_id = $1 and natural_key <> all($2) and locked = true`, [paperId, keys]);
    counts[table] ??= empty();
    counts[table]!.removed = removed.rowCount ?? 0;
    counts[table]!.orphanedLocked = orphaned.rowCount ?? 0;
  }
  const fieldKeys = input.analysis.fields.map((f) => f.naturalKey);
  fieldCounts.removed = (await db.query("delete from extracted_fields where paper_id = $1 and natural_key <> all($2) and locked = false", [paperId, fieldKeys])).rowCount ?? 0;
  fieldCounts.orphanedLocked = (await db.query("select 1 from extracted_fields where paper_id = $1 and natural_key <> all($2) and locked = true", [paperId, fieldKeys])).rowCount ?? 0;

  return { paperId, runs: runSummary, evidence: evidenceIds.size, tables: counts, fields: fieldCounts };
}
