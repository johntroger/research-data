import { z } from "zod";
import { PaperDiscussion, PaperStructure } from "./paper.js";
import { BiasControl, StudyDesign, StudyDetail, StudyMeasurements, StudyPaths, StudySample, StudyTables } from "./study.js";

/**
 * Converts a Zod schema to the JSON Schema sent to Gemini (`responseJsonSchema`):
 * reused sub-schemas are inlined (no $ref / $defs) and the $schema key is dropped.
 */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { reused: "inline", unrepresentable: "throw" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export const StudyDesignSampleBias = z.object({ design: StudyDesign, sample: StudySample, bias_control: BiasControl });

/**
 * Every schema the worker sends to Gemini, by name.
 * The full StudyDetail is NOT sent: Gemini rejected it as too complex (INVALID_ARGUMENT, step 0.11,
 * 23 KB / 31 nested objects). A study is extracted in four parts and assembled with `assembleStudy`.
 */
export const EXTRACTION_SCHEMAS = {
  paper_structure: PaperStructure,
  paper_discussion: PaperDiscussion,
  study_design_sample_bias: StudyDesignSampleBias,
  study_measurements: StudyMeasurements,
  study_paths: StudyPaths,
  study_tables: StudyTables,
} as const;

export type ExtractionSchemaName = keyof typeof EXTRACTION_SCHEMAS;

/**
 * Size limits for a schema sent to Gemini. The largest schema accepted in the step 0.11 check was
 * 8.5 KB with 12 objects; the rejected one was 23 KB with 31. Keep new schemas under these limits.
 */
export const GEMINI_SCHEMA_LIMITS = { maxBytes: 10_000, maxObjects: 15 } as const;

export function schemaSize(schema: z.ZodType): { bytes: number; objects: number } {
  const text = JSON.stringify(toGeminiJsonSchema(schema));
  return { bytes: text.length, objects: (text.match(/"properties"/g) ?? []).length };
}

/** Assembles the four per-part answers for one study into a validated StudyDetail. */
export function assembleStudy(
  studyLabel: string,
  parts: {
    designSampleBias: z.infer<typeof StudyDesignSampleBias>;
    measurements: z.infer<typeof StudyMeasurements>;
    paths: z.infer<typeof StudyPaths>;
    tables: z.infer<typeof StudyTables>;
  },
): z.infer<typeof StudyDetail> {
  return StudyDetail.parse({
    study_label: studyLabel,
    ...parts.designSampleBias,
    ...parts.measurements,
    ...parts.paths,
    ...parts.tables,
  });
}
