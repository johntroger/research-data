# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT PLAN - VERSION 2.0)
## HỆ THỐNG CƠ SỞ DỮ LIỆU & TỔNG QUAN TÀI LIỆU KHOA HỌC CHUẨN MỰC Q1
*(Academic Literature Matrix & Research Knowledge Base for Behavioral Science, Management & Marketing)*

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Tuyên ngôn Sứ mệnh (Mission Statement)
Xây dựng một hệ thống cơ sở dữ liệu học thuật tự động hóa chuyên sâu cho các ngành **Khoa học Hành vi, Quản trị kinh doanh, Marketing và Kinh tế**, có khả năng:
* Phân tách sâu toàn văn bài báo khoa học (Full-text Native PDF extraction) bằng **Gemini API** với chi phí tối ưu (tận dụng API key cá nhân).
* Lưu trữ và chia sẻ tệp PDF gốc vĩnh viễn trên **Cloudflare R2** với chi phí băng thông 0đ (Zero Egress Fee).
* Cung cấp giao diện Web công khai trên **Vercel** giúp mọi người tra cứu, lọc đa chiều, xem ma trận tổng quan lý thuyết (Synthesis Matrix), đối chiếu mâu thuẫn thực nghiệm (Consensus vs. Conflict), và trích dẫn chính xác 100% không bịa nguồn (Zero Hallucination).
* Hỗ trợ quy mô mở rộng bền vững từ **1 bài đến hơn 5.000 bài báo** mà không bị gián đoạn hay nghẽn hệ thống.

### 1.2. Mục tiêu Định lượng (KPIs & Metrics)
* **Độ chính xác trích xuất:** 100% trích dẫn kết quả, định nghĩa biến số và giả thuyết phải có **số trang (`evidence_page`)** và **đoạn văn nguyên bản (`exact_quote`)**.
* **Độ sâu học thuật:** Hỗ trợ bài báo đa nghiên cứu thực nghiệm (Multi-study experimental designs: Study 1, 2, 3...), bóc tách rõ Cơ chế tâm lý trung gian (Mediators), Điều kiện biên (Moderators), và chỉ số Effect Size ($R^2, \beta, f^2$).
* **Hiệu năng Web (Vercel):** Thời gian phản hồi trang $< 0.8$ giây; tải danh sách bài báo và lọc đa tiêu chí $< 100$ms trên quy mô hàng nghìn bài.
* **Chi phí vận hành:** Tối đa hóa các gói miễn phí (Vercel Free Tier, Cloudflare R2 Free Tier 10GB, Gemini Flash Tier, Database Free Tier). Tổng chi phí cố định: **0 VNĐ/tháng**.

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ LUỒNG DỮ LIỆU (DATA ARCHITECTURE 2.0)

```
[1. Bạn thả PDF vào thư mục raw_papers/ hoặc Zotero] 
                       │
                       ▼
[2. Claude Code Resumable Batch Worker] 
  ├─ Quét trạng thái: Tự động bỏ qua bài đã phân tích (Idempotent)
  ├─ Điều tiết tốc độ (Rate Limiter: tránh lỗi 429 quá tải API)
  ├─ Gọi Google Gemini API (Native PDF + JSON Schema)
  │      └── Trích xuất JSON cấu trúc chuẩn Q1 (Multi-study & Effect Size)
  ├─ Tự động Upload file PDF gốc lên Cloudflare R2 ──► Sinh Public URL tải miễn phí
  └─ Ghi dữ liệu JSON + Public URL vào Cloud Database (Supabase PostgreSQL / Cloudflare D1)
                       │
                       ▼
[3. Vercel Web App (Next.js App Router)]
  ├─ Server-side Pagination & Hybrid Search (Lọc SQL + Tìm kiếm ngữ nghĩa Vector)
  ├─ Tải dữ liệu siêu tốc (< 100ms), không bao giờ bị timeout build
  │
  ▼
[4. Trải nghiệm Người Dùng Chuyên Sâu]
  ├─ Bảng Ma trận Thu gọn/Mở rộng (Master-Detail Matrix)
  ├─ Split-Screen: Đọc PDF từ Cloudflare R2 song song với Trích xuất cấu trúc
  ├─ Bộ phát hiện Mâu thuẫn Thực nghiệm (Consensus vs. Conflict Engine)
  └─ Xuất 1-Click: Word chuẩn bảng APA 7th & Copy câu học thuật kèm số trang
```

---

## 3. THIẾT KẾ SCHEMA DỮ LIỆU HỌC THUẬT CHUẨN Q1 (DATA SCHEMA SPECIFICATION 2.0)

Dữ liệu được tổ chức thành 7 phân hệ thực thể nâng cao:

| Phân hệ | Các trường thông tin cốt lõi | Ý nghĩa học thuật Q1 |
| :--- | :--- | :--- |
| **1. Metadata & Citation** | `paper_id`, `title`, `authors`, `year`, `journal`, `doi`, `apa_citation`, `bibtex`, `pdf_url` | Nhận dạng pháp lý, chuẩn hóa APA 7th và trích dẫn tự động vào Zotero/EndNote/LaTeX. |
| **2. Khung Lý thuyết (Theory)** | `meta_theory` (Lý thuyết bao trùm, VD: TPB, RBV, Signaling Theory), `conceptual_framework` (Mô hình thao tác), `application_role`, `evidence_page` | Căn cứ xây dựng khung lý thuyết; phân biệt lý thuyết mẹ và mô hình mượn biến. |
| **3. Khái niệm & Đo lường** | `construct_name`, `definition`, `scale_source`, `scale_type` (Reflective vs. Formative), `exact_quote`, `evidence_page` | Đảm bảo tính nhất quán của định nghĩa thao tác và bản chất cấu thành thang đo. |
| **4. Thiết kế Nghiên cứu & Multi-Study** | `research_type` (Survey, Lab/Field Experiment, Secondary Data), `studies: [...]` (mảng các Study 1, 2, 3 nếu có), `manipulation_check`, `context` (quốc gia, ngành, B2B/B2C), `cmb_control` (Kiểm soát sai lệch phương pháp chung) | Bao quát toàn diện các bài báo thực nghiệm hành vi nhiều giai đoạn (đặc trưng Q1). |
| **5. Cơ chế & Giả thuyết** | `code` (H1, H2...), `iv`, `dv`, `mediators` (Cơ chế tâm lý giải thích: *Tại sao?*), `moderators` (Điều kiện biên: *Khi nào?*), `status` (Supported/Rejected), `effect_size` ($R^2, \beta, p, f^2$) | Phân tích sâu cơ chế tâm lý và điều kiện biên, đo lường độ lớn tác động thực tế. |
| **6. Đóng góp & Khoảng trống** | `contribution_typology` (Tạo lý thuyết mới / Mở rộng bối cảnh / Hòa giải mâu thuẫn), `theoretical_contributions`, `practical_implications`, `limitations`, `future_directions` | Cung cấp luận cứ sắc bén và mỏ vàng tìm kiếm **Research Gap** phục vụ bài báo mới. |
| **7. Bằng chứng Neo (Evidence)** | `quote_snippets`, `anchor_page` | Chống hallucination, minh bạch tuyệt đối khi đối chiếu văn bản gốc. |

---

## 4. THIẾT KẾ TRẢI NGHIỆM GIAO DIỆN HỌC THUẬT (UI/UX SPECIFICATION 2.0)

Giao diện Web triển khai trên Vercel tuân thủ phong cách **Tối giản học thuật (Clean Academic Deep-Work Workspace)**:

### 4.1. Dashboard Khám Phá & Lọc Đa Chiều (Faceted Library)
* **Thanh tìm kiếm Hybrid:** Tìm theo từ khóa chính xác (Keyword) hoặc tìm kiếm theo ý niệm học thuật (Semantic Vector Search).
* **Bộ lọc chuyên sâu bên trái (Sidebar Filter):**
  * *Khoảng năm:* 2018 – 2026.
  * *Lý thuyết nền:* TPB, TAM, RBV, Social Exchange Theory, Conservation of Resources...
  * *Thiết kế nghiên cứu:* Khảo sát (Survey), Thực nghiệm (Experiment: Study 1, 2, 3), Dữ liệu thứ cấp.
  * *Công cụ phân tích:* PLS-SEM (SmartPLS), CB-SEM (AMOS), ANOVA/ANCOVA, Hồi quy.
  * *Bối cảnh:* Việt Nam, Châu Á, Toàn cầu; TMĐT, Du lịch, Bán lẻ, Công nghệ.
* **Bảng danh sách bài báo:** Hiển thị thẻ thông tin gọn gàng, trạng thái kiểm định, nút **"Copy APA"**, nút **"Xem chi tiết"**, và nút **"Tải PDF gốc"** (tải thẳng từ Cloudflare R2).

### 4.2. Không Gian Soi Trích Dẫn Chia Đôi (Split-Screen Evidence Workspace)
* **Cửa sổ trái (45%):** Trình đọc PDF bản gốc nhúng trực tiếp từ Cloudflare R2.
* **Cửa sổ phải (55%):** Thẻ thông tin trích xuất có cấu trúc (Lý thuyết, Biến số, Giả thuyết, Số liệu).
* **Tính năng Anchor Click:** Khi bấm vào bất kỳ giả thuyết nào bên phải, khung PDF bên trái lập tức cuộn đến đúng trang chứa bảng kết quả và đánh dấu vị trí.

### 4.3. Bảng Ma Trận Thu Gọn / Mở Rộng (Master-Detail Synthesis Matrix)
* **Dòng chính (Master row):** Hiển thị gọn gàng: Tác giả & Năm | Lý thuyết | Phương pháp & Mẫu | Kết quả tổng quan.
* **Dòng mở rộng (Expandable Accordion):** Bấm `+` để xem danh sách chi tiết từng giả thuyết, các biến điều tiết, cỡ mẫu từng Study, kèm giá trị $\beta, p, R^2$.
* **Mã màu trực quan (Color Coding):**
  * *Supported:* Xanh ngọc dịu (Emerald muted).
  * *Rejected:* Đỏ san hô nhạt (Coral muted).
  * *Partially Supported:* Vàng hổ phách (Amber muted).
* **Nút bấm 1-Click Formatted Copy:**
  * Copy đoạn văn học thuật hoàn chỉnh kèm trích dẫn:  
    *Ví dụ: "Perceived Ease of Use has a significant positive impact on Intention to Use ($\beta = 0.35, p < 0.001$; Nguyen et al., 2023, p. 12)."*
  * Dán thẳng vào bản thảo bài báo Word mà không cần gõ lại.
* **Xuất bảng:**
  * Xuất file **Excel (.xlsx)**.
  * Xuất file **Word (.docx)** định dạng chuẩn **Bảng APA 7th** (3 đường kẻ ngang chuẩn mực, font Times New Roman).

### 4.4. Công Cụ Đối Chiếu Mâu Thuẫn Thực Nghiệm (Consensus & Conflict Engine)
* Nhập 1 cặp mối quan hệ (Ví dụ: `Perceived Risk` $\rightarrow$ `Purchase Intention`):
  * **Cột Đồng thuận (Consensus):** Các bài báo chứng minh tác động âm có ý nghĩa thống kê.
  * **Cột Tranh cãi / Không có ý nghĩa (Conflict / Non-significant):** Các bài báo kết luận không có ý nghĩa hoặc điều kiện biên làm mất tác động.
  * Chỉ ra ngay bối cảnh khác biệt giữa 2 luồng quan điểm để làm **Research Gap** đắt giá.

---

## 5. LỘ TRÌNH THỰC HIỆN 5 GIAI ĐOẠN (ROADMAP & PHASES)

### 📍 Giai đoạn 1: Bộ máy Trích xuất Học thuật & Hàng đợi Thông minh (Local Worker)
* **Nhiệm vụ:**
  1. Viết bộ `schema.js` phiên bản 2.0 (Hỗ trợ Multi-study, Mediators, Moderators, CMB, Effect size).
  2. Xây dựng kịch bản `extract_paper.js` có tính năng:
     * Quét tệp PDF trong `raw_papers/`.
     * Kiểm tra trạng thái bài báo trong Database/Manifest (bỏ qua bài đã trích xuất, hỗ trợ chạy nối tiếp nếu rớt mạng).
     * Điều tiết tốc độ gọi (Rate Limiting) để tránh lỗi 429 từ Gemini API.
     * Trích xuất nguyên văn `exact_quote` và số trang `evidence_page`.

### 📍 Giai đoạn 2: Thiết lập Đám mây (Cloudflare R2 & Database Cloud)
* **Nhiệm vụ:**
  1. Cấu hình Bucket trên **Cloudflare R2** với quyền truy cập Public/Custom Domain để người dùng tải PDF miễn phí vĩnh viễn.
  2. Khởi tạo Cơ sở dữ liệu Cloud (**Supabase PostgreSQL** hoặc **Cloudflare D1**) với bảng dữ liệu có index tối ưu cho tìm kiếm hàng nghìn bài.
  3. Hoàn thiện script tự động: Upload PDF lên Cloudflare R2 $\rightarrow$ Nhận link tải $\rightarrow$ Lưu toàn bộ dữ liệu vào Database.

### 📍 Giai đoạn 3: Phát triển Ứng dụng Web Next.js (Local Frontend)
* **Nhiệm vụ:**
  1. Dựng khung dự án Next.js (App Router, Tailwind CSS, shadcn/ui).
  2. Phát triển giao diện Dashboard lọc đa chiều (Faceted Library) kết nối Database.
  3. Xây dựng giao diện Split-Screen (trình đọc PDF Cloudflare R2 bên trái, thẻ dữ liệu bên phải).
  4. Xây dựng Bảng Ma trận Thu gọn/Mở rộng (Master-Detail Matrix) và công cụ xuất file Word chuẩn APA / Excel.

### 📍 Giai đoạn 4: Đẩy lên GitHub & Triển khai Tự động lên Vercel
* **Nhiệm vụ:**
  1. Tạo repository GitHub cá nhân để quản lý mã nguồn (chỉ chứa source code, không chứa PDF nặng hay JSON thô).
  2. Liên kết GitHub với Vercel Project, cấu hình các biến môi trường kết nối Database.
  3. Kiểm tra tính năng Server-Side Rendering (SSR) trên Vercel: đảm bảo web tải dưới 100ms mà không bị giới hạn build time.

### 📍 Giai đoạn 5: Kiểm thử Thực tế & Hoàn thiện Quy trình Vận hành
* **Nhiệm vụ:**
  1. Thử nghiệm trích xuất thực tế với 5–10 bài báo Q1 đa dạng thể loại (bài khảo sát, bài thực nghiệm nhiều study).
  2. Kiểm tra tính năng đồng bộ, tải PDF từ Cloudflare, và xuất bảng Word APA.
  3. Đóng gói quy trình "1 bước": Người dùng chỉ việc bỏ PDF vào thư mục, chạy 1 lệnh là toàn bộ hệ thống trên Vercel tự động cập nhật.

---

## 6. QUY TẮC QUẢN TRỊ RỦI RO & BẢO TOÀN DỮ LIỆU (RISK MANAGEMENT)

1. **Rủi ro Rate-limit API (Lỗi 429):** Hàng đợi xử lý có cơ chế nghỉ ngơi có điều tiết (Delay/Backoff) giữa các lượt gọi file PDF.
2. **Rủi ro Đứt quãng đường truyền:** Trạng thái xử lý được lưu vết từng bài (`COMPLETED`, `PENDING`, `FAILED`), cho phép tiếp tục công việc bất cứ lúc nào mà không bị trùng lặp hay tốn lại token.
3. **Rủi ro Bản quyền bài báo:** Cloudflare R2 có thể cấu hình URL tải trực tiếp hoặc liên kết tạm thời (Signed URLs) tùy nhu cầu chia sẻ công khai hay nội bộ nhóm nghiên cứu.
4. **Rủi ro Giới hạn Miễn phí:** Tách rời hoàn toàn web frontend trên Vercel khỏi dữ liệu nặng, đảm bảo duy trì vĩnh viễn chi phí **0 VNĐ**.
