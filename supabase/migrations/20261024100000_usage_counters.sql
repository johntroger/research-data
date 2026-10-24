-- Step 4.6: how much the site is used, counted per day and per kind of use, with nothing about who. No IP, no cookie, no user, no path:
-- the table holds (day, event, count) and nothing else, so there is no personal data to protect, leak or be asked to delete.

create table if not exists public.usage_daily (
  day   date    not null,
  event text    not null,
  n     integer not null default 0,
  primary key (day, event)
);

alter table public.usage_daily enable row level security;
-- Nobody but the owner reads it, and nobody writes it directly: counting goes through count_event below.
revoke all on public.usage_daily from anon, authenticated;
grant select on public.usage_daily to authenticated;
drop policy if exists "owner reads all" on public.usage_daily;
create policy "owner reads all" on public.usage_daily for select to authenticated using (public.is_owner());

-- One more use of the given kind today (Vietnam time, the owner's day). The kinds are a closed list, so a visitor cannot make the table grow
-- by inventing names: it is at most (days x kinds) rows.
create or replace function public.count_event(p_event text) returns void
  language plpgsql security definer
  set search_path = public, pg_temp
as $$
begin
  if p_event is null or p_event not in ('relation_search', 'evidence_open', 'export_excel', 'export_word', 'export_word_matrix', 'pdf_view', 'pdf_download', 'copy_sentence', 'copy_apa') then
    raise exception 'unknown event' using errcode = '22023';
  end if;
  insert into public.usage_daily (day, event, n)
  values ((now() at time zone 'Asia/Ho_Chi_Minh')::date, p_event, 1)
  on conflict (day, event) do update set n = public.usage_daily.n + 1;
end
$$;

revoke all on function public.count_event(text) from public;
grant execute on function public.count_event(text) to anon, authenticated, service_role;

-- The last p_days days for the owner's admin page: [{day, event, n}], newest day first. Owner only.
create or replace function public.usage_report(p_days integer default 30) returns jsonb
  language plpgsql stable security definer
  set search_path = public, pg_temp
as $$
begin
  if not public.is_owner() then
    raise exception 'usage_report is for the project owner' using errcode = '42501';
  end if;
  return coalesce(
    (select jsonb_agg(jsonb_build_object('day', u.day, 'event', u.event, 'n', u.n) order by u.day desc, u.event)
       from public.usage_daily u
      where u.day > (now() at time zone 'Asia/Ho_Chi_Minh')::date - greatest(1, least(p_days, 366))),
    '[]'::jsonb);
end
$$;

revoke all on function public.usage_report(integer) from public;
grant execute on function public.usage_report(integer) to authenticated, service_role;
