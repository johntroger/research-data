/**
 * Word file (APA 7 table) of the Relationship Search result for the query in the URL (step 3b.3): the same tests, in the
 * same order, as the page and the Excel file. GET /export/word?a=…&b=…
 */
import { getLatestRelease, listConcepts, listPathRows } from "@/lib/data";
import { provenanceNote } from "@/lib/release";
import { countUse } from "@/lib/usage";
import { parseQuery, searchRelations } from "@/lib/relations";
import { apaDocument, relationsWordSpec } from "@/lib/word-export";

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
  const now = new Date();
  const bytes = await apaDocument(relationsWordSpec(result, now, provenanceNote(release, now, url.origin)));
  await countUse("export_word");
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="quan-he-${now.toISOString().slice(0, 10)}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
