import Link from "next/link";
import { listBadgeCounts, listPapers, paperLabel } from "@/lib/data";
import { paperLabel as citation } from "@/lib/relations";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [papers, counts] = await Promise.all([listPapers(), listBadgeCounts()]);

  return (
    <>
      <h1>Thư viện: bài báo trong kho</h1>
      {papers.length === 0 ? (
        <p className="muted">Chưa có bài nào. Chạy `pnpm worker extract` rồi nhập dữ liệu để đưa bài vào database.</p>
      ) : (
        <ul className="paper-list">
          {papers.map((paper) => {
            const c = counts.get(paper.id);
            const who = paper.title ? citation({ title: paper.title, authors: paper.authors ?? [], year: paper.year, journal: paper.journal, citekey: null, apa_citation: null }) : null;
            const details = [who !== paper.title ? who : null, paper.journal, `${paper.page_count ?? "?"} trang`].filter(Boolean).join(" · ");
            return (
              <li key={paper.id} data-testid={`library-${paper.id}`}>
                <Link href={`/papers/${paper.id}`}>{paperLabel(paper)}</Link>
                <div className="muted">{details}</div>
                {c && (
                  <div className="library-counts" data-testid="library-counts">
                    <span className="badge badge-auto_verified">✓ {c.verified}</span> · <span className="badge badge-needs_attention">⚠ {c.attention}</span> ·{" "}
                    <span className="badge badge-ai_interpreted">◇ {c.interpreted}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
