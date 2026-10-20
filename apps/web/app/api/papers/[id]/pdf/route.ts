/**
 * Serves a paper's PDF from the local repository (bộ khung, chỉ chạy trên máy).
 * In Giai đoạn 2 this becomes a short-lived R2 presigned URL with the Open Access rules of Mục 7.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { adminDbUrl } from "@/lib/admin-db";
import { getPaper } from "@/lib/data";
import { canDownloadPdf, pdfFileName } from "@/lib/pdf-access";

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const RAW_PAPERS = path.join(REPO_ROOT, "raw_papers");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper?.pdf_path) return new Response("Not found", { status: 404 });

  // Viewing is open; saving a copy (?download=1) follows the licence rule of lib/pdf-access.
  const download = new URL(request.url).searchParams.get("download") === "1";
  if (download && !canDownloadPdf(adminDbUrl() !== null, paper)) return new Response("Forbidden: this PDF may only be downloaded by the project owner", { status: 403 });

  // Only files inside raw_papers/ may be served, whatever the database says.
  const file = path.resolve(REPO_ROOT, paper.pdf_path);
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
