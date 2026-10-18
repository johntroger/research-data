# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT PLAN - VERSION 3.5)
## HỆ THỐNG CƠ SỞ DỮ LIỆU & TỔNG QUAN TÀI LIỆU KHOA HỌC CHUẨN MỰC Q1
*(Academic Literature Matrix & Research Knowledge Base for Behavioral Science, Management & Marketing)*

---

## 0. LỊCH SỬ THAY ĐỔI

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
* Có **độ chính xác trích xuất được đo lường** trên một bộ bài chuẩn do chủ dự án tự mã hóa, đủ để chủ dự án **yên tâm dùng dữ liệu cho nghiên cứu của mình** và luôn kiểm tra lại được nhanh với bản gốc.
* Mở rộng bền vững từ **1 bài đến hơn 5.000 bài báo**.

### 1.2. Người dùng mục tiêu & Công việc cốt lõi (Jobs-to-be-done)

**Mục đích dự án:** đây là **công cụ phục vụ nghiên cứu của chính chủ dự án**, không nhằm viết bài báo về phương pháp. Web được để **công khai**: ai có URL đều xem được (D2).

| Người dùng | Quyền | Công việc cần làm |
| :--- | :--- | :--- |
| **Chủ dự án** (người dùng chính, tài khoản quản trị duy nhất) | Toàn quyền: nạp bài, duyệt dữ liệu (Review Queue), tải mọi PDF | Xây mô hình nghiên cứu, chọn thang đo, tìm khoảng trống, viết tổng quan cho các nghiên cứu của mình |
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
  * *Lưu ý:* miền này rộng hơn đề xuất ban đầu, nên bảng khái niệm chuẩn sẽ lớn hơn. Thứ tự nạp theo nhóm giúp kiểm soát khối lượng duyệt ánh xạ.
* **Loại bài trong MVP:** chỉ bài **định lượng** (survey, thực nghiệm, dữ liệu thứ cấp). Bài định tính, bài khái niệm, bài tổng quan được nạp metadata nhưng chưa trích xuất sâu.
* **Ngôn ngữ của bài báo:** MVP chỉ xử lý **bài tiếng Anh**. Bài tiếng Việt cần codebook và kiểm chứng riêng, để giai đoạn sau.
* **Ngôn ngữ giao diện MVP:** tiếng Việt (nội dung học thuật giữ tiếng Anh); code sẵn sàng i18n để thêm tiếng Anh sau.
* **Tập bài = thư viện Zotero của chủ dự án.** Không xây tập bài theo giao thức tìm kiếm hệ thống. Vì vậy mọi con số tổng hợp trên web được ghi rõ là **"trong kho"** (VD: "25/31 kiểm định trong kho ủng hộ"), không phải kết luận về toàn bộ tài liệu của lĩnh vực.

### 1.4. Phân tầng trường dữ liệu & Mục tiêu chất lượng (KPIs)

Các ngưỡng dưới đây là **ngưỡng tham khảo cá nhân**: đạt thì yên tâm dùng; chưa đạt thì biết phần nào cần duyệt kỹ hơn trong Review Queue. Không phải cổng bắt buộc dừng dự án.

| Tầng | Ví dụ trường | Chỉ số (đo trên bộ bài chuẩn, Mục 6.2) | Ngưỡng tham khảo | Xử lý |
| :--- | :--- | :--- | :--- | :--- |
| **T1 – Sự kiện** (factual) | n, β, p, CI, r, M, SD, α, CR, AVE, quốc gia, số Study, mã giả thuyết | % khớp chính xác | **≥ 95%** | Chưa đạt: duyệt tay toàn bộ trường T1 cho đến khi chỉnh prompt đạt |
| **T2 – Phân loại** (categorical) | thiết kế nghiên cứu, phương pháp phân tích, loại mẫu, trạng thái giả thuyết, loại hiệu ứng | % khớp (κ nếu muốn) | **≥ 85% khớp** | Chưa đạt: duyệt tay các trường T2 bị lệch nhiều nhất |
| **T3 – Diễn giải** (interpretive) | vai trò lý thuyết, loại đóng góp, loại khoảng trống, ánh xạ khái niệm chuẩn | Không đo | — | **Chủ dự án duyệt** trước khi hiển thị trên web |

Các chỉ số khác:
* **Độ đầy đủ (recall):** ≥ 95% giả thuyết, Study và bảng kết quả trong bộ bài chuẩn được trích xuất.
* **Kiểm chứng tự động:** ≥ 95% câu văn (T1/T2 có câu trích) và ≥ 95% số liệu T1 được kiểm chứng theo phương pháp ở Mục 6.3.
* **Truy vết:** 100% trường có `evidence` hoặc được gắn trạng thái `unverified` và hiển thị rõ.
* **Hiệu năng Web:** trang tải < 0,8 giây; truy vấn lọc đa tiêu chí < 200 ms (p95) ở quy mô 5.000 bài.
* **Chi phí:**
  * Hạ tầng cố định: **0 VNĐ/tháng** (Vercel Hobby, R2 Free 10GB, Supabase Free); Zotero là gói trả phí sẵn có của chủ dự án.
  * Gemini: chi phí biến đổi; **đơn giá thực tế mỗi bài được đo ở Giai đoạn 1b**; ước tính trước mỗi lượt chạy và có trần ngân sách.

### 1.5. Nguyên tắc Thiết kế
1. **Evidence-first:** không có trường dữ liệu nào hiển thị mà không kèm nguồn gốc và trạng thái kiểm chứng.
2. **Human-in-the-loop:** AI trích xuất, máy kiểm chứng, chủ dự án duyệt trường T3 và trường bị gắn cờ.
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
  ├─ S4  llm_extract    : Gemini API (trả phí)
  │        ├─ Pass 1: cấu trúc (loại bài, danh sách Study, khái niệm, lý thuyết, vị trí các bảng)
  │        └─ Pass 2: chi tiết từng Study (đo lường, đường quan hệ, ma trận tương quan)
  │        (đồng bộ cho lượt nhỏ; Batch API bất đồng bộ submit → poll → ingest cho lượt lớn)
  ├─ S5  validate       : Zod schema + quy tắc logic + kiểm tra nội tại ma trận tương quan
  │                       + kiểm tra độ đầy đủ (danh mục Pass 1 + quét text) + tính lại thống kê (kiểu statcheck)
  ├─ S6  verify         : kiểm chứng theo loại trường (câu văn / số liệu / bảng)
  │                       + đối chiếu hai model cho các trường quan trọng (Mục 6.3b)
  ├─ S7  review         : đẩy trường T3 và trường bị gắn cờ vào Review Queue
  ├─ S8  normalize      : ánh xạ tên khái niệm → Canonical Construct (gợi ý embedding, người xác nhận)
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
  ├─ Review Queue (nội bộ)            ├─ Thư viện lọc đa chiều + Relationship Search (A ↔ B)
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
| **Mã hóa Bộ chuẩn vàng** | Highlight trong Zotero Reader theo quy ước màu + mã trường trong comment; worker đọc annotation qua API | Mã hóa ngay khi đọc; annotation có sẵn **số trang in** (`annotationPageLabel`) và vị trí trang (`annotationPosition`) |
| **Bằng chứng do người xác nhận** | Highlight của người dùng khớp với trường AI trích → nâng trạng thái lên `human_reviewed` | Tăng tỷ lệ dữ liệu đã duyệt mà không tốn thêm công |
| **Ghi ngược kết quả** | Worker gắn tag trạng thái (`rd:extracted`, `rd:needs-review`, `rd:verified`) và child note tóm tắt (lý thuyết, mô hình, kết quả chính, link web) | Người dùng thấy kết quả ngay trong Zotero khi viết bài |
| **Chia sẻ** | Không chia sẻ qua Zotero (D4: thư viện cá nhân). Mọi người xem dữ liệu qua **web công khai**; PDF theo chính sách ở Mục 7 | Thư viện cá nhân giữ riêng tư |
| **Khóa trích dẫn ổn định** | Plugin **Better BibTeX**: citekey cố định; nút "Copy citekey" và xuất `.bib` trên web dùng cùng citekey | Nhất quán với LaTeX / Overleaf / Pandoc |
| **Tìm PDF Open Access** | Tính năng "Find Available PDF" của Zotero (dựa trên Unpaywall) | Bổ sung bản OA hợp pháp cho bài còn thiếu tệp |

### 3.2. Quy ước mã hóa bằng annotation (dùng cho Bộ chuẩn vàng)

| Màu highlight | Phân hệ | Cú pháp comment (ví dụ) |
| :--- | :--- | :--- |
| Vàng | Định nghĩa khái niệm | `#def perceived_risk` |
| Tím | Lý thuyết nền | `#theory TPB role=hypothesis_derivation` |
| Xanh dương | Thiết kế, mẫu, bối cảnh | `#sample S1 n=412 type=consumer_panel` |
| Xanh lá | Giả thuyết & kết quả | `#path S1 H2 PR->PI beta=-.31 p<.001` |
| Cam | Ma trận tương quan / bảng thống kê | `#cormatrix S1 table=2` |
| Đỏ | Hạn chế & hướng nghiên cứu tương lai | `#limit` / `#future` |

Quy ước chi tiết được viết trong Codebook; worker có lệnh `gold:import` chuyển annotation thành tệp JSON chuẩn vàng.

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
| **Cloudflare Tunnel** (`cloudflared`) | *Không cần trong MVP* (không còn người mã hóa thứ hai). Dự phòng: mở tạm Review Queue chạy local ra Internet khi cần | — |
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
* **Model Flash mới nhất** (`GEMINI_MODEL_FAST`): mặc định cho Pass 1 và Pass 2.
* **Model Pro mới nhất** (`GEMINI_MODEL_STRONG`): khi bài có ≥ 3 Study; khi kết quả Flash không qua validate hoặc tỷ lệ kiểm chứng < 80%; khi so sánh model trên Bộ chuẩn vàng.
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
| **13. Kiểm soát chất lượng** | `extraction_run_id`, `model_name`, `prompt_version`, `schema_version`, `codebook_version`, `extracted_at`, `completeness_status` (complete / incomplete) + `missing_items[]`, `cross_model_agreement` (agree / disagree / not_run) + `alt_value`, `stat_consistency` (consistent / inconsistent / decision_error / not_checked) + `recomputed_value` + `error_source` (extraction / original_paper), `confidence`, `review_status` (ai_extracted / auto_verified / human_reviewed / disputed), `reviewer`, `review_notes`, `user_reports[]`; bảng **`review_changes`** lưu mỗi lần duyệt / sửa: trường, **giá trị trước**, **giá trị sau**, người sửa, thời điểm, lý do, chế độ (mù / thường) | Tái lập được; minh bạch mức tin cậy; tính được κ và truy vết mọi chỉnh sửa |

### 5.3. Lớp Khái niệm chuẩn (Canonical Construct Ontology)
* Bảng `constructs`: `canonical_name`, `canonical_definition`, `domain`, `parent_construct_id`.
* Bảng `construct_aliases`: tên gốc ánh xạ về khái niệm chuẩn, kèm `mapping_method` (exact / embedding / item_similarity / human) và `mapping_confidence`.
* Quy trình: gợi ý bằng embedding tên + định nghĩa + **độ tương đồng item thang đo** (Larsen & Bong, 2016) → **người xác nhận** trong Review Queue. Không tự động gộp.
* Xây dựng trước cho **miền khởi đầu** (Mục 1.3), mở rộng dần theo miền.
* Cảnh báo jingle–jangle: cùng tên nhưng định nghĩa / item khác xa; khác tên nhưng item trùng lặp.

### 5.4. Chỉ mục & Hiệu năng (Supabase PostgreSQL)
* GIN `tsvector` cho tìm kiếm toàn văn; B-tree cho các cột lọc.
* `pgvector` HNSW với **`halfvec(768)`**, chỉ embed abstract, định nghĩa khái niệm và câu kết quả (~20 đoạn/bài), ước tính ≈ 150MB cho 5.000 bài.
* Materialized view đếm số bài theo facet, làm mới sau mỗi lượt `publish`.
* **Materialized view `relation_index`** phục vụ Relationship Search (8.2b): mỗi dòng là một kiểm định với `iv_canonical_id`, `dv_canonical_id`, `iv_alias_id`, `dv_alias_id`, `mapping_reviewed`, `role` (direct / mediated / moderated), `mediator_ids[]`, `moderator_ids[]`, `paper_id`, `study_id`, `status`, `observed_sign`, `significant`, `estimate_type`, `review_status`. Index B-tree tổng hợp trên `(iv_canonical_id, dv_canonical_id)` và `(dv_canonical_id, iv_canonical_id)` để truy vấn hai chiều; mục tiêu < 200 ms (p95).
* **Migrations SQL** (thư mục `supabase/migrations`) đi kèm mỗi lần đổi `schema_version`.

---

## 6. KIỂM SOÁT CHẤT LƯỢNG & ĐỘ TIN CẬY

### 6.1. Sổ mã hóa (Codebook)
* Định nghĩa vận hành từng trường, **tầng T1/T2/T3**, danh mục giá trị cho phép, quy tắc xử lý tình huống mơ hồ, ví dụ đúng/sai, quy ước annotation Zotero (Mục 3.2).
* Là đầu vào trực tiếp cho prompt Gemini và tài liệu tham chiếu cho người mã hóa; có `codebook_version` và nhật ký thay đổi.
* Thử nghiệm codebook trên 3 bài trước khi mã hóa Bộ chuẩn vàng.

### 6.2. Bộ bài chuẩn (Gold Standard Set, rút gọn cho công cụ cá nhân)
* **10 bài** trong miền khởi đầu, do **chủ dự án tự mã hóa** (không có người mã hóa thứ hai). Chọn đa dạng: có survey (PLS-SEM, CB-SEM), có thực nghiệm (kể cả nhiều Study), đủ 3 nhóm (social media, thương hiệu, đạo đức).
* Công sức dự kiến: khoảng 3–5 giờ/bài, tức khoảng **30–50 giờ** tổng cộng.
* Mã hóa bằng annotation trong Zotero Reader (quy ước ở Mục 3.2); `gold:import` chuyển thành JSON.
* **Chia hai nhóm để không tự đánh lừa mình:**

| Nhóm | Số bài | Dùng để |
| :--- | :--- | :--- |
| **Dev** | 5 | Tinh chỉnh prompt và codebook thoải mái |
| **Kiểm tra** | 5 | Đo độ chính xác thật sau khi đã tinh chỉnh xong; không dùng để sửa prompt |

  Nếu sau khi đo trên nhóm Kiểm tra lại phải sửa prompt, hãy thêm vài bài mới vào nhóm Kiểm tra cho lần đo sau, vì 5 bài cũ đã "lộ đề".
* **Một nguyên tắc duy nhất về thứ tự:** tự mã hóa bài trước, rồi mới xem kết quả AI của bài đó, để không bị kết quả AI kéo theo.
* Dùng để: đo độ chính xác theo tầng (Mục 1.4); chọn model (Flash hay Pro); **kiểm thử hồi quy** mỗi khi đổi prompt / schema / codebook / model.
* *(Tùy chọn sau này)* Mở rộng thêm bài chuẩn khi thêm nhóm nghiên cứu mới hoặc khi đổi model.

### 6.3. Kiểm chứng theo loại trường

| Loại dữ liệu | Phương pháp kiểm chứng tự động |
| :--- | :--- |
| Câu văn (định nghĩa, giả thuyết, hạn chế) | Fuzzy match với text của trang được ghi (cho phép lệch ±1 trang), ngưỡng ≥ 0,90 |
| Số liệu (β, p, n, α…) | Tìm đúng chuỗi số trên trang được ghi, chấp nhận các dạng `.35` / `0.35` / `0,35` / `< .001` |
| Bảng (ma trận tương quan, bảng kết quả) | Gemini trả về `table_id` + hàng/cột; kiểm tra số có xuất hiện trên trang; kiểm tra tính nhất quán nội tại (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE nếu có, n khớp với phần mẫu) |
| Bảng điều kiện thực nghiệm (`condition_cells`) | Số có xuất hiện trên trang; tổng n các ô ≤ n của Study; SD > 0; M nằm trong khoảng thang đo; F / t tính lại từ M, SD, n gần đúng với giá trị báo cáo |
| PDF scan không có text layer | Phát hiện tự động, gắn cờ `needs_ocr`, không kiểm chứng tự động; đưa vào Review Queue |
| Kiểm tra logic chung | p ∈ [0,1]; n > 0; CI chứa estimate; `status` nhất quán với p và chiều tác động; tổng n các nhóm ≤ n mẫu |

**Xác định `printed_page`** (lưu kèm `printed_page_method`): (1) PDF `/PageLabels`; (2) trang đầu theo Crossref cộng độ lệch; (3) Gemini đọc số trang ở header/footer; (4) annotation Zotero (`annotationPageLabel`) khi có.

### 6.3b. Ba cơ chế kiểm chứng bổ sung (MỚI)

Các lớp ở Mục 6.3 chủ yếu bắt lỗi **"trích sai"**. Ba cơ chế dưới đây bắt ba loại lỗi còn lại.

**1. Kiểm tra độ đầy đủ: chống bỏ sót.**
Lỗi bỏ sót không bị lớp nào ở Mục 6.3 phát hiện, vì mọi thứ AI trả về đều đúng, chỉ là thiếu.
* **Pass 1 lập "danh mục cần có"** cho mỗi bài: số Study; danh sách mã giả thuyết (H1, H2a…); danh sách bảng kết quả, bảng tương quan và bảng điều kiện thực nghiệm; danh sách khái niệm trong mô hình.
* **Đối chiếu độc lập với text của PDF:** worker tự quét text tìm mọi mã giả thuyết (regex `H\d+[a-z]?`) và mọi tiêu đề bảng (`Table \d+`). Hợp nhất với danh mục của Pass 1 để ra danh mục cuối cùng.
* **Pass 2 phải trả về đủ từng mục** trong danh mục. Mục còn thiếu được gắn `completeness_status = incomplete` cùng danh sách mục thiếu, và đưa vào Review Queue.
* Bài có danh mục giữa Pass 1 và bản quét text lệch nhau cũng bị gắn cờ, vì có thể chính Pass 1 đã bỏ sót.

**2. Đối chiếu giữa hai model: chống gán nhầm chỗ.**
Bắt loại lỗi "con số có thật trong bài nhưng gán sai giả thuyết / sai Study / sai ô", vốn qua được lớp đối chiếu PDF.
* **Phạm vi:** chỉ các trường quan trọng nhất: đường quan hệ (estimate, p, status), ma trận tương quan, ô điều kiện thực nghiệm.
* **Cách làm:** chạy độc lập bằng `GEMINI_MODEL_FAST` và `GEMINI_MODEL_STRONG` với cùng schema, không cho model này thấy kết quả của model kia; so từng trường.
* **Kết quả:** khớp → `cross_model_agreement = agree`, độ tin cậy tăng; lệch → `disagree`, đưa vào Review Queue kèm cả hai giá trị (riêng chế độ mù khi mã hóa chuẩn vàng vẫn ẩn cả hai).
* **Chi phí:** phần này tăng khoảng 1,5–2 lần. **Đo ở Giai đoạn 1b** trên tập Dev: nếu tỷ lệ lỗi gán nhầm bắt được thêm không đáng kể so với chi phí, chỉ bật cho bài nhiều Study hoặc bài có kiểm tra độ đầy đủ bị gắn cờ.

**3. Tính lại thống kê: phát hiện lỗi của AI và lỗi của bài gốc.**
Theo hướng của công cụ statcheck (Nuijten et al., 2016):
* Từ t / F / z / χ² và df, **tính lại p** rồi so với p tác giả báo cáo (có tính làm tròn).
* Từ β và SE, tính lại t; từ CI, tính lại SE; từ M, SD, n của các ô điều kiện, tính lại t / F.
* Lệch nhỏ do làm tròn: bỏ qua. Lệch lớn, nhất là khi kết luận ý nghĩa thống kê bị đảo (p báo cáo < .05 nhưng p tính lại ≥ .05): gắn `stat_consistency = inconsistent` hoặc `decision_error`.
* **Phân biệt nguồn lỗi:** nếu giá trị AI trích khớp với PDF (lớp 4) mà vẫn lệch khi tính lại, ghi rõ là **"có thể là lỗi của bài gốc"** và hiển thị cảnh báo cho người dùng; ngược lại thì đưa vào Review Queue như lỗi trích xuất.
* Tỷ lệ bài có lỗi thống kê trong kho là một chỉ số có giá trị học thuật riêng, được hiển thị trên trang `/admin/quality`.

### 6.4. Theo dõi chất lượng liên tục
* Sau mỗi lượt nạp, worker in **báo cáo ngắn**: số bài, tỷ lệ trường được kiểm chứng tự động, số bài thiếu mục (độ đầy đủ), số lỗi thống kê phát hiện, số trường cần duyệt.
* Trang quản trị `/admin/quality` (chỉ chủ dự án) hiển thị các chỉ số này theo thời gian, cùng kết quả mới nhất trên bộ bài chuẩn.
* **Khi đổi model Gemini** (Google ngừng hỗ trợ phiên bản cũ): chạy lại bộ bài chuẩn; nếu T1 giảm quá 2 điểm phần trăm thì chỉnh prompt trước khi dùng model mới cho dữ liệu chính thức. Mỗi lượt chạy ghi phiên bản model cụ thể, không dùng alias kiểu "latest".

### 6.5. Review Queue (giao diện duyệt dữ liệu)
* Danh sách trường cần duyệt: tất cả trường T3, trường không qua kiểm chứng, trường thiếu (độ đầy đủ), trường lệch giữa hai model, trường bị báo lỗi, mẫu ngẫu nhiên 10% trường đã kiểm chứng.
* Bố cục chia đôi: PDF bên trái (nhảy đến trang và tô sáng), giá trị AI trích bên phải.
* Phím tắt: `A` chấp nhận, `E` sửa, `R` từ chối, `N` sang mục tiếp theo; mọi thay đổi lưu giá trị trước / sau vào `review_changes`.
* Duyệt ánh xạ khái niệm chuẩn và các báo lỗi từ khách trong cùng giao diện.
* **Vị trí:** route `/review` trong `apps/web`, **chỉ tài khoản quản trị** (chủ dự án) đăng nhập mới vào được. Trước khi deploy thì chạy local; sau khi deploy thì dùng trực tiếp trên web.
* Thành phần giao diện được dùng lại cho Split-Screen của web.

### 6.6. Trạng thái tin cậy hiển thị cho người dùng
| Trạng thái | Ý nghĩa | Biểu tượng |
| :--- | :--- | :--- |
| `ai_extracted` | AI trích xuất, chưa kiểm chứng | ⚠ |
| `auto_verified` | Khớp với PDF và qua kiểm tra logic | ✓ |
| `human_reviewed` | Chủ dự án đã duyệt (Review Queue hoặc annotation Zotero) | ★ |
| `disputed` | Có báo lỗi, đang xem xét | ⚑ |

### 6.7. Liêm chính học thuật
* Câu học thuật sinh tự động chỉ là **bản nháp**, kèm nhắc "đối chiếu với bản gốc trước khi sử dụng".
* Không sinh câu từ dữ liệu `ai_extracted` hoặc `disputed`.
* Câu trích công khai giới hạn ≤ 50 từ.
* Khi dùng dữ liệu của hệ thống cho bài viết: luôn trích dẫn bài gốc (không trích dẫn hệ thống), kiểm tra lại với PDF, và khai báo việc dùng công cụ AI nếu tạp chí yêu cầu.

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
1. Prototype bấm thử được (Figma hoặc HTML tĩnh) cho ba màn hình: Thư viện, Split-Screen, Ma trận.
2. Tự dùng thử và nhờ **2–3 đồng nghiệp / NCS** dùng thử bằng tác vụ thật, ví dụ: "tìm định nghĩa và thang đo của *Perceived Risk*", "lập bảng tổng quan cho 10 bài", "kiểm tra kết quả H2 của một bài trong PDF".
3. Ghi lại thời gian hoàn thành, lỗi, nhận xét; chỉnh thiết kế trước khi vào Giai đoạn 3.

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
  [x] Bao gồm tên gọi tương đương    [ ] Chỉ ánh xạ đã được duyệt    [ ] Bao gồm các thành phần
```
* **Ô Biến A / Biến B:** gợi ý tự động theo **khái niệm chuẩn**, đồng thời **cho nhập tự do** (tìm theo tên gốc trong bài) khi danh sách khái niệm chuẩn chưa có tên cần tìm; các truy vấn tự do không có kết quả được ghi lại để chủ dự án bổ sung vào danh sách khái niệm chuẩn; mỗi gợi ý hiển thị số bài và các tên gọi khác (VD: *Perceived Risk*, cũng gọi là *Risk Perception*, *Consumer Perceived Risk*).
* **Chiều quan hệ:** `A → B` (A là biến độc lập, B là biến phụ thuộc), `B → A`, hoặc `⇄` (cả hai chiều). Mặc định là `A → B`.
* **Vai trò quan hệ:**
  * *Trực tiếp:* A → B là một đường quan hệ trực tiếp.
  * *Qua trung gian:* hiệu ứng gián tiếp A → M → B (mọi biến trung gian M), kèm tên M.
  * *Có điều tiết:* quan hệ A → B có biến điều tiết W, kèm tên W.
* **Tên gọi tương đương:** bật thì gộp mọi tên gốc được ánh xạ về cùng khái niệm chuẩn; tùy chọn "chỉ ánh xạ đã được duyệt" để loại các ánh xạ còn ở trạng thái gợi ý (T3 chưa duyệt).
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
│  ├─ worker/          ← CLI: sync, estimate, extract, verify, review, publish, write-back, gold:import
│  └─ web/             ← Next.js (gồm Review Queue nội bộ)
├─ supabase/
│  └─ migrations/      ← migrations SQL theo schema_version
├─ gold_standard/      ← chỉ script tính κ / α; dữ liệu chuẩn vàng (chứa câu trích từ bài có bản quyền) KHÔNG commit vì repo public, lưu trong Supabase / Zotero
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
| `regression.yml` | Khi `packages/schema` hoặc prompt thay đổi | Chạy kiểm thử hồi quy trên tập Dev của Bộ chuẩn vàng. Không dùng nhóm Kiểm tra để sửa prompt (Mục 6.2) |

Các khóa bí mật (Supabase, R2, Gemini) lưu trong **GitHub Actions Secrets**, không bao giờ in ra log.

### 9.4. Chiến lược kiểm thử (MỚI)

| Loại | Phạm vi | Công cụ |
| :--- | :--- | :--- |
| Unit test | Bộ kiểm chứng (fuzzy match câu văn, khớp số `.35` / `0.35` / `0,35`, kiểm tra ma trận tương quan, kiểm tra `condition_cells`); xác định `printed_page`; quy tắc logic | Vitest |
| Schema test | Mọi schema Zod chuyển được sang `responseSchema` hợp lệ của Gemini; ví dụ JSON mẫu qua được validate | Vitest |
| Database test | Migrations chạy được từ đầu trên Supabase local; RLS: khách chỉ đọc được dữ liệu đã kiểm chứng / đã duyệt, không ghi được; chỉ tài khoản quản trị ghi được; truy vấn `relation_index` trả đúng kết quả cho dữ liệu mẫu | Supabase CLI + Vitest |
| End-to-end | Khách: Relationship Search → mở Split-Screen → tải PDF OA (bài không OA chỉ hiện link DOI). Quản trị: đăng nhập → Review Queue | Playwright |
| Hồi quy chất lượng trích xuất | Tập Dev của Bộ chuẩn vàng | Script `gold:eval` |

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
1. **Bộ khung chạy được (làm đầu tiên, khoảng 2 tuần):** một lát cắt mỏng từ đầu đến cuối trên máy local: 1 bài OA → Gemini trích 3–4 trường → kiểm chứng câu trích → ghi vào Supabase local → một trang web đơn giản hiển thị kèm PDF. Mục đích: chứng minh các mắt xích nối được với nhau trước khi làm sâu từng phần. Chạy song song với việc chủ dự án viết codebook.
2. Dựng monorepo; cài Docker Desktop + Supabase CLI (D13); khởi tạo repo GitHub `research-data` (public, MIT).
3. **Tách tài liệu kế hoạch:** `PROJECT_PLAN.md` chỉ giữ tổng quan, quyết định và lộ trình; chi tiết chuyển sang `docs/architecture.md`, `docs/data-schema.md`, `docs/quality-assurance.md`, `docs/ux-spec.md`, `docs/integrations.md`; lịch sử thay đổi chuyển sang `CHANGELOG.md`. Nội dung giữ nguyên.
4. Viết Codebook v1.0 (gán tầng T1/T2/T3 cho mọi trường, quy ước annotation Zotero); thử trên 2 bài.
5. Viết `packages/schema` (Zod) từ Codebook; test chuyển đổi sang `responseSchema`.
6. Thiết lập Zotero: collection `Research Data/Inbox`, tag quy ước, API key chỉ đọc, Better BibTeX.
7. Chọn 10 bài chuẩn (5 Dev, 5 Kiểm tra, Mục 6.2); mã hóa 5 bài Dev bằng annotation; `gold:import`.
8. Khởi tạo danh sách lý thuyết chuẩn và khái niệm chuẩn cho miền khởi đầu.
* **Bàn giao:** bộ khung chạy được, `docs/codebook.md`, `packages/schema`, 5 bài Dev đã mã hóa.

### 📍 Giai đoạn 1: Bộ máy trích xuất (Local Worker)
1. Supabase **local** (`dev`) + migrations đầu tiên (`pipeline_runs`, `extraction_runs`, `review_changes`, bảng nghiệp vụ).
2. Pipeline S1–S6: đồng bộ Zotero → metadata → text layer + `printed_page` → Gemini 2 lượt → validate (kèm độ đầy đủ, tính lại thống kê) → verify theo loại trường.
3. Rate limiter, backoff, `estimate`, trần ngân sách; luồng Batch bất đồng bộ.
4. Lưu phiên bản model / prompt / schema / codebook và phản hồi thô.
* **Bàn giao:** `pnpm worker extract` chạy trên collection mẫu, sinh dữ liệu đã kiểm chứng + báo cáo chi phí.

### 📍 Giai đoạn 1b: Pilot & Kiểm tra chất lượng
1. **Review Queue** bản đầu (route `/review` trong `apps/web`, chỉ tài khoản quản trị) và bước S7.
2. **Trên nhóm Dev (5 bài):** tinh chỉnh prompt / codebook; so sánh Flash và Pro; đo lợi ích và chi phí của **đối chiếu hai model** (Mục 6.3b); đo chi phí ba phương án (đồng bộ / cache / batch) → chốt đơn giá mỗi bài và trần ngân sách hằng tháng (D6).
3. Mã hóa 5 bài Kiểm tra (trước khi xem kết quả AI của các bài này).
4. **Đo trên nhóm Kiểm tra:** T1, T2, độ đầy đủ, tỷ lệ kiểm chứng; so với ngưỡng tham khảo ở Mục 1.4.
5. Ghi kết quả vào `docs/quality-assurance.md` (một bảng ngắn) và trang `/admin/quality`.
* **Cách dùng kết quả:** đạt ngưỡng thì chuyển sang Giai đoạn 2 với chế độ duyệt thông thường. Chưa đạt ở tầng nào thì vẫn có thể đi tiếp, nhưng bật **duyệt tay toàn bộ trường của tầng đó** trong Review Queue cho đến khi chỉnh prompt đạt.
* **Bàn giao:** bảng độ chính xác theo tầng, Review Queue dùng được, đơn giá mỗi bài.

### 📍 Giai đoạn 2: Đám mây & Đồng bộ hai chiều
1. Supabase `prod` (slot cloud còn lại): áp dụng migrations đã thử trên local; index, RLS (khách chỉ đọc dữ liệu đã duyệt / đã kiểm chứng; chỉ tài khoản quản trị được ghi), materialized views.
2. Bucket R2 private, CORS cho pdf.js; Unpaywall + `license_source` gán quyền truy cập PDF (Mục 7, D14).
3. Bước S8–S11: chuẩn hóa khái niệm, upload R2, publish, **ghi ngược Zotero** (tag + child note; bật quyền ghi cho API key Zotero ở bước này).
4. GitHub Actions (Mục 9.3): `pg_dump` hằng đêm lên R2; ping giữ Supabase hoạt động; kiểm tra bài bị rút hằng tháng.
5. Token R2 phân quyền: token **chỉ đọc** cho web, token **đọc/ghi** chỉ cho worker; mỗi token giới hạn trong bucket của dự án.
* **Bàn giao:** một lệnh `pnpm worker sync` đưa bài từ Zotero lên cloud và ghi kết quả ngược về Zotero.

### 📍 Giai đoạn 2b: Prototype & Dùng thử
1. Prototype ba màn hình chính (Mục 8.0).
2. Chủ dự án tự dùng thử, nhờ 2–3 đồng nghiệp / NCS dùng thử bằng tác vụ thật; chỉnh thiết kế. Đo thời gian trả lời câu hỏi cốt lõi so với cách làm thủ công (Google Scholar + đọc bài).
* **Bàn giao:** prototype đã chỉnh + ghi chú dùng thử.

### 📍 Giai đoạn 3: Web MVP (Next.js, local)

**Ưu tiên theo MoSCoW** (làm xong nhóm *Must* là có bản dùng được):

| Mức | Hạng mục |
| :--- | :--- |
| **Must** | Relationship Search làm trang chủ; trang chi tiết Split-Screen; xem và tải PDF theo quyền; xuất Excel; đăng nhập quản trị cho chủ dự án; giới hạn tốc độ theo IP |
| **Should** | Ma trận Master-Detail + Word APA 7; đầy đủ facet của Thư viện; Báo lỗi có Turnstile; trang "Giới thiệu & cách đọc dữ liệu" |
| **Could** | Saved views (lưu trong trình duyệt); copy câu tổng hợp; hướng dẫn nhanh |
| **Không làm trong MVP** | Evidence Map, Heatmap, tìm kiếm ngữ nghĩa, tải ZIP, bộ sưu tập theo tài khoản, giao diện tiếng Anh |

1. `apps/web` dùng chung `packages/schema`; quy chuẩn hiển thị số liệu APA (8.1).
   **Truy cập (D2):** khách xem không cần đăng nhập; **chỉ chủ dự án có tài khoản** (Supabase Auth, magic link, tắt tự đăng ký) để vào `/review`, `/admin` và tải PDF không OA. Web chỉ hiển thị dữ liệu đã `auto_verified` hoặc `human_reviewed`; trường T3 chỉ hiển thị khi đã duyệt.
2. Thư viện lọc đa chiều (8.2).
3. **Relationship Search** (8.2b): tìm theo cặp biến, chiều và vai trò quan hệ; lọc theo kết quả giả thuyết và chiều tác động; xuất bảng; chia sẻ URL; cho nhập tự do.
4. Split-Screen Evidence Workspace (8.3), dùng lại thành phần từ Review Queue.
   **Xem và tải PDF gốc** theo quyền (Mục 7, 7.1): presigned URL từ R2, tên tệp dễ đọc, giới hạn tốc độ theo IP.
5. Ma trận Master-Detail + xuất Word APA 7 / Excel (8.4).
6. Trang "Giới thiệu & cách đọc dữ liệu" (8.9).
7. **Hướng dẫn nhanh** trên trang chủ cho khách lần đầu: 3 tác vụ mẫu (tìm quan hệ giữa hai biến, mở bằng chứng trong PDF, xuất bảng).

### 📍 Giai đoạn 4: GitHub & Triển khai Vercel
1. Kết nối Vercel với GitHub theo Mục 9.5 (Root Directory, Ignored Build Step, branch protection, biến môi trường tối thiểu).
2. GitHub Actions: `ci.yml` và `regression.yml` (Mục 9.3); bật secret scanning + push protection.
3. Đo hiệu năng thực tế (trang < 0,8 s; lọc < 200 ms p95); bật thống kê truy cập không cookie (Cloudflare Web Analytics hoặc Vercel Analytics) để theo dõi mức sử dụng: số lượt Relationship Search, số lần mở bằng chứng trong PDF, số bảng được xuất.

### 📍 Giai đoạn 5: Lớp tổng hợp tri thức
1. Duyệt ánh xạ khái niệm chuẩn quy mô lớn trong Review Queue.
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
* OCR tự động cho PDF scan (MVP chỉ gắn cờ và duyệt tay).
* Tài khoản người dùng cho khách, bộ sưu tập theo tài khoản (8.10).

### 10.1. Lịch dự kiến (5–10 giờ/tuần, trung bình ~7,5 giờ)

Claude Code viết và chạy phần lớn mã nguồn; thời gian dưới đây là **thời gian của chủ dự án** (duyệt codebook, mã hóa bài chuẩn, kiểm tra kết quả, ra quyết định). Việc tốn thời gian nhất là mã hóa 10 bài chuẩn (3–5 giờ/bài).

| Giai đoạn | Việc chính của chủ dự án | Giờ ước tính | Tuần |
| :--- | :--- | :--- | :--- |
| 0 | Cài Docker, xem bộ khung chạy được, duyệt codebook, thiết lập Zotero, chọn 10 bài, mã hóa 5 bài Dev | 30–40 | 1–5 |
| 1 | Kiểm tra kết quả worker trên bài mẫu | ~8 | 6–7 |
| 1b | Mã hóa 5 bài Kiểm tra, duyệt trong Review Queue, xem kết quả đo | 23–33 | 8–11 |
| 2 | Kiểm tra đồng bộ cloud và ghi ngược Zotero | ~6 | 12 |
| 2b | Dùng thử prototype, nhờ 2–3 người dùng thử | ~5 | 13 |
| 3 | Góp ý và nghiệm thu Web MVP | ~12 | 14–15 |
| 4 | Kết nối Vercel, kiểm tra web công khai | ~3 | 16 |
| **Web MVP công khai** | | **~90–110 giờ** | **~4 tháng (khoảng tháng 2/2027)** |

* Giai đoạn 5–6 lên lịch sau khi Web MVP được dùng thực tế.

---

## 11. QUẢN TRỊ RỦI RO & BẢO TOÀN DỮ LIỆU (RISK MANAGEMENT)

| # | Rủi ro | Biện pháp |
| :--- | :--- | :--- |
| 1 | AI trích xuất sai / bịa câu trích | Kiểm chứng theo loại trường; validate logic; đo độ tin cậy theo tầng; Review Queue; hiển thị trạng thái tin cậy |
| 2 | So sánh không hợp lệ giữa các bài (β khác mô hình) | Không quy đổi β → r; forest plot chỉ dùng r từ ma trận tương quan; ghi `model_covariates`, `comparability_note` |
| 3 | Độ chính xác chưa đạt ngưỡng tham khảo | Ngưỡng là tham khảo, không chặn dự án; bật duyệt tay toàn bộ trường của tầng chưa đạt cho đến khi chỉnh prompt đạt |
| 4 | Chi phí Gemini vượt dự kiến | `estimate`; trần ngân sách; đo đơn giá ở 1b; Batch API; Flash mặc định |
| 5 | Rate-limit (Gemini, Zotero) / lỗi mạng | Token bucket + backoff có jitter; tuân theo `Retry-After` / `Backoff`; trạng thái từng bước; chạy tiếp không tốn lại token |
| 6 | Đổi prompt / model làm giảm chất lượng | Kiểm thử hồi quy trên bộ bài chuẩn; ghi phiên bản model cụ thể; chạy lại bộ bài chuẩn khi Google ngừng model cũ (Mục 6.4); chỉ chạy lại bài bị ảnh hưởng |
| 7 | Bản quyền PDF trên web công khai | Khách chỉ tải được bài OA có giấy phép mở; bài không OA chỉ chủ dự án tải (D14); R2 private + presigned URL 5 phút; giới hạn tốc độ theo IP; câu trích ≤ 50 từ; trang chính sách nội dung + kênh gỡ bỏ |
| 8 | Jingle–jangle | Lớp khái niệm chuẩn theo miền; gợi ý theo item; người xác nhận |
| 9 | Kết luận sai từ so sánh bối cảnh | Nhãn "so sánh mô tả"; cảnh báo phương pháp trên giao diện |
| 10 | Mất dữ liệu | `pg_dump` hằng đêm lên R2; raw JSONB; Zotero là kho gốc PDF; migrations có phiên bản |
| 11 | Vượt giới hạn gói Free | Embedding chọn lọc + `halfvec`; theo dõi dung lượng; workflow keepalive; R2 dựng lại được từ Zotero |
| 11b | Supabase chỉ còn 1 slot project cloud | `dev` chạy local bằng Supabase CLI + Docker; migrations thử trên local trước khi áp dụng lên `prod`; `pg_dump` trước mỗi migration; nếu cần thêm project cloud thì nâng gói Pro hoặc tạm dừng project cũ |
| 11c | Tinh chỉnh prompt trên dữ liệu đánh giá (tự đánh lừa mình) | Tách 5 bài Dev và 5 bài Kiểm tra; không sửa prompt dựa trên nhóm Kiểm tra; thêm bài mới khi phải đo lại |
| 11e | AI bỏ sót giả thuyết / Study / bảng | Kiểm tra độ đầy đủ (danh mục Pass 1 + quét text PDF); KPI recall ≥ 95% (Mục 6.3b) |
| 11f | AI gán số liệu đúng nhưng sai chỗ | Đối chiếu hai model cho trường quan trọng; Review Queue khi lệch |
| 11g | Lỗi thống kê ngay trong bài gốc | Tính lại p / t / F theo kiểu statcheck; ghi rõ "có thể là lỗi của bài gốc" |
| 11d | Thiên lệch xuất bản làm số bài "ủng hộ" bị thổi phồng | Cảnh báo trên Relationship Search và Evidence Map; funnel plot ở Giai đoạn 6 |
| 12 | Lộ API key (Gemini, Zotero, Supabase, R2) | `.env` local, `.gitignore`; GitHub Actions Secrets; key Zotero chỉ đọc đến Giai đoạn 2; token R2 chỉ đọc cho web, đọc/ghi chỉ cho worker; service key Supabase chỉ ở worker; bật **secret scanning + push protection** của GitHub (repo public) |
| 12b | Repo public làm lộ nội dung có bản quyền | Không commit PDF, phản hồi thô, dữ liệu chuẩn vàng hay câu trích; kiểm tra `git status` trước mỗi commit; dữ liệu mẫu trong test chỉ dùng văn bản tự viết |
| 13 | Sai số trang khi trích dẫn | `pdf_page_index` + `printed_page` + `printed_page_method`; ưu tiên `annotationPageLabel` khi có |
| 14 | PDF scan không có text layer | Gắn cờ `needs_ocr`, duyệt tay; OCR tự động để giai đoạn sau |
| 15 | Liêm chính khi dùng câu sinh tự động | Bản nháp; chặn với dữ liệu chưa kiểm chứng; hướng dẫn khai báo AI |
| 16 | Công sức mã hóa bài chuẩn | Rút gọn còn 10 bài (khoảng 30–50 giờ); mã hóa ngay trong Zotero khi đọc |
| 17 | Phạm vi quá rộng cho một người | Miền khởi đầu hẹp; MVP chỉ bài định lượng tiếng Anh; bộ khung chạy được trước; MoSCoW cho Web MVP; nguyên tắc "đủ dùng, không thừa" (1.5) |
| 18 | Web công khai bị lạm dụng (bot, spam báo lỗi, tải hàng loạt) | Giới hạn tốc độ theo IP; Turnstile cho form báo lỗi; khách không có quyền ghi (RLS); chỉ hiển thị dữ liệu đã kiểm chứng / đã duyệt |
| 19 | Khách hiểu nhầm số liệu "trong kho" là kết luận của cả lĩnh vực | Ghi rõ "trong kho" ở mọi con số; dòng "ⓘ Cách đọc kết quả này"; trang "Giới thiệu & cách đọc dữ liệu" |
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
| D1 | Miền nghiên cứu khởi đầu | Codebook, khái niệm chuẩn, Bộ chuẩn vàng (1.3, 5.3, 6.2) | Social media marketing, branding, ethics, hành vi khách hàng | ✅ Đã chốt |
| D2 | Đối tượng truy cập Web | Auth, RLS, bản quyền, Vercel (7, 8.10) | **Công khai**: ai có URL đều xem được, không cần đăng nhập; chỉ chủ dự án có tài khoản quản trị. Mục đích: công cụ cá nhân, chia sẻ công khai | ✅ Đã chốt (sửa ở v3.5) |
| D3 | Người mã hóa thứ hai cho bộ bài chuẩn | Mục 6.2 | Không cần (dự án là công cụ cá nhân, không viết bài báo phương pháp) | ⛔ Không áp dụng (v3.5) |
| D4 | Thư viện Zotero dùng cho dự án | Cấu hình API, chia sẻ PDF (3) | **Thư viện cá nhân**, bài dự án trong collection `Research Data`; worker chỉ đọc/ghi trong collection này (xem 3.3) | ✅ Đã chốt |
| D5 | Repository GitHub: tên, private / public | Giai đoạn 4 | `research-data`, **public**; chỉ chứa mã nguồn, không có dữ liệu có bản quyền (rủi ro 12, 12b) | ✅ Đã chốt |
| D6 | Ngân sách Gemini | `GEMINI_BUDGET_LIMIT` (4.3) | **10 USD cho pilot (Giai đoạn 1–1b)**; trần hằng tháng chốt sau khi đo đơn giá ở 1b | ✅ Đã chốt (pilot) |
| D7 | Thời gian dành cho dự án mỗi tuần | Mốc thời gian của lộ trình (10) | 5–10 giờ/tuần; xem lịch dự kiến ở Mục 10.1 | ✅ Đã chốt |
| D9 | Quy mô bộ bài chuẩn | Mục 6.2, 10.1 | **10 bài** (5 Dev, 5 Kiểm tra), do chủ dự án mã hóa | ✅ Đã chốt (sửa ở v3.5) |
| D8 | Tên dự án / tên miền web | Giao diện, Vercel, R2 custom domain | Tên tạm "Research Data" + địa chỉ `*.vercel.app`; đặt tên chính thức và mua tên miền trước khi mở công khai | ✅ Đã chốt (tạm) |
| D10 | Giấy phép mã nguồn (repo public) | File `LICENSE` | **MIT** | ✅ Đã chốt |
| D11 | Nơi chạy Web: Vercel hay Cloudflare Workers | Giai đoạn 3–4, Mục 3A | **Vercel** cho Web; **Cloudflare** cho R2, Turnstile, thống kê truy cập, tên miền; Workers chỉ cho tải ZIP sau này | ✅ Đã chốt |
| D12 | Gói Cloudflare đang dùng | Giới hạn Workers / R2 / Access | **Free**; nâng cấp khi chạm một trong các ngưỡng: R2 > 10 GB hoặc vượt hạn mức thao tác miễn phí; Workers > 100.000 request/ngày hoặc vượt giới hạn CPU khi ghép ZIP (Workers Paid); Access > 50 người dùng | ✅ Đã chốt |
| D13 | Cài Docker Desktop (WSL2) để chạy Supabase local làm môi trường `dev` | Giai đoạn 0–1, Mục 2 | **Cài Docker Desktop** (máy 16 GB RAM, đã có WSL2); chỉ bật khi phát triển. Cài ở bước đầu Giai đoạn 0 | ✅ Đã chốt |
| D14 | Chính sách tải PDF trên web công khai | Mục 7, 7.1 | Khách: chỉ tải bài OA có giấy phép mở; bài Bronze / không rõ giấy phép: chỉ link OA gốc + DOI; bài không OA: chỉ link DOI. Chủ dự án: tải mọi bài | ✅ Đã chốt |
