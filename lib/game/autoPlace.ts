import type { EntryCategory, EntryDirection } from "@/types/database";

export interface PlaceableEntry {
  category: EntryCategory;
  /** Normalized, letters-only, uppercase answer: 'NICKDAICOS'. */
  answer: string;
}

export interface Placement {
  category: EntryCategory;
  row_start: number;
  col_start: number;
  direction: EntryDirection;
}

/**
 * Lays out an easy, medium and hard player as one across answer crossed by two
 * down answers. The two downs sit at least two columns apart so they never
 * touch, which means the only shared cells are the two intersections.
 * Returns null if the three answers can't be interlinked that way.
 *
 * `random` picks among the valid layouts, so the same three answers don't
 * always produce the same grid. Pass a seeded function for repeatable output.
 */
export function autoPlace(
  entries: PlaceableEntry[],
  random: () => number = Math.random,
): Placement[] | null {
  if (entries.length !== 3) return null;

  // Try each entry as the across answer, in random order.
  const acrossOrder = shuffle([0, 1, 2], random);

  for (const acrossIdx of acrossOrder) {
    const across = entries[acrossIdx];
    const [downA, downB] = entries.filter((_, i) => i !== acrossIdx);

    const options: { colA: number; rowA: number; colB: number; rowB: number; height: number }[] = [];

    for (let colA = 0; colA < across.answer.length; colA++) {
      for (let colB = 0; colB < across.answer.length; colB++) {
        if (Math.abs(colA - colB) < 2) continue;

        for (let rowA = 0; rowA < downA.answer.length; rowA++) {
          if (downA.answer[rowA] !== across.answer[colA]) continue;

          for (let rowB = 0; rowB < downB.answer.length; rowB++) {
            if (downB.answer[rowB] !== across.answer[colB]) continue;

            const above = Math.max(rowA, rowB);
            const below = Math.max(downA.answer.length - rowA, downB.answer.length - rowB);
            options.push({ colA, rowA, colB, rowB, height: above + below });
          }
        }
      }
    }

    if (options.length === 0) continue;

    // Prefer compact grids: choose among the layouts within one row of the shortest.
    const minHeight = Math.min(...options.map((o) => o.height));
    const compact = options.filter((o) => o.height <= minHeight + 1);
    const pick = compact[Math.floor(random() * compact.length)];

    // The across answer sits on the row both downs cross; shift so nothing is negative.
    const acrossRow = Math.max(pick.rowA, pick.rowB);

    return [
      { category: across.category, row_start: acrossRow, col_start: 0, direction: "across" },
      { category: downA.category, row_start: acrossRow - pick.rowA, col_start: pick.colA, direction: "down" },
      { category: downB.category, row_start: acrossRow - pick.rowB, col_start: pick.colB, direction: "down" },
    ];
  }

  return null;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
