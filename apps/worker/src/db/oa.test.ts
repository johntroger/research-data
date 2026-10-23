import { describe, expect, it } from "vitest";
import { decide, type OaPaper } from "./oa.js";

const paper = (o: Partial<OaPaper> = {}): OaPaper => ({ id: "p", title: "T", doi: "10.1/x", license_source: null, ...o });

describe("decide", () => {
  it("sets license_source to oa for an open licence", () => {
    const d = decide(paper(), { oaStatus: "gold", license: "cc-by", url: "https://x" });
    expect(d).toMatchObject({ open: true, licenseSource: "oa" });
  });
  it("leaves the owner's own license_source when the copy is not open", () => {
    expect(decide(paper({ license_source: "institution_subscription" }), { oaStatus: "closed", license: null, url: null })).toMatchObject({ open: false, licenseSource: "institution_subscription" });
    expect(decide(paper(), { oaStatus: "bronze", license: null, url: "https://x" })).toMatchObject({ open: false, licenseSource: null });
  });
  it("clears an earlier 'oa' that no longer holds, so no download is offered by mistake", () => {
    expect(decide(paper({ license_source: "oa" }), { oaStatus: "bronze", license: null, url: null }).licenseSource).toBeNull();
    expect(decide(paper({ license_source: "oa" }), null).licenseSource).toBeNull();
  });
  it("says why, including a paper without a DOI", () => {
    expect(decide(paper({ doi: null }), null).note).toBe("không có DOI");
    expect(decide(paper(), null).note).toBe("Unpaywall không có bản ghi");
    expect(decide(paper(), { oaStatus: "gold", license: "publisher-specific-oa", url: null }).note).toContain("không phải giấy phép mở");
  });
});
