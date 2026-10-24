/**
 * Integration tests for the usage counters (step 4.6): a visitor can add one to a closed list of counters and read nothing; only the owner reads
 * them; the table holds no personal data at all. Requires Supabase local with the migrations applied, then `pnpm test:db`.
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

async function inRollback<T>(fn: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    return await fn();
  } finally {
    await client.query("rollback");
  }
}
const asOwner = async () => {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "authenticated", app_metadata: { role: "owner" } })]);
};
const countOf = async (event: string) => Number((await client.query<{ n: number }>("select coalesce(sum(n), 0)::int as n from usage_daily where event = $1", [event])).rows[0]!.n);

describe("usage_daily holds counts and nothing about people", () => {
  it("has only a day, a kind of use and a count", async () => {
    const cols = await client.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'usage_daily' order by ordinal_position");
    expect(cols.rows.map((c) => c.column_name)).toEqual(["day", "event", "n"]);
  });
});

describe("count_event", () => {
  it("lets a visitor add one, per day and kind, with no way to read or write the table", async () => {
    await inRollback(async () => {
      await client.query("set local role anon");
      await client.query("select public.count_event('relation_search')");
      await client.query("select public.count_event('relation_search')");
      await client.query("select public.count_event('export_excel')");
      await client.query("reset role");
      expect(await countOf("relation_search")).toBe(2);
      expect(await countOf("export_excel")).toBe(1);
      expect((await client.query("select count(*) from usage_daily where event in ('relation_search', 'export_excel')")).rows[0].count).toBe("2"); // one row per kind per day
      await client.query("set local role anon");
      await client.query("savepoint s");
      await expect(client.query("select * from usage_daily")).rejects.toThrow(/permission denied/);
      await client.query("rollback to savepoint s");
      await expect(client.query("insert into usage_daily (day, event, n) values (current_date, 'relation_search', 999)")).rejects.toThrow(/permission denied/);
    });
  });

  it("refuses a kind that is not on the list, so a visitor cannot grow the table by inventing names", async () => {
    await inRollback(async () => {
      await client.query("set local role anon");
      await client.query("savepoint s");
      await expect(client.query("select public.count_event('whatever-i-like')")).rejects.toThrow(/unknown event/);
      await client.query("rollback to savepoint s");
      await expect(client.query("select public.count_event(null)")).rejects.toThrow(/unknown event/);
    });
  });
});

describe("only the owner reads the counts", () => {
  it("shows the owner the table and the report; a signed-in non-owner and a visitor get nothing or an error", async () => {
    await inRollback(async () => {
      await client.query("select public.count_event('evidence_open')");
      await asOwner();
      expect(await countOf("evidence_open")).toBeGreaterThanOrEqual(1);
      const report = (await client.query<{ r: { day: string; event: string; n: number }[] }>("select public.usage_report(7) as r")).rows[0]!.r;
      expect(report.find((r) => r.event === "evidence_open")?.n).toBeGreaterThanOrEqual(1);
      await client.query("reset role");

      await client.query("set local role authenticated");
      await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "authenticated" })]);
      expect(await countOf("evidence_open")).toBe(0);
      await client.query("savepoint s");
      await expect(client.query("select public.usage_report()")).rejects.toThrow(/owner/);
      await client.query("rollback to savepoint s");
      await client.query("reset role");

      await client.query("set local role anon");
      await expect(client.query("select public.usage_report()")).rejects.toThrow(/permission denied|owner/);
    });
  });
});
