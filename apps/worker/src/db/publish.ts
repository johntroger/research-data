/**
 * Writes one paper's extraction and verification results to the database (step 0.7).
 * The caller owns the transaction (see `withTransaction`), so tests can roll everything back.
 */
import type pg from "pg";
import type { SkeletonResult } from "../extract/extract-skeleton.js";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import type { FieldVerification } from "../verify/verify-skeleton.js";

export interface PublishInput {
  layer: PdfTextLayer;
  /** Printed page for each PDF page (from resolvePrintedPages), indexed by pdfPageIndex. */
  printedPages: string[];
  /** Where the PDF lives, relative to the repository (later: the R2 object key). */
  pdfPath: string;
  extraction: Pick<SkeletonResult, "model" | "promptVersion" | "usage" | "costUsd" | "rawText">;
  schemaVersion: string;
  fields: FieldVerification[];
}

export interface PublishSummary {
  paperId: string;
  extractionRunId: string;
  inserted: number;
  updated: number;
  /** Fields edited by hand (locked) that were left untouched. */
  skippedLocked: number;
}

function parseRaw(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    return { unparsed: rawText };
  }
}

export interface FieldUpsertSummary {
  inserted: number;
  updated: number;
  /** Fields edited by hand (locked) that were left untouched. */
  skippedLocked: number;
}

/**
 * Writes verified fields to extracted_fields. A field edited by hand (locked = true) is never
 * overwritten: re-extraction must not undo the owner's work (Mục 6.7).
 * `runIdFor` gives the extraction run each field comes from.
 */
export async function upsertFields(
  client: pg.Client,
  paperId: string,
  fields: FieldVerification[],
  printedPages: string[],
  runIdFor: (field: FieldVerification) => string | null,
): Promise<FieldUpsertSummary> {
  const input = { printedPages, fields };
  const extractionRunIdOf = runIdFor;
  let inserted = 0;
  let updated = 0;
  let skippedLocked = 0;

  for (const field of input.fields) {
    const extractionRunId = extractionRunIdOf(field);
    const pdfPageIndex = field.evidence.pdfPage > 0 ? field.evidence.pdfPage - 1 : null;
    const printedPage = pdfPageIndex === null ? null : (input.printedPages[pdfPageIndex] ?? null);
    const params = [
      paperId,
      extractionRunId,
      field.naturalKey,
      field.fieldName,
      field.tier,
      JSON.stringify(field.value),
      field.evidence.quote || null,
      pdfPageIndex,
      printedPage,
      field.badge,
      JSON.stringify({ checks: field.checks }),
    ];

    // Insert, or update only when the existing row was not edited by hand (locked = false).
    const result = await client.query<{ inserted: boolean }>(
      `insert into extracted_fields
         (paper_id, extraction_run_id, natural_key, field_name, tier, value,
          evidence_quote, pdf_page_index, printed_page, badge, check_results)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (paper_id, natural_key) do update set
         extraction_run_id = excluded.extraction_run_id,
         field_name        = excluded.field_name,
         tier              = excluded.tier,
         value             = excluded.value,
         evidence_quote    = excluded.evidence_quote,
         pdf_page_index    = excluded.pdf_page_index,
         printed_page      = excluded.printed_page,
         badge             = excluded.badge,
         check_results     = excluded.check_results,
         updated_at        = now()
       where extracted_fields.locked = false
       returning (xmax = 0) as inserted`,
      params,
    );

    const row = result.rows[0];
    if (!row) skippedLocked++;
    else if (row.inserted) inserted++;
    else updated++;
  }

  return { inserted, updated, skippedLocked };
}

export async function publishPaper(client: pg.Client, input: PublishInput): Promise<PublishSummary> {
  const paper = await client.query<{ id: string }>(
    `insert into papers (file_hash, pdf_path, page_count)
     values ($1, $2, $3)
     on conflict (file_hash) do update set pdf_path = excluded.pdf_path, page_count = excluded.page_count
     returning id`,
    [input.layer.fileHash, input.pdfPath, input.layer.pageCount],
  );
  const paperId = paper.rows[0]!.id;

  const raw = JSON.stringify(parseRaw(input.extraction.rawText));

  // Publishing the same saved Gemini response again must not record a second (paid) run,
  // otherwise the cost totals would count one API call twice.
  const existingRun = await client.query<{ id: string }>(
    `select id from extraction_runs
     where paper_id = $1 and model_name = $2 and prompt_version = $3 and raw_response = $4::jsonb
     limit 1`,
    [paperId, input.extraction.model, input.extraction.promptVersion, raw],
  );

  const extractionRunId =
    existingRun.rows[0]?.id ??
    (
      await client.query<{ id: string }>(
        `insert into extraction_runs
           (paper_id, model_name, prompt_version, schema_version, input_tokens, output_tokens, cost_usd, raw_response)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id`,
        [
          paperId,
          input.extraction.model,
          input.extraction.promptVersion,
          input.schemaVersion,
          input.extraction.usage.inputTokens,
          input.extraction.usage.outputTokens,
          input.extraction.costUsd,
          raw,
        ],
      )
    ).rows[0]!.id;

  const { inserted, updated, skippedLocked } = await upsertFields(client, paperId, input.fields, input.printedPages, () => extractionRunId);
  return { paperId, extractionRunId, inserted, updated, skippedLocked };
}
