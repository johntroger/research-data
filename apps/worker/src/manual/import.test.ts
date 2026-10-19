import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { backupFile, once } from "./import.js";

describe("once", () => {
  it("runs the function the first time only, however many packets ask for it", async () => {
    const fn = vi.fn(async () => {});
    const backup = once(fn);
    await Promise.all([backup(), backup()]);
    await backup();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("remembers a failure too, so a failed backup stops every later import of the run", async () => {
    const backup = once(async () => {
      throw new Error("pg_dump failed");
    });
    await expect(backup()).rejects.toThrow("pg_dump failed");
    await expect(backup()).rejects.toThrow("pg_dump failed");
  });
});

describe("backupFile", () => {
  it("is a dated .sql file in the backups folder, with a name that is valid on Windows (no colons)", () => {
    const file = backupFile(path.join("x", "extracted_data"), new Date("2026-10-19T14:05:09.123Z"));
    expect(file.split(path.sep).slice(-3)).toEqual(["extracted_data", "backups", "db-2026-10-19T14-05-09-123Z.sql"]);
  });
});
