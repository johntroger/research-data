import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { countryLabel, label, type LabelGroup } from "@/lib/labels";
import { facetOptions, type FacetName, type LibraryItem, type LibraryQuery } from "@/lib/library";

const GROUPS: { facet: FacetName; param: string; title: "filters.years" | "filters.types" | "filters.designs" | "filters.samples" | "filters.countries"; group: LabelGroup | null }[] = [
  { facet: "years", param: "year", title: "filters.years", group: null },
  { facet: "types", param: "type", title: "filters.types", group: "ptype" },
  { facet: "designs", param: "design", title: "filters.designs", group: "design" },
  { facet: "samples", param: "sample", title: "filters.samples", group: "sample" },
  { facet: "countries", param: "country", title: "filters.countries", group: null },
];

/** The search box and facets shared by the library and the summary matrix: a GET form, so the filters live in the URL. */
export async function LibraryFilters({ all, query, filtered, action }: { all: LibraryItem[]; query: LibraryQuery; filtered: boolean; action: string }) {
  const { lang, t } = await getT();
  const name = (facet: FacetName, group: LabelGroup | null, v: string): string => {
    if (v === "unknown") return t("filters.unknown");
    if (facet === "countries") return `${countryLabel(v, lang)} (${v})`;
    return group ? label(t, group, v) : v;
  };
  return (
    <form method="get" action={action} className="library-filters" data-testid="library-filters">
      <div className="library-search">
        <input type="search" name="q" defaultValue={query.q} placeholder={t("filters.placeholder")} aria-label={t("filters.aria")} />
        <button type="submit">{t("filters.apply")}</button>
        {(filtered || query.q) && <Link href={action}>{t("filters.clear")}</Link>}
      </div>
      <div className="library-facets">
        {GROUPS.map((g) => (
          <details key={g.facet} open={query[g.facet].length > 0}>
            <summary>
              {t(g.title)}
              {query[g.facet].length > 0 && ` (${query[g.facet].length})`}
            </summary>
            {facetOptions(all, query, g.facet).map((o) => (
              <label key={o.value} className={o.count === 0 && !o.selected ? "muted" : undefined}>
                <input type="checkbox" name={g.param} value={o.value} defaultChecked={o.selected} /> {name(g.facet, g.group, o.value)} <span className="muted">({o.count})</span>
              </label>
            ))}
          </details>
        ))}
        <details open={query.trust !== "" || query.matrix}>
          <summary>{t("filters.trust.summary")}</summary>
          <label>
            {t("filters.trust.label")}{" "}
            <select name="trust" defaultValue={query.trust}>
              <option value="">{t("filters.trust.all")}</option>
              <option value="high">{t("filters.trust.high")}</option>
              <option value="mid">{t("filters.trust.mid")}</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="matrix" value="1" defaultChecked={query.matrix} /> {t("filters.matrix")}
          </label>
        </details>
      </div>
    </form>
  );
}
