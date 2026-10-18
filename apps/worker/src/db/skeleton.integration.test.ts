/**
 * Integration tests for the skeleton migration (step 0.3).
 * Requires Supabase local to be running: `pnpm db:start`, then `pnpm test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const client = new pg.Client({ connectionString: DB_URL });

beforeAll(async () => {
  await client.connect();
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

async function seedPaperWithFields(): Promise<string> {
  const paper = await client.query<{ id: string }>(
    "insert into papers (doi, title, file_hash) values ($1, $2, $3) returning id",
    ["10.0000/test", "Test paper", "hash-test"],
  );
  const paperId = paper.rows[0]!.id;
  await client.query(
    `insert into extracted_fields (paper_id, natural_key, field_name, tier, value, badge)
     values ($1, 'S1:n', 'sample_size', 'T1', '412', 'auto_verified'),
            ($1, 'S1:H2:beta', 'estimate', 'T1', '-0.31', 'hidden')`,
    [paperId],
  );
  await client.query(
    "insert into extraction_runs (paper_id, model_name, prompt_version, schema_version) values ($1, 'test-model', 'p0', 's0')",
    [paperId],
  );
  return paperId;
}

describe("skeleton migration", () => {
  it("creates the three skeleton tables", async () => {
    const res = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    );
    expect(res.rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining(["papers", "extraction_runs", "extracted_fields"]),
    );
  });

  it("enforces one row per natural key per paper", async () => {
    await inRollback(async () => {
      const paperId = await seedPaperWithFields();
      await expect(
        client.query(
          "insert into extracted_fields (paper_id, natural_key, field_name, tier, value) values ($1, 'S1:n', 'sample_size', 'T1', '1')",
          [paperId],
        ),
      ).rejects.toThrow(/duplicate key/);
    });
  });

  it("lets anonymous visitors read visible fields but not hidden ones", async () => {
    await inRollback(async () => {
      await seedPaperWithFields();
      await client.query("set local role anon");
      // Only look at this test's paper: the database may also hold real data.
      const res = await client.query<{ natural_key: string }>(
        `select f.natural_key from extracted_fields f join papers p on p.id = f.paper_id
         where p.file_hash = 'hash-test' order by f.natural_key`,
      );
      expect(res.rows.map((r) => r.natural_key)).toEqual(["S1:n"]);
    });
  });

  it("hides extraction runs (raw responses, cost) from anonymous visitors", async () => {
    await inRollback(async () => {
      await seedPaperWithFields();
      await client.query("set local role anon");
      // Anonymous visitors see no extraction runs at all, real or test.
      const res = await client.query("select * from extraction_runs");
      expect(res.rowCount).toBe(0);
    });
  });

  it("blocks anonymous writes", async () => {
    await inRollback(async () => {
      await client.query("set local role anon");
      await expect(
        client.query("insert into papers (file_hash) values ('anon-write')"),
      ).rejects.toThrow(/row-level security|permission denied/);
    });
  });
});
