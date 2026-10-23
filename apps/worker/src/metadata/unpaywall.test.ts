import { describe, expect, it } from "vitest";
import { fetchUnpaywall, isOpenLicense, parseUnpaywall } from "./unpaywall.js";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });

describe("parseUnpaywall", () => {
  it("reads the status, the licence and the landing page of the best copy", () => {
    expect(parseUnpaywall({ oa_status: "gold", best_oa_location: { license: "cc-by", url: "https://x/pdf", url_for_landing_page: "https://x/landing" } })).toEqual({ oaStatus: "gold", license: "cc-by", url: "https://x/landing" });
  });
  it("copes with a closed paper and an unknown status", () => {
    expect(parseUnpaywall({ oa_status: "closed", best_oa_location: null })).toEqual({ oaStatus: "closed", license: null, url: null });
    expect(parseUnpaywall({ oa_status: "weird" }).oaStatus).toBe("unknown");
  });
});

describe("isOpenLicense", () => {
  it("is open only for gold, green or hybrid copies with a Creative Commons or public-domain licence", () => {
    expect(isOpenLicense({ oaStatus: "gold", license: "cc-by" })).toBe(true);
    expect(isOpenLicense({ oaStatus: "hybrid", license: "CC-BY-NC-ND" })).toBe(true);
    expect(isOpenLicense({ oaStatus: "green", license: "cc0" })).toBe(true);
    expect(isOpenLicense({ oaStatus: "gold", license: "public-domain" })).toBe(true);
  });
  it("is not open for bronze, publisher-specific, unknown or missing licences", () => {
    expect(isOpenLicense({ oaStatus: "bronze", license: "cc-by" })).toBe(false);
    expect(isOpenLicense({ oaStatus: "gold", license: "publisher-specific-oa" })).toBe(false);
    expect(isOpenLicense({ oaStatus: "green", license: null })).toBe(false);
    expect(isOpenLicense({ oaStatus: "closed", license: null })).toBe(false);
    expect(isOpenLicense({ oaStatus: "unknown", license: "cc-by" })).toBe(false);
  });
});

describe("fetchUnpaywall", () => {
  const sleep = async () => {};
  it("asks for the DOI with the email and returns the parsed record", async () => {
    let asked = "";
    const info = await fetchUnpaywall("10.1/a b", { email: "me@example.org", sleep, fetchImpl: async (u) => ((asked = String(u)), json({ oa_status: "gold", best_oa_location: { license: "cc-by", url_for_landing_page: "https://x" } })) });
    expect(asked).toBe("https://api.unpaywall.org/v2/10.1%2Fa%20b?email=me%40example.org");
    expect(info).toEqual({ oaStatus: "gold", license: "cc-by", url: "https://x" });
  });
  it("returns null for a 404 and retries a 429 then succeeds", async () => {
    expect(await fetchUnpaywall("10.1/x", { email: "me@example.org", sleep, fetchImpl: async () => json({}, 404) })).toBeNull();
    let n = 0;
    const info = await fetchUnpaywall("10.1/x", { email: "me@example.org", sleep, fetchImpl: async () => (++n < 2 ? json({}, 429) : json({ oa_status: "closed" })) });
    expect(n).toBe(2);
    expect(info?.oaStatus).toBe("closed");
  });
  it("gives up after the retries and refuses a bad email", async () => {
    await expect(fetchUnpaywall("10.1/x", { email: "me@example.org", sleep, maxRetries: 1, fetchImpl: async () => json({}, 500) })).rejects.toThrow(/Unpaywall 500/);
    await expect(fetchUnpaywall("10.1/x", { email: "not-an-email", fetchImpl: async () => json({}) })).rejects.toThrow(/real email/);
  });
});
