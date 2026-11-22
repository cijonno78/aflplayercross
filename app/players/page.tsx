import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import PlayerDirectory from "@/components/PlayerDirectory";
import { getArchivedPlayers } from "@/lib/archive";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `AFL players from past puzzles — ${SITE_NAME}`,
  description: `Every AFL player who has been an answer in ${SITE_NAME}, with the clubs they played for, their career games and the round they appeared in.`,
  alternates: { canonical: "/players" },
};

export default async function PlayersPage() {
  const players = await getArchivedPlayers();
  return (
    <ArticlePage>
      <h1>AFL players from past puzzles</h1>
      <p>
        Every {SITE_NAME} round has three players: one easy (200+ games), one medium (100–199) and
        one hard (50–99). Here is every player from past rounds, listed by surname, with the clubs
        they played for in order, their career games and a link back to the round they appeared
        in. The list grows with every daily puzzle, and today&apos;s players are only added once
        the round is over.
      </p>
      <p>
        Prefer to browse by team? See the <Link href="/clubs">players from past rounds by club</Link>,
        or read <Link href="/guides/how-to-solve">how to solve {SITE_NAME} puzzles</Link>.
      </p>
      {players.length > 0 && (
        <p className="text-sm text-zinc-500">{players.length} players so far.</p>
      )}
      <PlayerDirectory players={players} />
    </ArticlePage>
  );
}
