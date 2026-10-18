# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT PLAN - VERSION 3.7)
## HỆ THỐNG CƠ SỞ DỮ LIỆU & TỔNG QUAN TÀI LIỆU KHOA HỌC CHUẨN MỰC Q1
*(Academic Literature Matrix & Research Knowledge Base for Behavioral Science, Management & Marketing)*

---

## 0. LỊCH SỬ THAY ĐỔI

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

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Tuyên ngôn Sứ mệnh (Mission Statement)
Xây dựng một hệ thống cơ sở dữ liệu học thuật tự động hóa chuyên sâu cho các ngành **Khoa học Hành vi, Quản trị kinh doanh, Marketing và Kinh tế**, có khả năng:
* Nạp tài liệu trực tiếp từ **thư viện Zotero cá nhân** của chủ dự án.
* Phân tách sâu toàn văn bài báo (Native PDF extraction) bằng **Gemini API (gói trả phí)**, mọi trường dữ liệu truy vết được về trang và đoạn văn gốc.
* Trích xuất **ma trận tương quan và thống kê mô tả**, tạo nền dữ liệu cho meta-analysis và MASEM.
* Cung cấp giao diện Web trên **Vercel** để tra cứu, lọc đa chiều, xem ma trận tổng hợp, bản đồ bằng chứng (Evidence Map) và trích dẫn có kiểm chứng.
* Đạt **độ chính xác cao nhất có thể mà không cần người tham gia**: dây chuyền kiểm chứng tự động 7 lớp, độ chính xác được **đo tự động** bằng bộ đối chứng từ các meta-analysis đã công bố (Mục 6), đủ để chủ dự án **yên tâm dùng dữ liệu cho nghiên cứu của mình** và luôn kiểm tra lại được nhanh với bản gốc.
* Mở rộng bền vững từ **1 bài đến hơn 5.000 bài báo**.

### 1.2. Người dùng mục tiêu & Công việc cốt lõi (Jobs-to-be-done)

**Mục đích dự án:** đây là **công cụ phục vụ nghiên cứu của chính chủ dự án**, không nhằm viết bài báo về phương pháp. Web được để **công khai**: ai có URL đều xem được (D2).

| Người dùng | Quyền | Công việc cần làm |
| :--- | :--- | :--- |
| **Chủ dự án** (người dùng chính, tài khoản quản trị duy nhất) | Toàn quyền: thêm bài vào Zotero, (tùy chọn) sửa dữ liệu trực tiếp trên web, tải mọi PDF. **Không đọc bài, không mã hóa, không duyệt** | Xây mô hình nghiên cứu, chọn thang đo, tìm khoảng trống, viết tổng quan cho các nghiên cứu của mình |
| **Khách** (bất kỳ ai có URL, không cần đăng nhập) | Chỉ xem và tìm kiếm dữ liệu trích xuất; tải PDF theo chính sách bản quyền (Mục 7, D14) | Tra cứu quan hệ giữa các biến, định nghĩa và thang đo, xuất bảng |

Bốn câu hỏi hệ thống phải trả lời tốt:
1. *"Mối quan hệ X → Y đã được nghiên cứu thế nào, ở bối cảnh nào, độ lớn tác động ra sao?"*
2. *"Khái niệm Z được định nghĩa và đo lường như thế nào trong các nghiên cứu?"*
3. *"Lý thuyết T được sử dụng ra sao (chỉ nhắc tên hay thực sự dùng để xây giả thuyết)?"*
4. *"Lập bảng tổng quan tài liệu chuẩn APA cho tập bài tôi chọn."*

### 1.3. Phạm vi khởi đầu (MVP Scope)
* **Miền nghiên cứu khởi đầu (đã chốt, D1):** *Social media marketing, thương hiệu (branding), đạo đức marketing (ethics) và hành vi khách hàng*. Mục tiêu khoảng **300 bài** đầu tiên trong miền này trước khi mở rộng.
  * **Trục trung tâm:** tác động của hoạt động trên mạng xã hội và thương hiệu đến hành vi khách hàng; đạo đức là lăng kính đi kèm (không phải một mảng độc lập).
  * **Thứ tự nạp:** (1) Social media marketing × hành vi khách hàng → (2) Branding × hành vi khách hàng → (3) Khía cạnh đạo đức. Mỗi nhóm khoảng 100 bài.
  * **Nhóm khái niệm khởi tạo:**
    * *Social media:* social media marketing activities, eWOM, influencer credibility, parasocial interaction, customer engagement, user-generated content.
    * *Thương hiệu:* brand equity, brand awareness, brand image, brand trust, brand love, brand authenticity, brand attachment.
    * *Đạo đức:* perceived CSR, greenwashing perception, ethical consumption, privacy concern, sponsorship / advertising disclosure, consumer skepticism.
    * *Hành vi khách hàng:* purchase intention, satisfaction, loyalty, WOM intention, willingness to pay a premium.
  * **Nhóm lý thuyết khởi tạo:** S-O-R, Source Credibility, Uses & Gratifications, Parasocial Interaction, Social Identity, Consumer–Brand Relationship, Attribution Theory, Signaling Theory, Persuasion Knowledge Model, TPB.
  * *Lưu ý:* miền này rộng hơn đề xuất ban đầu, nên bảng khái niệm chuẩn sẽ lớn hơn. Thứ tự nạp theo nhóm giúp kiểm soát chất lượng ánh xạ khái niệm.
* **Loại bài trong MVP:** chỉ bài **định lượng** (survey, thực nghiệm, dữ liệu thứ cấp). Bài định tính, bài khái niệm, bài tổng quan được nạp metadata nhưng chưa trích xuất sâu.
* **Ngôn ngữ của bài báo:** MVP chỉ xử lý **bài tiếng Anh**. Bài tiếng Việt cần codebook và kiểm chứng riêng, để giai đoạn sau.
* **Ngôn ngữ giao diện MVP:** tiếng Việt (nội dung học thuật giữ tiếng Anh); code sẵn sàng i18n để thêm tiếng Anh sau.
* **Tập bài = thư viện Zotero của chủ dự án.** Không xây tập bài theo giao thức tìm kiếm hệ thống. Vì vậy mọi con số tổng hợp trên web được ghi rõ là **"trong kho"** (VD: "25/31 kiểm định trong kho ủng hộ"), không phải kết luận về toàn bộ tài liệu của lĩnh vực.

### 1.4. Phân tầng trường dữ liệu & Mục tiêu chất lượng (KPIs)

Các ngưỡng dưới đây là **ngưỡng tham khảo cá nhân**: đạt thì yên tâm dùng; chưa đạt thì biết phần nào cần để ý hơn khi xem kết quả trên web, hoặc cần chỉnh prompt. Không phải cổng bắt buộc dừng dự án.

| Tầng | Ví dụ trường | Chỉ số (đo tự động trên bộ đối chứng, Mục 6.8) | Ngưỡng tham khảo | Xử lý |
| :--- | :--- | :--- | :--- | :--- |
| **T1 – Sự kiện** (factual) | n, β, p, CI, r, M, SD, α, CR, AVE, quốc gia, số Study, mã giả thuyết | % khớp chính xác | **≥ 95%** | Chưa đạt: vòng tự cải thiện prompt (Mục 6.8d) chạy tự động; trong lúc đó trường T1 mức trung bình hiển thị ⚠ |
| **T2 – Phân loại** (categorical) | thiết kế nghiên cứu, phương pháp phân tích, loại mẫu, trạng thái giả thuyết, loại hiệu ứng | % khớp (κ nếu muốn) | **≥ 85% khớp** | Chưa đạt: vòng tự cải thiện prompt tập trung vào các trường T2 bị lệch nhiều nhất |
| **T3 – Diễn giải** (interpretive) | vai trò lý thuyết, loại đóng góp, loại khoảng trống, ánh xạ khái niệm chuẩn | Tỷ lệ đồng thuận khi hỏi 3 lần | ≥ 2/3 mới hiển thị giá trị | Hiển thị nhãn **◇ AI diễn giải** kèm tỷ lệ đồng thuận (Mục 6.7) |

Các chỉ số khác:
* **Độ đầy đủ (recall):** ≥ 95% giả thuyết, Study và bảng kết quả trong bộ đối chứng và bộ bài giả lập được trích xuất.
* **Kiểm chứng tự động:** ≥ 95% câu văn (T1/T2 có câu trích) và ≥ 95% số liệu T1 được kiểm chứng theo phương pháp ở Mục 6.4.
* **Truy vết:** 100% trường có `evidence` hoặc được gắn trạng thái `unverified` và hiển thị rõ.
* **Hiệu năng Web:** trang tải < 0,8 giây; truy vấn lọc đa tiêu chí < 200 ms (p95) ở quy mô 5.000 bài.
* **Chi phí:**
  * Hạ tầng cố định: **0 VNĐ/tháng** (Vercel Hobby, R2 Free 10GB, Supabase Free); Zotero là gói trả phí sẵn có của chủ dự án.
  * Gemini: chi phí biến đổi; **đơn giá thực tế mỗi bài được đo ở Giai đoạn 1b**; ước tính trước mỗi lượt chạy và có trần ngân sách.

### 1.5. Nguyên tắc Thiết kế
1. **Evidence-first:** không có trường dữ liệu nào hiển thị mà không kèm nguồn gốc và trạng thái kiểm chứng.
2. **Hoàn toàn tự động:** AI trích xuất kép, AI trọng tài, máy đối chiếu với PDF, máy tự đo độ chính xác và tự cải thiện prompt (Mục 6). Chủ dự án **không đọc bài, không mã hóa, không duyệt**; sửa tay trên web chỉ là tùy chọn (Mục 6.9).
2b. **Đủ dùng, không thừa:** mỗi cơ chế phải giúp chủ dự án dùng dữ liệu an toàn hơn hoặc nhanh hơn; không xây cơ chế chỉ để phục vụ công bố khoa học.
3. **Reproducible:** mọi lượt trích xuất lưu phiên bản model, prompt, schema, codebook và phản hồi thô.
4. **Single source of truth:** một gói schema Zod dùng chung cho Gemini, validator, DB và Web; Zotero là nguồn sự thật cho tệp PDF và metadata thư mục.
5. **Copyright-aware:** quyền truy cập PDF phụ thuộc tình trạng Open Access.
6. **Methodologically sound:** cấu trúc dữ liệu theo chuẩn phương pháp luận hiện hành; không tạo ra các phép so sánh không hợp lệ (VD: so β giữa các mô hình khác nhau).

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ LUỒNG DỮ LIỆU (DATA ARCHITECTURE 3.3)

```
[1. Nguồn tài liệu]
  ├─ Zotero (nguồn chính): collection "Research Data/Inbox" hoặc tag  rd:queue
  └─ Thư mục raw_papers/ (dự phòng cho tệp chưa có trong Zotero)
                       │
                       ▼
[2. Claude Code Resumable Batch Worker (Node.js + TypeScript, chạy local)]
  ├─ S1  ingest         : đồng bộ tăng dần từ Zotero (?since=<version>), tải PDF, SHA-256, loại trùng (hash + DOI + Zotero key)
  ├─ S2  metadata       : Crossref theo DOI (ưu tiên) → Zotero (dự phòng); Unpaywall → trạng thái OA; SJR/ABS/ABDC;
  │                       trạng thái rút bài (Crossref / Retraction Watch); cảnh báo tạp chí ngoài Scopus/SJR/ABDC
  ├─ S3  text_layer     : pdfjs-dist / unpdf → text theo trang; phát hiện PDF scan (needs_ocr);
  │                       xác định printed_page (PageLabels → Crossref + độ lệch → Gemini đọc header/footer)
  ├─ S4  llm_extract    : Gemini API (trả phí), Lớp 1 + Lớp 2 (Mục 6.2, 6.3)
  │        ├─ Trích xuất kép độc lập: Flash (prompt A) và Pro (prompt B), mỗi bản gồm Pass 1 (cấu trúc) + Pass 2 (từng Study)
  │        ├─ Đọc bảng hai kênh: dựng bảng từ text layer (code) + Gemini đọc ảnh riêng vùng bảng
  │        └─ T3: hỏi 3 lần, lấy đa số
  │        (đồng bộ cho lượt nhỏ; Batch API bất đồng bộ submit → poll → ingest cho lượt lớn)
  ├─ S5  verify         : Lớp 3 (máy đối chiếu với PDF, độ đầy đủ + trích bổ sung, tính lại thống kê, Zod schema)
  ├─ S6  arbitrate      : Lớp 4 (trọng tài Gemini Pro, chỉ khi có bất đồng) + Lớp 5 (kiểm tra chéo trong bài)
  ├─ S7  score          : Lớp 6 (chấm điểm tin cậy từng trường: cao ✓ / trung bình ⚠ / thấp ẩn; T3 ◇)
  ├─ S8  normalize      : ánh xạ tên khái niệm → Canonical Construct (tự động khi chắc chắn; không chắc thì trọng tài; vẫn không chắc thì tách)
  ├─ S9  upload         : PDF → Cloudflare R2 (khóa theo hash, bucket private)
  ├─ S10 publish        : ghi Supabase PostgreSQL (bảng chuẩn hóa + raw JSONB + embeddings)
  └─ S11 write_back     : ghi ngược vào Zotero (tag trạng thái, child note tóm tắt, link tới trang web)
                       │
                       ▼
[3. Vercel Web App (Next.js App Router, Server Components)]
  ├─ Truy vấn Supabase (RLS, anon key chỉ đọc), dữ liệu mới hiển thị ngay không cần deploy lại
  ├─ API route cấp Signed URL cho PDF từ R2 (theo quy tắc bản quyền)
  └─ Tìm kiếm: Full-text (tsvector) + bộ lọc facet; Semantic (pgvector) ở giai đoạn sau
                       │
                       ▼
[4. Trải nghiệm Người Dùng]
  ├─ Sửa trực tiếp + Cần chú ý (quản trị) ├─ Thư viện lọc đa chiều + Relationship Search (A ↔ B)
  ├─ Split-Screen Evidence Workspace  ├─ Ma trận tổng hợp + xuất Word APA 7 / Excel
  ├─ Trang Khái niệm & Lý thuyết      ├─ Evidence Map & Heatmap khoảng trống
  └─ Trang "Giới thiệu & cách đọc dữ liệu" (công khai) + /admin/quality (chỉ chủ dự án)
```

* Mỗi bước S1–S11 là **idempotent**, ghi trạng thái vào bảng `pipeline_runs` trên Supabase. Khóa xử lý: `file_hash + schema_version + codebook_version + prompt_version`.
* Dùng **Supabase ngay từ đầu**, không có tầng SQLite trung gian.
* **Ràng buộc gói Free:** mỗi tài khoản chỉ có **2 project đang hoạt động**, và chủ dự án **đã dùng 1 project** cho việc khác. Vì vậy:
  * **Môi trường `prod`:** dùng **slot cloud duy nhất còn lại**.
  * **Môi trường `dev`:** chạy **Supabase CLI local** (cần Docker Desktop trên Windows với WSL2; máy đã có WSL2, chưa có Docker, xem D13). Migrations được thử trên local trước, rồi mới áp dụng lên `prod`.
  * **Phương án dự phòng** nếu không cài Docker: dùng chung project `prod` với một schema PostgreSQL riêng tên `dev`. Cách này rủi ro hơn, nên bắt buộc chạy `pg_dump` trước mỗi lần áp dụng migration.
  * Project Free bị **tạm dừng sau khoảng 7 ngày không hoạt động**: workflow ping trong GitHub Actions (Mục 9.3) giữ project `prod` hoạt động.

---

## 3. TÍCH HỢP ZOTERO (GÓI TRẢ PHÍ) (MỚI)

### 3.1. Vai trò của Zotero trong hệ thống

| Vai trò | Cách tận dụng | Lợi ích |
| :--- | :--- | :--- |
| **Nguồn nạp chính** | Worker đọc qua **Zotero Web API v3** (hoặc Local API của Zotero 7 khi app đang mở); đồng bộ tăng dần bằng tham số `since=<libraryVersion>` | Không phải chép PDF thủ công; chỉ xử lý mục mới hoặc thay đổi |
| **Kho lưu trữ gốc PDF** | Tệp nằm trong **Zotero Storage** (gói trả phí), tải về qua API endpoint `/items/{key}/file` | Zotero là bản gốc; R2 chỉ là bản phục vụ hiển thị, có thể dựng lại bất cứ lúc nào |
| **Kênh kích hoạt xử lý** | Người dùng thêm bài vào collection `Research Data/Inbox` hoặc gắn tag `rd:queue` | Thao tác quen thuộc, không cần học công cụ mới |
| **Nguồn gốc tập bài** *(tùy chọn)* | Nếu muốn, mỗi lượt tìm kiếm là một collection; chuỗi tìm kiếm, CSDL, ngày tìm ghi trong note của collection / trường `Extra` | Xuất được sơ đồ PRISMA 2020 |
| **Sàng lọc (screening)** | Tag `rd:include`, `rd:exclude:<lý do>` | Lưu vết tiêu chí chọn bài |
| **Metadata dự phòng** | Dùng metadata Zotero khi bài không có DOI hoặc Crossref thiếu dữ liệu | Bao phủ bài kỷ yếu, sách, working paper |
| **Bằng chứng từ highlight của bạn** *(tùy chọn)* | Nếu bạn tình cờ highlight khi đọc, highlight trong Zotero Reader theo quy ước màu + mã trường trong comment; worker đọc annotation qua API | Mã hóa ngay khi đọc; annotation có sẵn **số trang in** (`annotationPageLabel`) và vị trí trang (`annotationPosition`) |
| **Bằng chứng do người xác nhận** | Highlight của người dùng khớp với trường AI trích → nâng trạng thái lên `human_reviewed` | Tăng tỷ lệ dữ liệu đã duyệt mà không tốn thêm công |
| **Ghi ngược kết quả** | Worker gắn tag trạng thái (`rd:extracted`, `rd:needs-review`, `rd:verified`) và child note tóm tắt (lý thuyết, mô hình, kết quả chính, link web) | Người dùng thấy kết quả ngay trong Zotero khi viết bài |
| **Chia sẻ** | Không chia sẻ qua Zotero (D4: thư viện cá nhân). Mọi người xem dữ liệu qua **web công khai**; PDF theo chính sách ở Mục 7 | Thư viện cá nhân giữ riêng tư |
| **Khóa trích dẫn ổn định** | Plugin **Better BibTeX**: citekey cố định; nút "Copy citekey" và xuất `.bib` trên web dùng cùng citekey | Nhất quán với LaTeX / Overleaf / Pandoc |
| **Tìm PDF Open Access** | Tính năng "Find Available PDF" của Zotero (dựa trên Unpaywall) | Bổ sung bản OA hợp pháp cho bài còn thiếu tệp |

### 3.2. Quy ước annotation (tùy chọn, không bắt buộc)

| Màu highlight | Phân hệ | Cú pháp comment (ví dụ) |
| :--- | :--- | :--- |
| Vàng | Định nghĩa khái niệm | `#def perceived_risk` |
| Tím | Lý thuyết nền | `#theory TPB role=hypothesis_derivation` |
| Xanh dương | Thiết kế, mẫu, bối cảnh | `#sample S1 n=412 type=consumer_panel` |
| Xanh lá | Giả thuyết & kết quả | `#path S1 H2 PR->PI beta=-.31 p<.001` |
| Cam | Ma trận tương quan / bảng thống kê | `#cormatrix S1 table=2` |
| Đỏ | Hạn chế & hướng nghiên cứu tương lai | `#limit` / `#future` |

Không cần dùng. Nếu có highlight theo quy ước này, worker đọc và dùng làm bằng chứng bổ sung (`source = zotero_annotation`, trạng thái ★).

### 3.3. Lưu ý kỹ thuật
* **Thư viện dùng cho dự án (D4): thư viện cá nhân (My Library).** Bài của dự án nằm trong collection riêng `Research Data` (có collection con `Inbox`); worker **chỉ đọc và ghi trong collection này**.
* **API key Zotero** tạo riêng cho dự án, lưu trong `.env`. Quyền của Zotero cấp theo cả thư viện, không giới hạn được theo collection, nên:
  * Giai đoạn 1–1b chỉ cấp **quyền đọc**; quyền ghi chỉ bật từ Giai đoạn 2, khi có bước ghi ngược.
  * Worker có danh sách cho phép (allowlist) theo collection và chế độ `--dry-run` in ra mọi thay đổi trước khi ghi. Worker chỉ thêm tag có tiền tố `rd:` hoặc child note có tiêu đề bắt đầu bằng `[Research Data]`; **không bao giờ sửa metadata hay xóa mục**.
  * Sao lưu thư viện Zotero (sao chép thư mục dữ liệu Zotero) trước lần ghi ngược đầu tiên.
* *(Tùy chọn sau này)* Nếu nhóm cần cùng làm việc trực tiếp trong Zotero, có thể chuyển collection `Research Data` sang một group library mà không phải đổi kiến trúc, chỉ đổi `ZOTERO_LIBRARY_TYPE` và `ZOTERO_LIBRARY_ID`.
* **Local API** (Zotero 7) chỉ đọc, chạy khi app Zotero đang mở: dùng cho nạp nhanh, không giới hạn tốc độ. **Ghi ngược** (tag, note) phải dùng Web API.
* Tệp lưu bằng **WebDAV không tải được qua Web API**; dự án cần tệp nằm trong **Zotero Storage**.
* **Dung lượng hiện có:** gói Zotero Storage 20 USD/năm = **2 GB**, dùng chung cho thư viện cá nhân và mọi group do chủ dự án sở hữu. Với PDF trung bình ~2 MB, 2 GB chứa được khoảng 800–1.000 bài, tức là đủ cho 300 bài của miền khởi đầu cùng thư viện cá nhân hiện có. Khi kho vượt khoảng 700 bài: nâng lên gói 6 GB hoặc Unlimited, hoặc chuyển bài cũ sang lưu trữ khác.
* Các tính năng khác (group, Web API, Local API, annotation, Better BibTeX) đều **miễn phí**; gói trả phí chỉ mở rộng dung lượng đồng bộ tệp.
* Web API có giới hạn tốc độ: tuân theo header `Backoff` / `Retry-After`.
* Bảng `papers` lưu thêm `zotero_library_id`, `zotero_item_key`, `zotero_attachment_key`, `zotero_version`, `citekey`.

---

## 3A. TẬN DỤNG CLOUDFLARE (MỚI)

Chủ dự án đã có tài khoản Cloudflare (máy đã cài `cloudflared`). Ngoài R2, các dịch vụ sau dùng được cho dự án; tất cả đều có gói miễn phí đủ cho quy mô hiện tại.

| Dịch vụ | Dùng để làm gì trong dự án | Giai đoạn |
| :--- | :--- | :--- |
| **R2** (đã có trong kế hoạch) | Lưu PDF phục vụ hiển thị (private), bản sao lưu `pg_dump` hằng đêm. Gói Free: 10 GB, không tính phí băng thông tải ra | 2 |
| **Workers** | **Chỉ dùng cho tính năng tải nhiều bài (ZIP streaming)** ở giai đoạn sau. Link xem / tải từng PDF do API route của Next.js ký (Mục 7.1), không cần Worker | 6 |
| **Cron Triggers** (Workers) | *Không dùng trong MVP.* Mọi tác vụ định kỳ đặt tập trung ở **GitHub Actions** (Mục 9.3), vì `pg_dump` không chạy được trên Workers và một nơi duy nhất thì dễ theo dõi hơn | — |
| **Cloudflare Tunnel** (`cloudflared`) | *Không cần trong MVP* (không còn người mã hóa thứ hai). Dự phòng: mở tạm web chạy local ra Internet khi cần | — |
| **Cloudflare Access** (Zero Trust) | *Không cần trong MVP*. Dự phòng: khóa thêm route `/review`, `/admin` nếu sau này gắn tên miền riêng qua Cloudflare | — |
| **Registrar + DNS** | Mua tên miền theo giá gốc khi đặt tên chính thức (D8); gắn custom domain cho web và cho R2 | Trước khi mở công khai |
| **Turnstile** | Chống bot ở form **Báo lỗi** của khách và trang đăng nhập quản trị, không bắt giải CAPTCHA khó chịu. **Cần thiết vì web công khai** | 3 |
| **Web Analytics** | Thống kê truy cập không dùng cookie, không cần banner đồng ý | 4 |

**Phân vai Vercel – Cloudflare (đề xuất):**
* **Vercel** giữ vai trò chạy Web Next.js, vì đây là môi trường Next.js được hỗ trợ đầy đủ nhất.
* **Cloudflare** đảm nhận lưu trữ (R2), chống bot (Turnstile), thống kê truy cập, tên miền và DNS; Workers chỉ dùng cho tải ZIP ở giai đoạn sau.
* **GitHub Actions** đảm nhận mọi tác vụ định kỳ (Mục 9.3).
* **Phương án thay thế:** chạy toàn bộ Web trên **Cloudflare Workers** (Next.js qua adapter OpenNext), gom hạ tầng về một nơi. Đổi lại phải cấu hình nhiều hơn và một số tính năng Next.js cần kiểm tra tương thích. Ngoài ra, gói Hobby của Vercel chỉ dành cho mục đích phi thương mại; nếu sau này dự án có thu phí, Cloudflare là lựa chọn rẻ hơn (D11).
* **Không dùng D1 / Vectorize** thay cho Supabase: dữ liệu có quan hệ phức tạp và cần pgvector + full-text trong cùng một CSDL.

---

## 4. CHIẾN LƯỢC SỬ DỤNG GEMINI API (GÓI TRẢ PHÍ)

### 4.1. Lựa chọn model
* **Model Flash** (`GEMINI_MODEL_FAST`): bản trích xuất thứ nhất (prompt A); đọc ảnh vùng bảng (Kênh B); trích bổ sung mục bị thiếu; hỏi 3 lần cho T3.
* **Model Pro** (`GEMINI_MODEL_STRONG`): bản trích xuất thứ hai (prompt B); **trọng tài** (Lớp 4).
* Chỉ dùng Gemini (D15). Phân vai cụ thể có thể điều chỉnh sau khi đo chi phí và độ chính xác ở Giai đoạn 1b.
* Tên model không viết cứng trong code; mỗi bản ghi lưu `model_name`.

### 4.2. Kỹ thuật gọi API
* Native PDF input + `responseMimeType: application/json` + `responseSchema` sinh từ Zod; `temperature: 0`; lưu phản hồi thô.
* **Schema mỗi lượt gọi giữ nhỏ.** Tránh union, `$ref`, lồng quá sâu. Có **test tự động** kiểm tra mỗi schema Zod chuyển được sang `responseSchema` hợp lệ.
* **Trích xuất hai lượt:** Pass 1 lấy cấu trúc và vị trí bảng; Pass 2 lấy chi tiết theo từng Study (có thể tách riêng lượt gọi cho ma trận tương quan).
* **Batch API là bất đồng bộ** (trả kết quả trong tối đa 24 giờ): worker có luồng riêng `submit → poll → ingest`, lưu `batch_job_id`.
* **Context Caching** có ngưỡng token tối thiểu và tính phí lưu theo thời gian; **chưa mặc định bật**. Giai đoạn 1b đo chi phí ba phương án (đồng bộ, đồng bộ + cache, batch) rồi mới chốt.
* **Rate limiting:** token bucket theo RPM/TPM; exponential backoff có jitter; tuân theo `Retry-After`; quá N lần thử thì chuyển `FAILED` kèm lý do.

### 4.3. Kiểm soát chi phí
* Lệnh `estimate`: `countTokens` cho toàn bộ hàng đợi, in chi phí dự kiến trước khi xác nhận chạy.
* **Dây chuyền 7 lớp làm chi phí mỗi bài tăng khoảng 2,5–4 lần** so với trích xuất một lần (trích kép, đọc bảng riêng, trọng tài khi lệch, hỏi 3 lần cho T3). Đơn giá thật đo trên 5 bài đầu ở Giai đoạn 1 rồi mới đặt trần hằng tháng (D6).
* `GEMINI_BUDGET_LIMIT` (USD): worker dừng an toàn khi chạm trần.
* Ghi `input_tokens`, `cached_tokens`, `output_tokens`, `cost_usd` theo bài và theo pass vào `extraction_runs`.
* Đơn giá trong `pricing.json`, cập nhật theo bảng giá hiện hành.

### 4.4. Quyền riêng tư dữ liệu
* Theo điều khoản gói trả phí, dữ liệu gửi lên không dùng để cải thiện sản phẩm của Google; kiểm tra lại điều khoản hiện hành khi bắt đầu.
* API key Gemini và Zotero chỉ nằm trong `.env` của máy chạy worker; không commit, không đưa lên Vercel.

---

## 5. THIẾT KẾ SCHEMA DỮ LIỆU HỌC THUẬT (DATA SCHEMA SPECIFICATION 3.3)

### 5.1. Mô hình quan hệ tổng thể

```
papers ─┬─ studies ─┬─ samples
        │           ├─ measurements ── constructs (canonical) ── construct_aliases
        │           ├─ path_results ── evidence
        │           ├─ correlation_matrices ── matrix_cells / descriptives
        │           └─ condition_cells (thực nghiệm: M, SD, n theo điều kiện)
        ├─ paper_theories ── theories
        ├─ contributions / gaps / limitations ── evidence
        ├─ zotero_annotations (bằng chứng do người tạo)
        └─ extraction_runs, pipeline_runs, reviews, review_changes (kiểm soát chất lượng)
```

Mỗi bảng nghiệp vụ có `raw_extraction JSONB` để truy vết. Mỗi trường trong Codebook được gán **tầng T1 / T2 / T3** (Mục 1.4).

### 5.2. Các phân hệ thực thể

| Phân hệ | Các trường cốt lõi | Ý nghĩa học thuật |
| :--- | :--- | :--- |
| **1. Metadata & Citation** (nguồn: Crossref → Zotero, không phải LLM) | `paper_id`, `doi`, `title`, `authors[]` (họ, tên, ORCID), `year`, `journal`, `volume`, `issue`, `pages`, `apa_citation`, `bibtex`, `citekey` (Better BibTeX), `file_hash`, `zotero_*`, `oa_status`, `journal_quartile` + `quartile_year` + `subject_category` (SJR), `abs_rating`, `abdc_rating`, `indexed_in` (Scopus / WoS / không), `journal_quality_flag` (cảnh báo khi tạp chí không có trong Scopus/SJR hoặc ABDC), `license_source` (oa / institution_subscription / personal_purchase / other), `retraction_status` + `retraction_checked_at` (kiểm tra lại hằng tháng) | Nhận dạng chuẩn; xếp hạng tạp chí gắn với năm và chuyên ngành; phát hiện tạp chí kém chất lượng và bài bị rút |
| **2. Phân loại bài** | `paper_type` (empirical_quant / empirical_qual / mixed / conceptual / systematic_review / meta_analysis), `research_domain`, `corpus_source` (Zotero collection, chuỗi tìm kiếm, CSDL, ngày), `screening_decision` + `exclusion_reason` | Quyết định nhánh trích xuất; hỗ trợ PRISMA 2020 |
| **3. Khung Lý thuyết** *(T3)* | `theory_id` (canonical), `application_role` ∈ {`mentioned`, `framing`, `hypothesis_derivation`, `tested`, `extended`}, `evidence` | Phân biệt lý thuyết *được nhắc tên* với lý thuyết *thực sự dùng để xây giả thuyết* |
| **4. Khái niệm & Đo lường** (theo Study) | `construct_label_original` (T1), `canonical_construct_id` (T3), `definition` + `evidence` (T1), `scale_source`, `adapted`, `n_items`, `items[]`, `scale_type` (reflective / formative, T2), `order` (first / higher-order), `alpha`, `CR`, `AVE`, `HTMT_max` (T1) | Nhất quán định nghĩa; chất lượng thang đo; phát hiện jingle–jangle theo item (Larsen & Bong, 2016) |
| **5. Thiết kế Nghiên cứu & Study** *(T2)* | `study_id`, `study_label`, `research_design`, `time_design`, `experimental_design`, `manipulation_check`, `attention_check`, `exclusion_rate`, `preregistered`, `open_data`, `analysis_method`, `software` | Bao quát bài nhiều study; tín hiệu chất lượng sau khủng hoảng tái lập |
| **6. Mẫu & Bối cảnh** (theo Study) | `n` (T1), `unit_of_analysis`, `sample_type` (T2), `country_iso[]` (T1), `industry_code`, `market_type`, `data_collection_period` | Phục vụ phân nhóm **mô tả** theo bối cảnh |
| **7. Kiểm soát sai lệch** *(T2)* | `cmb_procedural[]`, `cmb_statistical[]`, `cmb_weak_only` (chỉ dùng Harman's single-factor), `endogeneity_method[]` | Câu hỏi phản biện Q1 thường gặp |
| **8. Đường quan hệ được kiểm định** (đơn vị phân tích chính) | `path_id`, `study_id`, `hypothesis_code`, `iv_construct_id`, `dv_construct_id`, `mediator_ids[]`, `moderator_ids[]`, `effect_type` (T2), `estimate_type` (std β / unstd b / OR / d / η² / r…), `estimate`, `se`, `ci_low`, `ci_high`, `ci_method`, `p_value`, `p_reported_as`, `t_or_z`, `r2_dv`, `f2` (T1), `status` (T2), `hypothesized_direction` (+ / − / không định hướng, T1), `observed_sign` (+ / −, T1), `significant` (theo ngưỡng tác giả dùng, T1), `model_covariates[]`, `comparability_note`, `evidence` | Lưu đúng như tác giả báo cáo; **không quy đổi β thành r**; ghi các biến khác có trong mô hình để người dùng hiểu giới hạn so sánh |
| **9. Trung gian & Điều tiết** | Trung gian: `indirect_effect`, `boot_ci`, `mediation_type` theo Zhao, Lynch & Chen (2010). Điều tiết: `interaction_type`, `simple_slopes[]`, `index_moderated_mediation` (Hayes) | Thay phân loại "full/partial" của Baron & Kenny |
| **10. Ma trận tương quan & Thống kê mô tả** (MỚI, T1) | `matrix_id`, `study_id`, `n`, `variables[]` (thứ tự + `construct_id`), `cells[]` (i, j, r), `diagonal_type` (1 / √AVE / α / trống), `descriptives[]` (M, SD, α, CR, AVE theo biến), `correlation_type` (Pearson / latent / polychoric), `source_table`, `pdf_page_index`, `printed_page`, `internal_check` (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE) | Dữ liệu chuẩn cho meta-analysis và **MASEM**; nguồn duy nhất của trục r trong Evidence Map |
| **10b. Ô điều kiện thực nghiệm** (MỚI, T1) | `cell_id`, `study_id`, `factors[]` (VD: disclosure = có / không; source = influencer / brand), `condition_label`, `dv_construct_id`, `mean`, `sd`, `n`, `se`, `test_stat` (F / t), `df`, `p_value`, `effect_size_reported` (η², ω², d) + `effect_size_type`, `source_table`, `pdf_page_index`, `printed_page`, `evidence` | Bài thực nghiệm (rất phổ biến ở mảng đạo đức và social media, VD: công bố tài trợ của influencer) báo cáo M / SD / n theo điều kiện thay vì β; từ đây tính được Cohen's d chuẩn cho meta-analysis |
| **11. Đóng góp & Khoảng trống** *(T3)* | `contribution_type` theo Corley & Gioia (2011), `theoretical_contributions[]`, `practical_implications[]`, `limitations[]`, `future_directions[]`, `gap_type` theo Müller-Bloch & Kranz (2015), `problematization_hint` theo Alvesson & Sandberg (2011) (giả định nền nào của dòng nghiên cứu có thể bị thách thức), mỗi mục kèm `evidence` | Gợi ý cả *gap-spotting* lẫn *problematization* |
| **12. Bằng chứng (Evidence)** | `evidence_id`, `field_ref`, `exact_quote` (≤ 50 từ khi hiển thị công khai), `pdf_page_index`, `printed_page`, `printed_page_method`, `section`, `table_or_figure`, `table_cell` (hàng, cột), `verified`, `verification_method`, `match_score`, `source` (ai / zotero_annotation / human) | Chống hallucination; nhảy đúng trang; trích đúng trang in theo APA |
| **13. Kiểm soát chất lượng** | `extraction_run_id`, `model_name`, `prompt_version`, `schema_version`, `codebook_version`, `extracted_at`, `confidence_level` (high / medium / low), `confidence_signals` (JSON: kết quả từng lớp), `natural_key`, `arbiter_used`, `t3_agreement` (VD: 3/3), `completeness_status` (complete / incomplete) + `missing_items[]`, `cross_model_agreement` (agree / disagree / not_run) + `alt_value`, `stat_consistency` (consistent / inconsistent / decision_error / not_checked) + `recomputed_value` + `error_source` (extraction / original_paper), `confidence`, `review_status` (ai_extracted / auto_verified / human_reviewed / disputed), `reviewer`, `review_notes`, `user_reports[]`; bảng **`review_changes`** lưu mỗi lần duyệt / sửa: trường, **giá trị trước**, **giá trị sau**, người sửa, thời điểm, lý do, chế độ (mù / thường) | Tái lập được; minh bạch mức tin cậy; tính được κ và truy vết mọi chỉnh sửa |

### 5.3. Lớp Khái niệm chuẩn (Canonical Construct Ontology)
* Bảng `constructs`: `canonical_name`, `canonical_definition`, `domain`, `parent_construct_id`.
* Bảng `construct_aliases`: tên gốc ánh xạ về khái niệm chuẩn, kèm `mapping_method` (exact / embedding / item_similarity / human) và `mapping_confidence`.
* Quy trình hoàn toàn tự động: (1) trùng tên gần như tuyệt đối hoặc định nghĩa và item thang đo rất giống (embedding + độ tương đồng item, Larsen & Bong, 2016) → tự động gộp; (2) không rõ → **trọng tài Gemini** quyết, kèm căn cứ; (3) trọng tài vẫn không chắc → **tách riêng** (không gộp). Nguyên tắc: tách nhầm thì vô hại và dễ thấy khi tìm kiếm; gộp nhầm thì làm sai kết quả mà khó phát hiện. Chủ dự án có thể gộp / tách lại trên web nếu muốn (tùy chọn).
* Xây dựng trước cho **miền khởi đầu** (Mục 1.3), mở rộng dần theo miền.
* Cảnh báo jingle–jangle: cùng tên nhưng định nghĩa / item khác xa; khác tên nhưng item trùng lặp.

### 5.4. Chỉ mục & Hiệu năng (Supabase PostgreSQL)
* GIN `tsvector` cho tìm kiếm toàn văn; B-tree cho các cột lọc.
* `pgvector` HNSW với **`halfvec(768)`**, chỉ embed abstract, định nghĩa khái niệm và câu kết quả (~20 đoạn/bài), ước tính ≈ 150MB cho 5.000 bài.
* Materialized view đếm số bài theo facet, làm mới sau mỗi lượt `publish`.
* **Materialized view `relation_index`** phục vụ Relationship Search (8.2b): mỗi dòng là một kiểm định với `iv_canonical_id`, `dv_canonical_id`, `iv_alias_id`, `dv_alias_id`, `mapping_reviewed`, `role` (direct / mediated / moderated), `mediator_ids[]`, `moderator_ids[]`, `paper_id`, `study_id`, `status`, `observed_sign`, `significant`, `estimate_type`, `review_status`. Index B-tree tổng hợp trên `(iv_canonical_id, dv_canonical_id)` và `(dv_canonical_id, iv_canonical_id)` để truy vấn hai chiều; mục tiêu < 200 ms (p95).
* **Migrations SQL** (thư mục `supabase/migrations`) đi kèm mỗi lần đổi `schema_version`.

---

## 6. KIỂM SOÁT CHẤT LƯỢNG TỰ ĐỘNG (KHÔNG CẦN NGƯỜI THAM GIA)

**Nguyên tắc (v3.7):** chủ dự án **không đọc bài, không mã hóa, không duyệt**. Độ chính xác đến từ một dây chuyền kiểm chứng tự động nhiều lớp, trong đó các lớp AI kiểm tra chéo lẫn nhau và các lớp máy móc (không dùng AI) đối chiếu với PDF gốc. Hệ thống **tự biết chỗ nào không chắc** và chỉ gắn cờ những chỗ đó. Mọi lời gọi AI đều dùng **Gemini** (D15).

```
PDF ─► [1] Trích xuất kép độc lập ─► [2] Đọc bảng hai kênh ─► [3] Đối chiếu máy móc với PDF
                                                                     │
        [6] Chấm điểm tin cậy ◄─ [5] Kiểm tra chéo trong bài ◄─ [4] Trọng tài AI (chỉ khi lệch)
              │
              ├─ tin cậy cao ─► hiển thị ✓, tính vào con số tổng hợp
              ├─ trung bình ─► hiển thị ⚠, không tính vào con số tổng hợp mặc định
              └─ thấp ───────► ẩn với khách
[7] Tự đo độ chính xác + tự cải thiện prompt (định kỳ, không cần người)
```

### 6.1. Sổ mã hóa (Codebook)
* Định nghĩa vận hành từng trường, **tầng T1/T2/T3**, danh mục giá trị cho phép, quy tắc xử lý tình huống mơ hồ, ví dụ đúng/sai.
* **Claude Code soạn**, dựa trên các tài liệu phương pháp ở Mục 12; chủ dự án chỉ đọc lướt (khoảng 1–2 giờ, một lần) để sửa các định nghĩa khái niệm và lý thuyết của miền mình.
* Là đầu vào trực tiếp cho mọi prompt; có `codebook_version` và nhật ký thay đổi.

### 6.2. Lớp 1: Trích xuất kép độc lập
* Mỗi bài được trích **hai lần độc lập**: `GEMINI_MODEL_FAST` với prompt A và `GEMINI_MODEL_STRONG` với prompt B. Hai prompt được viết khác nhau về cách diễn đạt và thứ tự yêu cầu, cùng một schema. Hai lần chạy không thấy kết quả của nhau.
* So từng trường: **khớp** → tín hiệu tin cậy mạnh; **lệch** → chuyển sang Lớp 4.
* Mỗi lần chạy vẫn gồm Pass 1 (cấu trúc, danh mục Study / giả thuyết / bảng) và Pass 2 (chi tiết từng Study), như Mục 4.2.

### 6.3. Lớp 2: Đọc bảng bằng hai kênh
Phần lớn β, p, r nằm trong bảng, là chỗ AI dễ nhầm hàng / cột nhất. Với mỗi bảng kết quả, bảng tương quan và bảng điều kiện thực nghiệm:
* **Kênh A (không dùng AI):** dựng lại bảng từ text layer của PDF bằng code (theo tọa độ chữ trên trang).
* **Kênh B (AI, tập trung):** cắt ảnh riêng vùng bảng, đưa Gemini đọc **chỉ bảng đó**, trả về dạng lưới hàng × cột.
* So từng ô giữa hai kênh và với giá trị của Lớp 1. Ô khớp thì tin cậy; ô lệch thì sang Lớp 4.
* PDF scan không có text layer thì chỉ có Kênh B, nên độ tin cậy tối đa của các ô đó là "trung bình".

### 6.4. Lớp 3: Đối chiếu máy móc với PDF (không dùng AI)

| Loại dữ liệu | Phương pháp kiểm chứng |
| :--- | :--- |
| Câu văn (định nghĩa, giả thuyết, hạn chế) | Fuzzy match với text của trang được ghi (cho phép lệch ±1 trang), ngưỡng ≥ 0,90 |
| Số liệu (β, p, n, α…) | Tìm đúng chuỗi số trên trang được ghi, chấp nhận các dạng `.35` / `0.35` / `0,35` / `< .001` |
| Bảng (ma trận tương quan, bảng kết quả) | Số có xuất hiện trên trang; nhất quán nội tại (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE nếu có) |
| Bảng điều kiện thực nghiệm (`condition_cells`) | Số có xuất hiện trên trang; SD > 0; M nằm trong khoảng thang đo |
| Kiểm tra logic chung | p ∈ [0,1]; n > 0; CI chứa estimate; `status` nhất quán với p và chiều tác động |
| PDF scan không có text layer | Gắn cờ `needs_ocr`; các trường của bài chỉ đạt tối đa mức "trung bình" |

* **Độ đầy đủ (chống bỏ sót):** quét text tìm mọi mã giả thuyết (`H\d+[a-z]?`) và tiêu đề bảng (`Table \d+`), hợp nhất với danh mục của Pass 1. Mục nào còn thiếu thì **tự động trích bổ sung riêng mục đó** (một lời gọi nhỏ, tập trung vào đúng trang chứa mục đó); vẫn thiếu thì gắn `completeness_status = incomplete`.
* **Tính lại thống kê (kiểu statcheck, Nuijten et al., 2016):** p từ t / F / z / χ² và df; t từ β và SE; SE từ CI; t / F từ M, SD, n. Lệch lớn, nhất là khi kết luận ý nghĩa bị đảo, thì gắn `stat_consistency`. Nếu giá trị khớp PDF mà vẫn lệch khi tính lại, ghi **"có thể là lỗi của bài gốc"** (`error_source = original_paper`).
* **Metadata** lấy từ Crossref / Zotero, không để AI sinh.
* **Xác định `printed_page`** (lưu kèm `printed_page_method`): (1) PDF `/PageLabels`; (2) trang đầu theo Crossref cộng độ lệch; (3) Gemini đọc số trang ở header/footer; (4) annotation Zotero (`annotationPageLabel`) khi có.

### 6.5. Lớp 4: Trọng tài AI (chỉ chạy khi có bất đồng)
* Chạy khi Lớp 1 lệch, Lớp 2 lệch, hoặc Lớp 3 bác một giá trị.
* Trọng tài là một lời gọi riêng tới **`GEMINI_MODEL_STRONG`**, nhận: ảnh đúng trang hoặc đúng vùng bảng, đoạn text tương ứng, và các giá trị đang tranh chấp (không cho biết giá trị nào đến từ model nào).
* Trọng tài phải **chọn một giá trị, hoặc trả lời "không xác định được"**, và **trích nguyên văn chỗ làm căn cứ**. Câu trả lời của trọng tài lại phải qua Lớp 3; căn cứ không khớp PDF thì trọng tài bị bác.
* **Ánh xạ khái niệm** cũng do trọng tài quyết khi không rõ (Mục 5.3), với nguyên tắc **"không chắc thì tách"**: tách nhầm thì vô hại và dễ thấy; gộp nhầm thì làm sai kết quả mà khó phát hiện.

### 6.6. Lớp 5: Kiểm tra chéo trong cùng bài
Các con số trong một bài phải ăn khớp với nhau. Vi phạm thì hạ điểm tin cậy của các trường liên quan:
* n ở phần phương pháp = n trong bảng = df + số tham số (khi áp dụng được).
* Quan hệ chỉ có một biến dự báo: β chuẩn hóa ≈ r trong ma trận tương quan.
* α, CR ∈ [0, 1]; AVE ≤ 1; √AVE trên đường chéo khớp với AVE báo cáo; HTMT < 1 (khi tác giả kết luận có giá trị phân biệt).
* Tổng n các ô điều kiện thực nghiệm = n của Study (sau loại mẫu).
* Mỗi giả thuyết trong danh mục có đúng một kết quả cho mỗi Study kiểm định nó.

### 6.7. Lớp 6: Chấm điểm tin cậy cho từng trường

**Trường T1 / T2 (có thể kiểm chứng):** gộp các tín hiệu thành một trong ba mức:

| Mức | Điều kiện (ví dụ) | Hiển thị |
| :--- | :--- | :--- |
| **Cao** | Lớp 1 khớp (hoặc Lớp 2 khớp với bảng) + qua Lớp 3 + không vi phạm Lớp 5 | **✓**, tính vào con số tổng hợp |
| **Trung bình** | Phải nhờ trọng tài và trọng tài qua Lớp 3; hoặc chỉ có một kênh; hoặc vi phạm nhẹ ở Lớp 5 | **⚠**, không tính vào con số tổng hợp mặc định (bật công tắc để tính) |
| **Thấp** | Trọng tài bị bác hoặc "không xác định được"; mâu thuẫn không giải quyết được | **Ẩn với khách**; quản trị vẫn thấy |

**Trường T3 (diễn giải, không có đáp án để đối chiếu):** hỏi **3 lần** độc lập (temperature > 0), lấy **đa số**. Tỷ lệ đồng thuận (3/3, 2/3, hoặc không có đa số) là độ tin cậy. Hiển thị bằng nhãn trung tính **◇ AI diễn giải** kèm tỷ lệ đồng thuận, không dùng ⚠. Không có đa số thì không hiển thị giá trị, chỉ ghi "AI không thống nhất".

### 6.8. Lớp 7: Tự đo độ chính xác & tự cải thiện (không cần người)

**a. Bộ đối chứng từ meta-analysis đã công bố (thay cho bộ bài chuẩn do người mã hóa).**
* Claude Code tìm **3–5 meta-analysis thuộc miền khởi đầu** có công bố dữ liệu đã mã hóa (file trên OSF, phụ lục, kho dữ liệu của tạp chí): r, n, đặc điểm mẫu, thiết kế của từng nghiên cứu gốc.
* Chọn các nghiên cứu gốc có trong kho Zotero hoặc có bản OA (khoảng 20–40 bài). Chạy hệ thống, so r, n, thiết kế với giá trị chuyên gia đã mã hóa.
* Lưu tại `benchmarks/` (chỉ script và metadata; dữ liệu có bản quyền không commit vì repo public).
* **Hạn chế:** bộ này chủ yếu phủ r, n, thiết kế. β và p của mô hình SEM được bảo vệ bởi Lớp 2, 3, 5 thay vì đo trực tiếp. Bản thân dữ liệu meta-analysis cũng có thể có lỗi mã hóa; khi hệ thống và meta-analysis lệch nhau, trọng tài đọc lại PDF để xác định bên nào sai trước khi tính là lỗi.

**b. Bài giả lập có đáp án sẵn.** Claude Code tạo PDF giả với số liệu biết trước, nhiều kiểu trình bày bảng (một cột, hai cột, bảng xoay, chú thích dưới bảng, ký hiệu sao `*`, `**`). Dùng để kiểm thử kỹ thuật cho Lớp 2 và Lớp 3. Dữ liệu tự tạo nên commit được vào repo public.

**c. Chỉ số thay thế theo dõi liên tục:** tỷ lệ Lớp 1 khớp, tỷ lệ phải nhờ trọng tài, tỷ lệ trọng tài bị bác, tỷ lệ vi phạm Lớp 5, tỷ lệ trường mức cao / trung bình / thấp, tỷ lệ đồng thuận T3. Hiển thị theo thời gian ở `/admin/quality`. Chỉ số xấu đi bất thường là dấu hiệu chất lượng giảm.

**d. Vòng tự cải thiện prompt:**
1. Khi bộ đối chứng hoặc chỉ số thay thế cho thấy lỗi, Claude Code phân tích các kiểu lỗi lặp lại.
2. Đề xuất sửa prompt / codebook / quy tắc kiểm chứng, tạo `prompt_version` mới.
3. Chạy lại **toàn bộ** bộ đối chứng và bộ bài giả lập.
4. **Chỉ giữ thay đổi nếu điểm tổng tăng và không có nhóm trường nào giảm quá 1 điểm phần trăm**; nếu không thì tự hoàn tác.
5. Thay đổi được giữ thì chạy lại các bài bị ảnh hưởng trong kho (`pnpm worker rerun --since-prompt <v>`), có ước tính chi phí trước.
* Chống "học tủ": chia bộ đối chứng làm hai nửa cố định. Sửa prompt dựa trên nửa A, chấp nhận thay đổi dựa trên nửa B.

**e. Khi Google ngừng model:** chạy lại bộ đối chứng với model mới; chỉ chuyển sang model mới khi điểm không thấp hơn model cũ quá 2 điểm phần trăm. Mỗi lượt chạy ghi phiên bản model cụ thể, không dùng alias kiểu "latest".

### 6.9. Sửa tay (tùy chọn) & Danh sách "Cần chú ý"
* **Không bắt buộc.** Chủ dự án chỉ dùng khi tình cờ thấy chỗ sai lúc xem web.
* Khi đăng nhập quản trị, mỗi trường có nút **✎** để sửa trực tiếp. Trường đã sửa chuyển sang `human_reviewed` (★) và được **khóa**.
* **Khóa tự nhiên ổn định:** mỗi trường gắn với một khóa không phụ thuộc mã tự sinh, ví dụ với đường quan hệ là `DOI + study_label + hypothesis_code + biến độc lập + biến phụ thuộc + loại hiệu ứng`. Khi trích xuất lại, chỗ đã sửa được áp lên dòng mới có cùng khóa; không tìm thấy dòng tương ứng thì đưa vào "Cần chú ý" với ghi chú "chỗ đã sửa không còn dòng tương ứng", để không mất âm thầm.
* Mỗi lần sửa lưu giá trị trước / sau vào `review_changes`; hoàn tác được.
* Danh sách **"Cần chú ý"** (`/admin/attention`) tự gom các trường mức thấp, bài thiếu mục, lỗi thống kê, báo lỗi từ khách. Chỉ để xem khi muốn; không mở cũng không chặn việc gì.
* Khi đăng nhập quản trị, đầu trang có dải màu **"Chế độ quản trị"** để phân biệt với chế độ khách.

### 6.10. Trạng thái tin cậy hiển thị cho người dùng

| Ký hiệu | Trạng thái | Ý nghĩa | Dùng cho |
| :--- | :--- | :--- | :--- |
| **✓** | `auto_verified` (mức cao) | Đã kiểm chứng tự động với PDF qua nhiều lớp | T1, T2 |
| **★** | `human_reviewed` | Chủ dự án đã sửa / xác nhận; bị khóa, không bị ghi đè | Mọi tầng |
| **◇** | `ai_interpreted` | Nhận định của AI, không thể kiểm chứng tự động; kèm tỷ lệ đồng thuận (VD: ◇ 3/3) | T3 |
| **⚠** | `needs_attention` (mức trung bình) | Có vấn đề thật: phải nhờ trọng tài, chỉ có một kênh, vi phạm kiểm tra chéo, thiếu mục, lỗi thống kê | T1, T2 |
| *(ẩn)* | `hidden` (mức thấp) | Không đủ tin cậy để hiển thị cho khách | T1, T2 |
| **⚑** | `disputed` | Có báo lỗi từ khách, chưa xử lý | Mọi tầng |

⚠ chỉ xuất hiện khi thực sự có vấn đề, nên giữ được tác dụng cảnh báo.

### 6.11. Liêm chính học thuật
* Câu học thuật sinh tự động chỉ là **bản nháp**, kèm nhắc "đối chiếu với bản gốc trước khi sử dụng".
* Chỉ sinh câu từ dữ liệu ✓ hoặc ★; không dùng dữ liệu ⚠, ◇ hoặc ⚑.
* Câu trích công khai giới hạn ≤ 50 từ.
* Khi dùng dữ liệu của hệ thống cho bài viết: luôn trích dẫn bài gốc (không trích dẫn hệ thống), mở bằng chứng trong PDF để kiểm tra nhanh (một cú bấm), và khai báo việc dùng công cụ AI nếu tạp chí yêu cầu.

---

## 7. QUẢN LÝ BẢN QUYỀN & CHIA SẺ PDF

**Bối cảnh (D2):** web công khai, ai có URL đều xem được, không cần đăng nhập. Chỉ chủ dự án có tài khoản quản trị.

* **Dữ liệu trích xuất** (ma trận, đường quan hệ, định nghĩa, thang đo, câu trích ≤ 50 từ kèm số trang) **công khai cho mọi người**. Đây là dữ liệu dữ kiện kèm trích dẫn ngắn, rủi ro bản quyền thấp.
* **Tệp PDF gốc** chia theo tình trạng Open Access (Unpaywall) và nguồn có được tệp (`license_source`):

| Tình trạng | Khách (không đăng nhập) | Chủ dự án (đăng nhập) |
| :--- | :--- | :--- |
| Gold / Hybrid / Green OA với giấy phép mở (CC-BY…) | Xem và tải trực tiếp | Xem và tải |
| Bronze OA hoặc không rõ giấy phép | Nút **"Bản OA"** (link gốc của nhà xuất bản / kho lưu trữ) và **"Mở DOI"** | Xem và tải |
| Không phải OA (bài có bản quyền, tải qua thư viện trường hoặc tự mua) | **Chỉ link DOI**; không xem, không tải | Xem và tải |

  *(Đã chốt ở D14.)*
* **Lý do không cho khách tải bài không OA:** web công khai mà phát tán PDF có bản quyền là hành vi phân phối lại tài liệu có bản quyền. Hệ quả có thể là yêu cầu gỡ bỏ (DMCA) gửi tới Vercel / Cloudflare, bị khóa tài khoản, hoặc vi phạm hợp đồng thuê bao của thư viện trường.
* **Giấy phép khi gửi PDF lên AI:** một số hợp đồng thuê bao của nhà xuất bản hạn chế việc tải toàn văn lên công cụ AI bên thứ ba. Gói Gemini trả phí không dùng dữ liệu để huấn luyện, nên giảm được rủi ro, nhưng không thay đổi điều khoản hợp đồng. Khi tiện, hỏi thư viện trường về điều khoản AI / TDM; ưu tiên bản OA khi có. Trường `license_source` (oa / institution_subscription / personal_purchase / other) cho phép lọc hoặc xử lý riêng khi cần. *(Lưu ý quản trị rủi ro, không phải tư vấn pháp lý.)*
* **Zotero Storage là kho gốc**; R2 (private) chỉ là bản phục vụ hiển thị, dựng lại được từ Zotero.
* Có trang **"Giới thiệu & chính sách nội dung"**: mục đích của trang, nguồn dữ liệu, cách đọc kết quả, và kênh tiếp nhận yêu cầu gỡ bỏ.

### 7.1. Tải bài gốc (PDF) từ Web

**Luồng kỹ thuật:**
1. Người dùng bấm **"Tải PDF gốc"** (ở thẻ bài báo, trang chi tiết, Split-Screen, kết quả Relationship Search). Nút chỉ hiện khi người đó có quyền theo bảng ở Mục 7.
2. Trình duyệt gọi **API route của Next.js** (`/api/papers/[id]/pdf`). Route kiểm tra quyền: bài OA mở thì cho mọi người; bài còn lại thì chỉ cho phiên đăng nhập của chủ dự án.
3. Route tạo **presigned URL của R2 có hạn 5 phút**, kèm header `Content-Disposition: attachment` và tên tệp dễ đọc theo mẫu `Tacgia_Nam_Tieu-de-rut-gon.pdf` (VD: `Nguyen_2023_Perceived-risk-and-purchase-intention.pdf`).
4. Trình duyệt **tải thẳng từ R2**, không đi qua Vercel. Lý do: hàm serverless của Vercel giới hạn dung lượng phản hồi khoảng 4,5 MB, vượt là lỗi; tải từ R2 cũng không tốn băng thông.

**Các nút liên quan:**
* **Xem** (mở trong trình đọc pdf.js) và **Tải về** là hai nút riêng.
* Không có quyền: nút chuyển thành **"Mở DOI"** hoặc **"Bản OA"** (link Unpaywall).
* *(Giai đoạn sau)* **Tải nhiều bài**: chọn nhiều bài rồi tải một tệp ZIP (Cloudflare Worker ghép ZIP dạng streaming), kèm `references.bib` và `references.ris` (dùng citekey Better BibTeX). Khách chỉ tải ZIP được các bài OA; tệp `.bib` / `.ris` thì cho tất cả.

**Bảo vệ (web công khai):**
* **Giới hạn tốc độ theo IP** cho API tải PDF và API tìm kiếm (VD: 30 lượt tải / giờ / IP) để chặn tải hàng loạt và bot.
* Link hết hạn sau 5 phút; không bao giờ để lộ đường dẫn R2 cố định.
* Không ghi dữ liệu cá nhân của khách; chỉ thống kê tổng số lượt tải theo bài (không lưu IP quá 24 giờ, chỉ dùng cho giới hạn tốc độ).

---


## 8. THIẾT KẾ TRẢI NGHIỆM GIAO DIỆN HỌC THUẬT (UI/UX SPECIFICATION 3.3)

Phong cách **Tối giản học thuật (Clean Academic Deep-Work Workspace)**; MVP giao diện tiếng Việt, sẵn sàng i18n; đạt **WCAG AA**; điều hướng được bằng bàn phím.

### 8.0. Quy trình thiết kế (MỚI)
1. Không làm prototype riêng: **bản web local ở Giai đoạn 3a chính là prototype**, được chỉnh dần qua việc dùng thật.
2. Tự dùng thử và nhờ **2–3 đồng nghiệp / NCS** dùng thử bằng tác vụ thật, ví dụ: "tìm định nghĩa và thang đo của *Perceived Risk*", "lập bảng tổng quan cho 10 bài", "kiểm tra kết quả H2 của một bài trong PDF".
3. Ghi lại thời gian hoàn thành, lỗi, nhận xét; chỉnh thiết kế ở Giai đoạn 3b, trước khi mở công khai.

### 8.1. Quy chuẩn hiển thị số liệu thống kê (MỚI)
* Theo APA 7: **bỏ số 0 đứng đầu** với giá trị không vượt quá 1 (p, r, β chuẩn hóa); ký hiệu thống kê in nghiêng (*β*, *p*, *r*, *n*).
* Font có chữ số cùng độ rộng (tabular figures) để cột số thẳng hàng.
* p hiển thị như tác giả báo cáo (`p_reported_as`) khi không có giá trị chính xác.

### 8.2. Thư viện lọc đa chiều (Faceted Library)
* Ô tìm kiếm gợi ý tự động theo khái niệm chuẩn và lý thuyết; truy vấn mẫu cho người mới.
* Bộ lọc (kèm số bài): năm, loại bài, miền nghiên cứu, lý thuyết nền (kèm vai trò), thiết kế, phương pháp phân tích, loại mẫu, quốc gia/khu vực, ngành, B2B/B2C, xếp hạng tạp chí, trạng thái OA, mức tin cậy dữ liệu, **có ma trận tương quan**.
* Thẻ bài báo: tác giả & năm, tạp chí + xếp hạng, thiết kế, số Study, tóm tắt mức tin cậy, nút **Copy APA**, **Copy citekey**, **Xem chi tiết**, **Xem PDF** và **Tải PDF gốc** (theo quyền, Mục 7.1), **DOI**.
* Có màn hình trống và skeleton khi tải.

### 8.2b. Tìm theo mối quan hệ giữa hai biến (Relationship Search) (MỚI)
Trả lời trực tiếp câu hỏi cốt lõi số 1: *"Mối quan hệ giữa biến A và biến B đã được nghiên cứu thế nào?"*

**Đây là trang chủ của web.** Ô "Biến A ↔ Biến B" nằm ở trung tâm trang đầu tiên, kèm 3 truy vấn mẫu của miền khởi đầu (VD: *Influencer Credibility → Purchase Intention*, *Brand Authenticity → Brand Loyalty*, *Sponsorship Disclosure → Consumer Skepticism*). Thư viện lọc đa chiều (8.2) là tab thứ hai.

**a. Ô nhập truy vấn**
```
┌─ Biến A ─────────────────┐   [ → ⇄ ← ]   ┌─ Biến B ─────────────────┐
│ Perceived Risk         ▾ │               │ Purchase Intention     ▾ │   [ Tìm kiếm ]
└──────────────────────────┘               └──────────────────────────┘
  Vai trò quan hệ: (●) Trực tiếp  ( ) Qua trung gian  ( ) Có điều tiết  ( ) Tất cả
  [x] Bao gồm tên gọi tương đương    [ ] Chỉ ánh xạ độ tin cậy cao    [ ] Bao gồm các thành phần    [ ] Chỉ dữ liệu đã kiểm chứng (✓ ★)
```
* **Ô Biến A / Biến B:** gợi ý tự động theo **khái niệm chuẩn**, đồng thời **cho nhập tự do** (tìm theo tên gốc trong bài) khi danh sách khái niệm chuẩn chưa có tên cần tìm; các truy vấn tự do không có kết quả được ghi lại để chủ dự án bổ sung vào danh sách khái niệm chuẩn; mỗi gợi ý hiển thị số bài và các tên gọi khác (VD: *Perceived Risk*, cũng gọi là *Risk Perception*, *Consumer Perceived Risk*).
* **Chiều quan hệ:** `A → B` (A là biến độc lập, B là biến phụ thuộc), `B → A`, hoặc `⇄` (cả hai chiều). Mặc định là `A → B`.
* **Vai trò quan hệ:**
  * *Trực tiếp:* A → B là một đường quan hệ trực tiếp.
  * *Qua trung gian:* hiệu ứng gián tiếp A → M → B (mọi biến trung gian M), kèm tên M.
  * *Có điều tiết:* quan hệ A → B có biến điều tiết W, kèm tên W.
* **Tên gọi tương đương:** bật thì gộp mọi tên gốc được ánh xạ về cùng khái niệm chuẩn; tùy chọn "chỉ ánh xạ độ tin cậy cao" để loại các ánh xạ còn ở trạng thái gợi ý.
* **Chỉ dữ liệu đã kiểm chứng:** bật thì thanh tổng hợp và danh sách kết quả chỉ tính các kiểm định có huy hiệu ✓ hoặc ★; tắt (mặc định) thì tính cả ⚠, kèm số lượng ⚠ hiển thị riêng (VD: "37 kiểm định, trong đó 5 ⚠").
* **Bao gồm các thành phần (khái niệm bậc cao):** nhiều khái niệm được đo như khái niệm bậc hai, ví dụ *Social Media Marketing Activities* gồm entertainment, interaction, trendiness, customization, WOM. Bật công tắc này thì kết quả tính cả các quan hệ ở cấp thành phần (VD: *Entertainment → Brand Equity*), dựa trên `parent_construct_id`. Mỗi dòng kết quả ghi rõ là quan hệ ở cấp tổng hay cấp thành phần.
* **Tên khái niệm luôn hiển thị bằng tiếng Anh** như trong bài gốc; chú giải tiếng Việt khi rê chuột sẽ bổ sung ở giai đoạn sau.
* *(Giai đoạn sau)* Nút **"+ Thêm biến"** để tìm chuỗi A → M → B với M cụ thể.

**b. Thanh tổng hợp kết quả** (mọi con số đều là **"trong kho"**, VD: "24 bài trong kho") (mỗi mục là một bộ lọc bấm được)
```
24 bài · 31 study · 37 kiểm định
Kết quả giả thuyết:  ✓ Ủng hộ 25   ✗ Không ủng hộ 8   ◐ Một phần / Trộn 3   ○ Không đặt giả thuyết 1
Chiều tác động:      ＋ Dương 4    － Âm 27    ∅ Không có ý nghĩa 6
```
* Phân biệt rõ hai khái niệm:
  * **Kết quả giả thuyết** (`status`): giả thuyết của tác giả có được ủng hộ hay không.
  * **Chiều tác động** (dấu của estimate và ý nghĩa thống kê): tác động thực tế là dương, âm hay không có ý nghĩa.
  * Hai thông tin này có thể khác nhau, ví dụ giả thuyết dự đoán tác động dương nhưng kết quả âm có ý nghĩa vẫn là "không ủng hộ".

**c. Bộ lọc bổ sung sau khi tìm**
* **Kết quả giả thuyết:** Ủng hộ / Không ủng hộ / Một phần hoặc Trộn / Không đặt giả thuyết (chọn nhiều).
* **Chiều tác động:** Dương / Âm / Không có ý nghĩa.
* **Loại hiệu ứng:** trực tiếp / gián tiếp / tương tác / tổng.
* **Thước đo:** β chuẩn hóa / b / OR / d / r…; có ma trận tương quan hay không.
* Toàn bộ facet của Thư viện (8.2): năm, thiết kế, phương pháp phân tích, loại mẫu, quốc gia, ngành, B2B/B2C, xếp hạng tạp chí, mức tin cậy dữ liệu.

**d. Danh sách kết quả** (nhóm theo bài, mở rộng theo từng kiểm định)
```
▸ Nguyen et al. (2023) · J. Retailing and Consumer Services · Q1 · Survey, PLS-SEM · VN · n = 412
    S1  H2  Perceived Risk → Purchase Intention   β = −.31  p < .001  ✓ Ủng hộ   (p. 1252) ✓ đã kiểm chứng
▸ Kim & Lee (2021) · Journal of Business Research · Q1 · Thực nghiệm 2 study
    S1  H1  Perceived Risk → Purchase Intention   β = −.12  p = .08   ✗ Không ủng hộ (p. 88)
    S2  H1  Perceived Risk → Purchase Intention   β = −.27  p = .002  ✓ Ủng hộ   (p. 91)
            điều tiết bởi: Brand Familiarity
```
* Mỗi dòng kiểm định hiển thị: Study, mã giả thuyết, tên biến **như tác giả dùng** (kèm khái niệm chuẩn khi khác tên), estimate kèm `estimate_type`, p, kết quả giả thuyết, biến trung gian / điều tiết, số trang in và huy hiệu tin cậy.
* Bấm vào dòng kiểm định: mở Split-Screen (8.3) đúng trang và tô sáng câu / ô bảng chứa kết quả.
* Sắp xếp theo: năm, cỡ mẫu, xếp hạng tạp chí, độ lớn tác động (chỉ trong cùng `estimate_type`).
* Một bài có nhiều kiểm định với kết quả khác nhau (VD: Study 1 không ủng hộ, Study 2 ủng hộ) được gắn nhãn **"Kết quả khác nhau giữa các study"**.

**e. Hành động trên tập kết quả**
* **Xuất bảng** Word APA 7 / Excel cho đúng tập kết quả đã lọc (dùng định dạng Ma trận 8.4).
* **Copy câu tổng hợp (bản nháp)**, ví dụ: *"Of 31 studies examining the effect of perceived risk on purchase intention, 25 supported a negative relationship (e.g., Nguyen et al., 2023, p. 1252), whereas 6 reported non-significant effects (e.g., Kim & Lee, 2021, p. 88)."* Chỉ dùng dữ liệu `auto_verified` / `human_reviewed`, kèm nhắc nhở rằng đây là đếm mô tả, không thay thế meta-analysis.
* **Xem trên Evidence Map** (8.7) cho cặp biến này (khi tính năng có ở Giai đoạn 6).
* **Chia sẻ truy vấn bằng URL**, ví dụ: `/relations?a=perceived_risk&b=purchase_intention&dir=ab&role=direct&status=supported`.

**f. Trạng thái trống & cảnh báo**
* Không có kết quả: gợi ý đảo chiều quan hệ, bật tên gọi tương đương, hoặc chuyển sang "Tất cả vai trò"; đồng thời ghi rõ **"Chưa có bài nào trong kho kiểm định quan hệ này: có thể là khoảng trống nghiên cứu"**, kèm nhắc rằng kho chưa bao phủ toàn bộ tài liệu.
* **Gộp cảnh báo để tránh "mù cảnh báo":** dưới thanh tổng hợp chỉ có **một dòng** "ⓘ Cách đọc kết quả này". Bấm vào thì mở bảng giải thích đầy đủ: số liệu là thống kê mô tả trong kho; không có ý nghĩa thống kê ≠ không có tác động; kho chỉ gồm bài đã xuất bản nên tỷ lệ "ủng hộ" có thể cao hơn thực tế (thiên lệch xuất bản); kho phản ánh thư viện của chủ dự án, không phải toàn bộ tài liệu.
* Chỉ những cảnh báo **làm thay đổi kết luận** mới hiện trực tiếp trên dòng kết quả. Bài bị rút (retracted), lỗi thống kê làm đảo kết luận, hoặc tạp chí bị gắn cờ chất lượng: hiển thị nhãn cảnh báo trên dòng kết quả và **mặc định loại khỏi thanh tổng hợp** (có công tắc để hiển thị lại).

### 8.3. Split-Screen Evidence Workspace
* Thanh chia kéo được (mặc định 45/55, ghi nhớ lựa chọn).
* Bên trái: pdf.js qua Signed URL; không có quyền thì hiển thị abstract + link DOI.
* Bên phải theo tab: Tổng quan | Lý thuyết | Study & Mẫu | Đo lường | Kết quả | Tương quan | Đóng góp & Khoảng trống.
* Anchor Click: bấm vào trường thì PDF nhảy đến trang và **tô sáng đúng câu / ô bảng**.
* Đồng bộ hai chiều: bôi đen một đoạn trong PDF thì hiện các trường trích từ đoạn đó.
* **Huy hiệu tin cậy ở cấp phần** (VD: "Kết quả: 18/20 đã kiểm chứng"); bấm vào mới xem chi tiết từng trường. Nút **Báo lỗi** (khách dùng được, có Turnstile chống spam) trên từng trường.

### 8.4. Ma trận tổng hợp Master-Detail
* Dòng chính: Tác giả & Năm | Lý thuyết | Thiết kế & Mẫu (n, quốc gia) | Kết quả chính.
* Dòng mở rộng: đường quan hệ theo Study với estimate (kèm `estimate_type`), CI, p, R², trạng thái, câu trích và số trang.
* Cố định cột đầu; chọn cột; **saved views**; chỉnh mật độ hiển thị.
* Mã trạng thái luôn có biểu tượng kèm màu: ✓ Supported (xanh ngọc dịu) · ✗ Not supported (xám đá) · ◐ Partially / Mixed (vàng hổ phách) · ○ Not hypothesized (viền xám).
* Copy câu học thuật (bản nháp), chỉ với dữ liệu `auto_verified` / `human_reviewed`.
  *Ví dụ: "Perceived ease of use positively affects intention to use (β = .35, p < .001; Nguyen et al., 2023, p. 1252)."*
* Xuất **Excel** (`exceljs`) và **Word** (`docx`) theo bảng APA 7: số bảng in đậm, tiêu đề in nghiêng, ba đường kẻ ngang, phần *Note.*, Times New Roman 12.
* Mobile: dạng thẻ chỉ đọc.

### 8.5. Trang Khái niệm
* Định nghĩa chuẩn + mọi định nghĩa gốc (kèm trích dẫn, số trang).
* Thang đo đã dùng: nguồn, số item, nội dung item, α / CR / AVE.
* Mạng quan hệ: tiền tố, hệ quả, vai trò trung gian / điều tiết; cảnh báo jingle–jangle.

### 8.6. Trang Lý thuyết
* Bài sử dụng theo vai trò (`mentioned` → `extended`); khái niệm thường đi cùng; bối cảnh phổ biến; xu hướng theo năm.

### 8.7. Evidence Map
* Nhập cặp quan hệ (VD: `Perceived Risk` → `Purchase Intention`), tự gộp tên gọi khác qua lớp khái niệm chuẩn.
* **Forest plot chỉ dùng r từ ma trận tương quan** (kèm CI tính từ n), kích thước điểm theo n.
* Kết quả β / b / OR / d hiển thị trong **bảng riêng theo `estimate_type`**, không vẽ chung trục với r; ghi kèm `model_covariates`.
* Phân nhóm theo bối cảnh với ghi chú bắt buộc: **"So sánh mô tả, không phải kiểm định moderator"**.
* Nhãn "kết quả không nhất quán" chỉ dùng khi CI không chồng lấn hoặc khác chiều tác động.
* Cảnh báo: "Không có ý nghĩa thống kê ≠ không có tác động; xem n và CI."
* **Funnel plot** và cảnh báo thiên lệch xuất bản khi có đủ ≥ 10 study cho cặp quan hệ.
* Bài thực nghiệm: d được tính từ `condition_cells` (M, SD, n) và hiển thị trong một forest plot riêng.
* Xuất ma trận tương quan và dữ liệu effect size ra CSV / định dạng dùng được cho R (`metafor`, `metaSEM`) và JASP.

### 8.8. Mạng quan hệ & Heatmap khoảng trống
* Đồ thị nomological network; cạnh tô màu theo độ mạnh và tính nhất quán của bằng chứng.
* Heatmap khái niệm × khái niệm: ô trống / ít bằng chứng là gợi ý *gap-spotting*.
* Kèm gợi ý *problematization*: các giả định nền mà nhiều bài cùng chấp nhận (từ trường `problematization_hint`).

### 8.9. Trang "Giới thiệu & cách đọc dữ liệu"
* Công khai, ngắn gọn: mục đích của trang (công cụ nghiên cứu cá nhân, chia sẻ công khai), nguồn dữ liệu (thư viện Zotero của chủ dự án), cách hệ thống trích xuất và kiểm chứng, ý nghĩa các huy hiệu tin cậy, độ chính xác đo trên bộ bài chuẩn (một bảng nhỏ), phiên bản model, chính sách nội dung và kênh yêu cầu gỡ bỏ.

### 8.10. Bộ sưu tập theo dự án (hoãn, ngoài MVP)
* Cần tài khoản người dùng nên **không làm trong MVP** (web công khai, không đăng nhập). Thay thế: chia sẻ truy vấn bằng URL, và lưu các truy vấn yêu thích trong trình duyệt (localStorage). Xuất `.bib` / `.ris` cho mọi tập kết quả.

---

## 9. CÔNG NGHỆ SỬ DỤNG & CẤU TRÚC MÃ NGUỒN

### 9.1. Tech stack

| Thành phần | Công nghệ |
| :--- | :--- |
| Ngôn ngữ | **TypeScript** toàn bộ, một runtime Node.js |
| Schema | **Zod** → `zod-to-json-schema` (Gemini) + kiểu DB + kiểu Web |
| Worker | Node.js CLI, chạy local, do Claude Code xây dựng và vận hành |
| Nguồn tài liệu | **Zotero Web API v3** + Zotero 7 Local API; Better BibTeX |
| Trích xuất | Gemini API (trả phí): Flash / Pro, Batch API, Context Caching (tùy kết quả đo) |
| Text layer PDF | **`pdfjs-dist`** hoặc **`unpdf`** (giấy phép Apache / MIT) |
| Metadata | Crossref REST API, Unpaywall API, citation-js (CSL → APA 7 / BibTeX) |
| Embedding | Gemini embedding, giảm chiều 768, lưu `halfvec` |
| CSDL | Supabase PostgreSQL + pgvector, RLS, Supabase Auth; **1 project cloud (`prod`)** + **Supabase CLI local (`dev`, chạy trên Docker)**; migrations bằng Supabase CLI |
| Lưu trữ PDF phục vụ hiển thị | Cloudflare R2 (private) + Signed URL |
| Web | Next.js App Router, Tailwind CSS, shadcn/ui, TanStack Table, react-pdf / pdf.js |
| Biểu đồ | Recharts hoặc Visx (forest plot, heatmap), Cytoscape.js (mạng quan hệ) |
| Xuất file | `docx`, `exceljs` |
| Triển khai & vận hành | GitHub → Vercel; GitHub Actions cho CI, kiểm thử hồi quy và mọi tác vụ định kỳ (Mục 9.3) |
| Kiểm thử | Vitest, Playwright (Mục 9.4) |

### 9.2. Cấu trúc monorepo (pnpm workspaces)

```
research-data/
├─ packages/
│  └─ schema/          ← Zod schema, codebook, prompt (dùng chung)
├─ apps/
│  ├─ worker/          ← CLI: sync, estimate, extract, verify, arbitrate, publish, write-back, rerun, benchmark:run, benchmark:improve
│  └─ web/             ← Next.js (gồm trang quản trị: sửa trực tiếp, Cần chú ý, chất lượng)
├─ supabase/
│  └─ migrations/      ← migrations SQL theo schema_version
├─ benchmarks/         ← script bộ đối chứng (danh sách meta-analysis, DOI nghiên cứu gốc, cách so khớp) + bài giả lập tự tạo; dữ liệu có bản quyền KHÔNG commit vì repo public
├─ docs/               ← codebook.md, quality-assurance.md, architecture.md, data-schema.md, ux-spec.md, integrations.md
├─ raw_papers/         ← (không commit) PDF dự phòng ngoài Zotero
└─ extracted_data/     ← (không commit) phản hồi thô
```

* Code hiện có (`schema.js` dạng CommonJS) được **viết lại** thành `packages/schema` theo Zod, không vá tiếp.
* `.gitignore` bổ sung: `extracted_data/`, `raw_papers/`, `.env*` (trừ `.env.example`).

### 9.3. Tác vụ định kỳ (GitHub Actions, MỚI)
Mọi tác vụ định kỳ đặt tập trung ở GitHub Actions để dễ theo dõi (Cloudflare Cron không dùng trong MVP).

| Workflow | Lịch | Việc làm |
| :--- | :--- | :--- |
| `backup.yml` | Hằng đêm | `pg_dump` Supabase `prod` → nén → R2 (giữ 30 bản gần nhất) |
| `keepalive.yml` | 2 lần/tuần | Gửi truy vấn nhẹ tới Supabase `prod` để project không bị tạm dừng |
| `retraction-check.yml` | Hằng tháng | Kiểm tra lại trạng thái rút bài qua Crossref cho mọi bài; gắn cảnh báo lên bài và mọi kết quả liên quan |
| `ci.yml` | Mỗi pull request / push | Lint, type-check, unit test (Mục 9.4) |
| `regression.yml` | Khi `packages/schema` hoặc prompt thay đổi | Chạy bộ bài giả lập và nửa B của bộ đối chứng (Mục 6.8); có trần chi phí riêng |

Các khóa bí mật (Supabase, R2, Gemini) lưu trong **GitHub Actions Secrets**, không bao giờ in ra log.

### 9.4. Chiến lược kiểm thử (MỚI)

| Loại | Phạm vi | Công cụ |
| :--- | :--- | :--- |
| Unit test | Bộ kiểm chứng (fuzzy match câu văn, khớp số `.35` / `0.35` / `0,35`, kiểm tra ma trận tương quan, kiểm tra `condition_cells`); xác định `printed_page`; quy tắc logic | Vitest |
| Schema test | Mọi schema Zod chuyển được sang `responseSchema` hợp lệ của Gemini; ví dụ JSON mẫu qua được validate | Vitest |
| Database test | Migrations chạy được từ đầu trên Supabase local; RLS: khách đọc được mọi dữ liệu trừ trường bị ẩn (không khớp PDF), không ghi được; chỉ tài khoản quản trị ghi được; truy vấn `relation_index` trả đúng kết quả cho dữ liệu mẫu | Supabase CLI + Vitest |
| End-to-end | Khách: Relationship Search → mở Split-Screen → tải PDF OA (bài không OA chỉ hiện link DOI). Quản trị: đăng nhập → sửa một trường → trích xuất lại → trường đã sửa không bị ghi đè | Playwright |
| Hồi quy chất lượng trích xuất | Bộ bài giả lập + bộ đối chứng | `benchmark:run` |

* **Dữ liệu dùng trong test phải là văn bản tự viết** (bài báo giả lập, PDF tự tạo). Repo public, nên không đưa nội dung bài báo có bản quyền vào test.
* Gọi Gemini trong test dùng phản hồi giả lập (mock); chỉ `regression.yml` gọi API thật, và có trần chi phí riêng.

### 9.5. Quy trình triển khai: GitHub → Vercel (MỚI)

**Luồng mã nguồn:**
```
Máy chủ dự án                   GitHub (research-data, public)        Vercel
(Claude Code viết code)                                                (chạy Web)
      │  git push                        │                                │
      ├─────────────────────────────────►│  webhook: có code mới          │
      │                                  ├───────────────────────────────►│  build apps/web (1–3 phút)
      │                                  │  ci.yml chạy test song song     │  → cập nhật trang web
```
* **Nhánh `main`** → Vercel cập nhật **bản chính** (production) mà nhóm đang dùng.
* **Nhánh khác / pull request** → Vercel tạo **bản xem trước** (preview) với địa chỉ riêng để thử; trang chính không bị ảnh hưởng.
* **Quy tắc gộp:** chỉ gộp vào `main` khi `ci.yml` qua hết và chủ dự án đã xác nhận (xem bản preview hoặc đồng ý trong chat). Bật **branch protection** cho `main`.
* **Quay lui:** bản mới bị lỗi thì dùng tính năng *Instant Rollback* của Vercel để quay về bản trước ngay lập tức, rồi mới sửa code.
* **Cấu hình Vercel:** Root Directory = `apps/web`; chỉ build lại khi `apps/web/` hoặc `packages/schema/` thay đổi (Ignored Build Step). Biến môi trường (Supabase anon key, token R2 chỉ đọc, URL…) khai báo trong **Vercel Project Settings**, không nằm trong code.

**Luồng dữ liệu (không đi qua GitHub, không cần build lại):**
```
Zotero → Worker (máy chủ dự án) → Supabase (dữ liệu) + R2 (PDF) ← Web trên Vercel đọc trực tiếp khi người dùng truy cập
```
* Thêm bài mới → dữ liệu hiện trên web ngay, **không cần đẩy code**.
* Chỉ khi sửa giao diện hoặc tính năng mới cần đẩy code lên GitHub.

**Vai trò của GitHub:** kho mã nguồn gốc và lịch sử phiên bản; nguồn để Vercel triển khai; CI chặn code lỗi; nơi chạy tác vụ định kỳ (Mục 9.3); giữ khóa bí mật cho các tác vụ đó (Actions Secrets); chia sẻ mã nguồn mở theo giấy phép MIT.

**Việc của chủ dự án:** một lần lúc đầu (đăng nhập GitHub, bấm "Import from GitHub" trên Vercel); sau đó chỉ xem bản preview và xác nhận khi có tính năng mới. Commit, push, mở pull request do Claude Code thực hiện.

---

## 10. LỘ TRÌNH THỰC HIỆN (ROADMAP 3.3)

### 📍 Giai đoạn 0: Nền tảng & Bộ khung chạy được
1. **Bộ khung chạy được (làm đầu tiên, khoảng 2 tuần):** một lát cắt mỏng từ đầu đến cuối trên máy local: 1 bài OA → Gemini trích 3–4 trường → kiểm chứng câu trích → ghi vào Supabase local → một trang web đơn giản hiển thị kèm PDF. Mục đích: chứng minh các mắt xích nối được với nhau trước khi làm sâu từng phần.
2. Dựng monorepo; cài Docker Desktop + Supabase CLI (D13); khởi tạo repo GitHub `research-data` (public, MIT).
3. **Tách tài liệu kế hoạch:** `PROJECT_PLAN.md` chỉ giữ tổng quan, quyết định và lộ trình; chi tiết chuyển sang `docs/architecture.md`, `docs/data-schema.md`, `docs/quality-assurance.md`, `docs/ux-spec.md`, `docs/integrations.md`; lịch sử thay đổi chuyển sang `CHANGELOG.md`. Nội dung giữ nguyên.
4. **Claude Code soạn Codebook v1.0** (gán tầng T1/T2/T3 cho mọi trường); chủ dự án đọc lướt và sửa định nghĩa khái niệm / lý thuyết của miền (khoảng 1–2 giờ).
5. Viết `packages/schema` (Zod) từ Codebook; test chuyển đổi sang `responseSchema`.
6. Thiết lập Zotero: collection `Research Data/Inbox`, tag quy ước, API key chỉ đọc, Better BibTeX.
7. **Dựng bộ đối chứng tự động** (Mục 6.8a): Claude Code tìm 3–5 meta-analysis thuộc miền khởi đầu có công bố dữ liệu đã mã hóa, lập danh sách 20–40 nghiên cứu gốc có trong Zotero hoặc có bản OA, chia hai nửa cố định A / B. Tạo bộ bài giả lập (Mục 6.8b).
8. Khởi tạo danh sách lý thuyết chuẩn và khái niệm chuẩn cho miền khởi đầu (Claude Code soạn từ Codebook).
* **Bàn giao:** bộ khung chạy được, `docs/codebook.md`, `packages/schema`, `benchmarks/` (danh sách bộ đối chứng + bài giả lập).

### 📍 Giai đoạn 1: Bộ máy trích xuất & Dây chuyền kiểm chứng (Local Worker)
1. Supabase **local** (`dev`) + migrations đầu tiên (`pipeline_runs`, `extraction_runs`, `review_changes`, bảng nghiệp vụ).
2. Pipeline S1–S8 với **đủ 7 lớp kiểm chứng** (Mục 6): trích xuất kép, đọc bảng hai kênh, đối chiếu máy móc, trọng tài, kiểm tra chéo, chấm điểm tin cậy, ánh xạ khái niệm "không chắc thì tách".
3. Rate limiter, backoff, `estimate`, trần ngân sách; luồng Batch bất đồng bộ.
4. Lưu phiên bản model / prompt / schema / codebook, phản hồi thô và tín hiệu của từng lớp.
* **Bàn giao:** `pnpm worker extract` chạy trên collection mẫu, sinh dữ liệu có điểm tin cậy + báo cáo chi phí. **Đơn giá thật mỗi bài đo trên 5 bài đầu** (trong trần 10 USD của D6).

### 📍 Giai đoạn 1b: Tự đo độ chính xác & Tự cải thiện
1. Chạy hệ thống trên **bộ đối chứng** và **bộ bài giả lập**; tính độ chính xác T1 / T2, độ đầy đủ, tỷ lệ mức cao / trung bình / thấp (lệnh `benchmark:run`).
2. **Vòng tự cải thiện prompt** (Mục 6.8d): sửa dựa trên nửa A, chấp nhận dựa trên nửa B; tự hoàn tác nếu không cải thiện.
3. So sánh vài cách phân vai model (Flash / Pro) và ba phương án gọi API (đồng bộ / cache / batch) → chốt đơn giá mỗi bài và đề xuất trần ngân sách hằng tháng (D6).
4. Trang `/admin/quality` và danh sách "Cần chú ý" bản đơn giản.
5. Ghi kết quả vào `docs/quality-assurance.md` (một bảng ngắn).
* **Việc của chủ dự án:** chỉ đọc bảng kết quả và đồng ý trần ngân sách. Không mã hóa, không duyệt.
* **Cách dùng kết quả:** đạt ngưỡng tham khảo ở Mục 1.4 thì yên tâm dùng. Chưa đạt thì vòng tự cải thiện tiếp tục chạy; trong lúc đó các trường mức trung bình mang ⚠ và không được tính vào con số tổng hợp.
* **Bàn giao:** bảng độ chính xác theo tầng, đơn giá mỗi bài, trần ngân sách đề xuất.

### 📍 Giai đoạn 3a: Web dùng thật trên máy (local, nhóm *Must*)
Chủ dự án là người dùng chính, nên **web chạy local với Supabase local đã đủ để dùng hằng ngày**. Cloud và Vercel chỉ cần khi chia sẻ công khai.
1. `apps/web` chạy local, đọc Supabase local; làm các hạng mục nhóm **Must** ở bảng MoSCoW (Giai đoạn 3b).
2. (Tùy chọn) Nút ✎ sửa trực tiếp cho quản trị (Mục 6.9); trường đã sửa được khóa theo khóa tự nhiên, không bị ghi đè khi trích xuất lại.
3. Chủ dự án **bắt đầu dùng thật cho nghiên cứu**: thêm bài vào Zotero Inbox, hệ thống tự xử lý; chủ dự án chỉ dùng kết quả và ghi lại góp ý giao diện.
* **Bàn giao:** web local dùng được cho Relationship Search, Split-Screen, xem PDF, xuất Excel.

### 📍 Giai đoạn 2: Đám mây & Đồng bộ hai chiều
1. Supabase `prod` (slot cloud còn lại): áp dụng migrations đã thử trên local; index, RLS (khách chỉ đọc, không đọc được trường bị ẩn; chỉ tài khoản quản trị được ghi), materialized views.
2. Bucket R2 private, CORS cho pdf.js; Unpaywall + `license_source` gán quyền truy cập PDF (Mục 7, D14).
3. Bước S8–S11: chuẩn hóa khái niệm, upload R2, publish, **ghi ngược Zotero** (tag + child note; bật quyền ghi cho API key Zotero ở bước này).
4. GitHub Actions (Mục 9.3): `pg_dump` hằng đêm lên R2; ping giữ Supabase hoạt động; kiểm tra bài bị rút hằng tháng.
5. Token R2 phân quyền: token **chỉ đọc** cho web, token **đọc/ghi** chỉ cho worker; mỗi token giới hạn trong bucket của dự án.
* **Bàn giao:** một lệnh `pnpm worker sync` đưa bài từ Zotero lên cloud và ghi kết quả ngược về Zotero.

### 📍 Giai đoạn 3b: Hoàn thiện Web MVP
Nhóm *Must* đã làm ở Giai đoạn 3a; giai đoạn này làm nhóm *Should* / *Could* và chỉnh giao diện **dựa trên trải nghiệm dùng thật** của chủ dự án (thay cho bước prototype riêng). Nhờ 2–3 đồng nghiệp / NCS dùng thử bằng tác vụ thật trước khi mở công khai.

**Ưu tiên theo MoSCoW** (làm xong nhóm *Must* là có bản dùng được):

| Mức | Hạng mục |
| :--- | :--- |
| **Must** | Relationship Search làm trang chủ; trang chi tiết Split-Screen; xem và tải PDF theo quyền; xuất Excel; đăng nhập quản trị cho chủ dự án; giới hạn tốc độ theo IP |
| **Should** | Ma trận Master-Detail + Word APA 7; đầy đủ facet của Thư viện; Báo lỗi có Turnstile; trang "Giới thiệu & cách đọc dữ liệu" |
| **Could** | Saved views (lưu trong trình duyệt); copy câu tổng hợp; hướng dẫn nhanh |
| **Không làm trong MVP** | Evidence Map, Heatmap, tìm kiếm ngữ nghĩa, tải ZIP, bộ sưu tập theo tài khoản, giao diện tiếng Anh |

1. `apps/web` dùng chung `packages/schema`; quy chuẩn hiển thị số liệu APA (8.1).
   **Truy cập (D2):** khách xem không cần đăng nhập; **chỉ chủ dự án có tài khoản** (Supabase Auth, magic link, tắt tự đăng ký) để vào `/admin`, sửa dữ liệu trực tiếp và tải PDF không OA. **Quy tắc hiển thị:** web hiển thị mọi dữ liệu kèm huy hiệu (✓ đã kiểm chứng tự động, ★ đã sửa / xác nhận, ⚠ AI chưa kiểm chứng, gồm cả trường T3). Trường **không khớp PDF** hoặc có lỗi nghiêm trọng bị **ẩn với khách**, chỉ hiện cho quản trị.
2. Thư viện lọc đa chiều (8.2).
3. **Relationship Search** (8.2b): tìm theo cặp biến, chiều và vai trò quan hệ; lọc theo kết quả giả thuyết và chiều tác động; xuất bảng; chia sẻ URL; cho nhập tự do.
4. Split-Screen Evidence Workspace (8.3), có nút ✎ **sửa trực tiếp** cho quản trị.
   **Xem và tải PDF gốc** theo quyền (Mục 7, 7.1): presigned URL từ R2, tên tệp dễ đọc, giới hạn tốc độ theo IP.
5. Ma trận Master-Detail + xuất Word APA 7 / Excel (8.4).
6. Trang "Giới thiệu & cách đọc dữ liệu" (8.9).
7. **Hướng dẫn nhanh** trên trang chủ cho khách lần đầu: 3 tác vụ mẫu (tìm quan hệ giữa hai biến, mở bằng chứng trong PDF, xuất bảng).

### 📍 Giai đoạn 4: GitHub & Triển khai Vercel
1. Kết nối Vercel với GitHub theo Mục 9.5 (Root Directory, Ignored Build Step, branch protection, biến môi trường tối thiểu).
2. GitHub Actions: `ci.yml` và `regression.yml` (Mục 9.3); bật secret scanning + push protection.
3. Đo hiệu năng thực tế (trang < 0,8 s; lọc < 200 ms p95); bật thống kê truy cập không cookie (Cloudflare Web Analytics hoặc Vercel Analytics) để theo dõi mức sử dụng: số lượt Relationship Search, số lần mở bằng chứng trong PDF, số bảng được xuất.

### 📍 Giai đoạn 5: Lớp tổng hợp tri thức
1. Rà ánh xạ khái niệm chuẩn quy mô lớn (sửa hàng loạt các ánh xạ sai trên trang quản trị).
2. Trang Khái niệm (8.5) và Trang Lý thuyết (8.6).
3. Quy trình vận hành "1 thao tác": thêm bài vào Zotero Inbox → `pnpm worker sync` → dữ liệu hiển thị trên web và trong Zotero.

### 📍 Giai đoạn 6: Phân tích nâng cao (khi kho có > 300 bài)
1. Evidence Map (8.7) và xuất dữ liệu cho `metafor` / `metaSEM`.
2. Mạng quan hệ & Heatmap khoảng trống (8.8).
3. Tìm kiếm ngữ nghĩa (pgvector) kết hợp từ khóa.
4. Tải nhiều bài dạng ZIP qua Cloudflare Worker (7.1).
5. Mở rộng sang miền nghiên cứu thứ hai; bài tiếng Việt; nhánh trích xuất cho bài định tính / khái niệm; giao diện tiếng Anh.

### Ngoài phạm vi MVP / hoãn lại
* Trích xuất sâu bài định tính, bài khái niệm, bài tổng quan; bài tiếng Việt.
* Tìm kiếm ngữ nghĩa trước khi có vài trăm bài.
* Evidence Map trước khi lớp khái niệm chuẩn ổn định và có đủ ma trận tương quan.
* OCR tự động cho PDF scan (MVP chỉ gắn cờ; chủ dự án tự kiểm tra khi cần).
* Tài khoản người dùng cho khách, bộ sưu tập theo tài khoản (8.10).

### 10.1. Lịch dự kiến (5–10 giờ/tuần, trung bình ~7,5 giờ)

Từ v3.7 chủ dự án **không mã hóa, không duyệt**. Thời gian dưới đây là thời gian của chủ dự án để **làm việc cùng Claude Code** (giao việc, xem kết quả, xác nhận, cài đặt tài khoản / khóa API) và ra quyết định. Lịch theo tuần phụ thuộc chủ yếu vào khối lượng phát triển mà Claude Code làm trong các phiên đó.

| Giai đoạn | Việc chính của chủ dự án | Giờ ước tính | Tuần |
| :--- | :--- | :--- | :--- |
| 0 | Cài Docker, tạo tài khoản / khóa API (GitHub, Supabase, Gemini, Zotero), xem bộ khung chạy được, đọc lướt codebook | ~10–14 | 1–4 |
| 1 | Làm việc cùng Claude Code dựng dây chuyền 7 lớp; xem báo cáo chi phí 5 bài đầu | ~10–14 | 5–7 |
| 1b | Đọc bảng độ chính xác; đồng ý trần ngân sách | ~3–5 | 8–9 |
| 3a | Dùng web local cho nghiên cứu thật; ghi góp ý giao diện | ~6 | 10–11 |
| 2 | Tạo bucket R2, project Supabase `prod`; kiểm tra đồng bộ cloud | ~4 | 12 |
| 3b | Góp ý hoàn thiện Web, nhờ 2–3 người dùng thử | ~6 | 13–14 |
| 4 | Kết nối Vercel, kiểm tra web công khai | ~3 | 15 |
| **Dùng được trên máy** | | | **từ tuần 10 (khoảng cuối tháng 12/2026)** |
| **Web MVP công khai** | | **~45–55 giờ** | **khoảng 3,5 tháng (cuối tháng 1/2027)** |

* Giai đoạn 5–6 lên lịch sau khi Web MVP được dùng thực tế.
* Sau khi vận hành: chủ dự án chỉ cần thêm bài vào Zotero; không có công việc duyệt định kỳ. Vòng tự cải thiện và kiểm tra bài bị rút chạy tự động.

---

## 11. QUẢN TRỊ RỦI RO & BẢO TOÀN DỮ LIỆU (RISK MANAGEMENT)

| # | Rủi ro | Biện pháp |
| :--- | :--- | :--- |
| 1 | AI trích xuất sai / bịa câu trích | Dây chuyền 7 lớp (Mục 6): trích xuất kép, đọc bảng hai kênh, máy đối chiếu PDF, trọng tài, kiểm tra chéo, chấm điểm tin cậy; trường mức thấp bị ẩn |
| 2 | So sánh không hợp lệ giữa các bài (β khác mô hình) | Không quy đổi β → r; forest plot chỉ dùng r từ ma trận tương quan; ghi `model_covariates`, `comparability_note` |
| 3 | Độ chính xác chưa đạt ngưỡng tham khảo | Vòng tự cải thiện prompt (6.8d); trường mức trung bình mang ⚠ và không được tính vào con số tổng hợp mặc định |
| 4 | Chi phí Gemini vượt dự kiến | `estimate`; trần ngân sách; đo đơn giá ở 1b; Batch API; Flash mặc định |
| 5 | Rate-limit (Gemini, Zotero) / lỗi mạng | Token bucket + backoff có jitter; tuân theo `Retry-After` / `Backoff`; trạng thái từng bước; chạy tiếp không tốn lại token |
| 6 | Đổi prompt / model làm giảm chất lượng | Chỉ chấp nhận thay đổi khi bộ đối chứng (nửa B) cải thiện và không nhóm nào giảm quá 1 điểm %; tự hoàn tác; ghi phiên bản model cụ thể (6.8d, 6.8e) |
| 7 | Bản quyền PDF trên web công khai | Khách chỉ tải được bài OA có giấy phép mở; bài không OA chỉ chủ dự án tải (D14); R2 private + presigned URL 5 phút; giới hạn tốc độ theo IP; câu trích ≤ 50 từ; trang chính sách nội dung + kênh gỡ bỏ |
| 8 | Jingle–jangle | Lớp khái niệm chuẩn theo miền; so khớp theo item thang đo; trọng tài AI; nguyên tắc "không chắc thì tách" |
| 9 | Kết luận sai từ so sánh bối cảnh | Nhãn "so sánh mô tả"; cảnh báo phương pháp trên giao diện |
| 10 | Mất dữ liệu | `pg_dump` hằng đêm lên R2; raw JSONB; Zotero là kho gốc PDF; migrations có phiên bản |
| 11 | Vượt giới hạn gói Free | Embedding chọn lọc + `halfvec`; theo dõi dung lượng; workflow keepalive; R2 dựng lại được từ Zotero |
| 11b | Supabase chỉ còn 1 slot project cloud | `dev` chạy local bằng Supabase CLI + Docker; migrations thử trên local trước khi áp dụng lên `prod`; `pg_dump` trước mỗi migration; nếu cần thêm project cloud thì nâng gói Pro hoặc tạm dừng project cũ |
| 11c | Vòng tự cải thiện "học tủ" bộ đối chứng | Chia bộ đối chứng thành hai nửa cố định: sửa theo nửa A, chấp nhận theo nửa B; bổ sung meta-analysis mới định kỳ |
| 11e | AI bỏ sót giả thuyết / Study / bảng | Kiểm tra độ đầy đủ (danh mục Pass 1 + quét text PDF) và **tự động trích bổ sung** mục thiếu (6.4) |
| 11f | AI gán số liệu đúng nhưng sai chỗ | Trích xuất kép + đọc bảng hai kênh + trọng tài + kiểm tra chéo trong bài (6.2–6.6) |
| 11g | Lỗi thống kê ngay trong bài gốc | Tính lại p / t / F theo kiểu statcheck; ghi rõ "có thể là lỗi của bài gốc" |
| 11d | Thiên lệch xuất bản làm số bài "ủng hộ" bị thổi phồng | Cảnh báo trên Relationship Search và Evidence Map; funnel plot ở Giai đoạn 6 |
| 12 | Lộ API key (Gemini, Zotero, Supabase, R2) | `.env` local, `.gitignore`; GitHub Actions Secrets; key Zotero chỉ đọc đến Giai đoạn 2; token R2 chỉ đọc cho web, đọc/ghi chỉ cho worker; service key Supabase chỉ ở worker; bật **secret scanning + push protection** của GitHub (repo public) |
| 12b | Repo public làm lộ nội dung có bản quyền | Không commit PDF, phản hồi thô, dữ liệu bộ đối chứng hay câu trích; kiểm tra `git status` trước mỗi commit; dữ liệu mẫu trong test chỉ dùng văn bản tự viết |
| 13 | Sai số trang khi trích dẫn | `pdf_page_index` + `printed_page` + `printed_page_method`; ưu tiên `annotationPageLabel` khi có |
| 14 | PDF scan không có text layer | Gắn cờ `needs_ocr`, hiển thị ⚠; OCR tự động để giai đoạn sau |
| 15 | Liêm chính khi dùng câu sinh tự động | Bản nháp; chặn với dữ liệu chưa kiểm chứng; hướng dẫn khai báo AI |
| 16 | Lỗi mà mọi lớp AI cùng mắc (cùng họ model Gemini, D15) | Lớp 3 và Lớp 5 không dùng AI nên vẫn bắt được phần lớn; bộ đối chứng đo được tỷ lệ còn sót; có thể bổ sung trọng tài khác họ model sau này nếu tỷ lệ sót cao |
| 16b | Chi phí Gemini tăng 2,5–4 lần mỗi bài do dây chuyền 7 lớp | Đo đơn giá trên 5 bài đầu; trọng tài chỉ chạy khi có bất đồng; trần ngân sách; Batch API |
| 16c | Dữ liệu mã hóa của meta-analysis đối chứng có lỗi | Khi hệ thống và meta-analysis lệch, trọng tài đọc lại PDF trước khi tính là lỗi của hệ thống |
| 17 | Phạm vi quá rộng cho một người | Miền khởi đầu hẹp; MVP chỉ bài định lượng tiếng Anh; bộ khung chạy được trước; MoSCoW cho Web MVP; nguyên tắc "đủ dùng, không thừa" (1.5) |
| 18 | Web công khai bị lạm dụng (bot, spam báo lỗi, tải hàng loạt) | Giới hạn tốc độ theo IP; Turnstile cho form báo lỗi; khách không có quyền ghi (RLS); ẩn trường không khớp PDF với khách |
| 19 | Khách hiểu nhầm số liệu "trong kho" là kết luận của cả lĩnh vực | Ghi rõ "trong kho" ở mọi con số; dòng "ⓘ Cách đọc kết quả này"; trang "Giới thiệu & cách đọc dữ liệu" |
| 21 | Khách thấy dữ liệu AI chưa kiểm chứng (⚠) và hiểu là chắc chắn | Huy hiệu ⚠ rõ ràng; ẩn trường không khớp PDF; công tắc "Chỉ dữ liệu đã kiểm chứng"; trang "Giới thiệu & cách đọc dữ liệu"; nút Báo lỗi |
| 22 | Trích xuất lại ghi đè chỗ đã sửa tay | Trường đã sửa được khóa (`human_reviewed`); lịch sử `review_changes`; test end-to-end kiểm tra điều này |
| 20 | Hợp đồng thuê bao hạn chế tải PDF lên AI | Ưu tiên bản OA; trường `license_source`; hỏi thư viện trường về điều khoản AI / TDM khi tiện |

---

## 12. TÀI LIỆU THAM KHẢO PHƯƠNG PHÁP LUẬN (dùng cho Codebook)

* Alvesson, M., & Sandberg, J. (2011). Generating research questions through problematization. *Academy of Management Review, 36*(2), 247–271.
* Corley, K. G., & Gioia, D. A. (2011). Building theory about theory building: What constitutes a theoretical contribution? *Academy of Management Review, 36*(1), 12–32.
* Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. *Journal of the Academy of Marketing Science, 43*(1), 115–135.
* Larsen, K. R., & Bong, C. H. (2016). A tool for addressing construct identity in literature reviews and meta-analyses. *MIS Quarterly, 40*(3), 529–551.
* Müller-Bloch, C., & Kranz, J. (2015). A framework for rigorously identifying research gaps in qualitative literature reviews. *Proceedings of the 36th International Conference on Information Systems (ICIS)*.
* Nuijten, M. B., Hartgerink, C. H. J., van Assen, M. A. L. M., Epskamp, S., & Wicherts, J. M. (2016). The prevalence of statistical reporting errors in psychology (1985–2013). *Behavior Research Methods, 48*(4), 1205–1226.
* Peterson, R. A., & Brown, S. P. (2005). On the use of beta coefficients in meta-analysis. *Journal of Applied Psychology, 90*(1), 175–181.
* Podsakoff, P. M., MacKenzie, S. B., Lee, J.-Y., & Podsakoff, N. P. (2003). Common method biases in behavioral research. *Journal of Applied Psychology, 88*(5), 879–903.
* Podsakoff, P. M., MacKenzie, S. B., & Podsakoff, N. P. (2012). Sources of method bias in social science research and recommendations on how to control it. *Annual Review of Psychology, 63*, 539–569.
* Roth, P. L., Le, H., Oh, I.-S., Van Iddekinge, C. H., & Bobko, P. (2018). Using beta coefficients to impute missing correlations in meta-analysis research: Reasons for caution. *Journal of Applied Psychology, 103*(6), 644–658.
* Zhao, X., Lynch, J. G., & Chen, Q. (2010). Reconsidering Baron and Kenny: Myths and truths about mediation analysis. *Journal of Consumer Research, 37*(2), 197–206.

*(Thông tin trích dẫn được ghi theo trí nhớ; cần kiểm chứng bằng DOI trước khi đưa vào Codebook chính thức.)*

---

## 13. CÁC QUYẾT ĐỊNH CẦN CHỐT TRƯỚC KHI TRIỂN KHAI

Chưa bắt đầu các bước kỹ thuật (Giai đoạn 0 trở đi, tạo repository GitHub…) cho đến khi các quyết định dưới đây được chốt.

| # | Quyết định | Ảnh hưởng đến | Đề xuất | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| D1 | Miền nghiên cứu khởi đầu | Codebook, khái niệm chuẩn, bộ đối chứng (1.3, 5.3, 6.8) | Social media marketing, branding, ethics, hành vi khách hàng | ✅ Đã chốt |
| D2 | Đối tượng truy cập Web | Auth, RLS, bản quyền, Vercel (7, 8.10) | **Công khai**: ai có URL đều xem được, không cần đăng nhập; chỉ chủ dự án có tài khoản quản trị. Mục đích: công cụ cá nhân, chia sẻ công khai | ✅ Đã chốt (sửa ở v3.5) |
| D3 | Người mã hóa thứ hai | — | Không cần | ⛔ Không áp dụng (v3.5) |
| D4 | Thư viện Zotero dùng cho dự án | Cấu hình API, chia sẻ PDF (3) | **Thư viện cá nhân**, bài dự án trong collection `Research Data`; worker chỉ đọc/ghi trong collection này (xem 3.3) | ✅ Đã chốt |
| D5 | Repository GitHub: tên, private / public | Giai đoạn 4 | `research-data`, **public**; chỉ chứa mã nguồn, không có dữ liệu có bản quyền (rủi ro 12, 12b) | ✅ Đã chốt |
| D6 | Ngân sách Gemini | `GEMINI_BUDGET_LIMIT` (4.3) | **10 USD cho pilot**, dùng trước hết để đo đơn giá thật trên 5 bài đầu (dây chuyền 7 lớp tốn hơn trích xuất một lần); trần hằng tháng chốt sau Giai đoạn 1b | ✅ Đã chốt (pilot) |
| D7 | Thời gian dành cho dự án mỗi tuần | Mốc thời gian của lộ trình (10) | 5–10 giờ/tuần; xem lịch dự kiến ở Mục 10.1 | ✅ Đã chốt |
| D9 | Cách đo độ chính xác | Mục 6.8, 10.1 | **Tự động** bằng bộ đối chứng từ meta-analysis đã công bố + bài giả lập; **không có bộ bài chuẩn do người mã hóa** | ✅ Đã chốt (sửa ở v3.7) |
| D8 | Tên dự án / tên miền web | Giao diện, Vercel, R2 custom domain | Tên tạm "Research Data" + địa chỉ `*.vercel.app`; đặt tên chính thức và mua tên miền trước khi mở công khai | ✅ Đã chốt (tạm) |
| D10 | Giấy phép mã nguồn (repo public) | File `LICENSE` | **MIT** | ✅ Đã chốt |
| D11 | Nơi chạy Web: Vercel hay Cloudflare Workers | Giai đoạn 3–4, Mục 3A | **Vercel** cho Web; **Cloudflare** cho R2, Turnstile, thống kê truy cập, tên miền; Workers chỉ cho tải ZIP sau này | ✅ Đã chốt |
| D12 | Gói Cloudflare đang dùng | Giới hạn Workers / R2 / Access | **Free**; nâng cấp khi chạm một trong các ngưỡng: R2 > 10 GB hoặc vượt hạn mức thao tác miễn phí; Workers > 100.000 request/ngày hoặc vượt giới hạn CPU khi ghép ZIP (Workers Paid); Access > 50 người dùng | ✅ Đã chốt |
| D13 | Cài Docker Desktop (WSL2) để chạy Supabase local làm môi trường `dev` | Giai đoạn 0–1, Mục 2 | **Cài Docker Desktop** (máy 16 GB RAM, đã có WSL2); chỉ bật khi phát triển. Cài ở bước đầu Giai đoạn 0 | ✅ Đã chốt |
| D14 | Chính sách tải PDF trên web công khai | Mục 7, 7.1 | Khách: chỉ tải bài OA có giấy phép mở; bài Bronze / không rõ giấy phép: chỉ link OA gốc + DOI; bài không OA: chỉ link DOI. Chủ dự án: tải mọi bài | ✅ Đã chốt |
| D15 | Model làm trọng tài (Lớp 4) | Mục 6.5, 4.1 | **Gemini** (`GEMINI_MODEL_STRONG`); không thêm họ model khác | ✅ Đã chốt |
