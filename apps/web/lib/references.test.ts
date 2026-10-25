import { describe, expect, it } from "vitest";
import { citeKeys, toBibtex, toRis } from "./references";

const paper = (o: Partial<Parameters<typeof toRis>[0][number]> = {}) => ({
  id: "p1",
  title: "The Chain of Effects from Brand Trust & Brand Affect",
  authors: [{ given: "Arjun", family: "Chaudhuri" }, { given: "Morris B.", family: "Holbrook" }],
  year: 2001,
  journal: "Journal of Marketing",
  volume: "65",
  issue: "2",
  pages: "81-93",
  doi: "10.1509/jmkg.65.2.81.18255",
  ...o,
});

describe("toRis", () => {
  it("writes one JOUR record with the tags Zotero and EndNote read, CRLF line ends and an ER end", () => {
    const ris = toRis([paper()]);
    expect(ris.split("\r\n")).toEqual([
      "TY  - JOUR",
      "AU  - Chaudhuri, Arjun",
      "AU  - Holbrook, Morris B.",
      "TI  - The Chain of Effects from Brand Trust & Brand Affect",
      "JO  - Journal of Marketing",
      "PY  - 2001",
      "VL  - 65",
      "IS  - 2",
      "SP  - 81",
      "EP  - 93",
      "DO  - 10.1509/jmkg.65.2.81.18255",
      "UR  - https://doi.org/10.1509/jmkg.65.2.81.18255",
      "ER  - ",
      "",
    ]);
  });

  it("skips what is missing and papers without a title, and separates records with a blank line", () => {
    const ris = toRis([paper({ id: "a", journal: null, volume: null, issue: null, pages: "e12345", doi: null }), paper({ id: "b", title: null }), paper({ id: "c", title: "Second", journal: null })]);
    expect(ris).not.toContain("JO  -");
    expect(ris).toContain("SP  - e12345");
    expect(ris).not.toContain("EP  - e12345");
    expect(ris.match(/TY {2}- JOUR/g)).toHaveLength(2);
    expect(ris).toContain("ER  - \r\n\r\nTY  - JOUR");
    expect(toRis([])).toBe("");
  });
});

describe("toBibtex", () => {
  it("writes an @article with the title in braces (case kept), authors joined by 'and', pages with a double dash", () => {
    const bib = toBibtex([paper()]);
    expect(bib).toContain("@article{chaudhuri2001chain,");
    expect(bib).toContain("  author = {Chaudhuri, Arjun and Holbrook, Morris B.},");
    expect(bib).toContain("  title = {{The Chain of Effects from Brand Trust \\& Brand Affect}},");
    expect(bib).toContain("  pages = {81--93},");
    expect(bib).toContain("  doi = {10.1509/jmkg.65.2.81.18255},");
    expect(bib.trim().endsWith("}")).toBe(true);
  });

  it("escapes characters that mean something to LaTeX and drops braces from values", () => {
    const bib = toBibtex([paper({ title: "50% of {users} like_it #1", journal: "J. of A & B" })]);
    expect(bib).toContain("title = {{50\\% of users like\\_it \\#1}}");
    expect(bib).toContain("journal = {J. of A \\& B}");
  });

  it("gives every paper its own key, even when author, year and title word agree", () => {
    const keys = citeKeys([paper({ id: "a" }), paper({ id: "b" }), paper({ id: "c", authors: [], year: null, title: "An" })]);
    expect(keys.get("a")).toBe("chaudhuri2001chain");
    expect(keys.get("b")).toBe("chaudhuri2001chaina");
    expect(keys.get("c")).toBe("anon");
    expect(new Set(keys.values()).size).toBe(3);
  });

  it("keeps Vietnamese names in the entry and plain letters in the key", () => {
    const list = [paper({ authors: [{ given: "Hoàng Đình", family: "Văn" }], year: 2026 })];
    expect(toBibtex(list)).toContain("author = {Văn, Hoàng Đình}");
    expect(citeKeys(list).get("p1")).toMatch(/^van2026/);
  });
});

import { parse as parseBib } from "@retorquere/bibtex-parser";

describe("BibTeX read back by a real parser (the one Zotero's tools use)", () => {
  it("parses without errors and gives back the same people, title, year, pages and doi", () => {
    const list = [
      paper({ id: "a" }),
      paper({ id: "b", title: "50% of {users} like_it #1 & more", journal: "J. of A & B", authors: [{ given: "Hoàng Đình", family: "Văn" }], year: 2026, pages: "e12345" }),
    ];
    const parsed = parseBib(toBibtex(list), { sentenceCase: false });
    expect(parsed.errors).toEqual([]);
    expect(parsed.entries).toHaveLength(2);
    const first = parsed.entries[0]!;
    expect(first.key).toBe("chaudhuri2001chain");
    expect(first.fields.title).toBe("The Chain of Effects from Brand Trust & Brand Affect");
    expect(first.fields.year).toBe("2001");
    expect(first.fields.doi).toBe("10.1509/jmkg.65.2.81.18255");
    expect(first.fields.author?.map((c) => `${c.lastName}, ${c.firstName}`)).toEqual(["Chaudhuri, Arjun", "Holbrook, Morris B."]);
    expect(first.fields.pages).toBe("81–93"); // the parser turns -- into an en dash
    const second = parsed.entries[1]!;
    expect(second.fields.title).toBe("50% of users like_it #1 & more");
    expect(second.fields.journal).toBe("J. of A & B");
    expect(second.fields.author?.[0]?.lastName).toBe("Văn");
  });
});
