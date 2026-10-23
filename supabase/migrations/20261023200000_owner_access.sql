-- Step A.3: the project owner, signed in through Supabase Auth, reads every row (hidden fields included) with the owner's own session,
-- so the admin pages need no direct database connection and work on a deployed site.
--
-- The owner is recognised by app_metadata.role = 'owner' in the session token. app_metadata can only be written with the service role
-- (the owner account is created that way, step A.1); user_metadata, which a user can edit, is never looked at.

create or replace function public.is_owner() returns boolean
  language sql stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner'
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated, service_role;

-- One read-only policy per table: the owner sees all rows. Writes stay closed to everyone but the service role.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists "owner reads all" on public.%I', t);
    execute format('create policy "owner reads all" on public.%I for select to authenticated using (public.is_owner())', t);
  end loop;
end
$$;

-- The numbers of the admin quality page (how many fields are ✓ / ⚠ / ◇ / hidden by source, design, field and failed check, and the papers
-- that need attention), computed in the database so the page needs one call. Same definitions as `pnpm worker quality`.
-- security definer: it reads the private run table for the owner and refuses anyone else. The developer machine, which connects to the database
-- directly, says so explicitly by setting the owner's claims for the transaction (apps/web/lib/quality.ts); nothing is allowed by default.
create or replace function public.quality_report(p_source text default null, p_limit integer default 15)
returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_owner() then
    raise exception 'quality_report is for the project owner' using errcode = '42501';
  end if;

  with f as (
    select x.paper_id, x.field_name, x.badge, x.check_results,
           coalesce(er.model_name, '(unknown)') as source,
           coalesce((select s.research_design from studies s
                      where s.paper_id = x.paper_id and (x.natural_key = s.natural_key or x.natural_key like s.natural_key || ':%')
                      order by length(s.natural_key) desc limit 1), '(paper-level)') as design
      from extracted_fields x
      left join extraction_runs er on er.id = x.extraction_run_id
     where (p_source is null or er.model_name ilike '%' || p_source || '%')
  ),
  total as (
    select count(*) filter (where badge = 'auto_verified')::int as verified,
           count(*) filter (where badge = 'needs_attention')::int as attention,
           count(*) filter (where badge = 'ai_interpreted')::int as interpreted,
           count(*) filter (where badge = 'hidden')::int as hidden,
           count(*)::int as fields,
           count(distinct paper_id)::int as papers
      from f
  ),
  by_source as (
    select row_number() over (order by (count(*) filter (where badge in ('needs_attention', 'hidden'))) desc, source) as rn, source as name,
           count(*) filter (where badge = 'auto_verified')::int as verified, count(*) filter (where badge = 'needs_attention')::int as attention,
           count(*) filter (where badge = 'ai_interpreted')::int as interpreted, count(*) filter (where badge = 'hidden')::int as hidden,
           count(distinct paper_id)::int as papers
      from f group by source order by rn limit p_limit
  ),
  by_design as (
    select row_number() over (order by (count(*) filter (where badge in ('needs_attention', 'hidden'))) desc, design) as rn, design as name,
           count(*) filter (where badge = 'auto_verified')::int as verified, count(*) filter (where badge = 'needs_attention')::int as attention,
           count(*) filter (where badge = 'ai_interpreted')::int as interpreted, count(*) filter (where badge = 'hidden')::int as hidden,
           count(distinct paper_id)::int as papers
      from f group by design order by rn limit p_limit
  ),
  by_field as (
    select row_number() over (order by (count(*) filter (where badge in ('needs_attention', 'hidden'))) desc, field_name) as rn, field_name as name,
           count(*) filter (where badge = 'auto_verified')::int as verified, count(*) filter (where badge = 'needs_attention')::int as attention,
           count(*) filter (where badge = 'ai_interpreted')::int as interpreted, count(*) filter (where badge = 'hidden')::int as hidden,
           count(distinct paper_id)::int as papers
      from f group by field_name order by rn limit p_limit
  ),
  checks as (
    select row_number() over (order by count(*) desc, f.field_name || ' / ' || (c ->> 'name')) as rn,
           f.field_name || ' / ' || (c ->> 'name') as name, count(*)::int as fields, count(distinct f.paper_id)::int as papers
      from f, jsonb_array_elements(f.check_results -> 'checks') c
     where f.badge in ('needs_attention', 'hidden') and (c ->> 'passed') = 'false'
     group by 2 order by rn limit p_limit
  ),
  attention as (
    select row_number() over (order by (count(*) filter (where f.badge in ('needs_attention', 'hidden'))) desc, coalesce(p.title, p.pdf_path, p.id::text)) as rn,
           p.id, coalesce(p.title, p.pdf_path, p.id::text) as title,
           count(*) filter (where f.badge = 'auto_verified')::int as verified, count(*) filter (where f.badge = 'needs_attention')::int as attention,
           count(*) filter (where f.badge = 'ai_interpreted')::int as interpreted, count(*) filter (where f.badge = 'hidden')::int as hidden
      from f join papers p on p.id = f.paper_id
     group by p.id, p.title, p.pdf_path
    having count(*) filter (where f.badge in ('needs_attention', 'hidden')) > 0
  )
  select jsonb_build_object(
    'total', (select to_jsonb(t) from total t),
    'bySource', coalesce((select jsonb_agg(to_jsonb(s) - 'rn' order by s.rn) from by_source s), '[]'::jsonb),
    'byDesign', coalesce((select jsonb_agg(to_jsonb(s) - 'rn' order by s.rn) from by_design s), '[]'::jsonb),
    'byField', coalesce((select jsonb_agg(to_jsonb(s) - 'rn' order by s.rn) from by_field s), '[]'::jsonb),
    'byCheck', coalesce((select jsonb_agg(to_jsonb(s) - 'rn' order by s.rn) from checks s), '[]'::jsonb),
    'attention', coalesce((select jsonb_agg(to_jsonb(s) - 'rn' order by s.rn) from attention s), '[]'::jsonb)
  ) into result;
  return result;
end
$$;

revoke all on function public.quality_report(text, integer) from public;
grant execute on function public.quality_report(text, integer) to authenticated, service_role;
