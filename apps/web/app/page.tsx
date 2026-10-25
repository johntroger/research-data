import Link from "next/link";
import { Fragment } from "react";
import { CopyButton } from "@/app/library/copy-button";
import { CorpusBlock } from "@/app/corpus-block";
import { ForestPlot } from "@/app/forest-plot";
import { buildForest } from "@/lib/forest";
import { describeCorpus } from "@/lib/corpus";
import { PermalinkButton } from "@/app/permalink-button";
import { getLatestRelease, listConcepts, listLibraryItems, listPathRows, listTableCaptions } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import type { Translate } from "@/lib/i18n";
import { countryLabel, label, labelKeys, tk } from "@/lib/labels";
import { releaseLabel, staleWarning } from "@/lib/release";
import { countUse } from "@/lib/usage";
import { academicSentence } from "@/lib/sentence";
import {
  DEFAULT_QUERY,
  ESTIMATES,
  SORTS,
  formatStats,
  formatEstimate,
  formatP,
  formatSe,
  formatCi,
  sampleSize,
  groupRepeats,
  covariateDiff,
  hasQuestion,
  isSingleConcept,
  isVerified,
  matchedConcepts,
  rolesInTest,
  singleTerm,
  paperLabel,
  parseQuery,
  type PathRow,
  queryToSearch,
  sampleOf,
  type RelationQuery,
  SAMPLE_QUERIES,
  searchRelations,
  suggestions,
} from "@/lib/relations";

export const dynamic = "force-dynamic";

const OUTCOME = ["supported", "not_supported", "mixed", "not_hypothesized"] as const;
/** The label of an outcome in the filter and the summary ("mixed" covers partly supported too). */
const outcomeLabel = (t: Translate, key: (typeof OUTCOME)[number]) => (key === "mixed" ? t("status.mixedForm") : label(t, "status", key));

const link = (q: RelationQuery) => `/?${queryToSearch(q)}`;

const captionOf = (captions: Map<string, string>, r: PathRow) => (r.evidence?.table_or_figure ? captions.get(`${r.paper_id}|${r.evidence.table_or_figure}`) : undefined);

function TestLine({ row, concepts, roles = [], t, captions }: { row: PathRow; concepts: Map<string, string>; roles?: string[]; t: Translate; captions: Map<string, string> }) {
  const iv = concepts.get(row.iv_construct_id ?? "");
  const dv = concepts.get(row.dv_construct_id ?? "");
  const stats = formatStats(row);
  const sentence = academicSentence(row);
  return (
    <li data-testid={`test-${row.id}`} className="relation-row">
      <Link href={`/papers/${row.paper_id}?focus=${encodeURIComponent(row.natural_key)}`}>
        {row.studies?.study_label ?? "?"} {row.hypothesis_code ? `· ${row.hypothesis_code} ` : ""}· {row.iv_label_original} → {row.dv_label_original}
      </Link>{" "}
      <span className="stats">{stats}</span> <span>{label(t, "status", row.status)}</span>{" "}
      <span className={`badge badge-${row.badge}`}>{label(t, "badge", row.badge)}</span>
      {sentence && (
        <>
          {" "}
          <CopyButton text={sentence} label={t("test.copySentence")} testId="copy-sentence" track="copy_sentence" />
        </>
      )}
      <div className="muted">
        {roles.length ? `${t("test.roleOf", { roles: roles.map((r) => label(t, "role", r)).join(", ") })} · ` : ""}
        {label(t, "effect", row.effect_type)}
        {row.mediator_labels.length ? t("test.viaMediator", { list: row.mediator_labels.join(", ") }) : ""}
        {row.moderator_labels.length ? t("test.moderatedBy", { list: row.moderator_labels.join(", ") }) : ""}
        {iv && iv !== row.iv_label_original ? t("test.canonicalIv", { name: iv }) : ""}
        {dv && dv !== row.dv_label_original ? t("test.canonicalDv", { name: dv }) : ""}
        {row.evidence?.table_or_figure ? (captionOf(captions, row) ? t("test.tableCaption", { table: row.evidence.table_or_figure, caption: captionOf(captions, row)! }) : t("test.table", { table: row.evidence.table_or_figure })) : ""}
        {row.evidence ? t("test.page", { printed: row.evidence.printed_page ?? "?", pdf: row.evidence.pdf_page_index + 1 }) : ""}
      </div>
    </li>
  );
}

/** The other statements of one relationship next to the main one: where each is (table, page), its numbers, and what differs in the model. */
function RepeatsTable({ main, repeats, t, captions }: { main: PathRow; repeats: PathRow[]; t: Translate; captions: Map<string, string> }) {
  const sameAsMain = (r: PathRow) => r.estimate === main.estimate && formatP(r) === formatP(main) && (r.se ?? null) === (main.se ?? null);
  return (
    <table className="repeats-table" data-testid="repeats-table">
      <thead>
        <tr>
          <th>{t("repeats.col.where")}</th>
          <th>{t("repeats.col.estimate")}</th>
          <th>{t("repeats.col.p")}</th>
          <th>{t("repeats.col.n")}</th>
          <th>{t("repeats.col.model")}</th>
        </tr>
      </thead>
      <tbody>
        {[main, ...repeats].map((r, i) => {
          const diff = i === 0 ? null : covariateDiff(main, r);
          return (
            <tr key={r.id}>
              <td>
                <Link href={`/papers/${r.paper_id}?focus=${encodeURIComponent(r.natural_key)}`}>
                  {[r.evidence?.table_or_figure, r.evidence ? t("repeats.page", { p: r.evidence.printed_page ?? r.evidence.pdf_page_index + 1 }) : null].filter(Boolean).join(" · ") || t("repeats.open")}
                </Link>
                {i === 0 && <span className="muted"> ({t("repeats.main")})</span>}
                {captionOf(captions, r) && <div className="muted">{captionOf(captions, r)}</div>}
              </td>
              <td>{[formatEstimate(r), formatSe(r), formatCi(r)].filter(Boolean).join(", ")}</td>
              <td>{formatP(r)}</td>
              <td>{sampleSize(r)?.toLocaleString("en-US") ?? ""}</td>
              <td>
                {i === 0 ? (
                  <span className="muted">{(main.model_covariates ?? []).join(", ") || t("repeats.noVars")}</span>
                ) : (
                  <>
                    {sameAsMain(r) && <span className="muted">{t("repeats.sameNumber")} </span>}
                    {diff && diff.added.length + diff.missing.length === 0 ? (
                      <span className="muted">{t("repeats.sameVars")}</span>
                    ) : (
                      <span>
                        {diff?.added.map((x) => `+ ${x}`).join(", ")}
                        {diff && diff.added.length > 0 && diff.missing.length > 0 ? "; " : ""}
                        {diff?.missing.map((x) => `− ${x}`).join(", ")}
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { lang, t, tn } = await getT();
  const rawParams = await searchParams;
  const query = parseQuery(rawParams);
  const linkedRelease = (Array.isArray(rawParams.v) ? rawParams.v[0] : rawParams.v)?.trim().slice(0, 20) || null;
  const [rows, concepts, items, release, captions] = await Promise.all([listPathRows(), listConcepts(), listLibraryItems(), getLatestRelease(), listTableCaptions()]);
  const stale = staleWarning(linkedRelease, release, lang);
  const corpus = describeCorpus(items);
  const countries = [...new Set(rows.flatMap((r) => sampleOf(r)?.country_iso ?? []))].sort((x, y) => countryLabel(x, lang).localeCompare(countryLabel(y, lang), lang));
  const studyFilterOn = query.from !== null || query.to !== null || query.design.length + query.sample.length + query.country.length > 0;
  const names = suggestions(rows, concepts);
  const conceptName = new Map(concepts.map((c) => [c.id, c.canonical_name]));
  const result = hasQuestion(query) ? searchRelations(rows, concepts, query) : null;
  if (result) await countUse("relation_search");
  const s = result?.summary;
  const merged = result ? matchedConcepts(query, concepts) : [];
  const forest = result ? buildForest(result.rows.filter((r) => query.includeWarn || isVerified(r))) : null;
  const designKeys = labelKeys("design").filter((k) => k !== "unknown");
  const sampleKeys = labelKeys("sample").filter((k) => k !== "unknown");

  return (
    <>
      <h1>{t("search.title")}</h1>
      <p className="muted open-note" data-testid="open-note">
        {t("search.openNote")}
      </p>
      <form method="get" action="/" className="relation-form" data-testid="relation-form">
        <div className="relation-inputs">
          <label>
            {t("search.varA")} <input name="a" list="variable-names" defaultValue={query.a} placeholder={t("search.placeholderA")} />
          </label>
          <label>
            {t("search.direction")}
            <select name="dir" defaultValue={query.dir}>
              <option value="ab">{t("search.dir.ab")}</option>
              <option value="ba">{t("search.dir.ba")}</option>
              <option value="both">{t("search.dir.both")}</option>
            </select>
          </label>
          <label>
            {t("search.varB")} <input name="b" list="variable-names" defaultValue={query.b} placeholder={t("search.placeholderB")} />
          </label>
          <button type="submit">{t("search.submit")}</button>
        </div>
        <datalist id="variable-names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <fieldset>
          <legend>{t("search.role.legend")}</legend>
          {(["direct", "mediated", "moderated", "all"] as const).map((value) => (
            <label key={value}>
              <input type="radio" name="role" value={value} defaultChecked={query.role === value} /> {tk(t, `search.role.${value}`)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t("search.filter.legend")}</legend>
          <span className="muted">{t("search.filter.outcome")}</span>
          {OUTCOME.map((key) => (
            <label key={key}>
              <input type="checkbox" name="status" value={key} defaultChecked={query.status.includes(key)} /> {outcomeLabel(t, key)}
            </label>
          ))}
          <br />
          <span className="muted">{t("search.filter.estimate")}</span>
          {ESTIMATES.map((e) => (
            <label key={e}>
              <input type="checkbox" name="est" value={e} defaultChecked={query.est.includes(e)} /> {label(t, "estimate", e)}
            </label>
          ))}
          <br />
          <span className="muted">{t("search.filter.sign")}</span>
          {(["positive", "negative", "none"] as const).map((value) => (
            <label key={value}>
              <input type="checkbox" name="sign" value={value} defaultChecked={query.sign.includes(value)} /> {label(t, "sign", value)}
            </label>
          ))}
        </fieldset>
        <details open={studyFilterOn} data-testid="study-filters">
          <summary>
            {t("search.study.summary")}
            {studyFilterOn ? t("search.study.on") : ""}
          </summary>
          <fieldset>
            <legend>{t("search.study.year")}</legend>
            <label>
              {t("search.study.from")} <input type="number" name="from" min={1900} max={2100} defaultValue={query.from ?? ""} />
            </label>{" "}
            <label>
              {t("search.study.to")} <input type="number" name="to" min={1900} max={2100} defaultValue={query.to ?? ""} />
            </label>
          </fieldset>
          <fieldset>
            <legend>{t("search.study.design")}</legend>
            {designKeys.map((value) => (
              <label key={value}>
                <input type="checkbox" name="design" value={value} defaultChecked={query.design.includes(value)} /> {label(t, "design", value)}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t("search.study.sample")}</legend>
            {sampleKeys.map((value) => (
              <label key={value}>
                <input type="checkbox" name="sample" value={value} defaultChecked={query.sample.includes(value)} /> {label(t, "sample", value)}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t("search.study.country")}</legend>
            {countries.map((c) => (
              <label key={c}>
                <input type="checkbox" name="country" value={c} defaultChecked={query.country.includes(c)} /> {countryLabel(c, lang)}
              </label>
            ))}
          </fieldset>
        </details>
        <div>
          <input type="hidden" name="equiv" value="0" />
          <label>
            <input type="checkbox" name="equiv" value="1" defaultChecked={query.equiv} /> {t("search.equiv")}
          </label>{" "}
          <label>
            {t("search.sort")}{" "}
            <select name="sort" defaultValue={query.sort} data-testid="sort">
              {SORTS.map((k) => (
                <option key={k} value={k}>
                  {label(t, "sort", k)}
                </option>
              ))}
            </select>
          </label>{" "}
          <label>
            <input type="checkbox" name="warn" value="1" defaultChecked={query.includeWarn} /> {t("search.warn")}
          </label>
        </div>
      </form>

      {!result && (
        <section data-testid="samples">
          <details className="quick-guide" open data-testid="quick-guide">
            <summary>{t("guide.summary")}</summary>
            <ol>
              <li>
                <strong>{t("guide.1.lead")}</strong>
                {t("guide.1.rest")}
              </li>
              <li>
                <strong>{t("guide.2.lead")}</strong>
                {t("guide.2.rest")}
              </li>
              <li>
                <strong>{t("guide.3.lead")}</strong>
                {t("guide.3.rest")}
              </li>
            </ol>
            <p className="muted">
              {t("guide.moreBefore")}
              <Link href="/about">{t("guide.moreLink")}</Link>.
            </p>
          </details>
          <p className="muted">{t("guide.try")}</p>
          <ul className="sample-list">
            {SAMPLE_QUERIES.map((x) => (
              <li key={`${x.a}-${x.b}`}>
                <Link href={link({ ...DEFAULT_QUERY, ...x })}>
                  {x.a} → {x.b}
                </Link>
              </li>
            ))}
          </ul>
          <p className="muted">{t("guide.scope")}</p>
          <CorpusBlock corpus={corpus} t={t} tn={tn} open />
        </section>
      )}

      {result && s && (
        <>
          <section className="summary" data-testid="summary">
            {stale && (
              <p data-testid="stale-release" role="alert">
                <strong>{t("result.stale")}</strong>
                {stale}
              </p>
            )}
            <p data-testid="summary-coverage">
              {t("result.coverage.before")}
              <strong>{t("result.coverage.strong", { tests: tn("n.tests", s.matchedTests), papers: tn("n.papers", s.matchedPapers) })}</strong>
              {t("result.coverage.after", { corpus: s.corpusPapers })}
            </p>
            {s.tests === 0 && s.notCounted > 0 ? (
              // Tests exist but none is ✓ / ★: say so, instead of "0 papers" and a row of zeros.
              <p data-testid="summary-counts">
                <strong>{t("result.noneVerified")}</strong>
              </p>
            ) : (
              <>
                <p data-testid="summary-counts">
                  <strong>{t("result.counts", { papers: tn("n.papers", s.papers), studies: tn("n.studies", s.studies), tests: tn("n.tests", s.tests) })}</strong>
                </p>
                <p data-testid="summary-outcome">{t("result.outcome", { list: OUTCOME.map((key) => `${outcomeLabel(t, key)} ${s.outcome[key]}`).join(" · ") })}</p>
                <p data-testid="summary-direction">
                  {t("result.direction", {
                    list: `${label(t, "sign", "positive")} ${s.direction.positive} · ${label(t, "sign", "negative")} ${s.direction.negative} · ${label(t, "sign", "none")} ${s.direction.none}${s.direction.unknown ? ` · ${label(t, "sign", "unknown")} ${s.direction.unknown}` : ""}`,
                  })}
                </p>
              </>
            )}
            {s.notCounted > 0 && (
              <p data-testid="summary-not-counted">
                {tn("result.notCounted", s.notCounted)}
                {Object.keys(s.notCountedByDesign).length > 0
                  ? ` (${Object.entries(s.notCountedByDesign)
                      .map(([d, n]) => t("result.notCounted.design", { n, design: label(t, "design", d).toLowerCase() }))
                      .join(", ")})`
                  : ""}
                . <Link href={link({ ...query, includeWarn: true })}>{t("result.notCounted.link")}</Link>
                {s.shareNotCounted > 0.2 ? t("result.notCounted.bias") : ""}
              </p>
            )}
            <details className="summary-more" data-testid="summary-more">
              <summary>{t("result.more.summary")}</summary>
              {isSingleConcept(query) && (
                <p data-testid="single-note">
                  <strong>{t("result.single.lead")}</strong>
                  {t("result.single.rest", { term: singleTerm(query) })}
                </p>
              )}
              {merged.length > 0 && (
                <p data-testid="summary-merged" className="muted">
                  {t("result.merged.lead")}{" "}
                  {merged
                    .map((m) =>
                      t("result.merged.item", {
                        term: m.term,
                        concepts: m.concepts
                          .map((c) => t("result.merged.alias", { name: c.canonical_name, aliases: c.aliases.join(", ") || t("result.merged.noAlias") }))
                          .join("; "),
                      }),
                    )
                    .join(" · ")}
                  . <Link href="/concepts">{t("result.merged.linkBefore")}</Link>
                  {t("result.merged.after")}
                </p>
              )}
              {!(s.tests === 0 && s.notCounted > 0) && (
                <>
                  <p className="muted" data-testid="summary-method">
                    {t("result.method")}
                  </p>
                  <p data-testid="summary-estimates">
                    {t("result.estimates", { list: ESTIMATES.filter((e) => s.estimates[e] > 0).map((e) => `${label(t, "estimate", e)} ${s.estimates[e]}`).join(" · ") })}
                    {ESTIMATES.filter((e) => e !== "none" && s.estimates[e] > 0).length > 1 ? t("result.estimates.warn") : ""}
                  </p>
                </>
              )}
              <CorpusBlock corpus={corpus} t={t} tn={tn} />
              <ul>
                <li>{t("result.howTo.1")}</li>
                <li>{t("result.howTo.2")}</li>
                <li>{t("result.howTo.3")}</li>
                <li>{t("result.howTo.4")}</li>
              </ul>
            </details>
          </section>

          {result.rows.length === 0 ? (
            <section data-testid="empty">
              <p>
                <strong>{t("result.empty.lead")}</strong>
                {t("result.empty.rest")}
              </p>
              <ul>
                {query.dir !== "both" && (
                  <li>
                    <Link href={link({ ...query, dir: "both" })}>{t("result.empty.bothDirections")}</Link>
                  </li>
                )}
                {!query.equiv && (
                  <li>
                    <Link href={link({ ...query, equiv: true })}>{t("result.empty.equiv")}</Link>
                  </li>
                )}
                {query.role !== "all" && (
                  <li>
                    <Link href={link({ ...query, role: "all" })}>{t("result.empty.allRoles")}</Link>
                  </li>
                )}
              </ul>
            </section>
          ) : (
            <section data-testid="results">
              <p>
                <a href={`/export?${queryToSearch(query)}`} download data-testid="export-excel">
                  {tn("result.export.excel", result.rows.length)}
                </a>
                {" · "}
                <a href={`/export/word?${queryToSearch(query)}`} download data-testid="export-word">
                  {t("result.export.word")}
                </a>
                {" · "}
                <a href={`/export/csv?${queryToSearch(query)}`} download data-testid="export-csv">
                  {t("result.export.csv")}
                </a>
                {" · "}
                <PermalinkButton path={`/?${queryToSearch(query)}${release ? `&v=${encodeURIComponent(release.id)}` : ""}`} testId="permalink" />{" "}
                <span className="muted">
                  {t("result.export.note")}
                  {release ? t("result.export.release", { label: releaseLabel(release, lang) }) : ""}
                </span>
              </p>
              {forest && <ForestPlot forest={forest} t={t} />}
              {result.groups.map((g) => (
                <div key={g.paperId} className="relation-paper" data-testid={`paper-${g.paperId}`}>
                  <h3>
                    <Link href={`/papers/${g.paperId}`}>{paperLabel(g.paper)}</Link>
                    <span className="muted">
                      {g.paper?.journal ? ` · ${g.paper.journal}` : ""}
                      {g.differs ? t("result.paper.differs") : ""}
                    </span>
                  </h3>
                  {g.rows.some(isVerified) && (
                    <ul>
                      {groupRepeats(g.rows.filter(isVerified)).map(({ main, repeats }) => (
                        <Fragment key={main.id}>
                          <TestLine row={main} concepts={conceptName} roles={rolesInTest(main, concepts, query)} t={t} captions={captions} />
                          {repeats.length > 0 && (
                            <li className="repeats-item">
                              <details className="repeats" data-testid={`repeats-${main.id}`}>
                                <summary>{tn("result.repeats", repeats.length)}</summary>
                                <RepeatsTable main={main} repeats={repeats} t={t} captions={captions} />
                              </details>
                            </li>
                          )}
                        </Fragment>
                      ))}
                    </ul>
                  )}
                  {g.rows.some((r) => !isVerified(r)) && (
                    <details className="unverified" data-testid={`unverified-${g.paperId}`}>
                      <summary>{tn("result.unverified", g.rows.filter((r) => !isVerified(r)).length)}</summary>
                      <ul>
                        {g.rows.filter((r) => !isVerified(r)).map((r) => (
                          <TestLine key={r.id} row={r} concepts={conceptName} roles={rolesInTest(r, concepts, query)} t={t} captions={captions} />
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
