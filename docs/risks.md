# Quản trị rủi ro

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

## 11. QUẢN TRỊ RỦI RO & BẢO TOÀN DỮ LIỆU (RISK MANAGEMENT)

| # | Rủi ro | Biện pháp |
| :--- | :--- | :--- |
| 1 | AI trích xuất sai / bịa câu trích | Máy đối chiếu với PDF (trường không khớp bị ẩn); kiểm tra chéo; huy hiệu ✓ / ⚠; bấm để kiểm tra trong PDF; **người dùng có trách nhiệm tự đối chiếu** (tuyên bố trách nhiệm) |
| 2 | So sánh không hợp lệ giữa các bài (β khác mô hình) | Không quy đổi β → r; forest plot chỉ dùng r từ ma trận tương quan; ghi `model_covariates`, `comparability_note` |
| 3 | Tỷ lệ ⚠ cao ở một loại trường | Chỉnh prompt / quy tắc kiểm tra cho loại đó; nếu vẫn cao, bật lại riêng cho loại đó các cơ chế của v3.7 (trích xuất kép, đọc bảng hai kênh) (Mục 6.6) |
| 4 | Chi phí Gemini vượt dự kiến | `estimate`; trần ngân sách; đo đơn giá ở 1b; Batch API; Flash mặc định |
| 5 | Rate-limit (Gemini, Zotero) / lỗi mạng | Token bucket + backoff có jitter; tuân theo `Retry-After` / `Backoff`; trạng thái từng bước; chạy tiếp không tốn lại token |
| 6 | Đổi prompt / model làm giảm chất lượng | Chạy bộ bài giả lập và so tỷ lệ ✓ / ⚠ trên 20 bài thật trước khi chuyển; ghi phiên bản model cụ thể (6.6) |
| 7 | Bản quyền PDF trên web công khai | Khách chỉ tải được bài OA có giấy phép mở; bài không OA chỉ chủ dự án tải (D14); R2 private + presigned URL 5 phút; giới hạn tốc độ theo IP; câu trích ≤ 50 từ; trang chính sách nội dung + kênh gỡ bỏ |
| 8 | Jingle–jangle | Lớp khái niệm chuẩn theo miền; so khớp theo item thang đo; nguyên tắc "không chắc thì tách" |
| 9 | Kết luận sai từ so sánh bối cảnh | Nhãn "so sánh mô tả"; cảnh báo phương pháp trên giao diện |
| 10 | Mất dữ liệu | `pg_dump` hằng đêm lên R2; raw JSONB; Zotero là kho gốc PDF; migrations có phiên bản |
| 11 | Vượt giới hạn gói Free | Embedding chọn lọc + `halfvec`; theo dõi dung lượng; workflow keepalive; R2 dựng lại được từ Zotero |
| 11b | Supabase chỉ còn 1 slot project cloud | `dev` chạy local bằng Supabase CLI + Docker; migrations thử trên local trước khi áp dụng lên `prod`; `pg_dump` trước mỗi migration; nếu cần thêm project cloud thì nâng gói Pro hoặc tạm dừng project cũ |
| 11c | Dữ liệu ⚠ bị loại làm kết quả thiên về nghiên cứu đơn giản | Luôn hiện số kiểm định không được tính, phân theo loại thiết kế; nhắc khi vượt 20%; nút "Tính cả ⚠" (8.2b) |
| 11e | AI bỏ sót giả thuyết / Study / bảng | Kiểm tra độ đầy đủ (danh mục Pass 1 + quét text PDF) và **tự động trích bổ sung** mục thiếu (6.4) |
| 11f | AI gán số liệu đúng nhưng sai chỗ (VD: nhầm hàng trong bảng) | Kiểm tra chéo trong bài và tính lại thống kê bắt được một phần; phần còn lại dựa vào việc người dùng bấm kiểm tra trong PDF (tô sáng đúng ô bảng) |
| 11g | Lỗi thống kê ngay trong bài gốc | Tính lại p / t / F theo kiểu statcheck; ghi rõ "có thể là lỗi của bài gốc" |
| 11d | Thiên lệch xuất bản làm số bài "ủng hộ" bị thổi phồng | Cảnh báo trên Relationship Search và Evidence Map; funnel plot ở Giai đoạn 6 |
| 12 | Lộ API key (Gemini, Zotero, Supabase, R2) | `.env` local, `.gitignore`; GitHub Actions Secrets; key Zotero chỉ đọc đến Giai đoạn 2; token R2 chỉ đọc cho web, đọc/ghi chỉ cho worker; service key Supabase chỉ ở worker; bật **secret scanning + push protection** của GitHub (repo public) |
| 12b | Repo public làm lộ nội dung có bản quyền | Không commit PDF, phản hồi thô, hay câu trích từ bài có bản quyền; kiểm tra `git status` trước mỗi commit; dữ liệu mẫu trong test chỉ dùng văn bản tự viết |
| 13 | Sai số trang khi trích dẫn | `pdf_page_index` + `printed_page` + `printed_page_method`; ưu tiên `annotationPageLabel` khi có |
| 14 | PDF scan không có text layer | Gắn cờ `needs_ocr`, hiển thị ⚠; OCR tự động để giai đoạn sau |
| 15 | Liêm chính khi dùng câu sinh tự động | Bản nháp; chặn với dữ liệu chưa kiểm chứng; hướng dẫn khai báo AI |
| 16 | Chi phí Gemini | Một lượt trích xuất chính mỗi bài; các kiểm tra còn lại chạy bằng code; đo đơn giá trên 5 bài đầu; trần ngân sách; Batch API |
| 17 | Phạm vi quá rộng cho một người | Miền khởi đầu hẹp; MVP chỉ bài định lượng tiếng Anh; bộ khung chạy được trước; MoSCoW cho Web MVP; nguyên tắc "đủ dùng, không thừa" (1.5) |
| 18 | Web công khai bị lạm dụng (bot, spam báo lỗi, tải hàng loạt) | Giới hạn tốc độ theo IP; Turnstile cho form báo lỗi; khách không có quyền ghi (RLS); ẩn trường không khớp PDF với khách |
| 19 | Khách hiểu nhầm số liệu "trong kho" là kết luận của cả lĩnh vực | Ghi rõ "trong kho" ở mọi con số; dòng "ⓘ Cách đọc kết quả này"; trang "Giới thiệu & cách đọc dữ liệu" |
| 21 | Khách thấy dữ liệu AI chưa kiểm chứng (⚠) và hiểu là chắc chắn | Huy hiệu ⚠ rõ ràng; ẩn trường không khớp PDF; công tắc "Chỉ dữ liệu đã kiểm chứng"; trang "Giới thiệu & cách đọc dữ liệu"; nút Báo lỗi |
| 22 | Trích xuất lại ghi đè chỗ đã sửa tay | Trường đã sửa được khóa (`human_reviewed`); lịch sử `review_changes`; test end-to-end kiểm tra điều này |
| 20 | Hợp đồng thuê bao hạn chế tải PDF lên AI | Ưu tiên bản OA; trường `license_source`; hỏi thư viện trường về điều khoản AI / TDM khi tiện |
