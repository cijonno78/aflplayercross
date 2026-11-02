import type { RoundEntryWithDetails } from "@/types/database";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/game/categories";

/** "About today's answers" -- shown under the grid once a round is solved. */
export default function AnswerNotes({ roundEntries }: { roundEntries: RoundEntryWithDetails[] }) {
  const ordered = CATEGORY_ORDER.map((c) => roundEntries.find((re) => re.category === c)).filter(
    (re): re is RoundEntryWithDetails => Boolean(re?.entry.about),
  );
  if (ordered.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-medium">About the players</h2>
      <dl className="mt-3 flex flex-col gap-3">
        {ordered.map((re) => (
          <div key={re.id}>
            <dt className="font-medium">
              {re.entry.display_answer}{" "}
              <span className="text-xs font-normal uppercase tracking-wide text-zinc-500">
                {CATEGORY_LABEL[re.category]}
              </span>
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{re.entry.about}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
