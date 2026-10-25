import { describe, expect, it } from "vitest";
import { backTarget } from "./back-link.js";

const ORIGIN = "https://research-data-five.vercel.app";

describe("the way back from a paper to the list it came from", () => {
  it("returns to a search result with its question, and to the library and the matrix with their filters", () => {
    expect(backTarget(`${ORIGIN}/?a=ethicality&b=trust&role=all`, ORIGIN)).toEqual({ href: "/?a=ethicality&b=trust&role=all", label: "Quay lại kết quả tìm quan hệ" });
    expect(backTarget(`${ORIGIN}/?a=trust`, ORIGIN)?.label).toBe("Quay lại kết quả tìm quan hệ");
    expect(backTarget(`${ORIGIN}/library?q=gratitude&year=2024`, ORIGIN)).toEqual({ href: "/library?q=gratitude&year=2024", label: "Quay lại Thư viện" });
    expect(backTarget(`${ORIGIN}/matrix`, ORIGIN)).toEqual({ href: "/matrix", label: "Quay lại Ma trận" });
  });

  it("offers nothing for a start page without a question, another paper, another page or a missing referrer", () => {
    expect(backTarget(`${ORIGIN}/`, ORIGIN)).toBeNull();
    expect(backTarget(`${ORIGIN}/papers/abc?focus=x`, ORIGIN)).toBeNull();
    expect(backTarget(`${ORIGIN}/about`, ORIGIN)).toBeNull();
    expect(backTarget("", ORIGIN)).toBeNull();
    expect(backTarget(null, ORIGIN)).toBeNull();
    expect(backTarget(undefined, ORIGIN)).toBeNull();
  });

  it("never follows another site or a malformed referrer", () => {
    expect(backTarget("https://evil.example/library?x=1", ORIGIN)).toBeNull();
    expect(backTarget("https://research-data-five.vercel.app.evil.example/library", ORIGIN)).toBeNull();
    expect(backTarget("not a url", ORIGIN)).toBeNull();
    expect(backTarget(`${ORIGIN}/library`, "not an origin")).toBeNull();
  });

  it("keeps only the path and the query, so the link is always on this site", () => {
    expect(backTarget(`${ORIGIN}/library?q=1#top`, ORIGIN)?.href).toBe("/library?q=1");
    expect(backTarget(`https://user:pw@research-data-five.vercel.app/library`, ORIGIN)?.href).toBe("/library");
  });
});
