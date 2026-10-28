export type EntryCategory = "easy" | "medium" | "hard";
export type EntryDirection = "across" | "down";

export interface Entry {
  id: string;
  category: EntryCategory;
  answer: string;
  display_answer: string;
  difficulty: number;
  created_at: string;
}

export interface Clue {
  id: string;
  entry_id: string;
  clue_text: string;
  created_at: string;
}

export interface Round {
  id: string;
  play_date: string | null;
  difficulty: number;
  status: "draft" | "published";
  created_at: string;
  completion_count: number;
}

export interface RoundEntry {
  id: string;
  round_id: string;
  entry_id: string;
  clue_id: string;
  category: EntryCategory;
  row_start: number;
  col_start: number;
  direction: EntryDirection;
}

/** A round_entry joined with its entry and clue -- the shape game/admin screens work with. */
export interface RoundEntryWithDetails extends RoundEntry {
  entry: Entry;
  clue: Clue;
}

export interface RoundWithEntries extends Round {
  round_entries: RoundEntryWithDetails[];
}
