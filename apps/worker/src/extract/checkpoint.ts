/**
 * Paid answers are never lost (step 1.9). Every answer from Gemini is appended to a file the moment
 * it arrives: before it is checked, before the cost is booked. If the run stops half-way (a crash,
 * a lost database connection, Docker going down: seen in the first real run, which lost 10 paid
 * calls, $1.49), running again replays the saved answers instead of asking and paying again.
 *
 * Layers, from outside in:  replaying → guarded (budget, rate limit, retries) → persisting → Gemini.
 * A replayed answer skips the guard, so it is not booked a second time.
 * The key covers the model, instructions, prompt and schema: a changed prompt asks again.
 * To ask the model again on purpose, delete the file (extracted_data/<hash>.calls.jsonl).
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { GeneratePdfJson, PdfJsonRequest, PdfJsonResponse } from "./gemini.js";

export const requestKey = (r: PdfJsonRequest): string =>
  createHash("sha256").update(JSON.stringify([r.model, r.instructions, r.prompt, r.jsonSchema])).digest("hex");

export class CheckpointStore {
  private constructor(
    readonly file: string,
    private readonly answers: Map<string, PdfJsonResponse>,
  ) {}

  static async open(file: string): Promise<CheckpointStore> {
    const answers = new Map<string, PdfJsonResponse>();
    if (existsSync(file)) {
      for (const line of (await readFile(file, "utf8")).split("\n")) {
        if (!line.trim()) continue;
        try {
          const { key, text, usage } = JSON.parse(line) as { key: string; text: string; usage: PdfJsonResponse["usage"] };
          answers.set(key, { text, usage });
        } catch {
          // A line cut short by a crash is simply not an answer: that call is asked again.
        }
      }
    }
    return new CheckpointStore(file, answers);
  }

  get size(): number {
    return this.answers.size;
  }

  get(request: PdfJsonRequest): PdfJsonResponse | undefined {
    return this.answers.get(requestKey(request));
  }

  async append(request: PdfJsonRequest, response: PdfJsonResponse): Promise<void> {
    const key = requestKey(request);
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, `${JSON.stringify({ key, text: response.text, usage: response.usage })}\n`);
    this.answers.set(key, response);
  }
}

/** Writes each answer to the file right after Gemini returns it. */
export function persisting(generate: GeneratePdfJson, store: CheckpointStore): GeneratePdfJson {
  return async (request) => {
    const response = await generate(request);
    await store.append(request, response);
    return response;
  };
}

/** Answers from the file when the same request was already paid for. */
export function replaying(generate: GeneratePdfJson, store: CheckpointStore, onReplay?: () => void): GeneratePdfJson {
  return async (request) => {
    const saved = store.get(request);
    if (saved) {
      onReplay?.();
      return saved;
    }
    return generate(request);
  };
}
