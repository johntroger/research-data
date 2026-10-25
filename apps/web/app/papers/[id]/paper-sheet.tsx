import Link from "next/link";
import type { Translate, TranslatePlural } from "@/lib/i18n";
import { countryLabel, label } from "@/lib/labels";
import type { Sheet } from "@/lib/paper-sheet";
import { tk } from "@/lib/labels";

/** A short list: the first few items, the rest folded. */
function Statements({ items, limit = 3, t }: { items: string[]; limit?: number; t: Translate }) {
  const first = items.slice(0, limit);
  const rest = items.slice(limit);
  return (
    <>
      <ul>
        {first.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      {rest.length > 0 && (
        <details>
          <summary>{t("sheet.more", { n: rest.length })}</summary>
          <ul>
            {rest.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

/**
 * The top of a paper page: what it contributes, how each study was run, how each hypothesis came out, the limits the authors state.
 * Everything here is a short, reworded view of the fields below it; each hypothesis row links to its evidence.
 */
export function PaperSheet({ sheet, paperId, t, tn, lang, canView = false }: { sheet: Sheet; paperId: string; t: Translate; tn: TranslatePlural; lang: "vi" | "en"; canView?: boolean }) {
  const numbers = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US");
  const { statements } = sheet;
  const hasContribution = statements.theoretical.length > 0 || sheet.gap !== null;
  return (
    <section className="sheet" data-testid="paper-sheet" aria-label={t("sheet.title")}>
      <h2>{t("sheet.title")}</h2>

      {(sheet.question || sheet.conclusions.length > 0) && (
        <div className="sheet-block" data-testid="sheet-question">
          {sheet.question && (
            <>
              <h3>{t("sheet.question.h")}</h3>
              <p>{sheet.question.text}</p>
              <p className="muted sheet-ai">{canView ? <a href={`/api/papers/${paperId}/pdf#page=${sheet.question.page}`} target="_blank" rel="noreferrer">{t("sheet.ai.page", { p: sheet.question.page })}</a> : t("sheet.ai.page", { p: sheet.question.page })}</p>
            </>
          )}
          {sheet.conclusions.length > 0 && (
            <>
              <h3>{t("sheet.conclusions.h")}</h3>
              <ul>
                {sheet.conclusions.map((c, i) => (
                  <li key={i}>
                    {c.text}{" "}
                    <span className="muted sheet-ai">{canView ? <a href={`/api/papers/${paperId}/pdf#page=${c.page}`} target="_blank" rel="noreferrer">{t("sheet.ai.page", { p: c.page })}</a> : t("sheet.ai.page", { p: c.page })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {sheet.abstract && (
        <details className="sheet-block" data-testid="sheet-abstract">
          <summary>{t("sheet.abstract.h", { source: sheet.abstract.source })}</summary>
          {sheet.abstract.text.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </details>
      )}

      {hasContribution && (
        <div className="sheet-block" data-testid="sheet-what">
          <h3>{t("sheet.what.h")}</h3>
          {statements.theoretical.length > 0 && <Statements items={statements.theoretical} limit={2} t={t} />}
          {sheet.gap && <p className="muted">{t("sheet.what.gap", { gap: tk(t, `gap.${sheet.gap}`) })}</p>}
        </div>
      )}

      {sheet.theories.length > 0 && (
        <div className="sheet-block" data-testid="sheet-theories">
          <h3>{t("sheet.theories.h")}</h3>
          <p>
            {sheet.theories.slice(0, 6).map((th, i) => (
              <span key={th.name}>
                {i > 0 ? "; " : ""}
                {th.name} <span className="muted">({tk(t, `theoryRole.${th.role}`)})</span>
              </span>
            ))}
          </p>
        </div>
      )}

      {sheet.studies.length > 0 && (
        <div className="sheet-block" data-testid="sheet-design">
          <h3>{t("sheet.design.h")}</h3>
          <div className="matrix-scroll">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>{t("sheet.design.col.study")}</th>
                  <th>{t("sheet.design.col.design")}</th>
                  <th>{t("sheet.design.col.n")}</th>
                  <th>{t("sheet.design.col.sample")}</th>
                  <th>{t("sheet.design.col.country")}</th>
                </tr>
              </thead>
              <tbody>
                {sheet.studies.map((s) => (
                  <tr key={s.studyId}>
                    <th scope="row">{s.label}</th>
                    <td>{s.design ? label(t, "design", s.design) : "—"}</td>
                    <td>{s.n != null ? numbers.format(s.n) : "—"}</td>
                    <td>{s.sampleType ? label(t, "sample", s.sampleType) : "—"}</td>
                    <td>{s.countries.length ? s.countries.map((c) => countryLabel(c, lang)).join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="sheet-block" data-testid="sheet-hypotheses">
        <h3>{t("sheet.hyp.h")}</h3>
        {sheet.hypotheses.length === 0 ? (
          <p className="muted">{t("sheet.hyp.empty")}</p>
        ) : (
          <div className="matrix-scroll">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>{t("sheet.hyp.col.h")}</th>
                  <th>{t("sheet.hyp.col.relation")}</th>
                  <th>{t("sheet.hyp.col.stat")}</th>
                  <th>{t("sheet.hyp.col.result")}</th>
                  <th>{t("sheet.hyp.col.evidence")}</th>
                </tr>
              </thead>
              {sheet.hypotheses.map((study) => (
                <tbody key={study.studyId}>
                  <tr className="sheet-study">
                    <th colSpan={5}>{study.label}</th>
                  </tr>
                  {study.rows.map((r) => (
                    <tr key={r.id} data-testid={`hyp-${r.id}`} className={r.verified ? undefined : "sheet-unverified"}>
                      <th scope="row">{r.code ?? "—"}</th>
                      <td>
                        {r.relation}
                        {r.repeats > 0 && <div className="muted">{tn("sheet.hyp.repeats", r.repeats)}</div>}
                      </td>
                      <td>{r.statistic}</td>
                      <td>
                        <span className={`status status-${r.status}`}>{label(t, "status", r.status).replace(/^[✓✗◐○]\s*/, "")}</span>{" "}
                        {r.verified ? <span className="badge badge-auto_verified">✓</span> : <span className="badge badge-needs_attention">⚠ {t("sheet.hyp.unverified")}</span>}
                      </td>
                      <td>
                        <Link href={`/papers/${paperId}?focus=${encodeURIComponent(r.naturalKey)}#details`}>
                          {[r.table, r.printedPage ? t("sheet.hyp.page", { p: r.printedPage }) : null].filter(Boolean).join(" · ") || t("sheet.hyp.open")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
        {sheet.otherPaths > 0 && <p className="muted">{tn("sheet.hyp.others", sheet.otherPaths)}</p>}
      </div>

      {(statements.limitations.length > 0 || statements.future.length > 0 || statements.practical.length > 0) && (
        <div className="sheet-columns">
          {statements.limitations.length > 0 && (
            <div className="sheet-block" data-testid="sheet-limits">
              <h3>{t("sheet.limits.h")}</h3>
              <Statements items={statements.limitations} t={t} />
            </div>
          )}
          {statements.future.length > 0 && (
            <div className="sheet-block" data-testid="sheet-future">
              <h3>{t("sheet.future.h")}</h3>
              <Statements items={statements.future} t={t} />
            </div>
          )}
          {statements.practical.length > 0 && (
            <div className="sheet-block" data-testid="sheet-practical">
              <h3>{t("sheet.practical.h")}</h3>
              <Statements items={statements.practical} t={t} />
            </div>
          )}
        </div>
      )}

      <p className="muted sheet-note">{t("sheet.note")}</p>
    </section>
  );
}
