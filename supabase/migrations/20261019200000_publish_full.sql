-- Bước 1.8: publish đủ dữ liệu.

-- 1. Cột raw_extraction chứa phản hồi gốc của AI, kể cả giá trị đã bị ẩn vì không khớp PDF.
--    RLS chỉ lọc theo hàng, nên khách đọc được mọi cột của hàng công khai. Chặn riêng cột này:
--    khách chỉ được SELECT các cột còn lại (và không được ghi; ghi đã bị RLS chặn từ trước).
--    Chủ dự án và worker dùng vai trò service nên không bị ảnh hưởng.
--    Bảng nghiệp vụ nào thêm cột sau này phải cấp quyền SELECT cột đó cho anon nếu khách cần đọc
--    (test tích hợp bắt trường hợp quên).
do $$
declare
  t text;
  visible text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'raw_extraction'
  loop
    select string_agg(format('%I', column_name), ', ' order by ordinal_position) into visible
      from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name <> 'raw_extraction';
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select (%s) on table public.%I to anon, authenticated', visible, t);
  end loop;
end
$$;

-- 2. Một câu trích ở một trang chỉ có một dòng bằng chứng: publish lại không nhân đôi.
create unique index evidence_unique_quote on evidence (paper_id, pdf_page_index, md5(exact_quote));

-- 3. Mỗi lượt gọi AI của một bài là một dòng extraction_runs (theo pass và Study).
alter table extraction_runs add column study_label text;
create index extraction_runs_paper_pass_idx on extraction_runs (paper_id, pass);
