/**
 * Word file (APA 7 tables) of the summary matrix for the filters in the URL (step 3b.3): the same papers as /matrix.
 * GET /matrix/word?q=…&design=…
 */
import { listLibraryItems, listMatrixData, paperLabel } from "@/lib/data";
import { filterLibrary, parseLibraryQuery } from "@/lib/library";
import { buildMatrix } from "@/lib/matrix";
import { paperLabel as citation } from "@/lib/relations";
import { apaDocument, matrixWordSpec } from "@/lib/word-export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0]! : values;
  }
  const query = parseLibraryQuery(params);
  const [all, data] = await Promise.all([listLibraryItems(), listMatrixData()]);
  const papers = filterLibrary(all, query);
  const rows = buildMatrix(papers.map((p) => p.id), data.theories, data.samples, data.paths);
  const now = new Date();
  const filters = [...url.searchParams.entries()].map(([k, v]) => `${k}=${v}`).join(", ");
  const bytes = await apaDocument(
    matrixWordSpec(
      papers.map((p) => {
        const who = p.title ? citation({ title: p.title, authors: p.authors, year: p.year, journal: p.journal, citekey: null, apa_citation: null }) : null;
        const label = paperLabel({ ...p, pdf_path: null, page_count: p.pageCount, oa_status: null, license_source: null });
        return { citation: who && who !== p.title ? who : label, title: p.title ?? "", row: rows.get(p.id)! };
      }),
      now,
      filters,
    ),
  );
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="ma-tran-${now.toISOString().slice(0, 10)}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
