import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hasOrder } from "./data";

describe("paged REST queries", () => {
  it("knows a query with an order from one without", () => {
    expect(hasOrder("studies?select=paper_id&order=id")).toBe(true);
    expect(hasOrder("path_results?select=id&paper_id=eq.x&order=paper_id,natural_key")).toBe(true);
    expect(hasOrder("studies?select=paper_id,research_design")).toBe(false);
    expect(hasOrder("studies?select=reorder_flag")).toBe(false);
  });

  it("every paged query in data.ts names an order (rows are otherwise lost or repeated past 1000)", () => {
    const source = readFileSync(path.join(import.meta.dirname, "data.ts"), "utf8");
    const calls = [...source.matchAll(/restAll<[^(]*?>\(\s*([`"])([\s\S]*?)\1/g)].map((m) => m[2]!);
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.filter((q) => !hasOrder(q))).toEqual([]);
  });
});
