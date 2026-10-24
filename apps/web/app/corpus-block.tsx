import Link from "next/link";
import { type CorpusSummary, RECENT_FROM } from "@/lib/corpus";

const parts = (xs: { label: string; n: number }[], limit = 4) => xs.slice(0, limit).map((x) => `${x.label} ${x.n}`).join(" · ");

export function CorpusBlock({ corpus, open = false }: { corpus: CorpusSummary; open?: boolean }) {
  return (
    <details className="corpus-block" open={open} data-testid="corpus">
      <summary>
        Kho này gồm gì: {corpus.papers} bài
        {corpus.yearMin !== null ? `, năm ${corpus.yearMin}–${corpus.yearMax}` : ""}
      </summary>
      <ul>
        <li data-testid="corpus-years">
          {corpus.recent} bài từ {RECENT_FROM} trở lại; {corpus.papers - corpus.recent - corpus.noYear} bài trước đó
          {corpus.noYear > 0 ? `; ${corpus.noYear} bài chưa rõ năm` : ""}.
        </li>
        {corpus.types.length > 0 && <li>Loại bài: {parts(corpus.types)}.</li>}
        {corpus.designs.length > 0 && <li>Thiết kế (số bài): {parts(corpus.designs, 5)}.</li>}
        {corpus.samples.length > 0 && <li>Mẫu (số bài): {parts(corpus.samples, 5)}; {corpus.countries} quốc gia.</li>}
        <li data-testid="corpus-caveat">
          <strong>Không phải mẫu hệ thống của y văn:</strong> kho gồm các bài trong thư viện Zotero của chủ dự án (marketing, đạo đức, hành vi người tiêu dùng; định lượng, tiếng Anh), chọn theo nhu cầu nghiên cứu, không qua tìm kiếm hay sàng lọc theo quy trình PRISMA. Số bài nhỏ nên một kết quả "ủng hộ" hay "không ủng hộ" chỉ nói về các bài này.
        </li>
      </ul>
      <p className="muted">
        Xem từng bài và lọc theo năm, thiết kế, mẫu trong <Link href="/library">danh sách bài</Link>.
      </p>
    </details>
  );
}
