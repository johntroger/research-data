import { describe, expect, it } from "vitest";
import { archiveKey, archivesToDelete, selectBackupFiles, skippedFolders } from "./files.js";

const entries = [
  { name: "b.full.json", isDirectory: false },
  { name: "a.ocr.json", isDirectory: false },
  { name: "audit", isDirectory: true },
  { name: "backups", isDirectory: true },
  { name: ".hidden", isDirectory: false },
  { name: "old.sql", isDirectory: false },
];

describe("selectBackupFiles", () => {
  it("keeps the top-level files, sorted, without folders, hidden files or SQL dumps", () => {
    expect(selectBackupFiles(entries)).toEqual(["a.ocr.json", "b.full.json"]);
    expect(skippedFolders(entries)).toEqual(["audit", "backups"]);
  });
});

describe("archiveKey", () => {
  it("is named by the UTC time so that sorting sorts by age", () => {
    expect(archiveKey(new Date("2026-10-23T12:05:09.123Z"))).toBe("extracted/extracted-2026-10-23T120509Z.tar.gz");
    expect(archiveKey(new Date("2026-10-23T12:05:09Z")) < archiveKey(new Date("2026-11-01T00:00:00Z"))).toBe(true);
  });
});

describe("archivesToDelete", () => {
  const k = (d: string) => `extracted/extracted-${d}.tar.gz`;
  const keys = [k("2026-10-03T000000Z"), k("2026-10-01T000000Z"), k("2026-10-02T000000Z"), "extracted/notes.txt", "backups/db-2026-10-01T000000Z.dump"];
  it("returns the oldest archives beyond keep, never anything else", () => {
    expect(archivesToDelete(keys, 2)).toEqual([k("2026-10-01T000000Z")]);
    expect(archivesToDelete(keys, 3)).toEqual([]);
  });
  it("refuses a keep that could delete everything", () => {
    expect(() => archivesToDelete(keys, 1)).toThrow();
    expect(() => archivesToDelete(keys, 0)).toThrow();
  });
});
