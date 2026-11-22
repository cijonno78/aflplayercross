import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/game/date";
import { parseClue } from "@/lib/players";
import { slugify } from "@/lib/clubs";
import type { Clue, Entry, Round } from "@/types/database";

export interface ArchivedAppearance {
  roundId: string;
  /** Null for practice rounds. */
  playDate: string | null;
}

export interface ArchivedPlayer {
  entry: Entry;
  slug: string;
  clueText: string;
  clubs: string[];
  games: number | null;
  /** Past rounds the player appeared in, newest first, practice rounds last. */
  appearances: ArchivedAppearance[];
}

type Row = {
  entry: Entry | null;
  clue: Clue | null;
  round: Pick<Round, "id" | "play_date" | "status">;
};

/**
 * Players from rounds that are already over: past daily rounds and practice
 * rounds. Today's daily round is left out so these pages never spoil it, and
 * RLS already hides future rounds.
 */
export const getArchivedPlayers = cache(async (): Promise<ArchivedPlayer[]> => {
  const supabase = await createClient();
  const today = todayISO();
  const { data } = await supabase
    .from("round_entries")
    .select("entry:entries(*), clue:clues(*), round:rounds!inner(id, play_date, status)")
    .returns<Row[]>();

  const byEntry = new Map<string, ArchivedPlayer>();
  for (const row of data ?? []) {
    if (!row.entry || !row.clue || row.round.status !== "published") continue;
    if (row.round.play_date !== null && row.round.play_date >= today) continue;
    const appearance = { roundId: row.round.id, playDate: row.round.play_date };
    const existing = byEntry.get(row.entry.id);
    if (existing) {
      existing.appearances.push(appearance);
      continue;
    }
    const { clubs, games } = parseClue(row.clue.clue_text);
    byEntry.set(row.entry.id, {
      entry: row.entry,
      slug: slugify(row.entry.display_answer),
      clueText: row.clue.clue_text,
      clubs,
      games,
      appearances: [appearance],
    });
  }

  const players = [...byEntry.values()];
  for (const p of players) {
    p.appearances.sort((x, y) => (y.playDate ?? "").localeCompare(x.playDate ?? ""));
  }
  return players.sort((a, b) => surname(a).localeCompare(surname(b)));
});

/** Sort and group players by surname, the way footy lists usually are. */
export function surname(p: ArchivedPlayer): string {
  const parts = p.entry.display_answer.trim().split(/\s+/);
  return parts.slice(1).join(" ") || parts[0];
}
