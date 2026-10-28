-- AFL Player Cross: initial schema
-- Entries (reusable answer bank), clues, rounds, round_entries (grid placement),
-- profiles, plays, user_stats.

create extension if not exists "pgcrypto";

create type entry_category as enum ('easy', 'medium', 'hard');
create type entry_direction as enum ('across', 'down');

-- ---------------------------------------------------------------------------
-- entries: reusable bank of possible answers
-- ---------------------------------------------------------------------------
create table entries (
  id uuid primary key default gen_random_uuid(),
  category entry_category not null,
  answer text not null,          -- normalized, letters only, uppercase: 'NICKDAICOS'
  display_answer text not null,  -- 'Nick Daicos' (used to derive the (5,5) length pattern)
  difficulty smallint not null check (difficulty between 1 and 5),
  created_at timestamptz not null default now(),
  constraint entries_answer_letters_only check (answer = upper(answer) and answer ~ '^[A-Z]+$')
);

-- ---------------------------------------------------------------------------
-- clues: one or more clues per entry
-- ---------------------------------------------------------------------------
create table clues (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  clue_text text not null,
  created_at timestamptz not null default now()
);

create index clues_entry_id_idx on clues(entry_id);

-- ---------------------------------------------------------------------------
-- rounds: a single 3-answer puzzle
-- ---------------------------------------------------------------------------
create table rounds (
  id uuid primary key default gen_random_uuid(),
  play_date date unique,         -- set = scheduled daily puzzle; null = practice-pool only
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index rounds_play_date_idx on rounds(play_date);
create index rounds_status_idx on rounds(status);

-- ---------------------------------------------------------------------------
-- round_entries: places each of the 3 entries into a round's grid
-- ---------------------------------------------------------------------------
create table round_entries (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  entry_id uuid not null references entries(id),
  clue_id uuid not null references clues(id),
  category entry_category not null,
  row_start smallint not null,
  col_start smallint not null,
  direction entry_direction not null,
  unique (round_id, category)
);

create index round_entries_round_id_idx on round_entries(round_id);

-- Keep round_entries.category in sync with the linked entry's category, and
-- keep clue_id pointing at a clue that actually belongs to entry_id.
create or replace function check_round_entry_consistency()
returns trigger as $$
declare
  entry_category_val entry_category;
  clue_entry_id uuid;
begin
  select category into entry_category_val from entries where id = new.entry_id;
  if entry_category_val is null then
    raise exception 'entry % does not exist', new.entry_id;
  end if;
  if entry_category_val <> new.category then
    raise exception 'round_entries.category (%) does not match entries.category (%)', new.category, entry_category_val;
  end if;

  select entry_id into clue_entry_id from clues where id = new.clue_id;
  if clue_entry_id is null or clue_entry_id <> new.entry_id then
    raise exception 'clue % does not belong to entry %', new.clue_id, new.entry_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger round_entries_consistency
  before insert or update on round_entries
  for each row execute function check_round_entry_consistency();

-- Auto-maintain rounds.difficulty as the rounded average of its 3 entries' difficulty.
create or replace function recompute_round_difficulty()
returns trigger as $$
declare
  affected_round_id uuid;
  avg_difficulty numeric;
begin
  affected_round_id := coalesce(new.round_id, old.round_id);

  select round(avg(e.difficulty)) into avg_difficulty
  from round_entries re
  join entries e on e.id = re.entry_id
  where re.round_id = affected_round_id;

  update rounds
  set difficulty = coalesce(avg_difficulty, 1)
  where id = affected_round_id;

  return null;
end;
$$ language plpgsql;

create trigger round_entries_recompute_difficulty
  after insert or update or delete on round_entries
  for each row execute function recompute_round_difficulty();

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile + user_stats row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]+', '', 'g');
  if base_username = '' then
    base_username := 'player';
  end if;

  candidate := base_username;
  while exists (select 1 from profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into profiles (id, username) values (new.id, candidate);
  insert into user_stats (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- plays: one attempt/result per user per round
-- ---------------------------------------------------------------------------
create table plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  solved boolean not null default false,
  mistakes smallint not null default 0,
  duration_seconds integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, round_id)
);

create index plays_user_id_idx on plays(user_id);

-- ---------------------------------------------------------------------------
-- user_stats: aggregated per-user stats, maintained by the app on each play
-- ---------------------------------------------------------------------------
create table user_stats (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  total_played integer not null default 0,
  total_solved integer not null default 0,
  updated_at timestamptz not null default now()
);

-- create the trigger now that both profiles and user_stats exist
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table entries enable row level security;
alter table clues enable row level security;
alter table rounds enable row level security;
alter table round_entries enable row level security;
alter table profiles enable row level security;
alter table plays enable row level security;
alter table user_stats enable row level security;

-- A round is visible to players once it's published AND (it's a practice round
-- with no play_date, or its play_date has arrived) -- this keeps a scheduled
-- future daily puzzle's answers from leaking early via direct table reads.
-- security definer so this bypasses RLS on rounds internally; otherwise the
-- rounds policy calling this function would recurse into itself.
create or replace function is_round_visible(round_id uuid)
returns boolean as $$
  select exists (
    select 1 from rounds r
    where r.id = round_id
      and r.status = 'published'
      and (r.play_date is null or r.play_date <= current_date)
  );
$$ language sql stable security definer set search_path = public;

create policy "visible rounds are publicly readable" on rounds
  for select using (is_round_visible(id));

create policy "round_entries readable for visible rounds" on round_entries
  for select using (is_round_visible(round_id));

-- entries/clues are only exposed once they're placed in a currently-visible
-- round (or the reader is an admin) -- never enumerable wholesale, so future
-- puzzle answers can't be scraped from the answer bank ahead of time.
create policy "entries readable via a visible round" on entries
  for select using (
    exists (
      select 1 from round_entries re
      where re.entry_id = entries.id and is_round_visible(re.round_id)
    )
  );

create policy "clues readable via a visible round" on clues
  for select using (
    exists (
      select 1 from round_entries re
      where re.clue_id = clues.id and is_round_visible(re.round_id)
    )
  );

-- Authenticated users manage their own profile / plays / stats.
create policy "users can read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "users can read own plays" on plays
  for select using (auth.uid() = user_id);
create policy "users can insert own plays" on plays
  for insert with check (auth.uid() = user_id);
create policy "users can update own plays" on plays
  for update using (auth.uid() = user_id);

create policy "users can read own stats" on user_stats
  for select using (auth.uid() = user_id);
create policy "users can update own stats" on user_stats
  for update using (auth.uid() = user_id);

-- Admin (content authoring) access: any signed-in user whose profile id matches
-- an allow-listed admin email is granted full read/write on puzzle content.
-- Simpler than a roles table for a single-admin v1; app also gates the /admin
-- route client-side by email.
create table admin_emails (
  email text primary key
);

alter table admin_emails enable row level security;
create policy "no client access to admin_emails" on admin_emails for select using (false);

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_emails a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  );
$$ language sql security definer set search_path = public;

create policy "admins can write entries" on entries for all using (is_admin()) with check (is_admin());
create policy "admins can write clues" on clues for all using (is_admin()) with check (is_admin());
create policy "admins can write rounds" on rounds for all using (is_admin()) with check (is_admin());
create policy "admins can write round_entries" on round_entries for all using (is_admin()) with check (is_admin());
