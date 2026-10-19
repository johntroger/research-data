-- Bước 1.9c: một công việc Batch có thể là để trích xuất thật ('extract') hoặc chỉ để so sánh với kết quả
-- đồng bộ ('compare': kết quả lưu riêng, không ghi đè, không publish). Hai loại không chặn nhau.
alter table batch_jobs add column purpose text not null default 'extract' check (purpose in ('extract', 'compare'));

drop index batch_jobs_in_flight_idx;
create unique index batch_jobs_in_flight_idx on batch_jobs (file_hash, phase, purpose) where state in ('submitted', 'succeeded', 'ingested');
