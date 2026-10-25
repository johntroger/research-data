import Link from "next/link";
import { buildEvidenceMap, cellKey, supportShare } from "@/lib/evidence-map";
import { listConcepts, listPathRows } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { DEFAULT_QUERY, queryToSearch } from "@/lib/relations";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("map.title") };
}

export default async function EvidenceMapPage() {
  const { t, tn } = await getT();
  const [paths, concepts] = await Promise.all([listPathRows(), listConcepts()]);
  const map = buildEvidenceMap(paths, concepts);
  const cellsTotal = map.rows.length * map.cols.length;
  return (
    <article data-testid="evidence-map">
      <h1>{t("map.title")}</h1>
      <p>
        {t("map.intro.1")}
        <strong>✓</strong>
        {t("map.intro.2")}
        <strong>✗</strong>
        {t("map.intro.3")}
        <strong>{t("map.intro.gap")}</strong>
        {t("map.intro.4")}
      </p>
      <p className="muted" data-testid="map-summary">
        {t("map.summary.before", { filled: map.filled, total: cellsTotal, placed: map.placed, notPlaced: map.notPlaced })}
        <Link href="/concepts">{t("map.summary.link")}</Link>
        {t("map.summary.after")}
      </p>
      {map.filled === 0 ? (
        <p className="muted">{t("map.none")}</p>
      ) : (
        <div className="matrix-scroll">
          <table className="evidence-grid">
            <thead>
              <tr>
                <th scope="col" className="corner">
                  {t("map.corner")}
                </th>
                {map.cols.map((c) => (
                  <th key={c.id} scope="col">
                    <span className="vlabel">{c.canonical_name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {map.rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.canonical_name}</th>
                  {map.cols.map((c) => {
                    const cell = map.cells.get(cellKey(r.id, c.id));
                    if (!cell) return <td key={c.id} className="empty" aria-label={t("map.emptyCell", { iv: r.canonical_name, dv: c.canonical_name })} />;
                    const share = supportShare(cell);
                    const href = `/?${queryToSearch({ ...DEFAULT_QUERY, a: r.canonical_name, b: c.canonical_name })}`;
                    return (
                      <td key={c.id} style={share === null ? undefined : { background: `hsl(${Math.round(share * 120)} 55% 82%)` }} data-testid={`cell-${r.id}-${c.id}`}>
                        <Link href={href} title={t("map.cellTitle", { iv: r.canonical_name, dv: c.canonical_name, tests: tn("n.tests", cell.tests), papers: tn("n.papers", cell.papers) })}>
                          <strong>{cell.tests}</strong>
                          <span className="muted">{tn("map.papers", cell.papers)}</span>
                          {share !== null && (
                            <span className="support">
                              {" "}
                              ✓{cell.supported} ✗{cell.notSupported}
                              {cell.mixed > 0 ? ` ◐${cell.mixed}` : ""}
                            </span>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
