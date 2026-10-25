import { getLatestRelease, getOverview } from "@/lib/data";
import { CopyButton } from "@/app/library/copy-button";
import { getT } from "@/lib/i18n-server";
import { releaseDate, releaseLabel, toolCitation } from "@/lib/release";

export const dynamic = "force-dynamic";
/** The public address for takedown and correction requests (step 4.8). */
const TAKEDOWN_EMAIL = "tranthanhtung37@gmail.com";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("about.title") };
}

export default async function AboutPage() {
  const { lang, t, tn } = await getT();
  const [o, release] = await Promise.all([getOverview(), getLatestRelease()]);
  const citation = toolCitation(release, new Date());
  const numbers = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US");
  const badges = [
    { mark: "✓", name: t("about.badge.verified.name"), cls: "badge-auto_verified", text: t("about.badge.verified.text") },
    { mark: "⚠", name: t("about.badge.attention.name"), cls: "badge-needs_attention", text: t("about.badge.attention.text") },
    { mark: "◇", name: t("about.badge.ai.name"), cls: "badge-ai_interpreted", text: t("about.badge.ai.text") },
    { mark: "★", name: t("about.badge.edited.name"), cls: "", text: t("about.badge.edited.text") },
  ];
  const audits = [1, 2, 3].map((n) => [t(`about.audit.${n}.round` as "about.audit.1.round"), t(`about.audit.${n}.sample` as "about.audit.1.sample"), t(`about.audit.${n}.result` as "about.audit.1.result"), t(`about.audit.${n}.marker` as "about.audit.1.marker")]);
  return (
    <article className="about" data-testid="about">
      <h1>{t("about.title")}</h1>

      <h2>{t("about.what.h")}</h2>
      <p>
        <strong>{t("about.what.reference")}</strong>
        {t("about.what.1")}
        <strong>{t("about.what.responsibility")}</strong>
        {t("about.what.2")}
      </p>
      <p data-testid="about-open">
        <strong>{t("about.open.lead")}</strong>
        {t("about.open.rest")}
      </p>

      <h2>{t("about.privacy.h")}</h2>
      <p data-testid="about-privacy">
        {t("about.privacy.lead")}
        <strong>{t("about.privacy.strong")}</strong>
        {t("about.privacy.rest")}
      </p>

      <h2>{t("about.repo.h")}</h2>
      <p data-testid="about-overview">
        {t("about.repo.lead", { papers: tn("n.papers", o.papers), fields: numbers.format(o.fields) })}
        <span className="badge badge-auto_verified">✓ {numbers.format(o.verified)}</span> · <span className="badge badge-needs_attention">⚠ {numbers.format(o.attention)}</span> ·{" "}
        <span className="badge badge-ai_interpreted">◇ {numbers.format(o.interpreted)}</span>. {t("about.repo.rest")}
      </p>

      {release && (
        <p data-testid="about-release">
          <strong>{t("about.release.lead")}</strong> {t("about.release.rest", { label: releaseLabel(release, lang), date: releaseDate(release, lang), version: release.canonical_version })}
          {release.note ? ` ${release.note}` : ""}
          {t("about.release.more")}
        </p>
      )}

      <h2>{t("about.how.h")}</h2>
      <ol>
        <li>{t("about.how.1")}</li>
        <li>
          {t("about.how.2.before")}
          <em>{t("about.how.2.quote")}</em>
          {t("about.how.2.after")}
        </li>
        <li>{t("about.how.3")}</li>
        <li>{t("about.how.4")}</li>
      </ol>
      <p>{t("about.how.note")}</p>

      <h2>{t("about.badges.h")}</h2>
      <table className="about-table">
        <tbody>
          {badges.map((b) => (
            <tr key={b.mark}>
              <th scope="row">
                <span className={`badge ${b.cls}`}>{b.mark}</span> {b.name}
              </th>
              <td>{b.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{t("about.badges.note")}</p>

      <h2>{t("about.audit.h")}</h2>
      <p>{t("about.audit.intro")}</p>
      <div className="matrix-scroll">
        <table className="about-table" data-testid="about-audits">
          <thead>
            <tr>
              <th>{t("about.audit.col.round")}</th>
              <th>{t("about.audit.col.sample")}</th>
              <th>{t("about.audit.col.result")}</th>
              <th>{t("about.audit.col.marker")}</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a[0]}>
                {a.map((c, i) => (i === 0 ? <th scope="row" key={i}>{c}</th> : <td key={i}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{t("about.audit.note")}</p>

      <h2>{t("about.limits.h")}</h2>
      <ul>
        <li>{t("about.limits.1")}</li>
        <li>{t("about.limits.2")}</li>
        <li>{t("about.limits.3")}</li>
        <li>{t("about.limits.4")}</li>
        <li>{t("about.limits.5")}</li>
      </ul>

      <h2>{t("about.files.h")}</h2>
      <p>{t("about.files.intro")}</p>
      <ul>
        <li>
          <code>estimate</code> {t("about.files.estimate")}
        </li>
        <li>
          <code>estimate_type</code> {t("about.files.estimateType")}
        </li>
        <li>
          <code>se</code>, <code>ci_low</code>, <code>ci_high</code> {t("about.files.interval")}
        </li>
        <li>
          <code>n</code> {t("about.files.n")}
        </li>
        <li>
          <code>result</code> {t("about.files.result")} (<code>supported</code>, <code>not_supported</code>, <code>partially_supported</code>, <code>not_hypothesized</code>)
        </li>
        <li>
          <code>effect_direction</code> {t("about.files.direction")} (<code>positive</code>, <code>negative</code>, <code>none</code>, <code>unknown</code>)
        </li>
        <li>
          <code>badge</code> {t("about.files.badge")} (<code>auto_verified</code>, <code>needs_attention</code>, <code>ai_interpreted</code>, <code>human_reviewed</code>)
        </li>
        <li>
          <code>printed_page</code>, <code>pdf_page</code> {t("about.files.pages")}
        </li>
      </ul>

      <h2 id="cach-trich-dan">{t("about.cite.h")}</h2>
      <p>{t("about.cite.p")}</p>
      <blockquote data-testid="tool-citation">{citation}</blockquote>
      <p>
        <CopyButton text={citation} label={t("about.cite.copy")} testId="copy-tool-citation" />
      </p>

      <h2>{t("about.content.h")}</h2>
      <p>
        {t("about.content.p")}
        <a href={`mailto:${TAKEDOWN_EMAIL}?subject=${encodeURIComponent(t("about.content.subject"))}`} data-testid="takedown-contact">
          {TAKEDOWN_EMAIL}
        </a>
        {t("about.content.after")}
      </p>
    </article>
  );
}
