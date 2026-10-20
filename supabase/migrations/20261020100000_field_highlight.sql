-- Step 3a.3: where each field's evidence quote sits on its PDF page, so the web can draw a frame over it.
-- {"page": <1-based PDF page>, "rects": [[x0, y0, x1, y1], ...]} in PDF points (origin bottom left); null when the quote
-- could not be placed (the web then opens the page without a frame and says so).
alter table extracted_fields add column if not exists highlight jsonb;
