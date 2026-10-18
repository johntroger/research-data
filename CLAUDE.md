# Research Data — Academic Literature Matrix

## Kế hoạch dự án
- Nguồn sự thật duy nhất: [PROJECT_PLAN.md](PROJECT_PLAN.md) (Version 3.9). Đọc file này trước khi bắt đầu bất kỳ công việc nào.
- `PROJECT_PLAN_v*_backup.md` chỉ là bản lưu trữ, không dùng để làm việc.
- Khi kế hoạch thay đổi, cập nhật thẳng vào `PROJECT_PLAN.md` và ghi lại thay đổi ở Mục 0.
- **Lập kế hoạch trước, làm kỹ thuật sau:** chưa triển khai bước kỹ thuật nào (viết code, tạo repo GitHub, cấu hình cloud) cho đến khi chủ dự án xác nhận kế hoạch đã chốt. Các quyết định còn mở nằm ở Mục 13.

## Quy trình làm việc từng bước (bắt buộc)
1. Mỗi lần **chỉ code một bước** theo danh sách bước ở Mục 10.0 của kế hoạch. Không gộp nhiều bước, không làm trước bước sau.
2. Code xong thì **kiểm thử ngay**: chạy test tự động, type-check, và chạy thử thật khi bước đó có thể chạy thử. Test hỏng thì sửa cho đến khi qua, không chuyển bước.
3. Kiểm thử qua hết thì **báo cáo và hỏi ý kiến chủ dự án**: đã làm gì, đã kiểm thử gì (kèm kết quả thật), còn vấn đề gì, bước tiếp theo là gì.
4. **Chỉ code bước tiếp theo khi chủ dự án đồng ý rõ ràng.** Sự đồng ý cho một bước không áp dụng cho bước khác.
5. Nếu trong lúc làm phát hiện cần đổi kế hoạch hoặc phải làm ngoài phạm vi bước hiện tại thì dừng lại và hỏi trước.

## Mục đích
- Công cụ phục vụ nghiên cứu của chính chủ dự án, **không** nhằm viết bài báo về phương pháp. Không thêm cơ chế chỉ để phục vụ công bố (nguyên tắc "đủ dùng, không thừa").
- Web công khai: ai có URL đều xem được, không cần đăng nhập; chỉ chủ dự án có tài khoản quản trị. Khách chỉ tải được PDF Open Access có giấy phép mở.
- **Công cụ tham khảo:** người dùng có trách nhiệm tự đối chiếu với bài gốc. Không ai đọc bài, mã hóa hay duyệt. Chất lượng dựa trên một lượt trích xuất Gemini Pro + các lớp máy đối chiếu với PDF + huy hiệu ✓ / ⚠ / ◇ (Mục 6). Ưu tiên hàng đầu là làm việc tự kiểm tra thật nhanh (bấm là mở đúng chỗ trong PDF, bảng "Vì sao ✓").
- Không thêm lại các cơ chế đắt (trích xuất kép, trọng tài, bộ đối chứng…) trừ khi số liệu cho thấy một loại trường sai nhiều.
- Sửa tay trên web chỉ là tùy chọn. Trường đã sửa tay được khóa theo khóa tự nhiên ổn định; trích xuất lại không được ghi đè. Ánh xạ khái niệm theo nguyên tắc "không chắc thì tách".

## Quy ước
- Trao đổi và tài liệu bằng tiếng Việt; tên biến, trường dữ liệu và code bằng tiếng Anh.
- Nguồn tài liệu chính là thư viện Zotero cá nhân (collection `Research Data`, gói Zotero Storage trả phí); `raw_papers/` chỉ là dự phòng.
- Trích xuất dùng Gemini API (gói trả phí) qua `@google/genai`. API key Gemini, Zotero, Supabase, R2 nằm trong `.env`, không bao giờ commit hay in ra.
- Metadata thư mục lấy từ Crossref/Zotero, không để LLM sinh. Không quy đổi β thành r.
- `schema.js` hiện có là bản cũ (v1); sẽ được viết lại thành `packages/schema` (Zod) theo Mục 9.2.
- Repo GitHub public: không commit PDF, phản hồi thô của Gemini, hay câu trích từ bài có bản quyền.
- Đi theo lộ trình ở Mục 10.
