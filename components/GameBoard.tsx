"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLocalPlay, recordLocalWin } from "@/lib/game/localStats";
import { buildGrid, cellKey, entryCells } from "@/lib/game/grid";
import Grid from "@/components/Grid";
import ClueList from "@/components/ClueList";
import ShareButton from "@/components/ShareButton";
import AdSlot from "@/components/AdSlot";
import { CATEGORY_ORDER } from "@/lib/game/categories";
import { SITE_NAME } from "@/lib/site";
import type { Round, RoundEntryWithDetails } from "@/types/database";

/** Letters revealed per hint, based on that answer's own total length
 * (multi-word answers count all words together, e.g. a (5,5) answer = 10). */
function hintCountFor(answerLength: number): number {
  return answerLength >= 10 ? 2 : 1;
}

function pickRandom<T>(items: T[], n: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < n) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

/** roundEntries arrives in unspecified DB row order -- pick a stable default
 * (easy, then medium, then hard) so the active clue on load always matches
 * the top of the visually-ordered clue list. */
function defaultActiveEntryId(roundEntries: RoundEntryWithDetails[]): string | null {
  for (const category of CATEGORY_ORDER) {
    const match = roundEntries.find((re) => re.category === category);
    if (match) return match.id;
  }
  return roundEntries[0]?.id ?? null;
}

export default function GameBoard({
  round,
  roundEntries,
}: {
  round: Round;
  roundEntries: RoundEntryWithDetails[];
}) {
  const { cells } = useMemo(() => buildGrid(roundEntries), [roundEntries]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [activeRoundEntryId, setActiveRoundEntryId] = useState<string | null>(() =>
    defaultActiveEntryId(roundEntries),
  );
  const [revealedCorrect, setRevealedCorrect] = useState<Record<string, boolean> | undefined>();
  const [solved, setSolved] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  // Bumped whenever a clue is clicked (see Grid's focusToken prop for why).
  const [focusToken, setFocusToken] = useState(0);

  // localStorage isn't available during SSR, so the already-solved state is
  // picked up here after mount rather than in the initial render.
  useEffect(() => {
    const existing = getLocalPlay(round.id);
    if (!existing) return;

    const filled: Record<string, string> = {};
    for (const [key, cell] of cells) filled[key] = cell.letter;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(filled);
    setRevealedCorrect(Object.fromEntries([...cells.keys()].map((k) => [k, true])));
    setSolved(true);
    setMistakeCount(existing.mistakes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  const solvedRoundEntryIds = useMemo(() => {
    if (!solved) return new Set<string>();
    return new Set(roundEntries.map((re) => re.id));
  }, [solved, roundEntries]);

  function handleCellInput(row: number, col: number, letter: string) {
    if (solved) return;
    setRevealedCorrect(undefined);
    setValues((prev) => ({ ...prev, [cellKey(row, col)]: letter }));
  }

  function handleSelectClue(id: string) {
    setActiveRoundEntryId(id);
    setFocusToken((t) => t + 1);
  }

  function handleActivateCell(row: number, col: number) {
    const key = cellKey(row, col);
    const owners = roundEntries.filter((re) =>
      entryCells(re).some((c) => cellKey(c.row, c.col) === key),
    );
    if (owners.length === 0) return;
    if (owners.some((o) => o.id === activeRoundEntryId)) return;
    setActiveRoundEntryId(owners[0].id);
  }

  function handleHint() {
    if (hintUsed || solved) return;

    setValues((prev) => {
      const next = { ...prev };
      for (const re of roundEntries) {
        const answerCells = entryCells(re);
        const unrevealed = answerCells.filter(
          (c) => (next[cellKey(c.row, c.col)] ?? "").toUpperCase() !== c.letter,
        );
        const picks = pickRandom(unrevealed, hintCountFor(re.entry.answer.length));
        for (const p of picks) next[cellKey(p.row, p.col)] = p.letter;
      }
      return next;
    });

    setRevealedCorrect(undefined);
    setHintUsed(true);
    setMessage("Hint used — a letter or two has been revealed in each answer.");
  }

  function handleCheck() {
    const missing = [...cells.keys()].some((key) => !values[key]);
    if (missing) {
      setMessage("Fill in every square first.");
      return;
    }

    const correctness: Record<string, boolean> = {};
    let wrongCount = 0;
    for (const [key, cell] of cells) {
      const isCorrect = values[key]?.toUpperCase() === cell.letter;
      correctness[key] = isCorrect;
      if (!isCorrect) wrongCount++;
    }
    setRevealedCorrect(correctness);

    if (wrongCount === 0) {
      setSolved(true);
      setMessage("Solved! 🎉");
      recordLocalWin(round, mistakeCount);
      // Anonymous completion counter -- no accounts, just a running total
      // for the admin panel. Fire-and-forget: this shouldn't block or
      // interrupt the win state if it fails.
      createClient()
        .rpc("increment_round_completion", { round_id: round.id })
        .then(({ error }) => {
          if (error) console.error("increment_round_completion failed", error);
        });
    } else {
      const nextMistakes = mistakeCount + 1;
      setMistakeCount(nextMistakes);
      setMessage(`${wrongCount} square${wrongCount === 1 ? "" : "s"} incorrect — keep going.`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-4">
        <ClueList
          roundEntries={roundEntries}
          activeRoundEntryId={activeRoundEntryId}
          onSelect={handleSelectClue}
          solvedRoundEntryIds={solvedRoundEntryIds}
        />

        {!solved && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCheck}
              className="rounded-md bg-blue-900 px-4 py-2 font-medium text-white hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Check answers
            </button>
            {!hintUsed && (
              <button
                type="button"
                onClick={handleHint}
                className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Hint
              </button>
            )}
          </div>
        )}

        {message && (
          <p className={`text-sm ${solved ? "text-green-700 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400"}`}>
            {message}
          </p>
        )}

        {solved && (
          <ShareButton
            title={SITE_NAME}
            text={`I solved ${round.play_date ? "today's" : "a"} ${SITE_NAME} puzzle ${
              mistakeCount === 0
                ? "with no mistakes!"
                : `in ${mistakeCount} mistake${mistakeCount === 1 ? "" : "s"}!`
            }`}
            url={typeof window !== "undefined" ? window.location.href : ""}
            className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Share result
          </ShareButton>
        )}
      </div>

      <div className="overflow-x-auto">
        <Grid
          roundEntries={roundEntries}
          values={values}
          activeRoundEntryId={activeRoundEntryId}
          focusToken={focusToken}
          onCellInput={handleCellInput}
          onActivateCell={handleActivateCell}
          revealedCorrect={revealedCorrect}
        />
      </div>

      <AdSlot />
    </div>
  );
}
