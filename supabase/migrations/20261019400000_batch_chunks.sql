-- Một bài nhiều Study có thể vượt giới hạn 20 MB của một lô Batch (mỗi yêu cầu mang cả PDF), nên pha
-- study_parts được chia thành nhiều lô; mỗi lô có số thứ tự `chunk` (0 cho pha structure và bài một lô).
alter table batch_jobs add column chunk integer not null default 0 check (chunk >= 0);

drop index batch_jobs_in_flight_idx;
create unique index batch_jobs_in_flight_idx on batch_jobs (file_hash, phase, purpose, chunk) where state in ('submitted', 'succeeded', 'ingested');
