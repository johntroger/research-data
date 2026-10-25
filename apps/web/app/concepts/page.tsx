import Link from "next/link";
import { summariseConcepts } from "@/lib/concepts";
import { listConceptDetails, listPathRows } from "@/lib/data";
import { queryToSearch, DEFAULT_QUERY } from "@/lib/relations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Khái niệm chuẩn và tên gọi đã gộp" };

export default async function ConceptsPage() {
  const [concepts, rows] = await Promise.all([listConceptDetails(), listPathRows()]);
  const list = summariseConcepts(concepts, rows);
  const used = list.filter((c) => c.tests > 0).length;
  return (
    <article className="about" data-testid="concepts">
      <h1>Khái niệm chuẩn và tên gọi đã gộp</h1>
      <p>
        Mỗi bài gọi cùng một khái niệm bằng tên khác nhau (ví dụ “customer trust” và “brand trust”). Khi bật “Bao gồm tên gọi tương đương”, tìm kiếm coi các tên dưới đây là một. Danh sách chỉ gộp khi hai tên cùng nghĩa; khái niệm con (ví dụ state gratitude), điều kiện thực nghiệm và biến nhân khẩu học được giữ riêng (“không chắc thì tách”). Nếu bạn thấy một chỗ gộp chưa đúng, hãy báo cho chủ dự án qua email ở trang <Link href="/about">Giới thiệu</Link>.
      </p>
      <p className="muted" data-testid="concepts-total">
        {list.length} khái niệm chuẩn, {used} khái niệm đã gắn với ít nhất một kiểm định. Tên các biến mà tác giả dùng nhưng chưa nằm trong danh sách vẫn tìm được theo chữ đã gõ.
      </p>
      <div className="matrix-scroll">
        <table className="about-table">
          <thead>
            <tr>
              <th>Khái niệm chuẩn</th>
              <th>Các tên đã gộp</th>
              <th>Tên tác giả đã dùng (số kiểm định)</th>
              <th>Kiểm định</th>
              <th>Bài</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} data-testid={`concept-${c.id}`}>
                <th scope="row">
                  <Link href={`/?${queryToSearch({ ...DEFAULT_QUERY, a: c.canonical_name })}`}>{c.canonical_name}</Link>
                  <div className="muted">{c.definition}</div>
                </th>
                <td>{c.aliases.length ? c.aliases.join("; ") : <span className="muted">không có</span>}</td>
                <td>{c.usedNames.length ? c.usedNames.map((u) => `${u.label} (${u.n})`).join("; ") : <span className="muted">chưa có</span>}</td>
                <td>{c.tests}</td>
                <td>{c.papers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
