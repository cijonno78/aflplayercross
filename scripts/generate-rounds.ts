/**
 * AFL Player Cross: automatic daily round generator.
 *
 * 1. Syncs the word bank in scripts/word-bank/*.csv into the entries/clues
 *    tables (adds anything new, never deletes).
 * 2. For every date in the next --days days that has no round yet, picks an
 *    easy, medium and hard player not used recently, lays them out with
 *    autoPlace, checks the grid with validateRoundEntries, and saves it.
 *
 * Future-dated published rounds stay hidden from players until their date
 * (see is_round_visible), so queueing a week ahead is safe and leaves time to
 * unpublish or delete a round from /admin.
 *
 * Each answer's clue is the one in the word bank, so editing a clue in the CSV
 * changes it for rounds created from then on. --refresh-clues also switches
 * already-queued future rounds over to the word bank's current clues.
 *
 * Usage:
 *   npm run generate-rounds -- [--days 7] [--status published|draft] [--refresh-clues] [--dry-run]
 *
 * Needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * --dry-run reads the database but writes nothing, and prints each grid.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { autoPlace } from "../lib/game/autoPlace";
import { buildGrid, cellKey, validateRoundEntries } from "../lib/game/grid";
import type { Clue, Entry, EntryCategory, RoundEntryWithDetails } from "../types/database";

const WORD_BANK_FILES: Record<EntryCategory, string> = {
  easy: "easy.csv",
  medium: "medium.csv",
  hard: "hard.csv",
};

// Longer answers make grids too wide for a phone screen.
const MAX_ANSWER_LENGTH = 14;
// Don't reuse an answer that appeared in a daily round within this many days.
const REUSE_COOLDOWN_DAYS = 90;
const ATTEMPTS_PER_ROUND = 2000;

export interface Args {
  days: number;
  status: "published" | "draft";
  dryRun: boolean;
  refreshClues: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { days: 7, status: "published", dryRun: false, refreshClues: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--days") args.days = Number(argv[++i]);
    else if (arg === "--status") args.status = argv[++i] as Args["status"];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--refresh-clues") args.refreshClues = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(args.days) || args.days < 1) throw new Error("--days must be a positive whole number.");
  if (args.status !== "published" && args.status !== "draft") throw new Error("--status must be published or draft.");
  return args;
}

/** Minimal CSV parser: handles quoted fields, embedded commas and doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export function normalizeAnswer(displayAnswer: string): string {
  return displayAnswer
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

interface BankRow {
  category: EntryCategory;
  displayAnswer: string;
  answer: string;
  clueText: string;
  difficulty: number;
}

function loadWordBank(): BankRow[] {
  const dir = join(__dirname, "word-bank");
  const out: BankRow[] = [];
  for (const [category, file] of Object.entries(WORD_BANK_FILES) as [EntryCategory, string][]) {
    const [header, ...rows] = parseCsv(readFileSync(join(dir, file), "utf8"));
    const col = (name: string) => {
      const idx = header.findIndex((h) => h.trim().toLowerCase() === name);
      if (idx === -1) throw new Error(`${file} is missing a "${name}" column.`);
      return idx;
    };
    const [answerCol, clueCol, difficultyCol] = [col("answer"), col("clue"), col("difficulty")];

    for (const r of rows) {
      const displayAnswer = (r[answerCol] ?? "").trim();
      const clueText = (r[clueCol] ?? "").trim();
      const difficulty = Math.min(5, Math.max(1, Math.round(Number(r[difficultyCol]) || 3)));
      const answer = normalizeAnswer(displayAnswer);
      if (!answer || !clueText) continue;
      out.push({ category, displayAnswer, answer, clueText, difficulty });
    }
  }
  return out;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * In GitHub Actions, also emit the message as a workflow annotation so it shows
 * on the run's summary page without opening the full log.
 */
function report(level: "error" | "notice", message: string) {
  (level === "error" ? console.error : console.log)(message);
  if (process.env.GITHUB_ACTIONS) console.log(`::${level}::${message.replace(/\r?\n/g, " ")}`);
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function renderGrid(roundEntries: RoundEntryWithDetails[]): string {
  const { cells, minRow, maxRow, minCol, maxCol } = buildGrid(roundEntries);
  const lines: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    let line = "";
    for (let c = minCol; c <= maxCol; c++) line += cells.get(cellKey(r, c))?.letter ?? "·";
    lines.push(`    ${line.split("").join(" ")}`);
  }
  return lines.join("\n");
}

export async function generateRounds(supabase: SupabaseClient, args: Args, today: string) {
  // --- 1. Sync the word bank --------------------------------------------------
  const bank = loadWordBank();

  const { data: entryRows, error: entriesError } = await supabase.from("entries").select("*");
  if (entriesError) throw entriesError;
  const { data: clueRows, error: cluesError } = await supabase.from("clues").select("*");
  if (cluesError) throw cluesError;

  const entries: Entry[] = entryRows ?? [];
  const clues: Clue[] = clueRows ?? [];
  const entryKey = (category: string, answer: string) => `${category}:${answer}`;
  const entryByKey = new Map(entries.map((e) => [entryKey(e.category, e.answer), e]));

  const newEntries = bank.filter((b) => !entryByKey.has(entryKey(b.category, b.answer)));
  // Answers repeated within a file would make the insert fail; keep the first.
  const uniqueNewEntries = [...new Map(newEntries.map((b) => [entryKey(b.category, b.answer), b])).values()];

  if (uniqueNewEntries.length > 0 && !args.dryRun) {
    const { data, error } = await supabase
      .from("entries")
      .insert(
        uniqueNewEntries.map((b) => ({
          category: b.category,
          answer: b.answer,
          display_answer: b.displayAnswer,
          difficulty: b.difficulty,
        })),
      )
      .select();
    if (error) throw error;
    for (const e of data as Entry[]) {
      entries.push(e);
      entryByKey.set(entryKey(e.category, e.answer), e);
    }
  }
  console.log(`Word bank: ${bank.length} rows, ${uniqueNewEntries.length} new entries${args.dryRun ? " (dry run: not saved)" : ""}.`);

  const clueKey = (entryId: string, text: string) => `${entryId}:${text.toLowerCase()}`;
  const existingClues = new Set(clues.map((c) => clueKey(c.entry_id, c.clue_text)));
  const newClues = new Map<string, { entry_id: string; clue_text: string }>();
  for (const b of bank) {
    const entry = entryByKey.get(entryKey(b.category, b.answer));
    if (!entry) continue; // dry run: entry not created yet
    const key = clueKey(entry.id, b.clueText);
    if (!existingClues.has(key)) newClues.set(key, { entry_id: entry.id, clue_text: b.clueText });
  }

  if (newClues.size > 0 && !args.dryRun) {
    const { data, error } = await supabase.from("clues").insert([...newClues.values()]).select();
    if (error) throw error;
    clues.push(...(data as Clue[]));
  }
  console.log(`Clues: ${newClues.size} new${args.dryRun ? " (dry run: not saved)" : ""}.`);

  // In a dry run, stand in for entries that would have been created so we can still preview grids.
  if (args.dryRun) {
    for (const b of uniqueNewEntries) {
      const id = `dry-run-${entryKey(b.category, b.answer)}`;
      entries.push({
        id,
        category: b.category,
        answer: b.answer,
        display_answer: b.displayAnswer,
        difficulty: b.difficulty,
        created_at: "",
      });
      clues.push({ id: `${id}-clue`, entry_id: id, clue_text: b.clueText, created_at: "" });
    }
  }

  // Only word-bank answers are used, each with its current word-bank clue
  // (older clues stay in the table for past rounds but aren't picked again).
  const clueByKey = new Map(clues.map((c) => [clueKey(c.entry_id, c.clue_text), c]));
  const bankClueByEntry = new Map<string, Clue>();
  for (const b of bank) {
    const entry = entryByKey.get(entryKey(b.category, b.answer));
    const clue = entry && clueByKey.get(clueKey(entry.id, b.clueText));
    if (entry && clue && !bankClueByEntry.has(entry.id)) bankClueByEntry.set(entry.id, clue);
  }

  // --- 1b. Optionally update queued rounds to the current clues ----------------
  if (args.refreshClues) {
    const { data: upcoming, error: upcomingError } = await supabase
      .from("rounds")
      .select("id, round_entries(id, entry_id, clue_id)")
      .gte("play_date", today);
    if (upcomingError) throw upcomingError;

    const stale = (upcoming ?? [])
      .flatMap((r) => r.round_entries as { id: string; entry_id: string; clue_id: string }[])
      .filter((re) => bankClueByEntry.has(re.entry_id) && bankClueByEntry.get(re.entry_id)!.id !== re.clue_id);

    if (!args.dryRun) {
      for (const re of stale) {
        const { error } = await supabase
          .from("round_entries")
          .update({ clue_id: bankClueByEntry.get(re.entry_id)!.id })
          .eq("id", re.id);
        if (error) throw error;
      }
    }
    report("notice", `${args.dryRun ? "Dry run: would update" : "Updated"} ${stale.length} clue(s) in queued rounds.`);
  }

  // --- 2. Find the dates that need a round --------------------------------------
  const lastDate = addDays(today, args.days - 1);

  const { data: scheduled, error: scheduledError } = await supabase
    .from("rounds")
    .select("play_date")
    .gte("play_date", today)
    .lte("play_date", lastDate);
  if (scheduledError) throw scheduledError;
  const taken = new Set((scheduled ?? []).map((r) => r.play_date as string));

  const missingDates: string[] = [];
  for (let i = 0; i < args.days; i++) {
    const date = addDays(today, i);
    if (!taken.has(date)) missingDates.push(date);
  }
  if (missingDates.length === 0) {
    report("notice", `Every day from ${today} to ${lastDate} already has a round. Nothing to do.`);
    return;
  }

  // Answers used in recent or upcoming daily rounds are off-limits.
  const { data: recent, error: recentError } = await supabase
    .from("rounds")
    .select("round_entries(entry_id)")
    .gte("play_date", addDays(today, -REUSE_COOLDOWN_DAYS));
  if (recentError) throw recentError;
  const recentlyUsed = new Set(
    (recent ?? []).flatMap((r) => (r.round_entries as { entry_id: string }[]).map((re) => re.entry_id)),
  );

  const pools = new Map<EntryCategory, Entry[]>();
  for (const category of Object.keys(WORD_BANK_FILES) as EntryCategory[]) {
    pools.set(
      category,
      entries.filter(
        (e) =>
          e.category === category &&
          e.answer.length <= MAX_ANSWER_LENGTH &&
          bankClueByEntry.has(e.id) &&
          !recentlyUsed.has(e.id),
      ),
    );
  }

  // --- 3. Build and save a round for each missing date --------------------------
  let created = 0;
  for (const date of missingDates) {
    let roundEntries: RoundEntryWithDetails[] | null = null;

    for (let attempt = 0; attempt < ATTEMPTS_PER_ROUND && !roundEntries; attempt++) {
      const picks = (["easy", "medium", "hard"] as const).map((category) => pickRandom(pools.get(category)!));
      if (picks.some((p) => !p)) break;
      if (new Set(picks.map((p) => p.answer)).size < 3) continue;

      const placements = autoPlace(picks.map((p) => ({ category: p.category, answer: p.answer })));
      if (!placements) continue;

      const candidate = placements.map((pl): RoundEntryWithDetails => {
        const entry = picks.find((p) => p.category === pl.category)!;
        const clue = bankClueByEntry.get(entry.id)!;
        return { id: pl.category, round_id: "new", entry_id: entry.id, clue_id: clue.id, entry, clue, ...pl };
      });
      if (validateRoundEntries(candidate).valid) roundEntries = candidate;
    }

    if (!roundEntries) {
      report("error", `${date}: couldn't build a valid round. The word bank may be running low on unused answers.`);
      process.exitCode = 1;
      continue;
    }

    const describe = roundEntries
      .map((re) => `${re.category.padEnd(6)} ${re.entry.display_answer} — "${re.clue.clue_text}"`)
      .join("\n    ");
    console.log(`\n${date}\n    ${describe}\n${renderGrid(roundEntries)}`);

    // Don't pick these answers again in this run.
    for (const re of roundEntries) {
      const pool = pools.get(re.category)!;
      pools.set(re.category, pool.filter((e) => e.id !== re.entry_id));
    }

    if (args.dryRun) continue;

    // Same sequence as the admin panel: create as draft, attach entries, then publish.
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .insert({ play_date: date, status: "draft" })
      .select()
      .single();
    if (roundError || !round) throw roundError ?? new Error("Failed to create round.");

    const { error: reError } = await supabase.from("round_entries").insert(
      roundEntries.map((re) => ({
        round_id: round.id,
        entry_id: re.entry_id,
        clue_id: re.clue_id,
        category: re.category,
        row_start: re.row_start,
        col_start: re.col_start,
        direction: re.direction,
      })),
    );
    if (reError) {
      await supabase.from("rounds").delete().eq("id", round.id);
      throw reError;
    }

    if (args.status === "published") {
      const { error } = await supabase.from("rounds").update({ status: "published" }).eq("id", round.id);
      if (error) throw error;
    }
    created++;
  }

  report("notice", `${args.dryRun ? "Dry run: would have created" : "Created"} ${args.dryRun ? missingDates.length : created} round(s).`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  // Dates are UTC, matching todayISO() on the site and current_date in the database.
  await generateRounds(supabase, args, new Date().toISOString().slice(0, 10));
}

if (require.main === module) {
  main().catch((err) => {
    // Supabase errors are plain objects, so pull out their message and hint.
    const detail =
      err instanceof Error ? err.message : [err?.message, err?.details, err?.hint].filter(Boolean).join(" — ") || String(err);
    report("error", `Round generation failed: ${detail}`);
    process.exit(1);
  });
}
