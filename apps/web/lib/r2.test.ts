import { describe, expect, it } from "vitest";
import { dispositionFor, LINK_SECONDS, pdfKey, presignPdf, r2Config } from "./r2";

const HASH = "a".repeat(64);
const config = { accountId: "acc123", bucket: "bkt", accessKeyId: "AKID", secretAccessKey: "SECRET" };

describe("r2Config", () => {
  it("needs all four settings", () => {
    const all = { R2_ACCOUNT_ID: "a", R2_BUCKET: "b", R2_ACCESS_KEY_ID: "c", R2_SECRET_ACCESS_KEY: "d" };
    expect(r2Config(all)).toEqual({ accountId: "a", bucket: "b", accessKeyId: "c", secretAccessKey: "d" });
    expect(r2Config({ ...all, R2_SECRET_ACCESS_KEY: " " })).toBeNull();
    expect(r2Config({})).toBeNull();
  });
});

describe("pdfKey", () => {
  it("accepts only a SHA-256 hex string", () => {
    expect(pdfKey(HASH)).toBe(`pdf/${HASH}.pdf`);
    expect(pdfKey("../../secret")).toBeNull();
    expect(pdfKey("A".repeat(64))).toBeNull();
    expect(pdfKey(null)).toBeNull();
  });
});

describe("dispositionFor", () => {
  it("is inline for viewing and a safe named attachment for a download", () => {
    expect(dispositionFor(false, "x.pdf")).toBe("inline");
    expect(dispositionFor(true, 'a"b c.pdf')).toBe('attachment; filename="a_b_c.pdf"');
  });
});

describe("presignPdf", () => {
  it("signs a 5-minute link to the object, with the response headers asked for", async () => {
    const url = new URL((await presignPdf(config, HASH, { download: true, fileName: "Paper.pdf", now: new Date("2026-10-23T10:00:00Z") }))!);
    expect(url.hostname).toBe("bkt.acc123.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(`/pdf/${HASH}.pdf`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe(String(LINK_SECONDS));
    expect(url.searchParams.get("X-Amz-Date")).toBe("20261023T100000Z");
    expect(url.searchParams.get("response-content-disposition")).toBe('attachment; filename="Paper.pdf"');
    expect(url.searchParams.get("response-content-type")).toBe("application/pdf");
    expect(url.toString()).not.toContain("SECRET");
  });
  it("refuses a hash that is not a hash", async () => {
    expect(await presignPdf(config, "not-a-hash", { download: false, fileName: "x.pdf" })).toBeNull();
  });
});
