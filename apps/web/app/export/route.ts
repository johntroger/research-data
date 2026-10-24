/**
 * Excel file of the Relationship Search result for the query in the URL (step 3a.4): the same tests, in the same
 * order, as the page lists. GET /export?a=…&b=… (the page's own search parameters).
 */
import { listConcepts, listPathRows } from "@/lib/data";
import { countUse } from "@/lib/usage";
import { parseQuery, searchRelations } from "@/lib/relations";
import { buildWorkbook, exportTable } from "@/lib/relations-export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0]! : values;
  }
  const [rows, concepts] = await Promise.all([listPathRows(), listConcepts()]);
  const result = searchRelations(rows, concepts, parseQuery(params));
  const table = exportTable(result, {
    exportedAt: new Date(),
    openUrl: (r) => `${url.origin}/papers/${r.paper_id}?focus=${encodeURIComponent(r.natural_key)}`,
  });
  const bytes = await buildWorkbook(table);
  const stamp = new Date().toISOString().slice(0, 10);
  await countUse("export_excel");
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="quan-he-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
