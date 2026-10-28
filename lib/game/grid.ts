import type { RoundEntryWithDetails } from "@/types/database";

export interface GridCell {
  row: number;
  col: number;
  letter: string;
  /** round_entry ids occupying this cell (length 2 at an intersection). */
  roundEntryIds: string[];
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** The (row, col) letter cells a single placed entry occupies, in answer order. */
export function entryCells(
  roundEntry: Pick<RoundEntryWithDetails, "row_start" | "col_start" | "direction" | "entry">,
): { row: number; col: number; letter: string }[] {
  const { row_start, col_start, direction, entry } = roundEntry;
  return [...entry.answer].map((letter, i) => ({
    row: direction === "down" ? row_start + i : row_start,
    col: direction === "across" ? col_start + i : col_start,
    letter,
  }));
}

export interface GridConflict {
  row: number;
  col: number;
  roundEntryIds: string[];
  letters: string[];
}

export interface BuiltGrid {
  cells: Map<string, GridCell>;
  conflicts: GridConflict[];
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

/**
 * Merges every placed entry's cells into one grid, recording any cell where
 * two entries disagree on the letter (a mis-authored intersection).
 */
export function buildGrid(roundEntries: RoundEntryWithDetails[]): BuiltGrid {
  const cells = new Map<string, GridCell>();
  const conflicts: GridConflict[] = [];
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (const re of roundEntries) {
    for (const { row, col, letter } of entryCells(re)) {
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);

      const key = cellKey(row, col);
      const existing = cells.get(key);
      if (!existing) {
        cells.set(key, { row, col, letter, roundEntryIds: [re.id] });
        continue;
      }

      existing.roundEntryIds.push(re.id);
      if (existing.letter !== letter) {
        conflicts.push({
          row,
          col,
          roundEntryIds: existing.roundEntryIds,
          letters: [existing.letter, letter],
        });
      }
    }
  }

  return { cells, conflicts, minRow, maxRow, minCol, maxCol };
}

/** Word-length pattern like a crossword clue's "(5,5)", derived from the display text. */
export function lengthPattern(displayAnswer: string): number[] {
  return displayAnswer
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z]/g, "").length);
}

export function formatLengthPattern(pattern: number[]): string {
  return `(${pattern.join(",")})`;
}

/**
 * Validates a candidate set of round entries before they're saved as a round:
 * exactly one easy/medium/hard player, every entry's answer is letters-only, and
 * every intersection agrees on its letter. Used by the admin authoring UI
 * ahead of publish, and can double as a data sanity check for seed content.
 */
export function validateRoundEntries(
  roundEntries: RoundEntryWithDetails[],
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  const categories = roundEntries.map((re) => re.category);
  for (const cat of ["easy", "medium", "hard"] as const) {
    if (categories.filter((c) => c === cat).length !== 1) {
      errors.push(`Round must have exactly one "${cat}" entry.`);
    }
  }

  for (const re of roundEntries) {
    if (!/^[A-Z]+$/.test(re.entry.answer)) {
      errors.push(`Entry "${re.entry.display_answer}" has a non-letter answer.`);
    }
  }

  const answers = roundEntries.map((re) => re.entry.answer);
  if (new Set(answers).size !== answers.length) {
    errors.push("The same player can't appear twice in one round.");
  }

  if (roundEntries.length >= 2) {
    const { conflicts } = buildGrid(roundEntries);
    for (const c of conflicts) {
      errors.push(
        `Cell (${c.row}, ${c.col}) has conflicting letters: ${c.letters.join(" vs ")}.`,
      );
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
