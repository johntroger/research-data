# Lịch sử thay đổi kế hoạch

> Tách từ `PROJECT_PLAN.md` (Mục 0) ở bước 0.9. Phiên bản mới nhất ở trên cùng.

### Version 3.9.9 (so với 3.9.8)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9b:** lớp đọc PDF nhận ra **khe giữa hai cột** (dải dọc không mảnh văn bản nào phủ) và luôn cắt đoạn tại đó; tiêu đề chạy ở góc trên bên phải xếp trước cả hai cột; chữ cái Hy Lạp được gập về chữ Latin khi so câu (font ký hiệu lưu α thành a); dấu trừ lưu thành "2" trong khoảng tin cậy được khôi phục (Mục 6.3) | Bài hai cột khe hẹp (11,9 pt, dưới ngưỡng nối 12 pt) bị nối cột thành một dòng: 46/135 trường bị ẩn oan. Sau sửa: ✓ 35→85, ⚠ 45→28, ẩn 46→3; trên 4 bài thật 70 trường tốt lên, 0 xấu đi, 479 giữ nguyên |
| 2 | **Khóa theo bài:** mỗi bài chỉ một lần chạy tại một thời điểm (khóa tư vấn PostgreSQL theo mã băm tệp); lần chạy thứ hai bỏ qua và không tốn tiền | Hai tiến trình nền chạy song song cùng một bài làm tốn thêm khoảng 3,5 USD trong lần chạy thật đầu tiên |
| 3 | Kết quả chạy thật đầu tiên (5 bài, ghi để rút kinh nghiệm): tổng đã chi 9,72 USD (cả 2,3 USD ước tính trước khi có sổ), trong đó khoảng 5,5 USD lãng phí (1,49 USD mất khi Docker sập; khoảng 4 USD gọi trùng); bài dùng được tốn 0,29–2,16 USD, trung bình 0,88 USD/bài, 0,043 USD/trang | Số liệu cho quyết định ngân sách D6 |

### Version 3.9.8 (so với 3.9.7)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9:** `pnpm worker run` (trích xuất, đối chiếu, publish dưới trần ngân sách) và `pnpm worker report` (chi phí từng bài, đơn giá, dự báo); lựa chọn bài bằng `--paper` | Chạy thật trên bài trong kho và đo đơn giá |
| 2 | Mục 4.2: mỗi câu trả lời của Gemini được **ghi ra đĩa ngay khi nhận** (`extracted_data/<hash>.calls.jsonl`); chạy lại thì phát lại, không gọi và không tính tiền lần hai; lỗi mất kết nối DB không làm sập tiến trình | Lần chạy thật đầu tiên mất 10 lượt đã trả tiền (1,49 USD) khi Docker tắt giữa chừng |
| 3 | Đơn giá đo được (đồng bộ, 4 bài thật): trung bình 0,56 USD/bài, 0,034 USD/trang; bài nhiều Study tốn nhiều hơn nhiều (bài 3 Study, 16 trang: 0,95 USD, gấp đôi ước tính vì ước tính chỉ giả định 1 Study) | Số liệu cho quyết định ngân sách D6 |

### Version 3.9.7 (so với 3.9.6)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.8:** publish đủ dữ liệu (`pnpm publish:full`): mỗi lượt gọi AI một dòng `extraction_runs` (phiên bản model / prompt / schema / codebook, token, chi phí, phản hồi thô), mỗi câu trích một dòng `evidence` (trang thật, trang in, mức khớp), các bảng nghiệp vụ và `extracted_fields` kèm kết quả từng kiểm tra; các bước S4–S8, S10 ghi vào `pipeline_runs` | Giai đoạn 1: dữ liệu trích xuất đưa được vào cơ sở dữ liệu để web dùng |
| 2 | Mục 6.7: khóa ở **hai mức**: cả hàng (`locked` của bảng nghiệp vụ) và từng trường (cột của trường đã khóa giữ nguyên giá trị); mục của lần trích xuất cũ không còn thì bị xóa, trừ mục đã khóa (được giữ và báo `orphanedLocked`) | Trích xuất lại không được làm mất chỗ chủ dự án đã sửa |
| 3 | Mục 6.5, 5.1: ở hàng còn hiển thị, cột của trường bị **ẩn** (không khớp PDF) để NULL; huy hiệu của hàng là huy hiệu nặng nhất trong các trường còn hiển thị; hàng ẩn khi trường chính bị ẩn | Khách không được thấy giá trị không qua kiểm tra (VD 12 giá trị R² AI bịa ở bài jtaer) |
| 4 | Cột `raw_extraction` của 8 bảng nghiệp vụ **không đọc được với khách** (quyền theo cột) | RLS chỉ lọc theo hàng nên `raw_extraction` làm lộ giá trị đã bị ẩn |

### Version 3.9.6 (so với 3.9.5)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.7:** trần ngân sách, giới hạn tốc độ, thử lại, ước tính chi phí và luồng Batch (Mục 4.2–4.3); thêm bảng `api_spend` và `batch_jobs` | Giai đoạn 1: kiểm soát chi phí trước khi chạy hàng loạt |
| 2 | Mục 4.3: bỏ `countTokens` khỏi `estimate`, dùng hằng số theo trang đo từ hóa đơn thật | `countTokens` thấp hơn hóa đơn 2,7 lần với PDF, làm trần ngân sách mất tác dụng |
| 3 | Mục 4.2: Batch từ chối schema lồng quá 3 tầng; với Batch, schema đặt trong chỉ dẫn và Zod kiểm tra | Đo trực tiếp trên API; API đồng bộ không bị giới hạn này |

### Version 3.9.5 (so với 3.9.4)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Chia Giai đoạn 1 thành 9 bước (1.1–1.9)** ở Mục 10, mỗi bước có cách kiểm thử | Giai đoạn 0 xong (bước 0.14); Mục 10.0 quy định chia bước khi bắt đầu giai đoạn |
| 2 | Bước 1.4 xử lý ô bảng bị tách thành nhiều dòng trong text layer | Câu trích từ bảng không khớp, phát hiện khi chạy thử bước 0.8b |
| 3 | Bước 1.6 ánh xạ khái niệm trước hết bằng tên + bí danh; embedding / độ giống item để sau | Chưa đủ bài để hiệu chỉnh ngưỡng; theo nguyên tắc "không chắc thì tách" |

### Version 3.9.4 (so với 3.9.3)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kết nối Zotero (bước 0.12):** client Web API chỉ đọc; collection Inbox cấu hình được bằng `ZOTERO_INBOX_PATH` (Mục 3.3) | Chủ dự án muốn dùng collection có sẵn trong thư viện |
| 2 | Tải PDF thử lại khi kết nối bị ngắt; không gửi API key sang kho lưu trữ | Phát hiện khi chạy thật (kết nối tới kho lưu trữ bị đóng giữa chừng) |

### Version 3.9.3 (so với 3.9.2)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **`packages/schema` v1.0.0 (bước 0.11):** schema Zod đầy đủ theo Codebook cho Pass 1 (`PaperStructure`), Pass 1b (`PaperDiscussion`) và Pass 2 (4 phần của một Study), cùng `StudyDetail` để ghép kết quả | Một nguồn sự thật cho worker, Gemini và web |
| 2 | Mục 4.2: một Study được trích bằng **4 lượt gọi**, không gửi schema gộp | Gemini từ chối schema gộp cả Study (23 KB) khi kiểm thử thật |
| 3 | Codebook v1.0.1: thêm Phần L (trường cấu trúc của các lượt gọi AI) | Schema và codebook khớp nhau hoàn toàn, có test bắt buộc |

### Version 3.9.2 (so với 3.9.1)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Codebook v1.0** ([docs/codebook.md](docs/codebook.md), bước 0.10): định nghĩa vận hành, tầng T1/T2/T3, giá trị cho phép và quy tắc khi mơ hồ cho toàn bộ 159 trường của Mục 5.2–5.3; quy tắc chung về bằng chứng, con số, Study | Đầu vào cho prompt và schema Zod ở bước 0.11 |
| 2 | Mục 5.2: `paper_type` thêm `narrative_review`, `other`; `estimate_type` thêm `path coefficient` | Rút ra từ chạy thử bước 0.8b |
| 3 | Lệnh `pnpm codebook:check`: mọi trường trong schema phải có định nghĩa trong codebook | Giữ codebook và schema đồng bộ |

### Version 3.9.1 (so với 3.9)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Tách tài liệu kế hoạch (bước 0.9):** `PROJECT_PLAN.md` chỉ giữ Mục 1 (tổng quan), Mục 10 (lộ trình) và Mục 13 (quyết định) cùng mục lục; các mục khác chuyển sang `docs/architecture.md`, `docs/integrations.md`, `docs/data-schema.md`, `docs/quality-assurance.md`, `docs/ux-spec.md`, `docs/risks.md`; Mục 0 thành `CHANGELOG.md`. Nội dung từng mục giữ nguyên, số mục không đổi | File 1.000 dòng khó dùng hằng ngày |
| 2 | Thêm `docs/risks.md` (Mục 11) ngoài 5 file dự kiến; Mục 7 (bản quyền) đặt cùng Mục 8 trong `docs/ux-spec.md`; Mục 12 (tài liệu tham khảo) đặt trong `docs/quality-assurance.md` | Các mục này không thuộc rõ một file nào trong danh sách ban đầu |
| 3 | Lệnh `pnpm docs:check` kiểm tra liên kết nội bộ giữa các file tài liệu | Tránh liên kết hỏng khi tài liệu nằm ở nhiều file |

**Kết quả các bước đã làm (0.1–0.8b)** được ghi trong lịch sử commit trên GitHub.

### Version 3.9 (so với 3.8)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Mục 10.0: Quy trình làm việc từng bước**: code một bước → kiểm thử → báo cáo → chờ chủ dự án đồng ý mới sang bước tiếp; mỗi bước một commit | Yêu cầu của chủ dự án |
| 2 | Chia Giai đoạn 0 thành **14 bước** (0.1–0.14), mỗi bước có tiêu chí kiểm thử và việc cần chủ dự án | Áp dụng quy trình từng bước |
| 3 | Sửa các trường trạng thái cũ còn sót trong schema (Mục 5.2 phân hệ 13, Mục 5.4) | Thống nhất với huy hiệu ở Mục 6.5 |

### Version 3.8 (so với 3.7)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Định vị: công cụ tham khảo.** Người dùng có trách nhiệm tự đối chiếu với bài gốc; tuyên bố trách nhiệm ở chân mọi trang và trong mọi file xuất | Chủ dự án xác định rõ vai trò của công cụ |
| 2 | **Rút gọn kiểm soát chất lượng (Mục 6 viết lại):** giữ máy đối chiếu với PDF, kiểm tra độ đầy đủ, tính lại thống kê, kiểm tra chéo, huy hiệu; **trích xuất một lượt bằng Pro**; bỏ trích xuất kép, trọng tài, đọc bảng hai kênh, hỏi 3 lần cho T3, bộ đối chứng meta-analysis và vòng tự cải thiện | Với công cụ tham khảo, vài phần trăm chính xác thêm không đáng chi phí 2,5–4 lần và nhiều tuần phát triển; bỏ được các giả định rủi ro nhất của v3.7 |
| 3 | **Bấm để kiểm tra** là tính năng số 1; thêm bảng **"Vì sao ✓"**; **luôn hiện số kiểm định không được tính** theo loại thiết kế | Giúp người dùng tự kiểm tra trong vài giây; tránh thiên lệch ngầm về nghiên cứu đơn giản |
| 4 | Bộ bài giả lập giữ lại làm kiểm thử kỹ thuật; các cơ chế của v3.7 có thể bật lại riêng cho loại trường sai nhiều (Mục 6.6) | Kiến trúc để sẵn chỗ nâng cấp có chọn lọc |
| 5 | Ánh xạ khái niệm: gộp khi chắc chắn, còn lại **tách riêng** (không có trọng tài); D9, D15 cập nhật | Theo bản rút gọn |
| 6 | **Lịch mới:** khoảng 40–46 giờ của chủ dự án; dùng được trên máy từ khoảng đầu tháng 12/2026; web công khai khoảng giữa tháng 1/2027 | Ít phần phải xây hơn |

### Version 3.7 (so với 3.6)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kiểm soát chất lượng hoàn toàn tự động** (Mục 6 viết lại): dây chuyền 7 lớp gồm trích xuất kép độc lập (Flash + Pro), đọc bảng hai kênh (text layer + ảnh), máy đối chiếu với PDF, trọng tài Gemini khi có bất đồng, kiểm tra chéo trong bài, chấm điểm tin cậy từng trường, tự đo độ chính xác và tự cải thiện prompt | Chủ dự án không muốn dành thời gian đọc bài; cần độ chính xác cao nhất có thể mà không cần người |
| 2 | **Bỏ bộ bài chuẩn do người mã hóa** (D9); thay bằng **bộ đối chứng từ meta-analysis đã công bố** và **bài giả lập có đáp án**; chống học tủ bằng hai nửa A / B | Đo được độ chính xác thật mà không tốn công của chủ dự án |
| 3 | Trường T3: hỏi 3 lần, lấy đa số; nhãn **◇ AI diễn giải** kèm tỷ lệ đồng thuận; ⚠ chỉ dùng khi có vấn đề thật | ⚠ giữ được tác dụng cảnh báo |
| 4 | Ánh xạ khái niệm tự động với nguyên tắc **"không chắc thì tách"**, trọng tài quyết khi không rõ | Gộp nhầm khó phát hiện, tách nhầm thì vô hại |
| 5 | Sửa tay trở thành **tùy chọn**; **khóa tự nhiên ổn định** để chỗ đã sửa không bị mất khi trích xuất lại; dải "Chế độ quản trị" | Tránh lỗi mồ côi khi chạy lại |
| 6 | Codebook do Claude Code soạn, chủ dự án đọc lướt; chỉ dùng Gemini cho trọng tài (D15); chi phí mỗi bài tăng 2,5–4 lần, đo trên 5 bài đầu | Theo quyết định của chủ dự án |
| 7 | **Lịch mới:** khoảng 45–55 giờ của chủ dự án; dùng được trên máy từ khoảng cuối tháng 12/2026; web công khai khoảng cuối tháng 1/2027 | Không còn công mã hóa và duyệt |

### Version 3.6 (so với 3.5)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bỏ duyệt bắt buộc.** Chủ dự án không duyệt từng bài; xem kết quả trên web và **sửa trực tiếp** khi thấy sai (nút ✎). Lỗi lặp lại có hệ thống thì sửa prompt / codebook trong code rồi chạy lại. Review Queue đổi thành danh sách **"Cần chú ý"** không bắt buộc (Mục 6.5) | Chủ dự án muốn ít duyệt, kiểm tra qua kết quả trên web |
| 2 | **Quy tắc hiển thị mới:** web hiện mọi dữ liệu kèm huy hiệu (✓ / ★ / ⚠), kể cả trường T3 chưa kiểm chứng; chỉ **ẩn với khách** các trường không khớp PDF hoặc lỗi nghiêm trọng; thêm công tắc "Chỉ dữ liệu đã kiểm chứng" | Nếu vẫn chỉ hiện dữ liệu đã duyệt thì khi không duyệt, trường T3 sẽ không bao giờ hiện |
| 3 | **Khóa trường đã sửa tay:** trích xuất lại không ghi đè; lưu lịch sử trước / sau, hoàn tác được | Tránh mất công sửa khi chạy lại prompt mới |
| 4 | Ánh xạ khái niệm: **tự động khi độ tin cậy cao**, độ tin cậy thấp chỉ là gợi ý | Không cần người xác nhận từng ánh xạ |
| 5 | **Đổi thứ tự lộ trình:** thêm Giai đoạn 3a (web chạy local, nhóm *Must*) ngay sau 1b; bỏ Giai đoạn 2b (prototype riêng); Giai đoạn 3 thành 3b | Chủ dự án **dùng được từ khoảng tuần 12** thay vì tuần 16; góp ý giao diện đến từ dùng thật |

### Version 3.5 (so với 3.4)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Định vị lại dự án:** công cụ phục vụ nghiên cứu của chủ dự án, **không** nhằm viết bài báo phương pháp; thêm nguyên tắc "đủ dùng, không thừa" (1.5) | Chủ dự án xác nhận mục đích sử dụng |
| 2 | **Rút gọn bộ bài chuẩn:** 10 bài (5 Dev, 5 Kiểm tra) do chủ dự án mã hóa; bỏ người mã hóa thứ hai (D3), mã hóa mù, chọn mẫu phân tầng có seed, OSF, test–retest, baseline, báo cáo độ tin cậy chuẩn công bố; KPI chuyển thành **ngưỡng tham khảo** | Các cơ chế đó chỉ phục vụ công bố; tiết kiệm khoảng 40–60 giờ |
| 3 | **Web công khai** (D2): ai có URL đều xem được, không đăng nhập; chỉ chủ dự án có tài khoản quản trị. Viết lại Mục 7: khách chỉ tải PDF OA có giấy phép mở, bài không OA chỉ có link DOI (D14, đã chốt); giới hạn tốc độ theo IP; Turnstile cho báo lỗi; không lưu dữ liệu cá nhân của khách | Chủ dự án muốn ai có URL cũng dùng được |
| 4 | Thêm trường `license_source` và lưu ý về điều khoản AI / TDM của hợp đồng thuê bao | PDF tải qua thư viện trường có thể bị hạn chế tải lên AI |
| 5 | Ghi rõ **tập bài = thư viện Zotero của chủ dự án**; mọi con số tổng hợp ghi "trong kho"; **gộp cảnh báo** thành một dòng "ⓘ Cách đọc kết quả này"; cho **nhập tự do** tên biến | Tránh hiểu nhầm; tránh "mù cảnh báo" |
| 6 | MVP **chỉ bài tiếng Anh**; chính sách **khi Google ngừng model** (Mục 6.4) | Phạm vi rõ; giữ chất lượng khi đổi model |
| 7 | Giai đoạn 0 bắt đầu bằng **bộ khung chạy được** và **tách tài liệu kế hoạch** thành `docs/` + `CHANGELOG.md` | Phát hiện sớm chỗ không ăn khớp; tài liệu dễ dùng hơn |
| 8 | Bỏ Tunnel / Access khỏi MVP; trang "Phương pháp dữ liệu" đổi thành "Giới thiệu & cách đọc dữ liệu" + `/admin/quality`; bộ sưu tập theo tài khoản hoãn lại | Không còn người mã hóa thứ hai và không còn tài khoản khách |
| 9 | **Lịch mới:** khoảng 90–110 giờ, **Web MVP công khai sau khoảng 4 tháng (khoảng tháng 2/2027)**, thay vì 6 tháng | Kết quả của việc rút gọn |

### Version 3.4 (so với 3.3)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Mục 6.3b: ba cơ chế kiểm chứng bổ sung**: kiểm tra độ đầy đủ (chống bỏ sót), đối chiếu hai model (chống gán nhầm chỗ), tính lại thống kê kiểu statcheck (phát hiện lỗi của AI và của bài gốc) | Các lớp cũ chủ yếu bắt lỗi "trích sai", chưa bắt được lỗi bỏ sót, gán nhầm và lỗi trong bài gốc |
| 2 | Thêm KPI **độ đầy đủ (recall) ≥ 95%**; trường `completeness_status`, `cross_model_agreement`, `stat_consistency`; rủi ro 11e–11g; tài liệu Nuijten et al. (2016) | Đo và truy vết được ba cơ chế mới |
| 3 | Thêm **Mục 9.5: Quy trình triển khai GitHub → Vercel** (nhánh, preview, branch protection, rollback, cấu hình monorepo, luồng dữ liệu tách khỏi luồng code) | Làm rõ vai trò của GitHub và cách Vercel đồng bộ code |

### Version 3.3 (so với 3.2)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Sửa 5 mâu thuẫn nội bộ: link PDF do **API route Next.js** ký (Worker chỉ dùng cho ZIP); mọi tác vụ định kỳ ở **GitHub Actions**; Cloudflare Access **chỉ bảo vệ Review Queue qua Tunnel**; Review Queue là route `/review` trong `apps/web`; bộ sưu tập **không đồng bộ Zotero** | Thống nhất kiến trúc trước khi viết code |
| 2 | **Chia tập Dev (5) / Test (10) / Test 2 (15)**, đóng băng prompt trước khi chạy Test; **mã hóa mù**; **chọn bài ngẫu nhiên phân tầng** có seed (Mục 6.2) | Tránh overfitting prompt và hiệu ứng mỏ neo; kết quả độ tin cậy bảo vệ được trước phản biện |
| 3 | **Đăng ký protocol kiểm định trên OSF** trước khi chạy tập Test | Tăng độ tin cậy cho bài báo phương pháp |
| 4 | Thêm phân hệ **10b. Ô điều kiện thực nghiệm** (`condition_cells`: M, SD, n theo điều kiện) và quy tắc kiểm chứng tương ứng | Bài thực nghiệm (đạo đức, social media) báo cáo M/SD/n thay vì β |
| 5 | Công tắc **"Bao gồm các thành phần"** cho khái niệm bậc cao trong Relationship Search | VD: SMMA gồm 5 thành phần |
| 6 | Cảnh báo **thiên lệch xuất bản**; **kiểm tra bài bị rút hằng tháng**; **cảnh báo tạp chí** ngoài Scopus/SJR/ABDC | Tránh kết luận bị thổi phồng hoặc dựa trên nguồn kém chất lượng |
| 7 | **Supabase: 1 project cloud (`prod`) + Supabase CLI local (`dev`)**, vì tài khoản Free đã dùng 1/2 slot; token R2 phân quyền; thêm `codebook_version` vào khóa idempotency; bảng `review_changes` lưu giá trị trước/sau; Mục 9.3 (tác vụ định kỳ) và 9.4 (chiến lược kiểm thử) | Ràng buộc thực tế của chủ dự án; an toàn và tái lập |
| 8 | **Relationship Search làm trang chủ**; **MoSCoW** cho Giai đoạn 3; **chế độ mù** trong Review Queue; **hướng dẫn nhanh**; tên khái niệm luôn bằng tiếng Anh | Tập trung vào tính năng cốt lõi, có bản dùng được sớm hơn |
| 9 | Chốt quyết định **D13**: cài Docker Desktop cho Supabase local (máy 16 GB RAM). Toàn bộ quyết định đã chốt, trừ D3 (không chặn Giai đoạn 0–1) | Điều kiện để chạy môi trường `dev` |

### Version 3.2 (so với 3.1)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Relationship Search** (Mục 8.2b): chọn Biến A, Biến B, tìm các bài kiểm định quan hệ giữa hai biến, lọc tiếp theo kết quả giả thuyết (ủng hộ / không ủng hộ…) và chiều tác động | Yêu cầu của chủ dự án; trả lời trực tiếp câu hỏi cốt lõi số 1 |
| 2 | Thêm trường `hypothesized_direction`, `observed_sign`, `significant` vào Đường quan hệ (Mục 5.2 #8) | Tách "giả thuyết có được ủng hộ" khỏi "tác động thực tế dương / âm / không có ý nghĩa" |
| 3 | Thêm materialized view `relation_index` (Mục 5.4) | Truy vấn theo cặp biến hai chiều nhanh ở quy mô 5.000 bài |
| 4 | Đưa Relationship Search vào **Giai đoạn 3 (Web MVP)** | Là tính năng cốt lõi, không chờ đến Evidence Map ở Giai đoạn 6 |
| 5 | Thêm **Mục 13: Các quyết định cần chốt**; đã chốt D1 (miền: social media marketing, branding, ethics, hành vi khách hàng), D2 (chỉ nhóm, có đăng nhập), D5 (repo `research-data` public), D6 (10 USD cho pilot), D7 (5–10 giờ/tuần), D8 (tên tạm + vercel.app), D9 (15 bài chuẩn vàng cho cổng 1b) | Lập kế hoạch xong rồi mới triển khai kỹ thuật |
| 6 | Thêm **Mục 3A: Tận dụng Cloudflare** (R2, Workers, Cron, Tunnel, Access, Registrar, Turnstile, Analytics) và quyết định D11, D12 | Chủ dự án đã có tài khoản Cloudflare |
| 7 | Thêm **Mục 10.1: Lịch dự kiến** với hai phương án quy mô chuẩn vàng tại cổng 1b | Quy đổi lộ trình theo thời gian thực tế của chủ dự án |
| 8 | Thêm **Mục 7.1: Tải bài gốc (PDF) từ Web**: thành viên nhóm tải được mọi bài; tải thẳng từ R2 qua presigned URL; tải nhiều bài dạng ZIP ở giai đoạn sau | Yêu cầu của chủ dự án |
| 9 | Chốt D4 (thư viện Zotero cá nhân, collection `Research Data`), D10 (MIT), D11 (Vercel + Cloudflare), D12 (Cloudflare Free, có ngưỡng nâng cấp). Toàn bộ quyết định đã chốt, trừ D3 (đang tìm người, không chặn Giai đoạn 0–1) | Hoàn tất lập kế hoạch |

### Version 3.1 (so với 3.0)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bỏ quy đổi β → r.** Thêm phân hệ **Ma trận tương quan & Thống kê mô tả** (r, M, SD, α, CR, AVE, n) | β chuẩn hóa trong mô hình đa biến không tương đương r (Peterson & Brown, 2005; Roth et al., 2018). Ma trận tương quan là dữ liệu đúng chuẩn cho meta-analysis và MASEM |
| 2 | **Phân ba tầng trường dữ liệu** (Sự kiện / Phân loại / Diễn giải), mỗi tầng có KPI riêng; sửa cổng chất lượng Giai đoạn 1b | κ ≥ 0,80 cho trường diễn giải là không thực tế, kể cả giữa hai chuyên gia |
| 3 | **Kiểm chứng theo loại trường** (câu văn / số liệu / bảng / PDF scan); quy trình xác định `printed_page` | Text layer của bảng bị xáo trộn, fuzzy match câu văn không áp dụng được cho số liệu |
| 4 | **Review Queue** (giao diện duyệt dữ liệu) đưa vào Giai đoạn 1b | Human-in-the-loop cần công cụ từ sớm; dùng lại làm Split-Screen của web |
| 5 | **Thu hẹp miền nghiên cứu khởi đầu** (~300 bài đầu trong một miền hẹp) | Không thể xây bảng khái niệm chuẩn cho mọi ngành cùng lúc |
| 6 | Stack: bỏ PyMuPDF (AGPL, thêm Python) và SQLite trung gian; **monorepo**; migrations SQL; **sao lưu hằng đêm** | Một runtime, một tầng lưu trữ, tái lập và an toàn dữ liệu |
| 7 | Bộ chuẩn vàng theo quy mô thực tế (30 bài do chủ dự án mã hóa, 10 bài mã hóa kép); thêm **test–retest** và **mốc so sánh** | Ước tính 3–5 giờ/bài; LLM không hoàn toàn tất định; bài phương pháp cần baseline |
| 8 | Thêm bước **prototype + kiểm tra với 3–5 người dùng** trước khi code Web | Kiểm chứng giả định UX trước khi tốn công phát triển |
| 9 | Cập nhật tài liệu tham khảo (thay Miles, 2017 bằng Alvesson & Sandberg, 2011; thêm Peterson & Brown, 2005; Roth et al., 2018; Larsen & Bong, 2016; Page et al., 2021) | Ưu tiên tài liệu đã qua bình duyệt |
| 10 | **Tích hợp Zotero (gói trả phí)** làm nguồn nạp chính, kho lưu trữ gốc, công cụ mã hóa Bộ chuẩn vàng và kênh ghi ngược kết quả | Tận dụng Zotero Storage, Web API, annotation có số trang in, nhóm (group) chia sẻ |
| 11 | Bổ sung: giới hạn câu trích công khai ≤ 50 từ; huy hiệu tin cậy ở cấp phần; định dạng số liệu APA; trang "Phương pháp dữ liệu"; MVP chỉ xử lý bài định lượng; MVP giao diện tiếng Việt (sẵn sàng i18n) | Theo đánh giá 4 góc nhìn |

### Version 3.0 (so với 2.0), tóm tắt
Worker do Claude Code xây dựng, Gemini trả phí trích xuất; thêm Giai đoạn 0 (Codebook, Bộ chuẩn vàng) và 1b (Pilot); đơn vị phân tích là "đường quan hệ được kiểm định" theo Study; lớp Khái niệm chuẩn; Evidence Map thay Conflict Engine; pipeline nhiều bước; metadata từ Crossref; kiểm chứng câu trích; Supabase + pgvector; R2 private + Signed URL; Trang Khái niệm / Lý thuyết; TypeScript + Zod. *(Bản đầy đủ: `PROJECT_PLAN_v3.0_backup.md`.)*
