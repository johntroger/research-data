import { describe, expect, it } from "vitest";
import { canDownloadPdf, isOpenLicence, pdfFileName } from "./pdf-access";

describe("who may download a PDF", () => {
  it("lets the owner download every paper", () => {
    expect(canDownloadPdf(true, { oa_status: "closed", license_source: "institution_subscription" })).toBe(true);
    expect(canDownloadPdf(true, { oa_status: null, license_source: null })).toBe(true);
  });

  it("lets a visitor download only a paper with an open licence", () => {
    expect(canDownloadPdf(false, { oa_status: "gold", license_source: "oa" })).toBe(true);
    expect(canDownloadPdf(false, { oa_status: "green", license_source: "oa" })).toBe(true);
    expect(canDownloadPdf(false, { oa_status: "closed", license_source: "institution_subscription" })).toBe(false);
    expect(canDownloadPdf(false, { oa_status: "bronze", license_source: "oa" })).toBe(false); // free to read is not an open licence
    expect(canDownloadPdf(false, { oa_status: "gold", license_source: "personal_purchase" })).toBe(false);
  });

  it("refuses a visitor when nothing is known", () => {
    expect(isOpenLicence({ oa_status: null, license_source: null })).toBe(false);
    expect(isOpenLicence({ oa_status: "unknown", license_source: "oa" })).toBe(false);
  });
});

describe("the downloaded file name", () => {
  it("is plain ASCII from the title", () => {
    expect(pdfFileName("Social media? Get serious!")).toBe("Social-media-Get-serious.pdf");
    const long = pdfFileName("Social media? Get serious! Understanding the functional building blocks of social media");
    expect(long.startsWith("Social-media-Get-serious-Understanding-the-functional-building-blocks")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(84);
    expect(pdfFileName("Đạo đức thương hiệu: Phân tích")).toBe("Dao-duc-thuong-hieu-Phan-tich.pdf");
    expect(pdfFileName("A/B \"test\" ../x")).toBe("A-B-test-x.pdf");
    expect(pdfFileName(null)).toBe("paper.pdf");
    expect(pdfFileName("???")).toBe("paper.pdf");
    expect(pdfFileName("x".repeat(200)).length).toBeLessThanOrEqual(84);
  });
});
