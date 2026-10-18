import { CODEBOOK_VERSION, SCHEMA_VERSION } from "@research-data/schema";
import { describe, expect, it } from "vitest";
import { CURRENT_VERSIONS, processingKey } from "./runs.js";

describe("processingKey", () => {
  it("combines the file hash with the schema, codebook and prompt versions (Mục 2)", () => {
    const key = processingKey("abc");
    expect(key).toBe(`abc|schema@${SCHEMA_VERSION}|codebook@${CODEBOOK_VERSION}|prompt@${CURRENT_VERSIONS.prompt}`);
  });

  it("changes when the PDF or any version changes", () => {
    const base = processingKey("abc");
    expect(processingKey("abd")).not.toBe(base);
    expect(processingKey("abc", { ...CURRENT_VERSIONS, schema: "9.9.9" })).not.toBe(base);
    expect(processingKey("abc", { ...CURRENT_VERSIONS, codebook: "9.9.9" })).not.toBe(base);
    expect(processingKey("abc", { ...CURRENT_VERSIONS, prompt: "next" })).not.toBe(base);
  });
});
