# Đề xuất rà soát và kế hoạch sau bước 4.7

> Ngày 25/10/2026, phiên cloud. **Đây là đề xuất để chủ dự án quyết định.** Chưa sửa `PROJECT_PLAN.md`, `docs/*` (ngoài file này), `CHANGELOG.md` hay `CLAUDE.md`. Khi chủ dự án chốt, mới sửa đúng file chứa mục đó, ghi vào `CHANGELOG.md` và chạy `pnpm docs:check` (quy ước của `CLAUDE.md`). Số liệu nền lấy từ [báo cáo 4.7](bao-cao-4.7-hieu-nang-va-bao-mat.md).

## A. Chỗ các file kế hoạch đang lệch nhau

Mỗi mục có vị trí để kiểm lại. Tôi chưa sửa mục nào.

| # | Lệch ở đâu | Bằng chứng | Đề xuất |
|---|---|---|---|
| A1 | Số phiên bản | `PROJECT_PLAN.md` dòng 1 và `CLAUDE.md` dòng 4 ghi 3.9.1; `CHANGELOG.md` dòng 5 đã tới 3.9.86 | Đồng bộ số phiên bản ở ba nơi, hoặc ghi rõ "kế hoạch gốc 3.9.1, thay đổi xem CHANGELOG" |
| A2 | Danh sách việc Giai đoạn 4 cũ còn nằm dưới các bước đã xong | `PROJECT_PLAN.md` dòng 285–287: ba mục "1. Kết nối Vercel… 2. GitHub Actions: `ci.yml` và `regression.yml`… 3. Đo hiệu năng…" | Gộp vào các bước 4.1–4.7 hoặc xóa phần trùng |
| A3 | `regression.yml` được nhắc nhưng không tồn tại | Dòng 286 nhắc; `.github/workflows/` chỉ có `ci.yml` và `backup.yml`; các nơi khác chỉ trong bản backup cũ | Đổi thành "chưa làm" hoặc bỏ, vì từ v3.8 không còn bộ đối chứng (`CLAUDE.md`) |
| A4 | Thống kê truy cập | Dòng 287 vẫn ghi "bật thống kê… Cloudflare Web Analytics hoặc Vercel Analytics"; `docs/integrations.md` dòng 69 liệt kê Web Analytics; nhưng bước 4.6 (dòng 279) ghi chủ dự án **quyết định không dùng** (24/10/2026) | Sửa dòng 287 và `integrations.md` cho khớp 4.6 |
| A5 | Mục 13 mở đầu như dự án chưa bắt đầu | Dòng 332: "Chưa bắt đầu các bước kỹ thuật… cho đến khi các quyết định dưới đây được chốt"; mọi quyết định D1–D16 đều đã chốt hoặc không áp dụng | Sửa câu mở đầu |
| A6 | `CLAUDE.md` còn câu "chưa triển khai bước kỹ thuật nào… cho đến khi chủ dự án xác nhận kế hoạch đã chốt" | Mục "Kế hoạch dự án" của `CLAUDE.md`; trong khi Giai đoạn 4 đã chạy | Sửa cho khớp tình trạng thật |
| A7 | Lịch ở Mục 10.1 đã lỗi thời | Mục 10.1 ghi "Web MVP công khai… giữa tháng 1/2027"; web công khai đã chạy từ 23/10/2026 | Cập nhật bảng lịch |
| A8 | Bước 4.7 và 4.8 chưa có đoạn mô tả | Chỉ có tên ở dòng 273; 4.1–4.6 đều có đoạn riêng (dòng 274–279) | Thêm đoạn 4.7 (mục B) và dự thảo 4.8 (mục D) |

## B. Đề xuất đoạn cho Bước 4.7

Chủ dự án quyết có đưa vào `PROJECT_PLAN.md` hay không. Bản nháp:

> **Bước 4.7 ✅ (25/10/2026): đo hiệu năng thật (từ máy ở Mỹ, chỉ đo, chưa sửa).** Đo `research-data-five.vercel.app` bằng `curl -w`, 25 lượt mỗi trang, tuần tự (150 yêu cầu), không gặp 429; LCP bằng Playwright. Máy đo ở Mỹ, yêu cầu vào cổng `iad1` rồi hàm chạy ở `sin1`, nên số cao hơn thực tế ở Việt Nam. Tải HTML trung vị: `/` 0,79 s, tìm quan hệ 0,84 s, `/library` 0,72 s, `/matrix` 0,83 s, trang bài 0,96 s; p95 từ 1,0 đến 1,8 s. LCP 0,8 đến 1,0 s. **Chưa kết luận đạt mục tiêu**: cần đo lại từ Việt Nam hoặc Singapore. Phát hiện: mọi lượt `x-vercel-cache: MISS` (không trang nào được cache); 1/150 lượt `/` trả 500 sau 5,18 s; `/matrix` có đuôi chậm (TTFB p95 1,59 s). Chi tiết: `docs/bao-cao-4.7-hieu-nang-va-bao-mat.md`.

Đề xuất thêm một tiêu chí vào Giai đoạn 4 mục 3: **nói rõ đo ở đâu** (vùng máy đo và `x-vercel-id`), vì khoảng 0,2 đến 0,25 s mạng Mỹ–Singapore nằm sẵn trong con số.

## C. Việc đề xuất làm tiếp (từ phát hiện của 4.7 và rà soát bảo mật)

Chưa có việc nào bắt đầu. Cột "cần chủ dự án quyết" là việc đổi production hoặc cấu hình thật.

| # | Việc | Vì sao | Cách kiểm thử khi xong | Cần chủ dự án quyết |
|---|---|---|---|---|
| C1 | Cache các trang công khai ít đổi (`/library`, `/matrix`, trang bài) bằng `s-maxage` hoặc ISR; làm mới sau mỗi lần nhập dữ liệu | Mọi lượt hiện là MISS; cache có thể cắt phần lớn thời gian | Đo lại bằng đúng kịch bản của 4.7 và so với bảng ở báo cáo | **Có**: đổi cách phục vụ dữ liệu, và quyết cách xóa cache sau khi nhập bài mới |
| C2 | Thu hẹp quyền đọc bảng `papers` của khách (bỏ `pdf_path`, `file_hash` khỏi `anon` nếu giao diện không cần) | `papers` hiện `using (true)` cho mọi hàng và gần như mọi cột | Test DB: khách không đọc được cột đã bỏ; e2e: PDF mở vẫn xem được | **Có**: migration đụng database thật |
| C3 | Kiểm giới hạn tốc độ phía Supabase (gọi thẳng API bằng khóa `anon` công khai đang bỏ qua giới hạn của Vercel) | Rủi ro hạn mức và làm sai số thống kê | Xem cài đặt thật ở bảng điều khiển Supabase | **Có**: cần quyền xem cài đặt |
| C4 | Xem nhật ký Vercel quanh lần 500 trên `/` (5,18 s) và đuôi chậm của `/matrix` | 1/150 lượt lỗi; chưa rõ nguyên nhân | Đo lại 100 lượt, 0 lỗi | Không, chủ dự án chỉ cần xem nhật ký (gói Hobby không đọc qua CLI) |
| C5 | Nới hạn mức giới hạn tốc độ nếu dạy cả lớp dùng chung IP | 120 yêu cầu/phút/IP có thể chặn cả lớp (suy luận, chưa mô phỏng) | Mô phỏng 30 người cùng IP bằng bản local | **Có**: đổi chính sách |
| C6 | CSP đầy đủ cho script (cần nonce của Next) | Hiện chỉ `frame-ancestors`; trước khi mở cho công cụ tìm kiếm | e2e production: trang vẫn chạy, không vi phạm CSP | Có thể làm trước 4.8, cần chủ dự án đồng ý |
| C7 | Đo lại hiệu năng từ máy ở Việt Nam hoặc Singapore, và một lần với hàm đã ngủ lâu | Số hôm nay đo ở Mỹ; lượt "lạnh" không thật sự lạnh | Cùng kịch bản 4.7 | Không, chủ dự án chạy trên máy |

Đã làm trong PR này, không cần quyết thêm: bước `pnpm audit --prod --audit-level=high` trong `ci.yml` (lần đầu chạy trên GitHub sẽ cho kết quả thật).

## D. Dự thảo Bước 4.8: tên miền thật và kênh liên hệ gỡ bỏ

Nguồn: dòng 273 (tên bước), D8 (mua tên miền trước khi mở công khai), bước 4.4 (CORS R2 và Auth Supabase), dòng 284 (`ALLOW_INDEXING=1` nên làm sau khi có kênh gỡ bỏ), `docs/ux-spec.md` dòng 23 (kênh tiếp nhận yêu cầu gỡ bỏ), `docs/risks.md` dòng 16 (rủi ro 7). **Các việc dưới đây là suy ra từ những nguồn đó, chưa phải quyết định của chủ dự án.**

1. **Chọn và mua tên miền** (quyết định D8: tên chính thức, nhà đăng ký, chi phí). Chủ dự án làm.
2. **Gắn tên miền vào dự án Vercel** (DNS); kiểm HTTPS và header bảo mật vẫn đúng trên tên mới.
3. **Cập nhật mọi nơi nhắc địa chỉ cũ**, như đã làm ở 4.4 cho `*.vercel.app`: CORS của R2, `site_url` và danh sách chuyển hướng của Auth Supabase. Sau đó thử đăng nhập bằng link email thật và xem PDF qua link R2 5 phút.
4. **Kênh liên hệ gỡ bỏ**: địa chỉ email (hoặc biểu mẫu) trên trang `/about`, kèm quy trình xử lý yêu cầu gỡ bài. Cần chủ dự án chọn kênh.
5. **Quyết định mở cho công cụ tìm kiếm**: đặt `ALLOW_INDEXING=1` chỉ sau bước 4; đi kèm CSP (C6) và các việc C1 đến C3 đã xử lý hoặc quyết định không làm.
6. **Kiểm thử trên địa chỉ thật**: chạy lại bộ kiểm khách (PDF đóng 403, PDF mở 302 tới R2, quản trị 404, `robots.txt` đúng theo quyết định ở 5, 429 thật), và đo lại hiệu năng như 4.7.

**Điều kiện xong (đề xuất):** web mở bằng tên miền thật; đăng nhập chủ hoạt động; kênh gỡ bỏ có trên trang Giới thiệu; `robots.txt` và `X-Robots-Tag` đúng quyết định mở hay đóng.

## E. Câu hỏi cần chủ dự án trả lời

1. Có sửa các điểm A1 đến A7 theo đề xuất không, và theo thứ tự nào?
2. Có đưa đoạn B vào `PROJECT_PLAN.md` không (cần thêm một dòng ở `CHANGELOG.md`)?
3. Làm trước C1 (cache) hay C2 (quyền cột `papers`)? Tôi nghiêng về C2 trước vì liên quan trực tiếp đến lộ thông tin và có thể kiểm bằng test, còn C1 cần quyết cách làm mới cache.
4. Tên miền, nhà đăng ký và kênh gỡ bỏ cho 4.8 (mục D, bước 1 và 4).
5. Có dạy cả lớp qua web này không (quyết C5)?
