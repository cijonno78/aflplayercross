"use client";

import type { RoundEntryWithDetails } from "@/types/database";
import { lengthPattern, formatLengthPattern } from "@/lib/game/grid";
import { CATEGORY_HINT, CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/game/categories";

export default function ClueList({
  roundEntries,
  activeRoundEntryId,
  onSelect,
  solvedRoundEntryIds,
}: {
  roundEntries: RoundEntryWithDetails[];
  activeRoundEntryId: string | null;
  onSelect: (roundEntryId: string) => void;
  solvedRoundEntryIds: Set<string>;
}) {
  const byCategory = new Map(roundEntries.map((re) => [re.category, re]));

  return (
    <ul className="flex flex-col gap-2">
      {CATEGORY_ORDER.map((category) => {
        const re = byCategory.get(category);
        if (!re) return null;
        const pattern = formatLengthPattern(lengthPattern(re.entry.display_answer));
        const active = re.id === activeRoundEntryId;
        const solved = solvedRoundEntryIds.has(re.id);

        return (
          <li key={re.id}>
            <button
              type="button"
              onClick={() => onSelect(re.id)}
              className={`flex w-full flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors ${
                active
                  ? "border-blue-700 bg-blue-50 dark:bg-blue-950"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {CATEGORY_LABEL[category]}
                <span className="ml-1 normal-case tracking-normal text-zinc-400">· {CATEGORY_HINT[category]}</span>
                {solved && <span className="ml-2 text-green-700 dark:text-green-400">✓</span>}
              </span>
              <span>
                {re.clue.clue_text} <span className="text-zinc-500">{pattern}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
