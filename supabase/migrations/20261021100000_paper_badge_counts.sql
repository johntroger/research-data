-- The library shows, for each paper, how many visible fields are ✓ / ⚠ / ◇ (hidden ones are not counted: the visitor
-- cannot see them). security_invoker makes the view obey the caller's row-level security, so a visitor gets the same
-- numbers as from extracted_fields itself.
create or replace view paper_badge_counts with (security_invoker = true) as
select
  paper_id,
  count(*) filter (where badge in ('auto_verified', 'human_reviewed')) as verified,
  count(*) filter (where badge = 'needs_attention') as attention,
  count(*) filter (where badge = 'ai_interpreted') as interpreted
from extracted_fields
group by paper_id;

grant select on paper_badge_counts to anon, authenticated;
