import Link from "next/link";
import { listPapers, paperLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const papers = await listPapers();

  return (
    <>
      <h1>Thư viện: bài báo trong kho</h1>
      {papers.length === 0 ? (
        <p className="muted">Chưa có bài nào. Chạy `pnpm worker extract` rồi nhập dữ liệu để đưa bài vào database.</p>
      ) : (
        <ul className="paper-list">
          {papers.map((paper) => (
            <li key={paper.id}>
              <Link href={`/papers/${paper.id}`}>{paperLabel(paper)}</Link>
              <span className="muted"> · {paper.page_count ?? "?"} trang</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
