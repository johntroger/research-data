import { describe, expect, it } from "vitest";
import type { BatchItem } from "./batch-client.js";
import { chunkByStudy } from "./chunking.js";

const items = (studies: number, pdfBytes: number): BatchItem[] =>
  Array.from({ length: studies }, (_, i) => ["a", "b", "c", "d"].map((p) => ({ key: `${i}:${p}`, request: { model: "m", pdf: new Uint8Array(pdfBytes), instructions: "", prompt: "", jsonSchema: {} } }))).flat();

describe("chunkByStudy", () => {
  it("keeps everything in one chunk when it fits", () => {
    expect(chunkByStudy(items(3, 100), 10_000_000)).toHaveLength(1);
  });

  it("splits between Studies, never inside one, and keeps the order", () => {
    // One Study = 4 requests of about 1334 bytes; the limit holds two Studies.
    const chunks = chunkByStudy(items(5, 1000), 2 * 4 * 1334 + 100);
    expect(chunks.map((c) => c.length)).toEqual([8, 8, 4]);
    expect(chunks.flat().map((i) => i.key)).toEqual(items(5, 1000).map((i) => i.key));
    for (const c of chunks) expect(new Set(c.map((i) => i.key.split(":")[0])).size * 4).toBe(c.length);
  });

  it("refuses a single Study that is over the limit on its own", () => {
    expect(() => chunkByStudy(items(1, 5000), 1000)).toThrow(/One study alone/);
  });
});
