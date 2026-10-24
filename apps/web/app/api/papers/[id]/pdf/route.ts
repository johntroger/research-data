/**
 * A paper's PDF. With the read-only R2 token configured (step 2.2b) the browser is sent to a 5-minute presigned R2 link, so the
 * file never passes through this server; without it, in development only, the file is read from the local raw_papers folder.
 * Viewing and saving a copy both follow the licence rule of lib/pdf-access (Mục 7, D14): the owner gets every PDF, a visitor only open-licence ones.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPaper } from "@/lib/data";
import { getOwner } from "@/lib/supabase-server";
import { canDownloadPdf, canViewPdf, pdfFileName } from "@/lib/pdf-access";
import { pdfKey, presignPdf, r2Config } from "@/lib/r2";
import { countUse } from "@/lib/usage";

const REPO_ROOT = path.resolve(/* turbopackIgnore: true */ process.cwd(), "../..");
const RAW_PAPERS = path.join(REPO_ROOT, "raw_papers");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper?.pdf_path) return new Response("Not found", { status: 404 });

  // Viewing and saving a copy both follow the licence rule of lib/pdf-access (D14): the owner sees every PDF, a visitor only open-licence ones.
  const isOwner = (await getOwner()) !== null;
  const download = new URL(request.url).searchParams.get("download") === "1";
  if (!canViewPdf(isOwner, paper)) return new Response("Forbidden: this PDF is not published (no open licence)", { status: 403 });
  if (download && !canDownloadPdf(isOwner, paper)) return new Response("Forbidden: this PDF may only be downloaded by the project owner", { status: 403 });

  const r2 = r2Config();
  if (r2 && pdfKey(paper.file_hash)) {
    const link = await presignPdf(r2, paper.file_hash!, { download, fileName: pdfFileName(paper.title) });
    if (link) {
      await countUse(download ? "pdf_download" : "pdf_view");
      return new Response(null, { status: 302, headers: { Location: link, "Cache-Control": "no-store" } });
    }
  }

  // Reading the file from disk is for development only. A deployed site has no raw_papers folder, and tracing this code would pull the whole project into the deployment.
  if (process.env.NODE_ENV === "production") return new Response("PDF storage is not configured", { status: 503 });

  // Only files inside raw_papers/ may be served, whatever the database says.
  const file = path.resolve(/* turbopackIgnore: true */ REPO_ROOT, paper.pdf_path);
  if (!file.startsWith(RAW_PAPERS + path.sep) || !file.toLowerCase().endsWith(".pdf")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const bytes = await readFile(file);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download ? `attachment; filename="${pdfFileName(paper.title)}"` : "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
