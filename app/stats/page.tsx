"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeStreak, getAllLocalPlays, type LocalPlay } from "@/lib/game/localStats";

export default function StatsPage() {
  const [plays, setPlays] = useState<LocalPlay[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlays(getAllLocalPlays());
  }, []);

  if (plays === null) return null;

  const { current, best } = computeStreak(plays);
  const dailyPlayed = plays.filter((p) => p.playDate).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Your stats</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saved on this device only — no account, nothing sent anywhere.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Current streak" value={current} />
          <Stat label="Best streak" value={best} />
          <Stat label="Daily rounds played" value={dailyPlayed} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">History</h2>
        {plays.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {plays.map((play) => (
              <li key={play.roundId}>
                <Link
                  href={`/play/${play.roundId}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">{play.playDate ?? "Practice"}</span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Solved ({play.mistakes} mistakes)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500">No rounds played yet.</p>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}
