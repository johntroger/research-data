import { EXTRACTION_SCHEMAS, type ExtractionSchemaName, toGeminiJsonSchema } from "@research-data/schema";
import { describe, expect, it } from "vitest";
import { fitsBatchSchemaLimit, schemaDepth } from "./schema-depth.js";

const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties) });
const nest = (depth: number): unknown => (depth === 0 ? { type: "string" } : obj({ x: nest(depth - 1) }));
const nestArr = (depth: number): unknown => (depth === 0 ? { type: "string" } : { type: "array", items: obj({ x: nestArr(depth - 1) }) });
const cell = obj({ row: { type: "string" }, column: { type: "string" } });
const evidence = obj({
  pdf_page: { type: "integer" },
  quote: { type: "string" },
  section: { anyOf: [{ type: "string", enum: ["a"] }, { type: "null" }] },
  table_or_figure: { anyOf: [{ type: "string" }, { type: "null" }] },
  table_cell: { anyOf: [cell, { type: "null" }] },
});

describe("schemaDepth fits what the Batch API accepted and rejected (measured 2026-10-19)", () => {
  // [name, schema, accepted by the real Batch API?]
  const measured: [string, unknown, boolean][] = [
    ["3 nested objects", nest(2), true],
    ["objects depth 3", nest(3), true], // root + 2 nested objects + a string
    ["4 nested objects", nest(4), false],
    ["5 nested objects", nest(5), false],
    ["6 nested objects", nest(6), false],
    ["array of objects", obj({ x: nestArr(1) }), true],
    ["array of arrays of objects", obj({ x: nestArr(2) }), false],
    ["evidence alone", evidence, true],
    ["evidence inside an object", obj({ e: evidence }), false],
    ["array of objects with a nullable string", obj({ tables: { type: "array", items: obj({ label: { type: "string" }, study: { anyOf: [{ type: "string" }, { type: "null" }] } }) } }), true],
    ["array of strings", obj({ codes: { type: "array", items: { type: "string" } } }), true],
    ["union of object and null", obj({ cell: { anyOf: [cell, { type: "null" }] } }), true],
  ];

  it.each(measured)("%s", (_name, schema, accepted) => {
    expect(fitsBatchSchemaLimit(schema)).toBe(accepted);
  });

  it("measures the real extraction schemas: all too deep for Batch except the flat ones", () => {
    const depths = Object.fromEntries(
      (Object.keys(EXTRACTION_SCHEMAS) as ExtractionSchemaName[]).map((name) => [name, schemaDepth(toGeminiJsonSchema(EXTRACTION_SCHEMAS[name]))]),
    );
    for (const [name, depth] of Object.entries(depths)) expect(depth, name).toBeGreaterThan(3);
  });
});
