/**
 * Gemini Batch API client (step 1.7, Mục 4.2): half price, results within 24 hours.
 * Wraps the SDK behind a small interface so the flow in batch.ts can be tested without the API.
 * Requests go inline (limit: 20 MB for the whole batch, docs checked 2026-10-19).
 */
import { type BatchJob, GoogleGenAI, JobState } from "@google/genai";
import type { PdfJsonRequest } from "./gemini.js";
import type { TokenUsage } from "./pricing.js";
import { fitsBatchSchemaLimit } from "./schema-depth.js";

export interface BatchItem {
  /** Identifies the request inside the batch; returned with its answer. */
  key: string;
  request: PdfJsonRequest;
}

export type BatchAnswer = { key: string; text: string; usage: TokenUsage } | { key: string; error: string };

export interface BatchStatus {
  /** Provider state, e.g. JOB_STATE_RUNNING, kept for display. */
  providerState: string;
  state: "running" | "succeeded" | "failed";
  error?: string;
  /** In request order, once succeeded. */
  answers?: BatchAnswer[];
}

export interface BatchClient {
  create(model: string, items: BatchItem[], displayName: string): Promise<{ name: string }>;
  get(name: string): Promise<BatchStatus>;
}

/** Inline batches must stay under 20 MB; base64 makes a PDF about a third larger. */
export const MAX_INLINE_BATCH_BYTES = 20 * 1024 * 1024;

export function batchBytes(items: BatchItem[]): number {
  return items.reduce((n, i) => n + Math.ceil((i.request.pdf.length * 4) / 3) + i.request.prompt.length + i.request.instructions.length, 0);
}

const FAILED_STATES = new Set<string>([JobState.JOB_STATE_FAILED, JobState.JOB_STATE_CANCELLED, JobState.JOB_STATE_EXPIRED]);

export function statusFromJob(job: BatchJob, keys: string[] = []): BatchStatus {
  const providerState = String(job.state ?? "JOB_STATE_UNSPECIFIED");
  if (FAILED_STATES.has(providerState)) {
    return { providerState, state: "failed", error: job.error?.message ?? `batch ended as ${providerState}` };
  }
  if (providerState !== JobState.JOB_STATE_SUCCEEDED) return { providerState, state: "running" };

  const responses = job.dest?.inlinedResponses ?? [];
  const answers = responses.map((r, i): BatchAnswer => {
    const key = r.metadata?.key ?? keys[i] ?? String(i);
    if (r.error) return { key, error: r.error.message ?? "request failed" };
    // The answer is a GenerateContentResponse; its text getter may be missing on a plain object.
    const text = r.response?.text ?? r.response?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const meta = r.response?.usageMetadata;
    if (!text) return { key, error: "empty answer" };
    return {
      key,
      text,
      usage: { inputTokens: meta?.promptTokenCount ?? 0, outputTokens: (meta?.candidatesTokenCount ?? 0) + (meta?.thoughtsTokenCount ?? 0) },
    };
  });
  return { providerState, state: "succeeded", answers };
}

/**
 * How one request is sent. The Batch API rejects schemas nested deeper than 3 levels (schema-depth.ts), and a
 * single rejected request fails the whole batch. A schema that is too deep is therefore written into the
 * instruction and the answer is still forced to JSON; Zod checks every answer afterwards, as for any other call.
 */
export function batchRequestConfig(request: PdfJsonRequest): Record<string, unknown> {
  const native = fitsBatchSchemaLimit(request.jsonSchema);
  return {
    systemInstruction: native
      ? request.instructions
      : `${request.instructions}

Return ONLY one JSON object that conforms to this JSON Schema (no text around it):
${JSON.stringify(request.jsonSchema)}`,
    temperature: 0,
    responseMimeType: "application/json",
    ...(native ? { responseJsonSchema: request.jsonSchema } : {}),
  };
}

export function geminiBatchClient(apiKey: string): BatchClient {
  const ai = new GoogleGenAI({ apiKey });
  /** Request keys by job, so answers can be matched when the provider omits the metadata. */
  const keysByJob = new Map<string, string[]>();
  return {
    async create(model, items, displayName) {
      if (batchBytes(items) > MAX_INLINE_BATCH_BYTES) {
        throw new Error(`Batch of ${items.length} request(s) is over the 20 MB inline limit; submit fewer papers per batch`);
      }
      const job = await ai.batches.create({
        model,
        src: items.map(({ key, request }) => ({
          contents: [
            {
              role: "user",
              parts: [{ inlineData: { mimeType: "application/pdf", data: Buffer.from(request.pdf).toString("base64") } }, { text: request.prompt }],
            },
          ],
          metadata: { key },
          config: batchRequestConfig(request),
        })),
        config: { displayName },
      });
      if (!job.name) throw new Error("Gemini created a batch without a name");
      keysByJob.set(job.name, items.map((i) => i.key));
      return { name: job.name };
    },
    async get(name) {
      return statusFromJob(await ai.batches.get({ name }), keysByJob.get(name));
    },
  };
}
