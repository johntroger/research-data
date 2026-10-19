import { beforeAll, describe, expect, it } from "vitest";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { analysePaper } from "./analyse.js";
import { compareExtractions, pairConstructs, pairPaths, pairTheories, sameValue, similarText } from "./compare.js";
import type { FullData } from "./verify-full.js";

const f = (naturalKey: string, fieldName: string, value: unknown) => ({ naturalKey, fieldName, value });
const construct = (prefix: string, alpha: number | null, cr: number | null, ave: number | null) => [
  f(`${prefix}:label`, "construct_label_original", prefix),
  f(`${prefix}:alpha`, "alpha", alpha),
  f(`${prefix}:CR`, "CR", cr),
  f(`${prefix}:AVE`, "AVE", ave),
];

describe("sameValue for long texts", () => {
  const social = "The social dimension refers to the relationship of the firm with its socio-cultural environment";

  it("treats a passage that starts or ends at another word as the same passage", () => {
    expect(sameValue(social, `Finally, ${social.toLowerCase()}.`)).toBe(true);
    expect(sameValue(social, social.replace("relationship", "relationships"))).toBe(true); // one word of ~14 differs
  });

  it("does not turn two different statements into one", () => {
    expect(sameValue(social, "Consumers trust platforms that give them control over what information is shared and with whom")).toBe(false);
  });

  it("keeps short values strict: survey is not surveys", () => {
    expect(sameValue("survey", "surveys")).toBe(false);
    expect(sameValue(["cb_sem"], ["cb_sem", "t_test"])).toBe(false);
  });

  it("never lets a flipped meaning or another number pass as the same text", () => {
    const a = "The effect of price on loyalty was significant and strong across all three samples that we tested";
    expect(sameValue(a, a.replace("was significant", "was not significant"))).toBe(false);
    expect(sameValue(a, a.replace("was significant", "was insignificant"))).toBe(false);
    const p = "The model explained the variance of loyalty well (R2 = .32, p = .03) in the large sample of consumers";
    expect(sameValue(p, p.replace(".32", ".23"))).toBe(false);
    expect(similarText("alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu", "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu")).toBe(true);
  });
});

describe("pairConstructs", () => {
  it("pairs a construct the two extractors named differently by its reliability numbers", () => {
    const sync = construct("study_1:m:positive_negative_valence_or_polarity", 0.74, 0.85, 0.66);
    const batch = construct("study_1:m:polarity", 0.74, 0.85, 0.66);
    const { fields, pairs } = pairConstructs(sync, batch);
    expect(pairs).toBe(1);
    expect(fields.map((x) => x.naturalKey)).toEqual(sync.map((x) => x.naturalKey));
    expect(fields[0]!.value).toBe("study_1:m:polarity"); // values are not touched, only keys
  });

  it("leaves constructs with the same key alone", () => {
    const both = construct("study_1:m:trust", 0.9, 0.93, 0.7);
    expect(pairConstructs(both, both)).toMatchObject({ pairs: 0 });
  });

  it("pairs nothing when two constructs have the same numbers (a wrong pairing would hide a real difference)", () => {
    const sync = [...construct("study_1:m:a", 0.8, 0.85, 0.6), ...construct("study_1:m:b", 0.8, 0.85, 0.6)];
    const batch = construct("study_1:m:c", 0.8, 0.85, 0.6);
    expect(pairConstructs(sync, batch)).toMatchObject({ pairs: 0 });
  });

  it("pairs nothing when the numbers differ or too few are reported", () => {
    expect(pairConstructs(construct("study_1:m:a", 0.8, 0.85, 0.6), construct("study_1:m:b", 0.81, 0.85, 0.6))).toMatchObject({ pairs: 0 });
    expect(pairConstructs(construct("study_1:m:a", 0.8, null, null), construct("study_1:m:b", 0.8, null, null))).toMatchObject({ pairs: 0 });
  });

  it("pairs one construct to one only", () => {
    const sync = construct("study_1:m:a", 0.8, 0.85, 0.6);
    const batch = [...construct("study_1:m:b", 0.8, 0.85, 0.6), ...construct("study_1:m:c", 0.8, 0.85, 0.6)];
    expect(pairConstructs(sync, batch)).toMatchObject({ pairs: 0 });
  });
});

describe("pairTheories", () => {
  it("pairs a theory whose name is the start of the other's", () => {
    const sync = [f("theory:communication_privacy_management_cpm_theory", "theory_name_original", "x"), f("theory:communication_privacy_management_cpm_theory:role", "application_role", "extended")];
    const batch = [f("theory:communication_privacy_management", "theory_name_original", "x"), f("theory:communication_privacy_management:role", "application_role", "extended")];
    const { fields, pairs } = pairTheories(sync, batch);
    expect(pairs).toBe(1);
    expect(fields.map((x) => x.naturalKey)).toEqual(sync.map((x) => x.naturalKey));
  });

  it("does not pair names that merely share a word", () => {
    expect(pairTheories([f("theory:social_exchange_theory", "theory_name_original", "a")], [f("theory:social_identity_theory", "theory_name_original", "b")])).toMatchObject({ pairs: 0 });
  });
});

describe("pairPaths", () => {
  const path = (key: string, estimate: number | null, t: number | null) => [f(`${key}:estimate`, "estimate", estimate), f(`${key}:t_or_z`, "t_or_z", t), f(`${key}:status`, "status", "supported")];

  it("pairs a path by its estimate and test statistic, whatever the variables were called, also reversed", () => {
    const sync = path("study_2::cpe_scale->proxy_item_name:direct", 0.44, 5.1);
    const batch = path("study_2::proxy_item_name->cpe_score:direct", 0.44, 5.1);
    const { fields, pairs } = pairPaths(sync, batch);
    expect(pairs).toBe(1);
    expect(fields.map((x) => x.naturalKey)).toEqual(sync.map((x) => x.naturalKey));
  });

  it("pairs nothing when two paths share the estimate", () => {
    const sync = [...path("study_1:h1:a->b:direct", 0.3, 2.1), ...path("study_1:h2:c->d:direct", 0.3, 2.1)];
    expect(pairPaths(sync, path("study_1:h9:x->y:direct", 0.3, 2.1))).toMatchObject({ pairs: 0 });
  });

  it("ignores fields that are not path rows", () => {
    expect(pairPaths([f("limitation:1", "limitation", "x")], [f("limitation:2", "limitation", "y")])).toMatchObject({ pairs: 0 });
  });
});

describe("compareExtractions pairs by content", () => {
  let layer: PdfTextLayer;
  const paper = SYNTHETIC_PAPERS[0]!;
  beforeAll(async () => {
    layer = await readTextLayer(await renderPdf(paper.render));
  });
  const side = (edit: (d: FullData) => void = () => {}) => {
    const data = structuredClone(paper.answer);
    edit(data);
    return { data, analysis: analysePaper(layer, data) };
  };

  it("counts a construct renamed by the second extractor as the same construct", () => {
    const renamed = side((d) => {
      d.studies[0]!.measurements[0]!.construct_label_original = `${d.studies[0]!.measurements[0]!.construct_label_original} (renamed)`;
    });
    const c = compareExtractions(side(), renamed);
    expect(c.paired.constructs).toBe(1);
    // Only the label itself differs; every other field of the construct is paired and equal.
    expect(c.keys.different.map((d) => d.key.split("#")[1])).toEqual(["construct_label_original"]);
    expect(c.keys.onlySync).toEqual([]);
    expect(c.keys.onlyBatch).toEqual([]);
  });

  it("reports structured values and free text apart, and judges the criterion on the structured ones", () => {
    const c = compareExtractions(side(), side());
    expect(c.agreement.structured.shared).toBeGreaterThan(0);
    expect(c.agreement.structured.equal).toBe(c.agreement.structured.shared);
    expect(c.agreement.structured.shared + c.agreement.freeText.shared).toBe(c.keys.shared);
    expect(c.criteria.map((x) => x.name)).toContain("structured values ≥ 90% equal");
  });
});
