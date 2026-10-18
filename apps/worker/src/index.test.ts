import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "@research-data/schema";
import { describeWorker } from "./index.js";

describe("@research-data/worker", () => {
  it("resolves the shared schema package through the workspace", () => {
    expect(describeWorker()).toContain(SCHEMA_VERSION);
  });
});
