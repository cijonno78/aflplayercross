import type { Round } from "@/types/database";

/** A completed round, stored client-side -- no accounts, no server round-trip. */
export interface LocalPlay {
  roundId: string;
  playDate: string | null;
  difficulty: number;
  mistakes: number;
  completedAt: string;
}

const STORAGE_KEY = "afl-player-cross:plays";

function readAll(): Record<string, LocalPlay> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, LocalPlay>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLocalPlay(roundId: string): LocalPlay | null {
  return readAll()[roundId] ?? null;
}

export function recordLocalWin(round: Pick<Round, "id" | "play_date" | "difficulty">, mistakes: number) {
  const all = readAll();
  all[round.id] = {
    roundId: round.id,
    playDate: round.play_date,
    difficulty: round.difficulty,
    mistakes,
    completedAt: new Date().toISOString(),
  };
  writeAll(all);
}

export function getAllLocalPlays(): LocalPlay[] {
  return Object.values(readAll()).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

function toDayNumber(dateISO: string): number {
  return Math.floor(new Date(`${dateISO}T00:00:00Z`).getTime() / 86_400_000);
}

/**
 * Streak counts consecutive calendar days with a solved daily round
 * (playDate set -- practice rounds don't count). "current" resets to 0 once
 * the most recent solved day is neither today nor yesterday.
 */
export function computeStreak(plays: LocalPlay[]): { current: number; best: number } {
  const days = Array.from(new Set(plays.filter((p) => p.playDate).map((p) => p.playDate as string)))
    .map(toDayNumber)
    .sort((a, b) => a - b);

  if (days.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const todayNum = toDayNumber(new Date().toISOString().slice(0, 10));
  const lastDay = days[days.length - 1];
  let current = 0;
  if (lastDay === todayNum || lastDay === todayNum - 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i] === days[i - 1] + 1) current += 1;
      else break;
    }
  }

  return { current, best };
}
