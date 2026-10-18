/**
 * Full extraction of one paper (step 1.3, Mục 4.2): one pass with the strong model, split into small
 * structured-output calls because Gemini rejects the full study schema.
 *   Pass 1  paper_structure                       → studies, hypotheses, tables, theories
 *   Pass 1b paper_discussion
 *   Pass 2  per study: design_sample_bias, measurements, paths, tables → assembleStudy
 * A paper with one study costs 6 calls; conceptual papers and reviews (no study) cost 2.
 */
import {
  assembleStudy,
  EXTRACTION_SCHEMAS,
  type ExtractionSchemaName,
  PaperDiscussion,
  PaperStructure,
  type StudyDetail,
  toGeminiJsonSchema,
} from "@research-data/schema";
import type { z } from "zod";
import { FULL_INSTRUCTIONS, FULL_PROMPT_VERSION, PASS_PROMPTS, studyPrompt, type StudyPartName } from "./full-prompt.js";
import type { GeneratePdfJson } from "./gemini.js";
import { callCostUsd, type TokenUsage } from "./pricing.js";

export interface CallRecord {
  pass: ExtractionSchemaName;
  studyLabel: string | null;
  usage: TokenUsage;
  costUsd: number | null;
  /** Raw model output, kept for reproducibility (local only, never committed). */
  rawText: string;
  durationMs: number;
}

export interface FullExtraction {
  structure: z.infer<typeof PaperStructure>;
  discussion: z.infer<typeof PaperDiscussion>;
  studies: StudyDetail[];
  model: string;
  promptVersion: string;
  calls: CallRecord[];
  usage: TokenUsage;
  /** Sum over calls, or null when the model has no price. */
  costUsd: number | null;
}

/** A call failed; `calls` holds every call made so far (they were paid for) and the failing raw output. */
export class FullExtractionError extends Error {
  constructor(
    message: string,
    readonly pass: ExtractionSchemaName,
    readonly studyLabel: string | null,
    readonly rawText: string,
    readonly calls: CallRecord[],
  ) {
    super(message);
    this.name = "FullExtractionError";
  }
}

export interface ExtractFullOptions {
  model: string;
  generate: GeneratePdfJson;
  now?: () => number;
}

const sumUsage = (calls: CallRecord[]): TokenUsage => ({
  inputTokens: calls.reduce((n, c) => n + c.usage.inputTokens, 0),
  outputTokens: calls.reduce((n, c) => n + c.usage.outputTokens, 0),
});

export async function extractFull(pdf: Uint8Array, options: ExtractFullOptions): Promise<FullExtraction> {
  const now = options.now ?? Date.now;
  const calls: CallRecord[] = [];

  async function call<S extends ExtractionSchemaName>(
    pass: S,
    prompt: string,
    studyLabel: string | null,
  ): Promise<z.infer<(typeof EXTRACTION_SCHEMAS)[S]>> {
    const schema = EXTRACTION_SCHEMAS[pass];
    const started = now();
    const { text, usage } = await options.generate({
      model: options.model,
      pdf,
      instructions: FULL_INSTRUCTIONS,
      prompt,
      jsonSchema: toGeminiJsonSchema(schema),
    });
    calls.push({ pass, studyLabel, usage, costUsd: callCostUsd(options.model, usage), rawText: text, durationMs: now() - started });

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new FullExtractionError(`${pass}: Gemini did not return valid JSON`, pass, studyLabel, text, calls);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
      throw new FullExtractionError(`${pass}: output does not match the schema: ${issues}`, pass, studyLabel, text, calls);
    }
    return parsed.data as z.infer<(typeof EXTRACTION_SCHEMAS)[S]>;
  }

  const structure = await call("paper_structure", PASS_PROMPTS.paper_structure, null);
  const discussion = await call("paper_discussion", PASS_PROMPTS.paper_discussion, null);

  const labels = structure.studies.map((s) => s.study_label);
  const duplicates = labels.filter((l, i) => labels.indexOf(l) !== i);
  if (duplicates.length) {
    throw new FullExtractionError(`paper_structure: duplicate study labels ${duplicates.join(", ")}`, "paper_structure", null, calls[0]!.rawText, calls);
  }

  const studies: StudyDetail[] = [];
  for (const label of labels) {
    const part = <P extends StudyPartName>(name: P) => call(name, studyPrompt(name, label, labels), label);
    const designSampleBias = await part("study_design_sample_bias");
    const measurements = await part("study_measurements");
    const paths = await part("study_paths");
    const tables = await part("study_tables");
    studies.push(assembleStudy(label, { designSampleBias, measurements, paths, tables }));
  }

  const costs = calls.map((c) => c.costUsd);
  return {
    structure,
    discussion,
    studies,
    model: options.model,
    promptVersion: FULL_PROMPT_VERSION,
    calls,
    usage: sumUsage(calls),
    costUsd: costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0),
  };
}
