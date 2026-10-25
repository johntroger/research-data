-- Step M3: the caption of each table ("Table 7. Mediation results with the short scale"), found by machine in the PDF text (pnpm worker captions).
-- It tells a reader which model or sample a table reports when one relationship is stated in two tables. Short (at most 160 characters), nullable.
alter table public.paper_tables add column if not exists caption text;
