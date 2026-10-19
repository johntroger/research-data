/**
 * The label index built from the seeded database agrees with the one built from the canonical lists,
 * and an alias the owner adds takes effect (step 1.6). Requires Supabase local: `pnpm db:reset`.
 */
import { CANONICAL_CONSTRUCTS, CANONICAL_THEORIES, canonicalKey } from "@research-data/schema";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import { canonicalIndexes } from "./extraction.js";
import { loadConstructIndex, loadTheoryIndex } from "./db.js";
import { collidingKeys, mapLabel } from "./labels.js";

let db: pg.Client;
beforeAll(async () => (db = await connect()));
afterAll(async () => db.end());

describe("label index from the database", () => {
  it("maps every canonical name and alias exactly like the in-memory index", async () => {
    const fromDb = await loadConstructIndex(db);
    const inMemory = canonicalIndexes().constructs;
    expect(collidingKeys(fromDb)).toEqual([]);
    for (const c of CANONICAL_CONSTRUCTS) {
      for (const name of [c.canonical_name, ...c.aliases, `${c.canonical_name}s`, "Green " + c.canonical_name]) {
        const a = mapLabel(name, fromDb);
        const b = mapLabel(name, inMemory);
        expect({ name, status: a.status, id: a.id }).toEqual({ name, status: b.status, id: b.id });
      }
    }
    const theories = await loadTheoryIndex(db);
    for (const t of CANONICAL_THEORIES) expect(mapLabel(t.canonical_name, theories)).toMatchObject({ status: "mapped", id: t.id });
  });

  it("uses an alias added to construct_aliases (by the owner) at the next mapping", async () => {
    await db.query("begin");
    try {
      expect(mapLabel("Brand credibility", await loadConstructIndex(db)).status).toBe("separate");
      await db.query(
        `insert into construct_aliases (alias, alias_key, construct_id, mapping_method, mapping_confidence, mapping_reviewed)
         values ('Brand credibility', $1, 'brand_trust', 'human', 1, true)`,
        [canonicalKey("Brand credibility")],
      );
      expect(mapLabel("Brand credibility", await loadConstructIndex(db))).toMatchObject({ status: "mapped", id: "brand_trust" });
    } finally {
      await db.query("rollback");
    }
  });
});
