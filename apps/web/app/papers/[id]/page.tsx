import { notFound } from "next/navigation";
import { getPaper, listFields, paperLabel } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { label, tk } from "@/lib/labels";
import { getOwner } from "@/lib/supabase-server";
import { canDownloadPdf, canViewPdf, pdfLinks } from "@/lib/pdf-access";
import { authorLine, paperFacts, sourceLine } from "@/lib/paper-header";
import { defaultTab, summariseSections } from "@/lib/workspace";
import { EvidenceWorkspace } from "./evidence-workspace";

export const dynamic = "force-dynamic";

export default async function PaperPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang, t, tn } = await getT();
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
  const numbers = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US");

  return (
    <>
      <h1>{paperLabel(paper)}</h1>
      <div className="paper-head" data-testid="paper-head">
        {paper.authors.length > 0 && <p data-testid="paper-authors">{authorLine(paper.authors)}</p>}
        <p className="muted" data-testid="paper-source">
          {sourceLine(paper) || t("paper.noSource")}
          {paper.doi && (
            <>
              {" · "}
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
                {t("paper.doi", { doi: paper.doi })}
              </a>
            </>
          )}
        </p>
        <p data-testid="paper-facts">
          {[
            facts.type ? label(t, "ptype", facts.type) : null,
            facts.designs.length ? t("paper.facts.designs", { list: facts.designs.map((d) => label(t, "design", d)).join(", ") }) : null,
            facts.sampleSizes.length ? t("paper.facts.n", { list: facts.sampleSizes.map((n) => numbers.format(n)).join("; ") }) : null,
            facts.tests ? tn("paper.facts.tests", facts.tests) : null,
            t("paper.facts.verified", { v: facts.verified, f: facts.fields }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="muted" data-testid="paper-refs">
          {t("paper.refs")}{" "}
          <a href={`/export/refs?format=ris&paper=${paper.id}`} download>
            RIS
          </a>
          {" · "}
          <a href={`/export/refs?format=bibtex&paper=${paper.id}`} download>
            BibTeX
          </a>
        </p>
        <p className="muted" data-testid="paper-hint">
          {focusKey ? "" : t("paper.hint.tab", { tab: tk(t, `c.tab.${openTab}`) })}
          {t("paper.hint")}
        </p>
      </div>
      <EvidenceWorkspace paperId={paper.id} fields={fields} canDownload={Boolean(paper.pdf_path) && canDownloadPdf(isOwner, paper)} access={{ canView: canViewPdf(), ...pdfLinks(paper) }} {...(focusKey ? { focusKey } : {})} />
    </>
  );
}
