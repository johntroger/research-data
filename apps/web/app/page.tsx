import Link from "next/link";
import { CopyButton } from "@/app/library/copy-button";
import { CorpusBlock } from "@/app/corpus-block";
import { ForestPlot } from "@/app/forest-plot";
import { buildForest } from "@/lib/forest";
import { describeCorpus } from "@/lib/corpus";
import { PermalinkButton } from "@/app/permalink-button";
import { getLatestRelease, listConcepts, listLibraryItems, listPathRows } from "@/lib/data";
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

function TestLine({ row, concepts, roles = [], t }: { row: PathRow; concepts: Map<string, string>; roles?: string[]; t: Translate }) {
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
        {row.evidence ? t("test.page", { printed: row.evidence.printed_page ?? "?", pdf: row.evidence.pdf_page_index + 1 }) : ""}
      </div>
    </li>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { lang, t, tn } = await getT();
  const rawParams = await searchParams;
  const query = parseQuery(rawParams);
  const linkedRelease = (Array.isArray(rawParams.v) ? rawParams.v[0] : rawParams.v)?.trim().slice(0, 20) || null;
  const [rows, concepts, items, release] = await Promise.all([listPathRows(), listConcepts(), listLibraryItems(), getLatestRelease()]);
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
            {isSingleConcept(query) && (
              <p data-testid="single-note">
                <strong>{t("result.single.lead")}</strong>
                {t("result.single.rest", { term: singleTerm(query) })}
              </p>
            )}
            <p data-testid="summary-coverage">
              {t("result.coverage.before")}
              <strong>{t("result.coverage.strong", { tests: tn("n.tests", s.matchedTests), papers: tn("n.papers", s.matchedPapers) })}</strong>
              {t("result.coverage.after", { corpus: s.corpusPapers })}
            </p>
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
            <CorpusBlock corpus={corpus} t={t} tn={tn} />
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
                <p className="muted" data-testid="summary-method">
                  {t("result.method")}
                </p>
                <p data-testid="summary-estimates">
                  {t("result.estimates", { list: ESTIMATES.filter((e) => s.estimates[e] > 0).map((e) => `${label(t, "estimate", e)} ${s.estimates[e]}`).join(" · ") })}
                  {ESTIMATES.filter((e) => e !== "none" && s.estimates[e] > 0).length > 1 ? t("result.estimates.warn") : ""}
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
            <details>
              <summary>{t("result.howTo.summary")}</summary>
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
                  <ul>
                    {g.rows.map((r) => (
                      <TestLine key={r.id} row={r} concepts={conceptName} roles={rolesInTest(r, concepts, query)} t={t} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
