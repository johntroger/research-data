import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaper, listFields, paperLabel } from "@/lib/data";
import { getOwner } from "@/lib/supabase-server";
import { canDownloadPdf, canViewPdf, pdfLinks } from "@/lib/pdf-access";
import { authorLine, paperFacts, sourceLine } from "@/lib/paper-header";
import { defaultTab, summariseSections, TABS } from "@/lib/workspace";
import { EvidenceWorkspace } from "./evidence-workspace";

export const dynamic = "force-dynamic";

/** The tab and the history name the paper, not just the site. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const paper = await getPaper((await params).id);
  return paper?.title ? { title: paper.title } : {};
}

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
  const facts = paperFacts(fields);
  const openTab = defaultTab(summariseSections(fields));
  // A link from the search results names the test (its natural key); its estimate is selected first.
  const raw = (await searchParams).focus;
  const focusKey = (Array.isArray(raw) ? raw[0] : raw) || undefined;

  return (
    <>
      <h1>{paperLabel(paper)}</h1>
      <div className="paper-head" data-testid="paper-head">
        {paper.authors.length > 0 && <p data-testid="paper-authors">{authorLine(paper.authors)}</p>}
        <p className="muted" data-testid="paper-source">
          {sourceLine(paper) || "Chưa có thông tin tạp chí"}
          {paper.doi && (
            <>
              {" · "}
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
                DOI {paper.doi}
              </a>
            </>
          )}
        </p>
        <p data-testid="paper-facts">
          {[
            facts.typeLabel,
            facts.designs.length ? `Thiết kế: ${facts.designs.join(", ")}` : null,
            facts.sampleSizes.length ? `N = ${facts.sampleSizes.map((n) => n.toLocaleString("vi-VN")).join("; ")}` : null,
            facts.tests ? `${facts.tests} kiểm định đường quan hệ` : null,
            `${facts.verified}/${facts.fields} trường đã kiểm chứng (✓)`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="muted" data-testid="paper-hint">
          {focusKey ? "" : `Mở sẵn tab ${TABS.find((t) => t.id === openTab)?.label}; `}bấm một giá trị để thấy bằng chứng trong PDF.
        </p>
      </div>
      <EvidenceWorkspace paperId={paper.id} fields={fields} canDownload={Boolean(paper.pdf_path) && canDownloadPdf(isOwner, paper)} access={{ canView: canViewPdf(isOwner, paper), ...pdfLinks(paper) }} {...(focusKey ? { focusKey } : {})} />
    </>
  );
}
