import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/game/date";
import RoundCard, { formatRoundDateLabel } from "@/components/RoundCard";
import Link from "next/link";
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

      <section className="flex flex-col gap-3 text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">How it works</h2>
        <p>
          {SITE_NAME} is a free daily puzzle for footy fans. Each round is a small crossword with
          three AFL players to find: an easy one with 200 or more games, a medium one with 100 to
          199, and a hard one with 50 to 99. Every clue lists the clubs the player played for, in
          order, and their total AFL games, and the numbers in brackets show the length of their
          first name and surname.
        </p>
        <p>
          The names cross each other, so the player you know best gives you letters for the other
          two. Check your answers as often as you like, and take a hint if you&apos;re stuck. Once
          you&apos;ve solved a round you&apos;ll see a short career summary for each player, from
          their debut to their goal tally.
        </p>
        <p className="text-sm">
          <Link href="/help" className="underline">Full rules</Link> ·{" "}
          <Link href="/guides/how-to-solve" className="underline">How to solve</Link> ·{" "}
          <Link href="/guides" className="underline">All guides</Link>
        </p>
      </section>
    </main>
  );
}
