-- Bước 1.7: sổ chi tiêu Gemini (trần ngân sách, Mục 4.3) và công việc Batch bất đồng bộ (Mục 4.2).
-- Cả hai bảng riêng tư: bật RLS, không có policy, nên khách không đọc hay ghi được.

-- Mỗi lời gọi API đã trả tiền thì ghi một dòng, kể cả khi kết quả sau đó bị loại (tiền vẫn mất).
-- Tổng cột cost_usd là số tiền đã dùng so với GEMINI_BUDGET_LIMIT.
create table api_spend (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  model          text not null,
  pass           text,                                   -- paper_structure / study_paths / topup…
  file_hash      text,
  paper_id       uuid references papers (id) on delete set null,
  input_tokens   integer not null check (input_tokens >= 0),
  output_tokens  integer not null check (output_tokens >= 0),
  cost_usd       numeric(10, 6) not null check (cost_usd >= 0),
  batch          boolean not null default false,         -- Batch API: nửa giá
  batch_job_id   uuid,
  note           text
);
create index api_spend_created_idx on api_spend (created_at);
create index api_spend_hash_idx on api_spend (file_hash);
alter table api_spend enable row level security;

-- Một công việc Batch của Gemini. Trích xuất một bài đi qua hai đợt vì các lượt theo Study cần
-- nhãn Study của đợt 1: 'structure' (Pass 1 + 1b), rồi 'study_parts' (4 lượt cho mỗi Study).
create table batch_jobs (
  id             uuid primary key default gen_random_uuid(),
  job_name       text not null unique,                   -- tên tài nguyên Gemini, vd batches/abc123
  model          text not null,
  phase          text not null check (phase in ('structure', 'study_parts')),
  file_hash      text not null,
  pdf_path       text not null,                          -- để nạp lại PDF cho đợt 2
  state          text not null default 'submitted' check (state in ('submitted', 'succeeded', 'failed', 'ingested')),
  gemini_state   text,                                   -- JOB_STATE_* gần nhất
  request_keys   text[] not null default '{}',           -- thứ tự các yêu cầu trong đợt
  payload        jsonb not null default '{}'::jsonb,     -- kết quả đợt 1 cần cho đợt 2
  error          text,
  cost_usd       numeric(10, 6),
  submitted_at   timestamptz not null default now(),
  finished_at    timestamptz,
  updated_at     timestamptz not null default now()
);
-- Không nộp hai lần cùng một đợt cho cùng một bài khi đợt trước còn chạy hoặc đã xong.
create unique index batch_jobs_in_flight_idx on batch_jobs (file_hash, phase) where state in ('submitted', 'succeeded', 'ingested');
alter table batch_jobs enable row level security;
