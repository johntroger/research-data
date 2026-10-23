import Link from "next/link";
import { listLibraryItems, paperLabel } from "@/lib/data";
import { apaReference } from "@/lib/apa";
import {
  countryName, DESIGN_LABELS, facetOptions, filterLibrary, PAPER_TYPE_LABELS, parseLibraryQuery, SAMPLE_LABELS, type FacetName,
} from "@/lib/library";
import { paperLabel as citation } from "@/lib/relations";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

const GROUPS: { facet: FacetName; param: string; title: string; label: (v: string) => string }[] = [
  { facet: "years", param: "year", title: "Năm", label: (v) => (v === "unknown" ? "Chưa rõ" : v) },
  { facet: "types", param: "type", title: "Loại bài", label: (v) => (v === "unknown" ? "Chưa rõ" : (PAPER_TYPE_LABELS[v] ?? v)) },
  { facet: "designs", param: "design", title: "Thiết kế nghiên cứu", label: (v) => (v === "unknown" ? "Chưa rõ" : (DESIGN_LABELS[v] ?? v)) },
  { facet: "samples", param: "sample", title: "Loại mẫu", label: (v) => (v === "unknown" ? "Chưa rõ" : (SAMPLE_LABELS[v] ?? v)) },
  { facet: "countries", param: "country", title: "Quốc gia", label: (v) => (v === "unknown" ? "Chưa rõ" : `${countryName(v)} (${v})`) },
];

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
          <form method="get" className="library-filters" data-testid="library-filters">
            <div className="library-search">
              <input type="search" name="q" defaultValue={query.q} placeholder="Tìm theo tên bài, tác giả, tạp chí, DOI" aria-label="Tìm trong thư viện" />
              <button type="submit">Lọc</button>
              {(filtered || query.q) && <Link href="/library">Xóa lọc</Link>}
            </div>
            <div className="library-facets">
              {GROUPS.map((g) => (
                <details key={g.facet} open={query[g.facet].length > 0}>
                  <summary>
                    {g.title}
                    {query[g.facet].length > 0 && ` (${query[g.facet].length})`}
                  </summary>
                  {facetOptions(all, query, g.facet).map((o) => (
                    <label key={o.value} className={o.count === 0 && !o.selected ? "muted" : undefined}>
                      <input type="checkbox" name={g.param} value={o.value} defaultChecked={o.selected} /> {g.label(o.value)} <span className="muted">({o.count})</span>
                    </label>
                  ))}
                </details>
              ))}
              <details open={query.trust !== "" || query.matrix}>
                <summary>Mức tin cậy và dữ liệu</summary>
                <label>
                  Tỷ lệ trường ⚠{" "}
                  <select name="trust" defaultValue={query.trust}>
                    <option value="">Tất cả</option>
                    <option value="high">Tối đa 10%</option>
                    <option value="mid">Tối đa 25%</option>
                  </select>
                </label>
                <label>
                  <input type="checkbox" name="matrix" value="1" defaultChecked={query.matrix} /> Có ma trận tương quan
                </label>
              </details>
            </div>
          </form>
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
