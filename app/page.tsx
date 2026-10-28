import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/game/date";
import RoundCard, { formatRoundDateLabel } from "@/components/RoundCard";
import type { Round } from "@/types/database";
import { SITE_NAME } from "@/lib/site";

const PREVIOUS_ROUNDS_COUNT = 7;

export default async function HomePage() {
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: dailyRound }, { data: previousRounds }] = await Promise.all([
    supabase
      .from("rounds")
      .select("id, play_date, difficulty, status, created_at, completion_count")
      .eq("play_date", today)
      .maybeSingle<Round>(),
    supabase
      .from("rounds")
      .select("id, play_date, difficulty, status, created_at, completion_count")
      .not("play_date", "is", null)
      .lt("play_date", today)
      .order("play_date", { ascending: false })
      .range(0, PREVIOUS_ROUNDS_COUNT - 1)
      .returns<Round[]>(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">{SITE_NAME}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Every round: three AFL players — easy, medium and hard — interlinked like a crossword.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Today&apos;s round</h2>
        {dailyRound ? (
          <RoundCard round={dailyRound} label="Daily" />
        ) : (
          <p className="text-zinc-500">No round scheduled for today yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Previous rounds</h2>
        {previousRounds && previousRounds.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {previousRounds.map((round) => (
              <li key={round.id}>
                <RoundCard round={round} label={formatRoundDateLabel(round.play_date!)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500">No previous rounds yet.</p>
        )}
      </section>
    </main>
  );
}
