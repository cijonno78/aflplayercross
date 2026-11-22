import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { getArchivedPlayers } from "@/lib/archive";
import { ALL_CLUBS } from "@/lib/clubs";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `AFL clubs and their players from past puzzles — ${SITE_NAME}`,
  description: `Browse ${SITE_NAME} answers by AFL club: a short history of each club and every player from past rounds who played for it.`,
  alternates: { canonical: "/clubs" },
};

export default async function ClubsPage() {
  const players = await getArchivedPlayers();
  const counts = new Map<string, number>();
  for (const p of players) {
    for (const c of p.clubs) counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  return (
    <ArticlePage>
      <h1>AFL clubs</h1>
      <p>
        Every {SITE_NAME} clue lists the clubs a player played for. Pick a club to read a little
        about its history and see every player from past rounds who pulled on its jumper. A player
        who moved clubs shows up under each of them. For the story behind the names, read{" "}
        <Link href="/guides/club-names">AFL club names every solver should know</Link>.
      </p>
      <ul>
        {ALL_CLUBS.map((club) => {
          const n = counts.get(club.name) ?? 0;
          return (
            <li key={club.slug}>
              <Link href={`/clubs/${club.slug}`}>{club.name}</Link>{" "}
              <span className="text-sm text-zinc-500">
                ({n} {n === 1 ? "player" : "players"} from past rounds)
              </span>
            </li>
          );
        })}
      </ul>
    </ArticlePage>
  );
}
