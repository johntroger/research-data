import { describe, expect, it } from "vitest";
import { provenanceNote, releaseDate, releaseLabel, toolCitation, type DataRelease } from "./release";

const release: DataRelease = { id: "2026.10.25", released_at: "2026-10-25T10:00:00Z", papers: 36, tests: 1007, canonical_version: "1.1.0", note: "" };

describe("releases", () => {
  it("labels a release with its number and size, and gives its date in Vietnam time", () => {
    expect(releaseLabel(release)).toBe("bản 2026.10.25, 36 bài, 1.007 kiểm định");
    expect(releaseDate(release)).toBe("25/10/2026");
    expect(releaseDate({ ...release, released_at: "2026-10-25T20:00:00Z" })).toBe("26/10/2026");
  });
});

describe("toolCitation", () => {
  it("is an APA 7 data-set reference with the version and the day it was consulted", () => {
    expect(toolCitation(release, new Date("2026-11-02T08:00:00Z"), "https://example.org")).toBe(
      "Tran, T. T. (2026). Research Data: Academic literature matrix (Version 2026.10.25) [Data set]. Retrieved November 2, 2026, from https://example.org",
    );
  });

  it("still works before any release was cut", () => {
    expect(toolCitation(null, new Date("2026-11-02T08:00:00Z"), "https://example.org")).toBe("Tran, T. T. (2026). Research Data: Academic literature matrix [Data set]. Retrieved November 2, 2026, from https://example.org");
  });

  it("goes into the notes of an exported file with the release it comes from", () => {
    const note = provenanceNote(release, new Date("2026-11-02T08:00:00Z"), "https://example.org");
    expect(note).toContain("Dữ liệu bản 2026.10.25, 36 bài, 1.007 kiểm định, đóng ngày 25/10/2026.");
    expect(note).toContain("Cách trích dẫn: Tran, T. T. (2026).");
  });
});

import { staleWarning } from "./release";

describe("staleWarning", () => {
  const latest = { id: "2026.11.02", released_at: "2026-11-02T03:00:00Z" };
  it("warns only when the link names a release other than the latest", () => {
    expect(staleWarning(null, latest)).toBeNull();
    expect(staleWarning("2026.11.02", latest)).toBeNull();
    expect(staleWarning("2026.10.25", null)).toBeNull();
    const text = staleWarning("2026.10.25", latest)!;
    expect(text).toContain("bản dữ liệu 2026.10.25");
    expect(text).toContain("bản 2026.11.02 (02/11/2026)");
  });
});
