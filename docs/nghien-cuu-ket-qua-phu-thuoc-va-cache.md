# Nghiên cứu: kết quả phụ thuộc trong tổng hợp, và cách làm cache

> **Cập nhật 25/10/2026 (cuối ngày): phần B (cache) đã được làm theo cách khác.** `main` đã có bộ nhớ đệm trong từng instance (`lib/data.ts`, `DATA_CACHE_SECONDS`, mặc định 60 giây ở production) và đếm giới hạn trang trong bộ nhớ (xem "Bước 4.7 ✅" trong `PROJECT_PLAN.md`). Hướng "cache dữ liệu công khai" ở mục B3.1 vì vậy đã có; còn lại chỉ là tùy chọn dùng Data Cache của Next (dùng chung giữa các instance, làm mới bằng thẻ) nếu lượt khởi động nguội (0,6 đến 1 s theo ghi chú của chủ dự án) còn gây phiền. **Phần A (phương pháp, kết quả phụ thuộc) không đổi.**


> Ngày 25/10/2026, phiên cloud. **Nghiên cứu để chủ dự án quyết định; chưa sửa mã hay kế hoạch.** Hai phần: (A) phương pháp, từ phát hiện "cùng một quan hệ được đếm nhiều lần" (khóa `#2`, `#3`, PR [#3](https://github.com/johntroger/research-data/pull/3)); (B) kỹ thuật, từ phát hiện "không trang nào được cache" ([báo cáo 4.7](bao-cao-4.7-hieu-nang-va-bao-mat.md)).

## 0. Giới hạn của nghiên cứu này (đọc trước)

- **Tài liệu học thuật:** chỉ một truy vấn Consensus chạy được (10 bài). Truy vấn thứ hai (hạn chế của đếm phiếu so với meta-analysis) bị giới hạn tốc độ, tài khoản chỉ còn 1 lượt tìm trong tháng này (làm mới ngày 1/11); Scholar Gateway từ chối truy cập. **Vì vậy chưa có nguồn đã kiểm cho phần hạn chế của đếm phiếu; tôi không trích dẫn từ trí nhớ.**
- Tôi mới đọc **tóm tắt** của các bài dưới đây, chưa đọc toàn văn. Công cụ chỉ trả tên tác giả đầu nên tôi ghi "et al."; tên đồng tác giả cần lấy từ bài gốc khi trích dẫn chính thức.
- Phần kỹ thuật dựa trên một lượt tìm web (tài liệu Next.js và hướng dẫn của Vercel) và đọc mã của dự án; **chưa thử nghiệm**, và tìm không ra giới hạn của gói Hobby về làm mới cache.

## A. Phương pháp: nhiều kết quả của cùng một quan hệ

### A1. Tài liệu nói gì (các điểm có trong tóm tắt đã đọc)

1. Phương pháp tổng hợp truyền thống giả định **mỗi nghiên cứu cho một ước lượng độc lập**. Giả định này sai khi một nghiên cứu cho nhiều ước lượng trên cùng đối tượng, hoặc các nghiên cứu cùng nhóm tác giả hay phòng lab ([Hedges et al., 2010](https://consensus.app/papers/details/a1b8cda7a25953ca9cd0bfa95061ca99/?utm_source=claude_desktop), *Research Synthesis Methods*).
2. **Ước lượng phương sai vững (RVE)** cho phép đưa mọi ước lượng phụ thuộc vào một mô hình mà không cần biết cấu trúc tương quan (Hedges et al., 2010); theo mô phỏng của họ, lý thuyết có thể chính xác với khoảng 20 đến 40 nghiên cứu. Gói R: [robumeta](https://consensus.app/papers/details/db831b3ae966531799281807e3e3d346/?utm_source=claude_desktop) (Fisher et al., 2015). Hướng dẫn thực hành cho Stata và SPSS: [Tanner-Smith et al., 2014](https://consensus.app/papers/details/d591f47b90c95151a2f6b13f31afb06b/?utm_source=claude_desktop).
3. **So ba cách xử lý nhiều kết quả trên cùng mẫu** ([Moeyaert et al., 2017](https://consensus.app/papers/details/23378512ddbe5e9c825560edc9c6c7f7/?utm_source=claude_desktop)): lấy trung bình trong nghiên cứu, RVE, mô hình đa tầng. RVE và đa tầng cho ước lượng hiệu ứng cố định không chệch và sai số chuẩn đúng; **lấy trung bình làm sai số chuẩn bị phóng đại khi các hiệu ứng trong nghiên cứu thật ra độc lập**. RVE và đa tầng còn có ưu điểm là không cần biết tương quan giữa các kết quả.
4. [Pustejovsky et al., 2020](https://consensus.app/papers/details/3a0d08c8a456551eb28a8c023b000c69/?utm_source=claude_desktop) mở rộng các mô hình làm việc cho RVE, cài được bằng `metafor` và `clubSandwich` (hai gói R mà kế hoạch Giai đoạn 6 đã nhắc ở Mục "Evidence Map và xuất dữ liệu cho `metafor`").
5. [Park et al., 2018](https://consensus.app/papers/details/f378ae9554aa5b2bae0c52a731e3afd2/?utm_source=claude_desktop) so RVE và mô hình đa tầng khi có nhiều kết quả mỗi nghiên cứu; mô phỏng nhiều điều kiện (cỡ mẫu, số hiệu ứng mỗi kết quả, số nghiên cứu…).
6. **Ít nghiên cứu thì RVE kém an toàn:** [Joshi et al., 2021](https://consensus.app/papers/details/28a93de6a3f3576b93457e5fbc83fa40/?utm_source=claude_desktop) báo RVE có thể làm tăng sai lầm loại I khi số nghiên cứu ít, và đề xuất bootstrap có trọng số theo cụm. [Tipton, 2013](https://consensus.app/papers/details/5e9e0d55a695533591a8caf7df00d60c/?utm_source=claude_desktop) thấy RVE hoạt động tốt tới khoảng 10 nghiên cứu cho hiệu ứng trung bình với các độ đo nhị phân (rủi ro, tỷ số chênh), nhưng khoảng tin cậy của hệ số dốc thường thấp hơn mức danh nghĩa.
7. **Thiên lệch công bố cũng bị ảnh hưởng:** [Rodgers et al., 2020](https://consensus.app/papers/details/dc923e34a46c55438e5f15c8737d1036/?utm_source=claude_desktop): bỏ qua phụ thuộc làm tăng sai lầm loại I của các kiểm định thiên lệch đơn biến (trim-and-fill, Egger, 3PSM); các biến thể Egger có RVE hoặc đa tầng giữ được mức sai lầm loại I, nhưng sức mạnh nhìn chung thấp. [Yang et al., 2024](https://consensus.app/papers/details/3cf33a4f82315a68880b14a47f71b343/?utm_source=claude_desktop) tính lại 448 meta-analysis sinh học và thấy bỏ qua hai vấn đề (chọn lọc báo cáo, phụ thuộc) làm ước lượng hiệu ứng trung bình cao hơn khoảng 110% và sai số chuẩn thấp hơn khoảng 120% (đây là số của lĩnh vực sinh học, không áp dụng nguyên cho khoa học hành vi).

### A2. Điều này có nghĩa gì cho Research Data

**Cẩn trọng về phạm vi:** các bài trên nói về *ước lượng hiệu ứng gộp*. Web hiện **không gộp hiệu ứng**, chỉ *đếm phiếu* và liệt kê. Nên những bài này **chưa kết luận được web đang sai**; chúng cho biết dữ liệu cần thêm gì để người dùng không rơi vào sai lầm khi dùng tiếp.

| # | Điều rút ra | Đề xuất (chưa làm) | Cần chủ dự án quyết |
|---|---|---|---|
| A-1 | Cùng quan hệ trong cùng study ở nhiều mô hình là kết quả **phụ thuộc**, không phải bằng chứng độc lập (điểm 1) | Giữ dòng ghi chú "N kiểm định, M quan hệ khác nhau" (đã có ở PR #3); không đổi cách đếm cho tới khi biết các dòng `#2`, `#3` là gì | Có: cách đếm là quyết định phương pháp |
| A-2 | Khi xuất dữ liệu cho `metafor`/`clubSandwich` (Giai đoạn 6), cần **mã cụm**: bài và study | Thêm vào file xuất các cột `paper_id`, `study_id`, `relation_key` (đã có `relationKey`), `estimate_type`, `SE`, `N`; để người dùng chọn RVE hoặc đa tầng. Kế hoạch đã dự kiến xuất cho `metafor`/`metaSEM` | Có, khi tới Giai đoạn 6 |
| A-3 | **Không lấy trung bình** các kết quả của cùng một quan hệ để "gọn" (điểm 3) | Không làm; nếu muốn một dòng mỗi quan hệ thì chọn quy tắc rõ ràng (ví dụ mô hình cuối, hoặc mô hình đầy đủ nhất) và ghi lại | Có |
| A-4 | **Kho nhỏ**: 25 bài có dữ liệu quan hệ. Ngay cả RVE cũng kém an toàn khi ít nghiên cứu (điểm 6), nên số liệu tổng hợp từ kho này chỉ nên coi là mô tả | Giữ cảnh báo "không phải mẫu hệ thống", thêm mốc cụ thể (ví dụ cảnh báo khi dưới 20 đến 40 bài cùng một quan hệ) vào phần Cách đọc kết quả. Con số mốc lấy từ mô phỏng của Hedges et al. và Tipton; **chưa kiểm chứng cho đúng loại dữ liệu này** | Có |
| A-5 | Nếu sau này kiểm thiên lệch công bố, **phải xử lý phụ thuộc** (điểm 7) | Ghi vào đặc tả Giai đoạn 6: dùng biến thể có RVE hoặc đa tầng, không dùng Egger đơn biến trên dữ liệu có nhiều kết quả mỗi study | Không cần ngay |
| A-6 | Cần biết bản chất các dòng `#2`, `#3` (mô hình khác nhau hay đếm trùng) | Chủ dự án đọc trang in 892–893 của Zeugner-Roth et al. (2025); nếu là mô hình khác nhau, thêm trường "mô hình số" và hiển thị; nếu là trùng, sửa ở bước trích xuất | **Có, đây là việc cần làm trước** |

### A3. Câu hỏi chưa trả lời được

- **Vote counting** (đếm phiếu) có hạn chế gì theo tài liệu, và có nghiên cứu nào áp dụng cho khoa học hành vi/marketing? Cần chạy lại truy vấn sau ngày 1/11 hoặc dùng nguồn khác.
- Ngưỡng "bao nhiêu bài thì đủ" để một tổng hợp mô tả có ích: chưa có nguồn đã đọc.

## B. Kỹ thuật: làm cache mà không làm sai quyền xem

### B1. Cái đã biết từ mã

- `lib/data.ts` đọc Supabase bằng khóa công khai (`anon`) với `cache: "no-store"` cho **mọi** truy vấn (`rest` và `restAll`). Header chỉ có khóa công khai, **không có thông tin người dùng**, nên mọi khách và cả chủ (khi trang gọi hàm này) nhận cùng dữ liệu từ đường này.
- `app/layout.tsx` gọi `getOwner()` (đọc cookie) ở **mọi trang**, nên mọi trang là động theo từng yêu cầu. Vì vậy **không thể cache cả trang** (ISR) mà không đổi cách xác định chủ ở layout. Phần tốn thời gian có thể cache là **các truy vấn dữ liệu công khai** chứ không phải HTML.
- Các hàm dùng nhiều nhất là `listPathRows`, `listConcepts`, `listLibraryItems` (tải cả bảng, rồi lọc bằng JavaScript; xem báo cáo đánh giá mục D1).

### B2. Cái tài liệu nói (kết quả tìm web, chưa thử)

- Next.js 16 có hai kiểu làm mới: theo thời gian (stale-while-revalidate) và theo yêu cầu bằng `revalidateTag()` hoặc `revalidatePath()`; mô hình dựa trên `fetch` gắn thẻ khác với mô hình `cacheComponents: true`. Nguồn: [Next.js: Revalidating](https://nextjs.org/docs/app/getting-started/revalidating), [How revalidation works](https://unpkg.com/next@16.2.10/dist/docs/01-app/02-guides/how-revalidation-works.md).
- Vercel khuyên kích hoạt làm mới **từ sự kiện thay đổi dữ liệu thật** và chỉ làm mới đúng thẻ hoặc đường dẫn bị ảnh hưởng, giữ làm mới theo thời gian như dự phòng khi nguồn không phát sự kiện ([hướng dẫn](https://vercel.com/kb/guide/how-to-move-to-on-demand-revalidation)). Một hướng dẫn bên thứ ba khuyên dùng một Route Handler có bảo vệ, ánh xạ sự kiện đã biết sang thẻ cố định thay vì nhận thẻ do người gọi gửi lên ([ví dụ](https://www.sanity.io/recipes/next-js-on-demand-tag-revalidation-with-custom-document-actions-33e789cc)).

### B3. Đề xuất (suy luận từ mã và tài liệu, chưa thử)

1. **Cache dữ liệu công khai, không cache HTML:** đổi `fetch(..., { cache: "no-store" })` của các truy vấn công khai chung (không phụ thuộc người dùng) thành có thẻ (ví dụ `corpus`) và thời hạn dự phòng ngắn (ví dụ 10 đến 60 phút). Trang vẫn động, nhưng không phải tải lại toàn bộ bảng từ Supabase ở mỗi yêu cầu.
2. **Làm mới ngay sau mỗi lần publish:** lệnh `pnpm worker publish` (chạy trên máy chủ dự án) gọi một **Route Handler có bảo vệ** để gọi `revalidateTag("corpus")`. Cần một **bí mật dùng chung** đặt làm biến môi trường trên Vercel và trên máy chủ dự án. **Đây là thay đổi cấu hình production, cần chủ dự án quyết.**
3. **Giữ nguyên với dữ liệu theo người dùng:** mọi thứ phụ thuộc phiên (quyền xem PDF, trang quản trị, `getOwner`) vẫn không cache.
4. **Đo trước và sau** bằng đúng kịch bản của bước 4.7 (cùng máy đo, cùng số lượt). Lưu ý phần lớn "thời gian chờ" ở số đo 4.7 là mạng Mỹ–Singapore, nên mức giảm thật có thể nhỏ hơn mong đợi; con số đo được là căn cứ, không phải suy đoán này.

**Rủi ro cần kiểm khi làm:** (a) dữ liệu cũ hiển thị trong lúc chờ làm mới (nên chấp nhận được vì dữ liệu chỉ đổi khi publish); (b) lộ dữ liệu khác nhau theo người dùng nếu vô tình cache truy vấn có cookie, nên chỉ gắn thẻ cho truy vấn dùng khóa `anon`; (c) giới hạn cache của gói Hobby: **chưa tìm được nguồn**, cần đọc tài liệu của Vercel.

## C. Thứ tự đề xuất

1. A-6: chủ dự án xem trang in 892–893 (không tốn công cloud, quyết định mọi thứ còn lại ở phần A).
2. B3.1 và B3.4 (cache dữ liệu công khai, đo lại): làm trên nhánh, mở PR, không đổi cấu hình; cần chủ dự án đồng ý trước khi thêm bí mật làm mới (B3.2).
3. Chạy lại truy vấn về đếm phiếu sau ngày 1/11 và bổ sung A3.
