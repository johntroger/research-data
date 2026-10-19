import { beforeAll, describe, expect, it } from "vitest";
import { passOf } from "../synthetic/answer-generator.js";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { topUp } from "../extract/topup.js";
import { SYNTHETIC_PAPERS, type SyntheticPaper } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { analysePaper } from "./analyse.js";
import { hypothesisCodesInText, tableCaptionsInText, tableKey } from "./completeness.js";
import type { FullData } from "./verify-full.js";

const layers = new Map<string, PdfTextLayer>();
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  for (const p of SYNTHETIC_PAPERS) {
    pdfs.set(p.id, await renderPdf(p.render));
    layers.set(p.id, await readTextLayer(pdfs.get(p.id)!));
  }
});

const [p01, p02, p03] = SYNTHETIC_PAPERS as [SyntheticPaper, SyntheticPaper, SyntheticPaper];
const clone = <T>(v: T): T => structuredClone(v);
const analyse = (paper: SyntheticPaper, edit: (d: FullData) => void = () => {}) => {
  const data = clone(paper.answer);
  edit(data);
  return analysePaper(layers.get(paper.id)!, data);
};
const row = (a: ReturnType<typeof analysePaper>, key: string) => {
  const r = a.fields.find((f) => f.naturalKey === key);
  if (!r) throw new Error(`no field ${key}`);
  return r;
};
const failed = (r: { checks: { name: string; passed: boolean }[] }) => r.checks.filter((c) => !c.passed).map((c) => c.name);

describe("the answer keys pass every cross-check", () => {
  it.each(SYNTHETIC_PAPERS.map((p) => [p.id, p] as const))("%s: complete, no failed check besides the expected ⚠", (_id, paper) => {
    const a = analyse(paper);
    expect(a.missing).toEqual([]);
    expect(a.completeness).toBe("complete");
    const wrong = a.fields
      .filter((f) => f.badge === "hidden" || (f.badge === "needs_attention" && !paper.expected.attention.includes(f.naturalKey)))
      .map((f) => `${f.naturalKey}: ${failed(f).join(", ")}`);
    expect(wrong).toEqual([]);
    expect(a.stats.every((s) => s.status === "consistent")).toBe(true);
  });

  it("recomputes the statistics that the keys print", () => {
    expect(analyse(p01).stats).toMatchObject([{ stat: "t = 8.4", reported: "< .001", status: "consistent" }, { stat: "t = 6.1" }]);
    expect(analyse(p02).stats).toMatchObject([{ stat: "F(1, 416) = 18.2", reported: "< .001", status: "consistent" }]);
  });
});

describe("cross-checks catch planted errors", () => {
  it("n of the method differs from n of the correlation table", () => {
    const a = analyse(p01, (d) => (d.studies[0]!.correlation_matrices[0]!.n = 3)); // 3 is printed on that page (a column header), but is not the sample size
    expect(failed(row(a, "study_1:corr:table_2:n"))).toContain("n_consistent");
    expect(row(a, "study_1:corr:table_2:n").badge).toBe("needs_attention");
    expect(failed(row(a, "study_1:n"))).toContain("n_consistent");
  });

  it("experimental cells do not add up to the study n", () => {
    const a = analyse(p02, (d) => (d.studies[0]!.condition_cells[3]!.n = 90));
    expect(failed(row(a, "study_1:cell:no_brand:consumer_skepticism:n"))).toContain("cells_sum_to_n");
  });

  it("a single-predictor beta far from the correlation", () => {
    const a = analyse(p01, (d) => (d.studies[0]!.correlation_matrices[0]!.cells[0]!.r = 0.2));
    expect(failed(row(a, "study_1:h1:influencer_credibility->brand_trust:direct:estimate"))).toContain("beta_matches_r");
    expect(failed(row(a, "study_1:corr:table_2:r:1,0"))).toContain("beta_matches_r");
  });

  it("does not compare a beta with r when the DV has several predictors", () => {
    const a = analyse(p01);
    expect(row(a, "study_1:h2:brand_trust->purchase_intention:direct:estimate").checks.some((c) => c.name === "beta_matches_r")).toBe(false);
  });

  it("measurement table and descriptives give different reliability", () => {
    const a = analyse(p01, (d) => {
      const m = d.studies[0]!.correlation_matrices[0]!;
      m.descriptives = [{ variable: "Brand Trust", mean: 5.1, sd: 1.2, alpha: 0.91, cr: null, ave: null }];
    });
    expect(failed(row(a, "study_1:m:brand_trust:alpha"))).toContain("reliability_consistent");
  });

  it("a duplicated correlation cell", () => {
    const a = analyse(p01, (d) => d.studies[0]!.correlation_matrices[0]!.cells.push({ i: 1, j: 0, r: 0.48 }));
    expect(a.fields.filter((f) => f.fieldName === "r" && failed(f).includes("cell_duplicate")).length).toBeGreaterThan(0);
  });
});

describe("recomputed statistics", () => {
  it("a test statistic the PDF does not print is blamed on the extraction", () => {
    const a = analyse(p02, (d) => d.studies[0]!.condition_cells.forEach((c) => (c.test_stat = { type: "F", value: 5.55 })));
    const stat = a.stats[0]!;
    expect(stat.status).toBe("inconsistent"); // F(1, 416) = 5.55 gives p = .019, the paper says < .001: both significant
    expect(stat.recomputed).toBeGreaterThan(0.01);
    expect(stat.recomputed).toBeLessThan(0.03);
    expect(stat.errorSource).toBe("extraction");
  });

  it("a test statistic printed in the PDF that disagrees with its p is blamed on the paper", () => {
    // 4.10 is printed (for the interaction test), so the numbers are found; p < .001 is what does not follow from it.
    const a = analyse(p02, (d) => d.studies[0]!.condition_cells.forEach((c) => (c.test_stat = { type: "F", value: 4.1 })));
    expect(a.stats[0]).toMatchObject({ status: "inconsistent", errorSource: "original_paper" });
    expect(failed(row(a, "study_1:cell:yes_influencer:consumer_skepticism:test_stat"))).toContain("stat_recomputed");
    expect(row(a, "study_1:cell:yes_influencer:consumer_skepticism:test_stat").checks.find((c) => c.name === "stat_recomputed")!.detail).toMatch(/lỗi của bài gốc/);
  });

  it("a conclusion that flips is a decision error", () => {
    const a = analyse(p01, (d) => {
      const h3 = d.studies[0]!.paths[2]!;
      h3.p_reported_as = "< .05"; // t = 1.21 really gives p = .23
    });
    expect(a.stats.find((s) => s.stat === "t = 1.21")).toMatchObject({ status: "decision_error" });
    expect(failed(row(a, "study_1:h3:influencer_credibility->purchase_intention:direct:t_or_z"))).toContain("stat_recomputed");
  });

  it("t implied by estimate / SE and SE implied by the CI", () => {
    const a = analyse(p01, (d) => {
      const h1 = d.studies[0]!.paths[0]!;
      h1.se = 0.2; // 0.48 / 0.2 = 2.4, the paper prints 8.40
    });
    expect(failed(row(a, "study_1:h1:influencer_credibility->brand_trust:direct:t_or_z"))).toContain("t_from_estimate_se");
    const b = analyse(p01, (d) => {
      const h1 = d.studies[0]!.paths[0]!;
      h1.se = 0.057;
      h1.ci_low = 0.1;
      h1.ci_high = 0.9;
      h1.ci_method = "normal";
    });
    expect(failed(row(b, "study_1:h1:influencer_credibility->brand_trust:direct:se"))).toContain("se_from_ci");
  });
});

describe("completeness", () => {
  it("scans hypothesis codes (printed at least twice) and table captions", () => {
    expect(hypothesisCodesInText(layers.get(p01.id)!)).toEqual(["H1", "H2", "H3"]);
    expect(tableCaptionsInText(layers.get(p01.id)!).map((c) => c.label)).toEqual(["Table 1", "Table 2", "Table 3"]);
    expect(tableKey("TABLE IV.")).toBe("table 4");
    expect(tableKey("Tab. 3")).toBe("table 3");
    expect(tableKey("Table A1")).toBe("table a1");
  });

  it("names a hypothesis that has no extracted path, and one the AI did not list", () => {
    const a = analyse(p01, (d) => {
      d.studies[0]!.paths = d.studies[0]!.paths.filter((p) => p.hypothesis_code !== "H3");
      d.structure.hypothesis_codes = ["H1", "H2"];
    });
    expect(a.completeness).toBe("incomplete");
    expect(a.missing.map((m) => `${m.kind}:${m.item}`).sort()).toEqual(["hypothesis_not_listed:H3"]);
    const b = analyse(p01, (d) => (d.studies[0]!.paths = d.studies[0]!.paths.filter((p) => p.hypothesis_code !== "H3")));
    expect(b.missing.map((m) => `${m.kind}:${m.item}`)).toEqual(["hypothesis_without_path:H3"]);
    expect(b.missing[0]!.note).toBe("Bài có H3 nhưng chưa trích được kết quả kiểm định");
  });

  it("names a table that was not listed, a matrix and condition cells that were not extracted", () => {
    const a = analyse(p01, (d) => {
      d.structure.tables = d.structure.tables.filter((t) => t.table_label !== "Table 1");
      d.studies[0]!.correlation_matrices = [];
    });
    expect(a.missing.map((m) => `${m.kind}:${m.item}`).sort()).toEqual(["matrix_missing:Table 2", "table_not_listed:Table 1"]);
    const b = analyse(p02, (d) => (d.studies[0]!.condition_cells = []));
    expect(b.missing.map((m) => `${m.kind}:${m.item}`)).toEqual(["cells_missing:Table 1"]);
  });
});

describe("top-up extraction", () => {
  /** Fake Gemini for top-up calls: answers from the key, limited to what the schema allows. */
  function fake(paper: SyntheticPaper, onCall: (prompt: string) => void) {
    return async (req: { jsonSchema: Record<string, unknown>; prompt: string }) => {
      onCall(req.prompt);
      const pass = passOf(req as never);
      const label = /study "([^"]+)"/.exec(req.prompt)?.[1];
      const study = paper.answer.studies.find((s) => s.study_label === label)!;
      const body =
        pass === "study_paths"
          ? { paths: study.paths }
          : { correlation_matrices: study.correlation_matrices, condition_cells: study.condition_cells };
      return { text: JSON.stringify(body), usage: { inputTokens: 3000, outputTokens: 500 } };
    };
  }

  it("extracts only the missing hypothesis, never replaces what exists, and the paper becomes complete", async () => {
    const data = clone(p01.answer);
    const original = clone(data.studies[0]!.paths);
    data.studies[0]!.paths = original.filter((p) => p.hypothesis_code !== "H3");
    const before = analysePaper(layers.get(p01.id)!, data);
    expect(before.missing).toHaveLength(1);

    const prompts: string[] = [];
    const result = await topUp(pdfs.get(p01.id)!, data, before.missing, { model: "gemini-4-argon", generate: fake(p01, (p) => prompts.push(p)) as never });
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain("hypotheses H3");
    expect(result.added).toEqual(["H3"]);
    expect(result.data.studies[0]!.paths.map((p) => p.hypothesis_code)).toEqual(["H1", "H2", "H3"]);
    expect(result.data.studies[0]!.paths.slice(0, 2)).toEqual(original.slice(0, 2));
    expect(result.calls).toHaveLength(1);
    expect(analysePaper(layers.get(p01.id)!, result.data).completeness).toBe("complete");
  });

  it("extracts a missing matrix, trying only the study the table belongs to", async () => {
    const data = clone(p03.answer);
    data.structure.tables = [{ table_label: "Table 2", pdf_page: 3, kind: "correlation", study_label: "Study 2" }];
    const study2 = data.studies[1]!;
    const m = clone(p01.answer.studies[0]!.correlation_matrices[0]!);
    study2.correlation_matrices = [];
    const missing = analysePaper(layers.get(p03.id)!, data).missing.filter((x) => x.kind === "matrix_missing");
    expect(missing).toHaveLength(1);

    const prompts: string[] = [];
    const generate = async (req: { prompt: string; jsonSchema: Record<string, unknown> }) => {
      prompts.push(req.prompt);
      return { text: JSON.stringify({ correlation_matrices: [m], condition_cells: [] }), usage: { inputTokens: 3000, outputTokens: 500 } };
    };
    const result = await topUp(pdfs.get(p03.id)!, data, missing, { model: "gemini-4-argon", generate: generate as never });
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain('study "Study 2"');
    expect(result.added).toEqual(["Table 2"]);
    expect(result.data.studies[1]!.correlation_matrices).toHaveLength(1);
  });

  it("leaves an item missing when the extra call does not find it, and survives an unparsable answer", async () => {
    const data = clone(p01.answer);
    data.studies[0]!.paths = data.studies[0]!.paths.filter((p) => p.hypothesis_code !== "H3");
    const missing = analysePaper(layers.get(p01.id)!, data).missing;
    const generate = async () => ({ text: "not json", usage: { inputTokens: 3000, outputTokens: 5 } });
    const result = await topUp(pdfs.get(p01.id)!, data, missing, { model: "gemini-4-argon", generate });
    expect(result.added).toEqual([]);
    expect(result.calls).toHaveLength(1); // still paid for, and recorded
    expect(analysePaper(layers.get(p01.id)!, result.data).missing).toHaveLength(1);
  });

  it("does nothing, and costs nothing, when nothing is missing", async () => {
    let calls = 0;
    const result = await topUp(pdfs.get(p01.id)!, clone(p01.answer), [], { model: "gemini-4-argon", generate: async () => (calls++, { text: "{}", usage: { inputTokens: 0, outputTokens: 0 } }) });
    expect(calls).toBe(0);
    expect(result.added).toEqual([]);
  });
});
