# Giao diện, truy cập & bản quyền

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

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

**Tuyên bố trách nhiệm** hiển thị ở chân mọi trang và trong mọi file xuất: *"Dữ liệu do AI trích xuất, chỉ để tham khảo. Người dùng có trách nhiệm đối chiếu với bài gốc trước khi sử dụng trong nghiên cứu."* (Mục 6.8)

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

> **Tình trạng (bước 3b.1, 23/10/2026):** đã làm trang `/library` với ô tìm (tên bài, tác giả không phân biệt dấu, tạp chí, DOI), bộ lọc nhiều lựa chọn kèm số bài (năm theo thập niên, loại bài, thiết kế, loại mẫu, quốc gia), tỷ lệ trường ⚠ (tối đa 10% hoặc 25%), có ma trận tương quan; số bài mỗi giá trị tính theo các bộ lọc còn lại; bộ lọc nằm trong URL (form GET, không cần JavaScript); thẻ bài có **Copy APA** (tạo từ metadata) và liên kết **DOI**. **Chưa làm:** lý thuyết nền, miền nghiên cứu, ngành, B2B/B2C, xếp hạng tạp chí, OA (database chưa có dữ liệu cho các mục này), Copy citekey, gợi ý tự động khi gõ.

### 8.2b. Tìm theo mối quan hệ giữa hai biến (Relationship Search) (MỚI)
Trả lời trực tiếp câu hỏi cốt lõi số 1: *"Mối quan hệ giữa biến A và biến B đã được nghiên cứu thế nào?"*

> **Tình trạng (bước 3a.1, 20/10/2026):** đã làm bản đầu ở trang chủ `/` (thư viện chuyển sang `/library`): ô Biến A / Biến B với gợi ý tự động, chiều, vai trò (trực tiếp / qua trung gian / có điều tiết / tất cả), tên gọi tương đương, lọc theo kết quả giả thuyết và chiều tác động, tính cả ⚠, thanh tổng hợp "trong kho", dòng "không được tính" kèm thiết kế và nhắc thiên lệch khi quá 20%, danh sách nhóm theo bài (nhãn "Kết quả khác nhau giữa các study"), bấm vào kiểm định để mở bài đúng trường, URL chia sẻ được, trạng thái trống, số liệu viết theo APA 7. **Tìm theo tên biến tác giả dùng** (mọi từ gõ phải có trong tên), thêm khái niệm chuẩn và tên khác khi bật tên gọi tương đương, vì mới 4/410 đường dẫn ánh xạ về khái niệm chuẩn. **Chưa làm:** "chỉ ánh xạ độ tin cậy cao", "bao gồm các thành phần", các facet của Thư viện, loại hiệu ứng và thước đo, sắp xếp, xuất bảng (3a.4), copy câu tổng hợp, ghi lại truy vấn tự do không có kết quả, bài bị rút / lỗi thống kê / tạp chí bị gắn cờ.

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
* **Tính cả ⚠:** mặc định thanh tổng hợp chỉ tính kiểm định ✓ hoặc ★; bật công tắc này thì tính cả ⚠.
* **Luôn hiện số kiểm định không được tính** ngay dưới thanh tổng hợp, kèm lý do và phân theo loại thiết kế, VD: "37 kiểm định được tính · **6 kiểm định có ⚠, không tính** (4 thuộc bài thực nghiệm nhiều Study)". Bấm vào là xem danh sách. Nếu tỷ lệ không được tính của cặp quan hệ vượt khoảng 20%, hiện dòng nhắc "kết quả có thể thiên về các nghiên cứu đơn giản" kèm nút "Tính cả ⚠". Lý do: bài phức tạp (nhiều Study, SEM nhiều đường, PDF scan) dễ mang ⚠ hơn, nên loại ⚠ một cách âm thầm sẽ làm lệch kết quả.
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
> **Tình trạng (bước 3a.2, 20/10/2026):** đã làm thanh chia kéo được (chuột hoặc phím mũi tên trái / phải, Home / End; 25–75%, mặc định 45%, ghi nhớ trong trình duyệt), bảy tab (Tổng quan, Lý thuyết, Study & Mẫu, Đo lường, Kết quả, Tương quan, Đóng góp & Khoảng trống) kèm số trường, **huy hiệu theo phần** ("Kết quả: 18/20 đã kiểm chứng", hoặc "◇ n mục AI diễn giải" cho phần toàn diễn giải), bảng **"Vì sao ✓ / ⚠ / ◇"** (kiểm tra chưa qua đứng đầu; trường diễn giải nói rõ máy không kiểm được) kèm nút "Mở trong PDF", dòng ngữ cảnh khóa tự nhiên dưới tên trường, và liên kết từ Relationship Search mở đúng tab và đúng kiểm định. **Bước 3a.3 (20/10/2026):** PDF mở bằng trình xem nhỏ gọn dùng pdf.js (trang trước / sau, ô nhập trang, thu phóng 50–300%, công tắc "Tô sáng", liên kết "Mở bằng trình xem của trình duyệt"). Bấm một giá trị thì mở đúng trang và **tô khung vàng quanh đúng câu trích / dòng bảng** (mỗi dòng chữ một khung; bảng xoay ngang cho khung đứng). Vị trí khung do worker tính lúc đăng (`extracted_fields.highlight` = trang + các hình chữ nhật theo điểm PDF) với cùng độ dung sai như kiểm tra câu trích (không phân biệt hoa thường, dấu câu, dấu gạch nối cuối dòng; khớp gần ≥ 90% từ). **Không xác định được vị trí** thì mở đúng trang, không vẽ khung và hiện dòng "Không xác định được vị trí câu trích trên trang; hãy tự tìm câu trích hiển thị bên trái" — không đoán. Bấm lại giá trị đang chọn đưa PDF về trang của nó. **Chưa làm:** đồng bộ hai chiều khi bôi đen trong PDF, nút Báo lỗi.
* Thanh chia kéo được (mặc định 45/55, ghi nhớ lựa chọn).
* Bên trái: pdf.js qua Signed URL; không có quyền thì hiển thị abstract + link DOI.
* Bên phải theo tab: Tổng quan | Lý thuyết | Study & Mẫu | Đo lường | Kết quả | Tương quan | Đóng góp & Khoảng trống.
* **Bấm để kiểm tra (tính năng số 1):** mọi con số và mọi câu đều bấm được; PDF nhảy đến đúng trang và **tô sáng đúng câu / ô bảng**. Mục tiêu: người dùng tự kiểm tra một giá trị trong vài giây.
* **Bảng "Vì sao ✓"**: bấm vào huy hiệu của bất kỳ trường nào thì mở bảng nhỏ liệt kê các kiểm tra đã qua / chưa qua (lấy từ `check_results`), VD:
  ```
  β = −.31 (H2, Study 1)                         ✓ Đã kiểm chứng tự động
   ✓ Số −.31 xuất hiện trên trang 1252 (Table 3, hàng PR → PI)
   ✓ p tính lại từ t = 4.12, df = 408 khớp với p < .001
   ✓ Kết quả "Supported" khớp với p và chiều tác động
   [Mở trong PDF]
  ```
  Với ⚠, bảng ghi rõ kiểm tra nào chưa qua và vì sao, để người dùng biết chính xác cần xem gì.
* Đồng bộ hai chiều: bôi đen một đoạn trong PDF thì hiện các trường trích từ đoạn đó.
* **Huy hiệu tin cậy ở cấp phần** (VD: "Kết quả: 18/20 đã kiểm chứng"); bấm vào mới xem chi tiết từng trường. Nút **Báo lỗi** (khách dùng được, có Turnstile chống spam) trên từng trường.

### 8.4. Ma trận tổng hợp Master-Detail

> **Tình trạng (bước 3b.2, 23/10/2026):** đã làm trang `/matrix` (liên kết "Ma trận" ở đầu trang): mỗi bài một dòng (tác giả và năm, tối đa 3 lý thuyết kèm vai trò, thiết kế và mẫu theo Study, kết quả chính), bấm "Xem kiểm định theo Study" để mở bảng kiểm định (giả thuyết, quan hệ có biến trung gian / điều tiết, β kèm CI 95% và p theo APA 7, R², trạng thái, số trang in, liên kết mở đúng bằng chứng); dùng chung bộ lọc với Thư viện; cột đầu cố định khi cuộn ngang. "Kết quả chính" chỉ đếm kiểm định giả thuyết ✓ / ★, kiểm định ⚠ nêu riêng "không đếm". **Chưa làm:** chọn cột, saved views, chỉnh mật độ, copy câu học thuật, xuất Word và Excel (bước 3b.3), dạng thẻ riêng cho điện thoại (hiện cuộn ngang). Trang nặng khoảng 0,9 MB HTML (0,25 giây ở bản production); khi đưa lên mạng cần nạp chi tiết từng bài theo yêu cầu.
* Dòng chính: Tác giả & Năm | Lý thuyết | Thiết kế & Mẫu (n, quốc gia) | Kết quả chính.
* Dòng mở rộng: đường quan hệ theo Study với estimate (kèm `estimate_type`), CI, p, R², trạng thái, câu trích và số trang.
* Cố định cột đầu; chọn cột; **saved views**; chỉnh mật độ hiển thị.
* Mã trạng thái luôn có biểu tượng kèm màu: ✓ Supported (xanh ngọc dịu) · ✗ Not supported (xám đá) · ◐ Partially / Mixed (vàng hổ phách) · ○ Not hypothesized (viền xám).
* Copy câu học thuật (bản nháp), chỉ với dữ liệu `auto_verified` / `human_reviewed`.
  *Ví dụ: "Perceived ease of use positively affects intention to use (β = .35, p < .001; Nguyen et al., 2023, p. 1252)."*
* Xuất **Excel** (`exceljs`) và **Word** (`docx`) theo bảng APA 7: số bảng in đậm, tiêu đề in nghiêng, ba đường kẻ ngang, phần *Note.*, Times New Roman 12. **Mọi file xuất** kèm cột huy hiệu tin cậy, số trang in của bằng chứng, và dòng tuyên bố trách nhiệm (Mục 6.8).
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
