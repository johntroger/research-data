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
* Định nghĩa vận hành từng trường, **tầng T1/T2/T3**, danh mục giá trị cho phép, quy tắc xử lý tình huống mơ hồ, ví dụ đúng/sai.
* **Claude Code soạn**, dựa trên các tài liệu phương pháp ở Mục 12; chủ dự án đọc lướt (khoảng 1–2 giờ, một lần) để sửa định nghĩa khái niệm và lý thuyết của miền.
* Là đầu vào trực tiếp cho prompt; có `codebook_version` và nhật ký thay đổi.

### 6.2. Lớp A: Trích xuất một lượt
* Mỗi bài trích **một lần** bằng `GEMINI_MODEL_STRONG` (Pro), gồm Pass 1 (cấu trúc, danh mục Study / giả thuyết / bảng) và Pass 2 (chi tiết từng Study), như Mục 4.2.
* Trường T3 (vai trò lý thuyết, loại đóng góp, loại khoảng trống) trích cùng lượt, gắn nhãn **◇ AI diễn giải**.
* Mỗi giá trị phải kèm **bằng chứng**: trang, câu trích hoặc vị trí trong bảng (`table_id`, hàng, cột).

### 6.3. Lớp B: Máy đối chiếu với PDF (không dùng AI)

| Loại dữ liệu | Phương pháp kiểm chứng |
| :--- | :--- |
| Câu văn (định nghĩa, giả thuyết, hạn chế) | Fuzzy match với text của trang được ghi (cho phép lệch ±1 trang), ngưỡng ≥ 0,90 |
| Số liệu (β, p, n, α…) | Tìm đúng chuỗi số trên trang được ghi, chấp nhận các dạng `.35` / `0.35` / `0,35` / `< .001` |
| Bảng (ma trận tương quan, bảng kết quả) | Số có xuất hiện trên trang; nhất quán nội tại (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE nếu có) |
| Bảng điều kiện thực nghiệm (`condition_cells`) | Số có xuất hiện trên trang; SD > 0; M nằm trong khoảng thang đo |
| Kiểm tra logic chung | p ∈ [0,1]; n > 0; CI chứa estimate; `status` nhất quán với p và chiều tác động |
| PDF scan không có text layer | Gắn cờ `needs_ocr`; mọi trường T1/T2 của bài mang ⚠ |

* **Độ đầy đủ (chống bỏ sót):** quét text tìm mọi mã giả thuyết (`H\d+[a-z]?`) và tiêu đề bảng (`Table \d+`), so với danh mục của Pass 1. Mục nào thiếu thì **tự động trích bổ sung riêng mục đó** (một lời gọi nhỏ); vẫn thiếu thì ghi rõ "bài có H5 nhưng chưa trích được" để người dùng biết mà xem.
* **Tính lại thống kê (kiểu statcheck, Nuijten et al., 2016):** p từ t / F / z / χ² và df; t từ β và SE; SE từ CI; t / F từ M, SD, n. Lệch lớn, nhất là khi kết luận ý nghĩa bị đảo, thì gắn ⚠. Nếu giá trị khớp PDF mà vẫn lệch khi tính lại, ghi **"có thể là lỗi của bài gốc"**.
* **Metadata** lấy từ Crossref / Zotero, không để AI sinh.
* **Xác định `printed_page`** (lưu kèm `printed_page_method`), theo thứ tự: (1) PDF `/PageLabels`; (2) dãy số trang nhất quán tìm thấy ở header/footer (bằng code, bỏ qua năm / số tập); (3) trang đầu theo Crossref cộng độ lệch; (4) Gemini đọc số trang ở header/footer (chỉ khi 3 cách trên không có kết quả); (5) cuối cùng là số thứ tự trang PDF. Annotation Zotero (`annotationPageLabel`) dùng để đối chiếu khi có.
* **Đọc text layer:** tách bố cục hai cột (đọc hết cột trái rồi mới sang cột phải); đưa chữ xoay dọc ở lề (watermark "Downloaded from…" của nhà xuất bản) ra khỏi nội dung.

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
