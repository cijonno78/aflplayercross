import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticlePage from "@/components/ArticlePage";
import PlayerDirectory from "@/components/PlayerDirectory";
import { getArchivedPlayers } from "@/lib/archive";
import { ALL_CLUBS, clubBySlug } from "@/lib/clubs";
import { SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return ALL_CLUBS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const club = clubBySlug(slug);
  if (!club) return {};
  return {
    title: `${club.name} players from past puzzles — ${SITE_NAME}`,
    description: `${club.text} Every ${club.name} player who has been an answer in ${SITE_NAME}, with their clubs and career games.`,
    alternates: { canonical: `/clubs/${club.slug}` },
  };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = clubBySlug(slug);
  if (!club) notFound();

  const players = (await getArchivedPlayers())
    .filter((p) => p.clubs.includes(club.name))
    .sort((a, b) => (b.games ?? 0) - (a.games ?? 0));
  const oneClub = players.filter((p) => p.clubs.length === 1).length;
  const mostGames = players[0];

  return (
    <ArticlePage>
      <p className="text-sm">
        <Link href="/clubs">All clubs</Link>
      </p>
      <h1>{club.name}</h1>
      <p>{club.text}</p>
      {players.length > 0 ? (
        <p>
          {players.length} {players.length === 1 ? "player has" : "players have"} appeared in{" "}
          {SITE_NAME} rounds after playing for {club.name}
          {oneClub > 0 && `, ${oneClub} of them one-club players`}.
          {mostGames?.games != null &&
            ` The longest career among them belongs to ${mostGames.entry.display_answer}, with ${mostGames.games} games in total.`}{" "}
          They are listed below from most games to fewest.
        </p>
      ) : null}
      <h2>Players from past rounds</h2>
      <PlayerDirectory players={players} grouped={false} />
    </ArticlePage>
  );
}
