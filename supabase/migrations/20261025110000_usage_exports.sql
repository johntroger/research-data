-- Step P4.3: three more kinds of use to count (export of results as CSV, of references as RIS and BibTeX). Same closed list, same rules as
-- 20261024100000_usage_counters.sql: a visitor cannot make the table grow by inventing names.
create or replace function public.count_event(p_event text) returns void
  language plpgsql security definer
  set search_path = public, pg_temp
as $$
begin
  if p_event is null or p_event not in ('relation_search', 'evidence_open', 'export_excel', 'export_word', 'export_word_matrix', 'export_csv', 'export_ris', 'export_bibtex', 'pdf_view', 'pdf_download', 'copy_sentence', 'copy_apa') then
    raise exception 'unknown event' using errcode = '22023';
  end if;
  insert into public.usage_daily (day, event, n)
  values ((now() at time zone 'Asia/Ho_Chi_Minh')::date, p_event, 1)
  on conflict (day, event) do update set n = public.usage_daily.n + 1;
end
$$;

revoke all on function public.count_event(text) from public;
grant execute on function public.count_event(text) to anon, authenticated, service_role;
