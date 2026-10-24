/**
 * Integration tests for the business tables (step 1.1).
 * Requires Supabase local with migrations and seed applied: `pnpm db:reset`, then `pnpm test:db`.
 */
import {
  ANALYSIS_METHODS,
  APPLICATION_ROLES,
  CANONICAL_CONSTRUCTS,
  CANONICAL_THEORIES,
  canonicalKey,
  CI_METHODS,
  CMB_PROCEDURAL,
  CMB_STATISTICAL,
  CONSTRUCT_DOMAINS,
  CONSTRUCT_ORDERS,
  CORRELATION_TYPES,
  DIAGONAL_TYPES,
  DIRECTIONS,
  EFFECT_SIZE_TYPES,
  EFFECT_TYPES,
  ENDOGENEITY_METHODS,
  ESTIMATE_TYPES,
  GAP_TYPES,
  HYPOTHESIS_STATUSES,
  INTERACTION_TYPES,
  MANIPULATION_CHECKS,
  MARKET_TYPES,
  MEDIATION_TYPES,
  ORIGINALITY,
  PAPER_TYPES,
  RESEARCH_DESIGNS,
  SAMPLE_TYPES,
  SCALE_TYPES,
  SECTIONS,
  SIGNS,
  TABLE_KINDS,
  TIME_DESIGNS,
  UNITS_OF_ANALYSIS,
  UTILITY,
} from "@research-data/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "./client.js";
import type pg from "pg";

let client: pg.Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await client.end();
});

/** Runs `fn` inside a transaction that is always rolled back, so tests leave no data behind. */
async function inRollback<T>(fn: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    return await fn();
  } finally {
    await client.query("rollback");
  }
}

const one = async <T extends object>(sql: string, params: unknown[] = []) => (await client.query<T & pg.QueryResultRow>(sql, params)).rows[0]!;

/** A paper with one study, one evidence row, and one row per business table; returns the ids. */
async function seedPaper(badge: "auto_verified" | "hidden" = "auto_verified") {
  const { id: paperId } = await one<{ id: string }>(
    "insert into papers (file_hash, title, paper_type, hypothesis_codes) values ('hash-1-1', 'Test', 'empirical_quant', '{H1}') returning id",
  );
  const { id: evidenceId } = await one<{ id: string }>(
    "insert into evidence (paper_id, exact_quote, pdf_page_index, section) values ($1, 'H1 A -> B 0.42', 2, 'results') returning id",
    [paperId],
  );
  const { id: studyId } = await one<{ id: string }>(
    `insert into studies (paper_id, natural_key, study_label, research_design, analysis_method, cmb_statistical, badge)
     values ($1, 'S1', 'Study 1', 'survey', '{pls_sem}', '{harman}', $2) returning id`,
    [paperId, badge],
  );
  await client.query(
    "insert into samples (study_id, paper_id, natural_key, n, country_iso, sample_type, badge) values ($1, $2, 'S1:sample', 412, '{VN}', 'online_convenience', $3)",
    [studyId, paperId, badge],
  );
  await client.query(
    `insert into measurements (study_id, paper_id, natural_key, construct_label_original, canonical_construct_id, alpha, cr, ave, badge)
     values ($1, $2, 'S1:M:brand_trust', 'Brand Trust', 'brand_trust', 0.86, 0.90, 0.70, $3)`,
    [studyId, paperId, badge],
  );
  await client.query(
    `insert into path_results (study_id, paper_id, natural_key, hypothesis_code, iv_label_original, dv_label_original,
       iv_construct_id, dv_construct_id, effect_type, estimate_type, estimate, status, evidence_id, badge)
     values ($1, $2, 'S1:H1', 'H1', 'Brand Trust', 'Purchase Intention', 'brand_trust', 'purchase_intention',
       'direct', 'std_beta', 0.42, 'supported', $3, $4)`,
    [studyId, paperId, evidenceId, badge],
  );
  const { id: matrixId } = await one<{ id: string }>(
    `insert into correlation_matrices (study_id, paper_id, natural_key, source_table, diagonal_type, correlation_type, badge)
     values ($1, $2, 'S1:T2', 'Table 2', 'sqrt_ave', 'latent', $3) returning id`,
    [studyId, paperId, badge],
  );
  await client.query("insert into matrix_cells (matrix_id, i, j, r) values ($1, 1, 0, 0.48)", [matrixId]);
  await client.query("insert into matrix_descriptives (matrix_id, variable_index, variable, mean, sd) values ($1, 0, 'Brand Trust', 5.1, 1.2)", [matrixId]);
  await client.query(
    `insert into condition_cells (study_id, paper_id, natural_key, condition_label, dv_label_original, mean, sd, n, badge)
     values ($1, $2, 'S1:C:yes', 'yes', 'Skepticism', 5.12, 1.10, 106, $3)`,
    [studyId, paperId, badge],
  );
  await client.query(
    "insert into paper_theories (paper_id, natural_key, theory_name_original, theory_id, application_role, badge) values ($1, 'T:sor', 'S-O-R framework', 'stimulus_organism_response', 'hypothesis_derivation', $2)",
    [paperId, badge],
  );
  await client.query(
    "insert into paper_statements (paper_id, natural_key, kind, evidence_id, badge) values ($1, 'L:1', 'limitation', $2, $3)",
    [paperId, evidenceId, badge],
  );
  await client.query("insert into paper_tables (paper_id, table_label, pdf_page_index, kind) values ($1, 'Table 2', 2, 'correlation')", [paperId]);
  await client.query(
    "insert into pipeline_runs (paper_id, file_hash, processing_key, step, status) values ($1, 'hash-1-1', 'hash-1-1|1.0.0|1.0.1|p1', 'S1', 'done')",
    [paperId],
  );
  await client.query("insert into review_changes (paper_id, natural_key, field_name, value_before, value_after) values ($1, 'S1:H1', 'estimate', '0.41', '0.42')", [paperId]);
  await client.query("insert into user_reports (paper_id, message) values ($1, 'wrong beta')", [paperId]);
  await client.query("insert into zotero_annotations (paper_id, zotero_key, annotation_text) values ($1, 'ANN1', 'note')", [paperId]);
  return { paperId, studyId, matrixId, evidenceId };
}

const BADGE_TABLES = [
  "paper_statements",
  "paper_theories",
  "studies",
  "samples",
  "measurements",
  "path_results",
  "correlation_matrices",
  "condition_cells",
];
const PRIVATE_TABLES = ["zotero_annotations", "pipeline_runs", "review_changes", "user_reports", "extraction_runs", "api_spend", "batch_jobs"];

describe("business tables (step 1.1)", () => {
  it("creates every table of Mục 5.1", async () => {
    const res = await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
    );
    expect(res.rows.map((r) => r.table_name).sort()).toEqual(
      [
        ...BADGE_TABLES,
        ...PRIVATE_TABLES,
        "papers",
        "extracted_fields",
        "evidence",
        "paper_tables",
        "theories",
        "constructs",
        "construct_aliases",
        "matrix_cells",
        "matrix_descriptives",
        "usage_daily",
      ].sort(),
    );
  });

  it("has the view the library reads for its ✓ / ⚠ / ◇ counts, and it obeys the caller's row-level security", async () => {
    const view = await client.query<{ reloptions: string[] | null }>("select c.reloptions from pg_class c where c.relname = 'paper_badge_counts' and c.relkind = 'v'");
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]!.reloptions).toContain("security_invoker=true");
  });

  it("enables row level security on every table", async () => {
    const res = await client.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(res.rows).toEqual([]);
  });

  it("allows exactly the codebook values in every classification column", async () => {
    const columns: [string, string, readonly string[]][] = [
      ["papers", "paper_type", PAPER_TYPES],
      ["papers", "contribution_originality", ORIGINALITY],
      ["papers", "contribution_utility", UTILITY],
      ["papers", "gap_type", GAP_TYPES],
      ["evidence", "section", SECTIONS],
      ["paper_tables", "kind", TABLE_KINDS],
      ["paper_theories", "application_role", APPLICATION_ROLES],
      ["constructs", "domain", CONSTRUCT_DOMAINS],
      ["studies", "research_design", RESEARCH_DESIGNS],
      ["studies", "time_design", TIME_DESIGNS],
      ["studies", "manipulation_check", MANIPULATION_CHECKS],
      ["studies", "analysis_method", ANALYSIS_METHODS],
      ["studies", "cmb_procedural", CMB_PROCEDURAL],
      ["studies", "cmb_statistical", CMB_STATISTICAL],
      ["studies", "endogeneity_method", ENDOGENEITY_METHODS],
      ["samples", "unit_of_analysis", UNITS_OF_ANALYSIS],
      ["samples", "sample_type", SAMPLE_TYPES],
      ["samples", "market_type", MARKET_TYPES],
      ["measurements", "scale_type", SCALE_TYPES],
      ["measurements", "construct_order", CONSTRUCT_ORDERS],
      ["path_results", "effect_type", EFFECT_TYPES],
      ["path_results", "estimate_type", ESTIMATE_TYPES],
      ["path_results", "ci_method", CI_METHODS],
      ["path_results", "status", HYPOTHESIS_STATUSES],
      ["path_results", "hypothesized_direction", DIRECTIONS],
      ["path_results", "observed_sign", SIGNS],
      ["path_results", "mediation_type", MEDIATION_TYPES],
      ["path_results", "interaction_type", INTERACTION_TYPES],
      ["correlation_matrices", "diagonal_type", DIAGONAL_TYPES],
      ["correlation_matrices", "correlation_type", CORRELATION_TYPES],
      ["condition_cells", "effect_size_type", EFFECT_SIZE_TYPES],
    ];
    for (const [table, column, allowed] of columns) {
      const row = await one<{ def: string }>(
        `select pg_get_constraintdef(oid) as def from pg_constraint where conname = $1`,
        [`${table}_${column}_check`],
      );
      const values = [...row.def.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      expect({ column: `${table}.${column}`, values: values.sort() }).toEqual({
        column: `${table}.${column}`,
        values: [...allowed].sort(),
      });
    }
  });

  it("seeds the canonical theories, constructs and aliases from packages/schema", async () => {
    const theories = await client.query<{ id: string; canonical_name: string }>("select id, canonical_name from theories order by id");
    expect(theories.rows).toEqual(
      CANONICAL_THEORIES.map((t) => ({ id: t.id, canonical_name: t.canonical_name })).sort((a, b) => a.id.localeCompare(b.id)),
    );
    const constructs = await client.query<{ id: string; domain: string; parent_construct_id: string | null }>(
      "select id, domain, parent_construct_id from constructs order by id",
    );
    expect(constructs.rows).toEqual(
      CANONICAL_CONSTRUCTS.map((c) => ({ id: c.id, domain: c.domain, parent_construct_id: c.parent_id })).sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    );
    const aliases = await client.query<{ alias: string; alias_key: string; construct_id: string }>(
      "select alias, alias_key, construct_id from construct_aliases",
    );
    expect(aliases.rowCount).toBe(CANONICAL_CONSTRUCTS.reduce((n, c) => n + 1 + c.aliases.length, 0));
    for (const a of aliases.rows) expect(a.alias_key).toBe(canonicalKey(a.alias));
    // A label as an author writes it resolves to its construct in one lookup.
    const hit = await one<{ construct_id: string }>("select construct_id from construct_aliases where alias_key = $1", [canonicalKey("e-WOM")]);
    expect(hit.construct_id).toBe("ewom");
  });

  it("stores a paper with every kind of business row", async () => {
    await inRollback(async () => {
      const { paperId } = await seedPaper();
      const counts = await one<Record<string, string>>(
        `select (select count(*) from studies where paper_id = $1) as studies,
                (select count(*) from path_results where paper_id = $1) as paths,
                (select count(*) from matrix_cells c join correlation_matrices m on m.id = c.matrix_id where m.paper_id = $1) as cells`,
        [paperId],
      );
      expect(counts).toEqual({ studies: "1", paths: "1", cells: "1" });
    });
  });

  it("rejects values outside the codebook and malformed data", async () => {
    await inRollback(async () => {
      const { paperId, studyId, matrixId } = await seedPaper();
      const bad: [string, unknown[]][] = [
        ["update studies set research_design = 'interview' where id = $1", [studyId]],
        ["update studies set analysis_method = '{pls_sem,magic}' where id = $1", [studyId]],
        ["update samples set country_iso = '{Vietnam}' where study_id = $1", [studyId]],
        ["insert into matrix_cells (matrix_id, i, j, r) values ($1, 0, 1, 0.3)", [matrixId]], // upper triangle
        ["insert into matrix_cells (matrix_id, i, j, r) values ($1, 2, 0, 1.4)", [matrixId]], // |r| > 1
        ["update path_results set ci_low = 0.5, ci_high = 0.1 where paper_id = $1", [paperId]],
        ["update path_results set p_value = 3 where paper_id = $1", [paperId]],
      ];
      for (const [sql, params] of bad) {
        await client.query("savepoint s");
        await expect(client.query(sql, params), sql).rejects.toThrow(/violates check constraint/);
        await client.query("rollback to savepoint s");
      }
    });
  });

  it("enforces one row per natural key per paper", async () => {
    await inRollback(async () => {
      const { paperId, studyId } = await seedPaper();
      await expect(
        client.query(
          "insert into path_results (study_id, paper_id, natural_key, iv_label_original, dv_label_original, effect_type, status) values ($1, $2, 'S1:H1', 'a', 'b', 'direct', 'supported')",
          [studyId, paperId],
        ),
      ).rejects.toThrow(/duplicate key/);
    });
  });

  it("deletes everything of a paper with the paper", async () => {
    await inRollback(async () => {
      const { paperId, matrixId } = await seedPaper();
      await client.query("delete from papers where id = $1", [paperId]);
      for (const table of [...BADGE_TABLES, "evidence", "paper_tables", "pipeline_runs", "review_changes"]) {
        const row = await one<{ n: string }>(`select count(*) as n from ${table} where paper_id = $1`, [paperId]);
        expect({ table, n: row.n }).toEqual({ table, n: "0" });
      }
      for (const table of ["matrix_cells", "matrix_descriptives"]) {
        expect((await one<{ n: string }>(`select count(*) as n from ${table} where matrix_id = $1`, [matrixId])).n, table).toBe("0");
      }
    });
  });

  it("shows anonymous visitors visible rows and canonical lists", async () => {
    await inRollback(async () => {
      await seedPaper("auto_verified");
      await client.query("set local role anon");
      for (const table of [...BADGE_TABLES, "evidence", "paper_tables"]) {
        const row = await one<{ n: string }>(
          `select count(*) as n from ${table} t join papers p on p.id = t.paper_id where p.file_hash = 'hash-1-1'`,
        );
        expect({ table, n: row.n }).toEqual({ table, n: "1" });
      }
      expect((await one<{ n: string }>("select count(*) as n from matrix_cells x join correlation_matrices m on m.id = x.matrix_id join papers p on p.id = m.paper_id where p.file_hash = 'hash-1-1'")).n).toBe("1");
      expect(Number((await one<{ n: string }>("select count(*) as n from constructs")).n)).toBe(CANONICAL_CONSTRUCTS.length);
      expect(Number((await one<{ n: string }>("select count(*) as n from theories")).n)).toBe(CANONICAL_THEORIES.length);
    });
  });

  it("hides hidden rows, hidden evidence and private tables from anonymous visitors", async () => {
    await inRollback(async () => {
      const { evidenceId } = await seedPaper("hidden");
      await client.query("update evidence set hidden = true where id = $1", [evidenceId]);
      await client.query("set local role anon");
      for (const table of [...BADGE_TABLES, "evidence"]) {
        const row = await one<{ n: string }>(
          `select count(*) as n from ${table} t join papers p on p.id = t.paper_id where p.file_hash = 'hash-1-1'`,
        );
        expect({ table, n: row.n }).toEqual({ table, n: "0" });
      }
      expect((await one<{ n: string }>("select count(*) as n from matrix_cells x join correlation_matrices m on m.id = x.matrix_id join papers p on p.id = m.paper_id where p.file_hash = 'hash-1-1'")).n).toBe("0");
      expect((await one<{ n: string }>("select count(*) as n from matrix_descriptives x join correlation_matrices m on m.id = x.matrix_id join papers p on p.id = m.paper_id where p.file_hash = 'hash-1-1'")).n).toBe("0");
      for (const table of PRIVATE_TABLES) {
        expect({ table, n: (await one<{ n: string }>(`select count(*) as n from ${table}`)).n }).toEqual({ table, n: "0" });
      }
    });
  });

  it("blocks anonymous writes to business and canonical tables", async () => {
    for (const sql of [
      "insert into constructs (id, canonical_name, canonical_definition, definition_source, domain, origin) values ('x', 'X', 'd', 's', 'ethics', 'added')",
      "update theories set summary = 'changed'",
      "delete from construct_aliases",
      "insert into user_reports (paper_id, message) values (gen_random_uuid(), 'spam')",
    ]) {
      await inRollback(async () => {
        await client.query("set local role anon");
        const result = client.query(sql);
        // Updates and deletes without a policy match no rows; inserts are refused outright.
        if (sql.startsWith("insert")) await expect(result).rejects.toThrow(/row-level security|permission denied/);
        else expect((await result).rowCount).toBe(0);
      });
    }
  });
});
