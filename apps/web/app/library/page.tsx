import Link from "next/link";
import { listLibraryItems, paperLabel } from "@/lib/data";
import { apaReference } from "@/lib/apa";
import { filterLibrary, parseLibraryQuery } from "@/lib/library";
import { paperLabel as citation } from "@/lib/relations";
import { CopyButton } from "./copy-button";
import { LibraryFilters } from "./filters";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = parseLibraryQuery(await searchParams);
  const all = await listLibraryItems();
  const papers = filterLibrary(all, query);
  const filtered = papers.length !== all.length;

  return (
    <>
      <h1>Thư viện: bài báo trong kho</h1>
      {all.length === 0 ? (
        <p className="muted">Chưa có bài nào. Chạy `pnpm worker extract` rồi nhập dữ liệu để đưa bài vào database.</p>
      ) : (
        <>
          <LibraryFilters all={all} query={query} filtered={filtered} action="/library" />
          <p className="muted" data-testid="library-total">
            {filtered ? `${papers.length} / ${all.length} bài` : `${all.length} bài`}
          </p>
          {papers.length === 0 ? (
            <p className="muted">Không có bài nào khớp các bộ lọc. Bỏ bớt một bộ lọc hoặc bấm “Xóa lọc”.</p>
          ) : (
            <ul className="paper-list">
              {papers.map((paper) => {
                const who = paper.title ? citation({ title: paper.title, authors: paper.authors, year: paper.year, journal: paper.journal, citekey: null, apa_citation: null }) : null;
                const label = paperLabel({ ...paper, pdf_path: null, page_count: paper.pageCount, oa_status: null, license_source: null });
                const details = [who !== paper.title ? who : null, paper.journal, `${paper.pageCount ?? "?"} trang`].filter(Boolean).join(" · ");
                return (
                  <li key={paper.id} data-testid={`library-${paper.id}`}>
                    <Link href={`/papers/${paper.id}`}>{label}</Link>
                    <div className="muted">{details}</div>
                    <div className="library-counts" data-testid="library-counts">
                      <span className="badge badge-auto_verified">✓ {paper.verified}</span> · <span className="badge badge-needs_attention">⚠ {paper.attention}</span> ·{" "}
                      <span className="badge badge-ai_interpreted">◇ {paper.interpreted}</span>
                      {paper.hasMatrix && <span className="muted"> · có ma trận tương quan</span>}
                    </div>
                    <div className="library-actions">
                      <CopyButton text={apaReference(paper)} label="Copy APA" testId="copy-apa" />
                      {paper.doi && (
                        <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
                          DOI
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
