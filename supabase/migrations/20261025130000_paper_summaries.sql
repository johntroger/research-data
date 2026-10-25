-- Steps S1-S3: what a paper asks and what its authors conclude, for the top of the paper page.
--  * paper_summaries: the research question and the main conclusions, reworded by an AI agent from the first pages of the PDF. Each statement
--    carries a short quote from the paper and the PDF page; the worker checks by machine that the quote is on that page (quote_match).
--  * papers.abstract: the publisher's abstract from Crossref when it has one (about half of the papers); shown folded and labelled with its source.
-- Anyone can read them; only the project owner's connection (the worker) writes.

create table if not exists public.paper_summaries (
  paper_id               uuid primary key references public.papers (id) on delete cascade,
  research_question      text,
  question_quote         text,
  question_page_index    integer check (question_page_index >= 0),
  question_match         text check (question_match in ('exact', 'fuzzy', 'neighbour_page', 'not_found')),
  findings               jsonb not null default '[]'::jsonb,
  source                 text not null,
  model                  text,
  created_at             timestamptz not null default now()
);

alter table public.paper_summaries enable row level security;
revoke all on public.paper_summaries from anon, authenticated;
grant select on public.paper_summaries to anon, authenticated;
drop policy if exists "anyone reads summaries" on public.paper_summaries;
create policy "anyone reads summaries" on public.paper_summaries for select to anon, authenticated using (true);

alter table public.papers add column if not exists abstract text;
alter table public.papers add column if not exists abstract_source text;
