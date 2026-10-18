-- Bước 0.3: bảng tối thiểu cho "bộ khung chạy được" (Mục 10.0, bước 0.4–0.8).
-- Schema đầy đủ (Mục 5) được bổ sung bằng các migration sau.

create extension if not exists pgcrypto;

-- Trạng thái huy hiệu tin cậy (Mục 6.5)
create type badge as enum (
  'auto_verified',
  'needs_attention',
  'ai_interpreted',
  'hidden',
  'human_reviewed',
  'disputed'
);

-- Tầng dữ liệu (Mục 1.4)
create type field_tier as enum ('T1', 'T2', 'T3');

-- Bài báo
create table papers (
  id            uuid primary key default gen_random_uuid(),
  doi           text unique,
  title         text,
  file_hash     text not null unique,          -- SHA-256 của PDF
  pdf_path      text,                          -- đường dẫn local / khóa R2
  page_count    integer check (page_count > 0),
  created_at    timestamptz not null default now()
);

-- Mỗi lượt trích xuất (để tái lập và tính chi phí)
create table extraction_runs (
  id              uuid primary key default gen_random_uuid(),
  paper_id        uuid not null references papers (id) on delete cascade,
  model_name      text not null,
  prompt_version  text not null,
  schema_version  text not null,
  input_tokens    integer,
  output_tokens   integer,
  cost_usd        numeric(10, 6),
  raw_response    jsonb,
  created_at      timestamptz not null default now()
);

-- Từng trường đã trích xuất, kèm bằng chứng và kết quả kiểm tra
create table extracted_fields (
  id                 uuid primary key default gen_random_uuid(),
  paper_id           uuid not null references papers (id) on delete cascade,
  extraction_run_id  uuid references extraction_runs (id) on delete set null,
  natural_key        text not null,             -- khóa tự nhiên ổn định (Mục 6.7)
  field_name         text not null,
  tier               field_tier not null,
  value              jsonb not null,
  evidence_quote     text,
  pdf_page_index     integer check (pdf_page_index >= 0),
  printed_page       text,
  badge              badge not null default 'needs_attention',
  check_results      jsonb not null default '{}'::jsonb,  -- dữ liệu cho bảng "Vì sao ✓"
  locked             boolean not null default false,      -- true khi đã sửa tay
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (paper_id, natural_key)
);

create index extracted_fields_paper_idx on extracted_fields (paper_id);
create index extracted_fields_field_idx on extracted_fields (field_name);

-- RLS: khách (anon) chỉ đọc; không đọc được trường bị ẩn; không ai ghi được trừ service role.
alter table papers enable row level security;
alter table extraction_runs enable row level security;
alter table extracted_fields enable row level security;

create policy "public read papers"
  on papers for select
  to anon, authenticated
  using (true);

create policy "public read visible fields"
  on extracted_fields for select
  to anon, authenticated
  using (badge <> 'hidden');

-- extraction_runs (chứa phản hồi thô, chi phí): không có policy cho anon → khách không đọc được.
