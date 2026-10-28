import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/game/date";
import RoundCard, { formatRoundDateLabel } from "@/components/RoundCard";
import type { Round } from "@/types/database";

// Keep in sync with app/page.tsx -- the home page shows the 7 most recent
// past daily rounds, so this page picks up starting right after those.
const PREVIOUS_ROUNDS_COUNT = 7;

export default async function MoreRoundsPage() {
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: practiceRounds }, { data: olderDailyRounds }] = await Promise.all([
    supabase
      .from("rounds")
      .select("id, play_date, difficulty, status, created_at, completion_count")
      .is("play_date", null)
      .order("created_at", { ascending: false })
      .returns<Round[]>(),
    supabase
      .from("rounds")
      .select("id, play_date, difficulty, status, created_at, completion_count")
      .not("play_date", "is", null)
      .lt("play_date", today)
      .order("play_date", { ascending: false })
      .range(PREVIOUS_ROUNDS_COUNT, PREVIOUS_ROUNDS_COUNT + 499)
      .returns<Round[]>(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">More rounds</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Practice rounds and daily rounds older than the last {PREVIOUS_ROUNDS_COUNT} days.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Practice</h2>
        {practiceRounds && practiceRounds.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {practiceRounds.map((round) => (
              <li key={round.id}>
                <RoundCard round={round} label="Practice" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500">No practice rounds yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Older daily rounds</h2>
        {olderDailyRounds && olderDailyRounds.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {olderDailyRounds.map((round) => (
              <li key={round.id}>
                <RoundCard round={round} label={formatRoundDateLabel(round.play_date!)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500">No older rounds yet.</p>
        )}
      </section>
    </main>
  );
}
