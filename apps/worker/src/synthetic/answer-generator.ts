/**
 * A fake Gemini that answers every extraction call with the answer key of a synthetic paper
 * (step 1.3). It recognises the pass from the JSON schema it is sent and the study from the prompt,
 * so the whole extraction flow runs offline and its result can be compared with the key.
 */
import { EXTRACTION_SCHEMAS, type ExtractionSchemaName, toGeminiJsonSchema } from "@research-data/schema";
import type { GeneratePdfJson, PdfJsonRequest } from "../extract/gemini.js";
import type { SyntheticPaper } from "./papers.js";

const SCHEMA_BY_JSON = new Map(
  (Object.keys(EXTRACTION_SCHEMAS) as ExtractionSchemaName[]).map((name) => [JSON.stringify(toGeminiJsonSchema(EXTRACTION_SCHEMAS[name])), name]),
);

export function passOf(request: PdfJsonRequest): ExtractionSchemaName {
  const name = SCHEMA_BY_JSON.get(JSON.stringify(request.jsonSchema));
  if (!name) throw new Error("fake generator: unknown schema");
  return name;
}

/** Answers from the key; `tamper` can change the answer of one pass to simulate a bad model reply. */
export function answerKeyGenerator(
  paper: SyntheticPaper,
  options: { tamper?: (pass: ExtractionSchemaName, answer: unknown) => string | null } = {},
): { generate: GeneratePdfJson; requests: PdfJsonRequest[] } {
  const requests: PdfJsonRequest[] = [];
  const generate: GeneratePdfJson = async (request) => {
    requests.push(request);
    const pass = passOf(request);
    const label = /study labelled "([^"]+)"/.exec(request.prompt)?.[1];
    const study = paper.answer.studies.find((s) => s.study_label === label);
    if (pass.startsWith("study_") && !study) throw new Error(`fake generator: no study "${label}"`);

    const answer = {
      paper_structure: () => paper.answer.structure,
      paper_discussion: () => paper.answer.discussion,
      study_design_sample_bias: () => ({ design: study!.design, sample: study!.sample, bias_control: study!.bias_control }),
      study_measurements: () => ({ measurements: study!.measurements }),
      study_paths: () => ({ paths: study!.paths }),
      study_tables: () => ({ correlation_matrices: study!.correlation_matrices, condition_cells: study!.condition_cells }),
    }[pass]();

    const text = options.tamper?.(pass, answer) ?? JSON.stringify(answer);
    // Token counts in the range of a real call on a short paper.
    return { text, usage: { inputTokens: 3000, outputTokens: Math.ceil(text.length / 4) } };
  };
  return { generate, requests };
}
