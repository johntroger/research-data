import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminDb } from "@/lib/admin-db";
import { getOwner } from "@/lib/supabase-server";
import { EVENT_LABELS } from "@/lib/usage";
import { loadUsage, toUsageTable } from "@/lib/usage-report";
import { loadUsageAsOwner } from "@/lib/usage-report-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lượt dùng" };

export default async function UsagePage() {
  // Owner only, like the quality page: the signed-in owner (a session) or the developer machine; anyone else gets a 404.
  const owner = await getOwner();
  if (!owner) notFound();
  const rows = owner.via === "session" ? await loadUsageAsOwner(30) : await withAdminDb((db) => loadUsage(db, 30));
  const t = toUsageTable(rows);

  return (
    <>
      <h1>Lượt dùng web</h1>
      <p className="muted">
        30 ngày gần nhất, đếm theo ngày (giờ Việt Nam) và theo loại. Chỉ là số đếm: không IP, không cookie, không biết ai. Lượt dùng của chính chủ không được đếm.{" "}
        <Link href="/admin/quality">Chất lượng trích xuất</Link>
      </p>
      {t.days.length === 0 ? (
        <p className="muted" data-testid="usage-empty">Chưa có lượt dùng nào được ghi.</p>
      ) : (
        <div className="matrix-scroll">
          <table className="quality-table" data-testid="usage-table">
            <thead>
              <tr>
                <th>Ngày</th>
                {t.events.map((e) => (
                  <th key={e}>{EVENT_LABELS[e]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.days.map((d) => (
                <tr key={d} data-testid={`usage-${d}`}>
                  <td>{d}</td>
                  {t.events.map((e) => (
                    <td key={e}>{t.cell(d, e) || ""}</td>
                  ))}
                </tr>
              ))}
              <tr data-testid="usage-total">
                <th>Tổng ({t.all})</th>
                {t.events.map((e) => (
                  <th key={e}>{t.totals[e]}</th>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
