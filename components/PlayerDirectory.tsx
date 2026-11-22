import Link from "next/link";
import { formatRoundDateLabel } from "@/components/RoundCard";
import { CATEGORY_LABEL } from "@/lib/game/categories";
import { clubByName } from "@/lib/clubs";
import { playerNote } from "@/lib/players";
import { surname, type ArchivedPlayer } from "@/lib/archive";

function initialOf(name: string): string {
  const first = name.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export function ClubLinks({ clubs }: { clubs: string[] }) {
  return (
    <>
      {clubs.map((name, i) => {
        const club = clubByName(name);
        return (
          <span key={name}>
            {i > 0 && ", "}
            {club ? <Link href={`/clubs/${club.slug}`}>{name}</Link> : name}
          </span>
        );
      })}
    </>
  );
}

function PlayerItem({ player }: { player: ArchivedPlayer }) {
  const { entry, appearances } = player;
  return (
    <div id={`player-${player.slug}`} className="mt-5 scroll-mt-4">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
        {entry.display_answer}{" "}
        <span className="text-xs font-normal uppercase tracking-wide text-zinc-500">
          {CATEGORY_LABEL[entry.category]}
        </span>
      </h3>
      <p className="mt-1! text-sm text-zinc-500">
        <ClubLinks clubs={player.clubs} />
        {player.games !== null && ` · ${player.games} games`}
      </p>
      <p className="mt-1!">{playerNote(entry, player.clueText)}</p>
      <p className="mt-1! text-sm">
        Appeared in{" "}
        {appearances.map((a, i) => (
          <span key={a.roundId}>
            {i > 0 && ", "}
            <Link href={`/play/${a.roundId}`}>
              {a.playDate ? `the ${formatRoundDateLabel(a.playDate)} round` : "a practice round"}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

/** Players from past rounds, optionally grouped A–Z by surname. */
export default function PlayerDirectory({
  players,
  grouped = true,
}: {
  players: ArchivedPlayer[];
  grouped?: boolean;
}) {
  if (players.length === 0) {
    return <p>Nothing here yet. Check back after a few more rounds.</p>;
  }

  if (!grouped) {
    return (
      <>
        {players.map((p) => (
          <PlayerItem key={p.entry.id} player={p} />
        ))}
      </>
    );
  }

  const groups = new Map<string, ArchivedPlayer[]>();
  for (const p of players) {
    const letter = initialOf(surname(p));
    groups.set(letter, [...(groups.get(letter) ?? []), p]);
  }

  return (
    <>
      <nav aria-label="Jump to letter" className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {[...groups.keys()].map((letter) => (
          <a key={letter} href={`#letter-${letter}`}>
            {letter}
          </a>
        ))}
      </nav>
      {[...groups.entries()].map(([letter, items]) => (
        <section key={letter} id={`letter-${letter}`}>
          <h2>{letter}</h2>
          {items.map((p) => (
            <PlayerItem key={p.entry.id} player={p} />
          ))}
        </section>
      ))}
    </>
  );
}
