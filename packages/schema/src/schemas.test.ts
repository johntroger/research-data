import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXAMPLE_DISCUSSION, EXAMPLE_STRUCTURE, EXAMPLE_STUDY } from "./fixtures.js";
import {
  assembleStudy,
  EXTRACTION_SCHEMAS,
  GEMINI_SCHEMA_LIMITS,
  PaperDiscussion,
  PaperStructure,
  schemaSize,
  StudyDetail,
  toGeminiJsonSchema,
} from "./index.js";

const codebook = readFileSync(path.resolve(import.meta.dirname, "../../../docs/codebook.md"), "utf8");
const codebookFields = new Set([...codebook.matchAll(/^\| `([A-Za-z_][A-Za-z0-9_*]*)`/gm)].map((m) => m[1]));

function propertyNames(json: unknown, into = new Set<string>()): Set<string> {
  if (json && typeof json === "object") {
    const node = json as Record<string, unknown>;
    if (node.properties && typeof node.properties === "object") {
      for (const key of Object.keys(node.properties)) into.add(key);
    }
    for (const value of Object.values(node)) propertyNames(value, into);
  }
  return into;
}

describe("example extractions", () => {
  it("validate against their schemas", () => {
    expect(PaperStructure.safeParse(EXAMPLE_STRUCTURE).success).toBe(true);
    expect(PaperDiscussion.safeParse(EXAMPLE_DISCUSSION).success).toBe(true);
    expect(StudyDetail.safeParse(EXAMPLE_STUDY).success).toBe(true);
  });

  it("validate against the per-part schemas sent to Gemini", () => {
    const { design, sample, bias_control, measurements, paths, correlation_matrices, condition_cells } = EXAMPLE_STUDY;
    expect(EXTRACTION_SCHEMAS.study_design_sample_bias.safeParse({ design, sample, bias_control }).success).toBe(true);
    expect(EXTRACTION_SCHEMAS.study_measurements.safeParse({ measurements }).success).toBe(true);
    expect(EXTRACTION_SCHEMAS.study_paths.safeParse({ paths }).success).toBe(true);
    expect(EXTRACTION_SCHEMAS.study_tables.safeParse({ correlation_matrices, condition_cells }).success).toBe(true);
  });
});

describe("invalid extractions are rejected", () => {
  it("rejects page 0, unknown enum values and bad country codes", () => {
    const study = structuredClone(EXAMPLE_STUDY) as unknown as Record<string, Record<string, unknown>>;
    (study.sample!.n_evidence as { pdf_page: number }).pdf_page = 0;
    study.design!.analysis_method = ["vibes"];
    study.sample!.country_iso = ["VNM"];
    const result = StudyDetail.safeParse(study);
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["sample.n_evidence.pdf_page", "design.analysis_method.0", "sample.country_iso.0"]),
    );
  });

  it("rejects a missing required field and a non-positive sample size", () => {
    const study = structuredClone(EXAMPLE_STUDY) as unknown as Record<string, Record<string, unknown>>;
    delete study.paths;
    study.sample!.n = 0;
    const issues = StudyDetail.safeParse(study).error!.issues.map((i) => i.path.join("."));
    expect(issues).toEqual(expect.arrayContaining(["paths", "sample.n"]));
  });

  it("rejects quotes longer than 400 characters", () => {
    const structure = structuredClone(EXAMPLE_STRUCTURE);
    structure.paper_type_evidence.quote = "x".repeat(401);
    expect(PaperStructure.safeParse(structure).success).toBe(false);
  });
});

describe("Gemini JSON schemas", () => {
  for (const [name, schema] of Object.entries(EXTRACTION_SCHEMAS)) {
    it(`${name}: inlined object schema without $ref or $schema`, () => {
      const json = toGeminiJsonSchema(schema);
      const text = JSON.stringify(json);
      expect(json.type).toBe("object");
      expect(json.$schema).toBeUndefined();
      expect(text).not.toContain("$ref");
      expect(text).not.toContain("$defs");
      expect(Array.isArray(json.required)).toBe(true);
    });
  }

  for (const [name, schema] of Object.entries(EXTRACTION_SCHEMAS)) {
    it(`${name}: stays under the size Gemini accepts`, () => {
      const size = schemaSize(schema);
      expect(size.bytes).toBeLessThanOrEqual(GEMINI_SCHEMA_LIMITS.maxBytes);
      expect(size.objects).toBeLessThanOrEqual(GEMINI_SCHEMA_LIMITS.maxObjects);
    });
  }

  it("the full StudyDetail is too large to send and is not in EXTRACTION_SCHEMAS", () => {
    expect(schemaSize(StudyDetail).bytes).toBeGreaterThan(GEMINI_SCHEMA_LIMITS.maxBytes);
    expect(Object.values(EXTRACTION_SCHEMAS)).not.toContain(StudyDetail);
  });

  it("assembles the four parts back into a valid StudyDetail", () => {
    const { design, sample, bias_control, measurements, paths, correlation_matrices, condition_cells } = EXAMPLE_STUDY;
    const study = assembleStudy("Study 1", {
      designSampleBias: { design, sample, bias_control },
      measurements: { measurements },
      paths: { paths },
      tables: { correlation_matrices, condition_cells },
    });
    expect(study).toEqual(EXAMPLE_STUDY);
  });

  it("carries the codebook rules into field descriptions", () => {
    const text = JSON.stringify(toGeminiJsonSchema(EXTRACTION_SCHEMAS.paper_structure));
    expect(text).toContain("NOT the printed journal page");
    expect(text).toContain("Never join fragments");
  });
});

describe("schema ↔ codebook", () => {
  it("every field sent to Gemini has a definition row in docs/codebook.md", () => {
    const names = new Set<string>();
    for (const schema of Object.values(EXTRACTION_SCHEMAS)) propertyNames(toGeminiJsonSchema(schema), names);
    const missing = [...names].filter((n) => !codebookFields.has(n)).sort();
    expect(missing).toEqual([]);
  });
});
