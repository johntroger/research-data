/**
 * Top-up extraction (step 1.5, Mục 6.3): when the completeness scan finds a hypothesis or a table
 * that the first pass did not extract, ask Gemini for just that item, with one small call per study.
 * It never replaces what is already extracted: only items that were missing are added, and each
 * call is recorded (and paid for) like the main ones. A hypothesis still missing afterwards stays in
 * the "missing" list for the reader.
 */
import { EXTRACTION_SCHEMAS, type ExtractionSchemaName, StudyPaths, StudyTables, toGeminiJsonSchema } from "@research-data/schema";
import type { z } from "zod";
import type { CallRecord } from "./extract-full.js";
import { FULL_INSTRUCTIONS } from "./full-prompt.js";
import type { GeneratePdfJson } from "./gemini.js";
import { callCostUsd } from "./pricing.js";
import { tableKey, type MissingItem } from "../verify/completeness.js";
import type { FullData } from "../verify/verify-full.js";

export interface TopUpResult {
  data: FullData;
  calls: CallRecord[];
  /** Items added, e.g. "H5" or "Table 2". */
  added: string[];
}

const hypothesisKey = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, "");

function pathsPrompt(study: string, codes: string[]): string {
  return (
    `Top-up for study "${study}". Extract ONLY the tested relationships of hypotheses ${codes.join(", ")} ` +
    `(one path per hypothesis test, as in the paper). If a hypothesis is not tested in "${study}", return no path for it.`
  );
}

function tablesPrompt(study: string, tables: string[]): string {
  return (
    `Top-up for study "${study}". Extract ONLY the content of ${tables.join(", ")}: the correlation matrix ` +
    `or the experimental condition cells printed in that table. Return nothing for other tables.`
  );
}

export async function topUp(
  pdf: Uint8Array,
  data: FullData,
  missing: MissingItem[],
  options: { model: string; generate: GeneratePdfJson; now?: () => number },
): Promise<TopUpResult> {
  const now = options.now ?? Date.now;
  const calls: CallRecord[] = [];
  const result: FullData = structuredClone(data);
  const added: string[] = [];

  async function ask<S extends Extract<ExtractionSchemaName, "study_paths" | "study_tables">>(
    pass: S,
    prompt: string,
    studyLabel: string,
  ): Promise<z.infer<(typeof EXTRACTION_SCHEMAS)[S]> | null> {
    const started = now();
    const { text, usage } = await options.generate({
      model: options.model,
      pdf,
      instructions: FULL_INSTRUCTIONS,
      prompt,
      jsonSchema: toGeminiJsonSchema(EXTRACTION_SCHEMAS[pass]),
    });
    calls.push({ pass, studyLabel, usage, costUsd: callCostUsd(options.model, usage), rawText: text, durationMs: now() - started });
    try {
      const parsed = EXTRACTION_SCHEMAS[pass].safeParse(JSON.parse(text));
      return parsed.success ? (parsed.data as z.infer<(typeof EXTRACTION_SCHEMAS)[S]>) : null;
    } catch {
      return null; // a top-up that does not parse is simply a miss; the item stays in the missing list
    }
  }

  // Hypotheses without a path: try each study in turn until every code is found.
  const codes = missing.filter((m) => m.kind === "hypothesis_without_path" || m.kind === "hypothesis_not_listed").map((m) => m.item);
  let wanted = new Set(codes.map(hypothesisKey));
  for (const study of result.studies) {
    if (wanted.size === 0) break;
    const answer = await ask("study_paths", pathsPrompt(study.study_label, [...codes].filter((c) => wanted.has(hypothesisKey(c)))), study.study_label);
    for (const path of (answer as z.infer<typeof StudyPaths> | null)?.paths ?? []) {
      const code = path.hypothesis_code;
      if (!code || !wanted.has(hypothesisKey(code))) continue; // only what was asked for
      study.paths.push(path);
      added.push(code);
      if (!result.structure.hypothesis_codes.some((c) => hypothesisKey(c) === hypothesisKey(code))) result.structure.hypothesis_codes.push(code);
    }
    wanted = new Set([...wanted].filter((k) => !study.paths.some((p) => p.hypothesis_code && hypothesisKey(p.hypothesis_code) === k)));
  }

  // Tables Pass 1 listed but nothing was extracted from.
  for (const item of missing.filter((m) => m.kind === "matrix_missing" || m.kind === "cells_missing")) {
    const key = tableKey(item.item);
    const targets = result.studies.filter((s) => item.studyLabel === null || s.study_label === item.studyLabel);
    for (const study of targets) {
      const answer = (await ask("study_tables", tablesPrompt(study.study_label, [item.item]), study.study_label)) as z.infer<typeof StudyTables> | null;
      if (!answer) continue;
      const matrices = answer.correlation_matrices.filter((m) => tableKey(m.source_table) === key);
      const cells = answer.condition_cells.filter((c) => c.evidence.table_or_figure && tableKey(c.evidence.table_or_figure) === key);
      study.correlation_matrices.push(...matrices);
      study.condition_cells.push(...cells);
      if (matrices.length || cells.length) {
        added.push(item.item);
        break;
      }
    }
  }

  return { data: result, calls, added };
}
