# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT PLAN - VERSION 3.9.1)
## HỆ THỐNG CƠ SỞ DỮ LIỆU & TỔNG QUAN TÀI LIỆU KHOA HỌC CHUẨN MỰC Q1
*(Academic Literature Matrix & Research Knowledge Base for Behavioral Science, Management & Marketing)*

---

---

## Mục lục tài liệu

Kế hoạch được chia thành nhiều file (bước 0.9). Số mục giữ nguyên như bản gốc v3.9.

| Mục | Nội dung | File |
| :--- | :--- | :--- |
| 0 | Lịch sử thay đổi | [CHANGELOG.md](CHANGELOG.md) |
| 1 | Tổng quan dự án & mục tiêu | File này |
| 2 | Kiến trúc hệ thống & luồng dữ liệu | [docs/architecture.md](docs/architecture.md) |
| 3, 3A, 4 | Tích hợp Zotero, Cloudflare, chiến lược Gemini | [docs/integrations.md](docs/integrations.md) |
| 5 | Schema dữ liệu | [docs/data-schema.md](docs/data-schema.md) |
| 6 | Kiểm soát chất lượng | [docs/quality-assurance.md](docs/quality-assurance.md) |
| 7, 8 | Bản quyền & tải PDF; giao diện (UI/UX) | [docs/ux-spec.md](docs/ux-spec.md) |
| 9 | Công nghệ & cấu trúc mã nguồn | [docs/architecture.md](docs/architecture.md) |
| 10 | Lộ trình thực hiện (quy trình từng bước, lịch) | File này |
| 11 | Quản trị rủi ro | [docs/risks.md](docs/risks.md) |
| 12 | Tài liệu tham khảo phương pháp luận | [docs/quality-assurance.md](docs/quality-assurance.md) |
| 13 | Các quyết định đã chốt | File này |
| — | **Codebook**: định nghĩa vận hành của từng trường dữ liệu | [docs/codebook.md](docs/codebook.md) |
| — | **Danh sách lý thuyết và khái niệm chuẩn khởi tạo** (bước 0.14) | [docs/canonical-lists.md](docs/canonical-lists.md) |

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Tuyên ngôn Sứ mệnh (Mission Statement)
Xây dựng một hệ thống cơ sở dữ liệu học thuật tự động hóa chuyên sâu cho các ngành **Khoa học Hành vi, Quản trị kinh doanh, Marketing và Kinh tế**, có khả năng:
* Nạp tài liệu trực tiếp từ **thư viện Zotero cá nhân** của chủ dự án.
* Phân tách sâu toàn văn bài báo từ PDF, mọi trường dữ liệu truy vết được về trang và đoạn văn gốc. **Nguồn trích xuất chính (D16, từ 19/10/2026): các tác tử Codex / Antigravity** làm trên gói việc do hệ thống xuất; **Gemini API (gói trả phí) là phương án dự phòng**, đã dựng và đo xong ở Giai đoạn 1.
* Trích xuất **ma trận tương quan và thống kê mô tả**, tạo nền dữ liệu cho meta-analysis và MASEM.
* Cung cấp giao diện Web trên **Vercel** để tra cứu, lọc đa chiều, xem ma trận tổng hợp, bản đồ bằng chứng (Evidence Map) và trích dẫn có kiểm chứng.
* Là **công cụ tham khảo đủ chính xác**, không cần người duyệt: một lượt trích xuất AI cùng các lớp máy đối chiếu với PDF; mọi con số bấm được để tự kiểm tra trong bài gốc (Mục 6), đủ để chủ dự án **yên tâm dùng dữ liệu cho nghiên cứu của mình** và luôn kiểm tra lại được nhanh với bản gốc.
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

### 1.4. Phân tầng trường dữ liệu & Mục tiêu chất lượng

Đây là **công cụ tham khảo**; người dùng tự đối chiếu với bài gốc (Mục 6). Các mục tiêu dưới đây dùng để biết công cụ có đang hữu ích không, **không phải cổng chặn**.

| Tầng | Ví dụ trường | Cách xử lý | Mục tiêu tham khảo |
| :--- | :--- | :--- | :--- |
| **T1 – Sự kiện** (factual) | n, β, p, CI, r, M, SD, α, CR, AVE, quốc gia, số Study, mã giả thuyết | Máy đối chiếu với PDF + kiểm tra chéo; ✓ hoặc ⚠ | ≥ 85% trường mang ✓; 100% đúng trên bộ bài giả lập |
| **T2 – Phân loại** (categorical) | thiết kế nghiên cứu, phương pháp phân tích, loại mẫu, trạng thái giả thuyết, loại hiệu ứng | Máy kiểm tra logic (VD: `status` khớp với p); ✓ hoặc ⚠ | ≥ 85% trường mang ✓ |
| **T3 – Diễn giải** (interpretive) | vai trò lý thuyết, loại đóng góp, loại khoảng trống | AI trích một lần; nhãn **◇ AI diễn giải, tham khảo** | — |

Các chỉ số khác:
* **Độ đầy đủ:** 100% giả thuyết, Study và bảng của bộ bài giả lập được trích; với bài thật, mọi mục còn thiếu được ghi rõ cho người dùng biết.
* **Truy vết:** 100% trường có bằng chứng (trang + câu trích hoặc vị trí bảng); bấm một lần là mở đúng chỗ trong PDF.
* **Tín hiệu từ người dùng:** số báo lỗi trên 100 lượt xem (theo dõi ở `/admin/quality`).
* **Hiệu năng Web:** trang tải < 0,8 giây; truy vấn lọc đa tiêu chí < 200 ms (p95) ở quy mô 5.000 bài.
* **Chi phí:**
  * Hạ tầng cố định: **0 VNĐ/tháng** (Vercel Hobby, R2 Free 10GB, Supabase Free); Zotero là gói trả phí sẵn có của chủ dự án.
  * Nguồn chính (Codex / Antigravity): một lượt trích xuất mỗi bài, không tính phí theo lời gọi; mọi lớp đối chiếu và huy hiệu giữ nguyên. Dự phòng Gemini: **một lượt trích xuất Pro mỗi bài** cộng vài lời gọi nhỏ để trích bổ sung mục thiếu; đơn giá đo thật (Batch, bài một Study 0,25–0,6 USD); có trần ngân sách D6.

### 1.5. Nguyên tắc Thiết kế
1. **Evidence-first:** không có trường dữ liệu nào hiển thị mà không kèm nguồn gốc và trạng thái kiểm chứng.
2. **Công cụ tham khảo, người dùng tự kiểm tra:** AI trích xuất một lượt, máy đối chiếu với PDF và gắn huy hiệu; **người dùng có trách nhiệm đối chiếu với bài gốc** trước khi dùng. Không ai phải đọc bài, mã hóa hay duyệt; sửa tay trên web chỉ là tùy chọn (Mục 6.7).
2a. **Kiểm tra lại phải nhanh:** mọi con số và câu đều bấm được để mở đúng chỗ trong PDF; có bảng "Vì sao ✓" cho mỗi huy hiệu.
2b. **Đủ dùng, không thừa:** mỗi cơ chế phải giúp chủ dự án dùng dữ liệu an toàn hơn hoặc nhanh hơn; không xây cơ chế chỉ để phục vụ công bố khoa học.
3. **Reproducible:** mọi lượt trích xuất lưu phiên bản model, prompt, schema, codebook và phản hồi thô.
4. **Single source of truth:** một gói schema Zod dùng chung cho Gemini, validator, DB và Web; Zotero là nguồn sự thật cho tệp PDF và metadata thư mục.
5. **Copyright-aware:** quyền truy cập PDF phụ thuộc tình trạng Open Access.
6. **Methodologically sound:** cấu trúc dữ liệu theo chuẩn phương pháp luận hiện hành; không tạo ra các phép so sánh không hợp lệ (VD: so β giữa các mô hình khác nhau).

---

## 10. LỘ TRÌNH THỰC HIỆN (ROADMAP 3.3)

### 10.0. Quy trình làm việc từng bước (bắt buộc)

Mỗi giai đoạn được chia thành các **bước nhỏ**. Với mỗi bước:

```
Code một bước ─► Kiểm thử ─► Qua hết? ──Không──► Sửa, kiểm thử lại
                                │
                               Có
                                ▼
                    Báo cáo + hỏi ý kiến chủ dự án ─► Đồng ý? ──Không──► Chỉnh theo góp ý
                                                        │
                                                       Có
                                                        ▼
                                                  Sang bước tiếp theo
```

1. **Chỉ code một bước mỗi lần**; không gộp, không làm trước bước sau.
2. **Kiểm thử ngay sau khi code**: test tự động (Vitest / Playwright), type-check, và chạy thử thật khi bước đó chạy được. Test hỏng thì sửa đến khi qua.
3. **Báo cáo** gồm: đã làm gì (file nào); đã kiểm thử gì, kèm **kết quả thật** (số test qua / hỏng, ảnh chụp hoặc đầu ra khi chạy thử); vấn đề còn lại hoặc rủi ro; bước tiếp theo dự kiến.
4. **Chỉ sang bước tiếp theo khi chủ dự án đồng ý rõ ràng.** Đồng ý một bước không áp dụng cho bước khác.
5. Cần đổi kế hoạch hoặc làm ngoài phạm vi bước thì dừng lại hỏi trước.
6. Mỗi bước được duyệt thì **commit riêng** (một bước một commit), để dễ xem lại và quay lui.

**Danh sách bước của Giai đoạn 0** (các giai đoạn sau được chia bước khi bắt đầu giai đoạn đó):

| Bước | Nội dung | Kiểm thử | Cần chủ dự án |
| :--- | :--- | :--- | :--- |
| **0.1** | Khởi tạo repo: `LICENSE` (MIT), `README.md` ngắn, `.gitignore`, commit đầu; tạo repo `research-data` trên GitHub và đẩy lên | `.env` và PDF không bị theo dõi; repo hiện trên GitHub, đủ file | Tạo repo / đăng nhập GitHub; xác nhận tên, email commit |
| **0.2** | Dựng monorepo (pnpm workspaces, TypeScript, Vitest, ESLint); gỡ `schema.js` cũ khỏi luồng chính (giữ lại để tham khảo) | `pnpm install`, `pnpm typecheck`, `pnpm test` (một test mẫu) đều qua | — |
| **0.3** | Supabase local: `supabase init`, migration đầu tiên (bảng tối thiểu cho bộ khung) | `supabase start` chạy được; migration áp dụng được từ đầu; kết nối và truy vấn được | Cài Docker Desktop |
| **0.4** | Bộ khung (1): đọc text layer PDF theo trang, xác định `printed_page` | Unit test trên PDF tự tạo; chạy trên 1 bài OA thật, in ra số trang và đoạn đầu mỗi trang | Đưa 1–2 bài PDF Open Access |
| **0.5** | Bộ khung (2): gọi Gemini Pro trích 3–4 trường (cỡ mẫu, thiết kế, một giả thuyết kèm β, p và bằng chứng) | Kết quả qua Zod schema; in chi phí lượt gọi; chạy trên bài thật | Kiểm tra `.env` có Gemini API key |
| **0.6** | Bộ khung (3): máy đối chiếu câu trích và con số với text layer | Unit test các trường hợp khớp / không khớp / dạng số khác nhau; chạy trên kết quả của 0.5 | — |
| **0.7** | Bộ khung (4): ghi kết quả vào Supabase local | Đọc lại từ database đúng với dữ liệu ghi vào | — |
| **0.8** | Bộ khung (5): trang web đơn giản hiển thị dữ liệu + PDF, bấm vào giá trị thì PDF nhảy đúng trang | Test end-to-end (Playwright); ảnh chụp màn hình | Mở thử trên máy |
| **0.9** | Tách tài liệu kế hoạch sang `docs/` + `CHANGELOG.md` | Không mất mục nào (đối chiếu danh sách mục); mọi liên kết nội bộ đúng | Đọc lướt |
| **0.10** | Codebook v1.0 (Claude Code soạn) | Script kiểm tra: mọi trường trong schema đều có định nghĩa trong codebook | Đọc lướt, sửa định nghĩa khái niệm / lý thuyết (1–2 giờ) |
| **0.11** | `packages/schema` (Zod) đầy đủ theo Codebook | Mọi schema chuyển được sang `responseSchema`; ví dụ JSON mẫu qua validate | — |
| **0.12** | Kết nối Zotero: đọc collection `Research Data/Inbox` | Liệt kê đúng các bài trong Inbox; tải được 1 PDF | Tạo API key Zotero chỉ đọc, tạo collection |
| **0.13** | Bộ bài giả lập (PDF giả + đáp án) | Sinh được PDF; đáp án khớp nội dung PDF | — |
| **0.14** | Danh sách lý thuyết và khái niệm chuẩn khởi tạo cho miền | Mọi khái niệm / lý thuyết ở Mục 1.3 có mặt, không trùng lặp | Đọc lướt |

Bước 0.4–0.8 tạo thành **bộ khung chạy được** (Giai đoạn 0, mục 1). Sau bước 0.8 sẽ có một **điểm dừng lớn** để cùng xem lại 3 rủi ro kỹ thuật (schema Gemini, chất lượng text layer, tỷ lệ khớp) trước khi đi tiếp.

### 📍 Giai đoạn 0: Nền tảng & Bộ khung chạy được
1. **Bộ khung chạy được (làm đầu tiên, khoảng 2 tuần):** một lát cắt mỏng từ đầu đến cuối trên máy local: 1 bài OA → Gemini trích 3–4 trường → kiểm chứng câu trích → ghi vào Supabase local → một trang web đơn giản hiển thị kèm PDF. Mục đích: chứng minh các mắt xích nối được với nhau trước khi làm sâu từng phần.
2. Dựng monorepo; cài Docker Desktop + Supabase CLI (D13); khởi tạo repo GitHub `research-data` (public, MIT).
3. **Tách tài liệu kế hoạch:** `PROJECT_PLAN.md` chỉ giữ tổng quan, quyết định và lộ trình; chi tiết chuyển sang `docs/architecture.md`, `docs/data-schema.md`, `docs/quality-assurance.md`, `docs/ux-spec.md`, `docs/integrations.md`; lịch sử thay đổi chuyển sang `CHANGELOG.md`. Nội dung giữ nguyên.
4. **Claude Code soạn Codebook v1.0** (gán tầng T1/T2/T3 cho mọi trường); chủ dự án đọc lướt và sửa định nghĩa khái niệm / lý thuyết của miền (khoảng 1–2 giờ).
5. Viết `packages/schema` (Zod) từ Codebook; test chuyển đổi sang `responseSchema`.
6. Thiết lập Zotero: collection `Research Data/Inbox`, tag quy ước, API key chỉ đọc, Better BibTeX.
7. **Tạo bộ bài giả lập** (Mục 6.6): PDF giả với số liệu biết trước, nhiều kiểu trình bày bảng.
8. Khởi tạo danh sách lý thuyết chuẩn và khái niệm chuẩn cho miền khởi đầu (Claude Code soạn từ Codebook).
* **Bàn giao:** bộ khung chạy được, `docs/codebook.md`, `packages/schema`, `fixtures/synthetic/`.

### 📍 Giai đoạn 1: Bộ máy trích xuất & Dây chuyền kiểm chứng (Local Worker)
1. Supabase **local** (`dev`) + migrations đầu tiên (`pipeline_runs`, `extraction_runs`, `review_changes`, bảng nghiệp vụ).
2. Pipeline S1–S8 (Mục 6): một lượt trích xuất Pro, máy đối chiếu với PDF (kèm trích bổ sung mục thiếu, tính lại thống kê), kiểm tra chéo trong bài, gắn huy hiệu, ánh xạ khái niệm "không chắc thì tách".
3. Rate limiter, backoff, `estimate`, trần ngân sách; luồng Batch bất đồng bộ.
4. Lưu phiên bản model / prompt / schema / codebook, phản hồi thô và tín hiệu của từng lớp.

**Danh sách bước của Giai đoạn 1** (chốt khi bắt đầu giai đoạn; quy trình theo Mục 10.0):

| Bước | Nội dung | Kiểm thử | Cần chủ dự án |
| :--- | :--- | :--- | :--- |
| **1.1** | Migration đủ bảng nghiệp vụ theo Mục 5.2 (studies, theories + paper_theories, constructs + construct_aliases, measurements, paths, ma trận tương quan, ô điều kiện, evidence, `pipeline_runs`, `review_changes`); nạp sẵn danh sách 0.14 | `db:reset` sạch; RLS (khách chỉ đọc, không thấy trường ẩn); seed khớp `canonical-data.ts` | — |
| **1.2** | Khung pipeline S1–S3: Zotero Inbox → tải PDF → text layer; ghi `pipeline_runs` theo khóa `file_hash + schema + codebook + prompt`, chạy lại thì bỏ qua | Test với Zotero giả; chạy thật trên collection mẫu, lần hai bỏ qua hết | — |
| **1.3** | Trích xuất đầy đủ: 6 lượt gọi theo `EXTRACTION_SCHEMAS`, ghép Study (`assembleStudy`) | Generator giả trên bộ bài giả lập; gọi thật 1 bài | — |
| **1.4** | Máy đối chiếu mọi trường T1/T2 với PDF, gắn huy hiệu; xử lý ô bảng bị tách dòng trong text layer | Bộ bài giả lập đúng 100% (Mục 1.4) | — |
| **1.5** | Kiểm tra chéo trong bài, tính lại thống kê (t / F → p), phát hiện mục thiếu và trích bổ sung | Bài giả lập cài sẵn lỗi thống kê phải bị bắt | — |
| **1.6** | Ánh xạ khái niệm "không chắc thì tách": khớp tên + bí danh (embedding / item để sau khi có đủ bài) | Nhãn gần giống nhưng khác nghĩa được tách riêng | — |
| **1.7** | Rate limiter, backoff, `estimate`, trần ngân sách; luồng Batch bất đồng bộ | API giả: vượt trần thì dừng trước khi gọi | — |
| **1.8** | Lưu phiên bản model / prompt / schema / codebook, phản hồi thô (chỉ local) và tín hiệu từng lớp; publish đủ dữ liệu, không ghi đè trường đã khóa | Trích lại không đè trường đã sửa tay (rủi ro 22) | — |
| **1.9** | Chạy thật `pnpm worker extract` trên 5 bài đầu, đo đơn giá mỗi bài | Báo cáo chi phí so với trần ngân sách (D6) | Xem báo cáo chi phí |
* **Bàn giao:** `pnpm worker extract` chạy trên collection mẫu, sinh dữ liệu có điểm tin cậy + báo cáo chi phí. **Đơn giá thật mỗi bài đo trên 5 bài đầu** (trong trần ngân sách D6; đo được trung bình 0,88 USD/bài đồng bộ, xem CHANGELOG v3.9.9).

### 📍 Giai đoạn 1b: Chạy thử, chọn nguồn trích xuất & Chốt chất lượng ✅ (xong 20/10/2026)
**Đổi hướng ngày 19/10/2026 (D16):** vì chi phí Gemini API cao, **nguồn trích xuất chính chuyển sang Codex / Antigravity** (chủ dự án chạy tác tử trên gói việc), Claude Code nhập dữ liệu và đưa lên web; Gemini API thành dự phòng. Bộ thử là **các bài trong thư mục Zotero "Dissertation / 1 - Social Media Marketing Ethics"** (chủ dự án chỉ định, không lấy thêm bài ngoài thư mục này); 6 bài trong đó đã có bản Gemini Batch để so sánh.
1. Đã xong với Gemini (1b.1–1b.2): lệnh `quality`, đơn giá Batch thật, tỷ lệ ✓ / ⚠ / ẩn theo loại thiết kế.
2. **Thử khả thi nguồn chính (1b.7)** rồi **làm thật (1b.8)**, theo kế hoạch kiểm thử ở Mục 6.9.
3. Chỉnh prompt / codebook / quy tắc kiểm tra cho các loại trường hay mang ⚠ nhất, trên **gói prompt dùng chung** (Claude Code làm, chạy lại bộ bài giả lập để kiểm tra không làm hỏng chỗ khác).
4. Trang `/admin/quality` và danh sách "Cần chú ý" bản đơn giản.
* **Việc của chủ dự án:** chạy gói việc trên Codex / Antigravity; xem bảng tỷ lệ ✓ / ⚠ và kết quả so sánh. Không mã hóa, không duyệt từng trường.
* **Kết quả chốt ngày 20/10/2026:** nguồn chính là **Codex** (GPT 6.1 Sol medium); trên 6 bài thư mục "1 - Social Media Marketing Ethics" tỷ lệ vấn đề 17% so với 35% của các bài Gemini còn lại, cùng bài thì thấp hơn Gemini ở 4/6 bài, bằng ở 1 và cao hơn nhẹ ở 1 (past-present: 9,1% so với 8,3%); thời gian người làm 2–10 phút mỗi bài, trung vị 6 phút (100 bài ≈ 10 giờ, 300 bài ≈ 30 giờ); Gemini Batch trung bình 0,52 USD/bài làm dự phòng. Số liệu trong hình vẫn ẩn / ⚠ (mục hoãn).
* **Bàn giao:** nguồn trích xuất chính đã chọn kèm số liệu so sánh, prompt đã chỉnh, thời gian người làm mỗi bài; Gemini là dự phòng với đơn giá đã đo.

**Danh sách bước của Giai đoạn 1b** (duyệt ngày 19/10/2026, **sửa theo đổi hướng D16 cùng ngày**; quy trình theo Mục 10.0). Thứ tự làm: 1b.1 ✅, 1b.2 ✅, **1b.7 → 1b.8**, rồi 1b.4, 1b.5, 1b.6. Mục tiêu bộ thử: các bài trong thư mục "1 - Social Media Marketing Ethics"; Gemini chỉ giữ ngân sách đã chi (14,86/25 USD) và không chạy thêm trừ khi dùng dự phòng:

| Bước | Nội dung | Tốn API | Cần chủ dự án |
| :--- | :--- | :--- | :--- |
| **1b.1** | Lệnh `pnpm worker quality`: bảng tỷ lệ ✓ / ⚠ / ◇ / ẩn theo loại thiết kế, nhóm trường và lý do hỏng nhiều nhất; chạy trên các bài đã có | Không | Xem bảng |
| **1b.2** ✅ | Nạp 7 bài của thư mục "1 - Social Media Marketing Ethics" và chạy Batch 6 bài (bỏ bài 144 trang định tính); báo chi phí thật mỗi bài (tổng 0,92 USD) | 0,92 USD | Đã xong |
| **1b.3** ⛔ | ~~So Pro với Flash, đo Context Cache~~ — **bỏ** (D16): Gemini chuyển sang dự phòng, không đầu tư tối ưu thêm | — | — |
| **1b.4** (làm từng việc: 1 ✅ mã họ H1; 2 ✅ ma trận Φ; 3 ✅ số liệu trong hình: giữ nguyên, ghi vào mục hoãn) | Chỉnh prompt / codebook / quy tắc cho loại trường hay ⚠ nhất (làm sau 1b.8, trên gói prompt dùng chung cho cả hai nguồn); mỗi sửa có test và chạy lại bộ bài giả lập | Không | Duyệt danh sách sửa |
| **1b.5** ✅ | Trang `/admin/quality` và danh sách "Cần chú ý" bản đơn giản (web local, chỉ quản trị) | Không | Xem trang |
| **1b.6** ✅ | Chốt nguồn chính (so Codex, Antigravity, Gemini theo Mục 6.9), thời gian người làm mỗi bài; trần Gemini D6 chỉ còn cho dự phòng | Không | Đồng ý lựa chọn |
| **1b.7** ✅ Codex | **Nguồn chính D16, thử khả thi** (Mục 4.5, kế hoạch kiểm thử Mục 6.9): script tạm (không vào repo) tạo gói việc cho các bài thư mục "1 - Social Media Marketing Ethics" đã có bản Gemini; giao cho **Codex** và **Antigravity**; kiểm tra JSON bằng schema thật và so với bản Gemini theo tiêu chí `compare`. Không ghi database | Không | Chạy gói trên Codex và Antigravity; duyệt kết quả so sánh |
| **1b.8** | **Nguồn chính D16, làm thật** (chỉ khi 1b.7 đạt): lệnh `manual export` (gói việc), `manual check` (chỉ kiểm tra Zod, không database, để tác tử tự sửa lỗi), `manual import --all` (Zod, kiểm tra phiên bản, publish như luồng chính; **Claude Code chạy**), `AGENTS.md` cho gói việc, tên file đầy đủ trong gói, `compare` ghép khái niệm theo cặp số liệu (kết quả A1, Mục 6.9); có test tự động. Chạy thật các bài đến database và web | Không | Chạy gói trên hai công cụ; xem `quality` |

**Bước 1b.8 chia nhỏ (chủ dự án chốt các lựa chọn ngày 19/10/2026):** mỗi bước nhỏ làm riêng, kiểm thử, báo cáo, chờ duyệt (Mục 10.0).
* **1b.8a** ✅ `manual export` (gói việc, prompt **full-1.5.0**: tên file đầy đủ, **tối đa 8 mục** mỗi loại ở phần thảo luận, mỗi đối tượng phải có câu trích). **1b.8b** ✅ `manual check`. **1b.8c** ✅ `manual import --all`. **1b.8d** ✅ máy đối chiếu dung thứ gạch nối cuối dòng. **1b.8e** ✅ nâng `compare` và `quality`. **1b.8f** ✅ chạy thật các bài thư mục "1 - Social Media Marketing Ethics" qua Codex đến database và web local.
* **Bản Gemini của cùng bài bị thay bởi bản Codex** khi import: sao lưu database (`pg_dump`) trước, in bảng tóm tắt trước khi ghi; dòng đã khóa bằng sửa tay được giữ; bản Gemini vẫn nằm trong lịch sử trích xuất.
* Gói việc ở `C:ProjectsResearch Data Packets` (biến `PACKETS_DIR`), ngoài repo; tên nhóm lệnh giữ là `manual`.

### 📍 Giai đoạn 3a: Web dùng thật trên máy (local, nhóm *Must*) ✅ (đóng 20/10/2026)
Chủ dự án là người dùng chính, nên **web chạy local với Supabase local đã đủ để dùng hằng ngày**. Cloud và Vercel chỉ cần khi chia sẻ công khai.
1. `apps/web` chạy local, đọc Supabase local; làm các hạng mục nhóm **Must** ở bảng MoSCoW (Giai đoạn 3b).
2. (Tùy chọn) Nút ✎ sửa trực tiếp cho quản trị (Mục 6.7); trường đã sửa được khóa theo khóa tự nhiên, không bị ghi đè khi trích xuất lại.
3. Chủ dự án **bắt đầu dùng thật cho nghiên cứu**: thêm bài vào Zotero Inbox, hệ thống tự xử lý; chủ dự án chỉ dùng kết quả và ghi lại góp ý giao diện.
* **Bàn giao:** web local dùng được cho Relationship Search, Split-Screen, xem PDF, xuất Excel. **Kết quả 3a.6 (20/10/2026):** làm lại 3 bài Gemini cũ bằng Codex (Serial Mediation, Ethical Brand, Green Purchase; 0 vòng sửa, số phút không đo): ⚠ 28→29, 17→4, 25→17; khung tô sáng định vị 61% / 100% / 76% số trường có câu trích. Một câu hỏi thật (Green perceived value → Green purchase intentions) được đánh giá hữu ích. Kho hiện 9 bài Codex + 12 bài Gemini; góp ý sau khi dùng nhiều ghi ở `docs/usage-log.md`. Việc còn treo: dòng tổng hợp "0 bài" khi mọi kiểm định đều ⚠; số trong hình không có khung; 12 bài Gemini cũ chưa làm lại.

**Danh sách bước của Giai đoạn 3a** (chủ dự án duyệt ngày 20/10/2026; quy trình theo Mục 10.0):

| Bước | Nội dung | Cần chủ dự án |
| :--- | :--- | :--- |
| **3a.1** ✅ | **Relationship Search làm trang chủ** (Mục 8.2b): Biến A ↔ Biến B, chiều, vai trò trực tiếp / trung gian / điều tiết; thanh tổng hợp "trong kho" (số bài, Study, kiểm định; kết quả giả thuyết; chiều tác động; số kiểm định ⚠ không được tính); danh sách nhóm theo bài; bộ lọc; URL chia sẻ được; trạng thái trống; danh sách bài chuyển sang `/library`. **Tìm theo tên biến tác giả dùng** (khái niệm chuẩn dùng thêm khi đã ánh xạ). Đọc qua quyền của khách (không thấy trường ẩn) | Dùng thử |
| **3a.2** ✅ | Split-Screen: tab (Tổng quan, Lý thuyết, Study & Mẫu, Đo lường, Kết quả, Tương quan, Đóng góp), bảng "Vì sao ✓", huy hiệu theo phần, thanh chia kéo được | Dùng thử |
| **3a.3** ✅ | Tô sáng câu / ô bảng trong PDF khi bấm một giá trị (pdf.js). Vị trí tính ở worker lúc đăng (cột `extracted_fields.highlight`), trình duyệt chỉ vẽ; không định vị được thì mở đúng trang, không vẽ khung và nói rõ | Dùng thử |
| **3a.4** ✅ | Xuất Excel cho đúng tập kết quả đã lọc (cột huy hiệu, số trang in, tuyên bố trách nhiệm); Word APA 7 để 3b | Mở file thử |
| **3a.5** ✅ | Xem và tải PDF theo quyền: chủ dự án tải mọi bài; quy tắc cho khách (OA có giấy phép mở) làm đủ ở Giai đoạn 2 | — |
| **3a.6** ✅ | Dùng thật cho nghiên cứu: thêm bài (Zotero → Codex → import), ghi góp ý giao diện | Góp ý |

* **Quyết định đã chốt ngày 20/10/2026:** tìm theo tên biến tác giả dùng (chỉ 4/410 đường dẫn đã ánh xạ về khái niệm chuẩn); Relationship Search là trang chủ; tô sáng PDF làm sau 3a.1 và 3a.2; **đăng nhập quản trị và giới hạn tốc độ theo IP để đến Giai đoạn 2 / 3b** (web local một người dùng, `/admin/quality` đã khóa chỉ chạy local); dùng kho hiện có (21 bài: Gemini + Codex trộn, huy hiệu phân biệt nguồn), thêm bài khi dùng thật.

### 📍 Giai đoạn 2: Đám mây & Đồng bộ hai chiều
1. Supabase `prod` (slot cloud còn lại): áp dụng migrations đã thử trên local; index, RLS (khách chỉ đọc, không đọc được trường bị ẩn; chỉ tài khoản quản trị được ghi), materialized views.
   * **Bước 2.1 ✅ (23/10/2026):** project `research-data` (Free, Singapore, ref trong `.env` là `SUPABASE_PROD_REF`; mật khẩu database `SUPABASE_PROD_DB_PASSWORD`, URL và khóa anon `SUPABASE_PROD_URL` / `SUPABASE_PROD_ANON_KEY`, mọi thứ ngoài git); đăng nhập Supabase CLI do chủ dự án làm; `supabase link` rồi `db push` áp đủ 8 migrations (database prod còn trống, chưa có bài). Kiểm khách (khóa anon) trên prod bằng một bài thử đã xóa: thấy trường ✓, không thấy trường và Study bị ẩn, thanh đếm huy hiệu không tính ẩn, không ghi / sửa / xóa được `papers`; cả 24 bảng bật RLS, 7 bảng nội bộ (`api_spend`, `batch_jobs`, `extraction_runs`, `pipeline_runs`, `review_changes`, `user_reports`, `zotero_annotations`) không có chính sách nên khách không đọc được. **Bước 2.3 ✅ (23/10/2026):** đã nạp dữ liệu 36 bài từ local lên prod (sao lưu local trước ở `extracted_data/backups/local-data-2026-10-23.sql`, 16 MB; nạp trong một giao dịch qua pooler); số dòng 24 bảng và số huy hiệu (✓ 8063 · ⚠ 1455 · ◇ 776 · ẩn 452) **bằng nhau** giữa local và prod; web chạy local đọc từ prod chỉ bằng khóa anon hiện 36 bài, 10.294 giá trị. **Phân chia lưu trữ (chủ dự án yêu cầu):** Supabase chỉ giữ dữ liệu truy vấn, PDF, bản trích xuất đã lưu và sao lưu sang R2 (docs/architecture.md Mục 9.3b). **Bước 2.2a ✅ (23/10/2026):** bucket R2 `research-data-pdfs` (private; truy cập r2.dev tắt, chưa có tên miền riêng; `R2_ACCOUNT_ID` và `R2_BUCKET` trong `.env`), đăng nhập `wrangler` do chủ dự án làm; CORS cho `http://localhost:3000` (GET, HEAD, header Range, để pdf.js đọc từng phần); đã tải **36/36 PDF** với khóa `pdf/<sha256>.pdf` (kiểm hash từng tệp trước khi tải, tải lại một tệp so hash khớp; truy cập ẩn danh vào endpoint S3 bị từ chối). **Bước 2.2b ✅ (23/10/2026):** token R2 chỉ đọc `research-data-web-read` (Account API token, quyền "Workers R2 Storage Bucket Item: Read", chỉ bucket `research-data-pdfs`; chủ dự án tạo, khóa nhập qua `scripts/set-r2-keys.ps1` vào `apps/web/.env.local`, không đi qua chat); route `/api/papers/[id]/pdf` chuyển hướng tới **presigned URL 5 phút** (`lib/r2.ts`, khóa đối tượng `pdf/<sha256>.pdf`, tên tệp tải về dễ đọc), không có token thì đọc tệp local như trước. Đã thử: tải đủ 579.490 byte đúng hash, Range trả 206, CORS chỉ cho `localhost:3000`, token **không ghi được (403) và không đọc được bucket khác (403)**, không chữ ký bị từ chối; trình xem PDF trong web hiện đúng trang kèm khung tô sáng. Token đọc/ghi cho worker **chưa tạo** (tạo khi worker cần tải PDF mới lên R2).
   * **Bước 2.2c ✅ (23/10/2026):** `pnpm worker oa [--paper X] [--target prod] [--yes]` hỏi Unpaywall (email liên hệ `UNPAYWALL_EMAIL`, chủ dự án đồng ý dùng email của mình) và lưu `oa_status`, `oa_license`, `oa_url`, `oa_checked_at` (migration `20261023100000_oa_fields.sql`, đã áp lên local và prod); **`license_source = 'oa'` chỉ khi bản gold / green / hybrid có giấy phép Creative Commons hoặc public domain** (kể cả biến thể NC, ND vì cho chia sẻ nguyên bản phi thương mại; chủ dự án duyệt); bronze, "other-oa", không nêu giấy phép thì không mở; giá trị `license_source` do chủ dự án đặt được giữ, một `'oa'` cũ không còn đúng bị xóa. Kết quả 36 bài (cả local và prod, giống nhau): **7 bài giấy phép mở** (3 cc-by, 1 cc-by-nc, 1 cc-by-nc-sa, 2 cc-by-nc-nd), 4 bài OA nhưng không mở (2 other-oa, 2 không nêu giấy phép), 17 đóng, 8 không có DOI. **Web theo D14:** chủ dự án (máy này) xem và tải mọi PDF; khách chỉ xem và tải bài giấy phép mở (route PDF trả 403 cho bài khác), còn lại thấy khung "PDF không đăng công khai" kèm **"Bản OA"** (nếu Unpaywall có, chỉ với bài OA) và **"Mở DOI"**; dữ liệu trích xuất và câu trích vẫn công khai. Đã thử trên bản production (chế độ khách): mở 302, đóng 403, bronze 403 kèm liên kết OA và DOI. **Chưa làm:** hỏi lại Unpaywall định kỳ (bài đóng có thể thành OA), thêm tên miền thật vào CORS khi có, tài khoản quản trị, ghi ngược Zotero.
   * **Bước 2.4 ✅ (23/10/2026): sao lưu hằng đêm.** GitHub Actions `backup.yml` (02:17 giờ Việt Nam, chạy tay được): `pg_dump -Fc` schema `public` của prod → bucket R2 riêng `research-data-backups` (`backups/db-<UTC>.dump`), giữ 30 bản. Token R2 `research-data-backup-rw` chỉ thấy bucket này (đã thử bị từ chối ở bucket PDF và bucket dự án khác); 7 secrets của repo đặt bằng `scripts\set-github-secrets.ps1`; chủ dự án cấp quyền `workflow` cho GitHub CLI. Đã thử: chạy tay thành công (dump 2,36 MB, kiểm kích thước); **phục hồi bản thật vào database tạm, số dòng 9 bảng chính khớp prod**; dọn bản cũ đã thử bằng 3 tệp giả với `keep=2` (xóa đúng 3 tệp cũ, tệp lạ trong bucket không bị đụng). Cách phục hồi ở `docs/architecture.md` Mục 9.3. **Bước 2.4b ✅ (23/10/2026):** `pnpm worker backup-files [--yes] [--keep N]` (chạy tay) lưu các tệp gốc của `extracted_data/` (67 tệp, 0,7 MB nén; bỏ `backups/` 398 MB và `audit/`) lên `extracted/` trong bucket sao lưu, tải lại so SHA-256, giữ 12 bản; giải nén thử khớp 67/67. **Chưa làm:** kiểm RLS sau một lần phục hồi thật; chạy `backup-files` sau mỗi đợt nhập bài (nhắc trong `docs/usage.md` khi cần).
2. Bucket R2 private, CORS cho pdf.js; Unpaywall + `license_source` gán quyền truy cập PDF (Mục 7, D14).
3. Bước S8–S11: chuẩn hóa khái niệm, upload R2, publish, **ghi ngược Zotero** (tag + child note; bật quyền ghi cho API key Zotero ở bước này).
4. GitHub Actions (Mục 9.3): `pg_dump` hằng đêm lên R2; ping giữ Supabase hoạt động; kiểm tra bài bị rút hằng tháng.
5. Token R2 phân quyền: token **chỉ đọc** cho web, token **đọc/ghi** chỉ cho worker; mỗi token giới hạn trong bucket của dự án.
* **Bàn giao:** một lệnh `pnpm worker sync` đưa bài từ Zotero lên cloud và ghi kết quả ngược về Zotero.

**Đăng nhập quản trị và giới hạn tốc độ (chủ dự án duyệt 23/10/2026, 6 bước A.1 đến A.6, làm lần lượt):** A.1 cấu hình Supabase Auth và tạo tài khoản chủ · A.2 đăng nhập trên web bằng link email (`@supabase/ssr`, `getOwner()` kiểm phiên phía máy chủ và email cho phép; lối tắt máy dev giữ nguyên) · A.3 chính sách RLS "chủ đọc mọi hàng" và chuyển `/admin/quality` sang phiên của chủ · A.4 PDF cho chủ qua phiên, nút Đăng nhập, Đăng xuất · A.5 giới hạn tốc độ theo IP (bộ giới hạn sau một giao diện, kho đếm bằng bộ nhớ, gắn Upstash khi lên Vercel; băm IP, giữ tối đa 24 giờ; 429 kèm `Retry-After`) · A.6 thử thật trên prod rồi đóng D2.
   * **Bước A.1 ✅ (23/10/2026):** `supabase config push` chỉ đẩy 4 thuộc tính lên prod (các giá trị khác của prod được giữ nguyên, file cấu hình local đã chỉnh cho khớp): **tắt tự đăng ký** (`enable_signup = false`; đã thử bằng khóa khách: đăng ký bằng mật khẩu và gửi link cho email lạ đều bị từ chối `signup_disabled`), địa chỉ chuyển hướng `http://localhost:3000/**` (thêm tên miền thật sau), link hết hạn sau 15 phút, `site_url = http://localhost:3000`. Tài khoản chủ duy nhất `tranthanhtung37@gmail.com` tạo bằng API quản trị (email đã xác nhận, không mật khẩu, `app_metadata.role = owner`, mà người dùng không tự sửa được). Giãn cách gửi thư giữ 1 phút, thư gửi bằng máy chủ thư mặc định của Supabase (rất hạn chế số thư, đủ cho một người). Lưu ý: file `supabase/config.toml` giờ tắt đăng ký cả ở local; tài khoản thử ở local phải tạo bằng API quản trị.
   * **Bước A.2 ✅ (23/10/2026): đăng nhập trên web.** `/login` (nhập email, nhận link; **mọi địa chỉ nhận cùng một câu trả lời**, địa chỉ không nằm trong `ADMIN_EMAILS` không bao giờ tới Supabase nên không tốn thư và không lộ ai là chủ), `/auth/callback` (đổi mã một lần lấy phiên; phiên của người không phải chủ bị hủy ngay; `next` chỉ là đường dẫn trong site), `/auth/logout` (chỉ POST), nút Đăng nhập hoặc email kèm Đăng xuất ở đầu trang, `proxy.ts` làm mới phiên (khách không có cookie Supabase thì đi thẳng, không tốn lời gọi). `lib/owner.ts` (`ownerFrom`, thuần, có test): chủ là phiên đã xác nhận email, nằm trong `ADMIN_EMAILS` và `app_metadata.role = owner`; **lối tắt máy dev giữ nguyên** (máy có đường nối database trực tiếp vẫn là chủ), còn một phiên chủ thật luôn được ưu tiên để thấy ai đang đăng nhập. `lib/supabase-server.ts` kiểm phiên bằng `getUser()` phía máy chủ (không tin cookie suông). Route PDF và trang bài dùng `getOwner()` thay `adminDbUrl()`. Đã thử: luồng link email thật ở Supabase local (e2e qua hộp thư thử Mailpit: xin link, mở link, đăng nhập, đăng xuất; link sai bị từ chối; `next` ra site khác bị chặn) và **chế độ khách trên bản production** (PDF bài mở 302, bài đóng 403, trang quản trị 404, có link Đăng nhập). Supabase local được khởi động lại để nhận cấu hình mới. **Chưa làm:** Turnstile cho trang đăng nhập.
   * **Bước A.6 ✅ (23/10/2026): thử thật trên prod, đóng D2.** Web chạy **chế độ production ở `localhost:3000` nối Supabase prod** (không có lối tắt máy dev, `NEXT_PUBLIC_*` cố định lúc build). Chủ dự án xin link ở `/login`, **bấm link trong email thật (Gmail) trên cùng trình duyệt**: đầu trang hiện email và nút Đăng xuất; `/admin/quality` đọc bằng phiên của chủ trên prod (ảnh chụp: 35 bài, 10.746 trường, ✓ 8063 · ⚠ 1455 · ◇ 776 · **ẩn 452**); bài đóng "A Serial Mediation..." **hiện PDF trong khung và tải được**. **Phía khách (không cookie)** trên đúng server đó: PDF bài đóng xem và tải đều 403, trang quản trị 404, thấy khung "PDF không đăng công khai" kèm "Mở DOI" và link Đăng nhập, bài giấy phép mở vẫn xem được (302 tới R2); qua REST công khai khách thấy **0 trường ẩn, 0 lượt trích xuất**, `quality_report` bị từ chối (401). Việc chưa kiểm bằng tay: tên tệp tải về (đã kiểm bằng e2e: `attachment; filename="….pdf"`) và cửa sổ ẩn danh (đã thay bằng yêu cầu không cookie ở trên). Cổng 3000 là bắt buộc lúc này vì CORS của R2, địa chỉ chuyển hướng và `site_url` của Supabase đang đặt cho `localhost:3000`; khi có tên miền thật phải thêm vào cả ba chỗ.
   * **Bước A.5 ✅ (23/10/2026): giới hạn tốc độ theo IP.** `lib/rate-limit.ts` (thuần, có test) và `proxy.ts`: **cửa sổ trượt** theo từng cặp (luật, người truy cập); **chỉ đếm yêu cầu được cho qua** nên một cuộc dội bom không tự khóa mình lâu hơn; quá mức trả **429 kèm `Retry-After`**; người truy cập là **mã băm SHA-256 có muối** của IP (không bao giờ lưu IP), mọi thứ hết hạn sau cửa sổ (tối đa 1 giờ, dưới mức 24 giờ ở ux-spec). Mức mặc định: trang 120/phút, tìm kiếm 60/phút (cộng với trang), link PDF 20/phút, tải PDF 10/giờ (cộng với link), xuất Excel/Word 10/giờ, gửi form đăng nhập 5/10 phút, link đăng nhập (callback) 20/10 phút; không đếm tài nguyên tĩnh, đăng xuất và các yêu cầu tải trước link của trình duyệt. **Bật khi production, tắt khi phát triển** (`RATE_LIMIT=on|off` ép được; máy dev và bộ e2e gọi hàng trăm yêu cầu từ một máy). Header `x-forwarded-for` **chỉ được tin khi `TRUST_PROXY=1`** (đặt ở nơi proxy ghi đè nó, như Vercel; nếu không ai cũng có thể viết địa chỉ giả để né), và chỉ địa chỉ đầu danh sách đặt tên cho người truy cập. Kho đếm hiện nằm trong bộ nhớ một tiến trình (đủ cho máy này và một máy chủ); **chạy trên hàm serverless cần kho dùng chung (Upstash Redis) gắn vào giao diện `RateStore` ở Giai đoạn 4**, chưa gắn vì chưa có tài khoản. Đã thử: 13 test đơn vị (cửa sổ trượt, hai luật, dọn bộ nhớ, mã băm, tin proxy) và 6 e2e chế độ production (121 trang trong một phút bị 429 còn người khác vẫn 200, PDF, xuất, callback, form đăng nhập, địa chỉ giả nối đuôi không có xô mới; 9 e2e production, 49 e2e dev xanh). **Chưa làm:** kho dùng chung Upstash, Turnstile.
   * **Bước A.4 ✅ (23/10/2026): PDF cho chủ qua phiên, thử ở chế độ như khi deploy.** Route PDF dùng `getOwner()` từ A.2; bước này **chứng minh** nó bằng bộ e2e chế độ production riêng (`pnpm test:e2e:prod`, `playwright.prod.config.ts`: build vào `.next-prod`, chạy cổng 3001, không có lối tắt máy dev nên chủ chỉ là người đã đăng nhập). 3 test qua: **khách** không xem và không tải được PDF bài không có giấy phép mở (403), không có trang quản trị (404), thấy khung "không đăng công khai" và link Đăng nhập; khách xem và tải được bài giấy phép mở (302 tới R2); **chủ đăng nhập bằng link email thật** nhận link R2 5 phút cho bài đóng (xem trực tiếp `inline` và tải `attachment` tên tệp dễ đọc), thấy nút tải thay cho khung chặn, đọc `/admin/quality` bằng phiên (số trường ẩn > 0), và **sau khi đăng xuất mất lại tất cả** (403, 404). Sửa một điểm phát hiện khi build production: nhánh dự phòng đọc tệp PDF từ đĩa làm cả dự án bị đóng gói theo (cản Vercel), nên nay **chỉ chạy khi phát triển**; production thiếu R2 thì trả 503. Thêm `distDir` theo biến `NEXT_DIST_DIR` để bản build thử không làm bẩn server dev, và loại `.next-prod` khỏi ESLint. **Chưa làm:** hiển thị PDF trong trình duyệt khi web chạy ở cổng khác `localhost:3000` (CORS của R2 chỉ cho `localhost:3000`; thêm tên miền thật khi có).
   * **Bước A.3 ✅ (23/10/2026): quyền đọc của chủ trong database.** Migration `20261023200000_owner_access.sql` (đã áp lên local và prod): hàm `is_owner()` (đọc `app_metadata.role = 'owner'` trong token phiên; **không bao giờ đọc `user_metadata`**, thứ người dùng tự sửa được), chính sách **"owner reads all" chỉ SELECT** cho cả 24 bảng (chủ thấy trường và Study bị ẩn, các bảng nội bộ; không có chính sách ghi nên chủ cũng không ghi được qua web), và hàm `quality_report(source, limit)` (security definer, chỉ trả lời chủ, tính cả bảng chất lượng bằng một lời gọi). `/admin/quality` đọc bằng phiên của chủ (`lib/quality-session.ts`) khi đã đăng nhập, và bằng kết nối trực tiếp (máy dev) khi chưa; máy dev khai báo "là chủ" rõ ràng trong giao dịch, mặc định không ai được phép (một lỗ hổng do chính test bắt được ở thiết kế đầu, đã sửa). Liên kết "Chất lượng (quản trị)" hiện với chủ. **Đã thử trên prod** bằng một bài thử đã xóa và một phiên chủ thật (lấy qua API quản trị, không gửi email): khách thấy trường ✓ nhưng **không thấy trường ẩn, Study ẩn, 455 lượt trích xuất, báo lỗi**, và `quality_report` bị từ chối (401, 42501); chủ thấy trường ẩn, Study ẩn, 455 lượt, báo cáo chất lượng chạy (kể cả 2 dòng thử), nhưng **ghi bị chặn** (403). 8 test DB mới (93 DB, 49 e2e xanh; e2e đi luồng link thật rồi mở `/admin/quality` bằng phiên).

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
**Danh sách bước (chủ dự án duyệt 23/10/2026, cùng bốn mặc định: vùng Singapore, lên bằng `*.vercel.app` trước, noindex tạm, CI chỉ lint, type-check, test đơn vị và build trước):** 4.1 chuẩn bị mã · 4.2 tài khoản Vercel và Upstash, dự án (Root Directory `apps/web`, vùng `sin1`; nhớ đặt `ENABLE_EXPERIMENTAL_COREPACK=1` vì `packageManager` là pnpm 12) · 4.3 biến môi trường production (không đưa mật khẩu database hay khóa quản trị lên Vercel) · 4.4 bản chạy đầu trên `*.vercel.app` (thêm địa chỉ vào CORS R2 và cấu hình Auth Supabase, chạy lại bộ kiểm A.6, kiểm `TRUST_PROXY` và 429 thật) · 4.5 bảo vệ GitHub (branch protection, secret scanning, push protection) · 4.6 thống kê không cookie · 4.7 đo hiệu năng thật · 4.8 tên miền thật và kênh liên hệ gỡ bỏ.
* **Bước 4.1 ✅ (23/10/2026): chuẩn bị mã.** (a) **Kho đếm giới hạn tốc độ dùng chung Upstash** (`lib/rate-limit-upstash.ts`): cùng giao diện `RateStore`, một script Lua cho cửa sổ trượt (đếm và kiểm tra là một bước nguyên tử khi nhiều hàm chạy cùng lúc, chỉ đếm yêu cầu được cho qua), **fail-open** (Upstash lỗi hoặc quá 400 ms thì cho qua và ghi log, không làm sập web); proxy tự chọn Upstash khi có `UPSTASH_REDIS_REST_URL` và `_TOKEN` (hoặc `KV_REST_API_*` của tích hợp Vercel), không thì dùng bộ nhớ; **muối băm IP phải giống nhau ở mọi instance** (`RATE_LIMIT_SALT`, mặc định lấy token Upstash). Test: client với Upstash giả (lệnh gửi đi, đọc kết quả, lỗi, quá hạn) và một test chạy script Lua thật, **bỏ qua cho tới khi có `UPSTASH_TEST_URL` và `_TOKEN` (chưa chạy thật vì chưa có tài khoản Upstash)**. (b) **`robots.txt` đóng và `noindex`** (meta, `X-Robots-Tag`) cho tới khi đặt `ALLOW_INDEXING=1`; kể cả khi mở vẫn cấm API, quản trị, đăng nhập, xuất. (c) **Header bảo mật** cho mọi trang: HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` và `frame-ancestors 'none'`, `Permissions-Policy` (chưa có CSP đầy đủ cho script vì Next cần nonce; làm ở 4.7 nếu cần). (d) **Làm gọn `/matrix`**: danh sách kiểm định từng bài nạp khi mở (`/api/matrix/[paperId]`, `app/matrix/paper-lines.tsx`), trang HTML từ **1,16 MB còn 151 KB**. (e) **`ci.yml`** (type-check, lint, test đơn vị, `docs:check`, build web) và **`apps/web/vercel.json`** (vùng `sin1`, `ignoreCommand` chỉ build khi `apps/web`, `packages/schema` hoặc lockfile đổi). Đã chạy đúng các lệnh của CI trong **bản clone sạch** (không `.env`, không `extracted_data`, không PDF, không Docker): 547 test, kiểm liên kết, build đều qua; chưa chạy trên máy Linux của GitHub (lần đầu sẽ cho biết khác biệt về đường dẫn hay chữ hoa chữ thường). 5 test mới ở `lib/` (13 + 4 + 2) và 2 e2e headers; 51 e2e dev, 9 e2e production xanh.
* **Bước 4.2 ✅ (23/10/2026): tài khoản và dự án.** Chủ dự án đăng nhập Vercel CLI (tài khoản `johntroger`, nhóm **VNEconomics, gói Hobby**, đã có hai dự án khác không đụng tới). Dự án **`research-data`** tạo bằng `vercel link`; **kho GitHub `johntroger/research-data` được nối tự động** (nhánh production `main`); đặt qua API: Root Directory `apps/web`, framework Next.js, Node 24.x, cho phép nguồn ngoài thư mục gốc (để thấy `packages/schema` và lockfile); biến `ENABLE_EXPERIMENTAL_COREPACK=1` ở cả production, preview, development (cần vì `packageManager` là pnpm 12). **Upstash for Redis** tạo qua Vercel Marketplace (`vercel integration add upstash/upstash-kv`, chủ dự án đồng ý điều khoản), tài nguyên `upstash-kv-amber-coin` nối vào `research-data`; Vercel tự đặt `KV_REST_API_URL`, `KV_REST_API_TOKEN` (và `KV_URL`, `REDIS_URL`, `KV_REST_API_READ_ONLY_TOKEN`) cho cả ba môi trường, đúng tên mà proxy đọc; bản sao của hai khóa REST để trong `.env` (ngoài git) dưới tên `UPSTASH_REDIS_REST_URL` và `_TOKEN`. **Đã chạy test Lua thật trên Upstash thật: 5/5 qua** (cửa sổ trượt dùng chung đúng ngữ nghĩa). **Chưa deploy cố ý**: dự án nối Git nhưng biến môi trường còn thiếu (4.3); commit 4.2 mang nhãn `[vercel skip]` và không đụng `apps/web` nên `ignoreCommand` cũng bỏ qua. Lưu ý rút ra: `vercel link` thêm dòng `.env*` vào `.gitignore` (đã bỏ vì che `.env.example`) và tạo `.env.local` ở gốc (đã xóa); lệnh cài Upstash tự thêm "agent skills" của bên thứ ba vào repo (`.agents/`, `.claude/skills/`, `skills-lock.json`; đã xóa vì dự án không dùng SDK Upstash); CLI đặt biến production và preview ở loại "sensitive" (ẩn giá trị). **Chưa kiểm:** gói và vùng của Redis do trình cài chọn mặc định, không hỏi (chủ dự án xem ở bảng điều khiển Upstash trên Vercel, cần là gói Free).
* **Bước 4.3 ✅ (23/10/2026): biến môi trường production.** `node scripts/set-vercel-env.mjs [--dry-run]` đẩy một **danh sách cố định 9 biến** (không phải "mọi thứ trong `.env`") lên **Production và Preview**, giá trị đi qua stdin, chỉ in tên: `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` (địa chỉ và khóa công khai của prod), `ADMIN_EMAILS`, `R2_ACCOUNT_ID`, `R2_BUCKET`, **`R2_ACCESS_KEY_ID` và `R2_SECRET_ACCESS_KEY` (token chỉ đọc, chỉ bucket PDF; ẩn)**, `TRUST_PROXY=1`, `RATE_LIMIT_SALT` (ngẫu nhiên 64 ký tự, ẩn, giống nhau ở mọi instance; không lưu bản sao ở máy, muốn đổi thì chạy lại kịch bản). Cùng với `KV_*` do tích hợp Upstash đặt và `ENABLE_EXPERIMENTAL_COREPACK`. **Cố ý không đưa lên Vercel:** mật khẩu database, khóa quản trị Supabase, token R2 đọc/ghi và token sao lưu, khóa Gemini, Zotero và Unpaywall (kịch bản có danh sách cấm và dừng nếu một tên bị đưa vào); đã đối chiếu danh sách thật bằng `vercel env ls`. Không đặt cho môi trường Development (tránh kéo khóa về máy). `ALLOW_INDEXING` không đặt nên web vẫn đóng với công cụ tìm kiếm. Chưa deploy; bước kế tiếp (4.4) sẽ deploy và kiểm trên địa chỉ thật. Lưu ý: `REDIS_URL` và `KV_URL` của tích hợp chứa mật khẩu đầy đủ của Redis, ứng dụng không dùng nhưng chúng nằm trong dự án.
* **Bước 4.4 ✅ (23/10/2026): bản chạy đầu trên `https://research-data-five.vercel.app`.** Deploy production bằng `vercel deploy --prod` (build 1 phút, Next.js 16, Node 24). **Phát hiện và sửa: vùng chạy hàm là `iad1` (Mỹ), không phải Singapore** vì `regions` trong `vercel.json` **không có hiệu lực ở gói Hobby**; nay đặt ở **cài đặt dự án** (`serverlessFunctionRegion = sin1` qua API) và đã thấy `X-Vercel-Id: hkg1::sin1`; `regions` đã bỏ khỏi `vercel.json`. Thêm địa chỉ vào **CORS của R2** (`localhost:3000` và địa chỉ vercel.app; địa chỉ lạ không được `Access-Control-Allow-Origin`) và vào **Auth Supabase** (`site_url` và danh sách chuyển hướng bằng `config push`; đăng ký vẫn đóng). **Kiểm phía khách trên địa chỉ thật:** PDF bài đóng xem và tải đều 403, bài giấy phép mở 302 tới R2, trang quản trị 404, trang bài hiện khung "không đăng công khai", `robots.txt` đóng, `X-Robots-Tag: noindex`, HSTS, `X-Frame-Options`, `nosniff`. **`TRUST_PROXY` đúng và Upstash chạy thật:** 135 yêu cầu mang 135 `x-forwarded-for` giả khác nhau vẫn bị 429 ở mức 120 (Vercel ghi đè header, nên không né được; lỗi Upstash thì web cho qua hết nên 429 xuất hiện là bằng chứng kho dùng chung hoạt động). **Chủ dự án đăng nhập bằng link email thật trên địa chỉ thật**, thấy email ở đầu trang, trang `/admin/quality` hiện số liệu có ẩn 452, bài đóng hiện PDF trong khung và tải được (qua link R2 5 phút). Ghi chú: địa chỉ production `research-data-five.vercel.app` công khai, còn địa chỉ riêng của từng bản deploy (và bản preview) bị Vercel Authentication chặn (302 tới đăng nhập Vercel), đúng ý muốn; không đọc được nhật ký chạy qua CLI ở gói Hobby (xem ở bảng Vercel). Chưa có tên miền thật (4.8).
* **Bước 4.5 ✅ (24/10/2026): bảo vệ GitHub và bản preview.** **Nhánh `main` được bảo vệ** (qua API): bắt buộc check `check` của `ci.yml` (type-check, lint, test đơn vị, kiểm liên kết, build) cho mọi hợp nhất qua pull request, **cấm force-push và cấm xóa nhánh**; **chủ dự án vẫn push thẳng được** (`enforce_admins` tắt, không bắt buộc pull request), nên luồng làm việc một người hiện nay không đổi, nhưng CI chỉ chặn được hợp nhất qua PR chứ không chặn push thẳng của chủ (đã thấy bài học: một commit lỗi lint đã lọt lên main và CI đỏ rồi mới sửa); muốn chặt hơn thì chuyển sang làm việc qua pull request và bật `enforce_admins` (quyết định của chủ dự án, chưa làm). **Secret scanning và push protection** đã bật sẵn (repo công khai mặc định); **thử thật**: đẩy một nhánh tạm chứa chuỗi giả dạng token Slack bị GitHub chặn (GH013, "Slack API Token"), không có gì được đăng, đã dọn nhánh tạm. **Bản preview:** tạo một bản preview thật, **người lạ bị Vercel chuyển tới đăng nhập Vercel ở mọi đường dẫn** (`/`, `/login`, PDF); lớp thứ hai: Supabase chỉ chuyển hướng sau đăng nhập về địa chỉ production và `localhost`, còn preview, preview khác và trang lạ đều bị đưa về trang production (thử bằng link không hợp lệ nên không gửi thư), nên **không thể hoàn tất đăng nhập chủ trên preview**. Đã xóa bản preview thử.
* **Bước 4.6 ✅ (24/10/2026): thống kê không cookie (đếm lượt dùng; lượt xem trang bỏ theo ý chủ dự án).** **Bảng đếm theo ngày** `usage_daily(day, event, n)` (migration `20261024100000_usage_counters.sql`, đã áp lên local và prod): chỉ ngày, loại và con số, **không IP, không cookie, không đường dẫn, không người dùng**, nên không có dữ liệu cá nhân để lộ hay bị đòi xóa; ngày tính theo giờ Việt Nam. Ghi qua hàm `count_event(kind)` (security definer, **danh sách đóng 9 loại**: `relation_search`, `evidence_open`, `export_excel`, `export_word`, `export_word_matrix`, `pdf_view`, `pdf_download`, `copy_sentence`, `copy_apa`; loại lạ bị từ chối nên khách không làm bảng phình bằng cách bịa tên, tối đa số ngày nhân 9 dòng); khách **không đọc, không ghi trực tiếp** được (401); chỉ chủ đọc bằng chính sách "owner reads all" và hàm `usage_report` (owner only). **Đếm ở đâu:** máy chủ đếm tìm quan hệ (trang chủ có câu hỏi), xuất Excel, xuất Word hai kiểu, link xem và tải PDF; trình duyệt báo qua `POST /api/event` chỉ ba loại của riêng nó (mở bằng chứng, copy câu, copy APA; loại của máy chủ hay loại bịa bị 400 nên trình duyệt không khai gian được). Đếm chạy **sau khi trả lời** (`after`), lỗi nào cũng bị nuốt (không làm hỏng trang), và **không đếm lượt của chính chủ** (phiên chủ hoặc máy dev). Trang **`/admin/usage`** (chỉ chủ, đọc bằng phiên chủ hoặc kết nối dev): bảng 30 ngày theo loại kèm tổng; liên kết từ trang chất lượng. Trang Giới thiệu có mục **Quyền riêng tư** nói rõ không cookie theo dõi, không tài khoản, không lưu IP. **Lượt xem trang không cookie:** mã đã sẵn (script Cloudflare Web Analytics tải khi có biến `NEXT_PUBLIC_CF_BEACON_TOKEN`, không tải cho chủ); **chủ dự án quyết định không dùng (24/10/2026)**: không có token nên web không tải script nào của bên thứ ba; muốn bật sau chỉ cần đặt `NEXT_PUBLIC_CF_BEACON_TOKEN` trên Vercel và deploy lại (chưa chắc Cloudflare nhận tên `*.vercel.app`; không được thì dùng Vercel Web Analytics, script cùng nguồn). Đã thử: 4 test đơn vị, 3 test báo cáo, 9 test DB (97 DB), 4 e2e production (đếm đúng một lần mỗi loại, trang không câu hỏi không đếm, 400 cho loại sai, chủ không bị đếm và đọc được bảng; 14 e2e production, 51 e2e dev xanh); trên prod đã thử bằng khóa khách: đọc bảng 401, đếm loại bịa 400, `usage_report` 401.
* **Nhóm P1 sau đánh giá giao diện (chủ dự án duyệt 24/10/2026): P1.1 metadata ✅, P1.2 dòng tóm tắt trung thực, P1.3 khối "Kho này gồm gì", P1.4 đầu trang chi tiết bài.** **P1.1 ✅ (24/10/2026):** (a) `parseCrossrefWork` sửa lỗi nguồn JSTOR ghi "Morris B. Holbrook Reviewed work(s):" thành tên tác giả (nay ra "Holbrook, Morris B."; có test); (b) lệnh mới `pnpm worker metadata [--paper X] [--doi D] [--target prod] [--yes]` làm mới tiêu đề, tác giả, năm, tạp chí từ Crossref, mặc định chỉ xem trước; (c) trên prod đã bổ sung DOI và metadata cho 7 bài thiếu (DOI lấy từ chính PDF hoặc Crossref, kiểm khớp tiêu đề và tác giả; riêng bài Bhattacharya et al. PDF là bản thảo "xxxx", chọn bản 2024 khớp thứ tự tác giả), rồi chạy lại `oa`: bài Yıldırım & Dursun (JTAER, CC BY) thành mở, nay 8/36 bài khách xem và tải được. Còn đúng 1 bài không DOI: luận văn Granstedt (2026), vốn không có DOI. Kiểm tra: `pnpm check` xanh (555 test đơn vị).
* **Làm rõ "public cho mọi người" (chủ dự án yêu cầu 24/10/2026).** Chủ dự án muốn web dùng được mà **không cần đăng nhập**. Đã kiểm trên địa chỉ thật: một người lạ không cookie dùng được đủ tìm quan hệ, thư viện, ma trận, trang bài (dữ liệu, câu trích, số trang) và xuất Excel, Word (đều 200); chỉ **trang quản trị** và **PDF bài không có giấy phép mở** cần đăng nhập (D14 giữ nguyên, chủ dự án chọn "chỉ làm rõ", không mở PDF bài đóng). Vì liên kết "Đăng nhập" nằm ở đầu mọi trang dễ gây hiểu nhầm, nay **dời xuống chân trang** ("Chủ dự án: đăng nhập"), thêm dòng đầu trang chủ "Mở cho mọi người, không cần tài khoản hay đăng nhập" và một đoạn ở trang Giới thiệu; đầu trang chỉ còn hiện email và nút Đăng xuất khi chủ đã đăng nhập. **Chưa làm (chủ dự án chưa chọn):** mở cho Google lập chỉ mục (`ALLOW_INDEXING=1`, nên làm sau khi có kênh liên hệ gỡ bỏ ở 4.8).
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
* **Số liệu chỉ có trong hình** (sơ đồ SEM, biểu đồ): lớp chữ của PDF không có số nên máy không đối chiếu được; các trường đó **vẫn ẩn hoặc ⚠** (chủ dự án chốt 20/10/2026, giữ nguyên quy tắc huy hiệu). Hai hướng đã cân nhắc và hoãn: nhãn "đọc từ hình, cần đối chiếu" thay vì ẩn (đổi quy tắc huy hiệu), và đọc ảnh bằng AI để kiểm chứng. Xét lại khi có số liệu về mức phổ biến của bài dựa vào hình (bài `satisfaction`: 15/51 đường dẫn từ Figure 2).
* Trích xuất sâu bài định tính, bài khái niệm, bài tổng quan; bài tiếng Việt.
* Tìm kiếm ngữ nghĩa trước khi có vài trăm bài.
* Evidence Map trước khi lớp khái niệm chuẩn ổn định và có đủ ma trận tương quan.
* OCR tự động cho PDF scan (MVP chỉ gắn cờ; chủ dự án tự kiểm tra khi cần).
* Tài khoản người dùng cho khách, bộ sưu tập theo tài khoản (8.10).

### 10.1. Lịch dự kiến (5–10 giờ/tuần, trung bình ~7,5 giờ)

Chủ dự án **không mã hóa, không duyệt** (công cụ tham khảo, người dùng tự đối chiếu với bài gốc). Thời gian dưới đây là thời gian của chủ dự án để **làm việc cùng Claude Code** (giao việc, xem kết quả, xác nhận, cài đặt tài khoản / khóa API) và ra quyết định. Lịch theo tuần phụ thuộc chủ yếu vào khối lượng phát triển mà Claude Code làm trong các phiên đó.

| Giai đoạn | Việc chính của chủ dự án | Giờ ước tính | Tuần |
| :--- | :--- | :--- | :--- |
| 0 | Cài Docker, tạo tài khoản / khóa API (GitHub, Supabase, Gemini, Zotero), xem bộ khung chạy được, đọc lướt codebook | ~10–14 | 1–4 |
| 1 | Làm việc cùng Claude Code dựng pipeline; xem báo cáo chi phí 5 bài đầu | ~8–10 | 5–6 |
| 1b | Xem bảng tỷ lệ ✓ / ⚠; đồng ý trần ngân sách | ~2–3 | 7 |
| 3a | Dùng web local cho nghiên cứu thật; ghi góp ý giao diện | ~6 | 8–9 |
| 2 | Tạo bucket R2, project Supabase `prod`; kiểm tra đồng bộ cloud | ~4 | 10 |
| 3b | Góp ý hoàn thiện Web, nhờ 2–3 người dùng thử | ~6 | 11–12 |
| 4 | Kết nối Vercel, kiểm tra web công khai | ~3 | 13 |
| **Dùng được trên máy** | | | **từ tuần 8 (khoảng đầu tháng 12/2026)** |
| **Web MVP công khai** | | **~40–46 giờ** | **khoảng 3 tháng (giữa tháng 1/2027)** |

* Giai đoạn 5–6 lên lịch sau khi Web MVP được dùng thực tế.
* Sau khi vận hành: chủ dự án chỉ cần thêm bài vào Zotero; không có công việc duyệt định kỳ. Kiểm tra bài bị rút chạy tự động. Người dùng tự đối chiếu với bài gốc khi dùng dữ liệu.

---

## 13. CÁC QUYẾT ĐỊNH CẦN CHỐT TRƯỚC KHI TRIỂN KHAI

Chưa bắt đầu các bước kỹ thuật (Giai đoạn 0 trở đi, tạo repository GitHub…) cho đến khi các quyết định dưới đây được chốt.

| # | Quyết định | Ảnh hưởng đến | Đề xuất | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| D1 | Miền nghiên cứu khởi đầu | Codebook, khái niệm chuẩn (1.3, 5.3, 6.1) | Social media marketing, branding, ethics, hành vi khách hàng | ✅ Đã chốt |
| D2 | Đối tượng truy cập Web | Auth, RLS, bản quyền, Vercel (7, 8.10) | **Công khai**: ai có URL đều xem được, không cần đăng nhập; chỉ chủ dự án có tài khoản quản trị. Mục đích: công cụ cá nhân, chia sẻ công khai | ✅ Đã chốt (sửa ở v3.5); **✅ làm xong và thử thật 23/10/2026** (bước A.1 đến A.6, Giai đoạn 2): đăng nhập bằng link email, tắt tự đăng ký, quyền đọc của chủ qua RLS, giới hạn tốc độ theo IP |
| D3 | Người mã hóa thứ hai | — | Không cần | ⛔ Không áp dụng (v3.5) |
| D4 | Thư viện Zotero dùng cho dự án | Cấu hình API, chia sẻ PDF (3) | **Thư viện cá nhân**, bài dự án trong collection `Research Data`; worker chỉ đọc/ghi trong collection này (xem 3.3) | ✅ Đã chốt |
| D5 | Repository GitHub: tên, private / public | Giai đoạn 4 | `research-data`, **public**; chỉ chứa mã nguồn, không có dữ liệu có bản quyền (rủi ro 12, 12b) | ✅ Đã chốt |
| D6 | Ngân sách Gemini | `GEMINI_BUDGET_LIMIT` (4.3) | **25 USD cho pilot** (nâng từ 10 lên 20 rồi 25 USD ngày 19/10/2026), dùng để đo đơn giá thật, chạy thử khoảng 20 bài và so Pro với Flash; trần hằng tháng chốt sau Giai đoạn 1b. Lý do nâng: đo thật trên 5 bài (đồng bộ) cho trung bình 0,88 USD/bài (0,29–2,16; bài nhiều Study đắt gấp đôi ước tính), và khoảng 5,5 USD trong 10 USD đầu bị lãng phí do sự cố (Docker sập, chạy trùng) nên 10 USD không đủ cho 20–30 bài. Nâng lên 25 USD khi bắt đầu 1b: đã chi 13,94 USD cho 12 bài, còn 11,06 USD cho khoảng 11 bài thực nghiệm thêm (0,4–0,6 USD/bài Batch, bài nhiều Study đến 2,5 USD) và so sánh Flash (~1 USD) | ✅ Đã chốt (pilot, đã nâng); 20/10/2026: Gemini chỉ còn là dự phòng, không đặt trần hằng tháng, chạy thêm chỉ khi chủ dự án đồng ý |
| D7 | Thời gian dành cho dự án mỗi tuần | Mốc thời gian của lộ trình (10) | 5–10 giờ/tuần; xem lịch dự kiến ở Mục 10.1 | ✅ Đã chốt |
| D9 | Cách bảo đảm chất lượng | Mục 6 | **Công cụ tham khảo**: một lượt trích xuất + máy đối chiếu với PDF + huy hiệu; người dùng tự đối chiếu với bài gốc; không có bộ bài chuẩn hay bộ đối chứng | ✅ Đã chốt (sửa ở v3.8) |
| D8 | Tên dự án / tên miền web | Giao diện, Vercel, R2 custom domain | Tên tạm "Research Data" + địa chỉ `*.vercel.app`; đặt tên chính thức và mua tên miền trước khi mở công khai | ✅ Đã chốt (tạm) |
| D10 | Giấy phép mã nguồn (repo public) | File `LICENSE` | **MIT** | ✅ Đã chốt |
| D11 | Nơi chạy Web: Vercel hay Cloudflare Workers | Giai đoạn 3–4, Mục 3A | **Vercel** cho Web; **Cloudflare** cho R2, Turnstile, thống kê truy cập, tên miền; Workers chỉ cho tải ZIP sau này | ✅ Đã chốt |
| D12 | Gói Cloudflare đang dùng | Giới hạn Workers / R2 / Access | **Free**; nâng cấp khi chạm một trong các ngưỡng: R2 > 10 GB hoặc vượt hạn mức thao tác miễn phí; Workers > 100.000 request/ngày hoặc vượt giới hạn CPU khi ghép ZIP (Workers Paid); Access > 50 người dùng | ✅ Đã chốt |
| D13 | Cài Docker Desktop (WSL2) để chạy Supabase local làm môi trường `dev` | Giai đoạn 0–1, Mục 2 | **Cài Docker Desktop** (máy 16 GB RAM, đã có WSL2); chỉ bật khi phát triển. Cài ở bước đầu Giai đoạn 0 | ✅ Đã chốt |
| D14 | Chính sách tải PDF trên web công khai | Mục 7, 7.1 | Khách: chỉ tải bài OA có giấy phép mở; bài Bronze / không rõ giấy phép: chỉ link OA gốc + DOI; bài không OA: chỉ link DOI. Chủ dự án: tải mọi bài | ✅ Đã chốt |
| D15 | Model làm trọng tài | — | Không còn trọng tài trong v3.8 (chỉ một lượt trích xuất). Nếu sau này bật lại thì dùng Gemini | ⛔ Không áp dụng (v3.8) |
| D16 | Nguồn trích xuất (thứ tự ưu tiên từ 22/10/2026: tác tử Claude → Codex → Antigravity → Gemini API; xem CLAUDE.md và Mục 6.11) | Mục 4.5, 6.9, bước 1b.7–1b.8 | **Chủ dự án đổi hướng 19/10/2026 (chi phí Gemini API cao): nguồn chính là Codex / Antigravity** (ChatGPT web cho bài có bảng dạng ảnh) đọc PDF theo gói việc do hệ thống xuất và trả JSON; **Claude Code nhập (`manual import`), kiểm tra, publish lên web**; đi qua cùng các lớp đối chiếu và huy hiệu; `model_name` = `manual:<công cụ>:<model>`, không tính vào ngân sách D6. **Gemini API là dự phòng** (đã dựng sẵn, trần D6). Điều kiện: thử khả thi 1b.7 đạt tiêu chí Mục 6.9, chưa đạt thì dừng hỏi chủ dự án | ✅ Đã chốt hẳn (20/10/2026, bước 1b.6): **Codex là nguồn chính**; Antigravity hoãn thử lại với model mạnh |
