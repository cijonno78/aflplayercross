import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameBoard from "@/components/GameBoard";
import type { Round, RoundEntryWithDetails } from "@/types/database";

export default async function PlayRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const supabase = await createClient();

  const [{ data: round }, { data: roundEntries }] = await Promise.all([
    supabase.from("rounds").select("*").eq("id", roundId).maybeSingle<Round>(),
    supabase
      .from("round_entries")
      .select("*, entry:entries(*), clue:clues(*)")
      .eq("round_id", roundId)
      .returns<RoundEntryWithDetails[]>(),
  ]);

  if (!round || !roundEntries || roundEntries.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {round.play_date ? "Daily round" : "Practice round"}
        </h1>
      </div>

      <GameBoard round={round} roundEntries={roundEntries} />
    </main>
  );
}
