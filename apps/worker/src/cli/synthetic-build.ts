/**
 * Writes the synthetic papers (step 0.13) to fixtures/synthetic/: one PDF and one answer key each.
 * The output is deterministic, so the files can be committed and rebuilt without diffs.
 * Usage: pnpm synthetic:build
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sha256 } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";

const OUT = path.resolve(import.meta.dirname, "../../../../fixtures/synthetic");

async function main(): Promise<number> {
  await mkdir(OUT, { recursive: true });
  for (const paper of SYNTHETIC_PAPERS) {
    const pdf = await renderPdf(paper.render);
    await writeFile(path.join(OUT, `${paper.id}.pdf`), pdf);
    const answer = {
      id: paper.id,
      description: paper.description,
      file_hash: sha256(pdf),
      expected: paper.expected,
      known_issues: paper.knownIssues ?? {},
      ...paper.answer,
    };
    await writeFile(path.join(OUT, `${paper.id}.answer.json`), `${JSON.stringify(answer, null, 2)}\n`);
    console.log(`${paper.id}: ${paper.render.pages.length} trang, sha256 ${answer.file_hash.slice(0, 12)}…`);
  }
  console.log(`Đã ghi ${SYNTHETIC_PAPERS.length} bài vào ${OUT}`);
  return 0;
}

process.exitCode = await main();
