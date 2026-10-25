-- Step P4.1: numbered releases of the data, so a result or a citation can say which version of the repository it was computed on.
-- A release is a row: its number (the date, with -2, -3 if more than one on a day), when it was cut, how much the repository held, the
-- version of the canonical concept list, and a note. Anyone can read them; only the project owner's connection (the worker) writes.

create table if not exists public.data_releases (
  id                text primary key,
  released_at       timestamptz not null default now(),
  papers            integer not null check (papers >= 0),
  tests             integer not null check (tests >= 0),
  canonical_version text not null,
  note              text not null default ''
);

alter table public.data_releases enable row level security;
revoke all on public.data_releases from anon, authenticated;
grant select on public.data_releases to anon, authenticated;
drop policy if exists "anyone reads releases" on public.data_releases;
create policy "anyone reads releases" on public.data_releases for select to anon, authenticated using (true);
