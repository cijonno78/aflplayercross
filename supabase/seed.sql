-- AFL Player Cross: initial data
-- Grants admin (content-authoring) access to the site owner's email.
-- Puzzles themselves come from scripts/word-bank/*.csv via
-- `npm run generate-rounds` (run daily by .github/workflows/daily-rounds.yml).

insert into admin_emails (email) values ('cijonno@gmail.com')
  on conflict (email) do nothing;
