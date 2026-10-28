"use client";

import { useEffect, useState } from "react";
import { getLocalPlay } from "@/lib/game/localStats";

export default function SolvedBadge({ roundId }: { roundId: string }) {
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolved(Boolean(getLocalPlay(roundId)));
  }, [roundId]);

  if (!solved) return null;

  return <span className="text-sm font-medium text-green-700 dark:text-green-400">Solved ✓</span>;
}
