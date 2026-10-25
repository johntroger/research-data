import Link from "next/link";
import { summariseConcepts } from "@/lib/concepts";
import { listConceptDetails, listPathRows } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { queryToSearch, DEFAULT_QUERY, normalise } from "@/lib/relations";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("concepts.title") };
}

export default async function ConceptsPage() {
  const { t } = await getT();
  const [concepts, rows] = await Promise.all([listConceptDetails(), listPathRows()]);
  const list = summariseConcepts(concepts, rows);
  const used = list.filter((c) => c.tests > 0).length;
  return (
    <article className="about" data-testid="concepts">
      <h1>{t("concepts.title")}</h1>
      <p>
        {t("concepts.intro.before")}
        <Link href="/about">{t("concepts.intro.link")}</Link>
        {t("concepts.intro.after")}
      </p>
      <p className="muted" data-testid="concepts-total">
        {t("concepts.total", { n: list.length, used })}
      </p>
      <div className="matrix-scroll">
        <table className="about-table">
          <thead>
            <tr>
              <th>{t("concepts.col.concept")}</th>
              <th>{t("concepts.col.aliases")}</th>
              <th>{t("concepts.col.used")}</th>
              <th>{t("concepts.col.tests")}</th>
              <th>{t("concepts.col.papers")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const others = c.aliases.filter((a) => normalise(a) !== normalise(c.canonical_name));
              return (
                <tr key={c.id} data-testid={`concept-${c.id}`}>
                  <th scope="row">
                    <Link href={`/?${queryToSearch({ ...DEFAULT_QUERY, a: c.canonical_name })}`}>{c.canonical_name}</Link>
                    <div className="muted">{c.definition}</div>
                  </th>
                  <td>{others.length ? others.join("; ") : <span className="muted">{t("concepts.none")}</span>}</td>
                  <td>{c.usedNames.length ? c.usedNames.map((u) => `${u.label} (${u.n})`).join("; ") : <span className="muted">{t("concepts.noneYet")}</span>}</td>
                  <td>{c.tests}</td>
                  <td>{c.papers}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
