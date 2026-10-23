import { notFound } from "next/navigation";
import { getPaper, listFields, paperLabel } from "@/lib/data";
import { getOwner } from "@/lib/supabase-server";
import { canDownloadPdf, canViewPdf, pdfLinks } from "@/lib/pdf-access";
import { EvidenceWorkspace } from "./evidence-workspace";

export const dynamic = "force-dynamic";

export default async function PaperPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();
  const isOwner = (await getOwner()) !== null;
  const fields = await listFields(paper.id);
  // A link from the search results names the test (its natural key); its estimate is selected first.
  const raw = (await searchParams).focus;
  const focusKey = (Array.isArray(raw) ? raw[0] : raw) || undefined;

  return (
    <>
      <h1>{paperLabel(paper)}</h1>
      <EvidenceWorkspace paperId={paper.id} fields={fields} canDownload={Boolean(paper.pdf_path) && canDownloadPdf(isOwner, paper)} access={{ canView: canViewPdf(isOwner, paper), ...pdfLinks(paper) }} {...(focusKey ? { focusKey } : {})} />
    </>
  );
}
