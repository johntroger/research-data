import Link from "next/link";
import { LibraryFilters } from "../library/filters";
import { PaperLines } from "./paper-lines";
import { listLibraryItems, listMatrixData, paperLabel } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { countryLabel, label, tk } from "@/lib/labels";
import { filterLibrary, libraryQueryString, parseLibraryQuery } from "@/lib/library";
import { buildMatrix, sampleSummary } from "@/lib/matrix";
import { paperLabel as citation } from "@/lib/relations";

export const dynamic = "force-dynamic";

export default async function MatrixPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { lang, t, tn } = await getT();
  const query = parseLibraryQuery(await searchParams);
  const [all, data] = await Promise.all([listLibraryItems(), listMatrixData()]);
  const papers = filterLibrary(all, query);
  const filtered = papers.length !== all.length;
  const rows = buildMatrix(papers.map((p) => p.id), data.theories, data.samples, data.paths, t("role.mod"));

  return (
    <>
      <h1>{t("matrix.title")}</h1>
      <p className="muted">{t("matrix.intro")}</p>
      <LibraryFilters all={all} query={query} filtered={filtered} action="/matrix" />
      <p className="muted" data-testid="matrix-total">
        {filtered ? t("library.totalFiltered", { shown: papers.length, all: all.length }) : tn("library.total", all.length)}
        {papers.length > 0 && (
          <>
            {" · "}
            <a href={`/matrix/word?${libraryQueryString(query)}`} download data-testid="matrix-word">
              {t("matrix.wordLink")}
            </a>
          </>
        )}
      </p>
      {papers.length === 0 ? (
        <p className="muted">{t("library.noMatch")}</p>
      ) : (
        <div className="matrix-scroll">
          <table className="matrix" data-testid="matrix">
            <thead>
              <tr>
                <th className="matrix-first">{t("matrix.col.paper")}</th>
                <th>{t("matrix.col.theory")}</th>
                <th>{t("matrix.col.design")}</th>
                <th>{t("matrix.col.outcome")}</th>
              </tr>
            </thead>
            {papers.map((paper) => {
              const row = rows.get(paper.id)!;
              const who = paper.title ? citation({ title: paper.title, authors: paper.authors, year: paper.year, journal: paper.journal, citekey: null, apa_citation: null }) : null;
              const name = paperLabel({ ...paper, pdf_path: null, page_count: paper.pageCount, oa_status: null, license_source: null });
              const o = row.outcome;
              const counted = o.supported + o.notSupported + o.mixed;
              return (
                <tbody key={paper.id} data-testid={`matrix-${paper.id}`}>
                  <tr>
                    <td className="matrix-first">
                      <Link href={`/papers/${paper.id}`}>{who && who !== paper.title ? who : name}</Link>
                      <div className="muted">{paper.title ?? ""}</div>
                    </td>
                    <td>
                      {row.theories.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        row.theories.map((th) => (
                          <div key={th.name}>
                            {th.name} <span className="muted">({tk(t, `theoryRole.${th.role}`)})</span>
                          </div>
                        ))
                      )}
                    </td>
                    <td>
                      {row.studies.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        row.studies.map((s) => (
                          <div key={s.studyId}>
                            {row.studies.length > 1 ? `${s.label}: ` : ""}
                            {s.design ? label(t, "design", s.design) : "?"}
                            {sampleSummary(s, (c) => countryLabel(c, lang)) && <span className="muted"> · {sampleSummary(s, (c) => countryLabel(c, lang))}</span>}
                          </div>
                        ))
                      )}
                    </td>
                    <td data-testid="matrix-outcome">
                      {counted === 0 && o.unchecked === 0 ? (
                        <span className="muted">{t("matrix.noHypothesis")}</span>
                      ) : (
                        <>
                          {counted > 0 && (
                            <span>
                              {t("matrix.supported", { n: o.supported })} · {t("matrix.notSupported", { n: o.notSupported })}
                              {o.mixed > 0 ? ` · ${t("matrix.mixed", { n: o.mixed })}` : ""}
                            </span>
                          )}
                          {o.unchecked > 0 && <div className="muted">{t("matrix.unchecked", { n: o.unchecked })}</div>}
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
