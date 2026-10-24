# Lịch sử thay đổi kế hoạch

> Tách từ `PROJECT_PLAN.md` (Mục 0) ở bước 0.9. Phiên bản mới nhất ở trên cùng.

### Version 3.9.81 (so với 3.9.80)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.6:** đếm lượt dùng theo ngày và theo loại, không lưu IP hay cookie: bảng `usage_daily`, hàm `count_event` (danh sách đóng 9 loại) và `usage_report` (migration `usage_counters`, đã áp lên local và prod); `lib/usage.ts`, `lib/track.ts`, `POST /api/event`, trang `/admin/usage`, mục Quyền riêng tư ở trang Giới thiệu; script Cloudflare Web Analytics tùy chọn theo `NEXT_PUBLIC_CF_BEACON_TOKEN`; không đếm lượt của chủ; 97 test DB, 554 test đơn vị, 14 e2e production, 51 e2e dev xanh | Chủ dự án duyệt 24/10/2026 (Giai đoạn 4) |

### Version 3.9.80 (so với 3.9.79)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.5:** bảo vệ nhánh `main` (bắt buộc check `check` cho hợp nhất qua PR, cấm force-push và xóa nhánh; chủ vẫn push thẳng được); secret scanning và push protection đã bật và đã thử chặn một token giả; bản preview bị Vercel chặn với người lạ và Supabase không chuyển hướng đăng nhập về đó | Chủ dự án duyệt 24/10/2026 (Giai đoạn 4) |

### Version 3.9.79 (so với 3.9.78)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Làm rõ web mở cho mọi người, không cần đăng nhập: liên kết "Đăng nhập" dời từ đầu trang xuống chân trang, thêm dòng "Mở cho mọi người..." ở trang chủ và đoạn ở trang Giới thiệu; thêm e2e production cho khách (dùng được tìm kiếm, thư viện, ma trận, xuất không cần đăng nhập; link đăng nhập ở chân trang) | Chủ dự án muốn public cho mọi người, không cần đăng nhập; quy tắc PDF D14 và việc đóng với công cụ tìm kiếm giữ nguyên |

### Version 3.9.78 (so với 3.9.77)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.4:** deploy lần đầu lên `https://research-data-five.vercel.app`; vùng hàm đặt `sin1` ở cài đặt dự án (`regions` trong `vercel.json` vô hiệu ở Hobby, đã bỏ); thêm địa chỉ vào CORS R2 và Auth Supabase (`supabase/config.toml`: `site_url`, chuyển hướng); đã kiểm trên địa chỉ thật: khách bị chặn, noindex, header, CORS, `TRUST_PROXY` với header giả, 429 qua Upstash thật, chủ đăng nhập bằng link email thật, trang quản trị, PDF bài đóng | Chủ dự án duyệt 23/10/2026 (Giai đoạn 4) |

### Version 3.9.77 (so với 3.9.76)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.3:** `scripts/set-vercel-env.mjs` đẩy 9 biến môi trường production và preview lên Vercel từ danh sách cố định, giá trị ẩn trong log, có danh sách cấm (không bao giờ đưa mật khẩu database, khóa quản trị, token R2 đọc/ghi và sao lưu, khóa trích xuất); đã đối chiếu bằng `vercel env ls` | Chủ dự án duyệt 23/10/2026 (Giai đoạn 4) |

### Version 3.9.76 (so với 3.9.75)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.2:** dự án Vercel `research-data` (nhóm VNEconomics, Hobby) nối GitHub, Root Directory `apps/web`, Node 24, `ENABLE_EXPERIMENTAL_COREPACK`; Upstash for Redis qua Marketplace nối vào dự án; test Lua thật trên Upstash thật qua (5/5); chưa deploy (chờ biến môi trường ở 4.3); dọn tệp thừa do `vercel link` và lệnh cài Upstash tạo ra | Chủ dự án duyệt 23/10/2026 (Giai đoạn 4) |

### Version 3.9.75 (so với 3.9.74)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 4.1:** bộ đếm Upstash cho giới hạn tốc độ (Lua, fail-open, chọn theo biến môi trường); `robots.txt` đóng, `noindex`, header bảo mật; `/matrix` nạp kiểm định từng bài khi mở (HTML 1,16 MB còn 151 KB); `ci.yml`; `apps/web/vercel.json` (vùng `sin1`); `.env.example` thêm biến mới; ghi danh sách 4.1 đến 4.8 vào kế hoạch Giai đoạn 4 | Chủ dự án duyệt 23/10/2026 (Giai đoạn 4, bốn mặc định) |

### Version 3.9.74 (so với 3.9.73)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.6, đóng D2:** thử thật trên prod ở chế độ production: chủ đăng nhập bằng link email thật, trang quản trị đọc bằng phiên (ẩn 452), xem và tải PDF bài đóng; khách (không cookie) bị chặn PDF bài đóng (403), trang quản trị (404), không thấy trường ẩn hay lượt trích xuất, `quality_report` bị từ chối. D2 chuyển sang "làm xong và thử thật" | Chủ dự án duyệt 23/10/2026 |

### Version 3.9.73 (so với 3.9.72)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.5:** giới hạn tốc độ theo IP (`lib/rate-limit.ts`, `proxy.ts`): cửa sổ trượt, chỉ đếm yêu cầu được cho qua, IP băm có muối, 429 kèm `Retry-After`, mức theo loại yêu cầu (trang, tìm kiếm, PDF, tải PDF, xuất, đăng nhập); bật khi production, `TRUST_PROXY=1` mới tin `x-forwarded-for`; kho trong bộ nhớ, Upstash gắn khi lên Vercel; 13 test đơn vị, 6 e2e production | Chủ dự án duyệt 23/10/2026 (rủi ro 18: web công khai bị lạm dụng) |

### Version 3.9.72 (so với 3.9.71)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.4:** bộ e2e chế độ production (`pnpm test:e2e:prod`, `e2e/prod-owner.spec.ts`, `playwright.prod.config.ts`, `e2e/support/local-auth.ts` dùng chung với `login.spec.ts`): khách bị chặn, chủ đăng nhập bằng link thật xem và tải PDF bài đóng qua R2 và vào trang quản trị, đăng xuất thì mất quyền | Chủ dự án duyệt 23/10/2026; chứng minh trường hợp triển khai thật (không có lối tắt máy dev) |
| 2 | Route PDF: nhánh đọc tệp từ đĩa chỉ khi phát triển (production thiếu R2 trả 503); `distDir` theo `NEXT_DIST_DIR`; ESLint bỏ qua `.next-prod` | Cảnh báo build: truy cập tệp làm cả dự án bị đóng gói, sẽ cản triển khai Vercel |

### Version 3.9.71 (so với 3.9.70)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.3:** migration `owner_access` (`is_owner()`, chính sách chủ đọc mọi hàng cho 24 bảng, hàm `quality_report`); `/admin/quality` đọc bằng phiên chủ (`lib/quality-session.ts`) hoặc kết nối trực tiếp ở máy dev (`lib/quality.ts` chỉ còn ánh xạ kết quả của hàm DB); 8 test DB, 2 test đơn vị mới; đã áp lên local và prod và thử bằng khóa khách và phiên chủ thật | Chủ dự án duyệt 23/10/2026 (D2: trường ẩn chỉ hiện cho quản trị) |

### Version 3.9.70 (so với 3.9.69)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.2:** đăng nhập chủ bằng link email: `/login`, `/auth/callback`, `/auth/logout`, `proxy.ts`, `lib/owner.ts`, `lib/supabase-server.ts`, header Đăng nhập hoặc Đăng xuất; thêm `@supabase/ssr` và `@supabase/supabase-js` vào `apps/web`; biến `ADMIN_EMAILS`; route PDF và trang bài dùng `getOwner()`; 6 test đơn vị và 4 test e2e mới (49 e2e xanh), e2e đi trọn luồng link thật qua Mailpit của Supabase local | Chủ dự án duyệt 23/10/2026 (D2) |

### Version 3.9.69 (so với 3.9.68)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước A.1:** cấu hình Supabase Auth cho prod bằng `supabase config push` (tắt tự đăng ký, chuyển hướng `localhost:3000`, link hết hạn 15 phút; giá trị khác của prod giữ nguyên); tạo tài khoản chủ `tranthanhtung37@gmail.com` (`role = owner`); đã thử: đăng ký và gửi link cho email lạ bị từ chối. Ghi danh sách A.1 đến A.6 vào kế hoạch Giai đoạn 2 | Chủ dự án duyệt 23/10/2026 (D2: đăng nhập quản trị, tắt tự đăng ký) |

### Version 3.9.68 (so với 3.9.67)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.4b:** lệnh `pnpm worker backup-files` sao lưu bản trích xuất đã lưu (`extracted_data/`, bỏ `backups/` và `audit/`) lên R2 bucket sao lưu, kiểm bằng tải lại và so SHA-256, giữ 12 bản; thêm `@aws-sdk/client-s3` vào worker; 4 test đơn vị mới | Chủ dự án duyệt 23/10/2026: sao lưu `extracted_data` lên R2, bỏ mẫu audit và sao lưu cũ |

### Version 3.9.67 (so với 3.9.66)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.4:** sao lưu hằng đêm Supabase prod lên R2 bằng GitHub Actions (`.github/workflows/backup.yml`, `scripts/backup-prod.sh`), bucket riêng `research-data-backups`, token giới hạn đúng bucket, giữ 30 bản; `scripts/set-r2-keys.ps1 -Role backup` và `scripts/set-github-secrets.ps1`; đã chạy tay, phục hồi thử khớp prod, thử dọn bản cũ; hướng dẫn phục hồi ở architecture Mục 9.3; `keepalive.yml` không cần nữa | Chủ dự án duyệt 23/10/2026 (kế hoạch Giai đoạn 2 mục 4) |

### Version 3.9.66 (so với 3.9.65)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.2c:** Unpaywall (`metadata/unpaywall.ts`, `db/oa.ts`, lệnh `pnpm worker oa`), migration `oa_fields` (3 cột), `license_source = 'oa'` chỉ với giấy phép CC / public domain; 7/36 bài mở; áp lên local và prod | D14: khách chỉ tải được bài OA có giấy phép mở; chủ dự án duyệt quy tắc gồm cả NC và ND |
| 2 | Web: khách chỉ **xem** và tải PDF bài giấy phép mở (trước đó ai cũng xem được); bài khác hiện khung kèm "Bản OA" và "Mở DOI"; `canViewPdf`, `pdfLinks`; `prodDbUrl` cho `--target prod`; 18 test đơn vị mới (516 đơn vị, 85 DB, 45 e2e xanh) | Thực hiện Mục 7 / D14 trước khi mở công khai |

### Version 3.9.65 (so với 3.9.64)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.2b:** route PDF cấp presigned URL R2 5 phút (`lib/r2.ts`, thêm `@aws-sdk/client-s3` và `s3-request-presigner` vào `apps/web`), có dự phòng đọc tệp local; `scripts/set-r2-keys.ps1` nhập khóa ẩn; 5 test đơn vị mới (503 đơn vị, 45 e2e xanh); đã thử với token thật (token chỉ đọc, không ghi được, không đọc bucket khác) | Chủ dự án duyệt 23/10/2026 |

### Version 3.9.64 (so với 3.9.63)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.2a:** tạo bucket R2 private `research-data-pdfs`, đặt CORS cho pdf.js (localhost:3000), tải 36/36 PDF theo khóa `pdf/<sha256>.pdf` (đã kiểm hash, bucket không truy cập công khai được) | Chủ dự án duyệt 23/10/2026; Cloudflare còn nhiều dung lượng hơn Supabase |

### Version 3.9.63 (so với 3.9.62)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.3:** nạp 36 bài (24 bảng) từ local lên Supabase prod có sao lưu; đối chiếu số dòng và huy hiệu bằng nhau; web đọc từ prod hiện đúng 36 bài, 10.294 giá trị | Chủ dự án duyệt 23/10/2026 |
| 2 | Thêm Mục 9.3b (docs/architecture.md): phân chia lưu trữ, Supabase chỉ giữ dữ liệu truy vấn, PDF, bản trích xuất đã lưu và sao lưu sang R2; ngưỡng chuyển `extraction_runs.raw_text` khi database vượt 300 MB | Chủ dự án yêu cầu cân đối vì R2 còn nhiều dung lượng hơn |

### Version 3.9.62 (so với 3.9.61)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 2.1:** tạo Supabase `prod` (project `research-data`, Free, Singapore), áp 8 migrations, kiểm RLS bằng khóa anon trên prod (không thấy trường ẩn, không ghi được; 24 bảng bật RLS). Khóa và mật khẩu chỉ ở `.env` | Chủ dự án duyệt 23/10/2026 |

### Version 3.9.61 (so với 3.9.60)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3b.5:** nút "Copy câu" (câu kết quả kèm thống kê APA và trích dẫn, chỉ kiểm định ✓ / ★) ở Relationship Search; khung "Hướng dẫn nhanh" 3 việc trên trang chủ; `lib/sentence.ts`; 8 test đơn vị và 1 test e2e mới (498 đơn vị, 45 e2e xanh). Kết thúc danh sách 3b.1 đến 3b.5 | Danh sách bước 3b do chủ dự án duyệt 23/10/2026 |

### Version 3.9.60 (so với 3.9.59)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3b.4:** trang `/about` (Giới thiệu và cách đọc dữ liệu) với số liệu kho sống, bảng huy hiệu, ba lần kiểm mẫu, giới hạn; `getOverview` trong `lib/data.ts`; liên kết "Giới thiệu" ở đầu trang; 2 test e2e mới | Danh sách bước 3b do chủ dự án duyệt 23/10/2026 |

### Version 3.9.59 (so với 3.9.58)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3b.3:** xuất Word APA 7 cho Relationship Search (`/export/word`) và ma trận (`/matrix/word`); thêm thư viện `docx` vào `apps/web`, mã `lib/word-export.ts`; 4 test đơn vị và 2 test e2e mới (490 đơn vị, 42 e2e xanh); đã mở thử file thật (khổ ngang, Times New Roman, bảng và ghi chú) | Danh sách bước 3b do chủ dự án duyệt 23/10/2026 |

### Version 3.9.58 (so với 3.9.57)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3b.2:** trang `/matrix` (ma trận tổng hợp Master-Detail): `lib/matrix.ts`, `app/matrix/page.tsx`, bộ lọc dùng chung `app/library/filters.tsx`, liên kết "Ma trận" ở đầu trang; 5 test đơn vị và 4 test e2e mới | Danh sách bước 3b do chủ dự án duyệt 23/10/2026 |

### Version 3.9.57 (so với 3.9.56)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3b.1:** bộ lọc Thư viện (tìm chữ, năm, loại bài, thiết kế, loại mẫu, quốc gia, tỷ lệ ⚠, có ma trận; số bài mỗi giá trị; URL chia sẻ được), nút Copy APA và liên kết DOI. Mã mới: `lib/library.ts`, `lib/apa.ts`, `app/library/*`; 11 test đơn vị và 4 test e2e mới (481 đơn vị, 36 e2e xanh) | Danh sách bước 3b do chủ dự án duyệt 23/10/2026 |

### Version 3.9.56 (so với 3.9.55)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Mục 6.12: kiểm mẫu lần 3 (30 ✓ + 10 ⚠, chấm mù bằng Sonnet): 28 đúng, 2 không phán đoán được, 0 sai | Xác nhận chất lượng bài do tác tử Claude trích |
| 2 | Sửa `&amp;` hiện nguyên văn ở tên tạp chí (Crossref trả thực thể HTML): `crossref.ts` giải mã thực thể, thêm 1 test (470 xanh), sửa 4 dòng trong database | Phát hiện khi kiểm web kho 36 bài |

### Version 3.9.55 (so với 3.9.54)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **OCR trên máy cho bài scan:** lệnh `pnpm worker ocr`, `pdf/ocr.ts` (tesseract.js, @napi-rs/canvas, pdfjs-dist), `loadTextLayer` áp văn bản OCR trong publish, export gói và import; thêm 4 thư viện npm vào worker (không cài gì vào Windows). 3 test mới (469 đơn vị xanh) | Bài Dodds 1991 là bản scan không có lớp chữ nên trước đây không kiểm chứng được; chủ dự án đồng ý cài OCR |
| 2 | Nhập complaining và gratitude-model (tỷ lệ vấn đề 40,6% và 26,4% nhưng phần lớn là trường ẩn); price-brand (OCR, 31%) giữ lại chờ chủ dự án. Sửa test bảng sau khi thêm view `paper_badge_counts` (85 DB xanh) | Hoàn tất hàng đợi |

### Version 3.9.54 (so với 3.9.53)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Lô 13 bài hàng đợi bằng tác tử Claude (Mục 6.11):** nhập 10 bài (tỷ lệ vấn đề 1,5% đến 10,9%); giữ complaining (40,6%) và gratitude-model (26,4%) chờ chủ dự án; price-brand là bản scan ảnh nên không làm được. Cả kho 36 bài, 9461 trường (✓ 7214 · ⚠ 1167 · ◇ 712 · ẩn 368), 899 đường dẫn hiển thị | Theo quy tắc chủ dự án chốt 22/10/2026 |
| 2 | **Sửa lỗi NUL = dấu trừ** trong lớp chữ PDF (`fixNul`, khung tô sáng, nhập câu trả lời); 1 test mới, 466 đơn vị xanh | PDF lưu dấu trừ trong phông ký hiệu thành ký tự NUL; cơ sở dữ liệu từ chối và số âm bị ẩn |

### Version 3.9.53 (so với 3.9.52)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Đổi thứ tự ưu tiên nguồn trích xuất (D16, chủ dự án chốt 22/10/2026): tác tử Claude → Codex → Antigravity → Gemini API.** Bài nào tỷ lệ vấn đề > 20% thì giữ lại và báo chủ dự án trước khi thử nguồn kế tiếp; Gemini API vẫn cần đồng ý trước khi chi tiền. Cập nhật CLAUDE.md. Đã giao tác tử Claude trích 13 bài còn lại trong hàng đợi | Tác tử Claude đạt 5 đến 8% ở lượt thử (Mục 6.11), Codex hết token |

### Version 3.9.52 (so với 3.9.51)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Khung tô sáng cho bảng xoay ngang lưu theo từng ô:** `pdf/locate.ts` thêm cách đọc `turnedOrder` (gom chữ xoay thành từng dòng theo cột trang, đọc theo chiều xoay) vì file PDF có thể lưu ô này sang ô khác chứ không theo dòng. Kết quả: csr-emotions 45% → 100% (759/759); cả kho 5787/6561 trường có câu trích được định vị (88,2%). 2 test mới (11 test locate) | Bảng trang 11 của csr-emotions (486 trường) không có khung |

### Version 3.9.51 (so với 3.9.50)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Thử tác tử Claude làm nguồn trích xuất (Mục 6.11):** gói nay kèm `text/page-NN.txt` (văn bản từng trang đúng như máy kiểm đọc) và dòng hướng dẫn chép câu trích từ đó; với gói này tác tử Claude đạt tỷ lệ vấn đề 5% (brand-integrity) và 8% (csr-emotions), so với 31% và 55% khi chưa có văn bản trang, và Codex khoảng 17%. Kiểm mù 12 giá trị bằng model khác: 10 đúng, 2 không kết luận, 0 sai | Codex hết token; chủ dự án chọn thử |
| 2 | Nhập 2 bài pilot (csr-emotions 770 trường, brand-integrity 577 trường); cả kho 6914 trường: ✓ 5025 · ⚠ 1069 · ◇ 467 · ẩn 353. 13 bài còn lại trong hàng đợi chờ Codex (chủ dự án quyết) | Quyết định của chủ dự án |

### Version 3.9.50 (so với 3.9.49)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Mở rộng kho (quyết định của chủ dự án, 21/10/2026):** thêm các thư mục Zotero "2.1 - Perceived ethical value" (11 bài), "3 - Brand trust", "4 - Brand loyalty", "5 - Positive eWOM", "6 - Purchase intention" (6 bài), "Transparency & disclosure" (6 bài, thư mục con của thư mục 1), "Brand Gratitude" (6 bài). Cập nhật quy ước trong CLAUDE.md. Các thư mục METHODOLOGY, Theoretical framework, REFERENCES không thêm khi chưa hỏi | Thêm bài ngoài thư mục ban đầu để Relationship Search có nhiều đường dẫn hơn |

### Version 3.9.49 (so với 3.9.48)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Điện thoại:** chạm một giá trị thì trang tự cuộn tới khung PDF (hai khung xếp chồng khi màn hình ≤ 900 px, PDF nằm dưới danh sách giá trị nên trước đây phải tự cuộn). Đã kiểm trên bề rộng 375 px: trang chủ, thư viện và trang bài không bị tràn ngang. Thêm 1 test e2e (32 e2e xanh) | Rà giao diện trên màn hình hẹp |
| 2 | Chuẩn bị gói Codex `montecchi` (bài thực nghiệm nhiều Study chưa có bản trích xuất đầy đủ) để chạy khi chủ dự án rảnh | Bài Montecchi 2024 là bài có dữ liệu thật nhưng đang chỉ có vài trường |

### Version 3.9.48 (so với 3.9.47)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Trang lỗi thân thiện (`app/error.tsx`):** khi không đọc được dữ liệu (cơ sở dữ liệu chưa bật) hiện hướng dẫn tiếng Việt (mở Docker Desktop, `pnpm db:start`) và nút "Thử lại" thật sự tải lại trang, thay cho lỗi 500 trần. Đã thử bằng cách tắt container REST rồi bật lại | Docker Desktop tự tắt qua đêm nhiều lần; trước đây người dùng chỉ thấy lỗi 500 |
| 2 | **Thư viện hiển thị thêm** tác giả (năm), tạp chí và số trường ✓ / ⚠ / ◇ của từng bài (view mới `paper_badge_counts` với `security_invoker`, nên khách chỉ thấy số trường hiện được; migration `20261021100000`) | Chọn bài nào để mở thì cần biết bài nào đã được kiểm chứng nhiều |
| 3 | Test: 1 kiểm tra e2e thư viện (31 e2e xanh), 461 đơn vị, build ok | Kiểm thử |

### Version 3.9.47 (so với 3.9.46)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Sửa lỗi chỉ số ma trận ABE (Mục 6.10):** `normaliseMatrixIndices` (chuyển ma trận đếm từ 1 về 0 khi có ô i = số biến) và `matrixPositions` + kiểm tra `cell_position` (số phải đúng cột của ô), nối vào `publishExtracted` và `verify-full`; đăng lại 18 bài (sao lưu DB trước) | Kiểm mẫu lần 2: 4 ma trận ABE (288 ô theo dữ liệu đã lưu) gắn lệch một ô nhưng vẫn ✓ |
| 2 | Kết quả: ABE ✓ 617 → 696, ⚠ 752 → 673; cả kho ✓ 3349, ⚠ 960. 12/12 ô ABE kiểm lại đúng ô. Test: 460 đơn vị, 84 DB | Kiểm thử |

### Version 3.9.46 (so với 3.9.45)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kiểm mẫu lần 2 (Mục 6.10):** 30 trường ✓ + 10 trường ⚠ trên kho mới, kiểm chéo 10 trường bằng tác tử AI khác không thấy câu trích (trùng 10/10). Kết quả: 20 đúng, 4 gắn nhầm ô, 6 không kết luận được, 0 sai giá trị; 9/10 ⚠ có cơ sở | Đo lại độ đúng sau khi làm lại 9 bài bằng Codex |
| 2 | **Phát hiện lỗi hệ thống:** 4 ma trận của bài ABE (172 ô) dùng chỉ số ô đếm từ 1; chưa sửa, chờ chủ dự án duyệt hướng sửa (chuẩn hóa chỉ số + kiểm tra đúng cột) | Phát hiện trong kiểm mẫu, được tác tử kiểm chéo xác nhận |

### Version 3.9.45 (so với 3.9.44)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kiểm tra dấu của số so với câu trích (Mục 6.10):** `signCounts` (number.ts), `signChecks` và kiểm tra `sign_in_quote` (checks.ts, ⚠ khi dấu ngược rõ ràng); `findRowQuote` loại dòng chỉ in số với dấu ngược. Đã đăng lại 18 bài (sao lưu DB trước) | Đo kho: 6/1414 trường số có dấu ngược mà vẫn ✓ (4 r2_dv, 2 ô r) |
| 2 | Kết quả: dấu ngược 6 → 0; huy hiệu cả kho không đổi (✓ 2904, ⚠ 834). Test: 446 đơn vị, 84 DB. Điểm yếu phát hiện khi đo (5 trường r2_dv của bài Patterson trích nhầm một câu văn) đã sửa cùng ngày: `findRowQuote` chỉ nhận dòng giống dòng bảng (≤ 12 từ chữ), đăng lại 18 bài; 5 trường nay trích đúng câu R² = 27%. Huy hiệu cả kho ✓ 2904 · ⚠ 836 · ◇ 397 · ẩn 460; test 448 đơn vị | Kiểm thử bước |

### Version 3.9.44 (so với 3.9.43)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Sửa câu trích bằng chứng cho ô bảng (Mục 6.10):** `verify/row-quote.ts` (chọn dòng chứa ô), nối vào `verify-full` cho ô r ma trận, bảng mô tả, r2_dv, f2; kiểm tra mới `quote_has_value` (không tìm được dòng thì ⚠). Tách `containsNumber` khỏi `number.ts` (không đổi hành vi) | Kiểm mẫu: 30% câu trích không chứa giá trị |
| 2 | Lệnh `pnpm worker republish [--paper X] [--yes]`: đăng lại các bản trích xuất đã lưu với kiểm tra hiện tại (không tốn API, sao lưu DB trước, bài Codex dùng khóa `-manual`). Đã chạy cho 18 bài | Đưa cải tiến lên web |
| 3 | Kết quả đo cả kho: câu trích không chứa giá trị ở trường số ✓ giảm từ 35,9% xuống 10,2% (ô r ma trận 69% → 0%); huy hiệu ✓ 2875 → 2904, ⚠ 860 → 834. Test: 439 đơn vị, 84 DB. Giới hạn còn lại ghi ở Mục 6.10 | Kiểm thử bước |

### Version 3.9.43 (so với 3.9.42)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kiểm mẫu độ đúng ✓ (Mục 6.10):** 30 trường ✓ ngẫu nhiên có phân tầng, Claude đọc PDF độc lập chấm từng trường. 30/30 giá trị đúng và gắn đúng (cận trên lỗi ≤ 11,6%); 9/30 (30%) có câu trích bằng chứng không chứa giá trị (chủ yếu ô ma trận / bảng tâm lượng trỏ sai dòng). Mẫu và nhận xét chi tiết ngoài git | Chủ dự án muốn AI tự kiểm thay vì kiểm tay; đo độ đúng thật của ✓ lần đầu |

### Version 3.9.42 (so với 3.9.41)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Sửa thanh tổng hợp của Relationship Search (việc B sau 3a):** khi có kiểm định nhưng không cái nào ✓ / ★, khung xanh ghi "Chưa có kiểm định nào đã kiểm chứng (✓)" và ẩn hai dòng toàn số 0 (kết quả giả thuyết, chiều tác động); dòng bên dưới đọc "N kiểm định ⚠ hoặc ◇ chưa kiểm chứng, chưa được tính" kèm liên kết "Tính cả ⚠ để xem số liệu sơ bộ". Các trường hợp khác giữ nguyên | Góp ý khi dùng thật: "0 bài · 0 kiểm định" dễ hiểu nhầm là kho không có dữ liệu. Cách hiển thị do chủ dự án chọn |
| 2 | Test: thêm 1 test e2e (chỉ có kiểm định ⚠: câu mới, hai dòng số 0 biến mất, bấm "Tính cả ⚠" quay lại tổng hợp thường) và sửa 2 test cũ theo lời mới. Tổng: 427 test đơn vị, 31 e2e xanh | Kiểm thử |

### Version 3.9.41 (so với 3.9.40)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Đóng Giai đoạn 3a (20/10/2026):** 3a.6 xong. Ba bài Gemini cũ được làm lại bằng Codex và nhập (sao lưu DB trước mỗi lần): Serial Mediation ✓ 85→88, ⚠ 28→29; Ethical Brand ✓ 80→74, ⚠ 17→4; Green Purchase ✓ 80→67, ⚠ 25→17 (không tăng ⚠ ở bài nào ngoài một đơn vị). Khung tô sáng 61% / 100% / 76% trường có câu trích. Số phút Codex **không đo**. Một câu hỏi thật trong Relationship Search đánh giá hữu ích | Chủ dự án chọn đóng 3a |
| 2 | Sổ `docs/usage-log.md` ghi 4 góp ý / quan sát: dòng tổng hợp `0 bài` khi mọi kiểm định ⚠ (khó chịu, chưa xử lý), số trong hình không có khung (điểm yếu đã biết), dòng bảng rộng thiếu khung, câu hỏi thật hữu ích | Dùng thật |

### Version 3.9.40 (so với 3.9.39)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.6 (bắt đầu):** thêm `docs/usage.md` (quy trình thêm bài mới Zotero → Codex → import → khung tô sáng; cách dùng web; tiêu chí "đã dùng đủ") và `docs/usage-log.md` (sổ góp ý và số liệu mỗi bài). Phát hiện: thư mục Zotero hiện tại chỉ có 7 bài, 6 đã nhập bản Codex, bài thứ 7 (định tính) bị loại, nên **không còn bài mới trong thư mục**; cần chủ dự án chọn nguồn bài cho 3a.6 | Chủ dự án duyệt đề xuất 3a.6 |

### Version 3.9.39 (so với 3.9.38)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.5:** nút "Tải PDF" trong trình xem; `/api/papers/[id]/pdf?download=1` trả file dạng đính kèm, tên file ASCII lấy từ tiêu đề. Quyền do **một hàm** `lib/pdf-access.ts` quyết (cả nút lẫn route dùng chung): chủ dự án (máy truy cập được cơ sở dữ liệu trực tiếp, cùng điều kiện với `/admin`) tải mọi bài; khách chỉ tải bài có `license_source = oa` và `oa_status` gold / green / hybrid (bronze không tính là giấy phép mở); không rõ thì từ chối (403). Xem PDF trong trang giữ nguyên | Quyết định đã chốt: nút tải cho chủ, khách chặn sẵn; đăng nhập thật để Giai đoạn 2 |
| 2 | Test: 4 test đơn vị mới (quyền, tên file), 2 test e2e mới (nút và tiêu đề đính kèm; bài không có file thì không có nút). Nhánh từ chối khách chỉ kiểm bằng test đơn vị vì máy dev luôn là chủ. Tổng: 427 test đơn vị, 84 DB, 30 e2e xanh | Kiểm thử bước |

### Version 3.9.38 (so với 3.9.37)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.4:** nút "Tải Excel (n kiểm định)" trên trang Relationship Search; `GET /export?<cùng tham số tìm kiếm>` trả file .xlsx đúng danh sách đang hiện (cả ⚠ / ◇, có cột huy hiệu để lọc). Sheet "Kết quả" 16 cột (trích dẫn APA, năm, tạp chí, Study, biến A, biến B, vai trò, mã giả thuyết, ước lượng, p, kết quả giả thuyết, chiều tác động, huy hiệu, trang in, trang PDF, liên kết mở bài; dòng tiêu đề cố định, tự lọc). Sheet "Ghi chú": câu hỏi và bộ lọc, ngày xuất, số kiểm định ✓ / chưa kiểm chứng, tuyên bố trách nhiệm | Quyết định đã chốt: dùng exceljs; 2 sheet đủ cột |
| 2 | Thêm gói `exceljs` vào apps/web. Liên kết "Mở bài" dùng địa chỉ máy hiện tại (localhost khi chạy local); sẽ đổi theo tên miền ở Giai đoạn 2 | Web chưa đưa lên mạng |
| 3 | Test: 4 test đơn vị (`relations-export.ts`), 1 test e2e (đúng danh sách, đúng bộ lọc, ghi chú). Tổng: 423 test đơn vị, 84 DB, 28 e2e xanh | Kiểm thử bước |

### Version 3.9.37 (so với 3.9.36)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.3:** tô sáng đúng câu / dòng bảng trong PDF. Worker (`pdf/locate.ts`) đọc từng chữ kèm vị trí qua unpdf, so khớp câu trích theo từ (không phân biệt hoa thường, dấu câu, gạch nối cuối dòng, chữ nhỏ trên cao dính liền; thử ba thứ tự đọc: thứ tự trong file, theo dòng, theo cột; rồi khớp bỏ khoảng trắng; rồi khớp gần ≥ 90%), tìm ở trang dẫn rồi trang kề, và lưu `{page, rects}` vào cột mới `extracted_fields.highlight` (migration `20261020100000`). Trình duyệt chỉ vẽ | Quyết định 1 của bước: tính ở worker lúc đăng, không tính ở trình duyệt |
| 2 | Trình xem PDF mới (`pdf-viewer.tsx`, pdf.js đóng gói sẵn trong unpdf, thêm unpdf vào web): trang trước / sau, ô nhập trang, thu phóng, công tắc "Tô sáng", liên kết mở bằng trình xem của trình duyệt. Không định vị được thì mở đúng trang, không khung, hiện dòng giải thích | Quyết định 2 và 3 của bước |
| 3 | Lệnh `pnpm worker highlights [--paper X]` tính lại vị trí cho các bài đã đăng, không gọi API, không đăng lại bài. Kết quả trên 21 bài: 3545/4162 trường có câu trích (85,2%) có khung; phần còn lại phần lớn là dòng bảng AI ghép từ nhiều ô, hình vẽ và câu trích có chữ không có trong bài | Đo thật trên kho hiện có |
| 4 | Test: 9 test `locate.ts` (một dòng, hai dòng, gạch nối cuối dòng, dòng bảng, hai cột, bảng xoay ngang, khớp gần, trang kề, không tìm thấy), 4 test hình học trình xem, 1 kiểm tra tích hợp (khung lưu đúng trang và nằm trong trang), 2 test e2e mới + 3 test e2e sửa (iframe → trình xem). Tổng: 419 test đơn vị, 84 test DB, 27 e2e xanh | Kiểm thử bước |

### Version 3.9.36 (so với 3.9.35)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.2:** khung Split-Screen có **7 tab** (`lib/workspace.ts`: `tabOf` xếp từng trường vào tab theo khóa tự nhiên), **huy hiệu theo phần**, bảng **"Vì sao"** tách khỏi nút chọn trường (kiểm tra chưa qua đứng đầu; trường ◇ nói máy không kiểm được; nút "Mở trong PDF"), dòng ngữ cảnh khóa dưới tên trường, **thanh chia kéo được** (chuột, phím mũi tên, Home / End, 25–75%, ghi nhớ trong `localStorage`, trang vẫn dựng giống nhau ở máy chủ và trình duyệt), liên kết `?focus=` từ tìm kiếm mở đúng tab; trường kiểu bảng hiện gọn ("Table 1 · descriptives · Study 1") và giá trị dài tự xuống dòng | Mục 8.3 |
| 2 | Test: 9 test đơn vị mới cho `workspace.ts` (xếp tab, tổng hợp phần, thanh chia); 8 test e2e mới (tổng 25 xanh: tab và số trường, huy hiệu từng phần, đổi tab nhảy trang PDF, bảng Vì sao, trường diễn giải, liên kết từ tìm kiếm, thanh chia bằng phím và chuột, ghi nhớ sau khi tải lại); bài e2e cũ sửa theo bố cục tab; `next build` thành công; tổng 406 unit, 84 DB | Kiểm thử 3a.2 |

### Version 3.9.35 (so với 3.9.34)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 3a.1:** Relationship Search làm trang chủ (`apps/web/app/page.tsx`), danh sách bài chuyển sang `/library`; logic thuần ở `lib/relations.ts` (đọc truy vấn từ URL, ghép tên biến, vai trò, chiều, bộ lọc, tổng hợp, nhóm theo bài, định dạng APA 7); đọc qua quyền của khách (`path_results`, `papers`, `studies`, `evidence`, `constructs` qua REST với khóa công khai, không thấy trường ẩn); bấm một kiểm định mở trang bài với trường ước lượng của kiểm định đó được chọn (`?focus=`); đầu trang có liên kết "Tìm theo quan hệ" và "Thư viện" | Câu hỏi cốt lõi số 1 (Mục 8.2b) |
| 2 | Tìm theo tên biến tác giả dùng, thêm khái niệm chuẩn và tên khác khi bật "tên gọi tương đương"; trên kho thật `ethicality → trust` (tất cả vai trò) cho 1 bài, 1 study, 1 kiểm định đã kiểm chứng và 7 kiểm định ⚠ không tính | Chỉ 4/410 đường dẫn ánh xạ về khái niệm chuẩn |
| 3 | Số liệu viết theo APA 7: bỏ số 0 đứng đầu, dấu trừ thật; p in như tác giả báo ("< 0.01" → "p < .01"); một lỗi test bắt được: `apaNumber(0)` trả chuỗi rỗng | Mục 8.1 |
| 4 | Test: 19 test đơn vị mới cho `relations.ts` (vitest nay quét cả `apps/web/lib`), 8 test e2e mới (tổng 17 xanh); `next build` thành công; tổng 397 unit, 84 DB | Kiểm thử 3a.1 |

### Version 3.9.34 (so với 3.9.33)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Danh sách bước Giai đoạn 3a** (3a.1–3a.6) ghi vào `PROJECT_PLAN.md`, kèm 5 quyết định của chủ dự án: tìm theo tên biến tác giả dùng; Relationship Search làm trang chủ; tô sáng PDF ở 3a.3 sau tab; đăng nhập quản trị và giới hạn IP để đến Giai đoạn 2 / 3b; dùng kho hiện có (21 bài), thêm bài khi dùng thật | Chủ dự án duyệt ngày 20/10/2026 |
| 2 | Số liệu khảo sát: 410 đường dẫn, 387 hiển thị được, chỉ 4 có cả hai biến ánh xạ về khái niệm chuẩn (31 khái niệm chuẩn) | Căn cứ chọn tìm theo tên tác giả |

### Version 3.9.33 (so với 3.9.32)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.6, đóng Giai đoạn 1b:** chủ dự án chốt **Codex là nguồn trích xuất chính** (D16 chốt hẳn), Gemini là dự phòng (D6: trần pilot 25 USD giữ nguyên, không đặt trần hằng tháng vì không dùng thường xuyên, chạy thêm chỉ khi chủ dự án đồng ý), Antigravity thử lại khi có token. Số liệu chốt: tỷ lệ vấn đề Codex 17% (6 bài) so với 35% (14 bài Gemini còn lại); cùng bài, Codex thấp hơn ở watchers (2% so với 7,7%), satisfaction (37% so với 61%), csr (0,4% so với 8%), users-world (0% so với 16,7%), bằng ở get-serious, cao hơn nhẹ ở past-present (9,1% so với 8,3%); thời gian người làm 2–10 phút mỗi bài, trung vị 6 phút | Hoàn tất Giai đoạn 1b |
| 2 | `CLAUDE.md` cập nhật: nguồn chính đã chốt, thêm bài ngoài thư mục "1 - Social Media Marketing Ethics" chỉ khi chủ dự án đồng ý | Khớp quyết định |

### Version 3.9.32 (so với 3.9.31)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.5:** trang web `/admin/quality` (`apps/web/app/admin/quality`): tổng số ✓ / ⚠ / ◇ / ẩn và tỷ lệ vấn đề, danh sách "Cần chú ý" (bài có ⚠ hoặc ẩn, kèm liên kết tới bài), bảng theo nguồn (model), loại thiết kế, trường và kiểm tra hay hỏng; ô lọc theo model (không phân biệt hoa thường); liên kết "Chất lượng (quản trị)" ở đầu trang khi chạy local. Số liệu trùng lệnh `pnpm worker quality` (20 bài, 4634 trường: ✓ 2891 ⚠ 880 ◇ 391 ẩn 472; riêng nguồn manual: 6 bài ✓ 663 ⚠ 91 ◇ 127 ẩn 41) | Xem nhanh chất lượng trên web (kế hoạch 1b.5) |
| 2 | **Chỉ chạy local:** trang đọc thẳng Postgres (cần thấy trường ẩn và các lượt trích xuất mà khách không được thấy) nên chỉ phục vụ khi `NODE_ENV=development` hoặc đặt `SUPABASE_DB_URL`; nơi khác trả 404 cho đến khi có đăng nhập quản trị (Giai đoạn 3). `pg` chuyển từ devDependencies sang dependencies của `apps/web` | Không để lộ dữ liệu quản trị trên bản triển khai |
| 3 | Test: 5 test e2e mới (Playwright, tổng 9 xanh: số liệu một nguồn, danh sách chú ý và liên kết, lọc, liên kết ở đầu trang, quy tắc truy cập); `next build` thành công; tổng 378 unit, 84 DB | Kiểm thử 1b.5 |

### Version 3.9.31 (so với 3.9.30)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **1b.4, việc 3 (chính sách):** số liệu chỉ có trong hình **giữ nguyên là ẩn hoặc ⚠**, ghi vào mục "Ngoài phạm vi MVP / hoãn lại"; không đổi quy tắc huy hiệu. Hai hướng đã cân nhắc và hoãn: nhãn "đọc từ hình, cần đối chiếu" và đọc ảnh bằng AI | Chủ dự án chọn hướng A ngày 20/10/2026; mới có một bài làm bằng chứng (`satisfaction`: 15/51 đường dẫn từ Figure 2) và hiển thị số chưa kiểm chứng tăng rủi ro hiểu nhầm (rủi ro 21) |
| 2 | **1b.4 hoàn tất** (việc 1: mã họ H1; việc 2: ma trận Φ; việc 3: giữ nguyên). Còn 1b.5 (trang `/admin/quality`) và 1b.6 (chốt nguồn chính, thời gian người làm, trần D6) | Tiến độ Giai đoạn 1b |

### Version 3.9.30 (so với 3.9.29)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **1b.4, việc 2:** kiểm tra "đủ" không báo thiếu ma trận cho bảng được gọi là bảng tương quan nhưng chứa bình phương tương quan (Φ-matrix): nhận ra qua "shared variance" / "squared correlation" trong tiêu đề và chú thích của chính bảng (`holdsSquaredCorrelations`, chỉ xét đoạn từ tiêu đề bảng đến tiêu đề bảng kế). Không thêm trường nào, luật "không quy đổi" giữ nguyên. 5 test mới (kiểm tra đột biến: bỏ bản sửa thì 2 test thất bại); đo trên 18 bài đã lưu: chỉ `csr` đổi, từ "incomplete" thành "complete", các bài khác y nguyên | Table 2 của `csr` bị báo thiếu ma trận oan |

### Version 3.9.29 (so với 3.9.28)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **1b.4, việc 1:** kiểm tra "đủ" coi mã họ (H1) là có kết quả khi có đường dẫn mang mã con (H1a, H1b…); H10 không phải con của H1. 5 test mới (kiểm tra đột biến: bỏ bản sửa thì 2 test thất bại). Đo trên 18 bài đã lưu: chỉ bài `csr` đổi, mục thiếu 4 → 1, các bài khác y nguyên | Bài `csr` bị báo thiếu H1, H2, H3 oan dù đã có H1a–H3c (cả Gemini lẫn Codex) |
| 2 | Kế hoạch 1b.4 gồm 3 việc làm lần lượt: (1) mã họ ✅, (2) Table 2 của `csr` là Φ-matrix (đường chéo AVE, dưới đường chéo bình phương tương quan, trên khoảng tin cậy) nên không có r để trích, báo "thiếu ma trận" là oan; (3) số liệu chỉ có trong hình (`satisfaction`: 15/51 đường dẫn từ Figure 2, lớp chữ của hình hỏng) cần quyết định chính sách | Phát hiện khi khảo sát 1b.4 |

### Version 3.9.28 (so với 3.9.27)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8f (chạy thật):** 6 bài của thư mục "1 - Social Media Marketing Ethics" qua Codex (GPT 6.1 Sol medium, gói prompt full-1.5.0), mỗi bài 2–6 phút, **0 vòng sửa, qua `manual check` ngay lần đầu**, rồi `manual import --yes` thay bản Gemini (mỗi lần sao lưu `pg_dump` trước). Kết quả (✓ / ⚠ / ◇ / ẩn): watchers 159 / 2 / 25 / 1; satisfaction 213 / 89 / 18 / 38 (Gemini 130 / 159 / 22 / 47); csr 272 / 0 / 23 / 1 (Gemini 218 / 18 / 15 / 1, đúng 1 Study, quy tắc Study mới có tác dụng); users-world 7 / 0 / 17 / 0; get-serious 2 / 0 / 12 / 0; past-present 10 / 0 / 32 / 1 (hướng nghiên cứu 8 mục, trần 8 có tác dụng; lần chạy trước 37 mục) | Hoàn thành 1b.8 |
| 2 | Bảng `quality` theo nguồn: nhóm Codex (6 bài) tỷ lệ vấn đề 17%, nhóm Gemini còn lại (14 bài) 35%; web local liệt kê 21 bài và trang chi tiết hiển thị dữ liệu Codex kèm huy hiệu ◇ / ✓ và trang PDF | Đánh giá nguồn chính |
| 3 | Ghi nhận: `manual import --all` chạy lại an toàn (6 bài "đã nhập, bỏ qua"; các gói cũ sai phiên bản bị từ chối). Còn lại: kiểm tra "đủ" báo thiếu H1, H2, H3 khi bài dùng H1a/b/c; bảng tương quan chưa trích (csr); số liệu trong hình (satisfaction) ⚠ / ẩn nhiều; Antigravity chưa thử với model mạnh | Việc cho 1b.4 |

### Version 3.9.27 (so với 3.9.26)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8e, `compare`:** ghép theo nội dung trước khi so khóa (khái niệm đo lường theo α / CR / AVE, lý thuyết theo tên, đường dẫn theo hệ số + thống kê kiểm định, mục thảo luận theo văn bản; nhập nhằng thì không ghép); văn bản dài coi là một khi cái này nằm trong cái kia hoặc chung ≥ 90% số từ, **trừ khi khác ở từ phủ định / chiều tác động hoặc con số**; tiêu chí 5 đổi thành "giá trị cấu trúc ≥ 90% bằng nhau", văn bản tự do báo riêng; lệnh in thêm số khớp cấu trúc / tự do và số nhóm đã ghép | Hai nguồn đặt tên khác và cắt câu khác nhau làm lệch khóa (A1–A3) |
| 2 | **`quality`:** bảng "theo nguồn" (model của lượt trích xuất: gemini-4-argon, manual:codex:…) và `--source TEXT` để lọc | Phân biệt Gemini và Codex trong cùng database |
| 3 | Đo trên kết quả Codex thật: Q1 khóa chung bằng nhau 92,2% → 94,1% (khóa chỉ ở một bên: 21 và 26 → 3 và 3), Q2 97,7% → 98,4%, Q3 (đã ghép nhãn Study) 82,3% → 87,5%, C3 48,4% → 58,1%, độ lặp lại Q1 84,3% → 88,7% (cấu trúc 95,1%) | Hiệu quả của việc ghép |
| 4 | 19 test mới (ghép khái niệm, lý thuyết, đường dẫn; so văn bản dài, kể cả phủ định và số; nguồn trong `quality`); tổng 368 unit, 84 DB | Kiểm thử 1b.8e |

### Version 3.9.26 (so với 3.9.25)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8d:** máy đối chiếu câu trích dung thứ **từ bị ngắt dòng bằng gạch nối**: `normaliseForMatch` nối "chữ- chữ thường" và "chữ - chữ thường" ở cả hai phía; phép so "không tính khoảng trắng" của câu trích và kiểm tra tên (`textCheck`) bỏ cả gạch nối; hợp từ thật ("long-term") và chữ hoa sau gạch nối giữ nguyên | Câu đúng bị ẩn oan vì "experi- ence", "gratifica - tions" (C3: 4 mục thảo luận; Q1) |
| 2 | Đo trên 18 bài Gemini đã lưu (không API): 13 bài không đổi; 5 bài tốt lên, **không trường nào xấu đi**: Authentic Brand ✓ 629→635, ẩn 269→261; Z85D3HAI ✓ 172→175, ⚠ 5→2; D6VEQBJH ✓ 487→489, ẩn 21→19; Q1 ✓ 167→168, ẩn 10→7; meta-analysis ✓ 14→15, ⚠ 5→4. Trên kết quả Codex: C3 ẩn 4→1 (tỷ lệ vấn đề 28,6%→9,1%), Q3 ẩn 5→1, Q2 câu trích nguyên văn 54%→72% (✓ 169→227), Q1 lần 2 ẩn 25→20 | Đo lại như yêu cầu của 1b.8d |
| 3 | Lần đầu sửa gây hồi quy (một tên lý thuyết ✓ → ⚠ vì phía trang nối còn phía tên thì không); phát hiện nhờ đo trước-sau và vá bằng phép so đối xứng; 5 test mới (kiểm tra đột biến: bỏ từng bản vá thì test tương ứng thất bại). Chưa chạy lại `publish:full`: cơ sở dữ liệu giữ số liệu cũ cho đến khi các bài được nhập lại | Ghi nhận trung thực |

### Version 3.9.25 (so với 3.9.24)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8c:** lệnh `pnpm worker manual import <gói>|--all --tool T --model M [--yes] [--no-backup]` (`manual/import.ts`): xem trước mặc định; với `--yes`: kiểm tra gói, sao lưu database (`pg_dump` qua Docker, một lần mỗi lượt), giữ file Gemini thành `<hash>.gemini.json`, publish thay bản Gemini (giữ dòng đã khóa), ghi `IMPORTED.json` để không nhập trùng; `model_name = manual:<công cụ>:<model>`, chi phí 0, không ghi `api_spend` | D16: Claude Code đưa dữ liệu của tác tử vào database |
| 2 | `publishExtracted` nhận `versions` (khóa xử lý theo nguồn: `prompt@full-1.5.0-manual` khác khóa Gemini nên nguồn này không bỏ qua nguồn kia); `force` nay làm mới cả S4–S8 chứ không chỉ S10 | Bước chi tiết không còn hiển thị số liệu của lần nhập đầu |
| 3 | `pnpm worker report` có thêm nhóm nguồn "manual" | Phân biệt đơn giá và nguồn |
| 4 | Test: 9 test DB cho import (xem trước không ghi gì, nhập có sao lưu, nhập lại cùng câu trả lời bỏ qua, đổi câu trả lời thì nhập lại và giữ trường sửa tay, gói sai bị từ chối, bài chưa có trong database), 3 test đơn vị; tổng 344 unit, 83 DB. Chạy thật: xem trước gói Codex Q1 cho 1 Study, 208 trường (✓ 153 ⚠ 3 ◇ 27 ẩn 25); `pg_dump` thật 7,4 MB | Kiểm thử 1b.8c |

### Version 3.9.24 (so với 3.9.23)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8b:** lệnh `pnpm worker manual check <gói> [--no-feedback]` (`manual/check.ts`): kiểm tra phiên bản, mã băm PDF, từng file qua Zod, đủ bốn file mỗi Study theo `paper_structure.json` và đúng tên đầy đủ; ghi `FEEDBACK.md` cho tác tử, xóa khi hợp lệ; không database, không khóa; mã thoát 0 / 2 | Tác tử tự kiểm tra và sửa trước khi Claude Code nhập |
| 2 | Chạy thử trên kết quả Codex thật: gói Q1-codex-2 hợp lệ (6 file, 1 Study); gói Q1-codex (tên file rút gọn từ A1) bị từ chối kèm gợi ý đúng tên; gói cũ phiên bản prompt 1.4.0 bị từ chối "export lại" | Kiểm tra trên dữ liệu thật |
| 3 | Bỏ cảnh báo "bằng chứng thiếu câu trích" đã định: schema đã bắt buộc câu trích và trang không rỗng; phần "khái niệm không có bằng chứng" do máy đối chiếu bắt (ẩn) và do quy tắc 13 của prompt | Tránh mã thừa |
| 4 | 14 test mới (tổng 341 unit); tổng test DB 74 | Kiểm thử 1b.8b |

### Version 3.9.23 (so với 3.9.22)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8a:** lệnh `pnpm worker manual export --paper X [--code NAME] [--force]` (`apps/worker/src/manual/`): dựng gói việc cho tác tử ngoài vào `PACKETS_DIR` (biến mới trong `.env.example`); gói xuất giống hệt từng byte với cùng đầu vào, không chứa khóa hay phản hồi thô, tên file trả lời đầy đủ; từ chối khi `out/` đã có câu trả lời, tên gói không thể thoát khỏi thư mục gói | Thay script tạm bằng lệnh trong repo (D16) |
| 2 | **Prompt full-1.5.0** (dùng chung cả hai nguồn): quy tắc 13 "không ghi đối tượng nào thiếu câu trích", quy tắc 14 "tối đa 8 mục cho mỗi danh sách thảo luận"; khóa xử lý đổi nên bài đã trích bằng full-1.3.0 / full-1.4.0 không bị coi là cùng bản | Kết quả A1–A3 (Codex ghi khái niệm không bằng chứng, bài tổng quan ra 37 mục) |
| 3 | Test: 12 test đơn vị (dựng gói, ghi gói, tên gói) và 3 test DB (tìm bài, ghi gói); tổng 327 unit, 74 DB | Kiểm thử 1b.8a |

### Version 3.9.22 (so với 3.9.21)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.8 chia thành 1b.8a–1b.8f** và chốt 4 lựa chọn: (1) bản Codex **thay** bản Gemini của cùng bài (sao lưu và in tóm tắt trước, giữ dòng đã khóa); (2) **tối đa 8 mục** mỗi loại ở phần thảo luận (prompt full-1.5.0); (3) gói việc ở `C:ProjectsResearch Data Packets` (`PACKETS_DIR`); (4) giữ tên lệnh `manual` | Chủ dự án chọn theo đề xuất, hỏi từng câu một |

### Version 3.9.21 (so với 3.9.20)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Pha A3 (độ lặp lại)** ghi vào Mục 6.9: Codex chạy Q1 hai lần, giá trị cấu trúc bằng nhau 95,1%, mọi khóa chung 84,3%; lần 2 ẩn nhiều hơn vì thêm khái niệm không có bằng chứng | Đo độ ổn định |
| 2 | **Cổng 1b.7:** Codex đạt (A1–A3); **Antigravity hoãn** thử lại với model mạnh (Gemini 4 Argon hết token), gói Q3-antigravity và Q2-antigravity sẵn; làm 1b.8 với Codex là nguồn chính | Theo cổng "chỉ một công cụ đạt" của Mục 6.9 |

### Version 3.9.20 (so với 3.9.19)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Pha A2 với Codex (GPT 6.1 Sol medium)** ghi vào Mục 6.9: Q2 (số liệu trong hình) gần như y hệt Gemini (97,7% khóa chung bằng nhau, tỷ lệ vấn đề 51,7% so với 61,3%); Q3 đạt các tiêu chí chính sau khi ghép nhãn Study; C3 (bài khái niệm) trích quá nhiều mục thảo luận (37 hướng nghiên cứu so với 3) và 4 mục bị ẩn vì gạch nối cuối dòng. Thời gian người làm 2–10 phút mỗi bài | Số liệu chọn nguồn chính |
| 2 | Bốn việc đưa vào 1b.8 / 1b.4 (giới hạn số mục thảo luận trong chỉ dẫn, dung thứ gạch nối cuối dòng khi so câu trích, so văn bản tự do theo độ giống, tiêu chí 7 đo tương đối khi số nằm trong hình) | Rút ra từ A1–A2 |

### Version 3.9.19 (so với 3.9.18)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước nhập vai Q3 (Codex):** đạt tỷ lệ vấn đề 7,4% (Gemini 8,0%), câu trích nguyên văn 95,3%, 0/9 đường dẫn giả thuyết ẩn, 10 phút; nhưng tách thêm "qualitative pre-test" (focus group 11 người) thành Study thứ hai, nên lệch số Study và loại bài thành "mixed"; sau khi ghép nhãn, giá trị cấu trúc bằng Gemini 89,8% (149/166) | Kết quả pha A2, bài Q3 |
| 2 | **Quyết định của chủ dự án (19/10/2026): bước định tính sơ bộ (focus group, phỏng vấn, hội đồng chuyên gia, sinh item) không phải Study**, kể cả khi báo cáo cỡ mẫu; pilot hoặc pre-test định lượng có số liệu vẫn là Study. Codebook **1.0.2** (A.5.4), chỉ dẫn dùng chung quy tắc 11, prompt **full-1.4.0** | Công cụ tập trung vào bài định lượng; thống nhất giữa các nguồn trích xuất. Quy tắc cũ của A.5.4 ("báo cáo cỡ mẫu riêng thì là Study") là nguyên nhân Codex tách focus group |
| 3 | Bài Gemini đã trích trước đây dùng prompt full-1.3.0 / codebook 1.0.1; khóa xử lý đổi nên trích lại sẽ không bị bỏ qua; chưa chạy lại bài nào (không tốn API) | Ghi nhận ảnh hưởng |

### Version 3.9.18 (so với 3.9.17)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kết quả pha A1 (bài Q1, thử khả thi nguồn ngoài)** ghi vào Mục 6.9: Codex đạt (tỷ lệ vấn đề 5,1% so với Gemini 7,7%, câu trích nguyên văn 100%, 92,2% khóa chung cùng giá trị, 0/3 đường dẫn giả thuyết ẩn); Antigravity với Gemini 3.8 Flash Medium đạt 5 tiêu chí đầu (6 phút, 0 vòng sửa) nhưng ẩn 31 trường, gồm **cả 3 đường dẫn giả thuyết**, vì câu trích sai vài chữ | Chọn nguồn chính theo số liệu |
| 2 | **Tiêu chí 7 mới ở Mục 6.9:** kết quả của mọi giả thuyết (đường dẫn có mã H1…Hn) không bị ẩn | Tỷ lệ vấn đề chung che mất việc kết quả giả thuyết bị ẩn |
| 3 | Việc đưa vào bước 1b.8: tên file đầy đủ trong gói việc (Codex rút gọn `study_1_paths.json`); `compare` ghép khái niệm theo cặp số liệu α / CR / AVE thay vì chỉ theo tên nhãn (hai bên đặt tên khác cho cùng khái niệm làm lệch 40 khóa) | Phát hiện ở A1 |
| 4 | Gói pha A2 cho Codex: Q3 (CSR), Q2 (hình sơ đồ), C3 (bài khái niệm dài); công cụ chấm tạm thêm tiêu chí 7 (script tạm ngoài repo) | Chuẩn bị A2 |

### Version 3.9.17 (so với 3.9.16)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **D16 đảo vai: nguồn trích xuất chính là Codex / Antigravity** (ChatGPT web cho bài có bảng dạng ảnh); **Gemini API thành dự phòng** (giữ sẵn, trần D6, không chạy thêm nếu chưa được đồng ý). Phân vai: tác tử chỉ đọc PDF và ghi JSON; **Claude Code nhập (`manual import`), kiểm tra, publish và đưa lên web** | Chủ dự án quyết định 19/10/2026 vì chi phí Gemini API cao |
| 2 | Mục 4.5 viết lại cho vai trò nguồn chính: gói việc là thư mục `extracted_data/manual/<X>/` (PDF, `AGENTS.md`, `INSTRUCTIONS.md`), thêm lệnh `manual check` (chỉ Zod, không database, không khóa) cho tác tử tự sửa, `import` do Claude Code chạy; tác tử chạy trong thư mục gói việc ngoài repo, **không có `.env`** | An toàn khóa bí mật và chia việc rõ |
| 3 | **Mục 6.9 mới: kế hoạch kiểm thử** nguồn ngoài: bộ thử là 6 bài của thư mục "1 - Social Media Marketing Ethics" (đã có mốc Gemini Batch; bài 144 trang định tính loại ra); các pha A1–A4 (thử khả thi, không code vào repo), B (làm thật có test tự động), C (đến web), D (quyết định mở rộng); 8 số đo; tiêu chí đạt (cùng số Study và mã giả thuyết, tỷ lệ vấn đề không cao hơn Gemini quá 10 điểm, ≥ 90% khóa chung cùng giá trị, độ lặp lại ≥ 90%, ≤ 20 phút người làm mỗi bài trung vị); cổng quyết định, không đạt thì dừng hỏi | Có thước đo trước khi dựa vào nguồn mới |
| 4 | Giai đoạn 1b sắp xếp lại: 1b.1–1b.2 xong; **1b.3 (so Flash, đo cache) bỏ**; làm **1b.7 → 1b.8 trước**, rồi 1b.4–1b.6; 1b.6 thành "chốt nguồn chính"; 4 rủi ro mới (23–26: lộ khóa cho tác tử, chất lượng và độ lặp lại, thời gian người làm, bản quyền khi gửi PDF); `CLAUDE.md` cập nhật theo | Phù hợp hướng đi mới |

### Version 3.9.16 (so với 3.9.15)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Mục 4.5: ba đường cho bước trích thủ công (**Codex**, **Antigravity** tự làm trong repo; **ChatGPT web** chép–dán cho bài có bảng dạng ảnh); nhập cả thư mục `manual/inbox/` bằng `import --all`; `AGENTS.md` ở gốc repo; một nguồn duy nhất cho prompt / schema và import từ chối file sai phiên bản; `model_name` = `manual:<công cụ>:<model>` | Chủ dự án muốn dùng Codex / Antigravity / ChatGPT khi Gemini hoặc usage Claude Code không đủ |
| 2 | Bước 1b.7 tách thành **1b.7 thử khả thi** (script tạm, không vào repo, so với bản Gemini, có tiêu chí đạt) và **1b.8 làm thật**; cả hai chỉ bắt đầu sau khi 1b.1–1b.6 với Gemini API đã xong | Chủ dự án duyệt ngày 19/10/2026: test Gemini xong mới test Codex và Antigravity |

### Version 3.9.15 (so với 3.9.14)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **D16 (mới): phương án dự phòng trích xuất thủ công** khi Gemini API không dùng được: xuất gói prompt + schema, đưa PDF cho LLM khác qua chat, nhập file JSON trả về; đi qua cùng các lớp đối chiếu với PDF và huy hiệu; `model_name` = `manual:<model>`, không tính vào ngân sách D6. Chi tiết ở Mục 4.5 (`docs/integrations.md`) | Chủ dự án đề xuất và duyệt ngày 19/10/2026; tránh bị chặn khi Gemini sự cố hoặc hết ngân sách |
| 2 | Thêm **bước 1b.7** (lệnh `manual export` / `manual import`) vào danh sách bước Giai đoạn 1b; chưa code | Làm sau 1b.6, hoặc sớm hơn nếu Gemini gặp sự cố |

### Version 3.9.15 (so với 3.9.14)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1b.2:** nguồn bài thử là thư mục Zotero "Dissertation / 1 - Social Media Marketing Ethics" (`ZOTERO_INBOX_PATH`, chủ dự án chỉ định, không lấy thêm bài ngoài thư mục này). Nạp 7 bài; chạy Batch 6 bài, **bỏ bài "Power and Perception" 144 trang** (có vẻ định tính, ước tính 1,42 USD) | Tiết kiệm ngân sách; bài định tính ngoài phạm vi MVP |
| 2 | Chi phí thật 6 bài (Batch): 0,04 / 0,04 / 0,25 / 0,24 / 0,26 / 0,09 USD, tổng **0,92 USD** so với ước tính 1,21 USD; bài khái niệm hoặc tổng quan không có Study chỉ 0,04–0,09 USD. Sổ chi tiêu 14,86/25 USD | Đơn giá cho quyết định D6 |
| 3 | Báo cáo `quality` trên 20 bản ghi (18 bài thật): tỷ lệ vấn đề 35% trên trường kiểm được; khảo sát 39%, thí nghiệm online 26%, trường ở cấp bài 16%. Trường hay hỏng nhất: `r` (ma trận ảnh), `r2_dv` (89%), `t_or_z` (66%), `estimate` (43%). Nguyên nhân thường gặp: kết quả đường dẫn lấy từ **hình sơ đồ** (Figure 2) nên số không có trong lớp chữ | Dữ liệu cho bước 1b.4 |

### Version 3.9.14 (so với 3.9.13)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **D6: trần ngân sách pilot nâng từ 20 lên 25 USD** (`GEMINI_BUDGET_LIMIT`, mặc định trong mã, `.env.example`, `.env` cục bộ); chủ dự án quyết định ngày 19/10/2026 khi duyệt kế hoạch Giai đoạn 1b | Đã chi 13,94 USD cho 12 bài; còn 11,06 USD cho khoảng 11 bài thực nghiệm thêm (mục tiêu 20 bài) và so sánh Flash (~1 USD) |
| 2 | **Bước 1b.1:** lệnh `pnpm worker quality [--top N]`: bảng ✓ / ⚠ / ◇ / ẩn theo loại thiết kế, theo trường, theo bài và theo kiểm tra hỏng nhiều nhất, đọc từ `extracted_fields`; tỷ lệ vấn đề = (⚠ + ẩn) / (✓ + ⚠ + ẩn), không tính ◇ vì trường ◇ không kiểm được | Thấy chỗ máy đối chiếu không khớp nhiều nhất để chỉnh ở 1b.4 |
| 3 | Kế hoạch Giai đoạn 1b ghi vào `PROJECT_PLAN.md` (6 bước, mục tiêu 20 bài) | Chủ dự án duyệt ngày 19/10/2026 |

### Version 3.9.13 (so với 3.9.12)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9d:** lớp đọc PDF nhận ra **bảng in ngang** (chữ xoay 90° theo cả hai chiều, từ 20 mảnh và 150 ký tự trở lên) và xoay toạ độ để đọc như trang thường, sau phần chữ thẳng; vài đoạn chữ xoay (watermark) vẫn ra khỏi nội dung (Mục 6.3) | Trước đây mọi chữ xoay bị coi là chú thích lề nên các trang bảng ngang mất khỏi văn bản đối chiếu: bài Authentic Brand Ethicality mất 6/34 trang |
| 2 | Đo trên 12 bài thật (280 trang), chạy lại `publish:full --force`: bài Authentic Brand Ethicality ✓ 357→629, ⚠ 645→426, ẩn 322→269, hết "incomplete"; bài Holbrook ✓ 439→442, ⚠ 127→124; 10 bài còn lại không đổi (0 trường xấu đi) | Chỉ trang bảng ngang đổi; không gọi API |
| 3 | Còn lại ở Authentic Brand Ethicality: ma trận tương quan trang 20 (Study 5) là **ảnh** nên không có chữ để đối chiếu (132 giá trị r ⚠/ẩn); cần OCR mới đọc được | Giới hạn của lớp chữ, ngoài phạm vi bước |

### Version 3.9.12 (so với 3.9.11)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Chạy Batch 7 bài còn lại** (đã publish cả 7; tổng 3,64 USD so với ước tính 2,18 USD vì ước tính chỉ giả định một Study): bài tổng quan hoặc khái niệm không có Study chỉ 0,08 USD; bài một Study 0,14–0,63 USD; bài 8 Study (34 trang) 2,32 USD; sổ chi tiêu 13,94/20 USD | Đo đơn giá Batch trên bài thật; trung bình 0,52 USD/bài, 0,021 USD/trang |
| 2 | Pha `study_parts` của Batch **chia thành nhiều lô dưới 15 MB** (mỗi yêu cầu mang cả PDF; bài 8 Study vượt giới hạn 20 MB); thêm `batch_jobs.chunk`; bài chỉ được lắp ráp một lần khi đủ mọi lô | Bài Authentic Brand Ethicality (32 yêu cầu) bị Batch từ chối |
| 3 | Cột dạng danh sách bị ẩn được ghi `[]` thay vì NULL (các cột này `not null`) | Publish bài 8 Study lỗi vì `analysis_method` NULL |
| 4 | Bộ test Batch chỉ nhìn các bài của chính nó (`onlyFiles`) | Lần chạy test đã đụng nhầm hai job Batch thật trong DB (đã khôi phục) |
| 5 | Ghi nhận chưa giải quyết: bài Authentic Brand Ethicality có hai Study ma trận tương quan lớn (Study 3 và 5) với phần lớn giá trị r bị ⚠/ẩn (số không tìm thấy trong lớp chữ của PDF); chưa rõ nguyên nhân (bảng quay ngang, ảnh, hay cách làm tròn) | Cần xem bằng mắt trước khi sửa lớp đọc PDF |

### Version 3.9.11 (so với 3.9.10)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9c:** chế độ so sánh Batch (`pnpm worker batch submit --compare --paper X --yes`): kết quả lưu riêng `<hash>.batch.json`, không ghi đè `.full.json`, không publish; job `compare` và job `extract` của cùng một bài không chặn nhau (`batch_jobs.purpose`). Lệnh `pnpm worker compare --paper X` so từng trường theo 5 tiêu chí | Đo xem Batch (nửa giá) có cho kết quả tương đương đồng bộ trước khi dùng cho cả kho |
| 2 | Kết quả trên 2 bài thật (chi 0,62 USD): cùng số Study và mã giả thuyết; ✓+◇ lệch dưới 10% ở cả hai; khóa chung cùng giá trị 96,2% và 92,6%; **trường ẩn của Batch vượt ngưỡng ở một bài (8 so với 3)** do Batch trích thêm các đường dẫn trùng lấy từ Hình 2 (số trên hình không có trong lớp chữ). Chưa quyết định dùng Batch cho cả kho | Số liệu cho quyết định D6 và cách chạy 7 bài còn lại |

### Version 3.9.10 (so với 3.9.9)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **D6: trần ngân sách pilot nâng từ 10 lên 20 USD** (`GEMINI_BUDGET_LIMIT`, mặc định trong mã và `.env.example`); chủ dự án quyết định ngày 19/10/2026 | Đo thật 5 bài đồng bộ: trung bình 0,88 USD/bài, bài nhiều Study gấp 2–2,6 lần ước tính một Study; khoảng 5,5 USD trong 10 USD đầu bị lãng phí do sự cố nên không đủ cho 20–30 bài |
| 2 | `GEMINI_SPENT_OFFSET_USD=2.3` đặt trong `.env` (số đã dùng trước khi có sổ, ước tính; cần đối chiếu với Google AI Studio > Billing) | Để trần tính đúng tổng tiền thật, không chỉ phần ghi trong sổ |

### Version 3.9.9 (so với 3.9.8)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9b:** lớp đọc PDF nhận ra **khe giữa hai cột** (dải dọc không mảnh văn bản nào phủ) và luôn cắt đoạn tại đó; tiêu đề chạy ở góc trên bên phải xếp trước cả hai cột; chữ cái Hy Lạp được gập về chữ Latin khi so câu (font ký hiệu lưu α thành a); dấu trừ lưu thành "2" trong khoảng tin cậy được khôi phục (Mục 6.3) | Bài hai cột khe hẹp (11,9 pt, dưới ngưỡng nối 12 pt) bị nối cột thành một dòng: 46/135 trường bị ẩn oan. Sau sửa: ✓ 35→85, ⚠ 45→28, ẩn 46→3; trên 4 bài thật 70 trường tốt lên, 0 xấu đi, 479 giữ nguyên |
| 2 | **Khóa theo bài:** mỗi bài chỉ một lần chạy tại một thời điểm (khóa tư vấn PostgreSQL theo mã băm tệp); lần chạy thứ hai bỏ qua và không tốn tiền | Hai tiến trình nền chạy song song cùng một bài làm tốn thêm khoảng 3,5 USD trong lần chạy thật đầu tiên |
| 3 | Kết quả chạy thật đầu tiên (5 bài, ghi để rút kinh nghiệm): tổng đã chi 9,72 USD (cả 2,3 USD ước tính trước khi có sổ), trong đó khoảng 5,5 USD lãng phí (1,49 USD mất khi Docker sập; khoảng 4 USD gọi trùng); bài dùng được tốn 0,29–2,16 USD, trung bình 0,88 USD/bài, 0,043 USD/trang | Số liệu cho quyết định ngân sách D6 |

### Version 3.9.8 (so với 3.9.7)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.9:** `pnpm worker run` (trích xuất, đối chiếu, publish dưới trần ngân sách) và `pnpm worker report` (chi phí từng bài, đơn giá, dự báo); lựa chọn bài bằng `--paper` | Chạy thật trên bài trong kho và đo đơn giá |
| 2 | Mục 4.2: mỗi câu trả lời của Gemini được **ghi ra đĩa ngay khi nhận** (`extracted_data/<hash>.calls.jsonl`); chạy lại thì phát lại, không gọi và không tính tiền lần hai; lỗi mất kết nối DB không làm sập tiến trình | Lần chạy thật đầu tiên mất 10 lượt đã trả tiền (1,49 USD) khi Docker tắt giữa chừng |
| 3 | Đơn giá đo được (đồng bộ, 4 bài thật): trung bình 0,56 USD/bài, 0,034 USD/trang; bài nhiều Study tốn nhiều hơn nhiều (bài 3 Study, 16 trang: 0,95 USD, gấp đôi ước tính vì ước tính chỉ giả định 1 Study) | Số liệu cho quyết định ngân sách D6 |

### Version 3.9.7 (so với 3.9.6)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.8:** publish đủ dữ liệu (`pnpm publish:full`): mỗi lượt gọi AI một dòng `extraction_runs` (phiên bản model / prompt / schema / codebook, token, chi phí, phản hồi thô), mỗi câu trích một dòng `evidence` (trang thật, trang in, mức khớp), các bảng nghiệp vụ và `extracted_fields` kèm kết quả từng kiểm tra; các bước S4–S8, S10 ghi vào `pipeline_runs` | Giai đoạn 1: dữ liệu trích xuất đưa được vào cơ sở dữ liệu để web dùng |
| 2 | Mục 6.7: khóa ở **hai mức**: cả hàng (`locked` của bảng nghiệp vụ) và từng trường (cột của trường đã khóa giữ nguyên giá trị); mục của lần trích xuất cũ không còn thì bị xóa, trừ mục đã khóa (được giữ và báo `orphanedLocked`) | Trích xuất lại không được làm mất chỗ chủ dự án đã sửa |
| 3 | Mục 6.5, 5.1: ở hàng còn hiển thị, cột của trường bị **ẩn** (không khớp PDF) để NULL; huy hiệu của hàng là huy hiệu nặng nhất trong các trường còn hiển thị; hàng ẩn khi trường chính bị ẩn | Khách không được thấy giá trị không qua kiểm tra (VD 12 giá trị R² AI bịa ở bài jtaer) |
| 4 | Cột `raw_extraction` của 8 bảng nghiệp vụ **không đọc được với khách** (quyền theo cột) | RLS chỉ lọc theo hàng nên `raw_extraction` làm lộ giá trị đã bị ẩn |

### Version 3.9.6 (so với 3.9.5)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Bước 1.7:** trần ngân sách, giới hạn tốc độ, thử lại, ước tính chi phí và luồng Batch (Mục 4.2–4.3); thêm bảng `api_spend` và `batch_jobs` | Giai đoạn 1: kiểm soát chi phí trước khi chạy hàng loạt |
| 2 | Mục 4.3: bỏ `countTokens` khỏi `estimate`, dùng hằng số theo trang đo từ hóa đơn thật | `countTokens` thấp hơn hóa đơn 2,7 lần với PDF, làm trần ngân sách mất tác dụng |
| 3 | Mục 4.2: Batch từ chối schema lồng quá 3 tầng; với Batch, schema đặt trong chỉ dẫn và Zod kiểm tra | Đo trực tiếp trên API; API đồng bộ không bị giới hạn này |

### Version 3.9.5 (so với 3.9.4)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Chia Giai đoạn 1 thành 9 bước (1.1–1.9)** ở Mục 10, mỗi bước có cách kiểm thử | Giai đoạn 0 xong (bước 0.14); Mục 10.0 quy định chia bước khi bắt đầu giai đoạn |
| 2 | Bước 1.4 xử lý ô bảng bị tách thành nhiều dòng trong text layer | Câu trích từ bảng không khớp, phát hiện khi chạy thử bước 0.8b |
| 3 | Bước 1.6 ánh xạ khái niệm trước hết bằng tên + bí danh; embedding / độ giống item để sau | Chưa đủ bài để hiệu chỉnh ngưỡng; theo nguyên tắc "không chắc thì tách" |

### Version 3.9.4 (so với 3.9.3)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Kết nối Zotero (bước 0.12):** client Web API chỉ đọc; collection Inbox cấu hình được bằng `ZOTERO_INBOX_PATH` (Mục 3.3) | Chủ dự án muốn dùng collection có sẵn trong thư viện |
| 2 | Tải PDF thử lại khi kết nối bị ngắt; không gửi API key sang kho lưu trữ | Phát hiện khi chạy thật (kết nối tới kho lưu trữ bị đóng giữa chừng) |

### Version 3.9.3 (so với 3.9.2)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **`packages/schema` v1.0.0 (bước 0.11):** schema Zod đầy đủ theo Codebook cho Pass 1 (`PaperStructure`), Pass 1b (`PaperDiscussion`) và Pass 2 (4 phần của một Study), cùng `StudyDetail` để ghép kết quả | Một nguồn sự thật cho worker, Gemini và web |
| 2 | Mục 4.2: một Study được trích bằng **4 lượt gọi**, không gửi schema gộp | Gemini từ chối schema gộp cả Study (23 KB) khi kiểm thử thật |
| 3 | Codebook v1.0.1: thêm Phần L (trường cấu trúc của các lượt gọi AI) | Schema và codebook khớp nhau hoàn toàn, có test bắt buộc |

### Version 3.9.2 (so với 3.9.1)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Codebook v1.0** ([docs/codebook.md](docs/codebook.md), bước 0.10): định nghĩa vận hành, tầng T1/T2/T3, giá trị cho phép và quy tắc khi mơ hồ cho toàn bộ 159 trường của Mục 5.2–5.3; quy tắc chung về bằng chứng, con số, Study | Đầu vào cho prompt và schema Zod ở bước 0.11 |
| 2 | Mục 5.2: `paper_type` thêm `narrative_review`, `other`; `estimate_type` thêm `path coefficient` | Rút ra từ chạy thử bước 0.8b |
| 3 | Lệnh `pnpm codebook:check`: mọi trường trong schema phải có định nghĩa trong codebook | Giữ codebook và schema đồng bộ |

### Version 3.9.1 (so với 3.9)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Tách tài liệu kế hoạch (bước 0.9):** `PROJECT_PLAN.md` chỉ giữ Mục 1 (tổng quan), Mục 10 (lộ trình) và Mục 13 (quyết định) cùng mục lục; các mục khác chuyển sang `docs/architecture.md`, `docs/integrations.md`, `docs/data-schema.md`, `docs/quality-assurance.md`, `docs/ux-spec.md`, `docs/risks.md`; Mục 0 thành `CHANGELOG.md`. Nội dung từng mục giữ nguyên, số mục không đổi | File 1.000 dòng khó dùng hằng ngày |
| 2 | Thêm `docs/risks.md` (Mục 11) ngoài 5 file dự kiến; Mục 7 (bản quyền) đặt cùng Mục 8 trong `docs/ux-spec.md`; Mục 12 (tài liệu tham khảo) đặt trong `docs/quality-assurance.md` | Các mục này không thuộc rõ một file nào trong danh sách ban đầu |
| 3 | Lệnh `pnpm docs:check` kiểm tra liên kết nội bộ giữa các file tài liệu | Tránh liên kết hỏng khi tài liệu nằm ở nhiều file |

**Kết quả các bước đã làm (0.1–0.8b)** được ghi trong lịch sử commit trên GitHub.

### Version 3.9 (so với 3.8)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Thêm **Mục 10.0: Quy trình làm việc từng bước**: code một bước → kiểm thử → báo cáo → chờ chủ dự án đồng ý mới sang bước tiếp; mỗi bước một commit | Yêu cầu của chủ dự án |
| 2 | Chia Giai đoạn 0 thành **14 bước** (0.1–0.14), mỗi bước có tiêu chí kiểm thử và việc cần chủ dự án | Áp dụng quy trình từng bước |
| 3 | Sửa các trường trạng thái cũ còn sót trong schema (Mục 5.2 phân hệ 13, Mục 5.4) | Thống nhất với huy hiệu ở Mục 6.5 |

### Version 3.8 (so với 3.7)

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | **Định vị: công cụ tham khảo.** Người dùng có trách nhiệm tự đối chiếu với bài gốc; tuyên bố trách nhiệm ở chân mọi trang và trong mọi file xuất | Chủ dự án xác định rõ vai trò của công cụ |
| 2 | **Rút gọn kiểm soát chất lượng (Mục 6 viết lại):** giữ máy đối chiếu với PDF, kiểm tra độ đầy đủ, tính lại thống kê, kiểm tra chéo, huy hiệu; **trích xuất một lượt bằng Pro**; bỏ trích xuất kép, trọng tài, đọc bảng hai kênh, hỏi 3 lần cho T3, bộ đối chứng meta-analysis và vòng tự cải thiện | Với công cụ tham khảo, vài phần trăm chính xác thêm không đáng chi phí 2,5–4 lần và nhiều tuần phát triển; bỏ được các giả định rủi ro nhất của v3.7 |
| 3 | **Bấm để kiểm tra** là tính năng số 1; thêm bảng **"Vì sao ✓"**; **luôn hiện số kiểm định không được tính** theo loại thiết kế | Giúp người dùng tự kiểm tra trong vài giây; tránh thiên lệch ngầm về nghiên cứu đơn giản |
| 4 | Bộ bài giả lập giữ lại làm kiểm thử kỹ thuật; các cơ chế của v3.7 có thể bật lại riêng cho loại trường sai nhiều (Mục 6.6) | Kiến trúc để sẵn chỗ nâng cấp có chọn lọc |
| 5 | Ánh xạ khái niệm: gộp khi chắc chắn, còn lại **tách riêng** (không có trọng tài); D9, D15 cập nhật | Theo bản rút gọn |
| 6 | **Lịch mới:** khoảng 40–46 giờ của chủ dự án; dùng được trên máy từ khoảng đầu tháng 12/2026; web công khai khoảng giữa tháng 1/2027 | Ít phần phải xây hơn |

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
