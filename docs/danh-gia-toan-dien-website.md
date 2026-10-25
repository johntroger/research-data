# Đánh giá toàn diện website và đề xuất cải thiện

> **Cập nhật 25/10/2026 (cuối ngày):** các mục W2 (không cache) và một phần D8 đã được xử lý ở `main` (bước 4.7 do chủ dự án làm; số liệu đo từ Việt Nam). Đã có PR cho nhóm P0 giao diện ([#2](https://github.com/johntroger/research-data/pull/2)), truy cập và điện thoại ([#3](https://github.com/johntroger/research-data/pull/3)), gợi ý tên gần giống ([#4](https://github.com/johntroger/research-data/pull/4)).


> Ngày 25/10/2026, phiên cloud. Đánh giá theo bốn vai trò: nhà nghiên cứu, chuyên gia cấu trúc dữ liệu, chuyên gia thiết kế web, chuyên gia UI/UX. **Chỉ đánh giá và đề xuất; chưa sửa gì.** Các thay đổi đều cần chủ dự án quyết theo quy trình từng bước của `CLAUDE.md`.

## 0. Cách đánh giá và giới hạn

**Đã làm:** mở bản thật `research-data-five.vercel.app` bằng Chromium; chụp 7 trang (`/`, kết quả tìm quan hệ `ethicality → trust`, `/library`, `/matrix`, một trang bài, `/about`, `/login`) ở màn hình 1440 px và 390 px; chạy kiểm tra khả năng truy cập tự động (axe-core 4.10.2, mức WCAG 2.0/2.1 A và AA); đọc `docs/data-schema.md`, `docs/ux-spec.md`, `docs/quality-assurance.md`, các migration và mã liên quan (`lib/data.ts`, `lib/relations.ts`, `app/page.tsx`).

**Chưa làm được, nên đánh giá có giới hạn:**
- Không có người dùng thật thử nghiệm; mọi nhận xét về "dễ hay khó dùng" là của người đánh giá, chưa kiểm chứng bằng hành vi thật (Mục 8.0 của đặc tả UX có kế hoạch này).
- Không kiểm điều hướng bằng bàn phím và trình đọc màn hình bằng tay; axe thường chỉ bắt được một phần các lỗi truy cập.
- Không đọc dữ liệu thô trong database; nhận xét về chất lượng trích xuất chỉ dựa trên các trang tôi mở.
- Không so sánh với các công cụ tương tự (Elicit, Consensus, scite…) một cách hệ thống.
- Chưa đánh giá nội dung `/about` và quy trình trích xuất ở mức chi tiết.

## 1. Điểm mạnh nên giữ

1. **Trung thực về giới hạn**: mọi trang nói rõ kho nhỏ, không phải mẫu hệ thống, đếm phiếu (vote counting), không phải meta-analysis. Hiếm công cụ làm được việc này.
2. **Dấu vết kiểm chứng**: huy hiệu ✓ / ⚠ / ◇, "Vì sao ✓", số trang in và số trang PDF, bấm là tới đúng chỗ. Đây là tính năng khác biệt nhất của sản phẩm.
3. **Đơn vị phân tích đúng**: kiểm định (path) theo Study, không gộp ở mức bài; ma trận hiện từng Study kèm N và quốc gia.
4. **Không đổi β thành r**; hiện `estimate_type` và `p_reported_as` đúng như tác giả báo cáo.
5. **Tuyến truy cập rõ**: khách xem được dữ liệu, PDF theo giấy phép mở; chủ có phiên riêng. Không cookie theo dõi.
6. **Cấu trúc trang tốt về kỹ thuật cơ bản**: `lang="vi"`, một `<h1>` mỗi trang, đủ vùng `header/nav/main/footer`, không tràn ngang trên điện thoại, có `viewport`, có meta description. Trạng thái tìm kiếm nằm trong URL nên chia sẻ được.
7. Gợi ý biến bằng `datalist` và 3 ví dụ bấm được ở trang chủ.

## 2. Vai trò nhà nghiên cứu kỳ cựu

| # | Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|---|
| R1 | **Dòng tóm tắt dễ gây hiểu sai.** Cùng một khung có hai câu: "Tìm thấy 10 kiểm định từ 2 bài" và "1 bài trong kho · 1 study · 1 kiểm định". Số đầu gồm cả ⚠; số sau chỉ tính ✓. Người đọc lướt sẽ lấy số nhỏ | Ảnh kết quả `ethicality → trust` | Một con số chính, nói rõ "1 kiểm định đã kiểm chứng (✓) trên tổng 10", đặt chữ "chưa tính ⚠" ngay cạnh số, không đặt ở dòng dưới |
| R2 | **Nghi ngờ đếm trùng một quan hệ.** Trong danh sách có cặp dòng gần giống: "Study 3 · Authentic brand ethicality (parsimonious version) → Brand trust, β = .29, p < .001" và cùng quan hệ ở trang in 893 không có β ("Không đặt giả thuyết"); tên biến chỉ khác chữ hoa. Có thể là cùng một đường từ hai bảng (bảng hệ số và bảng kết quả giả thuyết) | Ảnh kết quả; trang in 892 và 893 | **Cần chủ dự án hoặc người kiểm tra xem dữ liệu thật**: nếu đúng là trùng, thanh tổng hợp có thể đếm hai lần. Đề xuất kiểm tra khử trùng theo (study, IV, DV, vai trò) và hợp nhất dòng có β với dòng chỉ có trạng thái giả thuyết |
| R3 | **Đếm phiếu bỏ qua cỡ mẫu và cỡ hiệu ứng**, đã được nói rõ nhưng người dùng cần *cách đi tiếp* | Dòng "Phương pháp: đếm số kiểm định… không phải meta-analysis" | Thêm cột N của Study và `estimate_type` ngay trên từng dòng kết quả (dữ liệu đã có ở trang bài); thêm nút "Xuất cho `metafor`" khi đủ điều kiện (Giai đoạn 6 đã có trong kế hoạch) |
| R4 | **⚠ bị loại khỏi tổng hợp theo mặc định**; với dữ liệu này, 9/10 kiểm định ở ví dụ là ⚠. "Kết quả có thể thiên về các nghiên cứu đơn giản" (đã ghi) là đúng, nhưng mặc định làm người dùng thấy gần như không có bằng chứng | Ảnh kết quả | Cho thấy cả hai con số cạnh nhau (✓ và ✓+⚠) thay vì chỉ một; hiển thị lý do ⚠ phổ biến nhất ("không khớp trang…") để người dùng hiểu đây là giới hạn máy đối chiếu, không phải chất lượng bài |
| R5 | **Kho nhỏ và lệch có chủ đích** (36 bài, 25 có dữ liệu quan hệ; chọn theo thư viện chủ dự án). Với một nhà nghiên cứu khác, câu hỏi đầu tiên là "kho này phủ phần nào của lĩnh vực" | Khối "Kho này gồm gì" | Thêm dòng "cập nhật lần cuối" và số bản dữ liệu (ví dụ `data version 2026-10-25`) để trích dẫn và tái lập được; thêm hướng dẫn trích dẫn chính web này (APA) |
| R6 | **Không phân biệt thiết kế trên từng dòng kết quả.** Khảo sát, thực nghiệm, đa nhóm cho các loại ước lượng khác nhau nhưng nằm cùng danh sách | Ảnh kết quả | Nhãn thiết kế ngắn ("khảo sát", "thực nghiệm lab") và lọc theo thiết kế ngay trong trang kết quả, không chỉ ở thư viện |
| R7 | **Tên biến chỉ tiếng Anh, khớp theo từ khóa**; người nghiên cứu tiếng Việt thường nghĩ theo khái niệm ("niềm tin thương hiệu") | Ô nhập "ví dụ: ethicality" | Cho phép nhập tiếng Việt và ánh xạ sang khái niệm chuẩn; hiển thị "bạn đang tìm khái niệm chuẩn X (gồm các tên gọi Y, Z)" trước khi tìm |

## 3. Vai trò chuyên gia cấu trúc dữ liệu

| # | Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|---|
| D1 | **Tìm quan hệ tải toàn bộ bảng `path_results` mỗi lần**, rồi lọc bằng JavaScript. `relation_index` (materialized view và index hai chiều) mà `data-schema.md` mục 5.4 mô tả **chưa có trong mã hay migration** (tìm không thấy chuỗi `relation_index` ở `supabase`, `apps`, `packages`) | `lib/data.ts` dòng 164 (`restAll("path_results?select=…")`), `app/export/route.ts` | Với 36 bài thì chấp nhận được; số đo 4.7 cho thấy trang tìm quan hệ chỉ hơn mức nền ~0,13 s. Nhưng mục tiêu < 200 ms p95 ở kế hoạch dựa trên view này. Khi kho vượt vài trăm bài, đây sẽ là điểm nghẽn: cần làm `relation_index` (hoặc lọc phía database) trước khi mở rộng, và sửa kế hoạch cho khớp thực tế |
| D2 | **Hai lớp lưu trữ cùng tồn tại**: `extracted_fields` (từng trường là một dòng tên–giá trị, có `badge`) và các bảng nghiệp vụ có kiểu (`path_results`, `samples`, `measurements`…). Trang bài lấy từ lớp trường, trang tìm quan hệ lấy từ bảng kiểu | `supabase/migrations/20261018000000_skeleton.sql` và `…120000_business_tables.sql`; trang bài hiện `effect_type`, `estimate`, `se`, `status` thành thẻ riêng | Cần xác nhận lớp nào là **nguồn sự thật** và đảm bảo hai lớp không lệch nhau (một kiểm tra đồng nhất định kỳ). Nếu `extracted_fields` chỉ để vết kiểm chứng, giao diện nên đọc từ bảng kiểu và dùng `extracted_fields` cho dấu vết |
| D3 | **Huy hiệu theo từng trường, không theo kiểm định.** Một kiểm định gồm nhiều trường, mỗi trường một huy hiệu; tổng "125/128 đã kiểm chứng" đếm trường chứ không đếm kiểm định | Trang bài | Thêm huy hiệu tổng hợp theo kiểm định (ví dụ "✓ nếu mọi trường bắt buộc ✓") và dùng nó ở mọi nơi hiển thị; giữ huy hiệu theo trường làm chi tiết |
| D4 | **`natural_key` là chuỗi tự tạo** (`study_1:…`, `table:table_1`) vừa làm khóa vừa lộ ra giao diện (đã sửa một phần ở P1.4) | Mã và kế hoạch | Tách khóa kỹ thuật (UUID) khỏi nhãn đọc được; giữ `natural_key` chỉ cho khóa khóa sửa tay (đúng mục đích hiện tại) |
| D5 | **"Không chắc thì tách" làm giảm độ phủ (recall) khi tìm.** Người dùng gõ một tên mà kho lưu bằng tên khác sẽ không thấy kết quả | Nguyên tắc ở `data-schema.md` 5.3; ô nhập chỉ có `datalist` | Giữ nguyên tắc, nhưng bù ở giao diện: gợi ý "tên gần giống" khi 0 kết quả, và liệt kê các khái niệm chuẩn có ít nhất một kiểm định |
| D6 | **Chưa có bản đóng băng dữ liệu (snapshot) để tái lập.** Dữ liệu đổi sau mỗi lần publish; kết quả hôm nay có thể khác ngày mai | — | Đánh số phiên bản dữ liệu theo mỗi lần publish, lưu vào file xuất và trang Giới thiệu (nối với R5) |
| D7 | **Quyền đọc `papers` rộng** (đã nêu ở báo cáo bảo mật, điểm 3) | `skeleton.sql` | Quyền theo cột cho `pdf_path`, `file_hash` |
| D8 | Mục tiêu hiệu năng và kiến trúc cần cùng một câu chuyện | Mục 4.7 | Chốt: lọc ở đâu (database hay ứng dụng) rồi mới đặt ngưỡng p95 |

## 4. Vai trò chuyên gia thiết kế web (cấu trúc, hiệu năng, kỹ thuật)

| # | Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|---|
| W1 | **Mọi trang chính có `<title>` là "Research Data"** (trang chủ, kết quả tìm, thư viện, ma trận, trang bài); chỉ `/about` và `/login` có tiêu đề riêng | `<title>` đo ở 5 trang | Đặt tiêu đề theo nội dung (tên bài, cặp biến tìm). Ảnh hưởng thẻ trình duyệt, lịch sử, chia sẻ, và việc mở cho tìm kiếm sau này. Thêm thẻ Open Graph khi mở công khai |
| W2 | **Không cache trang nào** (mọi lượt MISS) và tải toàn bộ dữ liệu mỗi lượt | Số đo 4.7; D1 | Cache các trang công khai ít đổi; làm mới sau mỗi lần publish (C1 ở `de-xuat-ke-hoach-sau-4.7.md`) |
| W3 | **Trang bài rất dài**: 128 thẻ trong một tab, cao khoảng 19.400 px trên điện thoại | `docHeight` mobile 19414 | Gom theo kiểm định (xem U2), tải dần hoặc thu gọn |
| W4 | **Cột PDF bên phải để trống** khi bài đóng; trên màn hình rộng, nửa trang trống trong khi cột trái cuộn dài | Ảnh trang bài | Dùng chỗ đó để hiện ngữ cảnh khác (đoạn trích, "Vì sao ✓" đang chọn, các kiểm định liên quan) hoặc thu cột PDF khi không có PDF |
| W5 | **Chỉ có một bố cục hai cột; không có chế độ tối**; CSS có `@media` nhưng không có `prefers-color-scheme` | `app/globals.css` | Thêm chế độ tối nếu người dùng nghiên cứu hay đọc lâu (ưu tiên thấp) |
| W6 | **Không có phân trang hay danh sách ảo** ở Thư viện và Ma trận; 3.950 px và 4.535 px trên desktop với 36 bài | `docHeight` | Chưa cấp bách ở 36 bài; cần khi kho lớn |
| W7 | Điều hướng chỉ 4 mục, đủ cho quy mô hiện tại; thiếu **đường dẫn ngược** ở trang bài (quay lại kết quả tìm) và **trạng thái đang tải** khi tìm | Ảnh | Thêm liên kết "quay lại kết quả" giữ nguyên truy vấn |
| W8 | **Lỗi 500 một lần** và đuôi chậm ở `/matrix` (đã nêu ở báo cáo 4.7) | Báo cáo 4.7 | Xem nhật ký; thêm trang lỗi thân thiện (đã có `app/error.tsx`, cần kiểm nội dung) |

## 5. Vai trò chuyên gia UI/UX

| # | Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|---|
| U1 | **Điều khiển biểu mẫu nhỏ và mặc định của trình duyệt**: ô tích, nút "Tìm kiếm" và "Lọc" nhỏ hơn hẳn chữ xung quanh; nhãn lọc và chữ chính lệch cỡ | Ảnh trang chủ và thư viện; axe/Playwright đếm 28 đến 160 phần tử tương tác có chiều rộng hoặc cao dưới 24 px | Mục tiêu bấm tối thiểu 24 px (WCAG 2.2 mức AA, tiêu chí 2.5.8); trên điện thoại nên lấy 44 px làm mục tiêu thiết kế (khuyến nghị, không bắt buộc); nút chính nổi bật, các bộ lọc thành cụm rõ ràng |
| U2 | **Trang bài lộ tên trường kỹ thuật bằng tiếng Anh**: thẻ ghi `effect_type`, `estimate`, `estimate_type`, `se`, `status` và giá trị `direct`, `other`, `supported`. Một kiểm định thành 5 đến 6 thẻ | Ảnh trang bài, tab Kết quả 128 thẻ | **Một thẻ cho mỗi kiểm định**: "Study 1 · elevation → elevating emotions · β/b = 1,69, SE = 0,18, p …, ✓", các trường phụ gập lại; dịch tên trường và giá trị sang tiếng Việt. Đây là việc đáng làm nhất về UI |
| U3 | **Độ tương phản màu không đạt** | axe: 4 phần tử (trang chủ), 15 (kết quả), 71 (thư viện), 37 (ma trận), 2 (trang bài); mức serious | Tăng độ đậm chữ phụ (xám nhạt, "ví dụ" trong ô nhập, huy hiệu ⚠ màu vàng trên nền sáng); kiểm lại bằng axe |
| U4 | **Thứ bậc tiêu đề bị nhảy cấp** ở kết quả và trang bài (`heading-order`); phần lớn trang không có `<h2>` mặc dù nhiều khối | axe: moderate | Dùng `<h2>` cho khối "Tổng hợp", "Danh sách", "Kho này gồm gì" để trình đọc màn hình duyệt được |
| U5 | **Liên kết điều hướng và liên kết nội dung cùng kiểu** (xanh có gạch chân, kể cả tiêu đề bài, dòng tên biến) nên không thấy đâu là hành động chính | Ảnh | Phân cấp: điều hướng (không gạch chân, đậm khi đang ở trang), tiêu đề bài (đậm), liên kết phụ (gạch chân). Giữ gạch chân ở thân văn bản |
| U6 | **Điện thoại**: thanh điều hướng ngắt dòng không đẹp ("Tìm theo / quan hệ"); bộ lọc dàn thành đoạn chữ dài khó chạm | Ảnh `pair-mobile`, `paper-mobile` | Điều hướng cuộn ngang hoặc menu gập; bộ lọc thành chip bấm được; bảng ma trận thành thẻ |
| U7 | **Ký hiệu huy hiệu cần học**: ✓ ⚠ ◇ ★ ⚑ và các glyph "○", "◖" cho trạng thái giả thuyết; không có chú giải ngay tại chỗ (chỉ liên kết sang Giới thiệu) | Ảnh | Chú giải nhỏ cố định hoặc tooltip, ngay dưới khung tìm; kiểm font hiển thị glyph trên Windows, macOS và Android |
| U8 | **Hướng dẫn nhanh dài và chiếm màn hình đầu** trước khi người dùng thấy kết quả đầu tiên; khối "Kho này gồm gì" cũng mở sẵn | Ảnh trang chủ | Sau lần đầu, gập hướng dẫn và nhớ lựa chọn (đã có cơ chế `localStorage` ở nơi khác); đưa ví dụ bấm được lên cao hơn |
| U9 | **Phản hồi trạng thái**: không có chỉ báo đang tải; "0 kết quả" và "không tìm thấy" cần gợi ý hành động | — | Trạng thái đang tải, thông điệp rỗng kèm gợi ý (xem D5) |
| U10 | **Điểm tốt cần giữ**: bố cục trang bài hai cột và hàng chữ "Mở sẵn tab Kết quả" đặt đúng ưu tiên người đọc; khối "Vì sao ✓" ngắn gọn và đúng chỗ | Ảnh trang bài | Giữ; áp dụng cùng ngôn ngữ thiết kế cho mọi trang |

## 6. Thứ tự ưu tiên đề xuất

Công sức: **S** = nhỏ (dưới nửa ngày), **M** = vừa (một đến hai ngày), **L** = lớn (nhiều ngày). "Quyết" nghĩa là cần chủ dự án chốt trước khi làm.

| Ưu tiên | Việc | Mã | Công sức | Giá trị | Cần quyết |
|---|---|---|---|---|---|
| **P0** | Kiểm tra nghi ngờ đếm trùng một quan hệ | R2 | S | Rất cao (độ đúng của số liệu) | Không; chủ dự án xem dữ liệu |
| **P0** | Một thẻ cho mỗi kiểm định ở trang bài, dịch tên trường | U2, D3, W3 | M | Rất cao | Có (đổi cách hiển thị) |
| **P0** | Đặt `<title>` theo nội dung | W1 | S | Cao | Không |
| **P0** | Sửa dòng tóm tắt hai con số | R1, R4 | S | Cao | Không |
| **P1** | Sửa độ tương phản và cỡ mục tiêu bấm; thứ bậc `<h2>` | U1, U3, U4 | M | Cao (truy cập, WCAG AA đã cam kết ở 8) | Không |
| **P1** | Cache các trang công khai | W2 | M | Cao (hiệu năng) | Có |
| **P1** | Quyền cột trên `papers` | D7 | S | Trung bình | Có |
| **P1** | Điện thoại: điều hướng và bộ lọc | U6 | M | Cao nếu có người dùng di động | Không |
| **P2** | Lọc ở database / `relation_index` trước khi kho vượt 100 đến 300 bài | D1, D8 | L | Cao về lâu dài | Có |
| **P2** | Phiên bản dữ liệu, hướng dẫn trích dẫn, "cập nhật lần cuối" | R5, D6 | S đến M | Trung bình | Có |
| **P2** | Nhập tiếng Việt và gợi ý tên gần giống khi 0 kết quả | R7, D5 | M đến L | Cao cho người dùng Việt | Có |
| **P2** | N và loại ước lượng trên từng dòng; lọc theo thiết kế ngay trong kết quả | R3, R6 | M | Trung bình đến cao | Không |
| **P3** | Làm rõ nguồn sự thật giữa hai lớp lưu trữ | D2, D4 | M | Cao về lâu dài | Có |
| **P3** | Chế độ tối, phân trang, đường dẫn quay lại, trạng thái đang tải | W5–W7, U9 | S đến M mỗi việc | Thấp đến trung bình | Không |

**Nếu chỉ làm một việc:** U2 (một thẻ mỗi kiểm định, dịch tên trường). Trang bài là nơi người dùng kiểm tra bằng chứng, tức là lý do tồn tại của sản phẩm, và hiện đang là nơi lộn xộn nhất.

## 7. Điều cần chủ dự án quyết

1. Có chấp nhận P0 làm trước, theo từng bước riêng, mỗi bước một PR không?
2. Nghi ngờ đếm trùng ở mục R2 (mục 2 của báo cáo này) có đúng không? Cần chủ dự án xem hai dòng ở trang in 892 và 893 của bài Zeugner-Roth et al. (2025).
3. Ưu tiên cho người dùng di động đến đâu (quyết P1 U6)?
4. Có muốn mở rộng kho trong vài tháng tới (quyết P2 D1)?
5. Có thêm tiếng Anh cho giao diện hay tiếp tục giữ tiếng Việt (liên quan R7 và Giai đoạn 6)?
