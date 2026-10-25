import { describe, expect, it } from "vitest";
import { canonicalIndex, planPathChanges, planSimpleChanges } from "./map-labels.js";

const index = canonicalIndex();
const row = (o: Partial<Parameters<typeof planPathChanges>[0][number]>) => ({
  id: "r",
  iv_label_original: "X",
  dv_label_original: "Y",
  iv_construct_id: null,
  dv_construct_id: null,
  mediator_labels: [],
  moderator_labels: [],
  mediator_ids: [],
  moderator_ids: [],
  ...o,
});

describe("planPathChanges", () => {
  it("maps labels that equal a canonical name or alias, whatever their case, and leaves the rest alone", () => {
    const [c] = planPathChanges([row({ iv_label_original: "PERCEIVED BRAND ETHICALITY", dv_label_original: "Customer purchase intentions" })], index);
    expect(c).toMatchObject({ iv_construct_id: "perceived_brand_ethicality", dv_construct_id: "purchase_intention" });
    expect(planPathChanges([row({ iv_label_original: "brand age", dv_label_original: "state gratitude" })], index)).toEqual([]);
  });

  it("never changes an id that is already set, and recomputes mediator ids from the labels", () => {
    const [c] = planPathChanges([row({ iv_label_original: "Gratitude", iv_construct_id: "loyalty", mediator_labels: ["Customer commitment", "unknown thing"] })], index);
    expect(c).toMatchObject({ iv_construct_id: "loyalty", mediator_ids: ["commitment"] });
  });

  it("does not report a row whose ids already match", () => {
    expect(planPathChanges([row({ iv_label_original: "brand trust", iv_construct_id: "brand_trust" })], index)).toEqual([]);
  });

  it("keeps sub-dimensions apart (state gratitude is not customer gratitude)", () => {
    expect(planPathChanges([row({ iv_label_original: "state gratitude", dv_label_original: "trait gratitude" })], index)).toEqual([]);
  });
});

describe("planSimpleChanges", () => {
  it("fills only empty concepts that now map", () => {
    expect(planSimpleChanges([{ id: "a", label: "Perceived quality", current: null }, { id: "b", label: "Perceived quality", current: "x" }, { id: "c", label: "Nothing", current: null }], index)).toEqual([
      { id: "a", to: "perceived_quality", label: "Perceived quality" },
    ]);
  });
});

describe("retired aliases", () => {
  it("clears a concept that was set through a name since retired, and no longer maps that name", () => {
    const [c] = planPathChanges([row({ iv_label_original: "Gratitude", iv_construct_id: "customer_gratitude", dv_label_original: "Customer gratitude" })], index);
    expect(c).toMatchObject({ iv_construct_id: null, dv_construct_id: "customer_gratitude" });
    expect(planSimpleChanges([{ id: "a", label: "Value", current: "perceived_value" }], index)).toEqual([{ id: "a", to: null, label: "Value" }]);
    expect(planPathChanges([row({ iv_label_original: "Consumer trust" })], index)).toEqual([]);
  });
});
