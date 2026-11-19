# Research Data — Academic Literature Matrix

## Kế hoạch dự án
- Nguồn sự thật: [PROJECT_PLAN.md](PROJECT_PLAN.md) (phiên bản hiện hành là mục trên cùng của [CHANGELOG.md](CHANGELOG.md)) gồm tổng quan, lộ trình, quyết định và **mục lục** trỏ tới các file chi tiết trong `docs/`. Đọc file này trước khi bắt đầu bất kỳ công việc nào, rồi mở đúng file `docs/` của mục cần làm. Số mục ("Mục 6.3"…) giữ nguyên như bản gốc.
- Chi tiết từng bước đã làm nằm ở [docs/step-log.md](docs/step-log.md); chỉ đọc khi cần. Các bản kế hoạch cũ v2.0–v3.7 chỉ còn trong lịch sử git (`git show 20b81db:PROJECT_PLAN_v3.7_backup.md`), không dùng để làm việc.
- Khi kế hoạch thay đổi: sửa đúng file chứa mục đó (`PROJECT_PLAN.md` hoặc `docs/*.md`), ghi lại thay đổi trong [CHANGELOG.md](CHANGELOG.md), rồi chạy `pnpm docs:check`.
- **Quyết định trước, làm kỹ thuật sau:** các quyết định D1–D16 đã chốt (Mục 13). Việc cần một quyết định mới (đổi kế hoạch, thêm cơ chế, tài khoản hay dịch vụ cloud mới, chi tiền) thì hỏi chủ dự án trước khi làm.

## Quy trình làm việc từng bước (bắt buộc)
1. Mỗi lần **chỉ code một bước** theo danh sách bước của giai đoạn đang làm ở Mục 10 (quy trình ở Mục 10.0). Không gộp nhiều bước, không làm trước bước sau.
2. Code xong thì **kiểm thử ngay**: chạy test tự động, type-check, và chạy thử thật khi bước đó có thể chạy thử. Test hỏng thì sửa cho đến khi qua, không chuyển bước.
3. Kiểm thử qua hết thì **báo cáo và hỏi ý kiến chủ dự án**: đã làm gì, đã kiểm thử gì (kèm kết quả thật), còn vấn đề gì, bước tiếp theo là gì.
4. **Chỉ code bước tiếp theo khi chủ dự án đồng ý rõ ràng.** Sự đồng ý cho một bước không áp dụng cho bước khác.
5. Nếu trong lúc làm phát hiện cần đổi kế hoạch hoặc phải làm ngoài phạm vi bước hiện tại thì dừng lại và hỏi trước.

## Mục đích
- Công cụ phục vụ nghiên cứu của chính chủ dự án, **không** nhằm viết bài báo về phương pháp. Không thêm cơ chế chỉ để phục vụ công bố (nguyên tắc "đủ dùng, không thừa").
- Web công khai: ai có URL đều xem được, không cần đăng nhập; chỉ chủ dự án có tài khoản quản trị. Khách xem được PDF của mọi bài (để đối chiếu, chủ dự án quyết định 25/10/2026) nhưng chỉ tải được PDF Open Access có giấy phép mở.
- **Công cụ tham khảo:** người dùng có trách nhiệm tự đối chiếu với bài gốc. Không ai đọc bài, mã hóa hay duyệt. Chất lượng dựa trên một lượt trích xuất (nguồn theo thứ tự ưu tiên ở phần Quy ước, D16) + các lớp máy đối chiếu với PDF + huy hiệu ✓ / ⚠ / ◇ (Mục 6). Ưu tiên hàng đầu là làm việc tự kiểm tra thật nhanh (bấm là mở đúng chỗ trong PDF, bảng "Vì sao ✓").
- Không thêm lại các cơ chế đắt (trích xuất kép, trọng tài, bộ đối chứng…) trừ khi số liệu cho thấy một loại trường sai nhiều.
- Sửa tay trên web chỉ là tùy chọn. Trường đã sửa tay được khóa theo khóa tự nhiên ổn định; trích xuất lại không được ghi đè. Ánh xạ khái niệm theo nguyên tắc "không chắc thì tách".

## Quy ước
- Trao đổi và tài liệu bằng tiếng Việt; tên biến, trường dữ liệu và code bằng tiếng Anh.
- Nguồn tài liệu chính là thư viện Zotero cá nhân (collection `Research Data`, gói Zotero Storage trả phí); `raw_papers/` chỉ là dự phòng.
- **Thứ tự ưu tiên nguồn trích xuất (chủ dự án chốt 22/10/2026): tác tử Claude → Codex → Antigravity → Gemini API.** Tác tử Claude (tiến trình con, model Opus, làm việc trong thư mục gói kèm `text/page-NN.txt`) đạt tỷ lệ vấn đề 5 đến 8% ở lượt thử (Mục 6.11); bài nào tỷ lệ vấn đề (⚠ + ẩn) / (✓ + ⚠ + ẩn) > 20% thì giữ lại, báo chủ dự án, rồi mới thử nguồn kế tiếp. Gemini API là cuối cùng và vẫn cần chủ dự án đồng ý trước khi chi tiền.
- **Gói việc cho tác tử ngoài (Codex / Antigravity):** đọc PDF theo gói việc và trả JSON; Claude Code nhập (`manual import`), kiểm tra và đưa lên web (chốt ở bước 1b.6, Mục 6.9).
- **Bài được phép nạp:** các bài thư mục Zotero "Dissertation / 1 - Social Media Marketing Ethics"; thêm bài ngoài thư mục chỉ khi chủ dự án đồng ý. **Đã đồng ý ngày 21/10/2026 thêm các thư mục Zotero** (dưới "Dissertation"): "2.1 - Perceived ethical value", "3 - Brand trust", "4 - Brand loyalty", "5 - Positive eWOM", "6 - Purchase intention", "1 - Social Media Marketing Ethics / Transparency & disclosure", "Brand Gratitude". Các thư mục METHODOLOGY, Theoretical framework, REFERENCES và thư mục khác vẫn cần hỏi trước.
- **Gemini API (gói trả phí, `@google/genai`) là dự phòng**, trần D6 25 USD, đã chi 14,86 USD; không chạy thêm Gemini nếu chủ dự án chưa đồng ý. API key Gemini, Zotero, Supabase, R2 nằm trong `.env`, không bao giờ commit, in ra hay đưa cho công cụ ngoài (Codex, Antigravity, ChatGPT); tác tử ngoài chỉ làm việc trong thư mục gói việc, không có `.env`.
- Metadata thư mục lấy từ Crossref/Zotero, không để LLM sinh. Không quy đổi β thành r.
- Schema dữ liệu là `packages/schema` (Zod, dùng chung cho worker, prompt và web); `legacy/schema.v1.js` chỉ để tham khảo.
- Repo GitHub public: không commit PDF, phản hồi thô của Gemini, hay câu trích từ bài có bản quyền.
- Đi theo lộ trình ở Mục 10.
