import { CANONICAL_CONSTRUCTS } from "@research-data/schema";
import { describe, expect, it } from "vitest";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { canonicalConstructEntities, canonicalIndexes, mapExtraction } from "./extraction.js";
import { buildIndex, collidingKeys, mapLabel } from "./labels.js";

const { constructs, theories } = canonicalIndexes();
const map = (label: string) => mapLabel(label, constructs);

describe("the canonical lists are safe to map against", () => {
  it("no name or alias belongs to two constructs", () => {
    expect(collidingKeys(constructs)).toEqual([]);
    expect(collidingKeys(theories)).toEqual([]);
  });

  it("every canonical name and alias maps back to its own construct", () => {
    for (const c of CANONICAL_CONSTRUCTS) {
      for (const name of [c.canonical_name, ...c.aliases]) {
        expect({ name, mapping: map(name) }).toMatchObject({ mapping: { status: "mapped", id: c.id, confidence: 1, method: "exact" } });
      }
    }
  });
});

describe("merges only what is certain", () => {
  it("merges case, spacing, punctuation and plural variants", () => {
    expect(map("brand trust")).toMatchObject({ status: "mapped", id: "brand_trust" });
    expect(map("  BRAND   TRUST ")).toMatchObject({ id: "brand_trust" });
    expect(map("Purchase Intentions")).toMatchObject({ id: "purchase_intention" });
    expect(map("Word of mouth intention")).toMatchObject({ id: "wom_intention" });
    expect(map("Social Media Marketing Activity")).toMatchObject({ id: "social_media_marketing_activities" });
    expect(map("e-WOM")).toMatchObject({ id: "ewom" });
    expect(map("Consumer–Brand")).toMatchObject({ status: "separate" });
  });

  it("uses an abbreviation in brackets, and agrees with the name when both are given", () => {
    expect(map("Social media marketing activities (SMMA)")).toMatchObject({ status: "mapped", id: "social_media_marketing_activities" });
    expect(map("SMMA")).toMatchObject({ id: "social_media_marketing_activities" });
    expect(map("Perceived brand authenticity (PBA)")).toMatchObject({ id: "brand_authenticity" });
  });

  it("a conflicting name and abbreviation is ambiguous, not merged", () => {
    const m = map("Brand trust (eWOM)");
    expect(m).toMatchObject({ status: "ambiguous", id: null, confidence: 0 });
  });
});

describe("does not merge near-matches (không chắc thì tách)", () => {
  it("a narrower construct that contains a canonical name stays separate and is suggested", () => {
    const m = map("Green purchase intentions");
    expect(m).toMatchObject({ status: "separate", id: null, confidence: 0, method: null });
    expect(m.suggestions.map((s) => s.id)).toEqual(["purchase_intention"]);
    expect(m.note).toMatch(/có thể gộp vào "Purchase Intention"/);
  });

  it("different constructs with similar words are not merged", () => {
    for (const label of ["Brand love and loyalty", "Perceived brand ethicality", "Consumer skepticism toward green claims", "Trust"]) {
      expect(map(label).status, label).toBe("separate");
      expect(map(label).id, label).toBeNull();
    }
    expect(map("Brand attachment")).toMatchObject({ id: "brand_attachment" }); // exact, for contrast
    expect(map("Perceived brand attachment")).toMatchObject({ status: "separate" });
  });

  it("experimental conditions and unknown names stay separate without suggestions", () => {
    expect(map("disclosed AI influencer condition")).toMatchObject({ status: "separate", suggestions: [] });
    expect(map("AI literacy")).toMatchObject({ status: "separate", suggestions: [] });
    expect(map("Green perceived risk")).toMatchObject({ status: "separate" });
  });

  it("an alias shared by two entries merges nothing", () => {
    const index = buildIndex([
      { id: "a", canonicalName: "Alpha Concept", aliases: ["AC"] },
      { id: "b", canonicalName: "Beta Concept", aliases: ["AC"] },
    ]);
    expect(collidingKeys(index)).toEqual(["ac"]);
    expect(mapLabel("AC", index)).toMatchObject({ status: "ambiguous", id: null });
    expect(mapLabel("AC", index).suggestions.map((s) => s.id).sort()).toEqual(["a", "b"]);
    expect(mapLabel("Alpha concept", index)).toMatchObject({ status: "mapped", id: "a" });
  });

  it("single-word names never produce suggestions", () => {
    expect(map("Trust").suggestions).toEqual([]);
    expect(map("Engagement").suggestions).toEqual([]);
  });
});

describe("theories", () => {
  it("maps names and abbreviations of the canonical theories", () => {
    expect(mapLabel("Stimulus-Organism-Response (S-O-R) framework", theories)).toMatchObject({ status: "mapped", id: "stimulus_organism_response" });
    expect(mapLabel("Persuasion Knowledge Model", theories)).toMatchObject({ id: "persuasion_knowledge_model" });
    expect(mapLabel("TPB", theories)).toMatchObject({ id: "planned_behavior" });
    expect(mapLabel("Uses and gratifications", theories)).toMatchObject({ id: "uses_and_gratifications" });
    expect(mapLabel("Perceived risk theory", theories)).toMatchObject({ status: "separate", id: null });
  });
});

describe("mapExtraction", () => {
  it("maps the synthetic answer keys' labels, one row per distinct label with its roles", () => {
    const m = mapExtraction(SYNTHETIC_PAPERS[0]!.answer);
    const byLabel = new Map(m.constructs.map((c) => [c.label, c]));
    expect(byLabel.get("Brand Trust")).toMatchObject({ status: "mapped", id: "brand_trust", usedAs: ["dv", "iv", "matrix", "measurement"] });
    expect(byLabel.get("Purchase Intention")).toMatchObject({ id: "purchase_intention" });
    expect(byLabel.get("Influencer Credibility")).toMatchObject({ id: "influencer_credibility" });
    expect(m.constructs).toHaveLength(3);
    expect(m.theories).toMatchObject([{ label: "S-O-R framework", status: "mapped", id: "stimulus_organism_response", usedAs: ["hypothesis_derivation"] }]);
    expect(m.summary).toEqual({ constructsMapped: 3, constructsSeparate: 0, theoriesMapped: 1, theoriesSeparate: 0 });
  });

  it("keeps what it cannot map apart, including mediators, moderators and interaction terms", () => {
    const m = mapExtraction(SYNTHETIC_PAPERS[2]!.answer);
    const byLabel = new Map(m.constructs.map((c) => [c.label, c]));
    expect(byLabel.get("Loyalty")).toMatchObject({ status: "mapped", id: "loyalty", usedAs: ["dv"] });
    expect(byLabel.get("Brand trust")).toMatchObject({ id: "brand_trust", usedAs: ["dv", "mediator"] });
    expect(byLabel.get("Perceived transparency")).toMatchObject({ status: "separate" });
    expect(byLabel.get("Perceived transparency x Brand familiarity")).toMatchObject({ status: "separate", suggestions: [] });
    expect(byLabel.get("Brand familiarity")).toMatchObject({ status: "separate", usedAs: ["moderator"] });
  });

  it("reads the same entities the database is seeded with", () => {
    expect(canonicalConstructEntities()).toHaveLength(CANONICAL_CONSTRUCTS.length);
  });
});

describe("brackets", () => {
  it("never turns a part into the whole through its bracketed tag", () => {
    expect(map("Interactivity (SMMA)")).toMatchObject({ status: "separate", id: null }); // a dimension, not the construct
    expect(map("Entertainment (SMMA)")).toMatchObject({ status: "mapped", id: "smma_entertainment" }); // exact canonical name
    expect(map("Entertainment")).toMatchObject({ status: "separate" });
  });

  it("reads a bracket as an abbreviation only when it is the initials of the name", () => {
    expect(map("Word of mouth intention (WOMI)")).toMatchObject({ id: "wom_intention" }); // name matches; bracket adds nothing
    expect(map("Customer engagement (CE)")).toMatchObject({ id: "customer_engagement" });
  });
});

describe("one name, one row", () => {
  it("merges labels that differ only by case or spacing within a paper", () => {
    const answer = structuredClone(SYNTHETIC_PAPERS[0]!.answer);
    const path = answer.studies[0]!.paths[0]!;
    path.dv_label_original = "brand  trust"; // same name as the "Brand Trust" measurement, other case and spacing
    const rows = mapExtraction(answer).constructs.filter((c) => c.id === "brand_trust");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe("Brand Trust"); // first spelling kept
    expect(rows[0]!.usedAs).toEqual(["dv", "iv", "matrix", "measurement"]);
  });
});
