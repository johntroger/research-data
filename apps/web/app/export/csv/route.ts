/**
 * CSV of the Relationship Search result for the query in the URL (step P4.3): the same tests, in the same order, as the page and the Excel
 * file, with raw values for analysis and the data release in every row. GET /export/csv?a=…&b=…
 */
import { getLatestRelease, listConcepts, listPathRows } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import { parseQuery, searchRelations } from "@/lib/relations";
import { CSV_COLUMNS, csvRows } from "@/lib/relations-export";
import { countUse } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0]! : values;
  }
  const [rows, concepts, release] = await Promise.all([listPathRows(), listConcepts(), getLatestRelease()]);
  const result = searchRelations(rows, concepts, parseQuery(params));
  const releaseId = release?.id ?? "chua-co-ban";
  const body = toCsv(CSV_COLUMNS, csvRows(result, { release: releaseId, openUrl: (r) => `${url.origin}/papers/${r.paper_id}?focus=${encodeURIComponent(r.natural_key)}` }));
  await countUse("export_csv");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quan-he_ban-${releaseId}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
