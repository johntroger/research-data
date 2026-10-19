import type { BatchJob } from "@google/genai";
import { describe, expect, it } from "vitest";
import { EXTRACTION_SCHEMAS, toGeminiJsonSchema } from "@research-data/schema";
import { batchRequestConfig, statusFromJob } from "./batch-client.js";

const job = (fields: Record<string, unknown>) => fields as unknown as BatchJob;

describe("statusFromJob", () => {
  it("reports queued, pending and running jobs as running", () => {
    for (const state of ["JOB_STATE_QUEUED", "JOB_STATE_PENDING", "JOB_STATE_RUNNING", "JOB_STATE_UNSPECIFIED"]) {
      expect(statusFromJob(job({ state }))).toEqual({ providerState: state, state: "running" });
    }
  });

  it("reports failed, cancelled and expired jobs as failed, with the reason", () => {
    expect(statusFromJob(job({ state: "JOB_STATE_FAILED", error: { message: "quota exceeded" } }))).toEqual({
      providerState: "JOB_STATE_FAILED",
      state: "failed",
      error: "quota exceeded",
    });
    expect(statusFromJob(job({ state: "JOB_STATE_EXPIRED" }))).toMatchObject({ state: "failed", error: "batch ended as JOB_STATE_EXPIRED" });
    expect(statusFromJob(job({ state: "JOB_STATE_CANCELLED" })).state).toBe("failed");
  });

  it("reads answers with text and token counts (thinking tokens count as output), matched by the key sent", () => {
    const status = statusFromJob(
      job({
        state: "JOB_STATE_SUCCEEDED",
        dest: {
          inlinedResponses: [
            { metadata: { key: "b" }, response: { text: '{"x":1}', usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 50, thoughtsTokenCount: 200 } } },
            { metadata: { key: "a" }, response: { candidates: [{ content: { parts: [{ text: "{" }, { text: "}" }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2 } } },
          ],
        },
      }),
    );
    expect(status).toEqual({
      providerState: "JOB_STATE_SUCCEEDED",
      state: "succeeded",
      answers: [
        { key: "b", text: '{"x":1}', usage: { inputTokens: 1000, outputTokens: 250 } },
        { key: "a", text: "{}", usage: { inputTokens: 10, outputTokens: 2 } },
      ],
    });
  });

  it("falls back to the keys it sent when the provider returns no metadata, and flags failed or empty requests", () => {
    const status = statusFromJob(
      job({
        state: "JOB_STATE_SUCCEEDED",
        dest: { inlinedResponses: [{ response: { text: "{}", usageMetadata: {} } }, { error: { message: "blocked" } }, { response: {} }] },
      }),
      ["one", "two", "three"],
    );
    expect(status.answers).toEqual([
      { key: "one", text: "{}", usage: { inputTokens: 0, outputTokens: 0 } },
      { key: "two", error: "blocked" },
      { key: "three", error: "empty answer" },
    ]);
  });
});

describe("batchRequestConfig", () => {
  const request = (jsonSchema: Record<string, unknown>) => ({ model: "m", pdf: new Uint8Array(1), instructions: "RULES", prompt: "p", jsonSchema });
  const flat = { type: "object", properties: { codes: { type: "array", items: { type: "string" } } }, required: ["codes"] };
  const deep = { type: "object", properties: { a: { type: "object", properties: { b: { type: "object", properties: { c: { type: "object", properties: { d: { type: "string" } } } } } } } } };

  it("sends a schema the Batch API accepts as a schema", () => {
    expect(batchRequestConfig(request(flat))).toEqual({ systemInstruction: "RULES", temperature: 0, responseMimeType: "application/json", responseJsonSchema: flat });
  });

  it("writes a too-deep schema into the instruction instead, and still forces JSON", () => {
    const config = batchRequestConfig(request(deep));
    expect(config).not.toHaveProperty("responseJsonSchema");
    expect(config.responseMimeType).toBe("application/json");
    expect(config.systemInstruction).toContain("RULES");
    expect(config.systemInstruction).toContain(JSON.stringify(deep));
  });

  it("does that for every extraction schema (all are deeper than the limit)", () => {
    for (const name of Object.keys(EXTRACTION_SCHEMAS) as (keyof typeof EXTRACTION_SCHEMAS)[]) {
      const config = batchRequestConfig(request(toGeminiJsonSchema(EXTRACTION_SCHEMAS[name])));
      expect(config, name).not.toHaveProperty("responseJsonSchema");
    }
  });
});
