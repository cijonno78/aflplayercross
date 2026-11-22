import { CATEGORY_HINT, CATEGORY_LABEL } from "@/lib/game/categories";
import { SITE_NAME } from "@/lib/site";
import type { Entry } from "@/types/database";

export interface PlayerFacts {
  /** Clubs in the order the player played for them. */
  clubs: string[];
  games: number | null;
}

/** Clues look like "Geelong, Gold Coast · 357 games". */
export function parseClue(clueText: string): PlayerFacts {
  const [clubPart, gamesPart] = clueText.split("·").map((s) => s.trim());
  const clubs = (clubPart ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const match = gamesPart?.match(/(\d+)/);
  return { clubs, games: match ? Number(match[1]) : null };
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * A short background note built from the player's clubs, games and tier, so
 * every answer gets some readable context without hand-written bios.
 */
export function playerNote(entry: Entry, clueText: string): string {
  const { clubs, games } = parseClue(clueText);
  const name = entry.display_answer;
  const gamesText = games !== null ? `${games} AFL games` : "AFL games";
  const parts: string[] = [];

  if (clubs.length === 1) {
    parts.push(`${name} was a one-club player, playing all ${gamesText} for ${clubs[0]}.`);
  } else if (clubs.length > 1) {
    parts.push(
      `${name} played ${gamesText} across ${clubs.length} clubs, starting at ${clubs[0]} before moving on to ${listOf(clubs.slice(1))}.`,
    );
  }

  if (games !== null && games >= 400) {
    parts.push("That is one of the highest games tallies in the history of the game.");
  } else if (games !== null && games >= 300) {
    parts.push("That puts them in the select group of players to reach 300 games.");
  }

  parts.push(
    `In ${SITE_NAME} that makes them a ${CATEGORY_LABEL[entry.category].toLowerCase()} answer (${CATEGORY_HINT[entry.category]}).`,
  );
  return parts.join(" ");
}
