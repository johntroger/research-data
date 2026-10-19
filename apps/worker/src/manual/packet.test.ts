import { CODEBOOK_VERSION, EXTRACTION_SCHEMAS, type ExtractionSchemaName, SCHEMA_VERSION, toGeminiJsonSchema } from "@research-data/schema";
import { describe, expect, it } from "vitest";
import { FULL_PROMPT_VERSION, STUDY_PART_NAMES } from "../extract/full-prompt.js";
import { buildPacket, type PacketFile, packetMeta, studyFileName } from "./packet.js";

const input = { code: "Q-test", fileHash: "a".repeat(64), title: "A paper about trust", pdf: new Uint8Array([37, 80, 68, 70, 45, 49]) };
const text = (files: PacketFile[], p: string) => {
  const f = files.find((x) => x.path === p);
  if (!f || typeof f.content !== "string") throw new Error(`no text file ${p}`);
  return f.content;
};

describe("buildPacket", () => {
  const files = buildPacket(input);

  it("holds the paper, the instructions, one schema per pass and the packet description, and nothing else", () => {
    expect(files.map((f) => f.path)).toEqual([
      "AGENTS.md",
      "INSTRUCTIONS.md",
      "packet.json",
      "paper.pdf",
      "schemas/paper_discussion.schema.json",
      "schemas/paper_structure.schema.json",
      "schemas/study_design_sample_bias.schema.json",
      "schemas/study_measurements.schema.json",
      "schemas/study_paths.schema.json",
      "schemas/study_tables.schema.json",
    ]);
    expect(files.find((f) => f.path === "paper.pdf")!.content).toEqual(input.pdf);
  });

  it("gives the same bytes for the same input (no dates, no randomness)", () => {
    expect(buildPacket({ ...input })).toEqual(files);
  });

  it("writes the schemas the Gemini calls use, so one change of schema reaches both routes", () => {
    for (const pass of Object.keys(EXTRACTION_SCHEMAS) as ExtractionSchemaName[]) {
      expect(JSON.parse(text(files, `schemas/${pass}.schema.json`))).toEqual(toGeminiJsonSchema(EXTRACTION_SCHEMAS[pass]));
    }
  });

  it("records the versions an import must match", () => {
    expect(JSON.parse(text(files, "packet.json"))).toEqual({ code: "Q-test", fileHash: input.fileHash, title: input.title, promptVersion: FULL_PROMPT_VERSION, schemaVersion: SCHEMA_VERSION, codebookVersion: CODEBOOK_VERSION });
    expect(packetMeta(input).promptVersion).toBe(FULL_PROMPT_VERSION);
  });

  it("names every answer file in full, so an agent does not shorten them (Codex wrote study_1_paths.json at A1)", () => {
    const md = text(files, "INSTRUCTIONS.md");
    expect(md).toContain("out/paper_structure.json");
    expect(md).toContain("out/paper_discussion.json");
    for (const part of STUDY_PART_NAMES) expect(md).toContain(`out/${studyFileName(1, part)}`);
    expect(studyFileName(2, "study_paths")).toBe("study_2_study_paths.json");
  });

  it("carries the rules of the shared prompt: study definition, 8 items per list, no object without evidence", () => {
    const md = text(files, "INSTRUCTIONS.md");
    expect(md).toContain(FULL_PROMPT_VERSION);
    expect(md).toMatch(/qualitative preliminary step/);
    expect(md).toMatch(/at most 8 items/);
    expect(md).toMatch(/NO EVIDENCE, NO OBJECT/);
  });

  it("keeps the agent inside the folder and carries no secret", () => {
    expect(text(files, "AGENTS.md")).toMatch(/Never read, search or open anything outside it/);
    for (const f of files) {
      if (typeof f.content !== "string") continue;
      expect(f.content).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|sb_secret|GEMINI_API_KEY|ZOTERO_API_KEY|eyJhbGci/);
    }
  });
});
