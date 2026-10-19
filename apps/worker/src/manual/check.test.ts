import { mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { extractFull } from "../extract/extract-full.js";
import { sha256 } from "../pdf/text-layer.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { checkPacket, formatCheck } from "./check.js";
import { writePacket } from "./export.js";
import { buildPacket } from "./packet.js";

const oneStudy = SYNTHETIC_PAPERS[0]!;
const twoStudies = SYNTHETIC_PAPERS[2]!;
let root: string;
let dir: string;
const answers = new Map<string, { pass: string; studyLabel: string | null; rawText: string }[]>();
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  for (const p of [oneStudy, twoStudies]) {
    const pdf = await renderPdf(p.render);
    pdfs.set(p.id, pdf);
    const result = await extractFull(pdf, { model: "m", generate: answerKeyGenerator(p).generate });
    answers.set(p.id, result.calls);
  }
});
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "rd-check-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A packet for the paper with the answers an agent would write (the answer key of the synthetic paper). */
async function packetWithAnswers(paper: typeof oneStudy) {
  const pdf = pdfs.get(paper.id)!;
  dir = await writePacket(root, "T", buildPacket({ code: "T", fileHash: sha256(pdf), title: "T", pdf }));
  const labels = paper.answer.structure.studies.map((s) => s.study_label);
  for (const c of answers.get(paper.id)!) {
    const file = c.studyLabel === null ? `${c.pass}.json` : `study_${labels.indexOf(c.studyLabel) + 1}_${c.pass}.json`;
    await writeFile(path.join(dir, "out", file), c.rawText);
  }
}
const out = (name: string) => path.join(dir, "out", name);
const readJson = async (name: string) => JSON.parse(await readFile(out(name), "utf8"));

describe("checkPacket: a packet that is right", () => {
  it("accepts the answers of a one-study paper and counts them", async () => {
    await packetWithAnswers(oneStudy);
    const r = await checkPacket(dir);
    expect(r).toMatchObject({ ok: true, errors: [], validFiles: 6, studies: 1 });
    expect(formatCheck(r)).toMatch(/^VALID: 6 answer file\(s\), 1 study/);
  });

  it("expects four files for every study of the structure: ten files for two studies", async () => {
    await packetWithAnswers(twoStudies);
    expect(await checkPacket(dir)).toMatchObject({ ok: true, validFiles: 10, studies: 2 });
  });

  it("removes an old FEEDBACK.md once everything is valid", async () => {
    await packetWithAnswers(oneStudy);
    await writeFile(path.join(dir, "FEEDBACK.md"), "old");
    await checkPacket(dir);
    expect(await readdir(dir)).not.toContain("FEEDBACK.md");
  });
});

describe("checkPacket: what stops an import", () => {
  it("names a missing file and writes it into FEEDBACK.md for the agent", async () => {
    await packetWithAnswers(oneStudy);
    await rm(out("paper_discussion.json"));
    const r = await checkPacket(dir);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([{ file: "out/paper_discussion.json", message: "file is missing" }]);
    const feedback = await readFile(path.join(dir, "FEEDBACK.md"), "utf8");
    expect(feedback).toContain("out/paper_discussion.json: file is missing");
    expect(feedback).toMatch(/Fix ONLY the files named here/);
  });

  it("reports a schema error with the path of the field, and a repaired file clears it", async () => {
    await packetWithAnswers(oneStudy);
    await writeFile(out("study_1_study_paths.json"), '{"paths": [{"estimate": "high"}]}');
    const r = await checkPacket(dir);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]!.file).toBe("out/study_1_study_paths.json");
    expect(r.errors[0]!.message).toMatch(/does not match the schema: paths\.0\.hypothesis_code/);
    expect(r.validFiles).toBe(5);
    await writeFile(out("study_1_study_paths.json"), answers.get(oneStudy.id)!.find((c) => c.pass === "study_paths")!.rawText);
    expect(await checkPacket(dir)).toMatchObject({ ok: true });
  });

  it("explains a file that is not JSON (text or code fences around it)", async () => {
    await packetWithAnswers(oneStudy);
    await writeFile(out("paper_structure.json"), "```json\n{}\n```");
    const r = await checkPacket(dir);
    expect(r.errors[0]).toMatchObject({ file: "out/paper_structure.json" });
    expect(r.errors[0]!.message).toMatch(/not valid JSON \(one JSON object, no text or code fences/);
  });

  it("tells an agent that shortened a file name which exact name to use (Codex wrote study_1_paths.json at A1)", async () => {
    await packetWithAnswers(oneStudy);
    await rename(out("study_1_study_paths.json"), out("study_1_paths.json"));
    const r = await checkPacket(dir);
    expect(r.errors).toEqual([{ file: "out/study_1_study_paths.json", message: "file is missing; it was written as out/study_1_paths.json: use the exact name out/study_1_study_paths.json" }]);
    expect(r.warnings.map((w) => w.file)).toContain("out/study_1_paths.json"); // and the stray file is called out
  });

  it("does not pile up study errors when paper_structure itself is not valid", async () => {
    await packetWithAnswers(twoStudies);
    await writeFile(out("paper_structure.json"), "{}");
    const r = await checkPacket(dir);
    expect(r.errors.map((e) => e.file)).toEqual(["out/paper_structure.json"]);
    expect(r.warnings.some((w) => /study files cannot be checked/.test(w.message))).toBe(true);
  });

  it("refuses a packet made for an older prompt, schema or codebook: export it again", async () => {
    await packetWithAnswers(oneStudy);
    const meta = JSON.parse(await readFile(path.join(dir, "packet.json"), "utf8"));
    await writeFile(path.join(dir, "packet.json"), JSON.stringify({ ...meta, promptVersion: "full-0.1.0", codebookVersion: "0.9" }));
    const r = await checkPacket(dir);
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.message).join("\n")).toMatch(/promptVersion is full-0\.1\.0.*export the packet again[\s\S]*codebookVersion is 0\.9/);
  });

  it("refuses answers for a different PDF than the packet's", async () => {
    await packetWithAnswers(oneStudy);
    await writeFile(path.join(dir, "paper.pdf"), new Uint8Array([1, 2, 3]));
    expect((await checkPacket(dir)).errors).toEqual([{ file: "paper.pdf", message: "is not the paper this packet was made for (hash differs)" }]);
  });

  it("says so when the folder is not a packet", async () => {
    const r = await checkPacket(root);
    expect(r.errors[0]).toMatchObject({ file: "packet.json" });
  });
});

describe("checkPacket: warnings that do not stop an import", () => {
  it("warns about a quote longer than 50 words", async () => {
    await packetWithAnswers(oneStudy);
    const structure = await readJson("paper_structure.json");
    structure.paper_type_evidence.quote = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    await writeFile(out("paper_structure.json"), JSON.stringify(structure));
    const r = await checkPacket(dir);
    expect(r.ok).toBe(true);
    const text = r.warnings.map((w) => w.message).join("\n");
    expect(text).toMatch(/1 quote\(s\) longer than 50 words/);
  });

  it("lists a file nobody asked for as ignored, and does not write FEEDBACK.md when valid", async () => {
    await packetWithAnswers(oneStudy);
    await writeFile(out("notes.txt"), "scratch");
    const r = await checkPacket(dir);
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([{ file: "out/notes.txt", message: "is not an expected answer file and will be ignored" }]);
    expect(await readdir(dir)).not.toContain("FEEDBACK.md");
  });

  it("leaves the folder untouched with writeFeedback off", async () => {
    await packetWithAnswers(oneStudy);
    await rm(out("paper_discussion.json"));
    await checkPacket(dir, { writeFeedback: false });
    expect(await readdir(dir)).not.toContain("FEEDBACK.md");
  });
});
