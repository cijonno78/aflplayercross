"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundEntryWithDetails } from "@/types/database";
import { buildGrid, cellKey, entryCells } from "@/lib/game/grid";

const MAX_CELL = 48;
const MIN_CELL = 22;
const GAP = 4;

function computeCellSize(containerWidth: number, numCols: number): number {
  if (numCols <= 0 || containerWidth <= 0) return MAX_CELL;
  const raw = Math.floor((containerWidth - GAP * (numCols - 1)) / numCols);
  return Math.min(MAX_CELL, Math.max(MIN_CELL, raw));
}

export default function Grid({
  roundEntries,
  values,
  activeRoundEntryId,
  focusToken,
  onCellInput,
  onActivateCell,
  revealedCorrect,
}: {
  roundEntries: RoundEntryWithDetails[];
  values: Record<string, string>;
  activeRoundEntryId: string | null;
  /** Bumped on every clue click, even re-clicking the already-active one, so
   * the focus-jump effect below re-runs even though activeRoundEntryId itself
   * didn't change (React skips state updates that don't change the value). */
  focusToken: number;
  onCellInput: (row: number, col: number, letter: string) => void;
  onActivateCell: (row: number, col: number) => void;
  /** cellKey -> true (correct) / false (incorrect), only present once the player has submitted. */
  revealedCorrect?: Record<string, boolean>;
}) {
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL);

  const { cells, minRow, maxRow, minCol, maxCol } = useMemo(
    () => buildGrid(roundEntries),
    [roundEntries],
  );
  const numCols = maxCol - minCol + 1;

  // Shrink cells to fit the viewport width instead of relying on horizontal
  // scroll -- important on mobile, where a long across entry (e.g. a 14-letter
  // player name) would otherwise force scrolling to see the rest of the word.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setCellSize(computeCellSize(el.clientWidth, numCols));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [numCols]);

  const activeEntry = roundEntries.find((re) => re.id === activeRoundEntryId) ?? null;
  const activeOrder = useMemo(
    () => (activeEntry ? entryCells(activeEntry).map((c) => cellKey(c.row, c.col)) : []),
    [activeEntry],
  );

  function focusCell(row: number, col: number) {
    const el = inputRefs.current.get(cellKey(row, col));
    el?.focus();
  }

  // When the active clue changes (e.g. the player clicks a clue rather than a
  // cell), jump focus to that entry's first empty cell.
  useEffect(() => {
    if (!activeEntry) return;
    const order = entryCells(activeEntry).map((c) => cellKey(c.row, c.col));
    const activeElKey = [...inputRefs.current.entries()].find(
      ([, el]) => el === document.activeElement,
    )?.[0];
    if (activeElKey && order.includes(activeElKey)) return;

    const target = order.find((k) => !values[k]) ?? order[0];
    focusCell(cells.get(target)!.row, cells.get(target)!.col);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  function moveAlongActive(fromKey: string, delta: 1 | -1) {
    const idx = activeOrder.indexOf(fromKey);
    if (idx === -1) return;
    const nextKey = activeOrder[idx + delta];
    if (!nextKey) return;
    const cell = cells.get(nextKey)!;
    focusCell(cell.row, cell.col);
  }

  function enterLetter(row: number, col: number, letter: string) {
    onCellInput(row, col, letter.toUpperCase());
    moveAlongActive(cellKey(row, col), 1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) {
    const key = cellKey(row, col);
    // Letters are handled here (not onChange): retyping the same letter that's
    // already in a cell -- common at a shared intersection -- doesn't change
    // the DOM value, and React's change-detection silently drops that onChange.
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      enterLetter(row, col, e.key);
    } else if (e.key === "ArrowRight" && cells.has(cellKey(row, col + 1))) focusCell(row, col + 1);
    else if (e.key === "ArrowLeft" && cells.has(cellKey(row, col - 1))) focusCell(row, col - 1);
    else if (e.key === "ArrowDown" && cells.has(cellKey(row + 1, col))) focusCell(row + 1, col);
    else if (e.key === "ArrowUp" && cells.has(cellKey(row - 1, col))) focusCell(row - 1, col);
    else if (e.key === "Backspace" && !values[key]) moveAlongActive(key, -1);
  }

  function handleChange(row: number, col: number, raw: string) {
    // Fallback for input methods that don't fire a plain keydown (paste, IME,
    // mobile autocomplete) -- keydown already handles normal typing above.
    const letter = raw.replace(/[^a-zA-Z]/g, "").slice(-1);
    if (letter) enterLetter(row, col, letter);
  }

  const cellStyle = {
    width: cellSize,
    height: cellSize,
    fontSize: Math.max(11, Math.round(cellSize * 0.42)),
  };

  const rows = [];
  for (let r = minRow; r <= maxRow; r++) {
    const rowCells = [];
    for (let c = minCol; c <= maxCol; c++) {
      const key = cellKey(r, c);
      const cell = cells.get(key);
      if (!cell) {
        // A same-sized, non-interactive <input> (not a <div>) -- the two
        // element types compute different flex-item widths for the identical
        // size classes, which otherwise throws every column out of alignment.
        rowCells.push(
          <input
            key={key}
            disabled
            tabIndex={-1}
            aria-hidden="true"
            style={cellStyle}
            className="border border-transparent bg-transparent"
          />,
        );
        continue;
      }

      const isActive = activeOrder.includes(key);
      const correctness = revealedCorrect?.[key];

      rowCells.push(
        <input
          key={key}
          ref={(el) => {
            if (el) inputRefs.current.set(key, el);
            else inputRefs.current.delete(key);
          }}
          value={values[key] ?? ""}
          maxLength={1}
          onFocus={(e) => {
            onActivateCell(r, c);
            e.target.select();
          }}
          onChange={(e) => handleChange(r, c, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, r, c)}
          style={cellStyle}
          className={`border text-center font-semibold uppercase ${
            correctness === true
              ? "border-green-600 bg-green-50 dark:bg-green-950"
              : correctness === false
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : isActive
                  ? "border-blue-700 bg-blue-50/70 dark:bg-blue-950/60"
                  : "border-zinc-300 dark:border-zinc-700"
          }`}
        />,
      );
    }
    rows.push(
      <div key={r} className="flex gap-1">
        {rowCells}
      </div>,
    );
  }

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-1">
      {rows}
    </div>
  );
}
