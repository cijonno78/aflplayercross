-- AFL Player Cross: anonymous per-round completion counter
-- No accounts, no identifying data -- just a running total of how many
-- times each round has been solved, incremented via a narrow RPC rather
-- than a general UPDATE grant so anonymous callers can't touch anything
-- else about a round (difficulty, status, dates, etc).

alter table rounds add column completion_count integer not null default 0;

create or replace function increment_round_completion(round_id uuid)
returns void as $$
  update rounds
  set completion_count = completion_count + 1
  where id = round_id and is_round_visible(round_id);
$$ language sql security definer set search_path = public;

grant execute on function increment_round_completion(uuid) to anon, authenticated;
