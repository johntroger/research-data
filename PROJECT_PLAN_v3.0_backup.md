# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT PLAN - VERSION 3.0)
## HỆ THỐNG CƠ SỞ DỮ LIỆU & TỔNG QUAN TÀI LIỆU KHOA HỌC CHUẨN MỰC Q1
*(Academic Literature Matrix & Research Knowledge Base for Behavioral Science, Management & Marketing)*

---

## 0. NHỮNG THAY ĐỔI CHÍNH SO VỚI VERSION 2.0

| # | Thay đổi | Lý do |
| :--- | :--- | :--- |
| 1 | Worker do **Claude Code** xây dựng và vận hành; **Gemini API (gói trả phí)** đảm nhận trích xuất | Gói trả phí: dữ liệu không dùng để huấn luyện, hạn mức cao, có Batch API và Context Caching |
| 2 | Thêm **Giai đoạn 0** (Codebook + Bộ chuẩn vàng) và **Giai đoạn 1b** (Pilot đo độ tin cậy) | "Chính xác 100%" phải được *đo* và *chứng minh*, không chỉ tuyên bố |
| 3 | Đơn vị phân tích chuyển từ "giả thuyết" sang **"đường quan hệ được kiểm định" (tested path)** theo từng Study | Cho phép so sánh giữa các bài, quy đổi effect size, làm nền cho meta-analysis |
| 4 | Thêm lớp **Khái niệm chuẩn (Canonical Construct Ontology)** | Xử lý vấn đề jingle–jangle; điều kiện tiên quyết cho Evidence Map |
| 5 | **Consensus & Conflict Engine** → **Evidence Map** dựa trên effect size + CI | Vote-counting theo p-value bị phản biện meta-analysis bác bỏ |
| 6 | Pipeline nhiều bước có trạng thái; metadata lấy từ **Crossref**, không lấy từ LLM | Giảm lỗi metadata; idempotent theo `file_hash + prompt_version` |
| 7 | **Kiểm chứng câu trích tự động** với text layer của PDF; lưu cả `pdf_page_index` và `printed_page` | Chống hallucination thực chất; số trang APA ≠ số trang file PDF |
| 8 | Chốt **Supabase PostgreSQL + pgvector**; schema chuẩn hóa quan hệ | D1 không có vector native; dữ liệu học thuật có quan hệ phức tạp |
| 9 | **R2 private + Signed URL**; chỉ công khai PDF Open Access | Rủi ro bản quyền khi phân phối PDF của nhà xuất bản |
| 10 | Thêm **Trang Khái niệm**, **Trang Lý thuyết**, **Heatmap khoảng trống**, huy hiệu tin cậy | Thiết kế theo công việc của người nghiên cứu, không theo cấu trúc dữ liệu |
| 11 | **TypeScript toàn bộ**, schema Zod dùng chung | Một nguồn sự thật cho worker, Gemini và web |
| 12 | Chi phí: hạ tầng 0đ cố định + **chi phí Gemini biến đổi theo số bài**, có trần ngân sách | Phản ánh đúng việc dùng API trả phí |

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Tuyên ngôn Sứ mệnh (Mission Statement)
Xây dựng một hệ thống cơ sở dữ liệu học thuật tự động hóa chuyên sâu cho các ngành **Khoa học Hành vi, Quản trị kinh doanh, Marketing và Kinh tế**, có khả năng:
* Phân tách sâu toàn văn bài báo khoa học (Native PDF extraction) bằng **Gemini API (gói trả phí)**, với **mọi trường dữ liệu đều truy vết được về trang và đoạn văn gốc**.
* Lưu trữ PDF trên **Cloudflare R2** (Zero Egress Fee), chia sẻ có kiểm soát theo tình trạng bản quyền.
* Cung cấp giao diện Web trên **Vercel** để tra cứu, lọc đa chiều, xem ma trận tổng hợp (Synthesis Matrix), bản đồ bằng chứng (Evidence Map) và trích dẫn có kiểm chứng.
* Có **độ tin cậy trích xuất được đo lường và báo cáo được** (inter-rater agreement giữa AI và người mã hóa), đủ để dùng làm dữ liệu cho bài tổng quan hệ thống / meta-analysis đăng tạp chí.
* Mở rộng bền vững từ **1 bài đến hơn 5.000 bài báo**.

### 1.2. Người dùng mục tiêu & Công việc cốt lõi (Jobs-to-be-done)
| Người dùng | Công việc cần làm |
| :--- | :--- |
| Nghiên cứu sinh, học viên cao học | Viết Chương 2 (tổng quan), xây mô hình nghiên cứu, chọn thang đo |
| Giảng viên, nhà nghiên cứu | Tìm Research Gap, viết SLR / meta-analysis, phản biện |
| Nhóm nghiên cứu | Chia sẻ kho tài liệu chung, thống nhất định nghĩa khái niệm |

Bốn câu hỏi hệ thống phải trả lời tốt:
1. *"Mối quan hệ X → Y đã được nghiên cứu thế nào, ở bối cảnh nào, độ lớn tác động ra sao?"*
2. *"Khái niệm Z được định nghĩa và đo lường như thế nào trong các nghiên cứu?"*
3. *"Lý thuyết T được sử dụng ra sao (chỉ nhắc tên hay thực sự dùng để xây giả thuyết)?"*
4. *"Lập bảng tổng quan tài liệu chuẩn APA cho tập bài tôi chọn."*

### 1.3. Mục tiêu Định lượng (KPIs & Metrics)
* **Độ tin cậy trích xuất (đo trên Bộ chuẩn vàng):**
  * Trường phân loại (loại thiết kế, lý thuyết, trạng thái giả thuyết…): **Cohen's κ / Krippendorff's α ≥ 0,80**.
  * Trường số (β, p, n, R²…): **≥ 95% khớp chính xác** với người mã hóa.
  * Câu trích dẫn (`exact_quote`): **≥ 95% được kiểm chứng tự động** khớp với text layer của PDF (fuzzy match ≥ 0,90).
* **Truy vết:** 100% kết quả, định nghĩa và giả thuyết có `evidence` (câu trích + số trang); trường không có bằng chứng được gắn trạng thái `unverified` và hiển thị rõ cho người dùng.
* **Hiệu năng Web:** trang tải < 0,8 giây; truy vấn lọc đa tiêu chí < 200 ms (p95) ở quy mô 5.000 bài.
* **Chi phí:**
  * Hạ tầng cố định: **0 VNĐ/tháng** (Vercel Hobby, R2 Free 10GB, Supabase Free) ở giai đoạn đầu.
  * Gemini: chi phí biến đổi, **ước tính trước mỗi lượt chạy** (dry-run bằng `countTokens`), có **trần ngân sách** cấu hình được; ghi nhận chi phí thực tế theo từng bài.

### 1.4. Nguyên tắc Thiết kế
1. **Evidence-first:** không có trường dữ liệu nào hiển thị mà không kèm nguồn gốc và trạng thái kiểm chứng.
2. **Human-in-the-loop:** AI trích xuất, máy kiểm chứng, con người duyệt các trường quan trọng và trường bị gắn cờ.
3. **Reproducible:** mọi lượt trích xuất lưu phiên bản model, prompt, schema và phản hồi thô.
4. **Single source of truth:** một schema Zod duy nhất sinh ra JSON Schema cho Gemini, validator, kiểu dữ liệu DB và kiểu dữ liệu Web.
5. **Copyright-aware:** quyền truy cập PDF phụ thuộc tình trạng Open Access.
6. **Methodologically sound:** cấu trúc dữ liệu theo chuẩn phương pháp luận hiện hành (mediation hiện đại, effect size có CI, phân loại khoảng trống đã công bố).

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ LUỒNG DỮ LIỆU (DATA ARCHITECTURE 3.0)

```
[1. Bạn thả PDF vào raw_papers/ (kèm DOI nếu có) hoặc xuất từ Zotero]
                       │
                       ▼
[2. Claude Code Resumable Batch Worker (Node.js + TypeScript, chạy local)]
  ├─ S1  ingest            : quét thư mục, tính SHA-256, loại trùng (hash + DOI)
  ├─ S2  metadata          : Crossref theo DOI → APA 7 / BibTeX qua CSL; Unpaywall → trạng thái OA
  ├─ S3  text_layer        : PyMuPDF / pdf.js → text theo trang + bản đồ pdf_page_index ↔ printed_page
  ├─ S4  llm_extract       : Gemini API (trả phí)
  │        ├─ Pass 1: cấu trúc (loại bài, danh sách Study, khái niệm, lý thuyết)
  │        └─ Pass 2: chi tiết từng Study (đo lường, đường quan hệ, effect size) — dùng Context Caching
  │        (khối lượng lớn → Gemini Batch API; rate limiter + backoff)
  ├─ S5  validate          : kiểm tra Zod schema + quy tắc logic (p ∈ [0,1], n > 0, CI chứa estimate…)
  ├─ S6  verify_quotes     : so khớp exact_quote với text trang tương ứng → verified / match_score
  ├─ S7  normalize         : ánh xạ tên khái niệm → Canonical Construct (embedding + duyệt tay)
  ├─ S8  upload            : PDF → Cloudflare R2 (khóa theo hash, bucket private)
  └─ S9  publish           : ghi vào Supabase PostgreSQL (bảng chuẩn hóa + raw JSONB + embeddings)
                       │
                       ▼
[3. Vercel Web App (Next.js App Router, Server Components)]
  ├─ Truy vấn Supabase (RLS, anon key chỉ đọc) — dữ liệu mới hiển thị ngay, không cần deploy lại
  ├─ API route cấp Signed URL cho PDF từ R2 (theo quy tắc bản quyền)
  └─ Tìm kiếm: Full-text (tsvector) + bộ lọc facet; Semantic (pgvector) ở giai đoạn sau
                       │
                       ▼
[4. Trải nghiệm Người Dùng]
  ├─ Thư viện lọc đa chiều (Faceted Library)
  ├─ Không gian soi bằng chứng chia đôi (Split-Screen Evidence Workspace)
  ├─ Ma trận tổng hợp Master-Detail + xuất Word APA 7 / Excel
  ├─ Trang Khái niệm & Trang Lý thuyết
  └─ Evidence Map (forest plot) & Heatmap khoảng trống nghiên cứu
```

Mỗi bước S1–S9 là **idempotent** và ghi trạng thái riêng vào bảng `pipeline_runs`. Khóa xử lý: `file_hash + schema_version + prompt_version`. Khi đổi prompt, hệ thống tự biết bài nào cần chạy lại từ bước nào.

---

## 3. CHIẾN LƯỢC SỬ DỤNG GEMINI API (GÓI TRẢ PHÍ)

### 3.1. Lựa chọn model
* **Model Flash mới nhất** (cấu hình qua `GEMINI_MODEL_FAST`): mặc định cho Pass 1 và Pass 2.
* **Model Pro mới nhất** (cấu hình qua `GEMINI_MODEL_STRONG`): dùng khi (a) bài có ≥ 3 Study, (b) kết quả Flash không qua bước validate hoặc tỷ lệ câu trích được kiểm chứng < 80%, (c) bài thuộc Bộ chuẩn vàng khi so sánh model.
* Tên model không viết cứng trong code; mỗi bản ghi lưu `model_name` đã dùng.

### 3.2. Kỹ thuật gọi API
* **Native PDF input** + `responseMimeType: application/json` + `responseSchema` (sinh từ Zod).
* `temperature: 0` để kết quả ổn định.
* **Trích xuất hai lượt** để tránh vượt giới hạn token đầu ra và giới hạn độ phức tạp của schema lồng sâu.
* **Context Caching:** cache PDF sau Pass 1 để Pass 2 (có thể gồm nhiều lời gọi theo từng Study) không phải gửi lại toàn bộ file.
* **Batch API:** dùng cho các lượt nạp lớn (từ vài chục bài trở lên) để giảm chi phí; lượt nhỏ / cần kết quả ngay dùng API đồng bộ.
* **Rate limiting:** token bucket theo RPM/TPM của tài khoản; exponential backoff có jitter; tuân theo `Retry-After`; tối đa N lần thử rồi chuyển `FAILED` kèm lý do.

### 3.3. Kiểm soát chi phí
* Lệnh `estimate` chạy `countTokens` cho toàn bộ hàng đợi và in chi phí dự kiến trước khi xác nhận chạy.
* Biến `GEMINI_BUDGET_LIMIT` (USD): worker dừng an toàn khi chạm trần.
* Ghi `input_tokens`, `cached_tokens`, `output_tokens`, `cost_usd` theo từng bài và từng pass vào bảng `extraction_runs`.
* Đơn giá lấy từ file cấu hình (`pricing.json`), cập nhật theo bảng giá hiện hành của Google.

### 3.4. Quyền riêng tư dữ liệu
* Theo điều khoản gói trả phí, prompt và tệp gửi lên không được dùng để cải thiện sản phẩm của Google. Cần kiểm tra lại điều khoản hiện hành khi bắt đầu dự án.
* API key chỉ nằm trong `.env` của máy chạy worker, không commit lên GitHub, không đưa lên Vercel.

---

## 4. THIẾT KẾ SCHEMA DỮ LIỆU HỌC THUẬT (DATA SCHEMA SPECIFICATION 3.0)

### 4.1. Mô hình quan hệ tổng thể

```
papers ─┬─ studies ─┬─ samples
        │           ├─ measurements ── constructs (canonical) ── construct_aliases
        │           └─ path_results ── evidence
        ├─ paper_theories ── theories
        ├─ contributions / gaps / limitations ── evidence
        └─ extraction_runs, pipeline_runs, reviews (kiểm soát chất lượng)
```

Mỗi bảng nghiệp vụ có thêm `raw_extraction JSONB` (phản hồi gốc của Gemini) để truy vết.

### 4.2. Các phân hệ thực thể

| Phân hệ | Các trường cốt lõi | Ý nghĩa học thuật |
| :--- | :--- | :--- |
| **1. Metadata & Citation** (nguồn: Crossref, không phải LLM) | `paper_id`, `doi`, `title`, `authors[]` (họ, tên, ORCID), `year`, `journal`, `volume`, `issue`, `pages`, `apa_citation`, `bibtex`, `file_hash`, `oa_status` (Unpaywall), `journal_quartile` + `quartile_year` + `subject_category` (SJR), `abs_rating`, `abdc_rating`, `retraction_status` | Nhận dạng chuẩn; xếp hạng tạp chí gắn với năm và chuyên ngành vì Q1 không phải nhãn cố định |
| **2. Phân loại bài** | `paper_type` (empirical_quant / empirical_qual / mixed / conceptual / systematic_review / meta_analysis), `corpus_source` (chuỗi tìm kiếm, CSDL, ngày tìm), `inclusion_reason` | Quyết định nhánh schema trích xuất; hỗ trợ sơ đồ PRISMA |
| **3. Khung Lý thuyết** | `theory_id` (canonical: TPB, TAM, RBV, SET, COR…), `application_role` ∈ {`mentioned`, `framing`, `hypothesis_derivation`, `tested`, `extended`}, `evidence` | Phân biệt lý thuyết được *nhắc tên* với lý thuyết *thực sự dùng để xây giả thuyết* |
| **4. Khái niệm & Đo lường** (theo từng Study) | `construct_label_original`, `canonical_construct_id`, `definition` + `evidence`, `scale_source` (tài liệu gốc), `adapted` (có/không), `n_items`, `items[]` (nguyên văn), `scale_type` (reflective / formative), `order` (first / higher-order), `alpha`, `CR`, `AVE`, `HTMT_max`, `fornell_larcker_ok` | Nhất quán định nghĩa; đánh giá chất lượng thang đo; phát hiện jingle–jangle |
| **5. Thiết kế Nghiên cứu & Study** | `study_id`, `study_label` (Study 1, 2a…), `research_design` (survey / lab exp / field exp / online exp / secondary / longitudinal panel…), `time_design` (cross-sectional / time-lagged / longitudinal), `experimental_design` (VD: 2×2 between), `manipulation_check`, `attention_check`, `exclusion_rate`, `preregistered`, `open_data`, `analysis_method` (PLS-SEM, CB-SEM, OLS, ANOVA, HLM, PROCESS…), `software` | Bao quát bài nhiều study; tín hiệu chất lượng sau khủng hoảng tái lập |
| **6. Mẫu & Bối cảnh** (theo từng Study) | `n`, `unit_of_analysis` (individual / firm / dyad / team), `sample_type` (students / MTurk / Prolific / consumer panel / employees / managers…), `country_iso[]`, `industry_code` (ISIC/NAICS), `market_type` (B2B / B2C), `data_collection_period` | Cho phép phân nhóm theo moderator bối cảnh trong Evidence Map |
| **7. Kiểm soát sai lệch** | `cmb_procedural[]`, `cmb_statistical[]` (Harman, marker variable, ULMC, CLF…), `cmb_weak_only` (cờ: chỉ dùng Harman's single-factor), `endogeneity_method[]` (IV, Heckman, Gaussian copula, 2SLS…) | Câu hỏi phản biện Q1 thường gặp trong quản trị và marketing |
| **8. Đường quan hệ được kiểm định** (đơn vị phân tích chính) | `path_id`, `study_id`, `hypothesis_code` (có thể rỗng), `iv_construct_id`, `dv_construct_id`, `mediator_ids[]`, `moderator_ids[]`, `effect_type` (direct / indirect / interaction / total / control), `estimate_type` (std β, unstd b, OR, d, η², r…), `estimate`, `se`, `ci_low`, `ci_high`, `ci_method` (bootstrap / normal), `p_value`, `p_reported_as` (VD: "< .001"), `t_or_z`, `r2_dv`, `f2`, `status` (supported / not_supported / partially / mixed / not_hypothesized), `effect_size_r` (giá trị quy đổi) + `conversion_method`, `evidence` | So sánh được giữa các bài; nền tảng cho Evidence Map và meta-analysis |
| **9. Trung gian & Điều tiết nâng cao** | Trung gian: `indirect_effect`, `boot_ci`, `mediation_type` theo Zhao, Lynch & Chen (2010) (complementary / competitive / indirect-only / direct-only / no-effect). Điều tiết: `interaction_type`, `simple_slopes[]`, `index_moderated_mediation` (Hayes) | Thay cách phân loại "full/partial" của Baron & Kenny vốn đã bị phê phán |
| **10. Đóng góp & Khoảng trống** | `contribution_type` theo Corley & Gioia (2011) (originality: incremental / revelatory; utility: scientific / practical), `theoretical_contributions[]`, `practical_implications[]`, `limitations[]`, `future_directions[]`, `gap_type` theo Miles (2017) / Müller-Bloch & Kranz (2015) (evidence / knowledge / practical-knowledge / methodological / empirical / theoretical / population), mỗi mục kèm `evidence` | Luận cứ dựa trên phân loại đã công bố, trích dẫn được trong bài viết mới |
| **11. Bằng chứng (Evidence)** | `evidence_id`, `exact_quote`, `pdf_page_index`, `printed_page`, `section` (abstract / theory / method / results / discussion), `table_or_figure` (VD: "Table 3"), `verified` (bool), `match_score`, `verification_method` | Chống hallucination; nhảy đúng trang trong trình xem PDF và trích đúng trang in theo APA |
| **12. Kiểm soát chất lượng** | `extraction_run_id`, `model_name`, `prompt_version`, `schema_version`, `extracted_at`, `confidence`, `review_status` (ai_extracted / auto_verified / human_reviewed / disputed), `reviewer`, `review_notes`, `user_reports[]` | Tái lập được; minh bạch mức độ tin cậy của từng trường |

### 4.3. Lớp Khái niệm chuẩn (Canonical Construct Ontology)
* Bảng `constructs`: `canonical_name`, `canonical_definition`, `domain` (consumer behavior, HRM, strategy…), `parent_construct_id` (cho khái niệm bậc cao).
* Bảng `construct_aliases`: mọi tên gọi gốc trong bài báo được ánh xạ về khái niệm chuẩn, kèm `mapping_method` (exact / embedding / human) và `mapping_confidence`.
* Quy trình: embedding tên + định nghĩa → gom cụm → **người duyệt xác nhận** trước khi gộp. Không tự động gộp khi độ tương đồng thấp hơn ngưỡng.
* Cảnh báo jingle–jangle: cùng tên nhưng định nghĩa khác xa; hoặc khác tên nhưng thang đo trùng item.

### 4.4. Chỉ mục & Hiệu năng (Supabase PostgreSQL)
* GIN `tsvector` cho tìm kiếm toàn văn (tiêu đề, abstract, định nghĩa, câu kết quả).
* B-tree cho các cột lọc (year, research_design, analysis_method, country_iso, theory_id, canonical_construct_id).
* `pgvector` HNSW với **`halfvec(768)`**, chỉ embed abstract, định nghĩa khái niệm và câu kết quả (~20 đoạn/bài). Ước tính 5.000 bài × 20 × 768 × 2 byte ≈ **150MB**, nằm trong giới hạn 500MB của gói Free.
* Materialized view đếm số bài theo từng facet, làm mới sau mỗi lượt `publish`.

---

## 5. KIỂM SOÁT CHẤT LƯỢNG & ĐỘ TIN CẬY (MỚI)

### 5.1. Sổ mã hóa (Codebook)
* Định nghĩa vận hành cho từng trường, danh mục giá trị cho phép, quy tắc xử lý tình huống mơ hồ, ví dụ đúng/sai.
* Codebook là đầu vào trực tiếp cho prompt Gemini và là tài liệu tham chiếu cho người mã hóa.
* Có phiên bản (`codebook_version`); mọi thay đổi ghi lại lý do.

### 5.2. Bộ chuẩn vàng (Gold Standard Set)
* 30 bài đa dạng: survey PLS-SEM, CB-SEM, thực nghiệm nhiều study, dữ liệu thứ cấp/panel, bài định tính, bài khái niệm.
* Mã hóa thủ công độc lập (lý tưởng là 2 người, tính κ giữa người với người trước).
* Dùng để: (a) đo κ / α giữa Gemini và người mã hóa, (b) chọn model, (c) **kiểm thử hồi quy** mỗi khi đổi prompt hoặc schema.

### 5.3. Quy trình kiểm chứng nhiều lớp
1. **Validate schema** (Zod): sai kiểu, thiếu trường bắt buộc → chạy lại hoặc chuyển model mạnh hơn.
2. **Validate logic:** p ∈ [0,1]; n > 0; CI chứa estimate; tổng n các nhóm ≤ n mẫu; trạng thái "supported" phải nhất quán với p và chiều tác động.
3. **Verify quotes:** fuzzy match câu trích với text layer đúng trang (cho phép lệch ±1 trang).
4. **Human review:** bắt buộc với các trường bị gắn cờ; lấy mẫu ngẫu nhiên 10% các trường đã qua kiểm chứng tự động để giám sát chất lượng liên tục.

### 5.4. Trạng thái tin cậy hiển thị cho người dùng
| Trạng thái | Ý nghĩa | Biểu tượng |
| :--- | :--- | :--- |
| `ai_extracted` | AI trích xuất, chưa kiểm chứng | ⚠ |
| `auto_verified` | Câu trích khớp với PDF, qua kiểm tra logic | ✓ |
| `human_reviewed` | Đã có người duyệt | ★ |
| `disputed` | Có báo lỗi từ người dùng, đang xem xét | ⚑ |

### 5.5. Liêm chính học thuật khi sử dụng dữ liệu
* Câu học thuật sinh tự động chỉ là **bản nháp**, luôn kèm nhắc nhở "đối chiếu với bản gốc trước khi sử dụng".
* Không sinh câu trích dẫn từ dữ liệu có trạng thái `ai_extracted` hoặc `disputed`.
* Hướng dẫn người dùng khai báo việc sử dụng công cụ AI theo chính sách của tạp chí mục tiêu.

---

## 6. QUẢN LÝ BẢN QUYỀN & CHIA SẺ PDF (MỚI)

| Tình trạng (theo Unpaywall) | Quyền truy cập PDF trên Web |
| :--- | :--- |
| Gold / Hybrid / Green OA với giấy phép mở (CC-BY…) | Công khai, tải trực tiếp |
| Bronze OA hoặc không rõ giấy phép | Chỉ link DOI / link OA gốc |
| Không phải OA | Signed URL có thời hạn, chỉ dành cho thành viên nhóm đã đăng nhập; người ngoài chỉ thấy link DOI |

* Bucket R2 để **private**; mọi truy cập đi qua API route của Next.js.
* Dữ liệu trích xuất (ma trận, đường quan hệ, câu trích ngắn kèm số trang) được công khai.
* Có trang "Chính sách nội dung" và kênh tiếp nhận yêu cầu gỡ bỏ (takedown).

---

## 7. THIẾT KẾ TRẢI NGHIỆM GIAO DIỆN HỌC THUẬT (UI/UX SPECIFICATION 3.0)

Phong cách **Tối giản học thuật (Clean Academic Deep-Work Workspace)**; giao diện song ngữ Việt/Anh (nội dung học thuật giữ nguyên tiếng Anh); đạt chuẩn tương phản **WCAG AA**; điều hướng được bằng bàn phím.

### 7.1. Thư viện lọc đa chiều (Faceted Library)
* **Ô tìm kiếm** với gợi ý tự động theo tên khái niệm chuẩn và lý thuyết; ví dụ truy vấn mẫu cho người mới.
* **Bộ lọc bên trái** (hiển thị số bài cho mỗi lựa chọn): năm, loại bài, lý thuyết nền (kèm vai trò), thiết kế nghiên cứu, phương pháp phân tích, loại mẫu, quốc gia/khu vực, ngành, B2B/B2C, xếp hạng tạp chí (SJR/ABS/ABDC), trạng thái OA, mức độ tin cậy dữ liệu.
* **Thẻ bài báo:** tác giả & năm, tạp chí + xếp hạng, loại thiết kế, số Study, huy hiệu tin cậy, nút **Copy APA**, **Xem chi tiết**, **PDF** (theo quyền), **DOI**.
* Có màn hình trống và skeleton khi tải.

### 7.2. Không gian soi bằng chứng chia đôi (Split-Screen Evidence Workspace)
* **Thanh chia kéo được** (mặc định 45/55, ghi nhớ lựa chọn của người dùng).
* **Bên trái:** trình đọc PDF (pdf.js) qua Signed URL; khi không có quyền xem PDF → hiển thị abstract + link DOI.
* **Bên phải:** thẻ dữ liệu theo tab: Tổng quan | Lý thuyết | Study & Mẫu | Đo lường | Kết quả | Đóng góp & Khoảng trống.
* **Anchor Click:** bấm vào bất kỳ trường nào → PDF nhảy đến `pdf_page_index` và **tô sáng đúng câu trích**.
* **Đồng bộ hai chiều:** bôi đen một đoạn trong PDF → hiện các trường dữ liệu trích từ đoạn đó.
* Mỗi trường có huy hiệu tin cậy và nút **Báo lỗi** (người dùng chọn loại lỗi + ghi chú).

### 7.3. Ma trận tổng hợp Master-Detail
* **Dòng chính:** Tác giả & Năm | Lý thuyết | Thiết kế & Mẫu (n, quốc gia) | Kết quả chính.
* **Dòng mở rộng:** danh sách đường quan hệ theo từng Study với estimate, CI, p, R², trạng thái, câu trích và số trang.
* Cố định cột đầu khi cuộn; cho chọn cột hiển thị; **lưu cấu hình hiển thị (saved views)**; chỉnh mật độ hiển thị.
* **Mã trạng thái luôn có biểu tượng kèm màu** (thân thiện với người mù màu):
  * Supported: ✓ Xanh ngọc dịu
  * Not supported: ✗ Xám đá (trung tính, vì kết quả bác bỏ vẫn có giá trị khoa học)
  * Partially / Mixed: ◐ Vàng hổ phách
  * Not hypothesized: ○ Viền xám
* **Copy câu học thuật (bản nháp):** chỉ khả dụng với dữ liệu `auto_verified` / `human_reviewed`.
  *Ví dụ: "Perceived ease of use positively affects intention to use (β = .35, p < .001; Nguyen et al., 2023, p. 1252)."* (số trang theo `printed_page`).
* **Xuất file:**
  * **Excel (.xlsx)** qua `exceljs`, giữ nguyên các cột đã chọn.
  * **Word (.docx)** qua thư viện `docx`, bảng chuẩn **APA 7**: số bảng in đậm, tiêu đề in nghiêng, ba đường kẻ ngang, phần *Note.* giải thích ký hiệu, font Times New Roman 12.
* Trên mobile: hiển thị dạng thẻ chỉ đọc thay cho ma trận.

### 7.4. Trang Khái niệm (MỚI)
* Định nghĩa chuẩn + toàn bộ định nghĩa gốc từ các bài (kèm trích dẫn và số trang).
* Các thang đo đã dùng: nguồn gốc, số item, nội dung item, độ tin cậy trung bình (α, CR, AVE).
* Mạng quan hệ của khái niệm: tiền tố (antecedents), hệ quả (outcomes), vai trò trung gian/điều tiết.
* Cảnh báo jingle–jangle nếu có.

### 7.5. Trang Lý thuyết (MỚI)
* Danh sách bài sử dụng, phân theo vai trò (`mentioned` → `extended`).
* Các khái niệm thường đi cùng lý thuyết; bối cảnh áp dụng phổ biến; xu hướng theo năm.

### 7.6. Evidence Map (thay cho Consensus & Conflict Engine)
* Nhập một cặp quan hệ (VD: `Perceived Risk` → `Purchase Intention`), hệ thống tự gộp các tên gọi khác qua lớp khái niệm chuẩn.
* **Forest plot thu nhỏ:** mỗi dòng là một Study với `effect_size_r` và CI, kích thước điểm theo n.
* **Phân nhóm theo moderator bối cảnh:** quốc gia, ngành, loại mẫu, thiết kế, thời gian thu thập.
* Nhãn **"kết quả không nhất quán"** chỉ dùng khi các khoảng tin cậy không chồng lấn hoặc có khác biệt chiều tác động; luôn kèm giải thích bối cảnh khác biệt.
* Cảnh báo phương pháp: "Không có ý nghĩa thống kê ≠ không có tác động; xem n và CI."
* Xuất danh sách bài và dữ liệu effect size ra CSV để phân tích meta-analysis bằng R/JASP.

### 7.7. Mạng quan hệ & Heatmap khoảng trống (MỚI)
* **Đồ thị nomological network:** nút là khái niệm, cạnh tô màu theo độ mạnh và tính nhất quán của bằng chứng.
* **Heatmap khái niệm × khái niệm** (có thể lọc theo bối cảnh): ô trống hoặc ô ít bằng chứng là khoảng trống nghiên cứu trực quan.

### 7.8. Bộ sưu tập theo dự án (giai đoạn sau)
* Người dùng đăng nhập (Supabase Auth), tạo bộ sưu tập (VD: "Chương 2 luận án"), lưu bài, ghi chú, xuất ma trận cho riêng bộ sưu tập đó.

---

## 8. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ |
| :--- | :--- |
| Ngôn ngữ | **TypeScript** toàn bộ (worker + web) |
| Schema | **Zod** → `zod-to-json-schema` (cho Gemini) + kiểu DB + kiểu Web |
| Worker | Node.js, chạy local, do Claude Code xây dựng và vận hành; CLI: `ingest`, `estimate`, `extract`, `verify`, `publish`, `rerun --since-prompt <v>` |
| Trích xuất | Gemini API (trả phí): Flash / Pro, Context Caching, Batch API |
| Text layer PDF | PyMuPDF (hoặc `pdfjs-dist`) |
| Metadata | Crossref REST API, Unpaywall API, citation-js (CSL → APA 7 / BibTeX) |
| Embedding | Gemini embedding, giảm chiều về 768, lưu `halfvec` |
| CSDL | Supabase PostgreSQL + pgvector, RLS, Supabase Auth |
| Lưu trữ PDF | Cloudflare R2 (private) + Signed URL |
| Web | Next.js App Router, Tailwind CSS, shadcn/ui, TanStack Table, react-pdf / pdf.js |
| Biểu đồ | Recharts hoặc Visx (forest plot, heatmap), Cytoscape.js (mạng quan hệ) |
| Xuất file | `docx`, `exceljs` |
| Triển khai | GitHub → Vercel; GitHub Actions (cron giữ Supabase hoạt động, kiểm thử hồi quy) |

---

## 9. LỘ TRÌNH THỰC HIỆN (ROADMAP 3.0)

### 📍 Giai đoạn 0: Nền tảng phương pháp luận (MỚI)
* **Nhiệm vụ:**
  1. Viết Codebook v1.0 cho toàn bộ phân hệ ở Mục 4.
  2. Viết `schema.ts` (Zod) v3.0 từ Codebook.
  3. Chọn 30 bài cho Bộ chuẩn vàng; mã hóa thủ công 10 bài đầu.
  4. Khởi tạo danh sách lý thuyết chuẩn và khái niệm chuẩn ban đầu cho lĩnh vực ưu tiên.
* **Kết quả bàn giao:** `codebook.md`, `schema.ts`, `gold_standard/` (10 bài đã mã hóa).

### 📍 Giai đoạn 1: Bộ máy trích xuất & Hàng đợi thông minh (Local Worker)
* **Nhiệm vụ:**
  1. Pipeline S1–S6 (ingest → metadata → text layer → Gemini 2 lượt → validate → verify quotes).
  2. Bảng trạng thái `pipeline_runs` (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `NEEDS_REVIEW`) lưu trong SQLite local (chuyển lên Supabase ở Giai đoạn 2).
  3. Rate limiter, backoff, ước tính chi phí, trần ngân sách.
  4. Lưu phiên bản model / prompt / schema và phản hồi thô.
* **Kết quả bàn giao:** chạy `npm run extract` trên thư mục mẫu, sinh JSON đã kiểm chứng + báo cáo chi phí.

### 📍 Giai đoạn 1b: Pilot & Đo độ tin cậy (MỚI, cổng chất lượng)
* **Nhiệm vụ:**
  1. Chạy trên 10 bài chuẩn vàng; tính κ / α theo từng trường, tỷ lệ câu trích được kiểm chứng.
  2. So sánh Flash và Pro về độ chính xác và chi phí.
  3. Tinh chỉnh prompt / codebook; lặp lại đến khi đạt KPI ở Mục 1.3.
  4. Hoàn thành mã hóa 20 bài chuẩn vàng còn lại và kiểm định lại.
* **Điều kiện qua cổng:** κ ≥ 0,80 với các trường phân loại chính và ≥ 95% câu trích được kiểm chứng. **Chưa đạt thì không sang Giai đoạn 2.**
* **Kết quả bàn giao:** `reliability_report.md` (có thể dùng làm nền cho một bài báo phương pháp).

### 📍 Giai đoạn 2: Thiết lập đám mây (Supabase & Cloudflare R2)
* **Nhiệm vụ:**
  1. Tạo schema PostgreSQL chuẩn hóa (Mục 4.1), index, RLS, materialized views.
  2. Tạo bucket R2 private, cấu hình CORS cho pdf.js.
  3. Hoàn thiện S7–S9 (chuẩn hóa khái niệm, upload R2, publish).
  4. Tích hợp Unpaywall để gán quyền truy cập PDF (Mục 6).
* **Kết quả bàn giao:** một lệnh đưa toàn bộ bài từ local lên cloud.

### 📍 Giai đoạn 3: Web MVP (Next.js, chạy local)
* **Nhiệm vụ:**
  1. Dựng dự án Next.js (App Router, Tailwind, shadcn/ui), dùng chung `schema.ts`.
  2. Thư viện lọc đa chiều (7.1).
  3. Không gian soi bằng chứng chia đôi với Anchor Click và tô sáng câu trích (7.2).
  4. Ma trận Master-Detail, xuất Word APA 7 / Excel (7.3).
  5. Huy hiệu tin cậy và nút Báo lỗi.
* **Kết quả bàn giao:** web chạy local với dữ liệu thật từ Supabase.

### 📍 Giai đoạn 4: GitHub & Triển khai Vercel
* **Nhiệm vụ:**
  1. Repository GitHub chỉ chứa mã nguồn (không PDF, không JSON thô, không `.env`).
  2. Liên kết Vercel, cấu hình biến môi trường (chỉ anon key Supabase và khóa R2 cho việc ký URL).
  3. GitHub Actions: cron giữ Supabase hoạt động; kiểm thử hồi quy trên Bộ chuẩn vàng khi prompt thay đổi.
  4. Đo hiệu năng thực tế (trang < 0,8 s, truy vấn lọc < 200 ms p95).

### 📍 Giai đoạn 5: Lớp tổng hợp tri thức
* **Nhiệm vụ:**
  1. Công cụ duyệt ánh xạ khái niệm chuẩn (gợi ý bằng embedding, người xác nhận).
  2. Trang Khái niệm (7.4) và Trang Lý thuyết (7.5).
  3. Quy trình vận hành "1 lệnh": thả PDF → `npm run sync` → dữ liệu hiển thị trên web.

### 📍 Giai đoạn 6: Phân tích nâng cao (khi kho có > 300 bài)
* **Nhiệm vụ:**
  1. Evidence Map với forest plot và phân nhóm theo bối cảnh (7.6).
  2. Mạng quan hệ và Heatmap khoảng trống (7.7).
  3. Tìm kiếm ngữ nghĩa (pgvector) kết hợp tìm kiếm từ khóa.
  4. Bộ sưu tập theo dự án và đăng nhập (7.8).
  5. Xuất PRISMA và dữ liệu cho meta-analysis.

### Ngoài phạm vi MVP / hoãn lại
* Tích hợp Zotero hai chiều (chỉ hỗ trợ nhập từ thư mục / file export trước).
* Tìm kiếm ngữ nghĩa trước khi có vài trăm bài.
* Evidence Map trước khi lớp khái niệm chuẩn hoạt động ổn định.

---

## 10. QUẢN TRỊ RỦI RO & BẢO TOÀN DỮ LIỆU (RISK MANAGEMENT)

| # | Rủi ro | Biện pháp |
| :--- | :--- | :--- |
| 1 | **AI trích xuất sai / bịa câu trích** | Kiểm chứng câu trích tự động; validate logic; đo κ trên Bộ chuẩn vàng; human review trường bị gắn cờ; hiển thị trạng thái tin cậy |
| 2 | **Chi phí Gemini vượt dự kiến** | Lệnh `estimate` trước khi chạy; trần ngân sách; Batch API; Context Caching; dùng Flash mặc định, Pro có điều kiện |
| 3 | **Rate-limit (429) / lỗi mạng** | Token bucket + exponential backoff có jitter; trạng thái từng bước; chạy tiếp từ bước bị dừng, không tốn lại token |
| 4 | **Đổi prompt làm giảm chất lượng** | Kiểm thử hồi quy trên Bộ chuẩn vàng; lưu `prompt_version`; chỉ chạy lại các bài bị ảnh hưởng |
| 5 | **Bản quyền PDF** | R2 private; quyền truy cập theo trạng thái OA; Signed URL có thời hạn; chính sách gỡ bỏ |
| 6 | **Tên khái niệm không thống nhất (jingle–jangle)** | Lớp khái niệm chuẩn với người duyệt; không gộp tự động dưới ngưỡng tin cậy |
| 7 | **Kết luận sai từ vote-counting** | Evidence Map dựa trên effect size + CI; cảnh báo phương pháp trên giao diện |
| 8 | **Vượt giới hạn gói Free** (Supabase 500MB, R2 10GB, tạm dừng sau 7 ngày) | Embedding chọn lọc + `halfvec`; theo dõi dung lượng; cron giữ hoạt động; sẵn phương án nâng gói |
| 9 | **Lộ API key** | `.env` local, `.gitignore`; Vercel chỉ giữ khóa tối thiểu; service key Supabase chỉ ở worker |
| 10 | **Sai số trang khi trích dẫn** | Lưu cả `pdf_page_index` và `printed_page`; APA dùng `printed_page` |
| 11 | **Liêm chính học thuật khi dùng câu sinh tự động** | Câu chỉ là bản nháp; chặn sinh câu từ dữ liệu chưa kiểm chứng; hướng dẫn khai báo dùng AI |
| 12 | **Phạm vi quá rộng cho một người** | Cổng chất lượng ở Giai đoạn 1b; MVP rõ ràng; hoãn tính năng phân tích nâng cao đến khi có đủ dữ liệu |

---

## 11. TÀI LIỆU THAM KHẢO PHƯƠNG PHÁP LUẬN (dùng cho Codebook)

* Corley, K. G., & Gioia, D. A. (2011). Building theory about theory building: What constitutes a theoretical contribution? *Academy of Management Review, 36*(1), 12–32.
* Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. *Journal of the Academy of Marketing Science, 43*(1), 115–135.
* Miles, D. A. (2017). A taxonomy of research gaps: Identifying and defining the seven research gaps. *Doctoral Student Workshop: Finding Research Gaps – Research Methods and Strategies*.
* Müller-Bloch, C., & Kranz, J. (2015). A framework for rigorously identifying research gaps in qualitative literature reviews. *Proceedings of the 36th International Conference on Information Systems (ICIS)*.
* Podsakoff, P. M., MacKenzie, S. B., Lee, J.-Y., & Podsakoff, N. P. (2003). Common method biases in behavioral research. *Journal of Applied Psychology, 88*(5), 879–903.
* Podsakoff, P. M., MacKenzie, S. B., & Podsakoff, N. P. (2012). Sources of method bias in social science research and recommendations on how to control it. *Annual Review of Psychology, 63*, 539–569.
* Zhao, X., Lynch, J. G., & Chen, Q. (2010). Reconsidering Baron and Kenny: Myths and truths about mediation analysis. *Journal of Consumer Research, 37*(2), 197–206.

*(Cần kiểm chứng lại thông tin trích dẫn bằng DOI trước khi đưa vào Codebook chính thức.)*
