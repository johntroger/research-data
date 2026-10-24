import { describe, expect, it } from "vitest";
import { toUsageTable } from "./usage-report";

describe("toUsageTable", () => {
  const rows = [
    { day: "2026-10-23", event: "relation_search", n: 5 },
    { day: "2026-10-24", event: "relation_search", n: 7 },
    { day: "2026-10-24", event: "export_excel", n: 2 },
    { day: "2026-10-22", event: "made_up_event", n: 99 },
  ];
  it("lists the days newest first and only the kinds that were used, in the fixed order", () => {
    const t = toUsageTable(rows);
    expect(t.days).toEqual(["2026-10-24", "2026-10-23"]);
    expect(t.events).toEqual(["relation_search", "export_excel"]);
  });
  it("gives each cell, zero where nothing was counted, and the totals; unknown kinds are ignored", () => {
    const t = toUsageTable(rows);
    expect(t.cell("2026-10-24", "relation_search")).toBe(7);
    expect(t.cell("2026-10-23", "export_excel")).toBe(0);
    expect(t.totals).toEqual({ relation_search: 12, export_excel: 2 });
    expect(t.all).toBe(14);
  });
  it("copes with no data at all", () => {
    const t = toUsageTable([]);
    expect(t.days).toEqual([]);
    expect(t.all).toBe(0);
  });
});
