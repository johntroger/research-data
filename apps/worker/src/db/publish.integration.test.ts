/**
 * Integration tests for publishPaper (step 0.7). Needs Supabase local: `pnpm db:start`, then `pnpm test:db`.
 * Every test runs inside a transaction that is rolled back.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import type { FieldVerification } from "../verify/verify-skeleton.js";
import { connect } from "./client.js";
import { publishPaper, type PublishInput } from "./publish.js";

let client: pg.Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await client.end();
});

async function inRollback(fn: () => Promise<void>): Promise<void> {
  await client.query("begin");
  try {
    await fn();
  } finally {
    await client.query("rollback");
  }
}

const LAYER = { fileHash: "test-hash-publish", pageCount: 3 } as PdfTextLayer;

function field(naturalKey: string, value: unknown, badge: FieldVerification["badge"], pdfPage = 2): FieldVerification {
  return {
    naturalKey,
    fieldName: naturalKey.split(":").at(-1)!,
    tier: "T1",
    value,
    evidence: { pdfPage, quote: `quote for ${naturalKey}` },
    badge,
    checks: [{ name: "quote_in_pdf", passed: badge !== "hidden", severity: "hide", detail: "test" }],
  };
}

function input(fields: FieldVerification[], overrides: Partial<PublishInput> = {}): PublishInput {
  return {
    layer: LAYER,
    printedPages: ["107", "108", "109"],
    pdfPath: "raw_papers/test.pdf",
    extraction: {
      model: "gemini-4-argon",
      promptVersion: "skeleton-test",
      usage: { inputTokens: 100, outputTokens: 20 },
      costUsd: 0.0004,
      rawText: '{"ok":true}',
    },
    schemaVersion: "0.0.0",
    fields,
    ...overrides,
  };
}

async function fieldsOf(paperId: string) {
  const res = await client.query<{
    natural_key: string;
    value: unknown;
    badge: string;
    pdf_page_index: number | null;
    printed_page: string | null;
    check_results: { checks: unknown[] };
  }>("select * from extracted_fields where paper_id = $1 order by natural_key", [paperId]);
  return res.rows;
}

describe("publishPaper", () => {
  it("stores the paper, the extraction run and every field with page numbers", async () => {
    await inRollback(async () => {
      const summary = await publishPaper(
        client,
        input([field("study_1:sample_size", 412, "auto_verified"), field("paper_type", "survey", "hidden", 1)]),
      );
      expect(summary).toMatchObject({ inserted: 2, updated: 0, skippedLocked: 0 });

      const rows = await fieldsOf(summary.paperId);
      expect(rows.map((r) => [r.natural_key, r.value, r.badge, r.pdf_page_index, r.printed_page])).toEqual([
        ["paper_type", "survey", "hidden", 0, "107"],
        ["study_1:sample_size", 412, "auto_verified", 1, "108"],
      ]);
      expect(rows[1]!.check_results.checks).toHaveLength(1);

      const run = await client.query("select model_name, cost_usd, raw_response from extraction_runs where id = $1", [
        summary.extractionRunId,
      ]);
      expect(run.rows[0]).toMatchObject({ model_name: "gemini-4-argon", cost_usd: "0.000400", raw_response: { ok: true } });
    });
  });

  it("is idempotent: publishing again updates rows instead of duplicating them", async () => {
    await inRollback(async () => {
      const first = await publishPaper(client, input([field("study_1:sample_size", 412, "auto_verified")]));
      const second = await publishPaper(client, input([field("study_1:sample_size", 410, "needs_attention")]));

      expect(second.paperId).toBe(first.paperId);
      expect(second).toMatchObject({ inserted: 0, updated: 1, skippedLocked: 0 });
      const rows = await fieldsOf(first.paperId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ value: 410, badge: "needs_attention" });

      const runs = await client.query("select count(*)::int as n from extraction_runs where paper_id = $1", [first.paperId]);
      expect(runs.rows[0].n).toBe(1); // same saved Gemini response → same run, cost counted once
    });
  });

  it("records a new extraction run only when the Gemini response is different", async () => {
    await inRollback(async () => {
      const first = await publishPaper(client, input([field("study_1:sample_size", 412, "auto_verified")]));
      const sameAgain = await publishPaper(client, input([field("study_1:sample_size", 412, "auto_verified")]));
      expect(sameAgain.extractionRunId).toBe(first.extractionRunId);

      const newCall = input([field("study_1:sample_size", 412, "auto_verified")]);
      newCall.extraction = { ...newCall.extraction, rawText: '{"ok":false}' };
      const second = await publishPaper(client, newCall);
      expect(second.extractionRunId).not.toBe(first.extractionRunId);

      const runs = await client.query("select count(*)::int as n from extraction_runs where paper_id = $1", [first.paperId]);
      expect(runs.rows[0].n).toBe(2);
    });
  });

  it("never overwrites a field that was edited by hand (locked)", async () => {
    await inRollback(async () => {
      const first = await publishPaper(client, input([field("study_1:sample_size", 412, "auto_verified")]));
      await client.query(
        "update extracted_fields set value = '400', badge = 'human_reviewed', locked = true where paper_id = $1",
        [first.paperId],
      );

      const again = await publishPaper(
        client,
        input([field("study_1:sample_size", 999, "auto_verified"), field("paper_type", "survey", "auto_verified")]),
      );
      expect(again).toMatchObject({ inserted: 1, updated: 0, skippedLocked: 1 });

      const rows = await fieldsOf(first.paperId);
      expect(rows.find((r) => r.natural_key === "study_1:sample_size")).toMatchObject({ value: 400, badge: "human_reviewed" });
    });
  });

  it("keeps fields without evidence pages as null page numbers", async () => {
    await inRollback(async () => {
      const summary = await publishPaper(client, input([field("study_1:sample_size", 412, "hidden", 0)]));
      const [row] = await fieldsOf(summary.paperId);
      expect(row).toMatchObject({ pdf_page_index: null, printed_page: null });
    });
  });

  it("lets anonymous visitors read the verified field but not the hidden one", async () => {
    await inRollback(async () => {
      await publishPaper(
        client,
        input([field("study_1:sample_size", 412, "auto_verified"), field("paper_type", "survey", "hidden")]),
      );
      await client.query("set local role anon");
      const res = await client.query<{ natural_key: string }>(
        "select natural_key from extracted_fields f join papers p on p.id = f.paper_id where p.file_hash = $1",
        [LAYER.fileHash],
      );
      expect(res.rows.map((r) => r.natural_key)).toEqual(["study_1:sample_size"]);
    });
  });
});
