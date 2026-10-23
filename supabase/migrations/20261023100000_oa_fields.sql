-- Step 2.2c: what Unpaywall says about a paper's open access, so the web can follow the PDF policy (Mục 7, D14):
-- visitors view / download only open-licence papers, and get a link to the publisher's or repository's copy otherwise.
alter table papers
  add column if not exists oa_license text,
  add column if not exists oa_url text,
  add column if not exists oa_checked_at timestamptz;

comment on column papers.oa_license is 'Licence of the best open-access copy as Unpaywall names it (cc-by, cc-by-nc, publisher-specific-oa...); null when none';
comment on column papers.oa_url is 'Landing page of the best open-access copy (never a stored PDF), for the "Bản OA" link';
comment on column papers.oa_checked_at is 'When Unpaywall was last asked';
