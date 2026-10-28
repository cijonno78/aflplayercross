# AFL Player Cross

A daily AFL crossword at [aflplayercross.com](https://aflplayercross.com). Every round has three
players — easy (200+ games), medium (100–199) and hard (50–99) — whose names cross in a small grid.
Clues are the clubs a player played for and their total AFL games.

Built on the same foundations as Golf Words (Next.js + Supabase + Vercel).

## How it fits together

- **Word bank:** `scripts/word-bank/easy.csv`, `medium.csv`, `hard.csv`. One row per player:
  `answer` (first name and surname), `clue` (clubs · games), `difficulty`.
  Games counts are as at the end of the 2026 season, from AFL Tables.
- **Daily rounds:** `.github/workflows/daily-rounds.yml` runs `npm run generate-rounds` every day.
  It keeps the next 7 days stocked with one easy, one medium and one hard player, avoiding anyone
  used in the last 90 days. Future rounds stay hidden until their date.
- **Site details:** name, address and contact email live in `lib/site.ts`
  (or set `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_CONTACT_EMAIL`).
- **Admin:** `/admin` (sign in with the email in `supabase/seed.sql`) to build rounds by hand,
  unpublish or delete them.

## Setting it up

### 1. Supabase (database)
1. Create a new project at supabase.com.
2. In **SQL Editor**, run each file in `supabase/migrations/` in order, then `supabase/seed.sql`.
3. From **Project Settings → API**, copy the Project URL, the `anon` key and the `service_role` key.

### 2. GitHub (daily puzzles)
In this repo's **Settings → Secrets and variables → Actions**, add:
- `SUPABASE_URL` — the Project URL
- `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` key

Then open **Actions → Generate daily rounds → Run workflow** once to fill the first week.

### 3. Vercel (hosting)
1. Import this repo as a new Vercel project.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - optional: `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
3. Under **Settings → Domains**, add `aflplayercross.com` and follow the DNS instructions.

## Each off-season

Players still active add games every season, so refresh the three CSVs after the Grand Final,
then run the workflow with **refresh clues** ticked so queued rounds pick up the new numbers.

## Local development

```bash
cp .env.local.example .env.local   # fill in your Supabase URL and anon key
npm install
npm run dev
```
