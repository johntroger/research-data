/** The tests of one paper by study (step 4.1), loaded when its matrix row is opened. The same visible data as everywhere else (the visitor's rights). */
import { listPaperLines } from "@/lib/data";
import { getT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const { t } = await getT();
  const studies = await listPaperLines(paperId, t("role.mod"));
  if (!studies) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ studies }, { headers: { "Cache-Control": "no-store" } });
}
