import { describe, expect, it } from "vitest";
import { nextReleaseId } from "./release.js";

describe("nextReleaseId", () => {
  it("is the date in Vietnam time", () => {
    expect(nextReleaseId(new Date("2026-10-25T10:00:00Z"), [])).toBe("2026.10.25");
    expect(nextReleaseId(new Date("2026-10-25T20:00:00Z"), [])).toBe("2026.10.26"); // already the 26th in Vietnam
  });

  it("adds -2, -3 when the day already has releases", () => {
    const now = new Date("2026-10-25T10:00:00Z");
    expect(nextReleaseId(now, ["2026.10.25"])).toBe("2026.10.25-2");
    expect(nextReleaseId(now, ["2026.10.25", "2026.10.25-2"])).toBe("2026.10.25-3");
    expect(nextReleaseId(now, ["2026.10.24"])).toBe("2026.10.25");
  });
});
