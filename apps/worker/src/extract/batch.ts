/**
 * Asynchronous extraction through the Gemini Batch API (step 1.7, Mục 4.2): submit → poll → ingest.
 * Half the price of synchronous calls, results within 24 hours. The state lives in `batch_jobs`, so
 * a run can stop and start again at any time without losing or repeating paid work.
 *
 * One paper takes two batches, because the per-study calls need the study labels of Pass 1:
 *   phase "structure"    paper_structure + paper_discussion
 *   phase "study_parts"  4 calls for every study found in the first phase
 * The finished extraction is saved in the same shape as the synchronous one (extract-full.ts).
 */
import { assembleStudy, EXTRACTION_SCHEMAS, type ExtractionSchemaName, toGeminiJsonSchema } from "@research-data/schema";
import path from "node:path";
import type pg from "pg";
import type { BatchAnswer, BatchClient, BatchItem } from "./batch-client.js";
import type { Budget } from "./budget.js";
import { chunkByStudy } from "./chunking.js";
import { estimatePaper } from "./estimate.js";
import type { CallRecord } from "./extract-full.js";
import { FULL_INSTRUCTIONS, FULL_PROMPT_VERSION, PASS_PROMPTS, studyPrompt } from "./full-prompt.js";
import { pdfPageCount } from "./guarded.js";
import { parseAnswer } from "./parse.js";
import { callCostUsd } from "./pricing.js";
import { STUDY_PASSES } from "./estimate.js";

export interface BatchDeps {
  db: pg.Client;
  client: BatchClient;
  budget: Budget;
  model: string;
  loadPdf: (pdfPath: string) => Promise<Uint8Array>;
  /** Stores a finished extraction. `compare` results must go to a separate place and never replace the real one. */
  /** Size limit of one study_parts job; the default keeps it under the provider's inline limit. */
  chunkBytes?: number;
  /** Look only at jobs of these papers (file hashes); every unfinished job when absent. */
  onlyFiles?: string[];
  saveResult: (fileHash: string, result: Record<string, unknown>, purpose: Purpose) => Promise<void>;
  log?: (line: string) => void;
  now?: () => Date;
}

type Phase = "structure" | "study_parts";

/** `extract`: the real extraction. `compare`: run only to compare with a synchronous result (step 1.9c). */
export type Purpose = "extract" | "compare";

interface JobRow {
  id: string;
  job_name: string;
  phase: Phase;
  file_hash: string;
  pdf_path: string;
  purpose: Purpose;
  state: "submitted" | "succeeded" | "failed" | "ingested";
  payload: Payload;
}

interface Payload {
  /** USD set aside for this job while it runs (booked at its real cost once it is ingested). */
  reserved_usd?: number;
  /** Study labels, for the study_parts phase. */
  labels?: string[];
  /** Validated answers by request key. */
  answers?: Record<string, unknown>;
  calls?: CallRecord[];
  failed_raw?: Record<string, string>;
}

export type BatchEvent =
  | { fileHash: string; phase: Phase; event: "running"; detail: string }
  | { fileHash: string; phase: Phase; event: "failed"; detail: string }
  | { fileHash: string; phase: Phase; event: "next_phase_submitted"; detail: string }
  | { fileHash: string; phase: Phase; event: "waiting_for_budget"; detail: string }
  | { fileHash: string; phase: Phase; event: "done"; detail: string };

export type SubmitResult =
  | { status: "submitted"; jobName: string; estimatedUsd: number | null }
  | { status: "already_submitted"; jobName: string; state: string };

const log = (deps: BatchDeps, line: string) => deps.log?.(line);
const now = (deps: BatchDeps) => deps.now?.() ?? new Date();

function item(model: string, pdf: Uint8Array, pass: ExtractionSchemaName, prompt: string, key: string): BatchItem {
  return { key, request: { model, pdf, instructions: FULL_INSTRUCTIONS, prompt, jsonSchema: toGeminiJsonSchema(EXTRACTION_SCHEMAS[pass]) } };
}

/** USD already set aside for jobs still running. */
async function reservedUsd(deps: BatchDeps): Promise<number> {
  const res = await deps.db.query<{ total: string }>(
    "select coalesce(sum((payload->>'reserved_usd')::numeric), 0) as total from batch_jobs where state = 'submitted' and ($1::text[] is null or file_hash = any($1))",
    [deps.onlyFiles ?? null],
  );
  return Number(res.rows[0]!.total);
}

async function insertJob(deps: BatchDeps, job: { name: string; phase: Phase; fileHash: string; pdfPath: string; keys: string[]; payload: Payload; purpose: Purpose; chunk?: number }) {
  await deps.db.query(
    `insert into batch_jobs (job_name, model, phase, file_hash, pdf_path, request_keys, payload, purpose, chunk)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [job.name, deps.model, job.phase, job.fileHash, job.pdfPath, job.keys, JSON.stringify(job.payload), job.purpose, job.chunk ?? 0],
  );
}

/** Submits the first batch of a paper (Pass 1 and 1b). Does nothing when the paper is already in a batch. */
export async function submitPaper(deps: BatchDeps, paper: { fileHash: string; pdfPath: string; purpose?: Purpose }): Promise<SubmitResult> {
  const purpose = paper.purpose ?? "extract";
  const existing = await deps.db.query<{ job_name: string; state: string }>(
    "select job_name, state from batch_jobs where file_hash = $1 and phase = 'structure' and purpose = $2 and state in ('submitted', 'succeeded', 'ingested')",
    [paper.fileHash, purpose],
  );
  if (existing.rows[0]) return { status: "already_submitted", jobName: existing.rows[0].job_name, state: existing.rows[0].state };

  const pdf = await deps.loadPdf(paper.pdfPath);
  const pages = await pdfPageCount(pdf);
  // Set aside the cost of the whole paper (one study assumed), so papers submitted together cannot pass the cap.
  const estimate = estimatePaper(deps.model, pages, 1, { batch: true, at: now(deps) });
  const needed = estimate.costUsd;
  if (needed === null) throw new Error(`No price known for model "${deps.model}": add it to extract/pricing.ts before using it`);
  await deps.budget.assertCanSpend(needed + (await reservedUsd(deps)));

  const items = [
    item(deps.model, pdf, "paper_structure", PASS_PROMPTS.paper_structure, "paper_structure"),
    item(deps.model, pdf, "paper_discussion", PASS_PROMPTS.paper_discussion, "paper_discussion"),
  ];
  const { name } = await deps.client.create(deps.model, items, `rd-structure-${paper.fileHash.slice(0, 12)}`);
  await insertJob(deps, { name, phase: "structure", fileHash: paper.fileHash, pdfPath: paper.pdfPath, keys: items.map((i) => i.key), payload: { reserved_usd: needed }, purpose });
  log(deps, `submitted ${name} (structure) for ${paper.fileHash.slice(0, 12)}, about $${needed.toFixed(3)} at Batch price`);
  return { status: "submitted", jobName: name, estimatedUsd: needed };
}

/** Looks at every unfinished job once: asks the provider, ingests finished ones, submits the next phase. */
export async function pollOnce(deps: BatchDeps): Promise<BatchEvent[]> {
  const events: BatchEvent[] = [];
  const jobs = await deps.db.query<JobRow>("select id, job_name, phase, file_hash, pdf_path, purpose, state, payload from batch_jobs where state in ('submitted', 'succeeded') and ($1::text[] is null or file_hash = any($1)) order by submitted_at", [deps.onlyFiles ?? null]);

  for (const job of jobs.rows) {
    if (job.state === "submitted") {
      const status = await deps.client.get(job.job_name);
      await deps.db.query("update batch_jobs set gemini_state = $2, updated_at = now() where id = $1", [job.id, status.providerState]);
      if (status.state === "running") {
        events.push({ fileHash: job.file_hash, phase: job.phase, event: "running", detail: status.providerState });
        continue;
      }
      if (status.state === "failed") {
        await deps.db.query("update batch_jobs set state = 'failed', error = $2, finished_at = now(), updated_at = now() where id = $1", [job.id, status.error ?? status.providerState]);
        events.push({ fileHash: job.file_hash, phase: job.phase, event: "failed", detail: status.error ?? status.providerState });
        continue;
      }
      const ingested = await ingestAnswers(deps, job, status.answers ?? []);
      if (!ingested.ok) {
        events.push({ fileHash: job.file_hash, phase: job.phase, event: "failed", detail: ingested.error });
        continue;
      }
    }
    events.push(...(await continuePaper(deps, job)));
  }
  return events;
}

/** Books the cost of every answer, validates them, and stores the result in the job (one transaction). */
async function ingestAnswers(deps: BatchDeps, job: JobRow, answers: BatchAnswer[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const calls: CallRecord[] = [];
  const data: Record<string, unknown> = {};
  const failedRaw: Record<string, string> = {};
  const problems: string[] = [];

  for (const answer of answers) {
    const pass = answer.key.includes(":") ? (answer.key.split(":")[1] as ExtractionSchemaName) : (answer.key as ExtractionSchemaName);
    const studyIndex = answer.key.includes(":") ? Number(answer.key.split(":")[0]) : null;
    if ("error" in answer) {
      problems.push(`${answer.key}: ${answer.error}`);
      continue;
    }
    const costUsd = callCostUsd(deps.model, answer.usage, now(deps), { batch: true });
    const record: CallRecord = { pass, studyLabel: studyIndex === null ? null : (job.payload.labels?.[studyIndex] ?? null), usage: answer.usage, costUsd, rawText: answer.text, durationMs: 0 };
    calls.push(record);
    const parsed = parseAnswer(pass, answer.text);
    if (!parsed.ok) {
      problems.push(parsed.error);
      failedRaw[answer.key] = answer.text;
    } else {
      data[answer.key] = parsed.data;
      if (parsed.shortened.length > 0) record.shortenedQuotes = parsed.shortened;
    }
  }
  if (answers.length === 0) problems.push("the batch returned no answers");

  await deps.db.query("begin");
  try {
    for (const c of calls) {
      await deps.budget.record({
        model: deps.model,
        pass: c.pass,
        fileHash: job.file_hash,
        inputTokens: c.usage.inputTokens,
        outputTokens: c.usage.outputTokens,
        costUsd: c.costUsd ?? 0,
        batch: true,
        batchJobId: job.id,
      });
    }
    const cost = calls.reduce((n, c) => n + (c.costUsd ?? 0), 0);
    const payload: Payload = { ...job.payload, reserved_usd: 0, answers: data, calls, ...(Object.keys(failedRaw).length ? { failed_raw: failedRaw } : {}) };
    await deps.db.query(
      `update batch_jobs set state = $2, error = $3, payload = $4, cost_usd = $5, finished_at = now(), updated_at = now() where id = $1`,
      [job.id, problems.length ? "failed" : "succeeded", problems.length ? problems.join("; ").slice(0, 2000) : null, JSON.stringify(payload), cost],
    );
    await deps.db.query("commit");
    job.payload = payload;
    job.state = problems.length ? "failed" : "succeeded";
  } catch (error) {
    await deps.db.query("rollback");
    throw error;
  }
  return problems.length ? { ok: false, error: problems.join("; ") } : { ok: true };
}

/** After a phase succeeded: submit the study calls, or assemble and save the finished extraction. */
async function continuePaper(deps: BatchDeps, job: JobRow): Promise<BatchEvent[]> {
  const base = { fileHash: job.file_hash, phase: job.phase };

  if (job.phase === "structure") {
    const structure = (job.payload.answers?.paper_structure ?? null) as ReturnType<typeof EXTRACTION_SCHEMAS.paper_structure.parse> | null;
    if (!structure) return [{ ...base, event: "failed", detail: "no structure answer stored" }];
    const labels = structure.studies.map((s) => s.study_label);
    const duplicated = labels.filter((l, i) => labels.indexOf(l) !== i);
    if (duplicated.length) {
      await deps.db.query("update batch_jobs set state = 'failed', error = $2, updated_at = now() where id = $1", [job.id, `duplicate study labels ${duplicated.join(", ")}`]);
      return [{ ...base, event: "failed", detail: `duplicate study labels ${duplicated.join(", ")}` }];
    }
    if (labels.length === 0) return [await finish(deps, job, job, [])]; // conceptual paper or review: nothing more to ask

    const pdf = await deps.loadPdf(job.pdf_path);
    const pages = await pdfPageCount(pdf);
    const estimate = estimatePaper(deps.model, pages, labels.length, { batch: true, at: now(deps) });
    const needed = estimate.calls.slice(2).reduce((n, c) => n + (c.costUsd ?? 0), 0);
    try {
      await deps.budget.assertCanSpend(needed + (await reservedUsd(deps)));
    } catch (error) {
      // The first phase is paid and safe in the database; the next one waits until there is room again.
      return [{ ...base, event: "waiting_for_budget", detail: (error as Error).message }];
    }
    const items = labels.flatMap((label, i) => STUDY_PASSES.map((pass) => item(deps.model, pdf, pass, studyPrompt(pass as never, label, labels), `${i}:${pass}`)));
    // A paper with many Studies does not fit in one inline batch: one job per group of Studies.
    const chunks = chunkByStudy(items, deps.chunkBytes);
    for (const [c, chunk] of chunks.entries()) {
      const { name } = await deps.client.create(deps.model, chunk, `rd-studies-${job.file_hash.slice(0, 12)}-${c}`);
      await insertJob(deps, { name, phase: "study_parts", fileHash: job.file_hash, pdfPath: job.pdf_path, keys: chunk.map((i) => i.key), payload: { reserved_usd: (needed * chunk.length) / items.length, labels }, purpose: job.purpose, chunk: c });
      log(deps, `submitted ${name} (study_parts ${c + 1}/${chunks.length}) for ${job.file_hash.slice(0, 12)}`);
    }
    await deps.db.query("update batch_jobs set state = 'ingested', updated_at = now() where id = $1", [job.id]);
    return [{ ...base, event: "next_phase_submitted", detail: `${labels.length} study(ies), ${items.length} requests in ${chunks.length} batch(es)` }];
  }

  // study_parts: wait for every chunk of the paper, then pair them with the structure job and assemble.
  const mine = await deps.db.query<{ state: string }>("select state from batch_jobs where id = $1", [job.id]);
  if (mine.rows[0]?.state !== "succeeded") return []; // already assembled by an earlier job of this poll
  const chunks = await deps.db.query<JobRow>(
    "select id, job_name, phase, file_hash, pdf_path, purpose, state, payload from batch_jobs where file_hash = $1 and phase = 'study_parts' and purpose = $2 and state in ('submitted', 'succeeded') order by chunk",
    [job.file_hash, job.purpose],
  );
  if (chunks.rows.some((c) => c.state === "submitted")) return [{ ...base, event: "running", detail: "waiting for the other batches of this paper" }];
  job = {
    ...job,
    payload: {
      ...job.payload,
      answers: Object.assign({}, ...chunks.rows.map((c) => c.payload.answers ?? {})),
      calls: chunks.rows.flatMap((c) => c.payload.calls ?? []),
    },
  };
  const first = await deps.db.query<JobRow>(
    "select id, job_name, phase, file_hash, pdf_path, purpose, state, payload from batch_jobs where file_hash = $1 and phase = 'structure' and purpose = $2 and state in ('ingested', 'succeeded') limit 1",
    [job.file_hash, job.purpose],
  );
  if (!first.rows[0]) return [{ ...base, event: "failed", detail: "the structure job of this paper is missing" }];
  const labels = job.payload.labels ?? [];
  try {
    const studies = labels.map((label, i) => {
      const answer = (pass: string) => job.payload.answers?.[`${i}:${pass}`];
      return assembleStudy(label, {
        designSampleBias: answer("study_design_sample_bias") as never,
        measurements: answer("study_measurements") as never,
        paths: answer("study_paths") as never,
        tables: answer("study_tables") as never,
      });
    });
    const event = await finish(deps, first.rows[0], job, studies);
    await deps.db.query("update batch_jobs set state = 'ingested', updated_at = now() where id = any($1)", [chunks.rows.map((c) => c.id)]);
    return [event];
  } catch (error) {
    const message = `could not assemble the studies: ${(error as Error).message}`;
    await deps.db.query("update batch_jobs set state = 'failed', error = $2, updated_at = now() where id = $1", [job.id, message.slice(0, 2000)]);
    return [{ ...base, event: "failed", detail: message }];
  }
}

async function finish(deps: BatchDeps, structureJob: JobRow, last: JobRow, studies: unknown[]): Promise<BatchEvent> {
  const calls = [...(structureJob.payload.calls ?? []), ...(last.id === structureJob.id ? [] : (last.payload.calls ?? []))];
  const costs = calls.map((c) => c.costUsd);
  const result = {
    file: path.basename(structureJob.pdf_path),
    file_hash: structureJob.file_hash,
    model: deps.model,
    prompt_version: FULL_PROMPT_VERSION,
    batch: true,
    status: "done",
    structure: structureJob.payload.answers?.paper_structure,
    discussion: structureJob.payload.answers?.paper_discussion,
    studies,
    calls,
    usage: { inputTokens: calls.reduce((n, c) => n + c.usage.inputTokens, 0), outputTokens: calls.reduce((n, c) => n + c.usage.outputTokens, 0) },
    costUsd: costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0),
  };
  await deps.saveResult(structureJob.file_hash, result, structureJob.purpose);
  await deps.db.query("update batch_jobs set state = 'ingested', updated_at = now() where id = any($1)", [[structureJob.id, last.id]]);
  return { fileHash: structureJob.file_hash, phase: last.phase, event: "done", detail: `${studies.length} study(ies), $${(result.costUsd ?? 0).toFixed(4)} at Batch price` };
}

export interface BatchRow {
  job_name: string;
  phase: string;
  file_hash: string;
  purpose: string;
  state: string;
  gemini_state: string | null;
  cost_usd: string | null;
  error: string | null;
  submitted_at: Date;
}

export async function listBatches(db: pg.Client): Promise<BatchRow[]> {
  const res = await db.query<BatchRow>(
    "select job_name, phase, file_hash, purpose, state, gemini_state, cost_usd, error, submitted_at from batch_jobs order by submitted_at desc",
  );
  return res.rows;
}
