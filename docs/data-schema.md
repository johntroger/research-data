# Schema dữ liệu

> Tài liệu này tách từ `PROJECT_PLAN.md` (v3.9) ở bước 0.9. Số mục giữ nguyên như kế hoạch gốc,
> nên mọi tham chiếu dạng "Mục x.y" trong dự án vẫn đúng. Mục lục chung: [PROJECT_PLAN.md](../PROJECT_PLAN.md#mục-lục-tài-liệu).

## 5. THIẾT KẾ SCHEMA DỮ LIỆU HỌC THUẬT (DATA SCHEMA SPECIFICATION 3.3)

### 5.1. Mô hình quan hệ tổng thể

```
papers ─┬─ studies ─┬─ samples
        │           ├─ measurements ── constructs (canonical) ── construct_aliases
        │           ├─ path_results ── evidence
        │           ├─ correlation_matrices ── matrix_cells / descriptives
        │           └─ condition_cells (thực nghiệm: M, SD, n theo điều kiện)
        ├─ paper_theories ── theories
        ├─ contributions / gaps / limitations ── evidence
        ├─ zotero_annotations (bằng chứng do người tạo)
        └─ extraction_runs, pipeline_runs, reviews, review_changes (kiểm soát chất lượng)
```

Mỗi bảng nghiệp vụ có `raw_extraction JSONB` để truy vết. Mỗi trường trong [Codebook](codebook.md) được gán **tầng T1 / T2 / T3** (Mục 1.4); định nghĩa vận hành từng trường nằm trong Codebook.

### 5.2. Các phân hệ thực thể

| Phân hệ | Các trường cốt lõi | Ý nghĩa học thuật |
| :--- | :--- | :--- |
| **1. Metadata & Citation** (nguồn: Crossref → Zotero, không phải LLM) | `paper_id`, `doi`, `title`, `authors[]` (họ, tên, ORCID), `year`, `journal`, `volume`, `issue`, `pages`, `apa_citation`, `bibtex`, `citekey` (Better BibTeX), `file_hash`, `zotero_*`, `oa_status`, `journal_quartile` + `quartile_year` + `subject_category` (SJR), `abs_rating`, `abdc_rating`, `indexed_in` (Scopus / WoS / không), `journal_quality_flag` (cảnh báo khi tạp chí không có trong Scopus/SJR hoặc ABDC), `license_source` (oa / institution_subscription / personal_purchase / other), `retraction_status` + `retraction_checked_at` (kiểm tra lại hằng tháng) | Nhận dạng chuẩn; xếp hạng tạp chí gắn với năm và chuyên ngành; phát hiện tạp chí kém chất lượng và bài bị rút |
| **2. Phân loại bài** | `paper_type` (empirical_quant / empirical_qual / mixed / conceptual / narrative_review / systematic_review / meta_analysis / other), `research_domain`, `corpus_source` (Zotero collection, chuỗi tìm kiếm, CSDL, ngày), `screening_decision` + `exclusion_reason` | Quyết định nhánh trích xuất; hỗ trợ PRISMA 2020 |
| **3. Khung Lý thuyết** *(T3)* | `theory_id` (canonical), `application_role` ∈ {`mentioned`, `framing`, `hypothesis_derivation`, `tested`, `extended`}, `evidence` | Phân biệt lý thuyết *được nhắc tên* với lý thuyết *thực sự dùng để xây giả thuyết* |
| **4. Khái niệm & Đo lường** (theo Study) | `construct_label_original` (T1), `canonical_construct_id` (T3), `definition` + `evidence` (T1), `scale_source`, `adapted`, `n_items`, `items[]`, `scale_type` (reflective / formative, T2), `order` (first / higher-order), `alpha`, `CR`, `AVE`, `HTMT_max` (T1) | Nhất quán định nghĩa; chất lượng thang đo; phát hiện jingle–jangle theo item (Larsen & Bong, 2016) |
| **5. Thiết kế Nghiên cứu & Study** *(T2)* | `study_id`, `study_label`, `research_design`, `time_design`, `experimental_design`, `manipulation_check`, `attention_check`, `exclusion_rate`, `preregistered`, `open_data`, `analysis_method`, `software` | Bao quát bài nhiều study; tín hiệu chất lượng sau khủng hoảng tái lập |
| **6. Mẫu & Bối cảnh** (theo Study) | `n` (T1), `unit_of_analysis`, `sample_type` (T2), `country_iso[]` (T1), `industry_code`, `market_type`, `data_collection_period` | Phục vụ phân nhóm **mô tả** theo bối cảnh |
| **7. Kiểm soát sai lệch** *(T2)* | `cmb_procedural[]`, `cmb_statistical[]`, `cmb_weak_only` (chỉ dùng Harman's single-factor), `endogeneity_method[]` | Câu hỏi phản biện Q1 thường gặp |
| **8. Đường quan hệ được kiểm định** (đơn vị phân tích chính) | `path_id`, `study_id`, `hypothesis_code`, `iv_construct_id`, `dv_construct_id`, `mediator_ids[]`, `moderator_ids[]`, `effect_type` (T2), `estimate_type` (std β / unstd b / path coefficient / OR / d / η² / r…), `estimate`, `se`, `ci_low`, `ci_high`, `ci_method`, `p_value`, `p_reported_as`, `t_or_z`, `r2_dv`, `f2` (T1), `status` (T2), `hypothesized_direction` (+ / − / không định hướng, T1), `observed_sign` (+ / −, T1), `significant` (theo ngưỡng tác giả dùng, T1), `model_covariates[]`, `comparability_note`, `evidence` | Lưu đúng như tác giả báo cáo; **không quy đổi β thành r**; ghi các biến khác có trong mô hình để người dùng hiểu giới hạn so sánh |
| **9. Trung gian & Điều tiết** | Trung gian: `indirect_effect`, `boot_ci`, `mediation_type` theo Zhao, Lynch & Chen (2010). Điều tiết: `interaction_type`, `simple_slopes[]`, `index_moderated_mediation` (Hayes) | Thay phân loại "full/partial" của Baron & Kenny |
| **10. Ma trận tương quan & Thống kê mô tả** (MỚI, T1) | `matrix_id`, `study_id`, `n`, `variables[]` (thứ tự + `construct_id`), `cells[]` (i, j, r), `diagonal_type` (1 / √AVE / α / trống), `descriptives[]` (M, SD, α, CR, AVE theo biến), `correlation_type` (Pearson / latent / polychoric), `source_table`, `pdf_page_index`, `printed_page`, `internal_check` (đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE) | Dữ liệu chuẩn cho meta-analysis và **MASEM**; nguồn duy nhất của trục r trong Evidence Map |
| **10b. Ô điều kiện thực nghiệm** (MỚI, T1) | `cell_id`, `study_id`, `factors[]` (VD: disclosure = có / không; source = influencer / brand), `condition_label`, `dv_construct_id`, `mean`, `sd`, `n`, `se`, `test_stat` (F / t), `df`, `p_value`, `effect_size_reported` (η², ω², d) + `effect_size_type`, `source_table`, `pdf_page_index`, `printed_page`, `evidence` | Bài thực nghiệm (rất phổ biến ở mảng đạo đức và social media, VD: công bố tài trợ của influencer) báo cáo M / SD / n theo điều kiện thay vì β; từ đây tính được Cohen's d chuẩn cho meta-analysis |
| **11. Đóng góp & Khoảng trống** *(T3)* | `contribution_type` theo Corley & Gioia (2011), `theoretical_contributions[]`, `practical_implications[]`, `limitations[]`, `future_directions[]`, `gap_type` theo Müller-Bloch & Kranz (2015), `problematization_hint` theo Alvesson & Sandberg (2011) (giả định nền nào của dòng nghiên cứu có thể bị thách thức), mỗi mục kèm `evidence` | Gợi ý cả *gap-spotting* lẫn *problematization* |
| **12. Bằng chứng (Evidence)** | `evidence_id`, `field_ref`, `exact_quote` (≤ 50 từ khi hiển thị công khai), `pdf_page_index`, `printed_page`, `printed_page_method`, `section`, `table_or_figure`, `table_cell` (hàng, cột), `verified`, `verification_method`, `match_score`, `source` (ai / zotero_annotation / human) | Chống hallucination; nhảy đúng trang; trích đúng trang in theo APA |
| **13. Kiểm soát chất lượng** | `extraction_run_id`, `model_name`, `prompt_version`, `schema_version`, `codebook_version`, `extracted_at`, `badge` (auto_verified / needs_attention / ai_interpreted / hidden / human_reviewed / disputed, Mục 6.5), `check_results` (JSON: kết quả từng kiểm tra, dùng cho bảng "Vì sao ✓"), `natural_key`, `completeness_status` (complete / incomplete) + `missing_items[]`, `stat_consistency` (consistent / inconsistent / decision_error / not_checked) + `recomputed_value` + `error_source` (extraction / original_paper), `locked` (true khi đã sửa tay), `user_reports[]`; bảng **`review_changes`** lưu mỗi lần sửa tay: `natural_key`, trường, **giá trị trước**, **giá trị sau**, thời điểm, lý do | Tái lập được; dữ liệu cho bảng "Vì sao ✓"; giữ chỗ đã sửa khi trích xuất lại |

### 5.3. Lớp Khái niệm chuẩn (Canonical Construct Ontology)
* Bảng `constructs`: `canonical_name`, `canonical_definition`, `domain`, `parent_construct_id`.
* Bảng `construct_aliases`: tên gốc ánh xạ về khái niệm chuẩn, kèm `mapping_method` (exact / embedding / item_similarity / human) và `mapping_confidence`.
* Quy trình tự động: (1) trùng tên gần như tuyệt đối, hoặc định nghĩa và item thang đo rất giống (embedding + độ tương đồng item, Larsen & Bong, 2016) → gộp; (2) còn lại → **tách riêng**, không gộp. Nguyên tắc **"không chắc thì tách"**: tách nhầm thì vô hại và dễ thấy khi tìm kiếm; gộp nhầm thì làm sai kết quả mà khó phát hiện. Chủ dự án có thể gộp / tách lại trên web nếu muốn (tùy chọn).
* Xây dựng trước cho **miền khởi đầu** (Mục 1.3), mở rộng dần theo miền.
* Cảnh báo jingle–jangle: cùng tên nhưng định nghĩa / item khác xa; khác tên nhưng item trùng lặp.

### 5.4. Chỉ mục & Hiệu năng (Supabase PostgreSQL)
* GIN `tsvector` cho tìm kiếm toàn văn; B-tree cho các cột lọc.
* `pgvector` HNSW với **`halfvec(768)`**, chỉ embed abstract, định nghĩa khái niệm và câu kết quả (~20 đoạn/bài), ước tính ≈ 150MB cho 5.000 bài.
* Materialized view đếm số bài theo facet, làm mới sau mỗi lượt `publish`.
* **Materialized view `relation_index`** phục vụ Relationship Search (8.2b): mỗi dòng là một kiểm định với `iv_canonical_id`, `dv_canonical_id`, `iv_alias_id`, `dv_alias_id`, `mapping_reviewed`, `role` (direct / mediated / moderated), `mediator_ids[]`, `moderator_ids[]`, `paper_id`, `study_id`, `status`, `observed_sign`, `significant`, `estimate_type`, `badge`. Index B-tree tổng hợp trên `(iv_canonical_id, dv_canonical_id)` và `(dv_canonical_id, iv_canonical_id)` để truy vấn hai chiều; mục tiêu < 200 ms (p95).
* **Migrations SQL** (thư mục `supabase/migrations`) đi kèm mỗi lần đổi `schema_version`.
