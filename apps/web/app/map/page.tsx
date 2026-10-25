import Link from "next/link";
import { buildEvidenceMap, cellKey, supportShare } from "@/lib/evidence-map";
import { listConcepts, listPathRows } from "@/lib/data";
import { DEFAULT_QUERY, queryToSearch } from "@/lib/relations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bản đồ bằng chứng" };

export default async function EvidenceMapPage() {
  const [paths, concepts] = await Promise.all([listPathRows(), listConcepts()]);
  const map = buildEvidenceMap(paths, concepts);
  const cellsTotal = map.rows.length * map.cols.length;
  return (
    <article data-testid="evidence-map">
      <h1>Bản đồ bằng chứng</h1>
      <p>
        Mỗi ô là một cặp khái niệm chuẩn (hàng: khái niệm làm biến độc lập, cột: khái niệm làm biến phụ thuộc) có ít nhất một kiểm định tác động trực tiếp trong kho. Số lớn là số kiểm định, số nhỏ là số bài; <strong>✓</strong> là số kiểm định giả thuyết đã kiểm chứng và được ủng hộ, <strong>✗</strong> là không được ủng hộ. Màu từ đỏ (phần lớn không ủng hộ) đến xanh (phần lớn ủng hộ); ô xám chưa có kiểm định giả thuyết nào đã kiểm chứng. <strong>Ô trống là khoảng trống của kho này, chưa chắc là khoảng trống của lĩnh vực.</strong> Bấm một ô để xem từng kiểm định.
      </p>
      <p className="muted" data-testid="map-summary">
        {map.filled} / {cellsTotal} ô có kiểm định. Bản đồ đặt được {map.placed} kiểm định trực tiếp; còn {map.notPlaced} kiểm định chưa đặt được vì một đầu chưa gắn khái niệm chuẩn (xem <Link href="/concepts">danh sách khái niệm</Link>; các nhãn đó vẫn tìm được ở trang Tìm theo quan hệ).
      </p>
      {map.filled === 0 ? (
        <p className="muted">Chưa có cặp khái niệm nào có kiểm định.</p>
      ) : (
        <div className="matrix-scroll">
          <table className="evidence-grid">
            <thead>
              <tr>
                <th scope="col" className="corner">
                  Độc lập ↓ · Phụ thuộc →
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
                    if (!cell) return <td key={c.id} className="empty" aria-label={`${r.canonical_name} → ${c.canonical_name}: không có kiểm định`} />;
                    const share = supportShare(cell);
                    const href = `/?${queryToSearch({ ...DEFAULT_QUERY, a: r.canonical_name, b: c.canonical_name })}`;
                    return (
                      <td key={c.id} style={share === null ? undefined : { background: `hsl(${Math.round(share * 120)} 55% 82%)` }} data-testid={`cell-${r.id}-${c.id}`}>
                        <Link href={href} title={`${r.canonical_name} → ${c.canonical_name}: ${cell.tests} kiểm định từ ${cell.papers} bài`}>
                          <strong>{cell.tests}</strong>
                          <span className="muted"> · {cell.papers} bài</span>
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
