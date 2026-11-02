-- AFL Player Cross: a short note about each answer, shown under the puzzle once
-- it's solved ("About today's answers"). Filled from the word bank CSVs'
-- optional "about" column by scripts/generate-rounds.ts.

alter table entries add column if not exists about text;
