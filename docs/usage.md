# Dùng thật (Giai đoạn 3a.6)

> Hướng dẫn thêm một bài mới vào kho và dùng web để làm nghiên cứu. Quy trình theo Mục 10.0; chi tiết nguồn trích xuất ở Mục 4.5 (`docs/integrations.md`).

## Thêm một bài mới

| Bước | Ai | Lệnh / việc |
| :--- | :--- | :--- |
| 1 | Bạn | Thả bài vào thư mục Zotero của dự án (hiện: "Dissertation / 1 - Social Media Marketing Ethics"). Bài ngoài thư mục chỉ khi bạn đồng ý rõ (CLAUDE.md). |
| 2 | Claude Code | `pnpm worker extract` nạp bài (đọc PDF, metadata Crossref/Zotero; không tốn API) |
| 3 | Claude Code | `pnpm worker manual export --paper X --code Y` tạo gói việc ngoài repo (`C:\Projects\Research Data Packets\Y`) |
| 4 | Bạn | Mở **Codex trong thư mục gói** (không mở repo, vì repo có `.env`), gõ câu lệnh làm việc; ghi lại số phút và số vòng sửa |
| 5 | Claude Code | `pnpm worker manual check <gói>` kiểm câu trả lời (không cần cơ sở dữ liệu) |
| 6 | Claude Code | `pnpm worker manual import <gói> --tool codex --model gpt-6.1-sol-medium` xem trước; sau khi bạn duyệt thêm `--yes` (sao lưu pg_dump, đăng bài) |
| 7 | Claude Code | `pnpm worker highlights --paper X` tính khung tô sáng PDF (không tốn API) |

Gemini API chỉ là dự phòng (trần 25 USD, đã chi 14,86); không chạy nếu bạn chưa đồng ý.

## Dùng web

1. Bật Docker Desktop, rồi `pnpm db:start` nếu cơ sở dữ liệu chưa chạy.
2. `pnpm --filter @research-data/web dev`, mở http://localhost:3000.
3. **Trang chủ** là Relationship Search: gõ biến A, biến B, chọn chiều và vai trò, đọc thanh tổng hợp (chỉ tính ✓ và ★ theo mặc định).
4. Bấm một kiểm định để mở bài: tab → giá trị → bảng "Vì sao" → PDF tô khung vàng ở câu trích. **Luôn đối chiếu với PDF** trước khi dùng một con số.
5. "Tải Excel" xuất đúng danh sách đang lọc (cột huy hiệu, trang in, tuyên bố trách nhiệm). "Tải PDF" lưu bài gốc.

## Khi nào coi là "đã dùng đủ" để đóng 3a

- Có thêm ít nhất 3 bài được trích xuất bằng Codex ngoài 6 bài hiện có (hoặc 3 bài Gemini cũ được làm lại bằng Codex: xem quyết định ở báo cáo bước này).
- Đã dùng Relationship Search cho ít nhất một câu hỏi nghiên cứu thật và mở bằng chứng trong PDF cho các kết quả quan trọng.
- Báo cáo: số phút mỗi bài, tỷ lệ ✓ / ⚠ / ◇, các góp ý trong [usage-log.md](usage-log.md).

Góp ý giao diện: nói trong lúc dùng, Claude Code ghi vào [usage-log.md](usage-log.md); cuối đợt gom lại và đề xuất sửa từng việc một.

## Hàng đợi bài mới (21/10/2026)

15 bài từ 7 thư mục Zotero mới đã nạp (không tốn API) và đã có gói Codex sẵn trong `C:\Projects\Research Data Packets\`. Thứ tự đề xuất (bài thực nghiệm ngắn trước, bài lý thuyết sau); có thể mở nhiều phiên Codex song song, mỗi phiên một thư mục gói.

| # | Gói | Bài | Trang |
| :--- | :--- | :--- | :--- |
| 1 | chain-effects | The Chain of Effects from Brand Trust and Brand Affect to Brand Performance (2001) | 14 |
| 2 | brand-integrity | Inferring brand integrity from marketing communications (2020) | 11 |
| 3 | ewom-scale | e-WOM Scale (2010) | 19 |
| 4 | ethics-retail | The Ethics of Online Retailing: Scale Development (2007) | 18 |
| 5 | brand-transparency | Brand Transparency as a Driver of Socially Conscious Purchasing | 18 |
| 6 | beyond-info | Beyond information availability: consumer perceived brand transparency (2024) | 15 |
| 7 | csr-emotions | CSR, emotions, and consumer loyalty in the food retail sector (2021) | 19 |
| 8 | ethical-csr | Ethical CSR and customer loyalty (2021) | 23 |
| 9 | cool-brands | The role of brand gratitude with cool brands (2024) | 17 |
| 10 | customer-gratitude | The Role of Customer Gratitude in Relationship Marketing (2009) | 19 |
| 11 | price-brand | Effects of Price, Brand, and Store Information on Buyers' Product Evaluations (1991) | 13 |
| 12 | complaining | Complaining to the Masses: Protest Framing (2006) | 11 |
| 13 | elevation | Experimentally distinguishing elevation from gratitude (2014) | 15 |
| 14 | brand-community | Brand Community (2001, định tính) | 22 |
| 15 | gratitude-model | A social-cognitive model of trait and state levels of gratitude (2008, lý thuyết) | 37 |
