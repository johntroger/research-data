-- Bước 1.1: các bảng nghiệp vụ đầy đủ theo Mục 5.1–5.3 (docs/data-schema.md) và Codebook v1.0.1.
--
-- Quy ước chung cho bảng nghiệp vụ (studies, measurements, path_results…):
--   * natural_key: khóa tự nhiên ổn định trong một bài (Mục 6.7), duy nhất theo (paper_id, natural_key);
--   * badge: huy hiệu của giá trị chính trong dòng; dòng 'hidden' không hiện cho khách (RLS);
--     huy hiệu từng trường vẫn nằm ở extracted_fields;
--   * locked: true khi chủ dự án đã sửa tay, trích xuất lại không được ghi đè;
--   * raw_extraction: phần JSON AI trả về cho dòng này, để truy vết (Mục 5.1).
-- Giá trị cho phép của các cột phân loại lấy đúng từ packages/schema/src/enums.ts;
-- test tích hợp so khớp từng ràng buộc CHECK với danh sách Zod.

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 1, 2, 11: metadata, phân loại bài, đóng góp & khoảng trống (trên bảng papers)
-- ─────────────────────────────────────────────────────────────────────────────

alter table papers
  add column authors               jsonb not null default '[]'::jsonb,  -- [{family, given, orcid}]
  add column year                  integer check (year between 1900 and 2100),
  add column journal               text,
  add column volume                text,
  add column issue                 text,
  add column pages                 text,
  add column apa_citation          text,
  add column bibtex                text,
  add column citekey               text,
  add column zotero_item_key       text unique,
  add column zotero_attachment_key text,
  add column zotero_version        integer,
  add column oa_status             text check (oa_status in ('gold', 'green', 'hybrid', 'bronze', 'closed', 'unknown')),
  add column license_source        text check (license_source in ('oa', 'institution_subscription', 'personal_purchase', 'other')),
  add column journal_quartile      text check (journal_quartile in ('Q1', 'Q2', 'Q3', 'Q4')),
  add column quartile_year         integer,
  add column subject_category      text,
  add column abs_rating            text,
  add column abdc_rating           text,
  add column indexed_in            text[] not null default '{}',
  add column journal_quality_flag  boolean,
  add column retraction_status     text check (retraction_status in ('none', 'retracted', 'corrected', 'expression_of_concern', 'unknown')),
  add column retraction_checked_at timestamptz,
  add column paper_type            text check (paper_type in ('empirical_quant', 'empirical_qual', 'mixed', 'conceptual', 'narrative_review', 'systematic_review', 'meta_analysis', 'other')),
  add column research_domain       text,
  add column corpus_source         jsonb,
  add column screening_decision    text check (screening_decision in ('included', 'excluded', 'pending')),
  add column exclusion_reason      text,
  add column hypothesis_codes      text[] not null default '{}',
  add column contribution_originality text check (contribution_originality in ('incremental', 'revelatory')),
  add column contribution_utility  text check (contribution_utility in ('scientific', 'practical', 'both')),
  add column gap_type              text check (gap_type in ('evidence', 'knowledge', 'practical_knowledge', 'methodological', 'empirical', 'theoretical', 'population')),
  add column problematization_hint text,
  add column completeness_status   text check (completeness_status in ('complete', 'incomplete')),
  add column missing_items         text[] not null default '{}',
  add column updated_at            timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 12: bằng chứng
-- ─────────────────────────────────────────────────────────────────────────────

create table evidence (
  id                   uuid primary key default gen_random_uuid(),
  paper_id             uuid not null references papers (id) on delete cascade,
  exact_quote          text not null,
  pdf_page_index       integer not null check (pdf_page_index >= 0),
  printed_page         text,
  printed_page_method  text check (printed_page_method in ('page_labels', 'header_footer', 'crossref_offset', 'pdf_index')),
  section              text check (section in ('abstract', 'introduction', 'theory', 'method', 'results', 'discussion', 'appendix', 'other')),
  table_or_figure      text,
  table_cell           jsonb,                                   -- {row, column}
  verified             boolean,
  verification_method  text,                                    -- exact / fuzzy / neighbour_page / numbers_on_page…
  match_score          numeric(4, 3) check (match_score between 0 and 1),
  source               text not null default 'ai' check (source in ('ai', 'zotero_annotation', 'human')),
  hidden               boolean not null default false,          -- câu trích không khớp PDF: không hiện cho khách
  created_at           timestamptz not null default now()
);
create index evidence_paper_idx on evidence (paper_id);

alter table papers
  add column paper_type_evidence_id uuid references evidence (id) on delete set null,
  add column gap_evidence_id        uuid references evidence (id) on delete set null;

-- Câu đóng góp lý thuyết / hàm ý thực tiễn / hạn chế / hướng nghiên cứu (Phân hệ 11)
create table paper_statements (
  id                 uuid primary key default gen_random_uuid(),
  paper_id           uuid not null references papers (id) on delete cascade,
  natural_key        text not null,
  kind               text not null check (kind in ('theoretical_contribution', 'practical_implication', 'limitation', 'future_direction')),
  position           integer not null default 0,
  evidence_id        uuid not null references evidence (id) on delete cascade,
  extraction_run_id  uuid references extraction_runs (id) on delete set null,
  badge              badge not null default 'ai_interpreted',
  locked             boolean not null default false,
  raw_extraction     jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (paper_id, natural_key)
);

-- Danh sách bảng trong bài (Pass 1), dùng để kiểm tra độ đầy đủ
create table paper_tables (
  id              uuid primary key default gen_random_uuid(),
  paper_id        uuid not null references papers (id) on delete cascade,
  table_label     text not null,
  pdf_page_index  integer not null check (pdf_page_index >= 0),
  kind            text not null check (kind in ('results', 'correlation', 'descriptives', 'measurement', 'condition_means', 'hypotheses_summary', 'other')),
  study_label     text,
  unique (paper_id, table_label)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Mục 5.3: lý thuyết và khái niệm chuẩn (nạp từ supabase/seed.sql, sinh từ packages/schema)
-- ─────────────────────────────────────────────────────────────────────────────

create table theories (
  id              text primary key,
  canonical_name  text not null unique,
  aliases         text[] not null default '{}',
  summary         text not null,
  key_sources     text[] not null default '{}',
  origin          text not null check (origin in ('plan_1_3', 'added')),
  created_at      timestamptz not null default now()
);

create table constructs (
  id                    text primary key,
  canonical_name        text not null unique,
  canonical_definition  text not null,
  definition_source     text not null,
  domain                text not null check (domain in ('social_media', 'branding', 'ethics', 'consumer_behavior')),
  parent_construct_id   text references constructs (id) on delete set null,
  origin                text not null check (origin in ('plan_1_3', 'added')),
  created_at            timestamptz not null default now(),
  check (parent_construct_id is distinct from id)
);

create table construct_aliases (
  id                  uuid primary key default gen_random_uuid(),
  alias               text not null,
  alias_key           text not null,                  -- canonicalKey(alias): dùng để khớp nhãn của tác giả
  construct_id        text not null references constructs (id) on delete cascade,
  mapping_method      text not null check (mapping_method in ('exact', 'embedding', 'item_similarity', 'human')),
  mapping_confidence  numeric(4, 3) not null check (mapping_confidence between 0 and 1),
  mapping_reviewed    boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (alias_key, construct_id)
);
create index construct_aliases_key_idx on construct_aliases (alias_key);

-- Phân hệ 3: lý thuyết được dùng trong bài
create table paper_theories (
  id                    uuid primary key default gen_random_uuid(),
  paper_id              uuid not null references papers (id) on delete cascade,
  natural_key           text not null,
  theory_name_original  text not null,
  theory_id             text references theories (id) on delete set null,   -- null khi chưa ánh xạ
  application_role      text not null check (application_role in ('mentioned', 'framing', 'hypothesis_derivation', 'tested', 'extended')),
  evidence_id           uuid references evidence (id) on delete set null,
  extraction_run_id     uuid references extraction_runs (id) on delete set null,
  badge                 badge not null default 'ai_interpreted',
  locked                boolean not null default false,
  raw_extraction        jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (paper_id, natural_key)
);
create index paper_theories_theory_idx on paper_theories (theory_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 5, 6, 7: Study, mẫu, kiểm soát sai lệch
-- ─────────────────────────────────────────────────────────────────────────────

create table studies (
  id                   uuid primary key default gen_random_uuid(),
  paper_id             uuid not null references papers (id) on delete cascade,
  natural_key          text not null,
  study_label          text not null,
  position             integer not null default 0,
  research_design      text check (research_design in ('survey', 'lab_experiment', 'online_experiment', 'field_experiment', 'secondary_data', 'longitudinal_panel', 'qualitative', 'other')),
  design_evidence_id   uuid references evidence (id) on delete set null,
  time_design          text check (time_design in ('cross_sectional', 'time_lagged', 'longitudinal')),
  experimental_design  text,
  manipulation_check   text check (manipulation_check in ('passed', 'failed', 'not_reported')),
  attention_check      boolean,
  exclusion_rate       numeric check (exclusion_rate between 0 and 1),
  preregistered        boolean,
  open_data            boolean,
  analysis_method      text[] not null default '{}' check (analysis_method <@ array['pls_sem', 'cb_sem', 'regression', 'anova_ancova', 'process_mediation', 't_test', 'hlm_multilevel', 'fsqca', 'content_analysis', 'other']),
  software             text,
  method_evidence_id   uuid references evidence (id) on delete set null,
  cmb_procedural       text[] not null default '{}' check (cmb_procedural <@ array['anonymity', 'separated_measurement', 'counterbalancing', 'reverse_items', 'different_scale_formats', 'other']),
  cmb_statistical      text[] not null default '{}' check (cmb_statistical <@ array['harman', 'marker_variable', 'ulmc', 'clf', 'full_collinearity_vif', 'other']),
  cmb_weak_only        boolean,
  endogeneity_method   text[] not null default '{}' check (endogeneity_method <@ array['instrumental_variable', 'heckman', 'gaussian_copula', 'two_sls', 'control_function', 'none_reported']),
  bias_evidence_id     uuid references evidence (id) on delete set null,
  extraction_run_id    uuid references extraction_runs (id) on delete set null,
  badge                badge not null default 'needs_attention',
  locked               boolean not null default false,
  raw_extraction       jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (paper_id, natural_key),
  unique (paper_id, study_label)
);

create table samples (
  id                      uuid primary key default gen_random_uuid(),
  study_id                uuid not null unique references studies (id) on delete cascade,
  paper_id                uuid not null references papers (id) on delete cascade,
  natural_key             text not null,
  n                       integer check (n > 0),
  n_evidence_id           uuid references evidence (id) on delete set null,
  unit_of_analysis        text check (unit_of_analysis in ('individual', 'firm', 'dyad', 'team', 'brand', 'post', 'other')),
  sample_type             text check (sample_type in ('students', 'mturk', 'prolific', 'consumer_panel', 'online_convenience', 'employees', 'managers', 'social_media_users', 'secondary', 'other')),
  country_iso             text[] not null default '{}',
  industry_code           text,
  market_type             text check (market_type in ('b2c', 'b2b', 'c2c')),
  data_collection_period  text,
  evidence_id             uuid references evidence (id) on delete set null,
  extraction_run_id       uuid references extraction_runs (id) on delete set null,
  badge                   badge not null default 'needs_attention',
  locked                  boolean not null default false,
  raw_extraction          jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (paper_id, natural_key),
  check (array_to_string(country_iso, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$')   -- ISO 3166-1 alpha-2
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 4: khái niệm & đo lường
-- ─────────────────────────────────────────────────────────────────────────────

create table measurements (
  id                        uuid primary key default gen_random_uuid(),
  study_id                  uuid not null references studies (id) on delete cascade,
  paper_id                  uuid not null references papers (id) on delete cascade,
  natural_key               text not null,
  construct_label_original  text not null,
  canonical_construct_id    text references constructs (id) on delete set null,   -- hệ thống gán (Mục 5.3)
  alias_id                  uuid references construct_aliases (id) on delete set null,
  definition                text,
  definition_evidence_id    uuid references evidence (id) on delete set null,
  scale_source              text,
  adapted                   boolean,
  n_items                   integer check (n_items > 0),
  items                     text[] not null default '{}',
  scale_type                text check (scale_type in ('reflective', 'formative')),
  construct_order           text check (construct_order in ('first', 'higher')),
  parent_label_original     text,
  alpha                     numeric,
  cr                        numeric,
  ave                       numeric,
  htmt_max                  numeric,
  reliability_evidence_id   uuid references evidence (id) on delete set null,
  extraction_run_id         uuid references extraction_runs (id) on delete set null,
  badge                     badge not null default 'needs_attention',
  locked                    boolean not null default false,
  raw_extraction            jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (paper_id, natural_key)
);
create index measurements_construct_idx on measurements (canonical_construct_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 8, 9: đường quan hệ được kiểm định, trung gian, điều tiết
-- ─────────────────────────────────────────────────────────────────────────────

create table path_results (
  id                         uuid primary key default gen_random_uuid(),
  study_id                   uuid not null references studies (id) on delete cascade,
  paper_id                   uuid not null references papers (id) on delete cascade,
  natural_key                text not null,
  hypothesis_code            text,
  iv_label_original          text not null,
  dv_label_original          text not null,
  iv_construct_id            text references constructs (id) on delete set null,
  dv_construct_id            text references constructs (id) on delete set null,
  mediator_labels            text[] not null default '{}',
  moderator_labels           text[] not null default '{}',
  mediator_ids               text[] not null default '{}',
  moderator_ids              text[] not null default '{}',
  effect_type                text not null check (effect_type in ('direct', 'indirect', 'interaction', 'total', 'control')),
  estimate_type              text check (estimate_type in ('std_beta', 'unstd_b', 'path_coefficient', 'r', 'd', 'odds_ratio', 'eta_squared', 'other')),
  estimate                   numeric,
  se                         numeric,
  ci_low                     numeric,
  ci_high                    numeric,
  ci_method                  text check (ci_method in ('bootstrap', 'normal', 'other')),
  p_value                    numeric check (p_value between 0 and 1),
  p_reported_as              text,
  t_or_z                     numeric,
  r2_dv                      numeric,
  f2                         numeric,
  status                     text not null check (status in ('supported', 'not_supported', 'partially_supported', 'mixed', 'not_hypothesized')),
  hypothesized_direction     text check (hypothesized_direction in ('positive', 'negative', 'non_directional')),
  observed_sign              text check (observed_sign in ('positive', 'negative')),
  significant                boolean,
  model_covariates           text[] not null default '{}',
  comparability_note         text,
  indirect_effect            numeric,
  boot_ci_low                numeric,
  boot_ci_high               numeric,
  mediation_type             text check (mediation_type in ('complementary', 'competitive', 'indirect_only', 'direct_only', 'no_effect')),
  interaction_type           text check (interaction_type in ('two_way', 'three_way', 'moderated_mediation')),
  simple_slopes              jsonb not null default '[]'::jsonb,   -- [{level, estimate, p_reported_as}]
  index_moderated_mediation  numeric,
  stat_consistency           text not null default 'not_checked' check (stat_consistency in ('consistent', 'inconsistent', 'decision_error', 'not_checked')),
  recomputed_value           numeric,
  error_source               text check (error_source in ('extraction', 'original_paper')),
  evidence_id                uuid references evidence (id) on delete set null,
  extraction_run_id          uuid references extraction_runs (id) on delete set null,
  badge                      badge not null default 'needs_attention',
  locked                     boolean not null default false,
  raw_extraction             jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (paper_id, natural_key),
  check (ci_low is null or ci_high is null or ci_low <= ci_high),
  check (boot_ci_low is null or boot_ci_high is null or boot_ci_low <= boot_ci_high)
);
-- Relationship Search (Mục 8.2b) tra theo cặp biến, hai chiều
create index path_results_iv_dv_idx on path_results (iv_construct_id, dv_construct_id);
create index path_results_dv_iv_idx on path_results (dv_construct_id, iv_construct_id);
create index path_results_study_idx on path_results (study_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 10, 10b: ma trận tương quan, thống kê mô tả, ô điều kiện thực nghiệm
-- ─────────────────────────────────────────────────────────────────────────────

create table correlation_matrices (
  id                 uuid primary key default gen_random_uuid(),
  study_id           uuid not null references studies (id) on delete cascade,
  paper_id           uuid not null references papers (id) on delete cascade,
  natural_key        text not null,
  source_table       text not null,
  n                  integer check (n > 0),
  variables          jsonb not null default '[]'::jsonb,   -- [{name, construct_id}] theo thứ tự in
  diagonal_type      text not null check (diagonal_type in ('one', 'sqrt_ave', 'alpha', 'empty')),
  correlation_type   text not null check (correlation_type in ('pearson', 'latent', 'polychoric', 'unknown')),
  internal_check     jsonb not null default '{}'::jsonb,   -- đối xứng, r ∈ [−1, 1], đường chéo khớp √AVE
  evidence_id        uuid references evidence (id) on delete set null,
  extraction_run_id  uuid references extraction_runs (id) on delete set null,
  badge              badge not null default 'needs_attention',
  locked             boolean not null default false,
  raw_extraction     jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (paper_id, natural_key)
);

create table matrix_cells (
  matrix_id  uuid not null references correlation_matrices (id) on delete cascade,
  i          integer not null check (i >= 0),
  j          integer not null check (j >= 0),
  r          numeric not null check (r between -1 and 1),
  primary key (matrix_id, i, j),
  check (i > j)                                           -- chỉ tam giác dưới
);

create table matrix_descriptives (
  matrix_id       uuid not null references correlation_matrices (id) on delete cascade,
  variable_index  integer not null check (variable_index >= 0),
  variable        text not null,
  mean            numeric,
  sd              numeric check (sd >= 0),
  alpha           numeric,
  cr              numeric,
  ave             numeric,
  primary key (matrix_id, variable_index)
);

create table condition_cells (
  id                    uuid primary key default gen_random_uuid(),
  study_id              uuid not null references studies (id) on delete cascade,
  paper_id              uuid not null references papers (id) on delete cascade,
  natural_key           text not null,
  factors               jsonb not null default '[]'::jsonb,   -- [{factor, level}]
  condition_label       text not null,
  dv_label_original     text not null,
  dv_construct_id       text references constructs (id) on delete set null,
  mean                  numeric,
  sd                    numeric check (sd >= 0),
  se                    numeric check (se >= 0),
  n                     integer check (n > 0),
  test_stat_type        text check (test_stat_type in ('F', 't')),
  test_stat_value       numeric,
  df                    numeric[] not null default '{}',
  p_value               numeric check (p_value between 0 and 1),
  p_reported_as         text,
  effect_size_reported  numeric,
  effect_size_type      text check (effect_size_type in ('eta_squared', 'partial_eta_squared', 'omega_squared', 'd', 'other')),
  source_table          text,
  evidence_id           uuid references evidence (id) on delete set null,
  extraction_run_id     uuid references extraction_runs (id) on delete set null,
  badge                 badge not null default 'needs_attention',
  locked                boolean not null default false,
  raw_extraction        jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (paper_id, natural_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Ghi chú Zotero (bằng chứng do người tạo) — riêng tư
-- ─────────────────────────────────────────────────────────────────────────────

create table zotero_annotations (
  id               uuid primary key default gen_random_uuid(),
  paper_id         uuid not null references papers (id) on delete cascade,
  zotero_key       text not null unique,
  annotation_text  text,
  comment          text,
  pdf_page_index   integer check (pdf_page_index >= 0),
  color            text,
  zotero_version   integer,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phân hệ 13: kiểm soát chất lượng
-- ─────────────────────────────────────────────────────────────────────────────

alter table extraction_runs
  add column codebook_version  text,
  add column pass              text,                -- structure / discussion / study_part…
  add column cached_tokens     integer,
  add column batch             boolean not null default false,
  add column status            text not null default 'done' check (status in ('pending', 'running', 'done', 'failed'));

-- Trạng thái từng bước S1–S11 của mỗi bài (Mục 2, idempotent)
create table pipeline_runs (
  id              uuid primary key default gen_random_uuid(),
  paper_id        uuid references papers (id) on delete cascade,   -- null trước khi tạo bài (S1–S2)
  file_hash       text,
  zotero_item_key text,
  processing_key  text not null,   -- file_hash + schema_version + codebook_version + prompt_version
  step            text not null check (step in ('S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11')),
  status          text not null check (status in ('pending', 'running', 'done', 'failed', 'skipped')),
  attempts        integer not null default 0,
  error           text,
  details         jsonb not null default '{}'::jsonb,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (processing_key, step)
);
create index pipeline_runs_paper_idx on pipeline_runs (paper_id);

-- Lịch sử sửa tay (Mục 6.7): giá trị trước / sau, hoàn tác được
create table review_changes (
  id            uuid primary key default gen_random_uuid(),
  paper_id      uuid not null references papers (id) on delete cascade,
  natural_key   text not null,
  field_name    text not null,
  value_before  jsonb,
  value_after   jsonb,
  reason        text,
  changed_by    text not null default 'owner',
  changed_at    timestamptz not null default now()
);
create index review_changes_paper_idx on review_changes (paper_id, natural_key);

-- Báo lỗi của người dùng (ghi qua API có Turnstile ở Giai đoạn 3b, không ghi trực tiếp)
create table user_reports (
  id           uuid primary key default gen_random_uuid(),
  paper_id     uuid not null references papers (id) on delete cascade,
  natural_key  text,
  message      text not null,
  status       text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: khách chỉ đọc dữ liệu công khai, không đọc dòng bị ẩn; chỉ service role được ghi.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  -- Bảng công khai có cột badge: ẩn dòng 'hidden'
  foreach t in array array['paper_statements', 'paper_theories', 'studies', 'samples', 'measurements',
                           'path_results', 'correlation_matrices', 'condition_cells'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read visible rows" on %I for select to anon, authenticated using (badge <> %L)', t, 'hidden');
  end loop;

  -- Bảng công khai không có huy hiệu
  foreach t in array array['paper_tables', 'theories', 'constructs', 'construct_aliases'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
  end loop;

  -- Bảng riêng tư: bật RLS, không có policy → khách không đọc, không ghi được
  foreach t in array array['zotero_annotations', 'pipeline_runs', 'review_changes', 'user_reports'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end
$$;

alter table evidence enable row level security;
create policy "public read visible evidence" on evidence for select to anon, authenticated using (not hidden);

-- Ô ma trận và thống kê mô tả theo quyền của ma trận chứa nó
alter table matrix_cells enable row level security;
alter table matrix_descriptives enable row level security;
create policy "public read cells of visible matrices" on matrix_cells for select to anon, authenticated
  using (exists (select 1 from correlation_matrices m where m.id = matrix_id and m.badge <> 'hidden'));
create policy "public read descriptives of visible matrices" on matrix_descriptives for select to anon, authenticated
  using (exists (select 1 from correlation_matrices m where m.id = matrix_id and m.badge <> 'hidden'));
