import { beforeAll, describe, expect, it } from "vitest";
import { canonicalIndexes, mapExtraction } from "../mapping/extraction.js";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { analysePaper } from "../verify/analyse.js";
import type { FieldVerification } from "../verify/checks.js";
import type { FullData } from "../verify/verify-full.js";
import { buildPlan, rowBadge, sanitize } from "./plan-full.js";

const [p01, p02, p03] = SYNTHETIC_PAPERS as [(typeof SYNTHETIC_PAPERS)[0], (typeof SYNTHETIC_PAPERS)[0], (typeof SYNTHETIC_PAPERS)[0]];
const layers = new Map<string, PdfTextLayer>();
beforeAll(async () => {
  for (const p of SYNTHETIC_PAPERS) layers.set(p.id, await readTextLayer(await renderPdf(p.render)));
});

function plan(paper: typeof p01, edit: (d: FullData) => void = () => {}) {
  const data = structuredClone(paper.answer);
  edit(data);
  const analysis = analysePaper(layers.get(paper.id)!, data);
  return { plan: buildPlan({ data, analysis, mapping: mapExtraction(data, canonicalIndexes()) }), analysis };
}

const field = (naturalKey: string, badge: FieldVerification["badge"]): FieldVerification => ({
  naturalKey,
  fieldName: naturalKey,
  tier: "T1",
  value: 1,
  evidence: { pdfPage: 1, quote: "q" },
  badge,
  checks: [],
});

describe("rowBadge", () => {
  it("is ✓ only when every shown field is ✓, ⚠ when one is, ◇ when all are interpretations", () => {
    expect(rowBadge([field("a", "auto_verified"), field("b", "auto_verified")], ["a"])).toBe("auto_verified");
    expect(rowBadge([field("a", "auto_verified"), field("b", "needs_attention")], ["a"])).toBe("needs_attention");
    expect(rowBadge([field("a", "ai_interpreted"), field("b", "ai_interpreted")], ["a"])).toBe("ai_interpreted");
  });

  it("hides the row when every key field is hidden, but not for a hidden side field", () => {
    expect(rowBadge([field("a", "hidden"), field("b", "auto_verified")], ["a"])).toBe("hidden");
    expect(rowBadge([field("a", "auto_verified"), field("b", "hidden")], ["a"])).toBe("auto_verified");
    expect(rowBadge([field("a", "hidden")], ["z"])).toBe("hidden");
  });

  it("asks for attention when a row has no verified field at all", () => {
    expect(rowBadge([], ["a"])).toBe("needs_attention");
  });
});

describe("buildPlan on the synthetic answer keys", () => {
  it("makes one row per extracted object with its natural key, run and badge", () => {
    const { plan: p } = plan(p03);
    const count = (table: string) => p.rows.filter((r) => r.table === table).length;
    expect(count("studies")).toBe(2);
    expect(count("samples")).toBe(2);
    expect(count("path_results")).toBe(3);
    expect(count("paper_theories")).toBe(0);
    expect(count("paper_statements")).toBe(1);
    const keys = p.rows.map((r) => r.naturalKey);
    expect(new Set(keys).size).toBe(keys.length);
    const study2 = p.rows.find((r) => r.table === "studies" && r.naturalKey === "study_2")!;
    expect(study2.source).toEqual({ pass: "study_design_sample_bias", studyLabel: "Study 2" });
    expect(study2.columns).toMatchObject({ study_label: "Study 2", research_design: "online_experiment" });
    expect(study2.badge).toBe("needs_attention"); // its design is read from an image-only page
  });

  it("copies verified values to their columns and maps concepts", () => {
    const { plan: p } = plan(p01);
    const h1 = p.rows.find((r) => r.table === "path_results" && r.naturalKey.startsWith("study_1:h1"))!;
    expect(h1.columns).toMatchObject({
      estimate: 0.48,
      t_or_z: 8.4,
      status: "supported",
      effect_type: "direct",
      iv_construct_id: "influencer_credibility",
      dv_construct_id: "brand_trust",
      stat_consistency: "consistent",
    });
    expect(h1.badge).toBe("auto_verified");
    expect(h1.fieldColumns.estimate).toBe(`${h1.naturalKey}:estimate`);
    const m = p.rows.find((r) => r.table === "measurements" && r.naturalKey.endsWith("brand_trust"))!;
    expect(m.columns).toMatchObject({ canonical_construct_id: "brand_trust", alpha: 0.86, cr: 0.9, ave: 0.7 });
    const matrix = p.rows.find((r) => r.table === "correlation_matrices")!;
    expect(matrix.cells).toEqual([{ i: 1, j: 0, r: 0.48 }, { i: 2, j: 0, r: 0.39 }, { i: 2, j: 1, r: 0.52 }]);
    expect(p.paper).toMatchObject({ paper_type: "empirical_quant", completeness_status: "complete", missing_items: [] });
  });

  it("empties a column whose value failed the check, but keeps the row visible", () => {
    const { plan: p, analysis } = plan(p01, (d) => (d.studies[0]!.paths[0]!.r2_dv = 0.123)); // not printed anywhere in the paper
    const h1 = p.rows.find((r) => r.table === "path_results" && r.naturalKey.startsWith("study_1:h1"))!;
    expect(analysis.fields.find((f) => f.naturalKey === `${h1.naturalKey}:r2_dv`)!.badge).toBe("hidden");
    expect(h1.columns.r2_dv).toBeNull();
    expect(h1.columns.estimate).toBe(0.48);
    expect(h1.badge).toBe("auto_verified");
  });

  it("hides the whole row when the key value failed the check, and keeps its values for the owner", () => {
    const { plan: p } = plan(p01, (d) => (d.studies[0]!.paths[0]!.estimate = 0.47));
    const h1 = p.rows.find((r) => r.table === "path_results" && r.naturalKey.startsWith("study_1:h1"))!;
    expect(h1.badge).toBe("hidden");
    expect(h1.columns.estimate).toBe(0.47);
  });

  it("flags missing items in the paper columns", () => {
    const { plan: p } = plan(p01, (d) => (d.studies[0]!.paths = d.studies[0]!.paths.filter((x) => x.hypothesis_code !== "H3")));
    expect(p.paper).toMatchObject({ completeness_status: "incomplete", missing_items: ["hypothesis:H3"] });
  });

  it("keeps experimental cells with their test and effect size", () => {
    const { plan: p } = plan(p02);
    const cells = p.rows.filter((r) => r.table === "condition_cells");
    expect(cells).toHaveLength(4);
    expect(cells[0]!.columns).toMatchObject({ mean: 5.12, sd: 1.1, n: 106, test_stat_type: "F", test_stat_value: 18.2, effect_size_type: "partial_eta_squared", source_table: "Table 1" });
  });
});

describe("sanitize", () => {
  it("empties values the database would refuse, and leaves valid ones", () => {
    const columns: Record<string, unknown> = { p_value: 3, exclusion_rate: -0.1, sd: -2, se: 0.2, ci_low: 0.9, ci_high: 0.1, boot_ci_low: 0.1, boot_ci_high: 0.4 };
    sanitize(columns);
    expect(columns).toEqual({ p_value: null, exclusion_rate: null, sd: null, se: 0.2, ci_low: null, ci_high: null, boot_ci_low: 0.1, boot_ci_high: 0.4 });
  });
});
