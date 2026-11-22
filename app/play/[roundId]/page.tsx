import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/game/date";
import { CATEGORY_HINT, CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/game/categories";
import { slugify } from "@/lib/clubs";
import { parseClue, playerNote } from "@/lib/players";
import { SITE_NAME } from "@/lib/site";
import GameBoard from "@/components/GameBoard";
import { ClubLinks } from "@/components/PlayerDirectory";
import type { Round, RoundEntryWithDetails } from "@/types/database";

// Shared by generateMetadata and the page so the round is only fetched once.
const loadRound = cache(async (roundId: string) => {
  const supabase = await createClient();
  const [{ data: round }, { data: roundEntries }] = await Promise.all([
    supabase.from("rounds").select("*").eq("id", roundId).maybeSingle<Round>(),
    supabase
      .from("round_entries")
      .select("*, entry:entries(*), clue:clues(*)")
      .eq("round_id", roundId)
      .returns<RoundEntryWithDetails[]>(),
  ]);
  return { round, roundEntries };
});

function longDate(playDate: string): string {
  return new Date(`${playDate}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ordered(roundEntries: RoundEntryWithDetails[]): RoundEntryWithDetails[] {
  return CATEGORY_ORDER.flatMap((c) => roundEntries.filter((re) => re.category === c));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roundId: string }>;
}): Promise<Metadata> {
  const { roundId } = await params;
  const { round, roundEntries } = await loadRound(roundId);
  if (!round || !roundEntries || roundEntries.length === 0) return {};

  const name = round.play_date ? `AFL crossword for ${longDate(round.play_date)}` : "AFL practice crossword";
  // Clues only, never answers, so the description can't spoil the round.
  const clues = ordered(roundEntries)
    .map((re) => `${CATEGORY_LABEL[re.category]}: ${re.clue.clue_text}`)
    .join(" | ");
  return {
    title: `${name} — ${SITE_NAME}`,
    description: `${name}: name three AFL players from their clubs and career games. ${clues}.`,
    alternates: { canonical: `/play/${round.id}` },
  };
}

export default async function PlayRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const { round, roundEntries } = await loadRound(roundId);

  if (!round || !roundEntries || roundEntries.length === 0) {
    notFound();
  }

  // Once a daily round's day is over (and for practice rounds), the answers
  // and background notes are part of the page, behind a "show answers" toggle.
  // Today's round never shows them.
  const isFinished = round.play_date === null || round.play_date < todayISO();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {round.play_date ? `Daily round · ${longDate(round.play_date)}` : "Practice round"}
        </h1>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Find three AFL players from the clubs they played for and their career games: one easy
        ({CATEGORY_HINT.easy}), one medium ({CATEGORY_HINT.medium}) and one hard ({CATEGORY_HINT.hard}).
        New to the game? Read <Link href="/guides/how-to-solve" className="underline">how to solve</Link>.
      </p>

      <GameBoard round={round} roundEntries={roundEntries} />

      {isFinished && (
        <details className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <summary className="cursor-pointer font-medium">Show the answers and background</summary>
          <dl className="mt-3 flex flex-col gap-4">
            {ordered(roundEntries).map((re) => {
              const { clubs } = parseClue(re.clue.clue_text);
              return (
                <div key={re.id}>
                  <dt className="font-medium">
                    {re.entry.display_answer}{" "}
                    <span className="text-xs font-normal uppercase tracking-wide text-zinc-500">
                      {CATEGORY_LABEL[re.category]}
                    </span>
                  </dt>
                  <dd className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400 [&_a]:underline">
                    <p>Clue: {re.clue.clue_text}</p>
                    <p className="mt-1">{playerNote(re.entry, re.clue.clue_text)}</p>
                    <p className="mt-1">
                      Clubs: <ClubLinks clubs={clubs} />. See{" "}
                      <Link href={`/players#player-${slugify(re.entry.display_answer)}`}>
                        all players from past rounds
                      </Link>
                      .
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </details>
      )}
    </main>
  );
}
