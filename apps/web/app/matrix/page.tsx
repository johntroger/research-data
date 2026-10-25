import Link from "next/link";
import { LibraryFilters } from "../library/filters";
import { PaperLines } from "./paper-lines";
import { listLibraryItems, listMatrixData, paperLabel } from "@/lib/data";
import { countryName, DESIGN_LABELS, filterLibrary, libraryQueryString, parseLibraryQuery } from "@/lib/library";
import { buildMatrix, sampleSummary, THEORY_ROLE_LABELS } from "@/lib/matrix";
import { paperLabel as citation } from "@/lib/relations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma trận tổng hợp: bài × đặc điểm" };

export default async function MatrixPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = parseLibraryQuery(await searchParams);
  const [all, data] = await Promise.all([listLibraryItems(), listMatrixData()]);
  const papers = filterLibrary(all, query);
  const filtered = papers.length !== all.length;
  const rows = buildMatrix(papers.map((p) => p.id), data.theories, data.samples, data.paths);

  return (
    <>
      <h1>Ma trận tổng hợp: bài × đặc điểm</h1>
      <p className="muted">
        Mỗi dòng là một bài. Cột “Kết quả chính” chỉ đếm kiểm định giả thuyết đã kiểm chứng (✓ hoặc ★); kiểm định chưa kiểm chứng (⚠) được nêu riêng và không được đếm. Bấm một dòng để xem từng kiểm định theo Study.
      </p>
      <LibraryFilters all={all} query={query} filtered={filtered} action="/matrix" />
      <p className="muted" data-testid="matrix-total">
        {filtered ? `${papers.length} / ${all.length} bài` : `${all.length} bài`}
        {papers.length > 0 && (
          <>
            {" · "}
            <a href={`/matrix/word?${libraryQueryString(query)}`} download data-testid="matrix-word">
              Tải Word APA 7
            </a>
          </>
        )}
      </p>
      {papers.length === 0 ? (
        <p className="muted">Không có bài nào khớp các bộ lọc. Bỏ bớt một bộ lọc hoặc bấm “Xóa lọc”.</p>
      ) : (
        <div className="matrix-scroll">
          <table className="matrix" data-testid="matrix">
            <thead>
              <tr>
                <th className="matrix-first">Tác giả và năm</th>
                <th>Lý thuyết</th>
                <th>Thiết kế và mẫu</th>
                <th>Kết quả chính</th>
              </tr>
            </thead>
            {papers.map((paper) => {
              const row = rows.get(paper.id)!;
              const who = paper.title ? citation({ title: paper.title, authors: paper.authors, year: paper.year, journal: paper.journal, citekey: null, apa_citation: null }) : null;
              const label = paperLabel({ ...paper, pdf_path: null, page_count: paper.pageCount, oa_status: null, license_source: null });
              const o = row.outcome;
              const counted = o.supported + o.notSupported + o.mixed;
              return (
                <tbody key={paper.id} data-testid={`matrix-${paper.id}`}>
                  <tr>
                    <td className="matrix-first">
                      <Link href={`/papers/${paper.id}`}>{who && who !== paper.title ? who : label}</Link>
                      <div className="muted">{paper.title ?? ""}</div>
                    </td>
                    <td>
                      {row.theories.length === 0 ? <span className="muted">—</span> : row.theories.map((t) => (
                        <div key={t.name}>
                          {t.name} <span className="muted">({THEORY_ROLE_LABELS[t.role] ?? t.role})</span>
                        </div>
                      ))}
                    </td>
                    <td>
                      {row.studies.length === 0 ? <span className="muted">—</span> : row.studies.map((s) => (
                        <div key={s.studyId}>
                          {row.studies.length > 1 ? `${s.label}: ` : ""}
                          {DESIGN_LABELS[s.design ?? ""] ?? s.design ?? "?"}
                          {sampleSummary(s, countryName) && <span className="muted"> · {sampleSummary(s, countryName)}</span>}
                        </div>
                      ))}
                    </td>
                    <td data-testid="matrix-outcome">
                      {counted === 0 && o.unchecked === 0 ? (
                        <span className="muted">Không có giả thuyết kiểm định</span>
                      ) : (
                        <>
                          {counted > 0 && (
                            <span>
                              ✓ {o.supported} ủng hộ · ✗ {o.notSupported} không ủng hộ{o.mixed > 0 ? ` · ◐ ${o.mixed} một phần` : ""}
                            </span>
                          )}
                          {o.unchecked > 0 && <div className="muted">⚠ {o.unchecked} chưa kiểm chứng, không đếm</div>}
                        </>
                      )}
                    </td>
                  </tr>
                  {row.studies.some((s) => s.lines.length > 0) && (
                    <tr className="matrix-detail">
                      <td colSpan={4}>
                        <PaperLines paperId={paper.id} count={row.studies.reduce((n, s) => n + s.lines.length, 0)} />
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </>
  );
}
