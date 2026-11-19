# Dùng hằng ngày

> Thêm một bài mới vào kho, đưa lên web công khai và dùng web để làm nghiên cứu. Nguồn trích xuất và thứ tự ưu tiên ở `CLAUDE.md` và Mục 4.5 (`docs/integrations.md`); kiểm mẫu độ đúng ở Mục 6.10–6.12 (`docs/quality-assurance.md`).

## Thêm một bài mới (máy local)

Cần Docker Desktop đang chạy và `pnpm db:start`.

| Bước | Ai | Lệnh / việc |
| :--- | :--- | :--- |
| 1 | Bạn | Thả bài vào một thư mục Zotero được phép (danh sách trong `CLAUDE.md`). Bài ngoài các thư mục đó chỉ khi bạn đồng ý rõ. |
| 2 | Claude Code | `pnpm worker extract` nạp bài vào database local (đọc PDF, text layer; không tốn API). Metadata thiếu hoặc sai: `pnpm worker metadata --paper X` (Crossref). |
| 3 | Claude Code | `pnpm worker manual export --paper X --code Y` tạo gói việc ngoài repo (`PACKETS_DIR`, mặc định `C:\Projects\Research Data Packets\Y`), kèm `text/page-NN.txt`. |
| 4 | Claude Code / bạn | Trích xuất theo thứ tự: **tác tử Claude** (tiến trình con, chỉ làm trong thư mục gói); bài có tỷ lệ vấn đề > 20% thì báo bạn rồi thử **Codex** (bạn mở Codex **trong thư mục gói**, không mở repo vì repo có `.env`), rồi Antigravity. Gemini API chỉ khi bạn đồng ý chi tiền (trần 25 USD, đã chi 14,86). |
| 5 | Claude Code | `pnpm worker manual check <gói>` kiểm câu trả lời theo schema (không cần database). |
| 6 | Claude Code | `pnpm worker manual import <gói> --tool <claude\|codex> --model <tên>` xem trước; sau khi duyệt thêm `--yes` (tự sao lưu `pg_dump` vào `extracted_data/backups/`). |
| 7 | Claude Code | `pnpm worker highlights --paper X` (khung tô sáng PDF), `pnpm worker captions --paper X` (chú thích bảng), `pnpm worker summaries export / import --paper X` (câu hỏi nghiên cứu, kết luận chính). Không tốn API. |
| 8 | Claude Code | Khái niệm chuẩn có thêm tên mới: sửa `packages/schema/src/canonical-data.ts`, `pnpm canonical:build`, rồi `pnpm worker map-labels --yes`. |

Bộ kiểm chứng đổi (quy tắc mới trong `apps/worker/src/verify`): `pnpm worker republish --yes` đăng lại mọi bản đã lưu với quy tắc mới, không tốn API.

## Đưa lên web công khai (prod)

**Chưa có lệnh một bước** (`pnpm worker sync`, Giai đoạn 2 mục 3, chưa làm). Từ bước 2.3 (23/10/2026, 36 bài) chưa có bài mới nào lên prod, nên các bước dưới đây chưa được chạy trọn một lần; làm lần đầu thì đi từng bước và kiểm lại trên web.

1. **PDF lên R2:** khóa `pdf/<sha256>.pdf` trong bucket `research-data-pdfs` (như bước 2.2a, bằng `wrangler`; token đọc/ghi cho worker chưa tạo).
2. **Dữ liệu bài lên prod:** chưa có đường chính thức. Cách dự kiến (chưa thử): chạy `manual import` / `republish` với `SUPABASE_DB_URL` trỏ tới prod. Sao lưu prod trước.
3. **Các lệnh có sẵn `--target prod`:** `oa`, `metadata`, `map-labels`, `captions`, `summaries import` (đều xem trước, thêm `--yes` để ghi).
4. **Đóng bản dữ liệu:** `pnpm worker release --target prod --note "..." --yes` sau mỗi đợt đổi dữ liệu (liên kết cố định `&v=` dựa vào đây).
5. **Sao lưu bản trích xuất:** `pnpm worker backup-files --yes` (bản trích xuất đã lưu, OCR lên bucket sao lưu).

Web đọc dữ liệu qua REST, giữ mỗi câu trả lời tối đa 60 giây, nên dữ liệu mới hiện trên web trong khoảng một phút, không cần deploy lại.

## Dùng web

* Web công khai: https://research-data-five.vercel.app. Chạy trên máy: `pnpm web:dev`, mở http://localhost:3000 (đọc database local; `/admin/quality` chỉ có ở máy dev hoặc khi đăng nhập chủ).
* **Trang chủ** là tìm theo quan hệ: gõ biến A, biến B (hoặc một biến để xem mọi quan hệ của nó), chọn chiều và vai trò; thanh tổng hợp chỉ tính ✓ và ★ theo mặc định. Từ gõ vào khớp ở đầu từ ("trust" không khớp "distrust").
* Bấm một kiểm định để mở bài: Tóm tắt nhanh ở đầu, chi tiết và bằng chứng bên dưới, PDF tô khung ở câu trích. **Luôn đối chiếu với PDF** trước khi dùng một con số.
* Xuất: Excel, Word APA 7, CSV (giá trị gốc), RIS / BibTeX; đúng danh sách đang lọc, kèm số hiệu bản dữ liệu.

Góp ý giao diện: nói trong lúc dùng, Claude Code ghi vào [usage-log.md](usage-log.md); cuối đợt gom lại và đề xuất sửa từng việc một.
