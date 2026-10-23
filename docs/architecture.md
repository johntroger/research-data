# Kiến trúc & Công nghệ

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

## 2. KIẾN TRÚC HỆ THỐNG VÀ LUỒNG DỮ LIỆU (DATA ARCHITECTURE 3.3)

```
[1. Nguồn tài liệu]
  ├─ Zotero (nguồn chính): collection "Research Data/Inbox" hoặc tag  rd:queue
  └─ Thư mục raw_papers/ (dự phòng cho tệp chưa có trong Zotero)
                       │
                       ▼
[2. Claude Code Resumable Batch Worker (Node.js + TypeScript, chạy local)]
  ├─ S1  ingest         : đồng bộ tăng dần từ Zotero (?since=<version>), tải PDF, SHA-256, loại trùng (hash + DOI + Zotero key)
  ├─ S2  metadata       : Crossref theo DOI (ưu tiên) → Zotero (dự phòng); Unpaywall → trạng thái OA; SJR/ABS/ABDC;
  │                       trạng thái rút bài (Crossref / Retraction Watch); cảnh báo tạp chí ngoài Scopus/SJR/ABDC
  ├─ S3  text_layer     : pdfjs-dist / unpdf → text theo trang; phát hiện PDF scan (needs_ocr);
  │                       xác định printed_page (PageLabels → Crossref + độ lệch → Gemini đọc header/footer)
  ├─ S4  llm_extract    : Gemini Pro, một lượt (Pass 1 cấu trúc + Pass 2 từng Study), kèm bằng chứng cho mỗi giá trị (Mục 6.2)
  │        (đồng bộ cho lượt nhỏ; Batch API bất đồng bộ submit → poll → ingest cho lượt lớn)
  ├─ S5  verify         : máy đối chiếu với PDF, độ đầy đủ + trích bổ sung mục thiếu, tính lại thống kê, Zod schema (Mục 6.3)
  ├─ S6  crosscheck     : kiểm tra chéo trong bài (Mục 6.4)
  ├─ S7  badge          : gắn huy hiệu ✓ / ⚠ / ◇ / ẩn cho từng trường (Mục 6.5)
  ├─ S8  normalize      : ánh xạ tên khái niệm → Canonical Construct (tự động khi chắc chắn; không chắc thì tách riêng)
  ├─ S9  upload         : PDF → Cloudflare R2 (khóa theo hash, bucket private)
  ├─ S10 publish        : ghi Supabase PostgreSQL (bảng chuẩn hóa + raw JSONB + embeddings)
  └─ S11 write_back     : ghi ngược vào Zotero (tag trạng thái, child note tóm tắt, link tới trang web)
                       │
                       ▼
[3. Vercel Web App (Next.js App Router, Server Components)]
  ├─ Truy vấn Supabase (RLS, anon key chỉ đọc), dữ liệu mới hiển thị ngay không cần deploy lại
  ├─ API route cấp Signed URL cho PDF từ R2 (theo quy tắc bản quyền)
  └─ Tìm kiếm: Full-text (tsvector) + bộ lọc facet; Semantic (pgvector) ở giai đoạn sau
                       │
                       ▼
[4. Trải nghiệm Người Dùng]
  ├─ Sửa trực tiếp + Cần chú ý (quản trị) ├─ Thư viện lọc đa chiều + Relationship Search (A ↔ B)
  ├─ Split-Screen Evidence Workspace  ├─ Ma trận tổng hợp + xuất Word APA 7 / Excel
  ├─ Trang Khái niệm & Lý thuyết      ├─ Evidence Map & Heatmap khoảng trống
  └─ Trang "Giới thiệu & cách đọc dữ liệu" (công khai) + /admin/quality (chỉ chủ dự án)
```

* Mỗi bước S1–S11 là **idempotent**, ghi trạng thái vào bảng `pipeline_runs` trên Supabase. Khóa xử lý: `file_hash + schema_version + codebook_version + prompt_version`.
* Dùng **Supabase ngay từ đầu**, không có tầng SQLite trung gian.
* **Ràng buộc gói Free:** mỗi tài khoản chỉ có **2 project đang hoạt động**, và chủ dự án **đã dùng 1 project** cho việc khác. Vì vậy:
  * **Môi trường `prod`:** dùng **slot cloud duy nhất còn lại**.
  * **Môi trường `dev`:** chạy **Supabase CLI local** (cần Docker Desktop trên Windows với WSL2; máy đã có WSL2, chưa có Docker, xem D13). Migrations được thử trên local trước, rồi mới áp dụng lên `prod`.
  * **Phương án dự phòng** nếu không cài Docker: dùng chung project `prod` với một schema PostgreSQL riêng tên `dev`. Cách này rủi ro hơn, nên bắt buộc chạy `pg_dump` trước mỗi lần áp dụng migration.
  * Project Free bị **tạm dừng sau khoảng 7 ngày không hoạt động**: workflow ping trong GitHub Actions (Mục 9.3) giữ project `prod` hoạt động.

---

## 9. CÔNG NGHỆ SỬ DỤNG & CẤU TRÚC MÃ NGUỒN

### 9.1. Tech stack

| Thành phần | Công nghệ |
| :--- | :--- |
| Ngôn ngữ | **TypeScript** toàn bộ, một runtime Node.js |
| Schema | **Zod** → `zod-to-json-schema` (Gemini) + kiểu DB + kiểu Web |
| Worker | Node.js CLI, chạy local, do Claude Code xây dựng và vận hành |
| Nguồn tài liệu | **Zotero Web API v3** + Zotero 7 Local API; Better BibTeX |
| Trích xuất | Gemini API (trả phí): Flash / Pro, Batch API, Context Caching (tùy kết quả đo) |
| Text layer PDF | **`pdfjs-dist`** hoặc **`unpdf`** (giấy phép Apache / MIT) |
| Metadata | Crossref REST API, Unpaywall API, citation-js (CSL → APA 7 / BibTeX) |
| Embedding | Gemini embedding, giảm chiều 768, lưu `halfvec` |
| CSDL | Supabase PostgreSQL + pgvector, RLS, Supabase Auth; **1 project cloud (`prod`)** + **Supabase CLI local (`dev`, chạy trên Docker)**; migrations bằng Supabase CLI |
| Lưu trữ PDF phục vụ hiển thị | Cloudflare R2 (private) + Signed URL |
| Web | Next.js App Router, Tailwind CSS, shadcn/ui, TanStack Table, react-pdf / pdf.js |
| Biểu đồ | Recharts hoặc Visx (forest plot, heatmap), Cytoscape.js (mạng quan hệ) |
| Xuất file | `docx`, `exceljs` |
| Triển khai & vận hành | GitHub → Vercel; GitHub Actions cho CI, kiểm thử hồi quy và mọi tác vụ định kỳ (Mục 9.3) |
| Kiểm thử | Vitest, Playwright (Mục 9.4) |

### 9.2. Cấu trúc monorepo (pnpm workspaces)

```
research-data/
├─ packages/
│  └─ schema/          ← Zod schema, codebook, prompt (dùng chung)
├─ apps/
│  ├─ worker/          ← CLI: sync, estimate, extract, verify, publish, write-back, rerun, test:synthetic
│  └─ web/             ← Next.js (gồm trang quản trị: sửa trực tiếp, Cần chú ý, chất lượng)
├─ supabase/
│  └─ migrations/      ← migrations SQL theo schema_version
├─ fixtures/synthetic/ ← bộ bài giả lập tự tạo (PDF giả + đáp án), commit được vào repo public
├─ docs/               ← codebook.md, quality-assurance.md, architecture.md, data-schema.md, ux-spec.md, integrations.md
├─ raw_papers/         ← (không commit) PDF dự phòng ngoài Zotero
└─ extracted_data/     ← (không commit) phản hồi thô
```

* Code hiện có (`schema.js` dạng CommonJS) được **viết lại** thành `packages/schema` theo Zod, không vá tiếp.
* `.gitignore` bổ sung: `extracted_data/`, `raw_papers/`, `.env*` (trừ `.env.example`).

### 9.3. Tác vụ định kỳ (GitHub Actions, MỚI)
Mọi tác vụ định kỳ đặt tập trung ở GitHub Actions để dễ theo dõi (Cloudflare Cron không dùng trong MVP).

| Workflow | Lịch | Việc làm |
| :--- | :--- | :--- |
| `backup.yml` ✅ | Hằng đêm 02:17 giờ Việt Nam (19:17 UTC), chạy tay được với `keep` | `scripts/backup-prod.sh`: `pg_dump -Fc` schema `public` của Supabase `prod` (qua pooler, ảnh `postgres:17`) → bucket R2 riêng `research-data-backups` thành `backups/db-<giờ UTC>.dump`, kiểm kích thước sau khi tải lên, giữ 30 bản mới nhất (chỉ xóa tệp đúng mẫu tên của chính nó) |
| `keepalive.yml` | (không cần) | `backup.yml` mở database mỗi đêm nên đã giữ project Supabase Free không bị tạm dừng; chỉ làm workflow riêng nếu bỏ sao lưu hằng đêm |
| `retraction-check.yml` | Hằng tháng | Kiểm tra lại trạng thái rút bài qua Crossref cho mọi bài; gắn cảnh báo lên bài và mọi kết quả liên quan |
| `ci.yml` | Mỗi pull request / push | Lint, type-check, unit test (Mục 9.4) |
| `regression.yml` | Khi `packages/schema` hoặc prompt thay đổi | Chạy bộ bài giả lập (Mục 6.6); có trần chi phí riêng |

Các khóa bí mật (Supabase, R2, Gemini) lưu trong **GitHub Actions Secrets**, không bao giờ in ra log.

**Sao lưu: khóa và quyền (bước 2.4).** Bản sao lưu nằm ở bucket riêng `research-data-backups`, tách khỏi bucket PDF; token R2 `research-data-backup-rw` (quyền "Workers R2 Storage Bucket Item: Edit") **chỉ thấy bucket này** (đã thử: không liệt kê hay ghi được bucket PDF và bucket của dự án khác). Bảy secrets của repo (`SUPABASE_PROD_REF`, `SUPABASE_PROD_DB_PASSWORD`, `SUPABASE_PROD_POOLER_HOST`, `R2_ACCOUNT_ID`, `R2_BACKUP_BUCKET`, `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`) được đặt bằng `scripts\set-github-secrets.ps1` từ `.env`, không in giá trị. Khóa nhập bằng `scripts\set-r2-keys.ps1 -Role backup`.

**Sao lưu bản trích xuất đã lưu (bước 2.4b, chạy tay).** `pnpm worker backup-files [--yes] [--keep N]` nén các tệp ở **gốc** `extracted_data/` (bản trích xuất đã lưu `*.full.json`, `*.gemini.json`, văn bản OCR, sổ gọi, khoảng 8,6 MB, nén còn 0,7 MB) thành `extracted/extracted-<giờ UTC>.tar.gz` trong bucket `research-data-backups` bằng token sao lưu; **không** lấy thư mục con `backups/` (các bản dump cũ, đã có sao lưu hằng đêm) và `audit/` (mẫu kiểm có câu trích từ bài có bản quyền). Không có `--yes` chỉ xem trước. Sau khi tải lên, lệnh tải lại bản đó và so SHA-256 mới tin; rồi giữ 12 bản mới nhất (chỉ xóa tệp đúng tên mẫu `extracted/extracted-*.tar.gz`, bản `backups/db-*.dump` của sao lưu hằng đêm nằm ở tiền tố khác nên không bị đụng). Khôi phục: `tar -xzf extracted-<ngày>.tar.gz -C extracted_data`. Đã thử giải nén bản trên R2: 67/67 tệp giống hệt bản local. Nên chạy sau mỗi đợt nhập bài mới.

**Phục hồi (đã thử ngày 23/10/2026).** Tải bản mới nhất từ R2 (bằng token sao lưu hoặc `wrangler r2 object get research-data-backups/backups/<tên>.dump --remote --file b.dump`), rồi:

```bash
pg_restore --no-owner --no-privileges -d <database đích> b.dump
```

Lệnh báo một lỗi vô hại `schema "public" already exists` (bản dump có lệnh tạo schema). Thử phục hồi bản sao lưu thật vào một database tạm: số dòng 9 bảng chính **khớp prod** (10.746 trường, 2.672 bằng chứng, 36 bài...). Bản dump chỉ có schema `public` (bảng, view, chính sách RLS và dữ liệu; chưa có schema `auth`, `storage` vì dự án chưa dùng). Số dòng đã đối chiếu sau phục hồi; **chính sách RLS chưa được kiểm riêng sau phục hồi**, nên sau một lần phục hồi thật hãy chạy lại phép kiểm khách ở Mục 2.1 (khách không đọc được trường ẩn). Kiểm tra phục hồi định kỳ (3 tháng một lần) là việc của chủ dự án.

### 9.3b. Phân chia lưu trữ giữa Supabase và Cloudflare R2 (chủ dự án yêu cầu 23/10/2026)
Cloudflare R2 (Free 10 GB) còn nhiều chỗ hơn Supabase (Free 500 MB cho database), nên **Supabase chỉ giữ dữ liệu cần truy vấn**, mọi thứ nặng đưa sang R2:

| Dữ liệu | Nơi lưu | Ghi chú |
| :--- | :--- | :--- |
| Bảng tra cứu (bài, Study, đường dẫn, trường, bằng chứng, ma trận, khái niệm) | **Supabase** | Hiện khoảng 34 MB cho 36 bài (extracted_fields chiếm 12 MB) |
| PDF gốc | **R2** (private) | Bước 2.2 |
| Bản trích xuất đã lưu (`<hash>.full.json`, `.gemini.json`, `.ocr.json`) và phản hồi thô của model | **R2** (private) | Hiện nằm ở `extracted_data/` trên máy, khoảng 400 MB gồm cả sao lưu và mẫu kiểm; không đưa lên Supabase |
| Sao lưu `pg_dump` hằng đêm và các bản dump dữ liệu | **R2** | Giữ 30 bản; không lưu sao lưu trong database |
| `extraction_runs.raw_text` (văn bản thô mỗi lượt trích xuất) | Supabase trong MVP (1,2 MB cho 36 bài); **chuyển sang R2 khi database vượt khoảng 300 MB** | Ngưỡng cảnh báo để còn dư địa dưới 500 MB |

Quy tắc: không thêm cột blob, PDF hay JSON lớn vào Supabase; khi cần lưu tệp thì lưu ở R2 và chỉ giữ khóa đối tượng trong database. Theo dõi dung lượng database ở Supabase Dashboard > Database trước mỗi lần nhập nhiều bài.

### 9.4. Chiến lược kiểm thử (MỚI)

| Loại | Phạm vi | Công cụ |
| :--- | :--- | :--- |
| Unit test | Bộ kiểm chứng (fuzzy match câu văn, khớp số `.35` / `0.35` / `0,35`, kiểm tra ma trận tương quan, kiểm tra `condition_cells`); xác định `printed_page`; quy tắc logic | Vitest |
| Schema test | Mọi schema Zod chuyển được sang `responseSchema` hợp lệ của Gemini; ví dụ JSON mẫu qua được validate | Vitest |
| Database test | Migrations chạy được từ đầu trên Supabase local; RLS: khách đọc được mọi dữ liệu trừ trường bị ẩn (không khớp PDF), không ghi được; chỉ tài khoản quản trị ghi được; truy vấn `relation_index` trả đúng kết quả cho dữ liệu mẫu | Supabase CLI + Vitest |
| End-to-end | Khách: Relationship Search → mở Split-Screen → tải PDF OA (bài không OA chỉ hiện link DOI). Quản trị: đăng nhập → sửa một trường → trích xuất lại → trường đã sửa không bị ghi đè | Playwright |
| Hồi quy chất lượng trích xuất | Bộ bài giả lập | `test:synthetic` |

* **Dữ liệu dùng trong test phải là văn bản tự viết** (bài báo giả lập, PDF tự tạo). Repo public, nên không đưa nội dung bài báo có bản quyền vào test.
* Gọi Gemini trong test dùng phản hồi giả lập (mock); chỉ `regression.yml` gọi API thật, và có trần chi phí riêng.

### 9.5. Quy trình triển khai: GitHub → Vercel (MỚI)

**Luồng mã nguồn:**
```
Máy chủ dự án                   GitHub (research-data, public)        Vercel
(Claude Code viết code)                                                (chạy Web)
      │  git push                        │                                │
      ├─────────────────────────────────►│  webhook: có code mới          │
      │                                  ├───────────────────────────────►│  build apps/web (1–3 phút)
      │                                  │  ci.yml chạy test song song     │  → cập nhật trang web
```
* **Nhánh `main`** → Vercel cập nhật **bản chính** (production) mà nhóm đang dùng.
* **Nhánh khác / pull request** → Vercel tạo **bản xem trước** (preview) với địa chỉ riêng để thử; trang chính không bị ảnh hưởng.
* **Quy tắc gộp:** chỉ gộp vào `main` khi `ci.yml` qua hết và chủ dự án đã xác nhận (xem bản preview hoặc đồng ý trong chat). Bật **branch protection** cho `main`.
* **Quay lui:** bản mới bị lỗi thì dùng tính năng *Instant Rollback* của Vercel để quay về bản trước ngay lập tức, rồi mới sửa code.
* **Cấu hình Vercel:** Root Directory = `apps/web`; chỉ build lại khi `apps/web/` hoặc `packages/schema/` thay đổi (Ignored Build Step). Biến môi trường (Supabase anon key, token R2 chỉ đọc, URL…) khai báo trong **Vercel Project Settings**, không nằm trong code.

**Luồng dữ liệu (không đi qua GitHub, không cần build lại):**
```
Zotero → Worker (máy chủ dự án) → Supabase (dữ liệu) + R2 (PDF) ← Web trên Vercel đọc trực tiếp khi người dùng truy cập
```
* Thêm bài mới → dữ liệu hiện trên web ngay, **không cần đẩy code**.
* Chỉ khi sửa giao diện hoặc tính năng mới cần đẩy code lên GitHub.

**Vai trò của GitHub:** kho mã nguồn gốc và lịch sử phiên bản; nguồn để Vercel triển khai; CI chặn code lỗi; nơi chạy tác vụ định kỳ (Mục 9.3); giữ khóa bí mật cho các tác vụ đó (Actions Secrets); chia sẻ mã nguồn mở theo giấy phép MIT.

**Việc của chủ dự án:** một lần lúc đầu (đăng nhập GitHub, bấm "Import from GitHub" trên Vercel); sau đó chỉ xem bản preview và xác nhận khi có tính năng mới. Commit, push, mở pull request do Claude Code thực hiện.
