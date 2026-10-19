import type { PathResult } from "@research-data/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS, type SyntheticPaper } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { repairSymbolFont } from "./normalize.js";
import { verifyFull, type FullData } from "./verify-full.js";

const layers = new Map<string, PdfTextLayer>();

beforeAll(async () => {
  for (const p of SYNTHETIC_PAPERS) layers.set(p.id, await readTextLayer(await renderPdf(p.render)));
});

const clone = <T>(v: T): T => structuredClone(v);
const badgeOf = (rows: ReturnType<typeof verifyFull>, key: string) => {
  const row = rows.find((r) => r.naturalKey === key);
  if (!row) throw new Error(`no field ${key}; have ${rows.map((r) => r.naturalKey).join(", ")}`);
  return row;
};

describe.each(SYNTHETIC_PAPERS.map((p) => [p.id, p] as [string, SyntheticPaper]))("verifyFull on %s", (id, paper) => {
  it("gives the answer key ✓ (◇ for T3), ⚠ only where expected, and hides nothing", () => {
    const rows = verifyFull(layers.get(id)!, paper.answer);
    const wrong = rows
      .filter((r) => {
        const expected = paper.expected.attention.includes(r.naturalKey) ? "needs_attention" : r.tier === "T3" ? "ai_interpreted" : "auto_verified";
        return r.badge !== expected;
      })
      .map((r) => `${r.naturalKey}: ${r.badge} (${r.checks.filter((c) => !c.passed).map((c) => c.detail).join("; ")})`);
    expect(wrong).toEqual([]);
    for (const key of paper.expected.attention) expect(badgeOf(rows, key).badge).toBe("needs_attention");
  });

  it("covers every value of the key with a unique natural key", () => {
    const rows = verifyFull(layers.get(id)!, paper.answer);
    const keys = rows.map((r) => r.naturalKey);
    expect(new Set(keys).size).toBe(keys.length);
    const paths = paper.answer.studies.flatMap((s) => s.paths);
    expect(rows.filter((r) => r.fieldName === "estimate" || r.fieldName === "indirect_effect").length).toBe(
      paths.filter((p) => p.estimate !== null).length + paths.filter((p) => p.indirect_effect !== null).length,
    );
    const cells = paper.answer.studies.flatMap((s) => s.correlation_matrices.flatMap((m) => m.cells));
    expect(rows.filter((r) => r.fieldName === "r")).toHaveLength(cells.length);
  });
});

describe("verifyFull catches wrong extractions", () => {
  const p01 = SYNTHETIC_PAPERS[0]!;
  const p03 = SYNTHETIC_PAPERS[2]!;
  const run = (paper: SyntheticPaper, edit: (d: FullData) => void) => {
    const data = clone(paper.answer);
    edit(data);
    return verifyFull(layers.get(paper.id)!, data);
  };
  const h1 = (d: FullData) => d.studies[0]!.paths[0]! as PathResult;
  const H1 = "study_1:h1:influencer_credibility->brand_trust:direct";

  it("hides a number that is not printed on the evidence page", () => {
    const rows = run(p01, (d) => (h1(d).estimate = 0.47));
    expect(badgeOf(rows, `${H1}:estimate`).badge).toBe("hidden");
  });

  it("hides a value whose quote is invented", () => {
    const rows = run(p01, (d) => (d.studies[0]!.sample.n_evidence = { ...d.studies[0]!.sample.n_evidence!, quote: "We surveyed 412 managers across Europe in 2023." }));
    expect(badgeOf(rows, "study_1:n").badge).toBe("hidden");
  });

  it("hides a value without the evidence the schema requires", () => {
    const rows = run(p01, (d) => (d.studies[0]!.sample.n_evidence = null));
    expect(badgeOf(rows, "study_1:n").checks.map((c) => c.name)).toEqual(["has_evidence"]);
    expect(badgeOf(rows, "study_1:n").badge).toBe("hidden");
  });

  it("corrects an evidence page that is off by one", () => {
    const rows = run(p01, (d) => (d.studies[0]!.sample.n_evidence = { ...d.studies[0]!.sample.n_evidence!, pdf_page: 3 }));
    const n = badgeOf(rows, "study_1:n");
    expect(n.badge).toBe("auto_verified");
    expect(n.evidence.pdfPage).toBe(2);
  });

  it("flags ⚠ when the status contradicts p, the sign contradicts the estimate, or the CI misses the estimate", () => {
    const rows = run(p01, (d) => {
      const h3 = d.studies[0]!.paths[2]!;
      h3.p_reported_as = "= .41";
      h3.status = "supported";
      h1(d).observed_sign = "negative";
      h1(d).ci_low = 0.5;
      h1(d).ci_high = 0.6;
    });
    const estimate = badgeOf(rows, `${H1}:estimate`);
    expect(estimate.badge).toBe("needs_attention");
    expect(estimate.checks.filter((c) => !c.passed).map((c) => c.name).sort()).toEqual(["ci_contains", "sign_consistent"]);
    const h3Status = badgeOf(rows, "study_1:h3:influencer_credibility->purchase_intention:direct:status");
    expect(h3Status.checks.find((c) => c.name === "status_consistent")?.passed).toBe(false);
  });

  it("flags a correlation outside [−1, 1] or outside the lower triangle", () => {
    const rows = run(p01, (d) => {
      d.studies[0]!.correlation_matrices[0]!.cells.push({ i: 0, j: 2, r: 0.39 });
    });
    const bad = badgeOf(rows, "study_1:corr:table_2:r:0,2");
    expect(bad.checks.find((c) => c.name === "cell_index")?.passed).toBe(false);
  });

  it("flags a reversed bootstrap CI (both bounds printed on the page) with ⚠", () => {
    const rows = run(p03, (d) => (d.studies[0]!.paths[0]!.boot_ci = [0.19, 0.06]));
    const ci = badgeOf(rows, "study_1:h1:perceived_transparency->loyalty:indirect:boot_ci");
    expect(ci.badge).toBe("needs_attention");
    expect(ci.checks.filter((c) => !c.passed).map((c) => c.name).sort()).toEqual(["ci_contains", "ci_order"]);
  });

  it("hides a bootstrap CI whose bounds are not printed", () => {
    const rows = run(p03, (d) => (d.studies[0]!.paths[0]!.boot_ci = [0.13, 0.19]));
    expect(badgeOf(rows, "study_1:h1:perceived_transparency->loyalty:indirect:boot_ci").badge).toBe("hidden");
  });

  it("keeps the two simple slopes of a moderator apart", () => {
    const keys = verifyFull(layers.get(p03.id)!, p03.answer).map((r) => r.naturalKey).filter((k) => k.includes(":slope:"));
    expect(keys).toEqual([
      "study_2:h2:perceived_transparency_x_brand_familiarity->brand_trust:interaction:slope:minus_1_sd",
      "study_2:h2:perceived_transparency_x_brand_familiarity->brand_trust:interaction:slope:plus_1_sd",
    ]);
  });

  it("shows evidence on an image-only page with ⚠ instead of hiding it", () => {
    const rows = verifyFull(layers.get(p03.id)!, p03.answer);
    const design = badgeOf(rows, "study_2:research_design");
    expect(design.badge).toBe("needs_attention");
    expect(design.checks[0]!.detail).toMatch(/không có text/);
  });

  it("puts every T1/T2 field of a scanned PDF on ⚠", () => {
    const layer = { ...layers.get(p01.id)!, needsOcr: true };
    const rows = verifyFull(layer, p01.answer);
    expect(rows.filter((r) => r.tier !== "T3").every((r) => r.badge === "needs_attention")).toBe(true);
  });
});

describe("repairSymbolFont", () => {
  it("restores signs a symbol font maps to other characters (Emerald PDFs)", () => {
    expect(repairSymbolFont("H1 þ 0.294 * H1 is supported")).toBe("H1 + 0.294 * H1 is supported");
    expect(repairSymbolFont("H2 2 2 0.288 * H2 is supported þ")).toBe("H2 − − 0.288 * H2 is supported +");
    expect(repairSymbolFont("Notes: * p , 0 : 05 (GFI ¼ 0 : 901)")).toBe("Notes: * p < 0.05 (GFI = 0.901)");
  });

  it("leaves ordinary text alone", () => {
    expect(repairSymbolFont("Study 2 0.31 is fine")).toBeNull();
  });
});

describe("p written with significance stars", () => {
  it("reads the threshold after the stars", async () => {
    const { parsePValue, pValueForms } = await import("./number.js");
    expect(parsePValue("* p < 0.05")).toEqual({ operator: "<", value: 0.05 });
    expect(parsePValue("***p<.001")).toEqual({ operator: "<", value: 0.001 });
    expect(pValueForms("** p < .01")).toContain("<.01");
  });
});
