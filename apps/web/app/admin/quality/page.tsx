import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminDb } from "@/lib/admin-db";
import { loadQuality, type QualityRow } from "@/lib/quality";
import { loadQualityAsOwner } from "@/lib/quality-session";
import { getOwner } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

function Table({ title, rows, testId }: { title: string; rows: QualityRow[]; testId: string }) {
  return (
    <section>
      <h2>{title}</h2>
      <table className="quality-table" data-testid={testId}>
        <thead>
          <tr>
            <th>Tên</th>
            <th title="Đã kiểm chứng">✓</th>
            <th title="Cần chú ý">⚠</th>
            <th title="AI diễn giải">◇</th>
            <th title="Bị ẩn">ẩn</th>
            <th title="(⚠ + ẩn) / (✓ + ⚠ + ẩn)">Tỷ lệ vấn đề</th>
            <th>Bài</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} data-testid={`${testId}-${r.name}`}>
              <td>{r.name}</td>
              <td>{r.verified}</td>
              <td>{r.attention}</td>
              <td>{r.interpreted}</td>
              <td>{r.hidden}</td>
              <td>{pct(r.problemRate)}</td>
              <td>{r.papers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function QualityPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Owner only: the signed-in owner (a session), or the developer machine (a direct database connection). Anyone else gets a 404.
  const owner = await getOwner();
  if (!owner) notFound();
  const raw = (await searchParams).source;
  const source = (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;
  const options = source ? { source } : {};
  const report = owner.via === "session" ? await loadQualityAsOwner(options) : await withAdminDb((db) => loadQuality(db, options));
  const t = report.total;

  return (
    <>
      <h1>Chất lượng trích xuất</h1>
      <p className="muted">Trang quản trị, chỉ chủ dự án thấy (đã đăng nhập, hoặc máy phát triển). Cùng số liệu với lệnh `pnpm worker quality`. <Link href="/admin/usage">Lượt dùng web</Link></p>
      <form method="get" className="quality-filter">
        <label>
          Lọc theo nguồn (model của lượt trích xuất, ví dụ <code>manual:codex</code> hoặc <code>gemini</code>){" "}
          <input name="source" defaultValue={source ?? ""} />
        </label>{" "}
        <button type="submit">Lọc</button> {source ? <Link href="/admin/quality">Bỏ lọc</Link> : null}
      </form>
      <p data-testid="quality-total">
        {report.papers} bài, {report.fields} trường: ✓ {t.verified} · ⚠ {t.attention} · ◇ {t.interpreted} · ẩn {t.hidden} · tỷ lệ vấn đề {pct(t.problemRate)}
      </p>

      <section>
        <h2>Cần chú ý: bài có trường ⚠ hoặc ẩn</h2>
        {report.attention.length === 0 ? (
          <p className="muted">Không có bài nào.</p>
        ) : (
          <ul className="attention-list" data-testid="attention-list">
            {report.attention.map((p) => (
              <li key={p.id} data-testid={`attention-${p.id}`}>
                <Link href={`/papers/${p.id}`}>{p.title}</Link>
                <span className="muted">
                  {" "}
                  · ⚠ {p.attention} · ẩn {p.hidden} · ✓ {p.verified} · tỷ lệ vấn đề {pct(p.problemRate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Table title="Theo nguồn (model)" rows={report.bySource} testId="by-source" />
      <Table title="Theo loại thiết kế" rows={report.byDesign} testId="by-design" />
      <Table title="Trường hay vướng nhất" rows={report.byField} testId="by-field" />

      <section>
        <h2>Kiểm tra hay hỏng nhất (trên trường ⚠ và ẩn)</h2>
        <table className="quality-table" data-testid="by-check">
          <thead>
            <tr>
              <th>Trường / kiểm tra</th>
              <th>Số trường</th>
              <th>Bài</th>
            </tr>
          </thead>
          <tbody>
            {report.byCheck.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.fields}</td>
                <td>{c.papers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
