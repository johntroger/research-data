import { describe, expect, it } from "vitest";
import { BADGES, FIELD_TIERS, SCHEMA_VERSION } from "./index.js";

describe("@research-data/schema", () => {
  it("exposes a semver schema version", () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("defines the three data tiers", () => {
    expect(FIELD_TIERS).toEqual(["T1", "T2", "T3"]);
  });

  it("defines unique trust badges", () => {
    expect(new Set(BADGES).size).toBe(BADGES.length);
    expect(BADGES).toContain("auto_verified");
  });
});
