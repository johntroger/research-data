import { readFile } from "node:fs/promises";
import path from "node:path";
import { PaperStructure, StudyDetail } from "@research-data/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer, sha256, type PdfTextLayer } from "../pdf/text-layer.js";
import { verifyNumber, verifyPValue } from "../verify/number.js";
import { verifyQuote } from "../verify/quote.js";
import { SYNTHETIC_PAPERS, type SyntheticPaper } from "./papers.js";
import { renderPdf } from "./render.js";

const FIXTURES = path.resolve(import.meta.dirname, "../../../../fixtures/synthetic");

interface Evidence {
  pdf_page: number;
  quote: string;
  table_or_figure: string | null;
}

/** Every evidence object anywhere in the answer key. */
function collectEvidence(value: unknown, out: Evidence[] = []): Evidence[] {
  if (Array.isArray(value)) value.forEach((v) => collectEvidence(v, out));
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.pdf_page === "number" && typeof obj.quote === "string") out.push(obj as unknown as Evidence);
    else Object.values(obj).forEach((v) => collectEvidence(v, out));
  }
  return out;
}

/** Numbers written in a quote ("0.42***" → "0.42"), kept as printed so trailing zeros count. */
const numbersIn = (quote: string) => quote.match(/-?\d*\.\d+|\b\d+\b/g) ?? [];

const layers = new Map<string, PdfTextLayer>();
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  for (const paper of SYNTHETIC_PAPERS) {
    const pdf = await renderPdf(paper.render);
    pdfs.set(paper.id, pdf);
    layers.set(paper.id, await readTextLayer(pdf));
  }
});

describe.each(SYNTHETIC_PAPERS.map((p) => [p.id, p] as [string, SyntheticPaper]))("%s", (id, paper) => {
  const layer = () => layers.get(id)!;
  const evidence = collectEvidence(paper.answer);
  const onText = (e: Evidence) => !paper.expected.pagesWithoutText.includes(e.pdf_page);

  it("answer key validates against packages/schema", () => {
    expect(() => PaperStructure.parse(paper.answer.structure)).not.toThrow();
    for (const study of paper.answer.studies) expect(() => StudyDetail.parse(study)).not.toThrow();
    const labels = paper.answer.structure.studies.map((s) => s.study_label);
    expect(paper.answer.studies.map((s) => s.study_label)).toEqual(labels);
  });

  it("resolves the printed page numbers of the answer key", () => {
    const printed = resolvePrintedPages(layer());
    expect(printed.printedPages).toEqual(paper.expected.printedPages);
    expect(printed.method).toBe(paper.expected.printedPageMethod);
  });

  (paper.knownIssues?.columns ? it.fails : it)(`detects the columns${paper.knownIssues?.columns ? " (known issue)" : ""}`, () => {
    expect(layer().pages.map((p) => p.columns)).toEqual(paper.expected.columns);
  });

  it("detects pages without a text layer", () => {
    const noText = layer().pages.filter((p) => !p.hasTextLayer).map((p) => p.pdfPageIndex + 1);
    expect(noText).toEqual(paper.expected.pagesWithoutText);
  });

  it("finds every text quote on its cited page", () => {
    const quotes = evidence.filter((e) => onText(e) && !e.table_or_figure);
    for (const e of quotes) {
      const check = verifyQuote(layer(), e.quote, e.pdf_page);
      expect({ quote: e.quote, match: check.match }).toMatchObject({ match: expect.stringMatching(/^(exact|fuzzy)$/) });
      expect(check.criticalDifferences).toEqual([]);
    }
  });

  it("finds the numbers of every table quote on its cited page", () => {
    for (const e of evidence.filter((e) => onText(e) && e.table_or_figure)) {
      for (const n of numbersIn(e.quote)) {
        expect({ quote: e.quote, n, found: verifyNumber(layer(), n, e.pdf_page).foundOnPage }).toEqual({
          quote: e.quote,
          n,
          found: e.pdf_page,
        });
      }
    }
  });

  it("finds the reported statistics", () => {
    const page = (ev: Evidence | null) => ev!.pdf_page;
    for (const study of paper.answer.studies) {
      for (const p of study.paths) {
        if (!onText(p.evidence)) continue;
        for (const v of [p.estimate, p.t_or_z, p.indirect_effect, ...(p.boot_ci ?? [])]) {
          if (v !== null) expect(verifyNumber(layer(), v, page(p.evidence)).found, `${v}`).toBe(true);
        }
        if (p.p_reported_as) expect(verifyPValue(layer(), p.p_reported_as, page(p.evidence)).found).toBe(true);
        for (const s of p.simple_slopes) expect(verifyNumber(layer(), s.estimate, page(p.evidence)).found).toBe(true);
      }
      for (const m of study.correlation_matrices) {
        for (const c of m.cells) expect(verifyNumber(layer(), c.r, page(m.evidence)).found).toBe(true);
      }
      for (const c of study.condition_cells) {
        for (const v of [c.mean, c.sd, c.n]) {
          if (v !== null) expect(verifyNumber(layer(), v, page(c.evidence)).found, `${v}`).toBe(true);
        }
      }
      for (const m of study.measurements) {
        for (const v of [m.alpha, m.CR, m.AVE]) {
          if (v !== null) expect(verifyNumber(layer(), v, page(m.reliability_evidence)).found, `${v}`).toBe(true);
        }
      }
      expect(verifyNumber(layer(), study.sample.n!, page(study.sample.n_evidence)).found).toBe(true);
    }
  });

  it("cannot confirm evidence on a page without a text layer", () => {
    for (const e of evidence.filter((e) => !onText(e))) {
      expect(verifyQuote(layer(), e.quote, e.pdf_page).foundOnPage).not.toBe(e.pdf_page);
    }
  });

  it("matches the committed fixture byte for byte", async () => {
    const again = await renderPdf(paper.render);
    expect(sha256(again)).toBe(sha256(pdfs.get(id)!));
    const committed = new Uint8Array(await readFile(path.join(FIXTURES, `${id}.pdf`)));
    expect(sha256(committed)).toBe(sha256(again));
    const answer = JSON.parse(await readFile(path.join(FIXTURES, `${id}.answer.json`), "utf8"));
    expect(answer.file_hash).toBe(sha256(again));
    expect(answer.studies).toEqual(JSON.parse(JSON.stringify(paper.answer.studies)));
  });
});

describe("synthetic set", () => {
  it("covers the layouts and statistics listed in Mục 6.6", () => {
    const all = SYNTHETIC_PAPERS;
    expect(new Set(all.map((p) => p.expected.printedPageMethod))).toEqual(new Set(["page_labels", "header_footer"]));
    expect(all.some((p) => p.expected.columns.includes(2))).toBe(true);
    expect(all.some((p) => p.expected.pagesWithoutText.length > 0)).toBe(true);
    const studies = all.flatMap((p) => p.answer.studies);
    expect(studies.some((s) => s.paths.some((x) => x.effect_type === "indirect"))).toBe(true);
    expect(studies.some((s) => s.paths.some((x) => x.simple_slopes.length > 0))).toBe(true);
    expect(studies.some((s) => s.condition_cells.length > 0)).toBe(true);
    expect(studies.some((s) => s.correlation_matrices.length > 0)).toBe(true);
    expect(all.some((p) => p.answer.studies.length > 1)).toBe(true);
  });
});
