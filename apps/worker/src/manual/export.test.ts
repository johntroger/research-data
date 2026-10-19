import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkCode, writePacket } from "./export.js";
import { buildPacket } from "./packet.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "rd-packets-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const files = () => buildPacket({ code: "Q1", fileHash: "b".repeat(64), title: "T", pdf: new Uint8Array([1, 2, 3]) });

describe("writePacket", () => {
  it("writes every file and makes the empty out/ folder", async () => {
    const dir = await writePacket(root, "Q1", files());
    expect(await readdir(dir)).toEqual(expect.arrayContaining(["AGENTS.md", "INSTRUCTIONS.md", "out", "packet.json", "paper.pdf", "schemas"]));
    expect(await readdir(path.join(dir, "out"))).toEqual([]);
    expect([...(await readFile(path.join(dir, "paper.pdf")))]).toEqual([1, 2, 3]);
    expect(await readdir(path.join(dir, "schemas"))).toHaveLength(6);
  });

  it("refuses to touch a packet whose out/ already holds answers", async () => {
    const dir = await writePacket(root, "Q1", files());
    await writeFile(path.join(dir, "out", "paper_structure.json"), "{}");
    await expect(writePacket(root, "Q1", files())).rejects.toThrow(/already holds 1 file/);
  });

  it("with force rewrites the packet but keeps the answers", async () => {
    const dir = await writePacket(root, "Q1", files());
    await writeFile(path.join(dir, "out", "paper_structure.json"), '{"keep":true}');
    await writeFile(path.join(dir, "INSTRUCTIONS.md"), "old");
    await writePacket(root, "Q1", files(), { force: true });
    expect(await readFile(path.join(dir, "out", "paper_structure.json"), "utf8")).toBe('{"keep":true}');
    expect(await readFile(path.join(dir, "INSTRUCTIONS.md"), "utf8")).toContain("Extraction task: Q1");
  });

  it("creates the packets folder when it does not exist yet", async () => {
    const nested = path.join(root, "deeper", "still");
    const dir = await writePacket(nested, "Q1", files());
    expect(dir).toBe(path.join(nested, "Q1"));
  });
});

describe("checkCode", () => {
  it("accepts plain names and refuses anything that could leave the packets folder", () => {
    expect(checkCode("Q1-codex")).toBe("Q1-codex");
    expect(checkCode("a1b2c3d4e5f6")).toBe("a1b2c3d4e5f6");
    for (const bad of ["../x", "a/b", "a\\b", "", ".hidden", "C:\\x", "x y"]) expect(() => checkCode(bad)).toThrow(/Invalid packet name/);
  });
});
