# Kiểm soát chất lượng

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

## 6. KIỂM SOÁT CHẤT LƯỢNG (CÔNG CỤ THAM KHẢO)

**Định vị (v3.8):** đây là **công cụ hỗ trợ tham khảo**. Người dùng **có trách nhiệm tự đối chiếu với bài gốc** trước khi dùng dữ liệu trong nghiên cứu. Vì vậy mục tiêu kiểm soát chất lượng là:
1. **Đủ chính xác để tham khảo có ích**, với chi phí thấp;
2. **Giúp việc tự kiểm tra nhanh nhất có thể** (bấm một lần là thấy bằng chứng trong PDF);
3. **Nói rõ chỗ nào không chắc.**

Không ai phải đọc bài, mã hóa hay duyệt. Dây chuyền chỉ gồm **một lượt trích xuất bằng AI** và **các lớp kiểm tra bằng máy** (không dùng AI, gần như không tốn tiền).

```
PDF ─► [A] Trích xuất một lượt (Gemini Pro) ─► [B] Máy đối chiếu với PDF ─► [C] Kiểm tra chéo trong bài
                                                                                   │
                                                  [D] Huy hiệu tin cậy ◄────────────┘
                                                        ├─ ✓ đã kiểm chứng tự động
                                                        ├─ ⚠ có vấn đề, nên xem kỹ
                                                        ├─ ◇ AI diễn giải (tham khảo)
                                                        └─ ẩn với khách (không khớp PDF)
```

### 6.1. Sổ mã hóa (Codebook)
* **Bản hiện hành:** [docs/codebook.md](codebook.md) (v1.0.0). Kiểm tra độ phủ bằng `pnpm codebook:check`.
* Định nghĩa vận hành từng trường, **tầng T1/T2/T3**, danh mục giá trị cho phép, quy tắc xử lý tình huống mơ hồ, ví dụ đúng/sai.
* **Claude Code soạn**, dựa trên các tài liệu phương pháp ở Mục 12; chủ dự án đọc lướt (khoảng 1–2 giờ, một lần) để sửa định nghĩa khái niệm và lý thuyết của miền.
* Là đầu vào trực tiếp cho prompt; có `codebook_version` và nhật ký thay đổi.

### 6.2. Lớp A: Trích xuất một lượt
* **Nguồn trích xuất (D16, từ 19/10/2026):** chính là tác tử Codex / Antigravity làm trên gói việc (Mục 4.5, kiểm thử ở 6.9); Gemini API là dự phòng. Mọi lớp B–D bên dưới giống nhau cho cả hai nguồn, vì chúng chỉ nhìn vào dữ liệu và PDF.
* Với Gemini: mỗi bài trích **một lần** bằng `GEMINI_MODEL_STRONG` (Pro), gồm Pass 1 (cấu trúc, danh mục Study / giả thuyết / bảng) và Pass 2 (chi tiết từng Study), như Mục 4.2.
* Trường T3 (vai trò lý thuyết, loại đóng góp, loại khoảng trống) trích cùng lượt, gắn nhãn **◇ AI diễn giải**.
* Mỗi giá trị phải kèm **bằng chứng**: trang, câu trích hoặc vị trí trong bảng (`table_id`, hàng, cột).

### 6.3. Lớp B: Máy đối chiếu với PDF (không dùng AI)

| Loại dữ liệu | Phương pháp kiểm chứng |
| :--- | :--- |
| Câu văn (định nghĩa, giả thuyết, hạn chế) | Fuzzy match với text của trang được ghi (cho phép lệch ±1 trang), ngưỡng ≥ 0,90. **Từ bị ngắt dòng bằng gạch nối** được nối lại ở cả hai phía ('per-
ceive', 'experi- ence', 'gratifica - tions' đều thành một từ); phép so "không tính khoảng trắng" cũng bỏ gạch nối ('ano-nymized' và 'ano - nymized' khớp nhau); hợp từ thật ('long-term') giữ nguyên gạch nối |
| Số liệu (β, p, n, α…) | Tìm đúng chuỗi số trên trang được ghi, chấp nhận các dạng `.35` / `0.35` / `0,35` / `< .001` |
| Bảng (ma trận tương quan, bảng kết quả) | Số có xuất hiện trên trang; nhất quán nội tại (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE nếu có) |
| Bảng điều kiện thực nghiệm (`condition_cells`) | Số có xuất hiện trên trang; SD > 0; M nằm trong khoảng thang đo |
| Kiểm tra logic chung | p ∈ [0,1]; n > 0; CI chứa estimate; `status` nhất quán với p và chiều tác động |
| PDF scan không có text layer | Gắn cờ `needs_ocr`; mọi trường T1/T2 của bài mang ⚠ |

* **Độ đầy đủ (chống bỏ sót; từ 1b.4 mã họ như H1 được coi là có kết quả khi có đường dẫn mang mã con H1a, H1b…, còn H10 không phải con của H1):** quét text tìm mọi mã giả thuyết (`H\d+[a-z]?`) và tiêu đề bảng (`Table \d+`), so với danh mục của Pass 1. Mục nào thiếu thì **tự động trích bổ sung riêng mục đó** (một lời gọi nhỏ); vẫn thiếu thì ghi rõ "bài có H5 nhưng chưa trích được" để người dùng biết mà xem.
* **Tính lại thống kê (kiểu statcheck, Nuijten et al., 2016):** p từ t / F / z / χ² và df; t từ β và SE; SE từ CI; t / F từ M, SD, n. Lệch lớn, nhất là khi kết luận ý nghĩa bị đảo, thì gắn ⚠. Nếu giá trị khớp PDF mà vẫn lệch khi tính lại, ghi **"có thể là lỗi của bài gốc"**.
* **Metadata** lấy từ Crossref / Zotero, không để AI sinh.
* **Xác định `printed_page`** (lưu kèm `printed_page_method`), theo thứ tự: (1) PDF `/PageLabels`; (2) dãy số trang nhất quán tìm thấy ở header/footer (bằng code, bỏ qua năm / số tập); (3) trang đầu theo Crossref cộng độ lệch; (4) Gemini đọc số trang ở header/footer (chỉ khi 3 cách trên không có kết quả); (5) cuối cùng là số thứ tự trang PDF. Annotation Zotero (`annotationPageLabel`) dùng để đối chiếu khi có.
* **Đọc text layer:** tách bố cục hai cột (đọc hết cột trái rồi mới sang cột phải; nhận ra khe giữa cả khi hẹp dưới 12 pt, và đặt tiêu đề chạy trước hai cột); đưa vài đoạn chữ xoay dọc ở lề (watermark "Downloaded from…" của nhà xuất bản) ra khỏi nội dung; còn **bảng in ngang** (từ 20 mảnh chữ xoay 90° và 150 ký tự trở lên) được xoay lại toạ độ để đọc như trang thường, theo cả hai chiều xoay.

### 6.4. Lớp C: Kiểm tra chéo trong cùng bài (không dùng AI)
* n ở phần phương pháp = n trong bảng (khi áp dụng được).
* Quan hệ chỉ có một biến dự báo: β chuẩn hóa ≈ r trong ma trận tương quan.
* α, CR ∈ [0, 1]; AVE ≤ 1; √AVE trên đường chéo khớp với AVE báo cáo.
* Tổng n các ô điều kiện thực nghiệm = n của Study (sau loại mẫu).
* Vi phạm thì gắn ⚠ cho các trường liên quan, kèm lý do.

### 6.5. Lớp D: Huy hiệu tin cậy

| Ký hiệu | Trạng thái | Điều kiện | Hiển thị |
| :--- | :--- | :--- | :--- |
| **✓** | `auto_verified` | Qua Lớp B và Lớp C | Tính vào con số tổng hợp |
| **⚠** | `needs_attention` | Qua Lớp B nhưng có vấn đề ở Lớp C, lỗi thống kê, thiếu mục, PDF scan, hoặc khớp PDF chưa chắc | Hiển thị; **không tính** vào con số tổng hợp mặc định (bật công tắc để tính) |
| **◇** | `ai_interpreted` | Trường T3: nhận định của AI, không thể kiểm chứng tự động | Hiển thị kèm nhãn "AI diễn giải, tham khảo" |
| *(ẩn)* | `hidden` | Không khớp PDF (câu trích / con số không tìm thấy trên trang) | **Ẩn với khách**; quản trị vẫn thấy |
| **★** | `human_reviewed` | Chủ dự án đã sửa / xác nhận (tùy chọn, Mục 6.7) | Bị khóa, không bị ghi đè |
| **⚑** | `disputed` | Có báo lỗi từ người dùng | Hiển thị cho đến khi xử lý |

Mỗi huy hiệu bấm được để mở bảng **"Vì sao ✓"** (Mục 8.3): liệt kê các kiểm tra đã qua / chưa qua và nút mở bằng chứng trong PDF.

### 6.6. Kiểm thử kỹ thuật & theo dõi
* **Bộ bài giả lập có đáp án sẵn:** Claude Code tạo PDF giả với số liệu biết trước, nhiều kiểu trình bày (một cột, hai cột, bảng xoay, chú thích dấu sao), phủ cả β, p, r, trung gian, điều tiết, ô điều kiện thực nghiệm. Dùng để kiểm thử pipeline mỗi khi đổi prompt / schema / model. Dữ liệu tự tạo nên commit được vào repo public.
* **Theo dõi đơn giản** ở `/admin/quality`: tỷ lệ ✓ / ⚠ / ẩn theo thời gian và **theo loại thiết kế** (survey, thực nghiệm, nhiều Study), số báo lỗi từ người dùng, chi phí mỗi bài.
* **Khi Google ngừng model:** chạy bộ bài giả lập với model mới và so tỷ lệ ✓ / ⚠ trên 20 bài thật trong kho; không xấu đi rõ rệt thì chuyển. Mỗi lượt chạy ghi phiên bản model cụ thể.
* **Nâng cấp có chọn lọc:** nếu thấy một loại trường sai nhiều (VD: ma trận tương quan), có thể bật lại riêng cho loại đó các cơ chế đã thiết kế ở v3.7 (trích xuất kép, đọc bảng hai kênh, trọng tài; xem `PROJECT_PLAN_v3.7_backup.md`, Mục 6). Kiến trúc để sẵn chỗ cho việc này.

### 6.7. Sửa tay (tùy chọn) & báo lỗi
* Khi đăng nhập quản trị, mỗi trường có nút **✎** để sửa trực tiếp; trường đã sửa chuyển sang ★ và được **khóa**.
* **Khóa tự nhiên ổn định:** mỗi trường gắn với một khóa không phụ thuộc mã tự sinh, ví dụ đường quan hệ là `DOI + study_label + hypothesis_code + biến độc lập + biến phụ thuộc + loại hiệu ứng`. Trích xuất lại thì chỗ đã sửa được áp lên dòng mới có cùng khóa; không tìm thấy thì ghi vào danh sách "Cần chú ý", không mất âm thầm.
* Mỗi lần sửa lưu giá trị trước / sau vào `review_changes`; hoàn tác được.
* Người dùng (khách) có nút **Báo lỗi** (có Turnstile chống spam); báo lỗi gom vào `/admin/attention` để chủ dự án xem khi muốn.
* Khi đăng nhập quản trị, đầu trang có dải màu **"Chế độ quản trị"**.

### 6.8. Trách nhiệm người dùng & liêm chính học thuật
* **Tuyên bố trách nhiệm** hiển thị ở **chân mọi trang**, trên trang "Giới thiệu & cách đọc dữ liệu", và **trong mọi file xuất** (Excel, Word, `.bib`, `.ris`):
  > *"Dữ liệu do AI trích xuất, chỉ để tham khảo. Người dùng có trách nhiệm đối chiếu với bài gốc trước khi sử dụng trong nghiên cứu."*
* Câu học thuật sinh tự động chỉ là **bản nháp**; chỉ sinh từ dữ liệu ✓ hoặc ★; luôn kèm số trang in để người dùng tự tra lại.
* Câu trích công khai giới hạn ≤ 50 từ.
* Khi dùng cho bài viết: trích dẫn bài gốc (không trích dẫn hệ thống), mở bằng chứng trong PDF để kiểm tra, khai báo việc dùng công cụ AI nếu tạp chí yêu cầu.

### 6.9. Kế hoạch kiểm thử nguồn trích xuất ngoài (D16: Codex / Antigravity)

**Mục tiêu:** biết liệu Codex và Antigravity có thể là nguồn trích xuất chính (thay Gemini API vì chi phí) với chất lượng đủ dùng và thời gian người làm chấp nhận được, trước khi viết lệnh `manual export / check / import` vào repo. Gemini Batch là **mốc so sánh** (đã chạy, đã có số liệu); Claude Code không tham gia trích xuất, chỉ nhập và publish.

**Bộ thử:** chỉ các bài trong thư mục Zotero "Dissertation / 1 - Social Media Marketing Ethics" (chủ dự án chỉ định; không lấy thêm bài ngoài thư mục). Bản Gemini Batch của 6 bài đã có trong database:

| Mã | Bài | Trang | Vai trò trong thử nghiệm | Mốc Gemini (✓ / ⚠ / ◇ / ẩn) |
| :--- | :--- | :--- | :--- | :--- |
| Q1 | Social media marketing: Who is watching the watchers? | 12 | Bài định lượng 1 Study, trường hợp dễ | 167 / 4 / 26 / 10 |
| Q2 | Modeling the Determinants of Customer Satisfaction… (B2B) | 14 | Trường hợp khó: kết quả đường dẫn nằm trong **hình** (Figure 2) | 130 / 159 / 22 / 47 |
| Q3 | How social, environmental, and economic CSR affects consumer-perceived… | 15 | Bài định lượng 1 Study, độ khó trung bình | 218 / 18 / 15 / 1 |
| C1 | Users of the world, unite! | 10 | Bài khái niệm, không có Study | 5 / 0 / 19 / 1 |
| C2 | Social media? Get serious! | 11 | Bài khái niệm | 2 / 0 / 8 / 0 |
| C3 | The past, present, and future of social media marketing ethics | 19 | Bài tổng quan hoặc khái niệm dài hơn | 11 / 1 / 21 / 0 |

Bài "Power and Perception" (144 trang, định tính) nằm ngoài phạm vi MVP, không dùng.

**Cách đo (không tốn API, không ghi database):** một script tạm trong thư mục nháp (không vào repo) tạo gói việc từ đúng `FULL_INSTRUCTIONS`, `PASS_PROMPTS` và `EXTRACTION_SCHEMAS`; kiểm tra JSON trả về bằng `parseAnswer` (Zod), ghép Study bằng `assembleStudy`, chạy `analysePaper` trên text layer, rồi so với bản Gemini bằng `compareExtractions` (cùng thước của `pnpm worker compare`).

**Các số đo cho mỗi lần chạy:**
1. Số lần sửa JSON cho đến khi qua schema (tối đa 2 là đạt).
2. Cùng số Study và cùng tập mã giả thuyết với bản Gemini.
3. Tỷ lệ vấn đề = (⚠ + ẩn) / (✓ + ⚠ + ẩn), và riêng tỷ lệ câu trích khớp nguyên văn (`quote_in_pdf` đạt).
4. Tỷ lệ khóa chung có cùng giá trị với Gemini (trường T1 / T2; T3 xem riêng vì là diễn giải).
5. Số trường mà tác tử bỏ sót hoặc thêm so với Gemini (có lý do hay không).
6. **Thời gian người làm** (phút: mở gói, giao việc, chờ, sửa lỗi) và mức tiêu hao hạn mức gói thuê bao của công cụ (ghi chú).
7. Khả năng lặp lại: cùng bài chạy hai lần trên cùng công cụ, so hai bản với nhau bằng `compareExtractions`.
8. An toàn: tác tử chạy trong thư mục gói việc, không thấy `.env`; không có PDF hay JSON thô trong git.

**Các pha:**

| Pha | Việc | Bài | Kết quả cần ghi |
| :--- | :--- | :--- | :--- |
| **A1 (thử một bài)** | Mỗi công cụ (Codex, Antigravity) làm Q1 một lần | Q1 | Số đo 1–6, ghi chú lỗi; chỉnh gói việc nếu thấy hướng dẫn thiếu (ghi lại để đưa vào `manual export`) |
| **A2 (mở rộng)** | Mỗi công cụ làm Q3, Q2 và C3 | Q3, Q2, C3 | Số đo 1–6; riêng Q2 xem tác tử xử lý số liệu trong hình thế nào (bỏ, đoán, hay đọc đúng) |
| **A3 (lặp lại)** | Chạy lại Q1 lần hai trên công cụ nào đạt A1 | Q1 | Số đo 7 |
| **A4 (bài khái niệm)** | Mỗi công cụ làm C1 và C2 | C1, C2 | Không bịa Study; trường ◇ hợp lý |
| **B (làm thật, 1b.8)** | Viết `manual export / check / import`, `AGENTS.md`, kiểm tra phiên bản; test tự động (xem dưới) | Bộ giả lập | Test xanh |
| **C (chạy đến web)** | Nhập kết quả đã đạt ở pha A vào database bằng `import`; chạy `quality` trước và sau; mở web local kiểm tra hiển thị và PDF | Các bài đạt | Bảng `quality`, ảnh chụp trang |
| **D (quyết định mở rộng)** | Ước tính giờ người làm cho 100 và 300 bài so với chi phí Gemini đã đo (Batch trung bình 0,52 USD mỗi bài, 0,02 USD mỗi trang) | — | Chủ dự án chọn nguồn chính và mức dùng dự phòng |

**Tiêu chí đạt (cho từng công cụ, đo trên Q1–Q3 và C3):**
* JSON qua schema sau tối đa 2 lần sửa ở mọi bài.
* Cùng số Study và mã giả thuyết với Gemini ở mọi bài.
* Tỷ lệ vấn đề không cao hơn Gemini quá **10 điểm phần trăm** ở từng bài, và tỷ lệ câu trích khớp nguyên văn không thấp hơn Gemini quá 10 điểm.
* **Giá trị cấu trúc** (số, giá trị liệt kê, giá trị ngắn) bằng Gemini ≥ **90%**; văn bản tự do (định nghĩa, câu thảo luận) báo riêng vì hai bên cắt đầu cuối khác nhau (từ 1b.8e `compare` coi hai văn bản dài là một khi cái này nằm trong cái kia hoặc chung gần hết số từ, trừ khi khác nhau ở từ phủ định / chiều tác động hoặc con số); độ lặp lại giữa hai lần chạy ≥ 90% theo cùng thước. Trước khi so khóa, `compare` ghép theo nội dung: khái niệm đo lường theo α / CR / AVE, lý thuyết theo tên (một tên là phần đầu của tên kia), đường dẫn theo hệ số và thống kê kiểm định, mục thảo luận theo văn bản; ghép nhập nhằng thì không ghép.
* **Kết quả của mọi giả thuyết hiển thị được:** không đường dẫn có mã giả thuyết nào (H1…Hn) có hệ số bị ẩn. Tiêu chí này thêm sau pha A1 vì tỷ lệ vấn đề chung có thể che mất việc kết quả giả thuyết bị ẩn (xem kết quả A1).
* Thời gian người làm trung vị ≤ **20 phút** mỗi bài (300 bài ≈ 100 giờ); trên mức này chủ dự án quyết định có chấp nhận không.
* Không phát hiện tác tử đọc `.env` hay ghi khóa vào gói việc.

**Kết quả pha A1 (bài Q1, ngày 19/10/2026):**

| | Gemini Batch | Codex | Antigravity (Gemini 3.8 Flash Medium) |
| :--- | :--- | :--- | :--- |
| ✓ / ⚠ / ◇ / ẩn | 167 / 4 / 26 / 10 | 168 / 3 / 34 / 6 | 220 / 0 / 19 / 31 |
| Tỷ lệ vấn đề | 7,7% | 5,1% | 12,4% |
| Câu trích nguyên văn | 98,5% | 100% | 90,7% |
| Khóa chung cùng giá trị với Gemini | — | 92,2% | 95,3% |
| Đường dẫn giả thuyết bị ẩn (tiêu chí 7) | 0/3 | **0/3** | **3/3** |
| Thời gian người làm (phút) / vòng sửa | — | chưa ghi | 6 / 0 |
| Kết luận | mốc | **đạt** | đạt 5 tiêu chí đầu, **không đạt tiêu chí 7** |

* Các khóa lệch phần lớn là cùng một đối tượng đặt tên khác (2 khái niệm đo lường × 10 trường, tên lý thuyết): Codex và Antigravity dùng tên đúng với tác giả ("Polarity", "Intent"), Gemini ghép nhãn lệch; số liệu y hệt.
* Antigravity bị ẩn cả ba đường dẫn giả thuyết vì câu trích "The path coefficients (see Fig. 1) from…" sai vài chữ (độ giống 0,86); nó cũng lấy thêm hai ma trận tương quan (khoảng 75 ô) mà hai bên kia không lấy. Chưa thử với model mạnh hơn Flash nên chưa kết luận về công cụ.
* Gemini suy luận `market_type` = "b2c" dù PDF không nói; Codex để trống (đúng luật "không đoán").
* **Việc đưa vào 1b.8:** (1) gói việc ghi tên file đầy đủ từng cái (`study_1_study_paths.json`; ở A1 Codex đã rút gọn thành `study_1_paths.json`); (2) `compare` ghép khái niệm theo cặp số liệu (α, CR, AVE) chứ không chỉ theo tên nhãn.

**Kết quả pha A2 (Codex, GPT 6.1 Sol medium, 19/10/2026):**

| Bài | Phút | Tỷ lệ vấn đề (Codex / Gemini) | Câu trích nguyên văn | Khóa chung cùng giá trị | Đường dẫn giả thuyết ẩn | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Q1 (dễ) | chưa ghi | 5,1% / 7,7% | 100% / 98,5% | 92,2% | 0/3 | đạt |
| Q3 (CSR) | 10 | 7,7% / 8,0% | 95,2% / 96,0% | 82,3% (cấu trúc 89,8%) | 0/9 | tách focus group thành Study thứ hai → đã thêm quy tắc (codebook 1.0.2); phần lệch chủ yếu là văn bản tự do và định dạng trích dẫn |
| Q2 (số liệu trong hình) | 6 | 51,7% / 61,3% | 54,0% / 47,6% | 97,7% (cấu trúc 99,3%) | 4/15 (Gemini 3/15) | giống Gemini cả ở điểm yếu: số trong hình không có trong lớp chữ |
| C3 (bài khái niệm) | 2 | 28,6% / 8,3% | 94,8% / 100% | 48,4% | — | trích **quá nhiều mục thảo luận** (hàm ý thực tiễn 11 mục, hướng nghiên cứu 37 mục so với 3 mục của Gemini); 4 mục bị ẩn vì câu trích có gạch nối cuối dòng ("experi- ence") nên chỉ giống 0,88 |

* Thời gian người làm 2–10 phút mỗi bài, dưới ngưỡng 20 phút. Chưa đo độ lặp lại (A3).
* **Việc đưa vào 1b.8 hoặc 1b.4:** (1) chỉ dẫn giới hạn số mục thảo luận (chỉ những câu tác giả nêu rõ là đóng góp / hàm ý / hạn chế / hướng nghiên cứu, không liệt kê từng câu hỏi nghiên cứu trong bảng); (2) máy đối chiếu câu trích dung thứ gạch nối cuối dòng; (3) so sánh văn bản tự do bằng độ giống thay vì bằng nhau tuyệt đối, và tiêu chí khóa chung chỉ tính giá trị cấu trúc; (4) tiêu chí 7 đo tương đối với Gemini khi số liệu nằm trong hình.

**Kết quả pha A3 (độ lặp lại, Codex chạy Q1 hai lần, 19/10/2026):** số Study và mã giả thuyết giống nhau; giá trị cấu trúc bằng nhau **95,1%** (155/163, đạt ngưỡng 90%); mọi khóa chung bằng nhau 84,3% (văn bản tự do và `scale_source` thay đổi giữa hai lần). Lần 2 ẩn 25 trường (lần 1: 6) vì thêm hai khái niệm bậc cao không có bằng chứng, máy chặn đúng; cần thêm vào chỉ dẫn "không ghi đối tượng nào mà không có câu trích". `n_items` Codex 4 so với Gemini 12–16 chưa rõ bên nào đúng.

**Tình trạng cổng sau A1–A3 (19/10/2026):** Codex đạt; Antigravity mới thử Q1 với Gemini 3.8 Flash (không đạt tiêu chí 7) và **hoãn** thử lại với model mạnh khi có token (gói Q3-antigravity, Q2-antigravity đã sẵn). Theo cổng bên dưới ("chỉ một công cụ đạt") làm 1b.8 với Codex.

**Cổng quyết định sau pha A:**
* Cả hai đạt: làm pha B với cả hai (chọn công cụ mặc định theo thời gian và số ⚠ thấp hơn).
* Chỉ một đạt: làm pha B với công cụ đó.
* Không công cụ nào đạt: ghi số liệu, **dừng và hỏi chủ dự án** (giữ Gemini làm nguồn chính với ngân sách D6, hoặc chấp nhận chất lượng thấp hơn cho một số loại trường). Không tự đổi quyết định.

**Test tự động cho pha B (trong repo):** gói việc xuất ra giống hệt nhau khi đầu vào giống nhau và không chứa khóa hay phản hồi thô của Gemini; `check` chấp nhận file hợp lệ, từ chối file sai schema (lỗi dễ đọc, nêu đúng đường dẫn trường), file sai `prompt_version` / `schema_version`, file thiếu phần; bài nhiều Study nộp theo từng phần được ghép đúng; `import` trên bộ bài giả lập (dùng đáp án sẵn làm "tác tử giả") cho kết quả publish **y hệt** đường Gemini giả, không ghi `api_spend`, `model_name` = `manual:<công cụ>:<model>`, chạy lại không đè trường đã khóa và không nhập trùng.

**Ghi chép:** mỗi lần chạy ghi công cụ, phiên bản, ngày, bài, số đo (bảng trong CHANGELOG hoặc ghi chú bước); file câu trả lời thô chỉ ở `extracted_data/` (đã gitignore), không commit. Khi công cụ cập nhật phiên bản lớn, chạy lại Q1 để kiểm tra mốc.

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
