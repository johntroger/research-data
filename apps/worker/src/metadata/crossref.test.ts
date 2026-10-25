import { describe, expect, it } from "vitest";
import { fetchCrossref, parseCrossrefWork, plainAbstract } from "./crossref.js";

const work = {
  DOI: "10.1234/ABC.5",
  title: ["Influencer credibility and <i>brand</i> trust"],
  author: [
    { family: "Nguyen", given: "An", ORCID: "https://orcid.org/0000-0001-2345-6789" },
    { name: "Synthetic Consortium" },
  ],
  "container-title": ["Journal of Synthetic Marketing"],
  volume: "12",
  issue: "3",
  page: "1201-1204",
  issued: { "date-parts": [[2025, 11]] },
  "published-online": { "date-parts": [[2025, 11, 2]] },
  "published-print": { "date-parts": [[2026, 1]] },
};

describe("plainAbstract", () => {
  it("keeps paragraphs, drops the heading, tags and entities", () => {
    const raw = "<jats:title>Abstract</jats:title><jats:p>Brands that <jats:italic>disclose</jats:italic> &amp; explain earn trust in many markets.</jats:p><jats:p>Second paragraph that is long enough to keep.</jats:p>";
    expect(plainAbstract(raw)).toBe("Brands that disclose & explain earn trust in many markets.\n\nSecond paragraph that is long enough to keep.");
  });
  it("returns null for a missing or trivial abstract", () => {
    expect(plainAbstract(undefined)).toBeNull();
    expect(plainAbstract("<jats:p>None.</jats:p>")).toBeNull();
  });
});

describe("parseCrossrefWork", () => {
  it("maps Crossref fields to bibliographic metadata", () => {
    expect(parseCrossrefWork(work)).toEqual({
      doi: "10.1234/abc.5",
      title: "Influencer credibility and brand trust",
      authors: [
        { family: "Nguyen", given: "An", orcid: "0000-0001-2345-6789" },
        { family: "Synthetic Consortium", given: null, orcid: null },
      ],
      year: 2026, // the print issue, not the online-first date
      journal: "Journal of Synthetic Marketing",
      volume: "12",
      issue: "3",
      pages: "1201-1204",
      firstPage: 1201,
    });
  });

  it("decodes HTML entities in titles and journal names", () => {
    const parsed = parseCrossrefWork({ DOI: "10.1/x", title: ["A &amp; B &#233;"], "container-title": ["Journal of Product &amp; Brand Management"] });
    expect(parsed).toMatchObject({ title: "A & B é", journal: "Journal of Product & Brand Management" });
  });

  it("repairs the JSTOR 'Reviewed work(s):' artefact in author names", () => {
    const parsed = parseCrossrefWork({
      DOI: "10.1/x",
      author: [
        { family: "Chaudhuri", given: "Arjun" },
        { family: "work(s):", given: "Morris B. Holbrook Reviewed" },
      ],
    });
    expect(parsed.authors.map((a) => [a.given, a.family])).toEqual([
      ["Arjun", "Chaudhuri"],
      ["Morris B.", "Holbrook"],
    ]);
  });

  it("copes with missing fields and article numbers", () => {
    const parsed = parseCrossrefWork({ DOI: "10.1/x", page: "e12345", issued: { "date-parts": [[2024]] } });
    expect(parsed).toMatchObject({ title: null, authors: [], year: 2024, journal: null, firstPage: null });
  });
});

describe("fetchCrossref", () => {
  const ok = () => new Response(JSON.stringify({ message: work }), { status: 200 });

  it("requests the DOI with an identifying User-Agent and no personal data", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: init?.headers as Record<string, string> });
      return ok();
    }) as typeof fetch;
    expect((await fetchCrossref("10.1234/abc.5", { fetchImpl }))?.firstPage).toBe(1201);
    expect(calls[0]!.url).toBe("https://api.crossref.org/works/10.1234%2Fabc.5");
    expect(calls[0]!.headers["User-Agent"]).toMatch(/^research-data\//);
    expect(JSON.stringify(calls)).not.toMatch(/@/);
  });

  it("returns null for an unknown DOI", async () => {
    const fetchImpl = (async () => new Response("Resource not found.", { status: 404 })) as typeof fetch;
    expect(await fetchCrossref("10.9/none", { fetchImpl })).toBeNull();
  });

  it("retries after 429 and network errors", async () => {
    const responses: (Response | Error)[] = [
      new Response("slow", { status: 429, headers: { "Retry-After": "2" } }),
      new TypeError("fetch failed"),
      ok(),
    ];
    const sleeps: number[] = [];
    const fetchImpl = (async () => {
      const next = responses.shift()!;
      if (next instanceof Error) throw next;
      return next;
    }) as typeof fetch;
    const meta = await fetchCrossref("10.1234/abc.5", { fetchImpl, sleep: async (ms) => void sleeps.push(ms) });
    expect(meta?.journal).toBe("Journal of Synthetic Marketing");
    expect(sleeps).toEqual([2000, 2000]);
  });

  it("throws on other errors so the step is marked failed and retried next run", async () => {
    const fetchImpl = (async () => new Response("bad", { status: 400 })) as typeof fetch;
    await expect(fetchCrossref("10.1/x", { fetchImpl })).rejects.toThrow(/Crossref 400/);
  });
});
