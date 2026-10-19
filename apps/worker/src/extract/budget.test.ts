import { beforeAll, describe, expect, it } from "vitest";
import { RateLimiter, type Clock } from "./limits.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { Budget, BudgetExceeded, budgetConfigFromEnv, MemoryLedger } from "./budget.js";
import { extractFull } from "./extract-full.js";
import type { GeneratePdfJson } from "./gemini.js";
import { guardedGenerator } from "./guarded.js";

const MODEL = "gemini-4-argon";
const AT = () => new Date("2026-10-19");
const paper = SYNTHETIC_PAPERS[0]!;
let pdf: Uint8Array;
beforeAll(async () => (pdf = await renderPdf(paper.render)));

describe("budgetConfigFromEnv", () => {
  it("defaults to the 25 USD pilot cap (D6) and reads the settings", () => {
    expect(budgetConfigFromEnv({})).toEqual({ limitUsd: 25, offsetUsd: 0, runLimitUsd: undefined });
    expect(budgetConfigFromEnv({ GEMINI_BUDGET_LIMIT: "30", GEMINI_SPENT_OFFSET_USD: "2.5", GEMINI_RUN_LIMIT: "1" })).toEqual({
      limitUsd: 30,
      offsetUsd: 2.5,
      runLimitUsd: 1,
    });
  });

  it("refuses a nonsense value instead of silently running without a cap", () => {
    expect(() => budgetConfigFromEnv({ GEMINI_BUDGET_LIMIT: "ten" })).toThrow(/GEMINI_BUDGET_LIMIT must be a non-negative number/);
    expect(() => budgetConfigFromEnv({ GEMINI_BUDGET_LIMIT: "-1" })).toThrow(/non-negative/);
  });
});

describe("Budget", () => {
  const entry = (costUsd: number) => ({ model: MODEL, pass: null, fileHash: null, inputTokens: 1, outputTokens: 1, costUsd });

  it("counts the offset and the ledger against the limit", async () => {
    const budget = new Budget(new MemoryLedger(), { limitUsd: 10, offsetUsd: 2 });
    await budget.record(entry(1.5));
    expect(await budget.spentUsd()).toBeCloseTo(3.5, 10);
    expect(await budget.remainingUsd()).toBeCloseTo(6.5, 10);
    await expect(budget.assertCanSpend(6.5)).resolves.toBeUndefined();
    await expect(budget.assertCanSpend(6.51)).rejects.toBeInstanceOf(BudgetExceeded);
  });

  it("has a separate cap for one run", async () => {
    const budget = new Budget(new MemoryLedger(), { limitUsd: 100, runLimitUsd: 1 });
    await budget.record(entry(0.8));
    const error = await budget.assertCanSpend(0.3).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: "BudgetExceeded", scope: "run", limitUsd: 1 });
    expect((error as Error).message).toMatch(/Budget cap reached \(run\)/);
  });
});

describe("guardedGenerator", () => {
  const instant: Clock = { now: () => 0, sleep: async () => {} };

  it("stops BEFORE the call that would pass the cap: nothing is sent and nothing is booked", async () => {
    let sent = 0;
    const generate: GeneratePdfJson = async () => (sent++, { text: "{}", usage: { inputTokens: 1, outputTokens: 1 } });
    const ledger = new MemoryLedger();
    const budget = new Budget(ledger, { limitUsd: 10, offsetUsd: 9.99 }); // a call here costs several cents
    const guarded = guardedGenerator(generate, { budget, now: AT });
    await expect(guarded({ model: MODEL, pdf, instructions: "", prompt: "", jsonSchema: {} })).rejects.toBeInstanceOf(BudgetExceeded);
    expect(sent).toBe(0);
    expect(ledger.entries).toEqual([]);
  });

  it("books every call at its real cost, with its pass and paper", async () => {
    const { generate } = answerKeyGenerator(paper);
    const ledger = new MemoryLedger();
    const budget = new Budget(ledger, { limitUsd: 10 });
    const result = await extractFull(pdf, { model: MODEL, generate: guardedGenerator(generate, { budget, fileHash: "hash-1", now: AT }) });
    expect(result.studies).toEqual(paper.answer.studies);
    expect(ledger.entries.map((e) => e.pass)).toEqual(result.calls.map((c) => c.pass));
    expect(ledger.entries.every((e) => e.fileHash === "hash-1" && e.model === MODEL)).toBe(true);
    const booked = ledger.entries.reduce((n, e) => n + e.costUsd, 0);
    expect(booked).toBeCloseTo(result.costUsd!, 6);
    expect(await budget.spentUsd()).toBeCloseTo(booked, 10);
  });

  it("halts a multi-call extraction once the cap is reached, keeping the calls already paid for", async () => {
    const { generate, requests } = answerKeyGenerator(paper);
    const ledger = new MemoryLedger();
    // Room for a few calls only: each call is checked at its worst case (~$0.08) and booked at its real cost (~$0.01).
    const budget = new Budget(ledger, { limitUsd: 0.1 });
    const guarded = guardedGenerator(generate, { budget, now: AT });
    const error = await extractFull(pdf, { model: MODEL, generate: guarded }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetExceeded);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.length).toBeLessThan(6);
    expect(ledger.entries).toHaveLength(requests.length); // every call that was sent is in the ledger
  });

  it("retries a rate-limited call, books it once, and gives up with the reason after the last attempt", async () => {
    let calls = 0;
    const flaky: GeneratePdfJson = async () => {
      if (++calls < 3) throw Object.assign(new Error("429 RESOURCE_EXHAUSTED"), { status: 429 });
      return { text: "{}", usage: { inputTokens: 1000, outputTokens: 100 } };
    };
    const ledger = new MemoryLedger();
    const budget = new Budget(ledger, { limitUsd: 10 });
    await guardedGenerator(flaky, { budget, retry: { clock: instant, random: () => 0 }, now: AT })({ model: MODEL, pdf, instructions: "", prompt: "", jsonSchema: {} });
    expect(calls).toBe(3);
    expect(ledger.entries).toHaveLength(1); // failed attempts cost nothing

    const down: GeneratePdfJson = async () => {
      throw Object.assign(new Error("503 UNAVAILABLE"), { status: 503 });
    };
    const error = await guardedGenerator(down, { budget, retry: { clock: instant, maxRetries: 2 }, now: AT })({ model: MODEL, pdf, instructions: "", prompt: "", jsonSchema: {} }).catch((e: unknown) => e);
    expect((error as Error).message).toMatch(/gave up after 3 attempt\(s\): 503 UNAVAILABLE/);
    expect(ledger.entries).toHaveLength(1);
  });

  it("waits for the rate limit between calls", async () => {
    const slept: number[] = [];
    let time = 0;
    const clock: Clock = {
      now: () => time,
      sleep: async (ms) => {
        slept.push(ms);
        time += ms;
      },
    };
    const limiter = new RateLimiter({ rpm: 2, tpm: 1e9 }, clock);
    const { generate } = answerKeyGenerator(paper);
    const budget = new Budget(new MemoryLedger(), { limitUsd: 10 });
    await extractFull(pdf, { model: MODEL, generate: guardedGenerator(generate, { budget, limiter, now: AT }) });
    expect(slept.length).toBeGreaterThanOrEqual(2); // 6 calls at 2 per minute
    expect(time).toBeGreaterThanOrEqual(120_000);
  });

  it("refuses a model with no price rather than running without a cap", async () => {
    const generate: GeneratePdfJson = async () => ({ text: "{}", usage: { inputTokens: 1, outputTokens: 1 } });
    const budget = new Budget(new MemoryLedger(), { limitUsd: 10 });
    await expect(guardedGenerator(generate, { budget })({ model: "gemini-unknown", pdf, instructions: "", prompt: "", jsonSchema: {} })).rejects.toThrow(/No price known for model/);
  });
});
