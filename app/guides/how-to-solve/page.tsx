import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `How to solve ${SITE_NAME} puzzles`,
  description: `A practical guide to solving the daily ${SITE_NAME} crossword: reading the clubs and games, using crossing letters and choosing when to take a hint.`,
};

export default function HowToSolvePage() {
  return (
    <ArticlePage>
      <h1>How to solve {SITE_NAME} puzzles</h1>

      <p>
        Every {SITE_NAME} round has three AFL players: one easy, one medium and one hard. Their
        names cross each other in a small grid, so the real skill isn’t knowing every player
        straight away. It’s using the one you know to unlock the others.
      </p>

      <h2>1. Know what each tier means</h2>
      <p>
        The tiers are based on career games. Easy players have played 200 or more, medium players
        between 100 and 199, and hard players between 50 and 99. Most players in every tier have
        played in the last few seasons, so think recent first.
      </p>

      <h2>2. Read the clubs in order</h2>
      <p>
        Each clue lists the clubs a player has played for, in order. One club usually means a
        long-serving one-club player. Two or three clubs point to a trade, a free-agency move or a
        delisting and second chance. Old club names are shown in their modern form, so Footscray
        appears as Western Bulldogs. Our <Link href="/guides/club-names">club names guide</Link>{" "}
        explains the rest.
      </p>

      <h2>3. Use the games count</h2>
      <p>
        Games counts are up to the end of the most recent season. A count close to a milestone,
        like 199 or 300, can jog your memory of a recent milestone game.
      </p>

      <h2>4. Read the enumeration</h2>
      <p>
        The numbers in brackets are the lengths of the first name and surname. “(4,6)” is a
        four-letter first name followed by a six-letter surname. Combined with the clubs, the
        shape often leaves only one candidate.
      </p>

      <h2>5. Start with the easy player</h2>
      <p>
        The easy player is usually the best known. Getting it in gives you crossing letters for the
        other two, which is often all you need to crack the hard one.
      </p>

      <h2>6. Use hints sparingly</h2>
      <p>
        There’s no limit on checking answers, so wrong guesses don’t cost you anything. A hint
        reveals a letter or two in each name, so save it for when you’re truly stuck.
      </p>

      <h2>7. Learn from past rounds</h2>
      <p>
        Working through older puzzles on <Link href="/more-rounds">More rounds</Link> builds up the
        names you’ll recognise on sight.
      </p>

      <p>
        Ready to try it? <Link href="/">Play today’s round</Link>.
      </p>
    </ArticlePage>
  );
}
