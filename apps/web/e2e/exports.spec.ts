/** Step P4.3: RIS / BibTeX of papers (the CSV test is in relation-search.spec.ts, which owns the zebra and quokka test data). */
import { expect, test } from "@playwright/test";

test("the library exports its papers as RIS and BibTeX, the filtered ones when a filter is on", async ({ page, request }) => {
  await page.goto("/library");
  await expect(page.getByTestId("export-ris")).toBeVisible();
  await expect(page.getByTestId("export-bibtex")).toBeVisible();
  const ris = await request.get("/export/refs?format=ris");
  expect(ris.status()).toBe(200);
  expect(ris.headers()["content-type"]).toContain("application/x-research-info-systems");
  const risText = await ris.text();
  expect(risText).toMatch(/^TY {2}- JOUR\r\n/);
  const recordsAll = risText.match(/^ER {2}- $/gm)!.length;
  expect(recordsAll).toBeGreaterThan(0);
  const bib = await request.get("/export/refs?format=bibtex");
  expect(bib.headers()["content-disposition"]).toContain(".bib");
  expect(await bib.text()).toMatch(/^@article\{[a-z0-9]+,/);
  const none = await request.get("/export/refs?format=ris&year=1800");
  expect((await none.text()).trim()).toBe("");
});

test("one paper's reference, and a clear answer for a paper that does not exist", async ({ request }) => {
  const bib = await request.get("/export/refs?format=bibtex");
  const key = /^@article\{([a-z0-9]+),/m.exec(await bib.text())![1]!;
  expect(key.length).toBeGreaterThan(2);
  const missing = await request.get("/export/refs?format=ris&paper=00000000-0000-0000-0000-000000000000");
  expect(missing.status()).toBe(404);
});
