/**
 * The references of a list of papers as RIS or BibTeX (step P4.3). GET /export/refs?format=ris|bibtex with the library's own filters
 * (q, year, type, design, sample, country, trust, matrix), or ?paper=<id> for one paper.
 */
import { listLibraryItems } from "@/lib/data";
import { filterLibrary, parseLibraryQuery } from "@/lib/library";
import { toBibtex, toRis } from "@/lib/references";
import { countUse } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0]! : values;
  }
  const format = url.searchParams.get("format") === "bibtex" ? "bibtex" : "ris";
  const only = url.searchParams.get("paper");
  const all = await listLibraryItems();
  const items = only ? all.filter((p) => p.id === only) : filterLibrary(all, parseLibraryQuery(params));
  if (only && items.length === 0) return new Response("Không có bài này.", { status: 404 });
  const body = format === "bibtex" ? toBibtex(items) : toRis(items);
  await countUse(format === "bibtex" ? "export_bibtex" : "export_ris");
  return new Response(body, {
    headers: {
      "Content-Type": format === "bibtex" ? "application/x-bibtex; charset=utf-8" : "application/x-research-info-systems; charset=utf-8",
      "Content-Disposition": `attachment; filename="tai-lieu${only ? "-bai" : ""}.${format === "bibtex" ? "bib" : "ris"}"`,
      "Cache-Control": "no-store",
    },
  });
}
