# Tích hợp: Zotero, Cloudflare, Gemini

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

## 3. TÍCH HỢP ZOTERO (GÓI TRẢ PHÍ) (MỚI)

### 3.1. Vai trò của Zotero trong hệ thống

| Vai trò | Cách tận dụng | Lợi ích |
| :--- | :--- | :--- |
| **Nguồn nạp chính** | Worker đọc qua **Zotero Web API v3** (hoặc Local API của Zotero 7 khi app đang mở); đồng bộ tăng dần bằng tham số `since=<libraryVersion>` | Không phải chép PDF thủ công; chỉ xử lý mục mới hoặc thay đổi |
| **Kho lưu trữ gốc PDF** | Tệp nằm trong **Zotero Storage** (gói trả phí), tải về qua API endpoint `/items/{key}/file` | Zotero là bản gốc; R2 chỉ là bản phục vụ hiển thị, có thể dựng lại bất cứ lúc nào |
| **Kênh kích hoạt xử lý** | Người dùng thêm bài vào collection `Research Data/Inbox` hoặc gắn tag `rd:queue` | Thao tác quen thuộc, không cần học công cụ mới |
| **Nguồn gốc tập bài** *(tùy chọn)* | Nếu muốn, mỗi lượt tìm kiếm là một collection; chuỗi tìm kiếm, CSDL, ngày tìm ghi trong note của collection / trường `Extra` | Xuất được sơ đồ PRISMA 2020 |
| **Sàng lọc (screening)** | Tag `rd:include`, `rd:exclude:<lý do>` | Lưu vết tiêu chí chọn bài |
| **Metadata dự phòng** | Dùng metadata Zotero khi bài không có DOI hoặc Crossref thiếu dữ liệu | Bao phủ bài kỷ yếu, sách, working paper |
| **Bằng chứng từ highlight của bạn** *(tùy chọn)* | Nếu bạn tình cờ highlight khi đọc, highlight trong Zotero Reader theo quy ước màu + mã trường trong comment; worker đọc annotation qua API | Mã hóa ngay khi đọc; annotation có sẵn **số trang in** (`annotationPageLabel`) và vị trí trang (`annotationPosition`) |
| **Bằng chứng do người xác nhận** | Highlight của người dùng khớp với trường AI trích → nâng trạng thái lên `human_reviewed` | Tăng tỷ lệ dữ liệu đã duyệt mà không tốn thêm công |
| **Ghi ngược kết quả** | Worker gắn tag trạng thái (`rd:extracted`, `rd:needs-review`, `rd:verified`) và child note tóm tắt (lý thuyết, mô hình, kết quả chính, link web) | Người dùng thấy kết quả ngay trong Zotero khi viết bài |
| **Chia sẻ** | Không chia sẻ qua Zotero (D4: thư viện cá nhân). Mọi người xem dữ liệu qua **web công khai**; PDF theo chính sách ở Mục 7 | Thư viện cá nhân giữ riêng tư |
| **Khóa trích dẫn ổn định** | Plugin **Better BibTeX**: citekey cố định; nút "Copy citekey" và xuất `.bib` trên web dùng cùng citekey | Nhất quán với LaTeX / Overleaf / Pandoc |
| **Tìm PDF Open Access** | Tính năng "Find Available PDF" của Zotero (dựa trên Unpaywall) | Bổ sung bản OA hợp pháp cho bài còn thiếu tệp |

### 3.2. Quy ước annotation (tùy chọn, không bắt buộc)

| Màu highlight | Phân hệ | Cú pháp comment (ví dụ) |
| :--- | :--- | :--- |
| Vàng | Định nghĩa khái niệm | `#def perceived_risk` |
| Tím | Lý thuyết nền | `#theory TPB role=hypothesis_derivation` |
| Xanh dương | Thiết kế, mẫu, bối cảnh | `#sample S1 n=412 type=consumer_panel` |
| Xanh lá | Giả thuyết & kết quả | `#path S1 H2 PR->PI beta=-.31 p<.001` |
| Cam | Ma trận tương quan / bảng thống kê | `#cormatrix S1 table=2` |
| Đỏ | Hạn chế & hướng nghiên cứu tương lai | `#limit` / `#future` |

Không cần dùng. Nếu có highlight theo quy ước này, worker đọc và dùng làm bằng chứng bổ sung (`source = zotero_annotation`, trạng thái ★).

### 3.3. Lưu ý kỹ thuật
* **Thư viện dùng cho dự án (D4): thư viện cá nhân (My Library).** Bài của dự án nằm trong collection riêng `Research Data` (có collection con `Inbox`); worker **chỉ đọc và ghi trong collection này**.
* **Collection Inbox cấu hình được (bước 0.12):** biến `ZOTERO_INBOX_PATH` trong `.env` (các cấp cách nhau bằng `/`), mặc định `Research Data / Inbox`. Hiện dùng `Dissertation / 2.1 - Perceived ethical value` (11 bài). Chỉ lấy bài nằm trực tiếp trong collection, không lấy collection con.
* **Đã kiểm chứng ở bước 0.12:** key chỉ đọc (chương trình từ chối chạy nếu key có quyền ghi); tải PDF đi qua chuyển hướng sang kho lưu trữ của Zotero **mà không gửi kèm API key**; kết nối tới kho lưu trữ có thể bị ngắt giữa chừng, nên mỗi lần tải được thử lại tối đa 3 lần với URL ký mới; PDF lưu ở `raw_papers/zotero/<attachmentKey>.pdf` (không commit). Lệnh: `pnpm zotero:inbox`.
* **API key Zotero** tạo riêng cho dự án, lưu trong `.env`. Quyền của Zotero cấp theo cả thư viện, không giới hạn được theo collection, nên:
  * Giai đoạn 1–1b chỉ cấp **quyền đọc**; quyền ghi chỉ bật từ Giai đoạn 2, khi có bước ghi ngược.
  * Worker có danh sách cho phép (allowlist) theo collection và chế độ `--dry-run` in ra mọi thay đổi trước khi ghi. Worker chỉ thêm tag có tiền tố `rd:` hoặc child note có tiêu đề bắt đầu bằng `[Research Data]`; **không bao giờ sửa metadata hay xóa mục**.
  * Sao lưu thư viện Zotero (sao chép thư mục dữ liệu Zotero) trước lần ghi ngược đầu tiên.
* *(Tùy chọn sau này)* Nếu nhóm cần cùng làm việc trực tiếp trong Zotero, có thể chuyển collection `Research Data` sang một group library mà không phải đổi kiến trúc, chỉ đổi `ZOTERO_LIBRARY_TYPE` và `ZOTERO_LIBRARY_ID`.
* **Local API** (Zotero 7) chỉ đọc, chạy khi app Zotero đang mở: dùng cho nạp nhanh, không giới hạn tốc độ. **Ghi ngược** (tag, note) phải dùng Web API.
* Tệp lưu bằng **WebDAV không tải được qua Web API**; dự án cần tệp nằm trong **Zotero Storage**.
* **Dung lượng hiện có:** gói Zotero Storage 20 USD/năm = **2 GB**, dùng chung cho thư viện cá nhân và mọi group do chủ dự án sở hữu. Với PDF trung bình ~2 MB, 2 GB chứa được khoảng 800–1.000 bài, tức là đủ cho 300 bài của miền khởi đầu cùng thư viện cá nhân hiện có. Khi kho vượt khoảng 700 bài: nâng lên gói 6 GB hoặc Unlimited, hoặc chuyển bài cũ sang lưu trữ khác.
* Các tính năng khác (group, Web API, Local API, annotation, Better BibTeX) đều **miễn phí**; gói trả phí chỉ mở rộng dung lượng đồng bộ tệp.
* Web API có giới hạn tốc độ: tuân theo header `Backoff` / `Retry-After`.
* Bảng `papers` lưu thêm `zotero_library_id`, `zotero_item_key`, `zotero_attachment_key`, `zotero_version`, `citekey`.

---

## 3A. TẬN DỤNG CLOUDFLARE (MỚI)

Chủ dự án đã có tài khoản Cloudflare (máy đã cài `cloudflared`). Ngoài R2, các dịch vụ sau dùng được cho dự án; tất cả đều có gói miễn phí đủ cho quy mô hiện tại.

| Dịch vụ | Dùng để làm gì trong dự án | Giai đoạn |
| :--- | :--- | :--- |
| **R2** (đã có trong kế hoạch) | Lưu PDF phục vụ hiển thị (private), bản sao lưu `pg_dump` hằng đêm. Gói Free: 10 GB, không tính phí băng thông tải ra | 2 |
| **Workers** | **Chỉ dùng cho tính năng tải nhiều bài (ZIP streaming)** ở giai đoạn sau. Link xem / tải từng PDF do API route của Next.js ký (Mục 7.1), không cần Worker | 6 |
| **Cron Triggers** (Workers) | *Không dùng trong MVP.* Mọi tác vụ định kỳ đặt tập trung ở **GitHub Actions** (Mục 9.3), vì `pg_dump` không chạy được trên Workers và một nơi duy nhất thì dễ theo dõi hơn | — |
| **Cloudflare Tunnel** (`cloudflared`) | *Không cần trong MVP* (không còn người mã hóa thứ hai). Dự phòng: mở tạm web chạy local ra Internet khi cần | — |
| **Cloudflare Access** (Zero Trust) | *Không cần trong MVP*. Dự phòng: khóa thêm route `/admin` nếu sau này gắn tên miền riêng qua Cloudflare | — |
| **Registrar + DNS** | Mua tên miền theo giá gốc khi đặt tên chính thức (D8); gắn custom domain cho web và cho R2 | Trước khi mở công khai |
| **Turnstile** | Chống bot ở form **Báo lỗi** của khách và trang đăng nhập quản trị, không bắt giải CAPTCHA khó chịu. **Cần thiết vì web công khai** | 3 |
| **Web Analytics** | Thống kê truy cập không dùng cookie, không cần banner đồng ý | 4 |

**Phân vai Vercel – Cloudflare (đề xuất):**
* **Vercel** giữ vai trò chạy Web Next.js, vì đây là môi trường Next.js được hỗ trợ đầy đủ nhất.
* **Cloudflare** đảm nhận lưu trữ (R2), chống bot (Turnstile), thống kê truy cập, tên miền và DNS; Workers chỉ dùng cho tải ZIP ở giai đoạn sau.
* **GitHub Actions** đảm nhận mọi tác vụ định kỳ (Mục 9.3).
* **Phương án thay thế:** chạy toàn bộ Web trên **Cloudflare Workers** (Next.js qua adapter OpenNext), gom hạ tầng về một nơi. Đổi lại phải cấu hình nhiều hơn và một số tính năng Next.js cần kiểm tra tương thích. Ngoài ra, gói Hobby của Vercel chỉ dành cho mục đích phi thương mại; nếu sau này dự án có thu phí, Cloudflare là lựa chọn rẻ hơn (D11).
* **Không dùng D1 / Vectorize** thay cho Supabase: dữ liệu có quan hệ phức tạp và cần pgvector + full-text trong cùng một CSDL.

---

## 4. CHIẾN LƯỢC SỬ DỤNG GEMINI API (GÓI TRẢ PHÍ)

### 4.1. Lựa chọn model
* **Model mạnh** (`GEMINI_MODEL_STRONG`, mặc định **`gemini-4-argon`**, bản ổn định, chọn ngày 18/10/2026): lượt trích xuất chính (Pass 1 + Pass 2). Lưu ý giá Argon tăng gấp đôi từ 1/12/2026; phương án thay thế là `gemini-3.1-pro-preview` (bản xem trước).
* **Model nhanh** (`GEMINI_MODEL_FAST`, mặc định `gemini-3.8-flash`): các lời gọi nhỏ (trích bổ sung mục thiếu, đọc số trang ở header/footer).
* Có thể đổi phân vai (VD: dùng Flash cho lượt chính để rẻ hơn) sau khi so chi phí và tỷ lệ ✓ trên 5 bài đầu.
* Tên model không viết cứng trong code; mỗi bản ghi lưu `model_name`.

### 4.2. Kỹ thuật gọi API
* Native PDF input + `responseMimeType: application/json` + `responseSchema` sinh từ Zod; `temperature: 0`; lưu phản hồi thô.
* **Schema mỗi lượt gọi giữ nhỏ.** Tránh union, `$ref`, lồng quá sâu. Có **test tự động** kiểm tra mỗi schema Zod chuyển được sang `responseSchema` hợp lệ.
  * **Đã kiểm chứng ở bước 0.11:** Gemini **từ chối** schema gộp cả Study (23 KB, 31 đối tượng lồng nhau, lỗi `INVALID_ARGUMENT`). Mọi schema từ 8,5 KB / 12 đối tượng trở xuống đều được chấp nhận. Vì vậy mỗi Study được trích bằng **4 lượt gọi**: thiết kế + mẫu + kiểm soát sai lệch; đo lường; đường quan hệ; bảng (tương quan, ô thực nghiệm). Kết quả được ghép lại bằng `assembleStudy`. Giới hạn `GEMINI_SCHEMA_LIMITS` (10 KB, 15 đối tượng) được test tự động giữ cho mọi schema mới.
  * Kiểm tra thật bằng `pnpm schema:gemini-check` (khoảng $0,09 mỗi lần, dùng bài báo giả lập tự viết).
* **Trích xuất hai lượt:** Pass 1 lấy cấu trúc và vị trí bảng; Pass 2 lấy chi tiết theo từng Study (có thể tách riêng lượt gọi cho ma trận tương quan).
* **Batch API là bất đồng bộ**, giá bằng một nửa giá chuẩn (đo thực tế: bài giả lập 4 trang xong trong khoảng 4 phút; đích của Google là tối đa 24 giờ). Luồng `pnpm worker batch submit → poll → status` lưu trạng thái trong bảng `batch_jobs`, chạy lại an toàn và không nộp trùng. Một bài đi qua **hai đợt** vì các lượt theo Study cần nhãn Study của đợt 1. Tiền được giữ chỗ khi nộp và ghi sổ theo chi phí thật khi nhận kết quả.
  * **Giới hạn độ sâu schema của Batch (đo thực tế 19/10/2026):** Batch từ chối schema lồng quá 3 tầng (đối tượng, mảng, hoặc nhóm `anyOf` chứa đối tượng) và **một yêu cầu bị từ chối làm hỏng cả lô**; API đồng bộ nhận được schema sâu hơn. Mọi schema trích xuất của ta sâu 5–6 tầng, nên với Batch schema được đặt vào chỉ dẫn (đầu ra vẫn ép JSON) và Zod kiểm tra từng câu trả lời như mọi lời gọi khác (`extract/batch-client.ts`, `extract/schema-depth.ts`).
* **Context Caching** có ngưỡng token tối thiểu và tính phí lưu theo thời gian; **chưa mặc định bật**. Giai đoạn 1b đo chi phí ba phương án (đồng bộ, đồng bộ + cache, batch) rồi mới chốt.
* **Rate limiting:** cửa sổ trượt 60 giây theo RPM/TPM (`GEMINI_RPM`, `GEMINI_TPM`); thử lại 429/5xx/lỗi mạng với exponential backoff có jitter, tuân theo `Retry-After` và `retryDelay` do máy chủ báo; quá số lần thử thì dừng kèm lý do (`extract/limits.ts`).

### 4.3. Kiểm soát chi phí
* Lệnh `pnpm worker estimate`: in chi phí dự kiến của toàn bộ hàng đợi (giá đồng bộ và giá Batch) trước khi chạy; `pnpm worker spend` cho biết đã dùng và còn lại bao nhiêu.
  * **Không dùng `countTokens` để ước tính tiền:** với PDF, `countTokens` đếm khoảng 560 token/trang trong khi hóa đơn tính khoảng 1.500 token/trang (đo trên hai bài thật ở bước 1.7, thấp hơn 2,7 lần). Ước tính dùng hằng số theo trang đo từ lời gọi thật (`extract/estimate.ts`), cố ý hơi cao.
* Mỗi bài chỉ có **một lượt trích xuất chính**; các lớp kiểm tra còn lại chạy bằng code, không tốn phí API. Đơn giá thật đo trên 5 bài đầu ở Giai đoạn 1 rồi mới đặt trần hằng tháng (D6).
* `GEMINI_BUDGET_LIMIT` (USD, mặc định 25 cho pilot, D6): worker dừng **trước** lời gọi có thể vượt trần (kiểm tra theo chi phí xấu nhất của lời gọi đó), mọi lời gọi đã trả tiền được ghi vào bảng `api_spend` kể cả khi kết quả bị loại. `GEMINI_SPENT_OFFSET_USD` là số đã dùng trước khi có sổ (lấy từ Google AI Studio, mục Billing); `GEMINI_RUN_LIMIT` là trần tùy chọn cho một lần chạy.
* Ghi `input_tokens`, `cached_tokens`, `output_tokens`, `cost_usd` theo bài và theo pass vào `extraction_runs`.
* Đơn giá trong `pricing.json`, cập nhật theo bảng giá hiện hành.

### 4.4. Quyền riêng tư dữ liệu
* Theo điều khoản gói trả phí, dữ liệu gửi lên không dùng để cải thiện sản phẩm của Google; kiểm tra lại điều khoản hiện hành khi bắt đầu.
* API key Gemini và Zotero chỉ nằm trong `.env` của máy chạy worker; không commit, không đưa lên Vercel.

### 4.5. Nguồn trích xuất chính: tác tử Codex / Antigravity (D16)
Từ 19/10/2026 (chi phí Gemini API cao) đây là **nguồn chính**; Gemini API (4.1–4.3) là **phương án dự phòng**, đã dựng sẵn và giữ trần D6. Phân vai: Codex / Antigravity (chủ dự án chạy) chỉ **đọc PDF và ghi JSON**; **Claude Code nhập, kiểm tra, publish và đưa lên web**. Chưa dùng cho cả kho trước khi thử khả thi 1b.7 đạt tiêu chí ở Mục 6.9; bộ thử là các bài trong thư mục Zotero "1 - Social Media Marketing Ethics".

**Luồng:**
1. `pnpm worker manual export --paper X` tạo **gói việc** `extracted_data/manual/<X>/` cho một bài (bản sao PDF, `AGENTS.md`, và `INSTRUCTIONS.md` là **gói prompt**; mở thư mục này, ngoài repo, khi giao cho tác tử): chỉ dẫn chung (`FULL_INSTRUCTIONS`), prompt các lượt và JSON Schema sinh từ `EXTRACTION_SCHEMAS` (cùng nguồn với luồng Gemini, nên đổi prompt / schema ở một chỗ là đủ). Gói gộp mọi lượt thành **một JSON** `{ prompt_version, schema_version, paper_structure, paper_discussion, studies: [{ study_label, study_design_sample_bias, study_measurements, study_paths, study_tables }] }`; giới hạn kích thước schema ở 4.2 chỉ là của structured output Gemini, không áp dụng cho chat.
2. Một LLM bên ngoài đọc PDF + gói prompt và trả về JSON, lưu vào `extracted_data/manual/inbox/<X>.json` (ba đường, xem bên dưới). Bài nhiều Study có thể vượt độ dài trả lời: gói có hướng dẫn trả lời theo từng phần (cấu trúc trước, rồi mỗi Study một lượt), file nhập nhận cả dạng gộp lẫn nhiều phần.
3. `pnpm worker manual check --file …` (tác tử tự chạy, không cần database, không cần khóa): kiểm tra Zod bằng `parseAnswer`, in lỗi dễ dán lại để tác tử sửa trước khi trả bài.
4. **Claude Code** chạy `pnpm worker manual import --all` (hoặc `--paper X --file … --model <tên>`): nhập mọi file trong `inbox/`, ghép mỗi file với đúng bài; kiểm tra từng phần bằng `parseAnswer` (Zod, rút gọn câu trích dài như luồng chính); lỗi in ra **dễ dán lại cho LLM sửa**; hợp lệ thì ghi `extracted_data/<hash>.full.json` dạng `SavedExtraction`, chạy `publishExtracted` như mọi bài khác và chuyển file sang `manual/done/`. Đầu ra gọn, mỗi bài một dòng (`✓ · ⚠ · ẩn` hoặc lỗi), để agent chạy giúp tốn ít token.
5. Các lớp máy đối chiếu với PDF (S5–S8), huy hiệu ✓ / ⚠ / ◇ / ẩn, khóa trường sửa tay: **giữ nguyên**, vì chúng không phụ thuộc ai trích xuất. Chất lượng thủ công vì vậy được đo bằng cùng thước (`pnpm worker quality`).

**Ba đường cho bước 2** (tác tử chỉ cần `export` và `check`; **`import` và publish do Claude Code chạy**):

| Đường | Cách làm | Đọc PDF | Hợp với |
| :--- | :--- | :--- | :--- |
| **Codex** (OpenAI, agent trong repo) | Mở **thư mục gói việc** (ngoài repo, không có `.env`), gõ "Làm theo INSTRUCTIONS.md"; agent đọc PDF → ghi JSON → chạy `manual check`, tự sửa khi báo lỗi; sau đó Claude Code `import` | Thường qua lớp chữ (`pdf-inspect`): câu trích khớp tốt, nhưng không đọc được bảng dạng ảnh | Nguồn chính, dùng gói ChatGPT |
| **Antigravity** (Google, agent trong repo) | Như Codex | Như Codex | Nguồn chính |
| **ChatGPT web** (chép–dán) | Đính kèm PDF + dán gói prompt, chép JSON vào `inbox/`, chạy `import --all` | "Nhìn" cả trang PDF, đọc được bảng dạng ảnh | Bài nhiều bảng / ma trận dạng ảnh |

* **Một nguồn duy nhất cho prompt / schema** là lệnh `manual export`. Không chép prompt hay schema cố định vào Custom GPT, rule hay skill của công cụ khác (bản chép sẽ cũ khi chỉnh prompt ở 1b.4). File `AGENTS.md` (nằm trong mỗi gói việc; Codex đọc tự động, Antigravity đọc qua rule trỏ tới) chỉ mô tả quy trình 4 bước và quy tắc không commit PDF / JSON thô. ChatGPT web có thể dùng một Project với chỉ dẫn ngắn ("làm theo gói prompt tôi dán, chỉ trả JSON, câu trích nguyên văn"), mỗi bài vẫn dán gói mới export.
* **Kiểm tra phiên bản:** import **từ chối** file có `prompt_version` / `schema_version` khác bản hiện hành và báo "export lại gói mới".

**Đã làm ở bước 1b.8a:** `pnpm worker manual export --paper X [--code NAME] [--force]` ghi gói việc vào `PACKETS_DIR` (mặc định `C:/Projects/Research Data Packets`, ngoài repo). Gói gồm `paper.pdf`, `INSTRUCTIONS.md` (chỉ dẫn chung, prompt từng lượt, **tên file trả lời đầy đủ**), `AGENTS.md`, `schemas/*.schema.json` (cùng schema Gemini dùng), `packet.json` (mã băm, phiên bản prompt / schema / codebook) và thư mục `out/` trống. Cùng đầu vào cho đúng cùng byte (không có ngày giờ); lệnh **từ chối** khi `out/` đã có câu trả lời (chỉ ghi đè gói với `--force`, câu trả lời vẫn giữ); tên gói chỉ chứa chữ, số, `.`, `_`, `-`. Prompt **full-1.5.0** thêm hai quy tắc dùng chung: không ghi đối tượng nào thiếu câu trích; tối đa 8 mục cho mỗi danh sách ở phần thảo luận.

**Đã làm ở bước 1b.8b:** `pnpm worker manual check <tên gói | thư mục> [--no-feedback]` kiểm tra `out/` **không cần database và không cần khóa** (tác tử tự chạy được). Kiểm tra: `packet.json` đúng phiên bản prompt / schema / codebook hiện hành (cũ thì "export lại gói"); `paper.pdf` đúng mã băm; từng file trả lời là một JSON qua Zod (lỗi nêu đường dẫn trường); đủ **bốn file cho mỗi Study** trong `paper_structure.json` với đúng tên đầy đủ (nếu tác tử rút gọn tên thì báo tên đúng cần dùng). Lỗi chặn nhập; cảnh báo (câu trích hơn 50 từ, file thừa bị bỏ qua) chỉ để xem. Lỗi được ghi vào `FEEDBACK.md` để tác tử đọc và sửa; hợp lệ thì `FEEDBACK.md` bị xóa. Mã thoát 0 khi hợp lệ, 2 khi có lỗi.

**Quy ước:**
* `model_name` = `manual:<công cụ>:<model>` (VD `manual:codex:gpt-…`, `manual:chatgpt-web:…`), `prompt_version` = phiên bản prompt của gói kèm hậu tố `-manual`; vì vậy khóa xử lý khác luồng Gemini và trích lại bằng Gemini sau này không bị bỏ qua. Trích lại vẫn không ghi đè trường đã sửa tay (Mục 6.7).
* `cost_usd` = 0, không ghi vào `api_spend` (không tốn ngân sách Gemini).
* Bước trích bổ sung mục thiếu (dùng Flash) bị bỏ qua; danh sách mục thiếu được in ra để hỏi tiếp LLM nếu cần.
* File câu trả lời là phản hồi thô: chỉ để trong `extracted_data/` (đã gitignore), không commit.
* **Khóa bí mật:** tác tử chạy trong thư mục gói việc ngoài repo, không có `.env`; không bao giờ đưa khóa API (Gemini, Zotero, Supabase, R2) cho Codex / Antigravity / ChatGPT (rủi ro 12).
* **Quyền riêng tư (4.4):** bản chat miễn phí / gói cá nhân của một số nhà cung cấp có thể dùng dữ liệu để huấn luyện; trước khi tải PDF có bản quyền lên, tắt tùy chọn dùng dữ liệu để huấn luyện hoặc dùng gói có cam kết không huấn luyện.

**Kế hoạch kiểm thử:** xem [Mục 6.9](quality-assurance.md) (thử khả thi 1b.7 trước, làm thật 1b.8 sau, tiêu chí đạt / không đạt, đo thời gian người làm).
