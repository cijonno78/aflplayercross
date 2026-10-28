import Link from "next/link";
import SolvedBadge from "@/components/SolvedBadge";
import type { Round } from "@/types/database";

export default function RoundCard({ round, label }: { round: Round; label: string }) {
  return (
    <Link
      href={`/play/${round.id}`}
      className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-900 dark:text-blue-100">
          {label}
        </span>
        <span className="text-xs text-zinc-500">Easy · Medium · Hard</span>
      </div>
      <SolvedBadge roundId={round.id} />
    </Link>
  );
}

/** "Mon, Aug 17" -- used to label dated rounds (today's excepted, which just says "Daily"). */
export function formatRoundDateLabel(playDate: string): string {
  return new Date(`${playDate}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
