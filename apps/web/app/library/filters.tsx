import Link from "next/link";
import { countryName, DESIGN_LABELS, facetOptions, PAPER_TYPE_LABELS, SAMPLE_LABELS, type FacetName, type LibraryItem, type LibraryQuery } from "@/lib/library";

const GROUPS: { facet: FacetName; param: string; title: string; label: (v: string) => string }[] = [
  { facet: "years", param: "year", title: "Năm", label: (v) => (v === "unknown" ? "Chưa rõ" : v) },
  { facet: "types", param: "type", title: "Loại bài", label: (v) => (v === "unknown" ? "Chưa rõ" : (PAPER_TYPE_LABELS[v] ?? v)) },
  { facet: "designs", param: "design", title: "Thiết kế nghiên cứu", label: (v) => (v === "unknown" ? "Chưa rõ" : (DESIGN_LABELS[v] ?? v)) },
  { facet: "samples", param: "sample", title: "Loại mẫu", label: (v) => (v === "unknown" ? "Chưa rõ" : (SAMPLE_LABELS[v] ?? v)) },
  { facet: "countries", param: "country", title: "Quốc gia", label: (v) => (v === "unknown" ? "Chưa rõ" : `${countryName(v)} (${v})`) },
];

/** The search box and facets shared by the library and the summary matrix: a GET form, so the filters live in the URL. */
export function LibraryFilters({ all, query, filtered, action }: { all: LibraryItem[]; query: LibraryQuery; filtered: boolean; action: string }) {
  return (
    <form method="get" action={action} className="library-filters" data-testid="library-filters">
      <div className="library-search">
        <input type="search" name="q" defaultValue={query.q} placeholder="Tìm theo tên bài, tác giả, tạp chí, DOI" aria-label="Tìm trong thư viện" />
        <button type="submit">Lọc</button>
        {(filtered || query.q) && <Link href={action}>Xóa lọc</Link>}
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
  );
}
