import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { SITE_NAME } from "@/lib/site";
import { CURRENT_CLUBS } from "@/lib/clubs";

export const metadata: Metadata = {
  title: "AFL club names every solver should know",
  description: `The 18 AFL clubs, when they joined, and the old names behind them. Useful background for reading ${SITE_NAME} clues.`,
};



export default function ClubNamesPage() {
  return (
    <ArticlePage>
      <h1>AFL club names every solver should know</h1>
      <p>
        Every {SITE_NAME} clue lists the clubs a player played for, in the order they played for
        them. When a club has changed its name, the clue uses the current name, so you don’t need
        to remember which era a player came from. Here’s a quick guide to the 18 clubs and the
        names behind them.
      </p>

      {CURRENT_CLUBS.map((c) => (
        <section key={c.name}>
          <h2>{c.name}</h2>
          <p>
            {c.text} <Link href={`/clubs/${c.slug}`}>{c.name} players from past rounds</Link>.
          </p>
        </section>
      ))}

      <h2>Reading a list of clubs</h2>
      <p>
        A long list of clubs usually means a player who was traded or delisted and picked up
        again. Two clubs from the same state often point to a player who moved home. The games
        count and the tier (easy, medium or hard) narrow it down from there. See{" "}
        <Link href="/guides/how-to-solve">how to solve {SITE_NAME} puzzles</Link> for more tips.
      </p>
    </ArticlePage>
  );
}
