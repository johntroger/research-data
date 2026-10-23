/**
 * Integration tests for the owner's read access (step A.3): the owner, recognised by app_metadata.role in the session token, reads every row
 * with RLS; a visitor, a signed-in non-owner and a user who only edited their own user_metadata do not. Requires Supabase local with the
 * migrations applied (`pnpm db:reset` or `supabase migration up`), then `pnpm test:db`.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type pg from "pg";
import { connect } from "./client.js";

let client: pg.Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

const PRIVATE_TABLES = ["api_spend", "batch_jobs", "extraction_runs", "pipeline_runs", "review_changes", "user_reports", "zotero_annotations"];
const ALL_TABLES = [
  "papers", "studies", "samples", "measurements", "path_results", "correlation_matrices", "matrix_cells", "matrix_descriptives", "condition_cells",
  "evidence", "extracted_fields", "paper_statements", "paper_tables", "paper_theories", "theories", "constructs", "construct_aliases", ...PRIVATE_TABLES,
];

async function inRollback<T>(fn: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    return await fn();
  } finally {
    await client.query("rollback");
  }
}

/** One paper with a visible field, a hidden field, a hidden study, a run (private) and a report (private). */
async function seed() {
  const paper = (await client.query<{ id: string }>("insert into papers (title, file_hash) values ('Owner access test', 'owner-test-hash') returning id")).rows[0]!.id;
  const run = (await client.query<{ id: string }>("insert into extraction_runs (paper_id, model_name, prompt_version, schema_version) values ($1, 'owner-test-model', 'p', 's') returning id", [paper])).rows[0]!.id;
  await client.query(
    `insert into extracted_fields (paper_id, extraction_run_id, natural_key, field_name, tier, value, badge) values
       ($1, $2, 'vis', 'vis', 'T1', '1', 'auto_verified'), ($1, $2, 'hid', 'hid', 'T1', '2', 'hidden'), ($1, $2, 'att', 'att', 'T1', '3', 'needs_attention')`,
    [paper, run],
  );
  await client.query("insert into studies (paper_id, natural_key, study_label, badge) values ($1, 's_hid', 'Hidden study', 'hidden')", [paper]);
  await client.query("insert into user_reports (paper_id, message) values ($1, 'a report')", [paper]);
  return paper;
}

const asOwner = async () => {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "authenticated", app_metadata: { role: "owner" } })]);
};
const asUser = async (claims: object = {}) => {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "authenticated", ...claims })]);
};
const count = async (sql: string, args: unknown[] = []) => Number((await client.query<{ n: string }>(sql, args)).rows[0]!.n);

describe("the owner reads every row", () => {
  it("sees hidden fields, hidden studies and the private tables with the owner's own session", async () => {
    await inRollback(async () => {
      const paper = await seed();
      await asOwner();
      expect(await count("select count(*) n from extracted_fields where paper_id = $1", [paper])).toBe(3);
      expect(await count("select count(*) n from extracted_fields where paper_id = $1 and badge = 'hidden'", [paper])).toBe(1);
      expect(await count("select count(*) n from studies where paper_id = $1", [paper])).toBe(1);
      expect(await count("select count(*) n from extraction_runs where paper_id = $1", [paper])).toBe(1);
      expect(await count("select count(*) n from user_reports where paper_id = $1", [paper])).toBe(1);
      for (const t of ALL_TABLES) await client.query(`select count(*) from ${t}`); // none is refused to the owner
    });
  });

  it("does not let the owner write through the web: there is no insert, update or delete policy", async () => {
    await inRollback(async () => {
      const paper = await seed();
      await asOwner();
      await client.query("savepoint s");
      await expect(client.query("insert into papers (title, file_hash) values ('x', 'owner-write')")).rejects.toThrow(/row-level security/);
      await client.query("rollback to savepoint s");
      expect((await client.query("update papers set title = 'hacked' where id = $1", [paper])).rowCount).toBe(0);
      expect((await client.query("delete from extracted_fields where paper_id = $1", [paper])).rowCount).toBe(0);
    });
  });
});

describe("nobody else gets the owner's view", () => {
  it("a signed-in user who is not the owner sees what a visitor sees", async () => {
    await inRollback(async () => {
      const paper = await seed();
      await asUser();
      expect(await count("select count(*) n from extracted_fields where paper_id = $1", [paper])).toBe(2);
      expect(await count("select count(*) n from extracted_fields where paper_id = $1 and badge = 'hidden'", [paper])).toBe(0);
      expect(await count("select count(*) n from studies where paper_id = $1", [paper])).toBe(0);
      for (const t of PRIVATE_TABLES) expect({ t, n: await count(`select count(*) n from ${t}`) }).toEqual({ t, n: 0 });
    });
  });

  it("a user who writes role=owner into their own user_metadata is still not the owner", async () => {
    await inRollback(async () => {
      const paper = await seed();
      await asUser({ user_metadata: { role: "owner" } });
      expect(await count("select count(*) n from extracted_fields where paper_id = $1 and badge = 'hidden'", [paper])).toBe(0);
      expect(await count("select count(*) n from extraction_runs")).toBe(0);
    });
  });

  it("a visitor (anon) sees no hidden rows and no private table", async () => {
    await inRollback(async () => {
      const paper = await seed();
      await client.query("set local role anon");
      expect(await count("select count(*) n from extracted_fields where paper_id = $1 and badge = 'hidden'", [paper])).toBe(0);
      for (const t of PRIVATE_TABLES) expect({ t, n: await count(`select count(*) n from ${t}`) }).toEqual({ t, n: 0 });
    });
  });
});

describe("quality_report", () => {
  it("answers the owner, and the developer machine once it declares itself the owner for the transaction", async () => {
    await inRollback(async () => {
      await seed();
      await asOwner();
      const owner = (await client.query<{ r: { total: { hidden: number; verified: number; fields: number; papers: number }; bySource: { name: string }[]; attention: { title: string }[] } }>("select public.quality_report('owner-test-model') as r")).rows[0]!.r;
      expect(owner.total).toMatchObject({ verified: 1, attention: 1, hidden: 1, fields: 3, papers: 1 });
      expect(owner.bySource.map((s) => s.name)).toEqual(["owner-test-model"]);
      expect(owner.attention.map((a) => a.title)).toEqual(["Owner access test"]);
    });
    await inRollback(async () => {
      await seed();
      await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ app_metadata: { role: "owner" } })]); // as a direct connection does in apps/web/lib/quality.ts
      expect((await client.query<{ r: { total: { hidden: number } } }>("select public.quality_report('owner-test-model') as r")).rows[0]!.r.total.hidden).toBe(1);
    });
  });

  it("refuses a direct connection that has not declared itself the owner", async () => {
    await inRollback(async () => {
      await seed();
      await expect(client.query("select public.quality_report()")).rejects.toThrow(/owner/);
    });
  });

  it("refuses a visitor and a signed-in user who is not the owner", async () => {
    for (const role of ["anon", "user"]) {
      await client.query("begin");
      try {
        await seed();
        if (role === "anon") await client.query("set local role anon");
        else await asUser();
        await expect(client.query("select public.quality_report()")).rejects.toThrow(/permission denied|owner/);
      } finally {
        await client.query("rollback");
      }
    }
  });
});
