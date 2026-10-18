import type { GeneratePdfJson } from "./gemini.js";
import { callCostUsd, type TokenUsage } from "./pricing.js";
import {
  SKELETON_INSTRUCTIONS,
  SKELETON_PROMPT_VERSION,
  SkeletonExtraction,
  skeletonJsonSchema,
} from "./skeleton-schema.js";

export interface SkeletonResult {
  data: SkeletonExtraction;
  model: string;
  promptVersion: string;
  usage: TokenUsage;
  /** USD, or null when the model has no entry in the price table. */
  costUsd: number | null;
  /** Raw model output, kept for reproducibility (stored in extraction_runs.raw_response). */
  rawText: string;
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly rawText: string,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

const PROMPT = "Extract the fields defined by the response schema from the attached paper.";

export async function extractSkeleton(
  pdf: Uint8Array,
  options: { model: string; generate: GeneratePdfJson },
): Promise<SkeletonResult> {
  const { text, usage } = await options.generate({
    model: options.model,
    pdf,
    instructions: SKELETON_INSTRUCTIONS,
    prompt: PROMPT,
    jsonSchema: skeletonJsonSchema(),
  });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ExtractionError("Gemini did not return valid JSON", text);
  }

  const parsed = SkeletonExtraction.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new ExtractionError(`Gemini output does not match the schema: ${issues}`, text);
  }

  return {
    data: parsed.data,
    model: options.model,
    promptVersion: SKELETON_PROMPT_VERSION,
    usage,
    costUsd: callCostUsd(options.model, usage),
    rawText: text,
  };
}
