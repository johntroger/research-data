# Báo cáo bước 4.7: đo hiệu năng thật và rà soát bảo mật

> Ngày 25/10/2026, chạy trên phiên cloud. Chỉ đo và đọc mã; không đổi cấu hình, không đăng nhập, không dùng `.env`. Đây là báo cáo để chủ dự án quyết định; chưa sửa gì trong `PROJECT_PLAN.md`.

## 1. Đo hiệu năng

**Máy đo:** Mỹ (IP `160.79.106.18`; `ifconfig.co` báo Kansas, `ipinfo.io` báo Columbus, Ohio). Mọi lượt có `x-vercel-id: iad1::sin1::…`: yêu cầu vào cổng Vercel ở Mỹ rồi hàm chạy ở Singapore (`sin1`, đúng cấu hình). Người dùng ở Việt Nam vào cổng gần hơn nên số dưới đây **cao hơn thực tế ở Việt Nam**; chênh bao nhiêu chưa đo. Yêu cầu còn đi qua proxy của sandbox.

**Cách đo:** `curl -w` tuần tự, nghỉ 1,2 giây giữa các lần, 25 lượt mỗi trang (150 yêu cầu), không gặp 429. Thời gian tính bằng giây. LCP bằng Playwright (Chromium), 5 lượt mỗi trang, trung vị.

| Trang | Lượt đầu: TTFB / tải HTML | Ấm: TTFB trung vị | TTFB p95 | Tải HTML trung vị | Tải HTML p95 | LCP trung vị |
|---|---|---|---|---|---|---|
| `/` | 0,54 / 0,78 | 0,58 | 0,85 | 0,79 | 1,07 | 0,93 s |
| `/?a=ethicality&b=trust` | 0,56 / 0,57 | 0,62 | 0,85 | 0,84 | 1,08 | 0,79 s |
| `/library` | 0,48 / 0,75 | 0,49 | 0,75 | 0,72 | 0,99 | 0,91 s |
| `/matrix` | 0,62 / 0,86 | 0,60 | 1,59 | 0,83 | 1,82 | 1,01 s |
| `/papers/<id>` | 0,49 / 0,93 | 0,55 | 0,77 | 0,96 | 1,04 | 0,86 s |
| `/api/matrix/<id>` | 0,46 / 0,46 | 0,49 | 0,71 | 0,49 | 0,71 | — |

Không có API lọc riêng; lọc và tìm quan hệ là kết xuất trang.

**So với mục tiêu Giai đoạn 4 (mục 3):**
- Trang < 0,8 s: từ máy đo ở Mỹ, chỉ `/library` dưới 0,8 s ở trung vị, `/` sát ngưỡng; p95 từ 1,0 đến 1,8 s. Chưa đạt hẳn; từ Việt Nam chưa biết.
- Tìm quan hệ < 200 ms p95: TTFB p95 là 0,85 s, chưa đạt nếu đọc nguyên số vì gồm cả mạng Mỹ–Singapore. API `/api/matrix/<id>` gần như không xử lý mà vẫn 0,49 s (mức nền); trang tìm quan hệ chỉ hơn mức nền khoảng 0,13 s (trung vị) và 0,14 s (p95). Suy luận, chưa kiểm chứng: phần xử lý của ứng dụng đạt 200 ms.

**Hạn chế:** lượt "lạnh" không thật sự lạnh (hàm đã được gọi thử trước khi đo); chưa đo hàm ngủ lâu.

**Phát hiện:**
1. Mọi lượt đều `x-vercel-cache: MISS`, `cache-control: private, no-cache, no-store`: không trang nào được cache, kể cả `/library`, `/matrix`, trang bài.
2. 1/150 lượt `/` trả 500 sau 5,18 s (chưa rõ nguyên nhân; nhật ký ở bảng điều khiển Vercel).
3. `/matrix` có đuôi chậm: TTFB p95 1,59 s so với trung vị 0,60 s.

**Đề xuất (chưa làm):** cho cache các trang công khai ít đổi (`s-maxage` hoặc ISR, làm mới sau mỗi lần nhập dữ liệu); xem nhật ký Vercel quanh lần 500 và đuôi chậm của `/matrix`; đo lại từ Việt Nam hoặc Singapore và một lần với hàm đã ngủ lâu.

## 2. Rà soát bảo mật (đọc mã `apps/web`, `supabase/migrations`, `.github/workflows`)

Không thấy lỗ hổng nghiêm trọng. Làm tốt: quyền xem/tải PDF một hàm dùng chung, mặc định từ chối; khóa R2 chỉ nhận hash SHA-256; link PDF 5 phút, token chỉ đọc; chủ dự án xác định qua email đã xác nhận + `ADMIN_EMAILS` + `app_metadata.role`, token được Supabase xác thực lại mỗi lần; RLS bật mọi bảng, cột `raw_extraction` bị chặn theo cột; `count_event` chỉ nhận danh sách đóng; CI chỉ `contents: read`; không có khóa nào trong lịch sử git (quét 50 commit theo mẫu JWT, `sk-`, `AIza`, `AKIA`).

| # | Mức | Điểm yếu | Cách giảm |
|---|---|---|---|
| 1 | Trung bình | Gọi thẳng API Supabase bằng khóa `anon` công khai bỏ qua giới hạn tốc độ của Vercel (scrape, tốn hạn mức, làm sai số thống kê) | Xem giới hạn tốc độ phía Supabase |
| 2 | Trung bình (về dùng thật) | Giới hạn 120/60 yêu cầu mỗi phút mỗi IP có thể chặn cả lớp dùng chung Wi-Fi (suy luận, chưa mô phỏng) | Nới hạn mức khi cần |
| 3 | Thấp đến trung bình | `papers` cho khách đọc mọi hàng và mọi cột trừ `raw_extraction` (kể cả `pdf_path`, `file_hash`, bài chưa công bố); `file_hash` là khóa object R2, bucket private nên chưa đủ để lấy file (chưa kiểm cấu hình bucket) | Cấp quyền theo cột, bỏ `pdf_path` và `file_hash` khỏi `anon` nếu giao diện không cần |
| 4 | Thấp | CSP chỉ có `frame-ancestors` (đã ghi ở 4.1) | CSP đầy đủ trước khi mở cho công cụ tìm kiếm |
| 5 | Thấp | `/login` dựng link từ header `Host` | Giữ chặt danh sách chuyển hướng Supabase; kiểm lại ở 4.8 |
| 6 | Thấp | Kho giới hạn lỗi thì web cho qua hết (theo thiết kế) | Chấp nhận |
| 7 | Rất thấp | Xuất Excel ghi chuỗi, không phải công thức | Không cần |

**Lỗ hổng thư viện:** `pnpm audit --prod` (chạy bằng pnpm 12.14.0 cài ngoài repo) báo 1 cảnh báo mức trung bình: `uuid` < 11.1.1 thiếu kiểm tra giới hạn buffer ở v3/v5/v6 khi truyền `buf` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)), đường phụ thuộc `apps/web > exceljs > uuid`. Chưa kiểm `exceljs` có gọi các hàm đó với buffer riêng không, nên chưa kết luận mức ảnh hưởng thật. Nên thêm `pnpm audit --prod` vào CI.

**Chưa kiểm:** cài đặt bảo vệ GitHub (4.5) và cấu hình R2, Supabase, Vercel; không thử xâm nhập thật.
