"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buildGrid, cellKey, validateRoundEntries } from "@/lib/game/grid";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/game/categories";
import type {
  Clue,
  Entry,
  EntryCategory,
  EntryDirection,
  Round,
  RoundEntryWithDetails,
} from "@/types/database";

const CATEGORIES: EntryCategory[] = CATEGORY_ORDER;

interface Selection {
  entryId: string;
  clueId: string;
  row: number;
  col: number;
  direction: EntryDirection;
}

const emptySelection: Selection = { entryId: "", clueId: "", row: 0, col: 0, direction: "across" };

export default function AdminPanel() {
  const supabase = useMemo(() => createClient(), []);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEntry, setNewEntry] = useState({
    category: "easy" as EntryCategory,
    displayAnswer: "",
    difficulty: 2,
    clueText: "",
  });
  const [entryError, setEntryError] = useState<string | null>(null);

  const [selections, setSelections] = useState<Record<EntryCategory, Selection>>({
    easy: { ...emptySelection },
    medium: { ...emptySelection },
    hard: { ...emptySelection },
  });
  const [playDate, setPlayDate] = useState("");
  const [publishError, setPublishError] = useState<string[] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: entriesData }, { data: cluesData }, { data: roundsData }] = await Promise.all([
      supabase.from("entries").select("*").order("category").order("display_answer"),
      supabase.from("clues").select("*"),
      supabase.from("rounds").select("*").order("created_at", { ascending: false }),
    ]);
    setEntries(entriesData ?? []);
    setClues(cluesData ?? []);
    setRounds(roundsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    setEntryError(null);

    const answer = newEntry.displayAnswer.toUpperCase().replace(/[^A-Z]/g, "");
    if (!answer) {
      setEntryError("Enter a valid answer (letters only).");
      return;
    }
    if (!newEntry.clueText.trim()) {
      setEntryError("Enter a clue.");
      return;
    }

    const { data: entry, error: entryInsertError } = await supabase
      .from("entries")
      .insert({
        category: newEntry.category,
        answer,
        display_answer: newEntry.displayAnswer.trim(),
        difficulty: newEntry.difficulty,
      })
      .select()
      .single();

    if (entryInsertError || !entry) {
      setEntryError(entryInsertError?.message ?? "Failed to create entry.");
      return;
    }

    const { error: clueInsertError } = await supabase
      .from("clues")
      .insert({ entry_id: entry.id, clue_text: newEntry.clueText.trim() });

    if (clueInsertError) {
      setEntryError(clueInsertError.message);
      return;
    }

    setNewEntry({ category: newEntry.category, displayAnswer: "", difficulty: 2, clueText: "" });
    await loadData();
  }

  function updateSelection(category: EntryCategory, patch: Partial<Selection>) {
    setSelections((prev) => ({ ...prev, [category]: { ...prev[category], ...patch } }));
  }

  const previewRoundEntries: RoundEntryWithDetails[] = useMemo(() => {
    const out: RoundEntryWithDetails[] = [];
    for (const category of CATEGORIES) {
      const sel = selections[category];
      const entry = entries.find((e) => e.id === sel.entryId);
      const clue = clues.find((c) => c.id === sel.clueId);
      if (!entry || !clue) continue;
      out.push({
        id: category,
        round_id: "preview",
        entry_id: entry.id,
        clue_id: clue.id,
        category,
        row_start: sel.row,
        col_start: sel.col,
        direction: sel.direction,
        entry,
        clue,
      });
    }
    return out;
  }, [selections, entries, clues]);

  const preview = useMemo(() => buildGrid(previewRoundEntries), [previewRoundEntries]);

  async function handlePublish() {
    setPublishError(null);
    setPublishSuccess(null);

    if (previewRoundEntries.length !== 3) {
      setPublishError(["Pick an entry and clue for the easy, medium and hard player."]);
      return;
    }

    const validation = validateRoundEntries(previewRoundEntries);
    if (!validation.valid) {
      setPublishError(validation.errors);
      return;
    }

    setPublishing(true);

    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .insert({ play_date: playDate || null, status: "draft" })
      .select()
      .single();

    if (roundError || !round) {
      setPublishError([roundError?.message ?? "Failed to create round."]);
      setPublishing(false);
      return;
    }

    const { error: entriesError } = await supabase.from("round_entries").insert(
      previewRoundEntries.map((re) => ({
        round_id: round.id,
        entry_id: re.entry_id,
        clue_id: re.clue_id,
        category: re.category,
        row_start: re.row_start,
        col_start: re.col_start,
        direction: re.direction,
      })),
    );

    if (entriesError) {
      setPublishError([entriesError.message]);
      setPublishing(false);
      return;
    }

    await supabase.from("rounds").update({ status: "published" }).eq("id", round.id);

    setPublishing(false);
    setPublishSuccess("Round published.");
    setSelections({ easy: { ...emptySelection }, medium: { ...emptySelection }, hard: { ...emptySelection } });
    setPlayDate("");
    await loadData();
  }

  async function toggleRoundStatus(round: Round) {
    const nextStatus = round.status === "published" ? "draft" : "published";
    await supabase.from("rounds").update({ status: nextStatus }).eq("id", round.id);
    await loadData();
  }

  async function deleteRound(round: Round) {
    await supabase.from("rounds").delete().eq("id", round.id);
    await loadData();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="mb-3 text-lg font-medium">Add an entry to the bank</h2>
        <form onSubmit={handleCreateEntry} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Category
            <select
              value={newEntry.category}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, category: e.target.value as EntryCategory }))
              }
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Answer
            <input
              value={newEntry.displayAnswer}
              onChange={(e) => setNewEntry((p) => ({ ...p, displayAnswer: e.target.value }))}
              placeholder="Nick Daicos"
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Difficulty
            <select
              value={newEntry.difficulty}
              onChange={(e) => setNewEntry((p) => ({ ...p, difficulty: Number(e.target.value) }))}
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
            Clue
            <input
              value={newEntry.clueText}
              onChange={(e) => setNewEntry((p) => ({ ...p, clueText: e.target.value }))}
              placeholder="Collingwood · 118 games"
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </form>
        {entryError && <p className="mt-2 text-sm text-red-600">{entryError}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Build a round</h2>
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((category) => {
            const sel = selections[category];
            const categoryEntries = entries.filter((e) => e.category === category);
            const entryClues = clues.filter((c) => c.entry_id === sel.entryId);
            return (
              <div
                key={category}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <span className="w-16 text-sm font-medium uppercase text-zinc-500">
                  {CATEGORY_LABEL[category]}
                </span>
                <label className="flex flex-col gap-1 text-sm">
                  Entry
                  <select
                    value={sel.entryId}
                    onChange={(e) => updateSelection(category, { entryId: e.target.value, clueId: "" })}
                    className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">—</option>
                    {categoryEntries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.display_answer}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Clue
                  <select
                    value={sel.clueId}
                    onChange={(e) => updateSelection(category, { clueId: e.target.value })}
                    disabled={!sel.entryId}
                    className="min-w-48 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">—</option>
                    {entryClues.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clue_text}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Row
                  <input
                    type="number"
                    value={sel.row}
                    onChange={(e) => updateSelection(category, { row: Number(e.target.value) })}
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Col
                  <input
                    type="number"
                    value={sel.col}
                    onChange={(e) => updateSelection(category, { col: Number(e.target.value) })}
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Direction
                  <select
                    value={sel.direction}
                    onChange={(e) =>
                      updateSelection(category, { direction: e.target.value as EntryDirection })
                    }
                    className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="across">Across</option>
                    <option value="down">Down</option>
                  </select>
                </label>
              </div>
            );
          })}
        </div>

        {previewRoundEntries.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-500">Grid preview</h3>
            <GridPreview grid={preview} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Play date (optional — daily puzzle)
            <input
              type="date"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-md bg-blue-900 px-4 py-2 font-medium text-white hover:bg-blue-950 disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish round"}
          </button>
        </div>

        {publishError && (
          <ul className="mt-2 list-inside list-disc text-sm text-red-600">
            {publishError.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
        {publishSuccess && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{publishSuccess}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Existing rounds</h2>
        <ul className="flex flex-col gap-2">
          {rounds.map((round) => (
            <li
              key={round.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 dark:border-zinc-800"
            >
              <span className="text-sm">
                {round.play_date ?? "Practice"} ·{" "}
                <span
                  className={
                    round.status === "published"
                      ? "text-green-700 dark:text-green-400"
                      : "text-zinc-500"
                  }
                >
                  {round.status}
                </span>{" "}
                · completed {round.completion_count}x
              </span>
              <span className="flex gap-3 text-sm">
                <Link href={`/play/${round.id}`} target="_blank" className="underline">
                  Preview
                </Link>
                <button type="button" onClick={() => toggleRoundStatus(round)} className="underline">
                  {round.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRound(round)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GridPreview({ grid }: { grid: ReturnType<typeof buildGrid> }) {
  const rows = [];
  for (let r = grid.minRow; r <= grid.maxRow; r++) {
    const rowCells = [];
    for (let c = grid.minCol; c <= grid.maxCol; c++) {
      const cell = grid.cells.get(cellKey(r, c));
      const conflict = grid.conflicts.some((conf) => conf.row === r && conf.col === c);
      rowCells.push(
        <div
          key={c}
          className={`flex h-8 w-8 items-center justify-center border text-sm font-semibold ${
            !cell
              ? "border-transparent"
              : conflict
                ? "border-red-500 bg-red-100 dark:bg-red-950"
                : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          {cell?.letter ?? ""}
        </div>,
      );
    }
    rows.push(
      <div key={r} className="flex gap-0.5">
        {rowCells}
      </div>,
    );
  }
  return <div className="flex flex-col gap-0.5">{rows}</div>;
}
