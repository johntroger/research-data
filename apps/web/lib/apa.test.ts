import { describe, expect, it } from "vitest";
import { apaReference, initials } from "./apa";

describe("APA 7 reference", () => {
  it("writes initials, keeping the hyphen of a hyphenated given name", () => {
    expect(initials("Mary Ann")).toBe("M. A.");
    expect(initials("Jean-Paul")).toBe("J.-P.");
    expect(initials("J. P.")).toBe("J. P.");
    expect(initials(null)).toBe("");
  });

  it("builds the reference from the stored metadata", () => {
    const ref = apaReference({
      title: "Trust and loyalty online",
      authors: [{ given: "Jean-Paul", family: "Martin" }, { given: "An", family: "Nguyen" }],
      year: 2021,
      journal: "Journal of Testing",
      volume: "12",
      issue: "3",
      pages: "1-20",
      doi: "10.1000/xyz",
    });
    expect(ref).toBe("Martin, J.-P., & Nguyen, A. (2021). Trust and loyalty online. Journal of Testing, 12(3), 1-20. https://doi.org/10.1000/xyz");
  });
});
